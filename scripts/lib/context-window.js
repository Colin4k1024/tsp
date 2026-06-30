'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { resolveTranscriptMetrics, resolveContextLimit } = require('./transcript-usage');
const { getSessionCompactCount, resolveSessionId } = require('./context-window-state');

const AUTO_COMPACT_BUFFER_PCT = 16.5;
const STALE_BRIDGE_SECONDS = 120;

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

function firstNumber(object, keys) {
  if (!object || typeof object !== 'object') return null;
  for (const key of keys) {
    const value = toNumber(object[key]);
    if (value != null) return value;
  }
  return null;
}

function modelIdFromInput(data = {}) {
  return data.model?.id || data.model?.name || process.env.CLAUDE_MODEL || null;
}

function contextLimitFrom(data, candidate) {
  return (
    firstNumber(candidate, ['context_limit', 'contextLimit', 'limit', 'model_context_window']) ||
    firstNumber(data, ['context_limit', 'contextLimit']) ||
    resolveContextLimit(modelIdFromInput(data))
  );
}

function metricFromCandidate(data, candidate, source) {
  if (!candidate || typeof candidate !== 'object') return null;

  const contextLimit = contextLimitFrom(data, candidate);
  let remainingPct = firstNumber(candidate, [
    'remaining_percentage',
    'remainingPercentage',
    'remaining_pct',
    'remainingPct',
    'remaining_percent',
  ]);
  let usagePct = firstNumber(candidate, [
    'used_percentage',
    'usedPercentage',
    'used_pct',
    'usedPct',
    'usagePct',
    'usage_percentage',
  ]);
  let remainingTokens = firstNumber(candidate, [
    'remaining_tokens',
    'remainingTokens',
    'available_tokens',
    'availableTokens',
  ]);
  let contextTokens = firstNumber(candidate, [
    'context_tokens',
    'contextTokens',
    'used_tokens',
    'usedTokens',
  ]);

  if (remainingPct == null && remainingTokens != null && contextLimit > 0) {
    remainingPct = (remainingTokens / contextLimit) * 100;
  }
  if (remainingTokens == null && remainingPct != null && contextLimit > 0) {
    remainingTokens = Math.max(0, Math.round((remainingPct / 100) * contextLimit));
  }
  if (usagePct == null && remainingPct != null) {
    usagePct = normalizeRemainingToUsed(remainingPct);
  }
  if (remainingPct == null && usagePct != null) {
    remainingPct = clampPct(100 - usagePct);
  }
  if (contextTokens == null && remainingTokens != null && contextLimit > 0) {
    contextTokens = Math.max(0, contextLimit - remainingTokens);
  }
  if (contextTokens == null && usagePct != null && contextLimit > 0) {
    contextTokens = Math.round((usagePct / 100) * contextLimit);
  }

  if (usagePct == null && contextTokens == null && remainingPct == null) return null;

  return {
    usagePct: usagePct != null ? clampPct(usagePct) : clampPct((contextTokens / contextLimit) * 100),
    remainingPct: remainingPct != null ? clampPct(remainingPct) : null,
    remainingTokens: remainingTokens != null ? Math.max(0, Math.round(remainingTokens)) : null,
    contextLimit,
    contextSize: contextTokens != null ? Math.max(0, Math.round(contextTokens)) : 0,
    source,
  };
}

function readJsonEnv(names) {
  for (const name of names) {
    const raw = process.env[name];
    if (!raw) continue;
    try {
      return { name, value: JSON.parse(raw) };
    } catch (_) {
      continue;
    }
  }
  return null;
}

