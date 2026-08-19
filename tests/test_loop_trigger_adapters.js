#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const EventEmitter = require('events');

const { BaseTriggerAdapter, TriggerAdapterError } = require('../scripts/lib/loop-trigger-adapters/base-adapter');
const { SessionAdapter } = require('../scripts/lib/loop-trigger-adapters/session-adapter');
const { ExternalAdapter } = require('../scripts/lib/loop-trigger-adapters/external-adapter');
const { EventAdapter } = require('../scripts/lib/loop-trigger-adapters/event-adapter');
const { createAdapter, createDefaultAdapter } = require('../scripts/lib/loop-trigger-adapters/index');
const { checkIntake, parseLoopSpecContent } = require('../scripts/lib/loop-spec');

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

function makeSpec(overrides = {}) {
  return {
    id: 'test-loop',
    description: 'Test loop',
    cadence: '30m',
    skill: 'test-skill',
    stateFile: '.tsp/loops/state/test.md',
    gates: [{ name: 'test', command: 'echo ok' }],
    maker: { role: 'backend-engineer', writeAccess: true },
    checker: { role: 'qa-engineer', writeAccess: false },
    budget: { maxIterations: 10, maxDuration: '2h', maxDollars: 5 },
    escalation: { onBudgetExhausted: 'triage', onSecurityFinding: 'human' },
    automation: { adapter: 'session', enabled: true, onMissedRun: 'triage' },
    metrics: null,
    ...overrides,
  };
}

// ============================================================
console.log('\n=== BaseTriggerAdapter ===');

test('_parseCadenceMs parses minutes', () => {
  const adapter = new SessionAdapter();
  assert.strictEqual(adapter._parseCadenceMs('5m'), 5 * 60 * 1000);
  assert.strictEqual(adapter._parseCadenceMs('30m'), 30 * 60 * 1000);
});

test('_parseCadenceMs parses hours', () => {
  const adapter = new SessionAdapter();
  assert.strictEqual(adapter._parseCadenceMs('1h'), 60 * 60 * 1000);
  assert.strictEqual(adapter._parseCadenceMs('2h'), 2 * 60 * 60 * 1000);
});

test('_parseCadenceMs parses days', () => {
  const adapter = new SessionAdapter();
  assert.strictEqual(adapter._parseCadenceMs('1d'), 24 * 60 * 60 * 1000);
});

test('_parseCadenceMs rejects invalid format', () => {
  const adapter = new SessionAdapter();
  assert.throws(() => adapter._parseCadenceMs('5x'), TriggerAdapterError);
  assert.throws(() => adapter._parseCadenceMs('abc'), TriggerAdapterError);
  assert.throws(() => adapter._parseCadenceMs(''), TriggerAdapterError);
});

// ============================================================
console.log('\n=== SessionAdapter ===');

test('SessionAdapter isAvailable returns true', () => {
  const adapter = new SessionAdapter();
  assert.strictEqual(adapter.isAvailable(), true);
});

test('SessionAdapter start/stop lifecycle', async () => {
  const adapter = new SessionAdapter();
  const spec = makeSpec();
  const events = [];

  await adapter.start(spec, async (event) => {
    events.push(event);
  });

  const status = adapter.getStatus('test-loop');
  assert.strictEqual(status.running, true);
  assert.strictEqual(status.adapter, 'session');
  assert.strictEqual(status.totalRuns, 0);

  await adapter.stop('test-loop');
  assert.strictEqual(adapter.getStatus('test-loop'), null);
});

test('SessionAdapter rejects duplicate registration', async () => {
  const adapter = new SessionAdapter();
  const spec = makeSpec();

  await adapter.start(spec, async () => {});
  await assert.rejects(
    () => adapter.start(spec, async () => {}),
    (err) => err.code === 'already_registered'
  );
  await adapter.stop('test-loop');
});

test('SessionAdapter stop is idempotent', async () => {
  const adapter = new SessionAdapter();
  await adapter.stop('nonexistent'); // should not throw
});

test('SessionAdapter stopAll clears all loops', async () => {
  const adapter = new SessionAdapter();
  await adapter.start(makeSpec({ id: 'loop-1' }), async () => {});
  await adapter.start(makeSpec({ id: 'loop-2', cadence: '1h' }), async () => {});

  assert.strictEqual(adapter.listStatuses().length, 2);
  await adapter.stopAll();
  assert.strictEqual(adapter.listStatuses().length, 0);
});

test('SessionAdapter runOnce triggers callback', async () => {
  const adapter = new SessionAdapter();
  const spec = makeSpec();
  let triggered = false;

  await adapter.start(spec, async (event) => {
    triggered = true;
    assert.strictEqual(event.triggerType, 'manual');
    assert.strictEqual(event.loopId, 'test-loop');
  });

  await adapter.runOnce('test-loop');
  assert.strictEqual(triggered, true);
  await adapter.stop('test-loop');
});

