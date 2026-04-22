#!/usr/bin/env node
// harness-context-monitor.js — PostToolUse hook (all tools)
// Reads context metrics from the bridge file written by harness-statusline.js
// and injects advisory warnings into agent context when usage is high.
//
// Thresholds (remaining %):
//   WARNING  (remaining <= 35%): agent should wrap up and avoid new complex work
//   CRITICAL (remaining <= 25%): agent should stop and surface to user
//
// Debounce: 5 tool calls between warnings (severity escalation bypasses debounce)
// Bridge file: /tmp/harness-ctx-{session_id}.json

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const WARNING_THRESHOLD = 35;
const CRITICAL_THRESHOLD = 25;
const STALE_SECONDS = 60;
const DEBOUNCE_CALLS = 5;

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 10000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input || '{}');
    const sessionId = data.session_id;
    if (!sessionId) { process.exit(0); }

    // Check project config: allow opt-out via .harness/config.json
    const cwd = data.cwd || process.cwd();
    const configPath = path.join(cwd, '.harness', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (cfg.hooks?.context_warnings === false) { process.exit(0); }
      } catch (_) { /* ignore */ }
    }

    // Read bridge file
    const bridgePath = path.join(os.tmpdir(), `harness-ctx-${sessionId}.json`);
    if (!fs.existsSync(bridgePath)) { process.exit(0); }

    const metrics = JSON.parse(fs.readFileSync(bridgePath, 'utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) { process.exit(0); }

    const remaining = metrics.remaining_percentage;
    const usedPct = metrics.used_pct;
    const activeRole = metrics.active_role || '';

    if (remaining > WARNING_THRESHOLD) { process.exit(0); }

    // Debounce
    const warnPath = path.join(os.tmpdir(), `harness-ctx-${sessionId}-warned.json`);
    let warnData = { callsSinceWarn: 0, lastLevel: null };
    let firstWarn = true;
    if (fs.existsSync(warnPath)) {
      try { warnData = JSON.parse(fs.readFileSync(warnPath, 'utf8')); firstWarn = false; } catch (_) { /* ignore */ }
    }
    warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

    const isCritical = remaining <= CRITICAL_THRESHOLD;
    const currentLevel = isCritical ? 'critical' : 'warning';
    const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';

    if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated) {
      fs.writeFileSync(warnPath, JSON.stringify(warnData));
      process.exit(0);
    }
    warnData.callsSinceWarn = 0;
    warnData.lastLevel = currentLevel;
    fs.writeFileSync(warnPath, JSON.stringify(warnData));

    // Detect if harness team workflow is active
    const isHarnessActive = fs.existsSync(path.join(cwd, '.harness', 'STATE.json'));
    const roleSuffix = activeRole ? ` Current role: ${activeRole}.` : '';

    let message;
    if (isCritical) {
      message = isHarnessActive
        ? `CONTEXT CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%.${roleSuffix} ` +
          'Context is nearly exhausted. Do NOT start new complex work — harness state is tracked in .harness/STATE.json. ' +
          'Inform the user so they can save state and start a new session.'
        : `CONTEXT CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%.${roleSuffix} ` +
          'Context is nearly exhausted. Inform the user and ask how to proceed. Do NOT autonomously save state unless asked.';
    } else {
      message = isHarnessActive
        ? `CONTEXT WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%.${roleSuffix} ` +
          'Context is getting limited. Avoid starting new complex work. ' +
          'Complete the current task step before taking on anything new.'
        : `CONTEXT WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%.${roleSuffix} ` +
          'Be aware that context is getting limited. Avoid unnecessary exploration or starting new complex tasks.';
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: message,
      },
    };
    process.stdout.write(JSON.stringify(output));

  } catch (_) {
    // Silent fail — never block tool execution
    process.exit(0);
  }
});
