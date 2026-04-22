#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

console.log('Public enterprise split tests');

test('public install manifests no longer ship enterprise modules or enterprise profile', () => {
  const modules = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifests', 'install-modules.json'), 'utf8'));
  const profiles = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifests', 'install-profiles.json'), 'utf8'));

  const moduleIds = new Set((modules.modules || []).map((entry) => entry.id));
  assert.ok(!moduleIds.has('company-skills'), 'public manifests should not include company-skills');
  assert.ok(!moduleIds.has('enterprise-rules'), 'public manifests should not include enterprise-rules');
  assert.ok(!Object.prototype.hasOwnProperty.call(profiles.profiles || {}, 'enterprise'), 'public profiles should not include enterprise');
  assert.ok(
    !profiles.profiles.team.modules.includes('enterprise-rules'),
    'public team profile should not depend on enterprise-rules',
  );
});

test('public repository no longer ships company skill directories', () => {
  for (const relativePath of [
    'skills/biz-service-designer',
    'skills/bpmn-flow-engine',
    'skills/front-builtin-components',
    'skills/front-platform-conformance',
    'skills/front-style-spec',
    'skills/haier-data-permission',
    'skills/haier-enterprise-sdk',
    'skills/haier-scaffold-coding',
    'skills/trigger-gitlab-pipeline',
  ]) {
    assert.ok(!fs.existsSync(path.join(ROOT, relativePath)), `${relativePath} should be removed from the public repo`);
  }
});

test('validate-library no longer hardcodes company skill validation', () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts', 'validate-library.js'), 'utf8');
  assert.ok(!source.includes('COMPANY_SKILL_NAMES'), 'validate-library should not maintain a public company skill allowlist');
  assert.ok(!source.includes('Company skills:'), 'validate-library should not report company skill counts in the public repo');
});

test('public docs describe enterprise overlay instead of shipping company integration docs', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.ok(readme.includes('enterprise overlay'), 'README should document enterprise overlay usage');
  assert.ok(!readme.includes('company-skills-integration.md'), 'README should stop linking public company integration docs');
});

console.log(`\nPublic enterprise split: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
