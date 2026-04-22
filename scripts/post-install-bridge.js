#!/usr/bin/env node
'use strict';

/**
 * post-install-bridge.js — standalone CLI entrypoint for
 * oris-claude-bridge provisioning and self-evolution enablement.
 *
 * Called automatically by install.sh after install-apply.js,
 * or directly: node scripts/post-install-bridge.js [--target claude]
 */

const os = require('os');
const path = require('path');

const SCRIPT_DIR = path.resolve(__dirname, '..');

// Reuse the bin/lib implementation
const { runPostInstallBridge } = require(path.join(SCRIPT_DIR, 'bin/lib/post-install-bridge'));

function parseArgs(argv) {
  const args = argv.slice(2);
  let target = 'claude';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      target = args[++i];
    }
  }
  return { target };
}

function resolveInstallRoot(target) {
  if (target === 'claude') {
    return path.join(os.homedir(), '.claude');
  }
  // For other targets, install root is the current working directory
  return process.cwd();
}

const opts = parseArgs(process.argv);
const installRoot = resolveInstallRoot(opts.target);

runPostInstallBridge({
  packageRoot: SCRIPT_DIR,
  installRoot,
  target: opts.target,
});
