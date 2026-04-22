#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXPECTED_SKILL_PATH = 'skills/karpathy-guidelines/SKILL.md';

let passed = 0;
let failed = 0;

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

function runInstallApply(target) {
  const result = spawnSync('node', ['scripts/install-apply.js', '--profile', 'core', '--target', target, '--dry-run', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `install-apply exited with status ${result.status}`);
  }

  return JSON.parse(result.stdout);
}

function hasOperationForSkill(payload) {
  const operations = payload && payload.plan && Array.isArray(payload.plan.operations)
    ? payload.plan.operations
    : [];
  return operations.some((operation) => operation.sourceRelativePath === EXPECTED_SKILL_PATH);
}

console.log('Karpathy guidelines install resolution tests');

test('core profile includes karpathy-guidelines for claude', () => {
  const payload = runInstallApply('claude');
  assert.ok(
    hasOperationForSkill(payload),
    `expected ${EXPECTED_SKILL_PATH} in claude install plan`,
  );
});

test('core profile includes karpathy-guidelines for codex', () => {
  const payload = runInstallApply('codex');
  assert.ok(
    hasOperationForSkill(payload),
    `expected ${EXPECTED_SKILL_PATH} in codex install plan`,
  );
});

console.log(`\nKarpathy guidelines install resolution: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
