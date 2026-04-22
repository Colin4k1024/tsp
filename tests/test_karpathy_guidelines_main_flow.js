#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const KARPATHY_ID = 'karpathy-guidelines';
const MAIN_FLOW_COMMANDS = [
  'team-help',
  'team-intake',
  'team-plan',
  'team-execute',
  'team-review',
  'team-release',
];
const MAIN_FLOW_ROLES = [
  'tech-lead',
  'architect',
  'frontend-engineer',
  'backend-engineer',
  'qa-engineer',
  'devops-engineer',
];
const PLANNING_SIDE_ROLES = ['product-manager', 'project-manager'];

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

function readJsonFile(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function readTextFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

console.log('Karpathy guidelines main-flow defaults tests');

test('main-flow generated commands mention karpathy-guidelines', () => {
  for (const commandName of MAIN_FLOW_COMMANDS) {
    const commandText = readTextFile(path.join('commands', `${commandName}.md`));
    assert.ok(
      commandText.includes(KARPATHY_ID),
      `expected commands/${commandName}.md to mention ${KARPATHY_ID}`,
    );
  }
});

test('team-closeout remains free of karpathy-guidelines defaulting', () => {
  const closeoutText = readTextFile(path.join('commands', 'team-closeout.md'));
  assert.ok(
    !closeoutText.includes(KARPATHY_ID),
    'expected commands/team-closeout.md to remain unchanged by karpathy defaulting',
  );
});

test('main-flow roles recommend karpathy-guidelines', () => {
  for (const roleId of MAIN_FLOW_ROLES) {
    const role = readJsonFile(path.join('roles', roleId, 'role.yaml'));
    assert.ok(
      Array.isArray(role.recommended_ecc_skills) && role.recommended_ecc_skills.includes(KARPATHY_ID),
      `expected roles/${roleId}/role.yaml to recommend ${KARPATHY_ID}`,
    );
  }
});

test('planning-side roles remain unchanged for karpathy-guidelines', () => {
  for (const roleId of PLANNING_SIDE_ROLES) {
    const role = readJsonFile(path.join('roles', roleId, 'role.yaml'));
    const recommendedEccSkills = Array.isArray(role.recommended_ecc_skills)
      ? role.recommended_ecc_skills
      : [];
    assert.ok(
      !recommendedEccSkills.includes(KARPATHY_ID),
      `expected roles/${roleId}/role.yaml to stay without ${KARPATHY_ID}`,
    );
  }
});

console.log(`\nKarpathy guidelines main-flow defaults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
