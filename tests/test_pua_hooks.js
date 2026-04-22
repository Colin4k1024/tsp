#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const puaState = require('../scripts/lib/pua-state');

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

function createTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pua-hooks-test-'));
}

function cleanupTempHome(tempHome) {
  fs.rmSync(tempHome, { recursive: true, force: true });
}

function withTempHome(fn) {
  const tempHome = createTempHome();

  try {
    fn(tempHome);
  } finally {
    cleanupTempHome(tempHome);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getPuaDir(tempHome) {
  return path.join(tempHome, '.claude', 'pua');
}

function getConfigPath(tempHome) {
  return path.join(getPuaDir(tempHome), 'config.json');
}

function getStatePath(tempHome) {
  return path.join(getPuaDir(tempHome), 'state.json');
}

function getJournalPath(tempHome) {
  return path.join(getPuaDir(tempHome), 'builder-journal.md');
}

function ensurePuaDir(tempHome) {
  fs.mkdirSync(getPuaDir(tempHome), { recursive: true });
}

function writeConfig(tempHome, config) {
  ensurePuaDir(tempHome);
  fs.writeFileSync(
    getConfigPath(tempHome),
    `${JSON.stringify({ ...puaState.DEFAULT_CONFIG, ...config }, null, 2)}\n`,
    'utf8'
  );
}

function writeState(tempHome, state) {
  ensurePuaDir(tempHome);
  fs.writeFileSync(
    getStatePath(tempHome),
    `${JSON.stringify({ ...puaState.DEFAULT_STATE, ...state }, null, 2)}\n`,
    'utf8'
  );
}

function runHook(scriptRelativePath, tempHome, input) {
  return spawnSync(
    process.execPath,
    [path.join(__dirname, '..', scriptRelativePath)],
    {
      input,
      encoding: 'utf8',
      env: {
        PATH: process.env.PATH || '',
        TMPDIR: process.env.TMPDIR || os.tmpdir(),
        HOME: tempHome,
        USERPROFILE: tempHome,
      },
    }
  );
}

function readJournal(tempHome) {
  return fs.readFileSync(getJournalPath(tempHome), 'utf8');
}

console.log('PUA hooks tests');

test('levelFromFailures maps thresholds correctly', () => {
  assert.strictEqual(puaState.levelFromFailures(0), 'L0');
  assert.strictEqual(puaState.levelFromFailures(1), 'L0');
  assert.strictEqual(puaState.levelFromFailures(2), 'L1');
  assert.strictEqual(puaState.levelFromFailures(3), 'L2');
  assert.strictEqual(puaState.levelFromFailures(4), 'L3');
  assert.strictEqual(puaState.levelFromFailures(5), 'L4');
  assert.strictEqual(puaState.levelFromFailures(8), 'L4');
});

test('failure hook increments count and computes escalation level', () => {
  withTempHome((tempHome) => {
    writeConfig(tempHome, { flavor: 'huawei' });

    const payload = JSON.stringify({
      tool_name: 'Bash',
      error: { message: 'command failed badly' },
    });

    const result1 = runHook('scripts/hooks/pua-post-tool-failure.js', tempHome, payload);
    const result2 = runHook('scripts/hooks/pua-post-tool-failure.js', tempHome, payload);
    const result3 = runHook('scripts/hooks/pua-post-tool-failure.js', tempHome, payload);

    assert.strictEqual(result1.status, 0);
    assert.strictEqual(result2.status, 0);
    assert.strictEqual(result3.status, 0);
    assert.ok(result1.stderr.includes('记录到一次失败'));
    assert.ok(result2.stderr.includes('第 2 次失败'));
    assert.ok(result3.stderr.includes('第 3 次失败'));

    const state = readJson(getStatePath(tempHome));
    assert.strictEqual(state.failure_count, 3);
    assert.strictEqual(state.level, 'L2');
    assert.strictEqual(state.last_tool, 'Bash');
    assert.ok(state.last_reason.includes('command failed badly'));
    assert.strictEqual(state.route, 'huawei');
  });
});

test('success hook resets failure counter after prior failures', () => {
  withTempHome((tempHome) => {
    writeState(tempHome, {
      failure_count: 4,
      level: 'L3',
      last_tool: 'Edit',
      route: 'alibaba',
    });

    const result = runHook('scripts/hooks/pua-post-tool-use.js', tempHome, JSON.stringify({ tool_name: 'Write' }));

    assert.strictEqual(result.status, 0);
    assert.ok(result.stderr.includes('failure counter reset'));

    const state = readJson(getStatePath(tempHome));
    assert.strictEqual(state.failure_count, 0);
    assert.strictEqual(state.level, 'L0');
    assert.strictEqual(state.last_tool, 'Write');
    assert.ok(state.last_success_at, 'expected last_success_at to be recorded');
    assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(state.last_success_at), 'last_success_at should be ISO 8601 timestamp');
  });
});

test('pre-compact hook appends journal snapshot', () => {
  withTempHome((tempHome) => {
    writeConfig(tempHome, { always_on: true, flavor: 'mama' });
    writeState(tempHome, { failure_count: 2, level: 'L1', last_tool: 'MultiEdit' });

    const result1 = runHook('scripts/hooks/pua-pre-compact.js', tempHome, '{}');
    const result2 = runHook('scripts/hooks/pua-pre-compact.js', tempHome, '{}');

    assert.strictEqual(result1.status, 0);
    assert.strictEqual(result2.status, 0);

    const journal = readJournal(tempHome);
    const sections = journal.split(/\n## Compaction /);
    assert.ok(journal.startsWith('# PUA Builder Journal\n'));
    assert.strictEqual(sections.length - 1, 2, 'expected exactly 2 compaction entries');
    sections.slice(1).forEach((section) => {
      assert.ok(section.includes('- flavor: mama'));
      assert.ok(section.includes('- failure_count: 2'));
      assert.ok(section.includes('- last_tool: MultiEdit'));
    });
  });
});

test('stop hook writes journal only when always_on or failures exist', () => {
  withTempHome((tempHome) => {
    let result = runHook('scripts/hooks/pua-stop.js', tempHome, '{}');
    assert.strictEqual(result.status, 0);
    assert.ok(!fs.existsSync(getJournalPath(tempHome)), 'journal should stay absent when disabled and clean');

    writeConfig(tempHome, { always_on: true, flavor: 'yes' });
    writeState(tempHome, { failure_count: 0, level: 'L0', route: 'yes', last_reason: 'all good' });
    result = runHook('scripts/hooks/pua-stop.js', tempHome, '{}');
    assert.strictEqual(result.status, 0);

    let journal = readJournal(tempHome);
    assert.ok(journal.includes('## Stop'));
    assert.ok(journal.includes('- always_on: true'));
    assert.ok(journal.includes('- flavor: yes'));

    writeConfig(tempHome, { always_on: false, flavor: 'alibaba' });
    writeState(tempHome, { failure_count: 1, level: 'L0', route: 'alibaba', last_reason: '中'.repeat(400) });
    result = runHook('scripts/hooks/pua-stop.js', tempHome, '{}');
    assert.strictEqual(result.status, 0);

    journal = readJournal(tempHome);
    const lines = journal.split('\n').filter(line => line.startsWith('- last_reason: '));
    const lastLine = lines[lines.length - 1];
    const reasonText = lastLine.replace(/^- last_reason: /, '');
    assert.ok(reasonText.length <= 280, `reason should be truncated to max 280 chars, got ${reasonText.length}`);
  });
});

test('hooks preserve input and log malformed payload errors to stderr', () => {
  withTempHome((tempHome) => {
    const malformed = '{not-json';
    const failureResult = runHook('scripts/hooks/pua-post-tool-failure.js', tempHome, malformed);
    const successResult = runHook('scripts/hooks/pua-post-tool-use.js', tempHome, malformed);

    assert.strictEqual(failureResult.status, 0);
    assert.strictEqual(successResult.status, 0);
    assert.strictEqual(failureResult.stdout, malformed);
    assert.strictEqual(successResult.stdout, malformed);
    assert.ok(failureResult.stderr.includes('failure escalation skipped'));
    assert.ok(successResult.stderr.includes('success reset skipped'));
    assert.ok(!fs.existsSync(getStatePath(tempHome)), 'malformed payload should not create state file');

    const recoveryResult = runHook('scripts/hooks/pua-post-tool-failure.js', tempHome, JSON.stringify({
      tool_name: 'Bash',
      error: { message: 'recover after malformed payload' },
    }));
    assert.strictEqual(recoveryResult.status, 0);
    assert.ok(recoveryResult.stderr.includes('记录到一次失败'));

    const state = readJson(getStatePath(tempHome));
    assert.strictEqual(state.failure_count, 1);
  });
});

console.log(`\nPUA hooks: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
