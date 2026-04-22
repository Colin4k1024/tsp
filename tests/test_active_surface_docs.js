#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

const ROOT = path.join(__dirname, '..');
const ACTIVE_DOCS = [
  'README.md',
  'AGENTS.md',
  'docs/runbooks/project-onboarding.md',
  'docs/runbooks/team-skills-usage.md',
  'docs/runbooks/runtime-capabilities-overview.md',
  'docs/runbooks/command-and-capability-matrix.md',
  'docs/runbooks/claude-quick-start.md',
  'docs/runbooks/codex-quick-start.md',
  'docs/runbooks/cursor-quick-start.md',
  'docs/runbooks/opencode-quick-start.md',
];

const BANNED_PATTERNS = [
  'session_start.py',
  'session_end.py',
  'observe.py',
  'pre_compact.py',
  'suggest_compact.py',
  'build_platform_artifacts.py',
  'validate_library.py',
  'skills/shared',
  'skills/ecc',
  'skills/company',
  'company-skills/skills',
];

const TEAM_HELP_REQUIRED = [
  'README.md',
  'AGENTS.md',
  'docs/runbooks/project-onboarding.md',
  'docs/runbooks/team-skills-usage.md',
  'docs/runbooks/command-and-capability-matrix.md',
  'docs/runbooks/claude-quick-start.md',
  'docs/runbooks/codex-quick-start.md',
  'docs/runbooks/cursor-quick-start.md',
  'docs/runbooks/opencode-quick-start.md',
];

const ARTIFACT_PERSIST_REQUIRED = [
  'README.md',
  'docs/runbooks/project-onboarding.md',
  'docs/runbooks/team-skills-usage.md',
  'docs/runbooks/command-and-capability-matrix.md',
  'docs/runbooks/claude-quick-start.md',
  'docs/runbooks/codex-quick-start.md',
  'docs/runbooks/cursor-quick-start.md',
  'docs/runbooks/opencode-quick-start.md',
];

console.log('Active surface docs regression tests');

test('active docs do not contain legacy python hooks or old structure paths', () => {
  for (const relativePath of ACTIVE_DOCS) {
    const fullPath = path.join(ROOT, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    for (const pattern of BANNED_PATTERNS) {
      assert.ok(
        !content.includes(pattern),
        `${relativePath} contains banned legacy reference: ${pattern}`,
      );
    }
  }
});

test('active entry docs include /team-help guidance', () => {
  for (const relativePath of TEAM_HELP_REQUIRED) {
    const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    assert.ok(
      content.includes('/team-help'),
      `${relativePath} should mention /team-help`,
    );
  }
});

test('user-facing docs mention artifact:persist persistence path', () => {
  for (const relativePath of ARTIFACT_PERSIST_REQUIRED) {
    const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    assert.ok(
      content.includes('artifact:persist'),
      `${relativePath} should mention artifact:persist`,
    );
  }
});

test('runtime docs reference current JS hook surface', () => {
  const runtimeDoc = fs.readFileSync(
    path.join(ROOT, 'docs/runbooks/runtime-capabilities-overview.md'),
    'utf8',
  );
  assert.ok(runtimeDoc.includes('scripts/hooks/*.js'));
  assert.ok(runtimeDoc.includes('session-start-bootstrap.js'));
  assert.ok(runtimeDoc.includes('session-end.js'));
});

console.log(`\nActive surface docs regression: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
