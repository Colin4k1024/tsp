#!/usr/bin/env node
// harness-statusline.js — PreToolUse hook (all tools)
// Team Skills Platform status line: shows active role, current task, context usage.
// Also writes context metrics to a bridge file so harness-context-monitor.js
// can inject advisory warnings into the agent's context.
//
// Output format:
//   [role] task | dir | ██████░░░░ 62%
//
// Bridge file: /tmp/harness-ctx-{session_id}.json
//   { session_id, remaining_percentage, used_pct, role, timestamp }

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// Autocompact buffer ~16.5% — GSD pattern, normalize to usable context
const AUTO_COMPACT_BUFFER_PCT = 16.5;

let input = '';
// Guard: if stdin stalls (Windows/pipe issues), exit silently
const stdinTimeout = setTimeout(() => process.exit(0), 5000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input || '{}');
    const session = data.session_id || '';
    const model = data.model?.display_name || 'Claude';
    const dir = data.cwd || data.workspace?.current_dir || process.cwd();
    const remaining = data.context_window?.remaining_percentage;

    // --- Resolve active role from harness state file ---
    const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
    const projectDir = process.env.CLAUDE_PROJECT_DIR || dir;
    let activeRole = '';
    // Try .harness/STATE.json in project dir
    const stateFile = path.join(projectDir, '.harness', 'STATE.json');
    if (fs.existsSync(stateFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        activeRole = state.active_role || state.role || '';
      } catch (_) { /* ignore */ }
    }

    // --- Context window metrics ---
    let ctxBar = '';
    let usedPct = null;
    if (remaining != null) {
      const usableRemaining = Math.max(0, ((remaining - AUTO_COMPACT_BUFFER_PCT) / (100 - AUTO_COMPACT_BUFFER_PCT)) * 100);
      usedPct = Math.max(0, Math.min(100, Math.round(100 - usableRemaining)));
    } else if (data.transcript_path) {
      // Parse actual token usage from transcript JSONL (CCometixLine approach)
      try {
        const { resolveTranscriptMetrics } = require('../scripts/lib/transcript-usage');
        const modelId = (data.model && data.model.id) || process.env.CLAUDE_MODEL || null;
        const metrics = resolveTranscriptMetrics(data.transcript_path, modelId);
        if (metrics) {
          usedPct = Math.max(0, Math.min(100, Math.round(metrics.usagePct)));
        }
      } catch (_) { /* ignore */ }

      // Final fallback: file size estimate
      if (usedPct == null) {
        try {
          const stat = fs.statSync(data.transcript_path);
          const estimatedTokens = Math.round(stat.size * 0.25);
          if (estimatedTokens > 0) {
            usedPct = Math.max(0, Math.min(100, Math.round((estimatedTokens / 200000) * 100)));
          }
        } catch (_) { /* ignore */ }
      }
    }

    // Write bridge file for downstream hooks (suggest-compact, context-monitor)
    if (usedPct != null && session) {
      try {
        const bridgePath = path.join(os.tmpdir(), `harness-ctx-${session}.json`);
        fs.writeFileSync(bridgePath, JSON.stringify({
          session_id: session,
          remaining_percentage: remaining != null ? remaining : null,
          used_pct: usedPct,
          active_role: activeRole,
          timestamp: Math.floor(Date.now() / 1000),
        }));
      } catch (_) { /* ignore */ }
    }

    // Build progress bar (10 segments)
    if (usedPct != null) {
      const filled = Math.floor(usedPct / 10);
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
      if (usedPct < 50) {
        ctxBar = ` \x1b[32m${bar} ${usedPct}%\x1b[0m`;
      } else if (usedPct < 65) {
        ctxBar = ` \x1b[33m${bar} ${usedPct}%\x1b[0m`;
      } else if (usedPct < 80) {
        ctxBar = ` \x1b[38;5;208m${bar} ${usedPct}%\x1b[0m`;
      } else {
        ctxBar = ` \x1b[5;31m💀 ${bar} ${usedPct}%\x1b[0m`;
      }
    }

    // --- Current task from todos ---
    let task = '';
    const todosDir = path.join(claudeDir, 'todos');
    if (session && fs.existsSync(todosDir)) {
      try {
        const files = fs.readdirSync(todosDir)
          .filter(f => f.startsWith(session) && f.includes('-agent-') && f.endsWith('.json'))
          .map(f => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
          .sort((a, b) => b.mtime - a.mtime);
        if (files.length > 0) {
          const todos = JSON.parse(fs.readFileSync(path.join(todosDir, files[0].name), 'utf8'));
          const inProgress = todos.find(t => t.status === 'in_progress');
          if (inProgress) task = inProgress.activeForm || inProgress.title || '';
        }
      } catch (_) { /* ignore */ }
    }

    // --- Compose status line ---
    const dirname = path.basename(dir);
    const rolePart = activeRole ? `\x1b[36m[${activeRole}]\x1b[0m ` : '';
    const taskPart = task ? `\x1b[1m${task}\x1b[0m │ ` : '';
    process.stdout.write(
      `${rolePart}${taskPart}\x1b[2m${model}\x1b[0m │ \x1b[2m${dirname}\x1b[0m${ctxBar}`
    );

  } catch (_) {
    // Silent fail — never interrupt tool execution
  }
});
