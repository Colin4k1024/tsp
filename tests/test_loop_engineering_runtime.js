#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const loopStateStore = require('../scripts/lib/loop-state-store');
const completionOracle = require('../scripts/lib/completion-oracle');
const heartbeat = require('../scripts/lib/heartbeat-scheduler');
const { LoopSpecError, parseLoopSpecContent } = require('../scripts/lib/loop-spec');

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
    console.error(`    ${error.stack || error.message}`);
  }
}

function withTempDir(prefix, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const previous = {
    HOME: process.env.HOME,
    USERPROFILE: process.env.USERPROFILE,
    TSP_LOOP_STATE_DIR: process.env.TSP_LOOP_STATE_DIR,
    TSP_LOOP_TARGET: process.env.TSP_LOOP_TARGET,
  };

  try {
    fn(dir);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Loop engineering runtime tests');

test('state store writes goals to TSP_LOOP_STATE_DIR', () => {
  withTempDir('loop-state-', (dir) => {
    process.env.TSP_LOOP_STATE_DIR = path.join(dir, 'state');

    const goal = completionOracle.createGoal('fix tests', {
      stoppingConditions: [{
        type: 'custom_command',
        command: 'node -e "process.exit(0)" 2>&1; echo EXIT:$?',
        description: 'custom pass',
      }],
    });
    const savedPath = completionOracle.saveGoal(goal);

    assert.strictEqual(savedPath, path.join(dir, 'state', 'goals', `${goal.goalId}.json`));
    assert.ok(fs.existsSync(savedPath));
    assert.strictEqual(completionOracle.loadGoal(goal.goalId).objective, 'fix tests');
  });
});

test('state store can read legacy Claude goals without copying them', () => {
  withTempDir('loop-legacy-', (dir) => {
    process.env.HOME = dir;
    process.env.USERPROFILE = dir;
    process.env.TSP_LOOP_STATE_DIR = path.join(dir, 'new-state');

    const legacyGoal = {
      goalId: 'goal-legacy',
      objective: 'legacy objective',
      state: 'active',
      currentIteration: 1,
      budget: { maxIterations: 3 },
      updatedAt: '2026-06-30T00:00:00.000Z',
      history: [],
    };
    writeFile(path.join(dir, '.claude', 'goals', 'goal-legacy.json'), JSON.stringify(legacyGoal));

    const goals = completionOracle.listGoals('active');
    assert.strictEqual(goals.length, 1);
    assert.strictEqual(goals[0].goalId, 'goal-legacy');
  });
});

test('heartbeat adapts .tsp loop spec gates into discovery scans', () => {
  withTempDir('loop-heartbeat-', (dir) => {
    process.env.TSP_LOOP_STATE_DIR = path.join(dir, 'state');
    const projectRoot = path.join(dir, 'project');
    const loopSpecPath = path.join(projectRoot, '.tsp', 'loop.yaml');
    writeFile(loopSpecPath, [
      'loop:',
      '  id: ci-triage',
      '  description: Keep CI failures triaged.',
      '  cadence: 30m',
      '  skill: loop-ci-triage',
      '  stateFile: .tsp/loops/state/ci-triage.md',
      '  gates:',
      '    - name: failing-gate',
      '      command: node -e "process.exit(1)"',
      '      description: Synthetic failing gate',
      '  maker:',
      '    role: backend-engineer',
      '    writeAccess: true',
      '  checker:',
      '    role: qa-engineer',
      '    writeAccess: false',
      '  budget:',
      '    maxIterations: 2',
      '    maxDuration: 1h',
      '    maxDollars: 1',
    ].join('\n'));

    const status = heartbeat.getHeartbeatStatus(projectRoot);
    assert.strictEqual(status.configured, true);
    assert.strictEqual(status.interval, '30m');
    assert.deepStrictEqual(status.scans.map(scan => scan.name), ['failing-gate']);

    const result = heartbeat.runHeartbeat(projectRoot);
    assert.strictEqual(result.status, 'issues_found');
    assert.strictEqual(result.results[0].action, 'auto-goal');
    assert.ok(result.results[0].goalId.startsWith('goal-'));

    const goals = completionOracle.listGoals('active');
    assert.strictEqual(goals.length, 1);
    assert.ok(goals[0].objective.includes('Synthetic failing gate'));
  });
});

test('loop spec rejects missing hard gates', () => {
  assert.throws(
    () => parseLoopSpecContent([
      'loop:',
      '  id: bad-loop',
      '  description: Missing gates.',
      '  cadence: 30m',
      '  skill: loop-ci-triage',
      '  stateFile: .tsp/loops/state/bad-loop.md',
      '  gates: []',
      '  maker:',
      '    role: backend-engineer',
      '    writeAccess: true',
      '  checker:',
      '    role: qa-engineer',
      '    writeAccess: false',
      '  budget:',
      '    maxIterations: 2',
      '    maxDuration: 1h',
      '    maxDollars: 1',
    ].join('\n')),
    (error) => error instanceof LoopSpecError && error.code === 'missing_gates'
  );
});

test('session-start resume hook reads target-neutral goals', () => {
  withTempDir('loop-session-', (dir) => {
    process.env.TSP_LOOP_STATE_DIR = path.join(dir, 'state');
    loopStateStore.saveGoal({
      goalId: 'goal-active',
      objective: 'finish loop implementation',
      state: 'active',
      currentIteration: 2,
      budget: { maxIterations: 5 },
      updatedAt: '2026-06-30T00:00:00.000Z',
      history: [{ nextHint: 'run focused tests' }],
    });

    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, '..', 'scripts', 'hooks', 'session-start-goal-resume.js')],
      {
        input: '{}',
        encoding: 'utf8',
        env: {
          ...process.env,
          TSP_LOOP_STATE_DIR: process.env.TSP_LOOP_STATE_DIR,
        },
      }
    );

    assert.strictEqual(result.status, 0);
    const payload = JSON.parse(result.stdout);
    assert.ok(payload.additionalContext.includes('goal-active'));
    assert.ok(payload.additionalContext.includes('/goal resume'));
  });
});

console.log(`\nLoop engineering runtime: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