function readJsonFileEnv(names) {
  for (const name of names) {
    const filePath = process.env[name];
    if (!filePath) continue;
    try {
      return { name, value: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
    } catch (_) {
      continue;
    }
  }
  return null;
}

function explicitFrameworkCandidates(data = {}) {
  const candidates = [];
  const envJson = readJsonEnv(['TSP_CONTEXT_WINDOW_JSON', 'CCOMETIXLINE_CONTEXT_JSON']);
  if (envJson) candidates.push([envJson.value, `env.${envJson.name}`]);

  const fileJson = readJsonFileEnv(['TSP_CONTEXT_WINDOW_FILE', 'CCOMETIXLINE_CONTEXT_FILE']);
  if (fileJson) candidates.push([fileJson.value, `file.${fileJson.name}`]);

  if (data.ccometixline?.context_window) candidates.push([data.ccometixline.context_window, 'stdin.ccometixline.context_window']);
  if (data.ccometixline?.contextWindow) candidates.push([data.ccometixline.contextWindow, 'stdin.ccometixline.contextWindow']);
  if (data.ccometixline_context_window) candidates.push([data.ccometixline_context_window, 'stdin.ccometixline_context_window']);
  if (data.context_metrics) candidates.push([data.context_metrics, 'stdin.context_metrics']);

  return candidates;
}

function readBridgeMetrics(data = {}) {
  const sessionId = resolveSessionId(data);
  if (!sessionId) return null;

  const bridgePath = path.join(os.tmpdir(), `harness-ctx-${sessionId}.json`);
  if (!fs.existsSync(bridgePath)) return null;

  try {
    const bridge = JSON.parse(fs.readFileSync(bridgePath, 'utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (bridge.timestamp && now - bridge.timestamp > STALE_BRIDGE_SECONDS) return null;
    return metricFromCandidate(data, bridge, 'bridge');
  } catch (_) {
    return null;
  }
}

function transcriptMetrics(data = {}) {
  const transcriptPath = data.transcript_path;
  if (!transcriptPath || typeof transcriptPath !== 'string') return null;

  const metrics = resolveTranscriptMetrics(transcriptPath, modelIdFromInput(data));
  if (!metrics) return null;

  return {
    usagePct: clampPct(metrics.usagePct),
    remainingPct: metrics.remainingPct,
    remainingTokens: metrics.remainingTokens,
    contextLimit: metrics.contextLimit,
    contextSize: metrics.contextTokens,
    source: 'transcript_usage',
  };
}

function transcriptSizeMetrics(data = {}) {
  const transcriptPath = data.transcript_path;
  if (!transcriptPath || typeof transcriptPath !== 'string') return null;

  try {
    const stat = fs.statSync(transcriptPath);
    const estimatedTokens = Math.round(stat.size * 0.25);
    if (estimatedTokens <= 0) return null;
    const contextLimit = resolveContextLimit(modelIdFromInput(data));
    const usagePct = clampPct((estimatedTokens / contextLimit) * 100);
    return {
      usagePct,
      remainingPct: clampPct(100 - usagePct),
      remainingTokens: Math.max(0, contextLimit - estimatedTokens),
      contextLimit,
      contextSize: estimatedTokens,
      source: 'transcript_size',
    };
  } catch (_) {
    return null;
  }
}

function fallbackSessionKey(data = {}) {
  const raw = data.session_id || process.env.CLAUDE_SESSION_ID;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(-64) || 'default';
  }

  const pidKey = `pid-${process.pid}`;
  const cwd = data.cwd || process.cwd();
  const cwdHash = crypto.createHash('sha256').update(String(cwd)).digest('hex').slice(0, 16);
  return `${pidKey}-${cwdHash}`;
}

function attachCompactState(metrics, data = {}) {
  if (!metrics) return null;
  return {
    ...metrics,
    compactCount: getSessionCompactCount(data, { cwd: data.cwd || data.workspace?.current_dir || process.cwd() }),
  };
}

function resolveContextMetrics(data = {}) {
  for (const [candidate, source] of explicitFrameworkCandidates(data)) {
    const metrics = metricFromCandidate(data, candidate, source);
    if (metrics) return attachCompactState(metrics, data);
  }

  if (data.context_window && typeof data.context_window === 'object') {
    const contextWindowSource = firstNumber(data.context_window, ['used_percentage', 'usedPercentage']) != null
      ? 'stdin.used_percentage'
      : 'stdin.remaining_percentage';
    const metrics = metricFromCandidate(data, data.context_window, contextWindowSource);
    if (metrics) return attachCompactState(metrics, data);
  } else if (data.context_window != null) {
    const numericValue = toNumber(data.context_window);
    const contextLimit = resolveContextLimit(modelIdFromInput(data));
    if (numericValue != null && numericValue > 0) {
      return attachCompactState({
        usagePct: clampPct((numericValue / contextLimit) * 100),
        remainingPct: null,
        remainingTokens: null,
        contextLimit,
        contextSize: numericValue,
        source: 'stdin.context_window_raw',
      }, data);
    }
  }

  const envSize = toNumber(process.env.CLAUDE_CONTEXT_SIZE);
  if (envSize != null && envSize > 0) {
    const contextLimit = toNumber(process.env.CLAUDE_CONTEXT_LIMIT) || resolveContextLimit(modelIdFromInput(data));
    const usagePct = clampPct((envSize / contextLimit) * 100);
    return attachCompactState({
      usagePct,
      remainingPct: clampPct(100 - usagePct),
      remainingTokens: Math.max(0, contextLimit - envSize),
      contextLimit,
      contextSize: envSize,
      source: 'env',
    }, data);
  }

  return attachCompactState(
    transcriptMetrics(data) ||
    readBridgeMetrics(data) ||
    transcriptSizeMetrics(data),
    data
  );
}

module.exports = {
  AUTO_COMPACT_BUFFER_PCT,
  toNumber,
  clampPct,
  normalizeRemainingToUsed,
  metricFromCandidate,
  resolveContextMetrics,
  fallbackSessionKey,
};
