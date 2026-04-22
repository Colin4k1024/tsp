#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

let passed = 0;
let failed = 0;

const ROOT = path.join(__dirname, '..');

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
  }
}

function runInstallApply(args, env) {
  const result = spawnSync('node', ['scripts/install-apply.js', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env,
    },
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `install-apply exited with status ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

function withTempHome(fn) {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'install-lifecycle-'));
  try {
    fn(tempHome);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

console.log('Install apply lifecycle tests');

test('status subcommand returns install-state records', () => {
  withTempHome((tempHome) => {
    const payload = runInstallApply(['status', '--json', '--target', 'claude'], {
      HOME: tempHome,
    });
    assert.ok(Array.isArray(payload.records));
    assert.ok(payload.summary);
    assert.strictEqual(payload.summary.checkedCount, 1);
  });
});

test('repair and uninstall default to dry-run unless --apply is provided', () => {
  withTempHome((tempHome) => {
    const repairDryRun = runInstallApply(['repair', '--json', '--target', 'claude'], {
      HOME: tempHome,
    });
    assert.strictEqual(repairDryRun.dryRun, true);

    const repairApply = runInstallApply(['repair', '--json', '--target', 'claude', '--apply'], {
      HOME: tempHome,
    });
    assert.strictEqual(repairApply.dryRun, false);

    const uninstallDryRun = runInstallApply(['uninstall', '--json', '--target', 'claude'], {
      HOME: tempHome,
    });
    assert.strictEqual(uninstallDryRun.dryRun, true);
  });
});

console.log(`\nInstall apply lifecycle: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
