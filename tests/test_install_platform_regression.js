#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { isManagedJsHookGroup } = require('../scripts/install-platform.js');

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

function getSection(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  if (start === -1) {
    throw new Error(`Missing token: ${startToken}`);
  }
  const end = source.indexOf(endToken, start);
  if (end === -1) {
    throw new Error(`Missing token: ${endToken}`);
  }
  return source.slice(start, end);
}

const installPlatformPath = path.join(__dirname, '..', 'scripts', 'install-platform.js');
const source = fs.readFileSync(installPlatformPath, 'utf8');

console.log('Install platform regression tests');

test('registerAuditHooks no longer emits python hook commands', () => {
  const section = getSection(source, 'function registerAuditHooks(', 'function registerJsHooks(');
  assert.ok(!section.includes('.py"'), 'registerAuditHooks should not register .py hook commands');
  assert.ok(section.includes('session-start-bootstrap.js'), 'registerAuditHooks should register session-start-bootstrap.js');
  assert.ok(section.includes('session-end.js'), 'registerAuditHooks should register session-end.js');
  assert.ok(section.includes('cost-tracker.js'), 'registerAuditHooks should register cost-tracker.js');
});

test('installers use flattened skills installation helper', () => {
  const codexSection = getSection(source, 'function installCodex(', 'function installAuditLib(');
  const claudeSection = getSection(source, 'function installClaude(', 'function installCursor(');
  assert.ok(codexSection.includes('installFlattenedSkills(root, skillsTarget);'));
  assert.ok(claudeSection.includes('installFlattenedSkills(root, skillsDir);'));
});

test('legacy python hook names are tracked only as cleanup input', () => {
  assert.ok(source.includes('const LEGACY_PYTHON_HOOK_FILES = ['));
  const registerAuditHooks = getSection(source, 'function registerAuditHooks(', 'function registerJsHooks(');
  assert.ok(registerAuditHooks.includes('pruneHookEntries('), 'expected cleanup of legacy hook entries');
});

test('managed JS hook cleanup preserves custom wrappers around bundled hooks', () => {
  assert.strictEqual(
    isManagedJsHookGroup(
      {
        id: 'pre:all:harness-statusline',
        hooks: [{ command: 'node "/tmp/harness-statusline.js"' }],
      },
      { command: 'node "/tmp/harness-statusline.js"' }
    ),
    true
  );

  assert.strictEqual(
    isManagedJsHookGroup(
      {
        matcher: '.*',
        hooks: [{ tag: 'harness-statusline', command: 'node "/tmp/harness-statusline.js"' }],
      },
      { tag: 'harness-statusline', command: 'node "/tmp/harness-statusline.js"' }
    ),
    true
  );

  assert.strictEqual(
    isManagedJsHookGroup(
      {
        id: 'pre:custom:statusline-wrapper',
        hooks: [{ command: 'node "/tmp/custom-wrapper.js" --delegate harness-statusline.js' }],
      },
      { command: 'node "/tmp/custom-wrapper.js" --delegate harness-statusline.js' }
    ),
    false
  );
});

console.log(`\nInstall platform regression: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
