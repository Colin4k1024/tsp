'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_CONTEXT_LIMIT = 200000;
const EXTENDED_CONTEXT_LIMIT = 1000000;
const DEFAULT_TAIL_BYTES = 65536;
const EXPANDED_TAIL_BYTES = 262144;

function resolveContextLimit(modelId) {
  const envLimit = Number(process.env.CLAUDE_CONTEXT_LIMIT);
  if (Number.isFinite(envLimit) && envLimit > 0) return envLimit;

  if (typeof modelId === 'string' && /\[1[mM]\]/i.test(modelId)) {
    return EXTENDED_CONTEXT_LIMIT;
  }

  return DEFAULT_CONTEXT_LIMIT;
}

function readTailLines(filePath, tailBytes = DEFAULT_TAIL_BYTES) {
  let fd;
  try {
    const stat = fs.statSync(filePath);
    if (stat.size === 0) return [];

    const readSize = Math.min(tailBytes, stat.size);
    const buffer = Buffer.alloc(readSize);
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, readSize, stat.size - readSize);
    fs.closeSync(fd);
    fd = null;

    const text = buffer.toString('utf8');
    const lines = text.split('\n');

    // Drop the first line if we started mid-file (likely partial)
    if (stat.size > readSize && lines.length > 0) {
      lines.shift();
    }

    return lines.filter(line => line.trim().length > 0);
  } catch (_) {
    if (fd != null) try { fs.closeSync(fd); } catch (__) { /* ignore */ }
    return [];
  }
}

function normalizeUsage(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const inputTokens = Number(raw.input_tokens || raw.prompt_tokens || 0) || 0;
  const outputTokens = Number(raw.output_tokens || raw.completion_tokens || 0) || 0;
  const cacheCreationTokens = Number(raw.cache_creation_input_tokens || raw.cache_creation_prompt_tokens || 0) || 0;
  const cacheReadTokens = Number(raw.cache_read_input_tokens || raw.cache_read_prompt_tokens || raw.cached_tokens || 0) || 0;
  const totalTokens = Number(raw.total_tokens || 0) || 0;

  // CCometixLine's context-window segment treats active context as prompt-side
  // tokens: input + cache creation + cache read. The current turn's output is
  // tracked separately because it becomes prompt-side context on the next turn.
  const promptSideContextTokens = inputTokens + cacheCreationTokens + cacheReadTokens;
  const contextTokens = promptSideContextTokens || totalTokens || (inputTokens + outputTokens);
  if (contextTokens === 0) return null;

  return {
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheReadTokens,
    totalTokens,
    contextTokens,
  };
}

function parseTranscriptUsage(transcriptPath) {
  if (!transcriptPath || typeof transcriptPath !== 'string') return null;
  if (!fs.existsSync(transcriptPath)) return null;

  let lines = readTailLines(transcriptPath, DEFAULT_TAIL_BYTES);

  // Scan from bottom up for the last assistant message with usage
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;

    let entry;
    try {
      entry = JSON.parse(line);
    } catch (_) {
      continue;
    }

    // Handle summary entries — they indicate compaction happened
    if (entry.type === 'summary' && entry.leafUuid) {
      const projectDir = path.dirname(transcriptPath);
      const usage = findUsageByLeafUuid(entry.leafUuid, projectDir);
      if (usage) return usage;
      continue;
    }

    if (entry.type !== 'assistant') continue;
    if (!entry.message || !entry.message.usage) continue;

    return normalizeUsage(entry.message.usage);
  }

  // If not found in default tail, try expanded read
  if (lines.length > 0) {
    lines = readTailLines(transcriptPath, EXPANDED_TAIL_BYTES);
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;

      let entry;
      try {
        entry = JSON.parse(line);
      } catch (_) {
        continue;
      }

      if (entry.type !== 'assistant') continue;
      if (!entry.message || !entry.message.usage) continue;

      return normalizeUsage(entry.message.usage);
    }
  }

  return null;
}

function findUsageByLeafUuid(leafUuid, projectDir) {
  if (!projectDir || !fs.existsSync(projectDir)) return null;

  let sessionFiles;
  try {
    sessionFiles = fs.readdirSync(projectDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => path.join(projectDir, f));
  } catch (_) {
    return null;
  }

  for (const filePath of sessionFiles) {
    const lines = readTailLines(filePath, EXPANDED_TAIL_BYTES);
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;

      let entry;
      try {
        entry = JSON.parse(line);
      } catch (_) {
        continue;
      }

      if (entry.uuid === leafUuid && entry.type === 'assistant' && entry.message?.usage) {
        return normalizeUsage(entry.message.usage);
      }
    }
  }

  return null;
}

function resolveTranscriptMetrics(transcriptPath, modelId) {
  const usage = parseTranscriptUsage(transcriptPath);
  if (!usage) return null;

  const contextLimit = resolveContextLimit(modelId);
  const usagePct = Math.max(0, Math.min(100, Math.round((usage.contextTokens / contextLimit) * 100)));
  const remainingTokens = Math.max(0, contextLimit - usage.contextTokens);
  const remainingPct = Math.max(0, Math.min(100, Math.round((remainingTokens / contextLimit) * 100)));

  return {
    usagePct,
    contextTokens: usage.contextTokens,
    contextLimit,
    remainingTokens,
    remainingPct,
    source: 'transcript_usage',
  };
}

module.exports = {
  resolveContextLimit,
  readTailLines,
  parseTranscriptUsage,
  resolveTranscriptMetrics,
  normalizeUsage,
  DEFAULT_CONTEXT_LIMIT,
  EXTENDED_CONTEXT_LIMIT,
};
