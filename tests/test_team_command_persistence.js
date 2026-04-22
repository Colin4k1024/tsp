#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

const ROOT = path.join(__dirname, '..');
const COMMANDS = [
  'team-intake.md',
  'team-plan.md',
  'handoff.md',
  'team-execute.md',
  'team-review.md',
  'team-release.md',
  'team-closeout.md',
];

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

console.log('Team command persistence tests');

test('team command docs reference artifact:persist workflow', () => {
  for (const fileName of COMMANDS) {
    const content = fs.readFileSync(path.join(ROOT, 'commands', fileName), 'utf8');
    assert.ok(content.includes('artifact:persist'), `${fileName} should mention artifact:persist`);
  }
});

console.log(`\nTeam command persistence: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
