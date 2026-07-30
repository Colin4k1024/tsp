#!/usr/bin/env node
/**
 * Grok-compatible cost-tracker hook
 *
 * 跟踪会话成本指标，使用 path-resolver 自动适配 Claude/Grok 路径。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getHomeDir } = require('../path-resolver');

const MAX_STDIN = 1024 * 1024;
let raw = '';

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function estimateCost(model, inputTokens, outputTokens) {
  // Approximate per-1M-token blended rates. Conservative defaults.
  const table = {
    'haiku': { in: 0.8, out: 4.0 },
    'sonnet': { in: 3.0, out: 15.0 },
    'opus': { in: 15.0, out: 75.0 },
  };

  const normalized = String(model || '').toLowerCase();
  let rates = table.sonnet;
  if (normalized.includes('haiku')) rates = table.haiku;
  if (normalized.includes('opus')) rates = table.opus;

  const cost = (inputTokens / 1_000_000) * rates.in + (outputTokens / 1_000_000) * rates.out;
  return Math.round(cost * 1e6) / 1e6;
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (raw.length < MAX_STDIN) {
    const remaining = MAX_STDIN - raw.length;
    raw += chunk.substring(0, remaining);
  }
});

process.stdin.on('end', () => {
  try {
    const input = raw.trim() ? JSON.parse(raw) : {};
    const usage = input.usage || input.token_usage || {};
    const inputTokens = toNumber(usage.input_tokens || usage.prompt_tokens || 0);
    const outputTokens = toNumber(usage.output_tokens || usage.completion_tokens || 0);

    // Grok 官方环境变量: GROK_SESSION_ID, GROK_HOOK_EVENT
    // 模型信息从 stdin JSON 中读取（如可用）
    const model = String(
      input.model ||
      input._cursor?.model ||
      process.env.CLAUDE_MODEL ||
      'unknown'
    );
    const sessionId = String(
      input.sessionId ||
      input.session_id ||
      process.env.GROK_SESSION_ID ||
      process.env.CLAUDE_SESSION_ID ||
      'default'
    );

    const homeDir = getHomeDir();
    const metricsDir = path.join(homeDir, 'metrics');
    fs.mkdirSync(metricsDir, { recursive: true });

    const row = {
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: estimateCost(model, inputTokens, outputTokens),
    };

    fs.appendFileSync(
      path.join(metricsDir, 'costs.jsonl'),
      `${JSON.stringify(row)}\n`,
      'utf8'
    );
  } catch {
    // Keep hook non-blocking.
  }

  // PostToolUse 为被动事件，stdout 被忽略；exit 0 表示成功
  process.exit(0);
});
