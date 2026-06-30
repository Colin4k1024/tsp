#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SUGGEST = path.join(ROOT, 'scripts', 'hooks', 'suggest-compact.js');
const PRE_COMPACT = path.join(ROOT, 'scripts', 'hooks', 'pre-compact.js');

const {
  resolveContextMetrics,
} = require('../scripts/lib/context-window');
const {
  loadCompactState,
} = require('../scripts/lib/context-window-state');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

function withTempState(fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'context-window-runtime-'));
  const previousStateDir = process.env.TSP_CONTEXT_STATE_DIR;
  process.env.TSP_CONTEXT_STATE_DIR = tempDir;
  try {
    return fn(tempDir);
  } finally {
    if (previousStateDir == null) {
      delete process.env.TSP_CONTEXT_STATE_DIR;
    } else {
      process.env.TSP_CONTEXT_STATE_DIR = previousStateDir;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

console.log('Context window runtime tests');

test('prefers CCometixLine-style remaining context from stdin', () => {
  withTempState(() => {
    const metrics = resolveContextMetrics({
      session_id: 'ctx-ccometixline',
      ccometixline: {
        context_window: {
          remaining_percentage: 20,
          remaining_tokens: 40000,
          context_limit: 200000,
        },
      },
    });

    assert.ok(metrics, 'expected metrics');
    assert.strictEqual(metrics.source, 'stdin.ccometixline.context_window');
    assert.strictEqual(metrics.remainingPct, 20);
    assert.strictEqual(metrics.remainingTokens, 40000);
    assert.ok(metrics.usagePct >= 95, 'remaining percentage should be normalized against auto-compact buffer');
  });
});

test('suggest compact output includes remaining context and compact count', () => {
  withTempState((stateDir) => {
    const env = {
      ...process.env,
      TSP_CONTEXT_STATE_DIR: stateDir,
      STRATEGIC_COMPACT_DISABLE_DEBOUNCE: '1',
    };

    spawnSync(process.execPath, [PRE_COMPACT], {
      input: JSON.stringify({ session_id: 'ctx-suggest-count', cwd: ROOT }),
      encoding: 'utf8',
      env,
    });

    const result = spawnSync(process.execPath, [SUGGEST], {
      input: JSON.stringify({
        hook_event_name: 'PreToolUse',
        session_id: 'ctx-suggest-count',
        cwd: ROOT,
        ccometixline_context_window: {
          remaining_percentage: 19,
          context_limit: 200000,
        },
      }),
      encoding: 'utf8',
      env,
    });

    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.trim(), 'expected compact suggestion');

    const output = JSON.parse(result.stdout);
    assert.strictEqual(output.compactSuggestion.context_source, 'stdin.ccometixline_context_window');
    assert.strictEqual(output.compactSuggestion.context_remaining_percentage, 19);
    assert.strictEqual(output.compactSuggestion.compact_count, 1);
    assert.ok(output.hookSpecificOutput.additionalContext.includes('compact count: 1'));
  });
});

test('pre-compact increments per-session and total compact counts', () => {
  withTempState((stateDir) => {
    const env = { ...process.env, TSP_CONTEXT_STATE_DIR: stateDir };
    const payload = JSON.stringify({ session_id: 'ctx-precompact', cwd: ROOT });

    const first = spawnSync(process.execPath, [PRE_COMPACT], { input: payload, encoding: 'utf8', env });
    const second = spawnSync(process.execPath, [PRE_COMPACT], { input: payload, encoding: 'utf8', env });

    assert.strictEqual(first.status, 0);
    assert.strictEqual(second.status, 0);

    const state = loadCompactState({ stateDir });
    assert.strictEqual(state.totalCompactCount, 2);
    assert.strictEqual(state.sessions['ctx-precompact'].compactCount, 2);
  });
});

if (failed > 0) {
  console.error(`\n${failed} context window runtime test(s) failed`);
  process.exit(1);
}

console.log(`\n${passed} context window runtime test(s) passed`);
