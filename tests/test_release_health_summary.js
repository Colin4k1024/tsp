#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { parseArgs } = require(path.join(ROOT, 'scripts', 'release-health-summary'));
const {
  classifyTargetSupportLevel,
  collectTargetSupportMatrix,
} = require(path.join(ROOT, 'scripts', 'lib', 'release-health'));

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

console.log('release health summary tests');

test('parseArgs accepts json profile and tarball inputs', () => {
  const options = parseArgs([
    'node',
    'scripts/release-health-summary.js',
    '--root',
    '/tmp/repo',
    '--profile',
    'team',
    '--pack-json',
    '.npm-pack.json',
    '--json',
  ]);

  assert.strictEqual(options.root, '/tmp/repo');
  assert.strictEqual(options.profileId, 'team');
  assert.strictEqual(options.packJson, path.resolve('/tmp/repo', '.npm-pack.json'));
  assert.strictEqual(options.json, true);
});

test('CLI accepts --json and emits machine-readable output', () => {
  const result = spawnSync(process.execPath, [
    path.join(ROOT, 'scripts', 'release-health-summary.js'),
    '--json',
  ], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.strictEqual(report.overallStatus, 'pass');
  assert.ok(Array.isArray(report.checks));
});

test('support classifier distinguishes recommended strong partial and baseline targets', () => {
  assert.strictEqual(
    classifyTargetSupportLevel({
      requestedModuleIds: ['commands-core', 'team-workflow', 'shared-skills'],
      selectedModuleIds: ['commands-core', 'team-workflow', 'shared-skills'],
    }).level,
    'recommended'
  );

  assert.strictEqual(
    classifyTargetSupportLevel({
      requestedModuleIds: ['commands-core', 'team-workflow', 'shared-skills', 'hooks-runtime'],
      selectedModuleIds: ['commands-core', 'team-workflow', 'shared-skills'],
    }).level,
    'strong'
  );

  assert.strictEqual(
    classifyTargetSupportLevel({
      requestedModuleIds: Array.from({ length: 14 }, (_, index) => `module-${index}`),
      selectedModuleIds: Array.from({ length: 8 }, (_, index) => `module-${index}`),
    }).level,
    'partial'
  );

  assert.strictEqual(
    classifyTargetSupportLevel({
      requestedModuleIds: Array.from({ length: 14 }, (_, index) => `module-${index}`),
      selectedModuleIds: ['platform-configs', 'rules-core'],
    }).level,
    'baseline'
  );
});

test('current repo target matrix matches documented support tiers', () => {
  const matrix = collectTargetSupportMatrix({ repoRoot: ROOT, profileId: 'team' });
  const byTarget = new Map(matrix.map((entry) => [entry.target, entry]));

  assert.strictEqual(byTarget.get('claude').level, 'recommended');
  assert.strictEqual(byTarget.get('cursor').level, 'recommended');
  assert.strictEqual(byTarget.get('codex').level, 'strong');
  assert.strictEqual(byTarget.get('opencode').level, 'strong');
  assert.strictEqual(byTarget.get('antigravity').level, 'partial');
  assert.strictEqual(byTarget.get('codebuddy').level, 'partial');
  assert.strictEqual(byTarget.get('copilot').level, 'baseline');
  assert.strictEqual(byTarget.get('windsurf').level, 'baseline');
  assert.strictEqual(byTarget.get('augment').level, 'baseline');
});

console.log(`\nrelease health summary: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
