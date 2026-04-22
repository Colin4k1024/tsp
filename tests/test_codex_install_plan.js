#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { resolveInstallPlan } = require(path.join(ROOT, 'scripts', 'lib', 'install-manifests'));

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

console.log('codex install plan tests');

test('full profile no longer skips commands-core for codex', () => {
  const plan = resolveInstallPlan({ profileId: 'full', target: 'codex' });
  assert.ok(plan.selectedModuleIds.includes('commands-core'), 'full codex plan should select commands-core');
  assert.ok(!plan.skippedModuleIds.includes('commands-core'), 'full codex plan should not skip commands-core');
});

test('team profile now keeps the codex team workflow chain intact', () => {
  const plan = resolveInstallPlan({ profileId: 'team', target: 'codex' });
  for (const moduleId of ['commands-core', 'team-workflow', 'shared-skills', 'enhanced-workflows']) {
    assert.ok(plan.selectedModuleIds.includes(moduleId), `team codex plan should select ${moduleId}`);
    assert.ok(!plan.skippedModuleIds.includes(moduleId), `team codex plan should not skip ${moduleId}`);
  }
});

console.log(`\ncodex install plan: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
