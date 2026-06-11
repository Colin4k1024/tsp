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
  assert.ok(entry.description.includes('65/70/85/95'));
  assert.ok(entry.hooks.some(hook => hook.command.includes('scripts/hooks/suggest-compact.js')));
});

test('hooks.json has harness-statusline before strategic-compact', () => {
  const payload = JSON.parse(fs.readFileSync(HOOKS_JSON, 'utf8'));
  const preToolUse = payload.hooks.PreToolUse || [];
  const statuslineIdx = preToolUse.findIndex(item => item.id === 'pre:all:harness-statusline');
  const compactIdx = preToolUse.findIndex(item => item.id === 'pre:all:strategic-compact');

  assert.ok(statuslineIdx >= 0, 'expected harness-statusline entry');
  assert.ok(compactIdx >= 0, 'expected strategic-compact entry');
  assert.ok(statuslineIdx < compactIdx, 'harness-statusline must run before strategic-compact');
});

test('emits compact suggestion from bridge file when context_window is missing', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'strategic-compact-bridge-test-'));
  try {
    // Write a bridge file with high usage
    const sessionBridge = 'bridge-test-session';
    const bridgePath = path.join(tempDir, `harness-ctx-${sessionBridge}.json`);
    fs.writeFileSync(bridgePath, JSON.stringify({
      session_id: sessionBridge,
      remaining_percentage: 20,
      used_pct: 77,
      timestamp: Math.floor(Date.now() / 1000),
    }));

    const result = spawnSync(process.execPath, [SCRIPT], {
      input: JSON.stringify({
        hook_event_name: 'PreToolUse',
        session_id: sessionBridge,
        // No context_window — should fall back to bridge file
      }),
      encoding: 'utf8',
      env: {
        ...process.env,
        TMPDIR: tempDir,
        TMP: tempDir,
        TEMP: tempDir,
        STRATEGIC_COMPACT_DISABLE_DEBOUNCE: '1',
      },
    });

    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.trim(), 'expected hook output from bridge file');

    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.compactSuggestion.should_compact, true);
    assert.strictEqual(output.compactSuggestion.context_source, 'bridge');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('handles malformed context_window (number) without crashing', () => {
  const result = runSuggestCompact({
    hook_event_name: 'PreToolUse',
    session_id: 'compact-test-malformed',
    context_window: 200000,
  });

  assert.strictEqual(result.status, 0);
  // Should either emit (if usage is high) or stay silent (if low)
  // The key assertion is that it doesn't crash
});

test('handles malformed context_window (string) without crashing', () => {
  const result = runSuggestCompact({
    hook_event_name: 'PreToolUse',
    session_id: 'compact-test-malformed-str',
    context_window: '200000',
  });

  assert.strictEqual(result.status, 0);
});

test('emits advisory at 65% threshold', () => {
  // remaining_percentage: 46 -> after buffer normalization ≈ 65% used
  // Formula: usableRemaining = ((46 - 16.5) / (100 - 16.5)) * 100 ≈ 35.3
  // usedPct = 100 - 35.3 ≈ 64.7 -> rounds to 65
  const result = runSuggestCompact({
    hook_event_name: 'PreToolUse',
    session_id: 'compact-test-advisory',
    context_window: {
      remaining_percentage: 46,
    },
  });

  assert.strictEqual(result.status, 0);
  assert.ok(result.stdout.trim(), 'expected advisory output');

  const output = JSON.parse(result.stdout);
  assert.strictEqual(output.compactSuggestion.urgency, 'advisory');
});

test('diagnostic mode outputs to stderr when STRATEGIC_COMPACT_DEBUG=1', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'strategic-compact-debug-test-'));
  try {
    const result = spawnSync(process.execPath, [SCRIPT], {
      input: JSON.stringify({
        hook_event_name: 'PreToolUse',
        session_id: 'debug-test',
        // No context_window, no bridge file — should trigger diagnostic
      }),
      encoding: 'utf8',
      env: {
        ...process.env,
        TMPDIR: tempDir,
        TMP: tempDir,
        TEMP: tempDir,
        STRATEGIC_COMPACT_DEBUG: '1',
      },
    });

    assert.strictEqual(result.status, 0);
    assert.ok(result.stderr.includes('[strategic-compact]'), 'expected diagnostic output in stderr');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

if (failed > 0) {
  console.error(`\n${failed} strategic compact hook test(s) failed`);
  process.exit(1);
}

console.log(`\n${passed} strategic compact hook test(s) passed`);
