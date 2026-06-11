#!/usr/bin/env node
/**
 * Strategic Compact Suggester
 *
 * Suggests `/compact` from real context pressure instead of tool-call count.
 * Supports direct hook execution and run-with-flags.js require() mode.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const AUTO_COMPACT_BUFFER_PCT = 16.5;
const DEFAULT_CONTEXT_LIMIT = 200000;
const DEFAULT_DEBOUNCE_CALLS = 8;
const STALE_BRIDGE_SECONDS = 120;

const URGENCY = [
  [95, 'critical'],
  [85, 'high'],
  [70, 'medium'],
  [65, 'advisory'],
  [0, 'low'],
];

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function clampPct(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeRemainingToUsed(remainingPct) {
  const usableRemaining = Math.max(
    0,
    ((remainingPct - AUTO_COMPACT_BUFFER_PCT) / (100 - AUTO_COMPACT_BUFFER_PCT)) * 100
  );
  return clampPct(100 - usableRemaining);
}

function getUrgency(usagePct) {
  for (const [threshold, label] of URGENCY) {
    if (usagePct >= threshold) return label;
  }
  return 'low';
}

function getHookEventName(data) {
  const event = data.hook_event_name || data.hookEventName || data.event;
  return typeof event === 'string' && event.trim() ? event.trim() : 'PreToolUse';
}

function sessionKey(data) {
  const raw = data.session_id || process.env.CLAUDE_SESSION_ID;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(-64) || 'default';
  }

  // Use PID + cwd hash to differentiate sessions in the same directory
  const pidKey = `pid-${process.pid}`;
  const cwd = data.cwd || process.cwd();
  const cwdHash = crypto.createHash('sha256').update(String(cwd)).digest('hex').slice(0, 16);
  return `${pidKey}-${cwdHash}`;
}

function readBridgeMetrics(sessionId) {
  if (!sessionId) return null;

  const bridgePath = path.join(os.tmpdir(), `harness-ctx-${sessionId}.json`);
  if (!fs.existsSync(bridgePath)) return null;

  try {
    const bridge = JSON.parse(fs.readFileSync(bridgePath, 'utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (bridge.timestamp && now - bridge.timestamp > STALE_BRIDGE_SECONDS) return null;

    const usagePct = toNumber(bridge.used_pct);
    const remainingPct = toNumber(bridge.remaining_percentage);
    if (usagePct == null && remainingPct == null) return null;

    return {
      usagePct: usagePct != null ? clampPct(usagePct) : normalizeRemainingToUsed(remainingPct),
      remainingPct,
      source: 'bridge',
    };
  } catch (_) {
    return null;
  }
}

function resolveContextMetrics(data) {
  const contextLimit = toNumber(process.env.CLAUDE_CONTEXT_LIMIT) || DEFAULT_CONTEXT_LIMIT;
  let cw = {};
  if (data.context_window && typeof data.context_window === 'object') {
    cw = data.context_window;
  } else if (data.context_window != null) {
    // Malformed: context_window is present but not an object.
    // Attempt to extract a numeric value (some Claude Code versions
    // may pass context_size as a bare number).
    const numericValue = toNumber(data.context_window);
    if (numericValue != null && numericValue > 0) {
      const usagePct = clampPct((numericValue / contextLimit) * 100);
      return {
        usagePct,
        remainingPct: null,
        contextLimit,
        contextSize: numericValue,
        source: 'stdin.context_window_raw',
      };
    }
    if (process.env.STRATEGIC_COMPACT_DEBUG === '1') {
      process.stderr.write(
        `[strategic-compact] context_window is ${typeof data.context_window}: ${JSON.stringify(data.context_window).slice(0, 100)}\n`
      );
    }
  }

  const stdinUsed = toNumber(cw.used_percentage);
  if (stdinUsed != null) {
    const usagePct = clampPct(stdinUsed);
    return {
      usagePct,
      remainingPct: toNumber(cw.remaining_percentage),
      contextLimit,
      contextSize: Math.round((usagePct / 100) * contextLimit),
      source: 'stdin.used_percentage',
    };
  }

  const stdinRemaining = toNumber(cw.remaining_percentage);
  if (stdinRemaining != null) {
    const usagePct = normalizeRemainingToUsed(stdinRemaining);
    return {
      usagePct,
      remainingPct: clampPct(stdinRemaining),
      contextLimit,
      contextSize: Math.round((usagePct / 100) * contextLimit),
      source: 'stdin.remaining_percentage',
    };
  }

  const envSize = toNumber(process.env.CLAUDE_CONTEXT_SIZE);
  if (envSize != null && envSize > 0) {
    const usagePct = clampPct((envSize / contextLimit) * 100);
    return {
      usagePct,
      remainingPct: null,
      contextLimit,
      contextSize: envSize,
      source: 'env',
    };
  }

  const bridge = readBridgeMetrics(sessionKey(data));
  if (bridge) {
    return {
      ...bridge,
      contextLimit,
      contextSize: Math.round((bridge.usagePct / 100) * contextLimit),
    };
  }

  return null;
}

function buildSuggestions(usagePct, contextSize) {
  const suggestions = [];
  let savings = 0;

  if (usagePct >= 85) {
    const saved = Math.round(contextSize * 0.15);
    suggestions.push({
      action: 'summarize',
      target: 'early conversation history',
      reason: 'Preserve decisions and pending work, compress exploration traces',
      estimated_tokens_saved: saved,
    });
    savings += saved;
  }

  if (usagePct >= 70) {
    const saved = Math.round(contextSize * 0.10);
    suggestions.push({
      action: 'discard',
      target: 'large tool outputs and search traces',
      reason: 'Keep file paths and conclusions, drop bulky intermediate output',
      estimated_tokens_saved: saved,
    });
    savings += saved;
  }

  if (usagePct >= 70) {
    const saved = Math.round(contextSize * 0.08);
    suggestions.push({
      action: 'reorganize',
      target: 'role and specialist outputs',
      reason: 'Move decisions, handoff state, and validation results into the compact summary',
      estimated_tokens_saved: saved,
    });
    savings += saved;
  }

  return { suggestions, savings };
}

function buildReorganizationPlan(urgency) {
  return {
    phase_1: {
      action: 'capture_decisions',
      description: 'Keep decisions, constraints, current branch, changed files, and validation results.',
    },
    phase_2: {
      action: 'capture_next_steps',
      description: 'Keep active task, pending todos, blockers, and the next command to run.',
    },
    phase_3: {
      action: 'compress_history',
      description: 'Summarize early exploration and long tool outputs to conclusions plus file paths.',
    },
    phase_4: {
      action: urgency === 'critical' ? 'compact_now' : 'compact_at_logical_break',
      description: urgency === 'critical'
        ? 'Stop broad work and ask the user to run /compact now.'
        : 'Finish the current small step, then run /compact before more exploration.',
    },
  };
}

function shouldEmit(sessionId, urgency, usagePct) {
  if (process.env.STRATEGIC_COMPACT_DISABLE_DEBOUNCE === '1') return true;
  if (!sessionId) return true;

  const debounceCalls =
    toNumber(process.env.STRATEGIC_COMPACT_DEBOUNCE_CALLS) || DEFAULT_DEBOUNCE_CALLS;
  const statePath = path.join(os.tmpdir(), `harness-strategic-compact-${sessionId}.json`);

  try {
    let previous = null;
    if (fs.existsSync(statePath)) {
      previous = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }

    const callsSinceEmit = (previous?.callsSinceEmit || 0) + 1;
    const severityOrder = { low: 0, advisory: 1, medium: 2, high: 3, critical: 4 };
    const escalated = severityOrder[urgency] > severityOrder[previous?.lastUrgency || 'low'];
    const usageJumped = usagePct - (previous?.lastUsagePct || 0) >= 8;
    const repeatDue = callsSinceEmit >= debounceCalls;

    if (!previous || escalated || usageJumped || repeatDue) {
      fs.writeFileSync(statePath, JSON.stringify({
        lastUrgency: urgency,
        lastUsagePct: usagePct,
        callsSinceEmit: 0,
        updatedAt: new Date().toISOString(),
      }));
      return true;
    }

    // Only write if callsSinceEmit actually changed
    if (callsSinceEmit > 1) {
      fs.writeFileSync(statePath, JSON.stringify({
        lastUrgency: previous.lastUrgency || urgency,
        lastUsagePct: previous.lastUsagePct || usagePct,
        callsSinceEmit,
        updatedAt: new Date().toISOString(),
      }));
    }

    if (process.env.STRATEGIC_COMPACT_DEBUG === '1') {
      process.stderr.write(
        `[strategic-compact] debounce suppressed: callsSinceEmit=${callsSinceEmit}, ` +
        `urgency=${urgency}, lastUrgency=${previous?.lastUrgency}\n`
      );
    }

    return false;
  } catch (_) {
    return true;
  }
}

function buildContextMessage({ usagePct, remainingPct, urgency, savings, suggestions, source }) {
  const remainingPart = remainingPct == null ? '' : ` | remaining: ${clampPct(remainingPct)}%`;
  const actionByUrgency = {
    advisory: 'Context usage is approaching the compaction threshold. Be mindful of context budget; avoid starting large new explorations.',
    medium: 'Finish the current small step, then run `/compact` before more broad reading or implementation.',
    high: 'Stop new exploration, preserve decisions/todos/validation results, and ask the user to run `/compact`.',
    critical: 'Context is nearly exhausted. Do not start new tool chains; ask the user to run `/compact` now.',
  };

  return [
    '## Strategic Compact Triggered',
    `- Context usage: ${usagePct}%${remainingPart} | urgency: ${urgency} | source: ${source}`,
    `- Action: ${actionByUrgency[urgency] || actionByUrgency.medium}`,
    `- Estimated savings: ~${savings} tokens`,
    ...suggestions.map(item => `- ${item.action}: ${item.target} - ${item.reason}`),
  ].join('\n');
}

function buildHookOutput(rawInput) {
  let data = {};
  try {
    data = JSON.parse(rawInput || '{}');
  } catch (_) {
    if (process.env.STRATEGIC_COMPACT_DEBUG === '1') {
      process.stderr.write('[strategic-compact] failed to parse stdin JSON\n');
    }
    return null;
  }

  const metrics = resolveContextMetrics(data);
  if (!metrics) {
    if (process.env.STRATEGIC_COMPACT_DEBUG === '1') {
      const sessionId = sessionKey(data);
      const bridgePath = path.join(os.tmpdir(), `harness-ctx-${sessionId}.json`);
      const bridgeExists = fs.existsSync(bridgePath);
      process.stderr.write(
        `[strategic-compact] no metrics available. ` +
        `context_window=${JSON.stringify(data.context_window || 'missing')}, ` +
        `session=${sessionId}, bridge_exists=${bridgeExists}, ` +
        `env_size=${process.env.CLAUDE_CONTEXT_SIZE || 'unset'}, ` +
        `env_limit=${process.env.CLAUDE_CONTEXT_LIMIT || 'unset'}\n`
      );
    }
    return null;
  }

  const urgency = getUrgency(metrics.usagePct);
  if (urgency === 'low') {
    if (process.env.STRATEGIC_COMPACT_DEBUG === '1') {
      process.stderr.write(
        `[strategic-compact] below threshold: ${metrics.usagePct}% (source: ${metrics.source})\n`
      );
    }
    return null;
  }

  const sessionId = sessionKey(data);
  if (!shouldEmit(sessionId, urgency, metrics.usagePct)) return null;

  const { suggestions, savings } = buildSuggestions(metrics.usagePct, metrics.contextSize);
  const reorganizationPlan = buildReorganizationPlan(urgency);
  const hookEventName = getHookEventName(data);
  const additionalContext = buildContextMessage({
    usagePct: metrics.usagePct,
    remainingPct: metrics.remainingPct,
    urgency,
    savings,
    suggestions,
    source: metrics.source,
  });

  return {
    hookSpecificOutput: {
      hookEventName,
      additionalContext,
    },
    compactSuggestion: {
      should_compact: true,
      urgency,
      context_usage_ratio: metrics.usagePct,
      context_source: metrics.source,
      estimated_token_savings: savings,
      suggestions,
      reorganization_plan: reorganizationPlan,
    },
  };
}

function run(rawInput) {
  const output = buildHookOutput(rawInput);
  if (!output) return { exitCode: 0 };
  return { stdout: JSON.stringify(output), exitCode: 0 };
}

function main() {
  let input = '';
  const stdinTimeout = setTimeout(() => process.exit(0), 8000);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    clearTimeout(stdinTimeout);
    try {
      const output = buildHookOutput(input);
      if (output) process.stdout.write(JSON.stringify(output));
    } catch (_) {
      process.exit(0);
    }
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  run,
  buildHookOutput,
  resolveContextMetrics,
  normalizeRemainingToUsed,
};