test('SessionAdapter runOnce rejects unregistered loop', async () => {
  const adapter = new SessionAdapter();
  await assert.rejects(
    () => adapter.runOnce('nonexistent'),
    (err) => err.code === 'not_registered'
  );
});

// ============================================================
console.log('\n=== ExternalAdapter ===');

test('ExternalAdapter isAvailable returns true', () => {
  const adapter = new ExternalAdapter();
  assert.strictEqual(adapter.isAvailable(), true);
});

test('ExternalAdapter start/stop lifecycle', async () => {
  withTempDir('ext-adapter-', (dir) => {
    process.env.TSP_LOOP_STATE_DIR = dir;
    const adapter = new ExternalAdapter();
    const spec = makeSpec();

    adapter.start(spec, async () => {});
    const status = adapter.getStatus('test-loop');
    assert.strictEqual(status.running, true);
    assert.strictEqual(status.adapter, 'external');
    assert.strictEqual(status.nextRun, null); // external 不预测下次执行

    adapter.stop('test-loop');
    assert.strictEqual(adapter.getStatus('test-loop'), null);
  });
});

test('ExternalAdapter generateSchedulerConfig produces valid output', () => {
  const adapter = new ExternalAdapter();
  const spec = makeSpec({ cadence: '30m' });

  const config = adapter.generateSchedulerConfig(spec);
  assert.strictEqual(config.cronExpression, '*/30 * * * *');
  assert.strictEqual(config.cliCommand, 'tsp loop run test-loop');
  assert.ok(config.ghActionsYaml.includes('tsp loop run test-loop'));
  assert.strictEqual(config.crontabLine, '*/30 * * * * tsp loop run test-loop');
});

test('ExternalAdapter _cadenceToCron handles various cadences', () => {
  const adapter = new ExternalAdapter();
  assert.strictEqual(adapter._cadenceToCron('1m'), '* * * * *');
  assert.strictEqual(adapter._cadenceToCron('5m'), '*/5 * * * *');
  assert.strictEqual(adapter._cadenceToCron('1h'), '0 * * * *');
  assert.strictEqual(adapter._cadenceToCron('2h'), '0 */2 * * *');
  assert.strictEqual(adapter._cadenceToCron('1d'), '0 0 * * *');
});

// ============================================================
console.log('\n=== EventAdapter ===');

test('EventAdapter isAvailable requires eventBus', () => {
  const adapter = new EventAdapter();
  assert.strictEqual(adapter.isAvailable(), false);

  const bus = new EventEmitter();
  const adapterWithBus = new EventAdapter(bus);
  assert.strictEqual(adapterWithBus.isAvailable(), true);
});

test('EventAdapter start/stop lifecycle with events', async () => {
  const bus = new EventEmitter();
  const adapter = new EventAdapter(bus);
  const spec = makeSpec();
  const events = [];

  adapter.registerTrigger('test-loop', {
    events: ['pr:merged'],
  });

  await adapter.start(spec, async (event) => {
    events.push(event);
  });

  const status = adapter.getStatus('test-loop');
  assert.strictEqual(status.running, true);
  assert.deepStrictEqual(status.listeningEvents, ['pr:merged']);

  // 触发事件
  bus.emit('pr:merged', { branch: 'main', pr: 42 });
  // 等待异步处理
  await new Promise(resolve => setTimeout(resolve, 10));

  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].triggerType, 'event');
  assert.strictEqual(events[0].metadata.eventName, 'pr:merged');

  await adapter.stop('test-loop');
  assert.strictEqual(adapter.getStatus('test-loop'), null);
});

test('EventAdapter filter blocks non-matching events', async () => {
  const bus = new EventEmitter();
  const adapter = new EventAdapter(bus);
  const spec = makeSpec();
  const events = [];

  adapter.registerTrigger('test-loop', {
    events: ['pr:merged'],
    filter: (data) => data.branch === 'main',
  });

  await adapter.start(spec, async (event) => {
    events.push(event);
  });

  bus.emit('pr:merged', { branch: 'feature-x' }); // 应被过滤
  bus.emit('pr:merged', { branch: 'main' });       // 应通过
  await new Promise(resolve => setTimeout(resolve, 10));

  assert.strictEqual(events.length, 1);
  await adapter.stop('test-loop');
});

test('EventAdapter rejects start without registerTrigger', async () => {
  const bus = new EventEmitter();
  const adapter = new EventAdapter(bus);
  const spec = makeSpec();

  await assert.rejects(
    () => adapter.start(spec, async () => {}),
    (err) => err.code === 'no_events'
  );
});

