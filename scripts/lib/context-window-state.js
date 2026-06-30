'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

function sanitizeSegment(raw, fallback = 'default') {
  const value = String(raw || '').trim();
  if (!value) return fallback;
  const sanitized = value
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-80);
  return sanitized || crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function projectStateDir(cwd = process.cwd()) {
  return path.join(path.resolve(cwd || process.cwd()), '.tsp', 'context');
}

function getContextStateDir(options = {}) {
  if (process.env.TSP_CONTEXT_STATE_DIR) {
    return path.resolve(process.env.TSP_CONTEXT_STATE_DIR);
  }
  if (options.stateDir) {
    return path.resolve(options.stateDir);
  }
  if (options.projectRoot || options.cwd) {
    return projectStateDir(options.projectRoot || options.cwd);
  }
  return projectStateDir(process.cwd());
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function getCompactStatePath(options = {}) {
  return path.join(getContextStateDir(options), 'compact-state.json');
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return filePath;
}

function resolveSessionId(input = {}, options = {}) {
  return sanitizeSegment(
    options.sessionId ||
    input.session_id ||
    input.sessionId ||
    process.env.CLAUDE_SESSION_ID ||
    process.env.CODEX_SESSION_ID ||
    'default'
  );
}

function emptyState() {
  return {
    version: 1,
    totalCompactCount: 0,
    sessions: {},
    updatedAt: null,
  };
}

function loadCompactState(options = {}) {
  return readJson(getCompactStatePath(options), emptyState());
}

function getSessionCompactCount(input = {}, options = {}) {
  const state = loadCompactState(options);
  const sessionId = resolveSessionId(input, options);
  return Number(state.sessions?.[sessionId]?.compactCount || 0) || 0;
}

function recordCompactEvent(input = {}, options = {}) {
  const statePath = getCompactStatePath(options);
  const state = loadCompactState(options);
  const sessionId = resolveSessionId(input, options);
  const now = new Date().toISOString();
  const current = state.sessions[sessionId] || {
    sessionId,
    compactCount: 0,
    firstCompactedAt: now,
  };

  current.compactCount = (Number(current.compactCount || 0) || 0) + 1;
  current.lastCompactedAt = now;
  current.transcriptPath = input.transcript_path || input.transcriptPath || current.transcriptPath || null;
  current.cwd = input.cwd || input.workspace?.current_dir || options.cwd || process.cwd();

  state.version = 1;
  state.totalCompactCount = (Number(state.totalCompactCount || 0) || 0) + 1;
  state.sessions[sessionId] = current;
  state.updatedAt = now;

  writeJson(statePath, state);

  return {
    statePath,
    sessionId,
    sessionCompactCount: current.compactCount,
    totalCompactCount: state.totalCompactCount,
    updatedAt: now,
  };
}

module.exports = {
  getContextStateDir,
  getCompactStatePath,
  loadCompactState,
  getSessionCompactCount,
  recordCompactEvent,
  resolveSessionId,
};
