#!/usr/bin/env node
// suggest-compact.js — SuggestCompact hook
// JS equivalent of scripts/hooks/suggest_compact.py
//
// Called when context is getting large. Analyses usage ratio and outputs
// compact suggestions + reorganisation plan.
//
// Reads context metrics from:
//   1. stdin JSON ({ context_window: { used_percentage, remaining_percentage } })
//   2. env vars  (CLAUDE_CONTEXT_SIZE, CLAUDE_CONTEXT_LIMIT)
//   3. bridge file /tmp/harness-ctx-{session_id}.json (written by harness-statusline.js)
//
// Silent-fail: any error → process.exit(0)

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Urgency thresholds (context usage %)
const URGENCY = [
  [95, 'critical'],
  [85, 'high'],
  [70, 'medium'],
  [ 0, 'low'],
];

function getUrgency(usagePct) {
  for (const [threshold, label] of URGENCY) {
    if (usagePct > threshold) return label;
  }
  return 'low';
}

function buildSuggestions(usagePct, contextSize) {
  const suggestions = [];
  let savings = 0;

  if (usagePct > 85) {
    const s = Math.round(contextSize * 0.15);
    suggestions.push({
      action: 'summarize',
      target: 'early conversation history',
      reason: 'Preserve decisions and conclusions, compress exploration traces',
      estimated_tokens_saved: s,
    });
    savings += s;
  }

  if (usagePct > 70) {
    const s = Math.round(contextSize * 0.10);
    suggestions.push({
      action: 'discard',
      target: 'tool results and search outputs',
      reason: 'These are reference-only, not critical for continuity',
      estimated_tokens_saved: s,
    });
    savings += s;
  }

  if (usagePct > 60) {
    const s = Math.round(contextSize * 0.08);
    suggestions.push({
      action: 'reorganize',
      target: 'specialist outputs',
      reason: 'Move key conclusions to session summary, keep full outputs in memory store',
      estimated_tokens_saved: s,
    });
    savings += s;
  }

  return { suggestions, savings };
}

function buildReorganizationPlan() {
  return {
    phase_1: {
      action: 'save_decisions_to_memory',
      description: 'Extract all decisions and save to ~/.claude/memory/error_experience/decisions/',
    },
    phase_2: {
      action: 'save_pending_items',
      description: 'Extract pending items and next hints to session summary',
    },
    phase_3: {
      action: 'compress_conversation',
      description: 'Keep system prompts and last 20 exchanges, summarize middle',
    },
    phase_4: {
      action: 'compact_tool_results',
      description: 'Replace long tool outputs with summaries: [File X read, Y lines]',
    },
  };
}

// ─── main ───────────────────────────────────────────────────────────────────

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 8000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    let data = {};
    try { data = JSON.parse(input || '{}'); } catch (_) { /* ignore */ }

    const sessionId = data.session_id || '';

    // ── Resolve context metrics (3 sources, first wins) ──
    let usagePct  = null;
    let contextSize  = 0;
    let contextLimit = 200000;

    // Source 1: stdin context_window
    const cw = data.context_window;
    if (cw && cw.used_percentage != null) {
      usagePct  = cw.used_percentage;
      contextSize = Math.round((usagePct / 100) * contextLimit);
    }

    // Source 2: env vars
    if (usagePct == null) {
      const envSize  = parseInt(process.env.CLAUDE_CONTEXT_SIZE  || '0', 10);
      const envLimit = parseInt(process.env.CLAUDE_CONTEXT_LIMIT || '200000', 10);
      if (envSize > 0) {
        contextSize  = envSize;
        contextLimit = envLimit;
        usagePct     = Math.round((envSize / envLimit) * 100);
      }
    }

    // Source 3: bridge file from harness-statusline.js
    if (usagePct == null && sessionId) {
      const bridgePath = path.join(os.tmpdir(), `harness-ctx-${sessionId}.json`);
      if (fs.existsSync(bridgePath)) {
        try {
          const bridge = JSON.parse(fs.readFileSync(bridgePath, 'utf8'));
          usagePct  = bridge.used_pct ?? null;
          contextSize = usagePct != null ? Math.round((usagePct / 100) * contextLimit) : 0;
        } catch (_) { /* ignore */ }
      }
    }

    if (usagePct == null) {
      process.exit(0); // No metrics available — nothing to suggest
    }

    const urgency       = getUrgency(usagePct);
    const shouldCompact = usagePct > 70;

    const { suggestions, savings } = buildSuggestions(usagePct, contextSize);
    const reorganizationPlan = shouldCompact ? buildReorganizationPlan() : null;

    const payload = {
      should_compact: shouldCompact,
      urgency,
      context_usage_ratio: usagePct,
      estimated_token_savings: savings,
      suggestions,
      reorganization_plan: reorganizationPlan,
    };

    const _msg = `Compact suggestion: ${urgency} urgency, ~${savings} tokens could be saved`;

    // Build context advisory (only inject if compact is warranted)
    if (!shouldCompact) {
      process.exit(0);
    }

    const urgencyEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[urgency] ?? '⚪';
    const ctx = [
      `## 上下文压缩建议 ${urgencyEmoji} (strategic-compact)`,
      `- 使用率: ${usagePct}% | 紧迫度: ${urgency} | 可节省: ~${savings} tokens`,
      ...suggestions.map(s => `- [${s.action}] ${s.target}: ${s.reason}`),
    ].join('\n');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SuggestCompact',
        additionalContext: ctx,
      },
      compactSuggestion: payload,
    }));

  } catch (_) {
    process.exit(0);
  }
});
