#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const raw = fs.readFileSync(0, 'utf8');
const [, , hookId, relScriptPath, profilesCsv = 'standard,strict'] = process.argv;
const runnerRel = path.join('scripts', 'hooks', 'run-with-flags.js');

function hasRunnerRoot(candidate) {
  const value = typeof candidate === 'string' ? candidate.trim() : '';
  return value.length > 0 && fs.existsSync(path.join(path.resolve(value), runnerRel));
}

function resolvePluginRoot() {
  const envRoot = process.env.CLAUDE_PLUGIN_ROOT || '';
  if (hasRunnerRoot(envRoot)) {
    return path.resolve(envRoot.trim());
  }

  const home = require('os').homedir();
  const claudeDir = path.join(home, '.claude');

  if (hasRunnerRoot(claudeDir)) {
    return claudeDir;
  }

  const knownPaths = [
    path.join(claudeDir, 'plugins', 'everything-claude-code'),
    path.join(claudeDir, 'plugins', 'everything-claude-code@everything-claude-code'),
    path.join(claudeDir, 'plugins', 'marketplace', 'everything-claude-code'),
  ];

  for (const candidate of knownPaths) {
    if (hasRunnerRoot(candidate)) {
      return candidate;
    }
  }

  try {
    const cacheBase = path.join(claudeDir, 'plugins', 'cache', 'everything-claude-code');
    for (const org of fs.readdirSync(cacheBase, { withFileTypes: true })) {
      if (!org.isDirectory()) continue;
      for (const version of fs.readdirSync(path.join(cacheBase, org.name), { withFileTypes: true })) {
        if (!version.isDirectory()) continue;
        const candidate = path.join(cacheBase, org.name, version.name);
        if (hasRunnerRoot(candidate)) {
          return candidate;
        }
      }
    }
  } catch {
    // Cache directory may not exist; that's fine.
  }

  return claudeDir;
}

if (!hookId || !relScriptPath) {
  process.stdout.write(raw);
  process.exit(0);
}

const root = resolvePluginRoot();
const runner = path.join(root, runnerRel);

if (fs.existsSync(runner)) {
  const result = spawnSync(
    process.execPath,
    [runner, hookId, relScriptPath, profilesCsv],
    {
      input: raw,
      encoding: 'utf8',
      env: process.env,
      cwd: process.cwd(),
      timeout: 30000,
    }
  );

  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  if (stdout) {
    process.stdout.write(stdout);
  } else {
    process.stdout.write(raw);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error || result.status === null || result.signal) {
    const reason = result.error
      ? result.error.message
      : result.signal
        ? `signal ${result.signal}`
        : 'missing exit status';
    process.stderr.write(`[Stop] ERROR: hook runner failed: ${reason}\n`);
    process.exit(0);
  }

  const exitCode = Number.isInteger(result.status) ? result.status : 0;
  if (exitCode !== 0) {
    process.stderr.write(`[Stop] WARNING: hook exited with code ${exitCode}\n`);
  }
  process.exit(0);
}

process.stderr.write('[Stop] WARNING: could not resolve ECC plugin root; skipping hook\n');
process.stdout.write(raw);
