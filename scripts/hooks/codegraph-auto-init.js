#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { resolveCodeGraphBin } = require('../install-codegraph');

const STATE_FILE = path.join('.codegraph', 'tsp-auto-init-state.json');
const DEFAULT_RETRY_MS = 60 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000;
const PROJECT_MARKERS = Object.freeze([
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'Gemfile',
  'composer.json',
  'mix.exs',
  'deno.json',
  'deno.jsonc',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
]);

function isDisabled() {
  const value = String(process.env.TSP_CODEGRAPH_AUTO_INIT || '').trim().toLowerCase();
  return value === '0' || value === 'false' || value === 'off';
}

function readHookInput(rawInput) {
  if (!rawInput || !String(rawInput).trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawInput);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function normalizePath(candidate) {
  try {
    return fs.realpathSync(candidate);
  } catch {
    return path.resolve(candidate);
  }
}

function getStartDir(rawInput) {
  if (process.env.CODEGRAPH_AUTO_INIT_PROJECT_ROOT) {
    return path.resolve(process.env.CODEGRAPH_AUTO_INIT_PROJECT_ROOT);
  }

  const input = readHookInput(rawInput);
  const candidates = [
    input.cwd,
    input.projectDir,
    input.project_dir,
    input.projectPath,
    input.project_path,
    input.workspaceDir,
    input.workspace_dir,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return path.resolve(candidate.trim());
    }
  }

  return process.cwd();
}

function parseGitDirFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').trim();
    const match = content.match(/^gitdir:\s*(.+)$/i);
    if (!match) {
      return null;
    }
    const gitDir = match[1].trim();
    return path.resolve(path.dirname(filePath), gitDir);
  } catch {
    return null;
  }
}

function findGitRoot(startDir) {
  let current = normalizePath(startDir);
  const root = path.parse(current).root;

  while (current && current !== root) {
    const gitPath = path.join(current, '.git');
    if (fs.existsSync(gitPath)) {
      return current;
    }
    current = path.dirname(current);
  }

  const rootGitPath = path.join(root, '.git');
  return fs.existsSync(rootGitPath) ? root : null;
}

function findMarkerRoot(startDir) {
  let current = normalizePath(startDir);
  const root = path.parse(current).root;
  const home = normalizePath(os.homedir());

  while (current && current !== root) {
    if (current === home) {
      return null;
    }
    if (PROJECT_MARKERS.some(marker => fs.existsSync(path.join(current, marker)))) {
      return current;
    }
    current = path.dirname(current);
  }

  return null;
}

function resolveProjectRoot(rawInput) {
  const startDir = getStartDir(rawInput);
  if (!fs.existsSync(startDir)) {
    return null;
  }

  return findGitRoot(startDir) || findMarkerRoot(startDir);
}

function codegraphDbPath(projectRoot) {
  return path.join(projectRoot, '.codegraph', 'codegraph.db');
}

function statePath(projectRoot) {
  return path.join(projectRoot, STATE_FILE);
}

function readState(projectRoot) {
  try {
    return JSON.parse(fs.readFileSync(statePath(projectRoot), 'utf8'));
  } catch {
    return {};
  }
}

function writeState(projectRoot, state) {
  const filePath = statePath(projectRoot);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

function retryDelayMs() {
  const parsed = Number(process.env.TSP_CODEGRAPH_AUTO_INIT_RETRY_MS || DEFAULT_RETRY_MS);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_RETRY_MS;
}

function shouldThrottleFailure(projectRoot, now = Date.now()) {
  const state = readState(projectRoot);
  if (state.status !== 'failed' || !state.failedAt) {
    return false;
  }

  const failedAt = Date.parse(state.failedAt);
  if (!Number.isFinite(failedAt)) {
    return false;
  }

  return now - failedAt < retryDelayMs();
}

function resolveGitDir(projectRoot) {
  const gitPath = path.join(projectRoot, '.git');
  try {
    const stat = fs.statSync(gitPath);
    if (stat.isDirectory()) {
      return gitPath;
    }
    if (stat.isFile()) {
      return parseGitDirFile(gitPath);
    }
  } catch {
    return null;
  }

  return null;
}

function ensureGitExclude(projectRoot) {
  const gitDir = resolveGitDir(projectRoot);
  if (!gitDir) {
    return false;
  }

  const excludePath = path.join(gitDir, 'info', 'exclude');
  fs.mkdirSync(path.dirname(excludePath), { recursive: true });
  const existing = fs.existsSync(excludePath) ? fs.readFileSync(excludePath, 'utf8') : '';
  const lines = existing.split(/\r?\n/).map(line => line.trim());
  if (lines.includes('.codegraph/')) {
    return false;
  }

  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(excludePath, `${prefix}.codegraph/\n`, 'utf8');
  return true;
}

function timeoutMs() {
  const parsed = Number(process.env.TSP_CODEGRAPH_AUTO_INIT_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function truncate(text, maxLength = 2000) {
  const value = String(text || '');
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function initializeProject(projectRoot) {
  const resolved = resolveCodeGraphBin({ ignoreForceStandalone: true });
  if (!resolved) {
    throw new Error('CodeGraph binary not found. Install it with the official standalone installer or set CODEGRAPH_INSTALL_BIN.');
  }

  const result = spawnSync(resolved.command, [...resolved.argsPrefix, 'init', '-i', projectRoot], {
    cwd: projectRoot,
    env: process.env,
    encoding: 'utf8',
    timeout: timeoutMs(),
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(truncate(`${result.stdout || ''}${result.stderr || ''}`.trim() || `codegraph exited with status ${result.status}`));
  }

  return {
    binary: resolved.displayCommand,
  };
}

function runAutoInit(rawInput = '') {
  if (isDisabled()) {
    return { status: 'skipped', reason: 'disabled' };
  }

  const projectRoot = resolveProjectRoot(rawInput);
  if (!projectRoot) {
    return { status: 'skipped', reason: 'no-project-root' };
  }

  if (fs.existsSync(codegraphDbPath(projectRoot))) {
    return { status: 'skipped', reason: 'already-initialized', projectRoot };
  }

  if (shouldThrottleFailure(projectRoot)) {
    return { status: 'skipped', reason: 'recent-failure', projectRoot };
  }

  try {
    ensureGitExclude(projectRoot);
    const initialized = initializeProject(projectRoot);
    writeState(projectRoot, {
      status: 'initialized',
      projectRoot,
      initializedAt: new Date().toISOString(),
      binary: initialized.binary,
    });
    return { status: 'initialized', projectRoot };
  } catch (error) {
    writeState(projectRoot, {
      status: 'failed',
      projectRoot,
      failedAt: new Date().toISOString(),
      error: truncate(error && error.message ? error.message : error),
    });
    return { status: 'failed', projectRoot, error };
  }
}

function run(rawInput = '') {
  const result = runAutoInit(rawInput);
  if (result.status === 'failed' && process.env.TSP_CODEGRAPH_AUTO_INIT_VERBOSE === '1') {
    return {
      stderr: `[CodeGraph] auto-init failed for ${result.projectRoot}: ${result.error && result.error.message ? result.error.message : result.error}\n`,
      exitCode: 0,
    };
  }
  return { exitCode: 0 };
}

if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    raw += chunk;
  });
  process.stdin.on('end', () => {
    run(raw);
  });
}

module.exports = {
  codegraphDbPath,
  ensureGitExclude,
  findGitRoot,
  findMarkerRoot,
  readState,
  resolveProjectRoot,
  run,
  runAutoInit,
  shouldThrottleFailure,
  statePath,
};
