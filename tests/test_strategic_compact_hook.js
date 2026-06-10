#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'hooks', 'suggest-compact.js');
const HOOKS_JSON = path.join(ROOT, 'hooks', 'hooks.json');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  \u2717 ${name}`);
    console.error(`    ${err.message}`);
  }
}

function runSuggestCompact(payload, extraEnv = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'strategic-compact-test-'));
  try {
    return spawnSync(process.execPath, [SCRIPT], {
      input: JSON.stringify(payload),
      encoding: 'utf8',
      env: {
        ...process.env,
        TMPDIR: tempDir,
        TMP: tempDir,
        TEMP: tempDir,
        STRATEGIC_COMPACT_DISABLE_DEBOUNCE: '1',
        ...extraEnv,
      },
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

console.log('Strategic compact hook tests');

test('emits compact suggestion from remaining context percentage', () => {
  const result = runSuggestCompact({
    hook_event_name: 'PreToolUse',
    session_id: 'compact-test-high',
    context_window: {
      remaining_percentage: 20,
    },
  });

  assert.strictEqual(result.status, 0);
  assert.ok(result.stdout.trim(), 'expected hook output');

  const output = JSON.parse(result.stdout);
  assert.strictEqual(output.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.ok(output.hookSpecificOutput.additionalContext.includes('/compact'));
  assert.strictEqual(output.compactSuggestion.should_compact, true);
  assert.ok(['high', 'critical'].includes(output.compactSuggestion.urgency));
  assert.strictEqual(output.compactSuggestion.context_source, 'stdin.remaining_percentage');
});

test('stays silent below compact threshold', () => {
  const result = runSuggestCompact({
    hook_event_name: 'PreToolUse',
    session_id: 'compact-test-low',
    context_window: {
      remaining_percentage: 80,
    },
  });

  assert.strictEqual(result.status, 0);
  assert.strictEqual(result.stdout, '');
});

test('hooks.json registers strategic compact for all tools', () => {
  const payload = JSON.parse(fs.readFileSync(HOOKS_JSON, 'utf8'));
  const preToolUse = payload.hooks.PreToolUse || [];
  const entry = preToolUse.find(item => item.id === 'pre:all:strategic-compact');

  assert.ok(entry, 'expected pre:all:strategic-compact hook entry');
  assert.strictEqual(entry.matcher, '*');
  assert.ok(entry.description.includes('70/85/95'));
  assert.ok(entry.hooks.some(hook => hook.command.includes('scripts/hooks/suggest-compact.js')));
});

if (failed > 0) {
  console.error(`\n${failed} strategic compact hook test(s) failed`);
  process.exit(1);
}

console.log(`\n${passed} strategic compact hook test(s) passed`);
