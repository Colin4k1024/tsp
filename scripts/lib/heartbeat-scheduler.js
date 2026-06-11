'use strict';

/**
 * heartbeat-scheduler.js
 *
 * Heartbeat engine for Loop Engineering.
 * Runs configured discovery scans on a schedule, classifies results,
 * and routes findings to goals or triage inbox.
 *
 * This module provides the logic; scheduling is handled by CronCreate/CronDelete
 * or ScheduleWakeup in the Claude Code runtime.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require ? undefined : undefined; // yaml parsing fallback below

const { createGoal, saveGoal } = require('./completion-oracle');

const DEFAULT_CONFIG = {
  interval: '30m',
  scans: [],
  budget: {
    maxDollarsPerHour: 2.0,
    pauseOnExhaust: true,
  },
};

const SCAN_ACTIONS = {
  autoGoal: 'auto-goal',
  triage: 'triage',
  notify: 'notify',
  ignore: 'ignore',
};

// Simple YAML parser for heartbeat config (avoids external dependency)
function parseSimpleYaml(content) {
  try {
    // Try JSON first (YAML superset)
    return JSON.parse(content);
  } catch {
    // Minimal YAML parsing for heartbeat.yaml structure
    const lines = content.split('\n');
    const result = { heartbeat: { scans: [], budget: {} } };
    let currentScan = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indentLevel = line.search(/\S/);

      if (trimmed.startsWith('interval:')) {
        result.heartbeat.interval = trimmed.split(':')[1].trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('maxDollarsPerHour:')) {
        result.heartbeat.budget.maxDollarsPerHour = parseFloat(trimmed.split(':')[1].trim());
      } else if (trimmed.startsWith('pauseOnExhaust:')) {
        result.heartbeat.budget.pauseOnExhaust = trimmed.split(':')[1].trim() === 'true';
      } else if (trimmed.startsWith('- name:')) {
        if (currentScan) result.heartbeat.scans.push(currentScan);
        currentScan = { name: trimmed.replace('- name:', '').trim().replace(/['"]/g, '') };
      } else if (currentScan && indentLevel >= 6) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim().replace(/['"]/g, '');
        if (key === 'command') currentScan.command = value;
        else if (key === 'onFailure') currentScan.onFailure = value;
        else if (key === 'threshold') currentScan.threshold = parseFloat(value);
        else if (key === 'description') currentScan.description = value;
      }
    }
    if (currentScan) result.heartbeat.scans.push(currentScan);
    return result;
  }
}

function loadConfig(projectRoot) {
  const configPath = path.join(projectRoot || process.cwd(), '.claude', 'heartbeat.yaml');
  if (!fs.existsSync(configPath)) return DEFAULT_CONFIG;

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = parseSimpleYaml(content);
    return { ...DEFAULT_CONFIG, ...parsed.heartbeat };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function runScan(scan) {
  const startTime = Date.now();
  try {
    const output = execSync(scan.command, {
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    let passed = true;

    if (scan.threshold !== undefined) {
      const numeric = parseInt(output.match(/\d+/)?.[0] || '0', 10);
      passed = numeric <= scan.threshold;
    } else {
      const exitMatch = output.match(/EXIT:(\d+)$/);
      passed = exitMatch ? exitMatch[1] === '0' : true;
    }

    return {
      name: scan.name,
      passed,
      output: output.slice(0, 500),
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: scan.name,
      passed: false,
      output: (error.stderr || error.message || 'Unknown error').slice(0, 500),
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

function classifyResult(scan, result) {
  if (result.passed) return { action: 'pass', scan, result };
  return {
    action: scan.onFailure || SCAN_ACTIONS.triage,
    scan,
    result,
  };
}

function createTriageItem(scan, result) {
  return {
    id: `triage-${Date.now().toString(36)}`,
    source: `heartbeat:${scan.name}`,
    severity: scan.onFailure === SCAN_ACTIONS.autoGoal ? 'high' : 'medium',
    summary: `${scan.description || scan.name}: ${result.output.slice(0, 100)}`,
    detail: result.output,
    suggestedActions: ['Create goal to fix', 'Ignore for now', 'Defer to next session'],
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
}

function appendToTriageInbox(item) {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const inboxDir = path.join(home, '.claude', 'triage');
  if (!fs.existsSync(inboxDir)) {
    fs.mkdirSync(inboxDir, { recursive: true });
  }
  const inboxPath = path.join(inboxDir, 'inbox.jsonl');
  fs.appendFileSync(inboxPath, JSON.stringify(item) + '\n', 'utf-8');
  return inboxPath;
}

function createGoalFromScanFailure(scan, result) {
  const objective = `Fix ${scan.description || scan.name}: ${result.output.slice(0, 80)}`;

  const stoppingConditions = [{
    type: 'custom_command',
    command: scan.command,
    description: scan.description || scan.name,
  }];

  if (scan.threshold !== undefined) {
    stoppingConditions[0].threshold = scan.threshold;
  }

  const goal = createGoal(objective, { stoppingConditions });
  saveGoal(goal);
  return goal;
}

function runHeartbeat(projectRoot) {
  const config = loadConfig(projectRoot);

  if (config.scans.length === 0) {
    return {
      status: 'no_scans',
      message: 'No scans configured in .claude/heartbeat.yaml',
      results: [],
    };
  }

  const results = config.scans.map(scan => {
    const result = runScan(scan);
    const classified = classifyResult(scan, result);

    if (classified.action === SCAN_ACTIONS.autoGoal) {
      const goal = createGoalFromScanFailure(scan, result);
      classified.goalId = goal.goalId;
    } else if (classified.action === SCAN_ACTIONS.triage) {
      const item = createTriageItem(scan, result);
      appendToTriageInbox(item);
      classified.triageId = item.id;
    }

    return classified;
  });

  const passed = results.filter(r => r.action === 'pass').length;
  const failed = results.length - passed;

  return {
    status: failed > 0 ? 'issues_found' : 'all_clear',
    timestamp: new Date().toISOString(),
    summary: `${passed}/${results.length} scans passed`,
    results,
  };
}

function getHeartbeatStatus(projectRoot) {
  const config = loadConfig(projectRoot);

  const home = process.env.HOME || process.env.USERPROFILE || '';
  const lastRunPath = path.join(home, '.claude', 'heartbeat-last-run.json');
  let lastRun = null;
  if (fs.existsSync(lastRunPath)) {
    try {
      lastRun = JSON.parse(fs.readFileSync(lastRunPath, 'utf-8'));
    } catch { /* ignore */ }
  }

  return {
    configured: config.scans.length > 0,
    interval: config.interval,
    scanCount: config.scans.length,
    scans: config.scans.map(s => ({ name: s.name, onFailure: s.onFailure, description: s.description })),
    budget: config.budget,
    lastRun,
  };
}

function saveLastRun(result) {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const lastRunPath = path.join(home, '.claude', 'heartbeat-last-run.json');
  const dir = path.dirname(lastRunPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lastRunPath, JSON.stringify(result, null, 2), 'utf-8');
}

function parseInterval(interval) {
  const match = (interval || '30m').match(/^(\d+)(m|h)$/);
  if (!match) return 30 * 60;
  const value = parseInt(match[1], 10);
  return match[2] === 'h' ? value * 60 * 60 : value * 60;
}

module.exports = {
  SCAN_ACTIONS,
  loadConfig,
  runScan,
  classifyResult,
  createTriageItem,
  appendToTriageInbox,
  createGoalFromScanFailure,
  runHeartbeat,
  getHeartbeatStatus,
  saveLastRun,
  parseInterval,
};
