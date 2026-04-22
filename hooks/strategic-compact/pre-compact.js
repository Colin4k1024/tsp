#!/usr/bin/env node
// pre-compact.js — PreCompact hook
// JS equivalent of scripts/hooks/pre_compact.py
//
// Called before context compaction. Reads context elements from stdin JSON,
// categorises them into keep / summarize / discard, outputs a compact plan
// as additionalContext.
//
// Input stdin JSON:
// {
//   context_elements: [{ id, type, content, importance }],
//   session_state: { logical_break_detected, specialist_done, specialist_output }
// }
//
// Silent-fail: any error → process.exit(0)

'use strict';

// Elements with these types are ALWAYS kept
const ALWAYS_KEEP = new Set([
  'decision', 'conclusion', 'pending_item', 'task_output',
  'verification_result', 'error_fix', 'adr',
]);

// Elements with these types are discarded when large (> 500 chars)
const DISCARD_WHEN_LARGE = new Set([
  'tool_result', 'search_result', 'exploration_trace', 'duplicate_info',
]);

function getPriority(type) {
  if (ALWAYS_KEEP.has(type))         return 'high';
  if (DISCARD_WHEN_LARGE.has(type))  return 'low';
  return 'medium';
}

function getSummaryInstruction(type, len) {
  if (len > 5000)  return `Summarise to key findings only (${type}). Max 200 chars.`;
  if (len > 1000)  return `Condense ${type} to essential points. Max 100 chars.`;
  return `Summarise ${type}. Keep main conclusion.`;
}

function categorise(elements, logicalBreak, specialistDone) {
  const keep = [], summarize = [], discard = [];
  const summary_instructions = {};

  for (const el of elements) {
    const id         = el.id ?? '';
    const type       = (el.type ?? '').toLowerCase();
    const importance = (el.importance ?? '').toLowerCase();
    const len        = (el.content ?? '').length;

    let priority = getPriority(type);
    if (importance === 'high') priority = 'high';
    if (importance === 'low')  priority = 'low';

    if (specialistDone) {
      if (ALWAYS_KEEP.has(type)) {
        keep.push(id);
      } else if (DISCARD_WHEN_LARGE.has(type)) {
        discard.push(id);
      } else if (priority === 'high') {
        keep.push(id);
      } else if (priority === 'low') {
        discard.push(id);
      } else {
        summarize.push(id);
        summary_instructions[id] = getSummaryInstruction(type, len);
      }
    } else if (logicalBreak) {
      if (['decision', 'conclusion', 'adr', 'pending_item'].includes(type)) {
        keep.push(id);
      } else if (DISCARD_WHEN_LARGE.has(type)) {
        discard.push(id);
      } else {
        summarize.push(id);
        summary_instructions[id] = getSummaryInstruction(type, len);
      }
    } else {
      // Priority-based fallback
      if (priority === 'high') {
        keep.push(id);
      } else if (priority === 'low') {
        if (len > 500) discard.push(id); else keep.push(id);
      } else {
        // medium
        if (len > 2000) {
          summarize.push(id);
          summary_instructions[id] = getSummaryInstruction(type, len);
        } else {
          keep.push(id);
        }
      }
    }
  }

  // Always keep the last 3 elements to preserve recent context
  if (elements.length > 5) {
    for (const el of elements.slice(-3)) {
      const id = el.id ?? '';
      if (!keep.includes(id)) {
        keep.push(id);
        const di = discard.indexOf(id);  if (di !== -1) discard.splice(di, 1);
        const si = summarize.indexOf(id); if (si !== -1) summarize.splice(si, 1);
      }
    }
  }

  return { keep, summarize, discard, summary_instructions };
}

// ─── main ───────────────────────────────────────────────────────────────────

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 8000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    let stdin = {};
    try { stdin = JSON.parse(input || '{}'); } catch (_) { /* ignore parse errors */ }

    const elements      = stdin.context_elements ?? [];
    const sessionState  = stdin.session_state ?? {};
    const logicalBreak  = !!sessionState.logical_break_detected;
    const specialistDone = !!sessionState.specialist_done;

    const contextSize  = parseInt(process.env.CLAUDE_CONTEXT_SIZE  || '0', 10);
    const contextLimit = parseInt(process.env.CLAUDE_CONTEXT_LIMIT || '200000', 10);
    const usageRatio   = contextLimit > 0 ? contextSize / contextLimit : 0;

    const { keep, summarize, discard, summary_instructions } = categorise(elements, logicalBreak, specialistDone);

    const payload = {
      keep,
      summarize,
      discard,
      summary_instructions,
      original_element_count: elements.length,
      after_compact_counts: { keep: keep.length, summarize: summarize.length, discard: discard.length },
      trigger_info: {
        usage_ratio: Math.round(usageRatio * 100),
        trigger_based: logicalBreak || specialistDone,
        logical_break: logicalBreak,
        specialist_done: specialistDone,
      },
    };

    const _msg = `Pre-compact plan: keep ${keep.length}, summarize ${summarize.length}, discard ${discard.length}`;

    const ctx = [
      `## 上下文压缩计划 (strategic-compact)`,
      `- 保留: ${keep.length} 条 | 压缩: ${summarize.length} 条 | 丢弃: ${discard.length} 条`,
      `- 触发源: ${logicalBreak ? 'logical_break' : specialistDone ? 'specialist_done' : 'priority_based'}`,
      `- 上下文使用: ${Math.round(usageRatio * 100)}%`,
    ].join('\n');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreCompact',
        additionalContext: ctx,
      },
      compactPlan: payload,
    }));

  } catch (_) {
    process.exit(0);
  }
});
