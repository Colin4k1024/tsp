'use strict';

/**
 * blame-attribution.js
 *
 * Maps goal iteration failures to specific code changes using git blame/diff.
 * Produces targeted rework briefs that constrain the next iteration's scope.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const MAX_REWORK_ATTEMPTS = 3;

function parseFailureLocations(failOutput) {
  const locations = [];
  const lines = failOutput.split('\n');

  for (const line of lines) {
    // Match common test failure patterns:
    // "FAIL src/auth/refresh.test.ts"
    // "● Auth > should refresh tokens"
    // "at Object.<anonymous> (src/auth/refresh.ts:23:5)"
    // "src/auth/refresh.ts(23,5): error TS2345"
    const fileLineMatch = line.match(/([a-zA-Z0-9_\-./]+\.[a-z]{1,4})[:(](\d+)/);
    if (fileLineMatch) {
      const filePath = fileLineMatch[1];
      const lineNumber = parseInt(fileLineMatch[2], 10);
      if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
        locations.push({ file: filePath, line: lineNumber, context: line.trim() });
      }
    }

    // Match "FAIL" prefixed paths
    const failMatch = line.match(/FAIL\s+(.+\.[a-z]{1,4})/);
    if (failMatch) {
      locations.push({ file: failMatch[1].trim(), line: null, context: line.trim() });
    }
  }

  // Deduplicate by file
  const seen = new Set();
  return locations.filter(loc => {
    const key = `${loc.file}:${loc.line || 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getChangedFiles(cwd) {
  try {
    const output = execSync('git diff --name-only HEAD 2>/dev/null || git diff --name-only', {
      encoding: 'utf-8',
      cwd,
      timeout: 10000,
    }).trim();
    return output ? output.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getFileDiff(filePath, cwd) {
  try {
    return execSync(`git diff HEAD -- "${filePath}" 2>/dev/null || git diff -- "${filePath}"`, {
      encoding: 'utf-8',
      cwd,
      timeout: 10000,
    }).trim();
  } catch {
    return '';
  }
}

function intersectFailuresWithChanges(failureLocations, changedFiles) {
  return failureLocations.filter(loc => {
    const normalizedFail = loc.file.replace(/^\.\//, '');
    return changedFiles.some(changed => {
      const normalizedChanged = changed.replace(/^\.\//, '');
      return normalizedFail === normalizedChanged ||
             normalizedFail.endsWith(normalizedChanged) ||
             normalizedChanged.endsWith(normalizedFail);
    });
  });
}

function buildReworkBrief(goal, oracleResult, blameResult) {
  const iteration = goal.currentIteration;
  const failingFiles = blameResult.blamedLocations.map(l => l.file);
  const uniqueFiles = [...new Set(failingFiles)];

  const brief = [
    '## REWORK BRIEF',
    '',
    `**Goal:** ${goal.objective}`,
    `**Iteration:** ${iteration} (rework attempt ${blameResult.attemptCount} for this scope)`,
    '',
    '**Failing evidence:**',
    ...blameResult.blamedLocations.map(l =>
      `- ${l.file}${l.line ? ':' + l.line : ''} — ${l.context.slice(0, 100)}`
    ),
    '',
    '**Root cause (blame):**',
    ...blameResult.changedFiles.slice(0, 5).map(f => `- Changed: ${f}`),
    '',
    '**Constraint:**',
    ...uniqueFiles.map(f => `- ONLY modify: ${f}`),
    '- DO NOT touch test files unless they are the source of the bug',
    '- DO NOT expand scope beyond the blamed files',
    '',
  ];

  if (oracleResult.nextHint) {
    brief.push('**Oracle hint:**', oracleResult.nextHint, '');
  }

  return brief.join('\n');
}

function analyzeBlame(goal, oracleResult, cwd) {
  const failOutput = (oracleResult.reasons || []).join('\n') +
    '\n' + (oracleResult.conditionResults || [])
      .filter(r => !r.passed)
      .map(r => r.output)
      .join('\n');

  const failureLocations = parseFailureLocations(failOutput);
  const changedFiles = getChangedFiles(cwd);
  const blamedLocations = intersectFailuresWithChanges(failureLocations, changedFiles);

  // Determine if escalation is needed
  const shouldEscalate = blamedLocations.length === 0 && failureLocations.length > 0;

  return {
    failureLocations,
    changedFiles,
    blamedLocations: blamedLocations.length > 0 ? blamedLocations : failureLocations.slice(0, 5),
    intersection: blamedLocations.length > 0,
    shouldEscalate,
    escalationReason: shouldEscalate ? 'no_blame_intersection' : null,
    attemptCount: 1, // caller should update from tracking store
  };
}

// Rework tracking

function getReworkTrackingPath() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.claude', 'rework-tracking.json');
}

function loadReworkTracking() {
  const trackPath = getReworkTrackingPath();
  if (!fs.existsSync(trackPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(trackPath, 'utf-8'));
  } catch {
    return {};
  }
}

function saveReworkTracking(tracking) {
  const trackPath = getReworkTrackingPath();
  const dir = path.dirname(trackPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(trackPath, JSON.stringify(tracking, null, 2), 'utf-8');
}

function recordReworkAttempt(filePath, outcome) {
  const tracking = loadReworkTracking();
  if (!tracking[filePath]) {
    tracking[filePath] = { attempts: 0, outcomes: [], lastAttempt: null, totalCost: 0 };
  }
  tracking[filePath].attempts += 1;
  tracking[filePath].outcomes.push(outcome);
  tracking[filePath].lastAttempt = new Date().toISOString();
  saveReworkTracking(tracking);
  return tracking[filePath];
}

function shouldEscalateFile(filePath) {
  const tracking = loadReworkTracking();
  const record = tracking[filePath];
  if (!record) return false;
  return record.attempts >= MAX_REWORK_ATTEMPTS;
}

function getPersistentTroubleSpots() {
  const tracking = loadReworkTracking();
  return Object.entries(tracking)
    .filter(([, record]) => record.attempts >= MAX_REWORK_ATTEMPTS)
    .map(([file, record]) => ({ file, ...record }));
}

module.exports = {
  MAX_REWORK_ATTEMPTS,
  parseFailureLocations,
  getChangedFiles,
  getFileDiff,
  intersectFailuresWithChanges,
  buildReworkBrief,
  analyzeBlame,
  loadReworkTracking,
  saveReworkTracking,
  recordReworkAttempt,
  shouldEscalateFile,
  getPersistentTroubleSpots,
};