// ============================================================
console.log('\n=== createAdapter / createDefaultAdapter ===');

test('createAdapter creates correct type', () => {
  const session = createAdapter('session');
  assert.ok(session instanceof SessionAdapter);

  const external = createAdapter('external');
  assert.ok(external instanceof ExternalAdapter);

  const bus = new EventEmitter();
  const event = createAdapter('event', { eventBus: bus });
  assert.ok(event instanceof EventAdapter);

  assert.throws(() => createAdapter('unknown'), TriggerAdapterError);
});

test('createDefaultAdapter returns SessionAdapter when available', () => {
  const adapter = createDefaultAdapter();
  assert.ok(adapter instanceof SessionAdapter);
});

// ============================================================
console.log('\n=== checkIntake ===');

test('checkIntake passes for valid spec', () => {
  const spec = makeSpec();
  const result = checkIntake(spec);
  assert.strictEqual(result.eligible, true);
  assert.strictEqual(result.taskRepeats, true);
  assert.strictEqual(result.automatedVerification, true);
  assert.strictEqual(result.budgetDefined, true);
  assert.strictEqual(result.toolAccessBounded, true);
  assert.strictEqual(result.blockers.length, 0);
  assert.strictEqual(result.recommendedAlternative, '');
});

test('checkIntake fails when cadence is missing', () => {
  const spec = makeSpec({ cadence: '' });
  const result = checkIntake(spec);
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.taskRepeats, false);
  assert.ok(result.blockers.some(b => b.includes('cadence')));
});

test('checkIntake fails when gates are empty', () => {
  const spec = makeSpec({ gates: [] });
  const result = checkIntake(spec);
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.automatedVerification, false);
  assert.ok(result.blockers.some(b => b.includes('gates')));
});

test('checkIntake fails when budget is missing limits', () => {
  const spec = makeSpec({ budget: { maxIterations: 0, maxDuration: '2h', maxDollars: 5 } });
  const result = checkIntake(spec);
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.budgetDefined, false);
});

test('checkIntake fails when maker role is missing', () => {
  const spec = makeSpec({ maker: { role: '', writeAccess: true } });
  const result = checkIntake(spec);
  assert.strictEqual(result.eligible, false);
  assert.strictEqual(result.toolAccessBounded, false);
});

test('checkIntake recommends /quick when no cadence and no gates', () => {
  const spec = makeSpec({ cadence: '', gates: [] });
  const result = checkIntake(spec);
  assert.strictEqual(result.recommendedAlternative, '/quick');
});

test('checkIntake recommends /goal when budget is missing', () => {
  const spec = makeSpec({ budget: { maxIterations: 0, maxDuration: '2h', maxDollars: 0 } });
  const result = checkIntake(spec);
  assert.strictEqual(result.recommendedAlternative, '/goal');
});

// ============================================================
console.log('\n=== parseLoopSpecContent with automation ===');

test('parseLoopSpecContent accepts automation field', () => {
  const yaml = `
loop:
  id: test-loop
  description: Test
  cadence: 30m
  skill: test-skill
  stateFile: .tsp/loops/state/test.md
  gates:
    - name: test
      command: echo ok
  maker:
    role: backend-engineer
    writeAccess: true
  checker:
    role: qa-engineer
    writeAccess: false
  budget:
    maxIterations: 10
    maxDuration: 2h
    maxDollars: 5
  automation:
    adapter: external
    enabled: true
    onMissedRun: catch-up
  metrics:
    acceptedChangeRateMin: 0.6
    reviewWindowHours: 24
`;
  const spec = parseLoopSpecContent(yaml);
  assert.strictEqual(spec.automation.adapter, 'external');
  assert.strictEqual(spec.automation.onMissedRun, 'catch-up');
  assert.strictEqual(spec.metrics.acceptedChangeRateMin, 0.6);
  assert.strictEqual(spec.metrics.reviewWindowHours, 24);
});

test('parseLoopSpecContent defaults automation when omitted', () => {
  const yaml = `
loop:
  id: test-loop
  description: Test
  cadence: 30m
  skill: test-skill
  stateFile: .tsp/loops/state/test.md
  gates:
    - name: test
      command: echo ok
  maker:
    role: backend-engineer
    writeAccess: true
  checker:
    role: qa-engineer
    writeAccess: false
  budget:
    maxIterations: 10
    maxDuration: 2h
    maxDollars: 5
`;
  const spec = parseLoopSpecContent(yaml);
  assert.strictEqual(spec.automation.adapter, 'session');
  assert.strictEqual(spec.automation.enabled, true);
  assert.strictEqual(spec.automation.onMissedRun, 'triage');
  assert.strictEqual(spec.metrics, null);
});

// ============================================================
// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Trigger adapter tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
