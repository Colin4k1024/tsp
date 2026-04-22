#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { validateFileReferences } = require('../scripts/validate-file-references');
const { validateSkillStructure } = require('../scripts/validate-skill-structure');

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

function withTempRoot(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'validation-scripts-'));
  try {
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

console.log('Validation script tests');

test('reference validator treats archive markdown links as warnings but active docs as errors', () => {
  withTempRoot((root) => {
    fs.mkdirSync(path.join(root, 'docs', 'runbooks'), { recursive: true });
    fs.mkdirSync(path.join(root, 'docs', 'artifacts', '2026-04-17-demo'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'docs', 'runbooks', 'active.md'),
      '[broken](../missing.md)\n',
      'utf8',
    );
    fs.writeFileSync(
      path.join(root, 'docs', 'artifacts', '2026-04-17-demo', 'history.md'),
      '[archive-broken](missing.md)\n',
      'utf8',
    );

    const report = validateFileReferences({ cwd: root, strict: true });
    assert.strictEqual(report.errorCount, 1);
    assert.strictEqual(report.warningCount, 1);
  });
});

test('skill structure validator reports frontmatter errors and missing metadata warnings', () => {
  withTempRoot((root) => {
    const skillDir = path.join(root, 'skills', 'demo-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Demo Skill\n', 'utf8');

    const report = validateSkillStructure({ cwd: root, strict: false });
    assert.ok(report.errorCount >= 1);
    assert.ok(report.warningCount >= 1);
    assert.ok(report.errors.some((issue) => issue.message.includes('frontmatter')));
    assert.ok(report.warnings.some((issue) => issue.message.includes('agents/openai.yaml')));
  });
});

test('skill structure validator can escalate warnings for selected shipped skills', () => {
  withTempRoot((root) => {
    const skillDir = path.join(root, 'skills', 'demo-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: demo-skill\ndescription: Demo skill\n---\n\n# Demo Skill\n',
      'utf8',
    );

    const report = validateSkillStructure({
      cwd: root,
      strict: false,
      strictPaths: ['skills/demo-skill/SKILL.md'],
    });
    assert.strictEqual(report.warningCount, 1);
    assert.strictEqual(report.errorCount, 1);
    assert.ok(report.errors.some((issue) => issue.message.includes('agents/openai.yaml')));
  });
});

console.log(`\nValidation scripts: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
