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
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'install-manifest-hash-'));
  try {
    fn(tempHome);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

console.log('Install manifest hash tests');

test('doctor reports hash mismatch when managed file drifts from install-manifest', () => {
  withTempHome((tempHome) => {
    const installPayload = runInstallApply([
      '--profile',
      'team',
      '--target',
      'codex',
      '--json',
    ], {
      HOME: tempHome,
    });

    const installResult = installPayload.result;
    assert.ok(installResult.installManifestPath, 'expected installManifestPath on install result');
    assert.ok(fs.existsSync(installResult.installManifestPath), 'install-manifest should exist after install');

    const manifest = JSON.parse(fs.readFileSync(installResult.installManifestPath, 'utf8'));
    assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0, 'install-manifest should include managed files');

    const mutatedFile = manifest.files[0].destinationPath;
    fs.appendFileSync(mutatedFile, '\n# drift\n', 'utf8');

    const doctorPayload = runInstallApply(['doctor', '--target', 'codex', '--json'], {
      HOME: tempHome,
    });
    const codexResult = doctorPayload.results.find((entry) => entry.adapter && entry.adapter.target === 'codex');
    assert.ok(codexResult, 'doctor report should include codex target');
    assert.ok(
      codexResult.issues.some((issue) => issue.code === 'install-manifest-hash-mismatch'),
      'doctor should report install-manifest hash mismatch',
    );
  });
});

console.log(`\nInstall manifest hash: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
