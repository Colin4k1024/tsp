/**
 * Tests for Reporter — Markdown report generation.
 */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Reporter } = require('../lib/reporter');
const { StateStore } = require('../lib/state-store');
const path = require('path');
const fs = require('fs');

const TEST_ROOT = path.join(__dirname, 'test_artifacts_reporter');
const TEST_STATE_FILE = path.join(TEST_ROOT, 'SHARED_TASK_NOTES.md');

function createTestStateStore() {
  return new StateStore(TEST_STATE_FILE);
}

describe('Reporter', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_ROOT)) {
      fs.rmSync(TEST_ROOT, { recursive: true });
    }
    fs.mkdirSync(TEST_ROOT, { recursive: true });
  });

  test('generateReport returns a string even for empty tasks', () => {
    const reporter = new Reporter();
    const stateStore = createTestStateStore();
    stateStore.save();

    const manifest = { tasks: [], model: 'sonnet', name: 'Test' };
    const timing = { startedAt: new Date(), completedAt: new Date() };

    const report = reporter.generateReport(stateStore, manifest, timing);
    assert.strictEqual(typeof report, 'string');
    assert.ok(report.includes('PURE HOST EXECUTION REPORT'));
  });

  test('generateReport includes header', () => {
    const reporter = new Reporter();
    const stateStore = createTestStateStore();
    stateStore.setTask('task-1', { status: 'pending' });
    stateStore.save();

    const manifest = {
      tasks: [{ taskId: 'task-1', description: 'Test task', name: 'Task 1' }],
      model: 'sonnet',
      name: 'Test Manifest',
      _sourceDir: '/test/path',
    };
    const timing = { startedAt: new Date('2024-01-01T10:00:00Z'), completedAt: new Date('2024-01-01T10:30:00Z') };

    const report = reporter.generateReport(stateStore, manifest, timing);

    assert.ok(report.includes('PURE HOST EXECUTION REPORT'));
    assert.ok(report.includes('Test Manifest'));
    assert.ok(report.includes('sonnet'));
  });

  test('generateReport includes task summary with status icons', () => {
    const reporter = new Reporter();
    const stateStore = createTestStateStore();
    stateStore.setTask('task-1', { status: 'completed', attempts: 1, duration: 60000 });
    stateStore.setTask('task-2', { status: 'blocked' });
    stateStore.setTask('task-3', { status: 'pending' });
    stateStore.save();

    const manifest = {
      tasks: [
        { taskId: 'task-1', description: 'Completed task' },
        { taskId: 'task-2', description: 'Blocked task' },
        { taskId: 'task-3', description: 'Pending task' },
      ],
      model: 'sonnet',
    };
    const timing = { startedAt: new Date(), completedAt: new Date() };

    const report = reporter.generateReport(stateStore, manifest, timing);

    assert.ok(report.includes('✓ task-1')); // Completed icon
    assert.ok(report.includes('⊘ task-2')); // Blocked icon
    assert.ok(report.includes('○ task-3')); // Pending icon
    assert.ok(report.includes('TASK SUMMARY'));
  });

  test('generateReport shows blockers section', () => {
    const reporter = new Reporter();
    const stateStore = createTestStateStore();
    stateStore.setTask('task-1', {
      status: 'blocked',
      blockedReason: 'Failed after 3 attempts',
      error: { type: 'Error', message: 'test error' },
    });
    stateStore.save();

    const manifest = {
      tasks: [{ taskId: 'task-1', description: 'Blocked task' }],
      model: 'sonnet',
    };
    const timing = { startedAt: new Date(), completedAt: new Date() };

    const report = reporter.generateReport(stateStore, manifest, timing);

    assert.ok(report.includes('BLOCKERS'));
    assert.ok(report.includes('Failed after 3 attempts'));
    assert.ok(report.includes('test error'));
  });

  test('generateReport shows (none) when no blockers', () => {
    const reporter = new Reporter();
    const stateStore = createTestStateStore();
    stateStore.setTask('task-1', { status: 'completed' });
    stateStore.save();

    const manifest = {
      tasks: [{ taskId: 'task-1' }],
      model: 'sonnet',
    };
    const timing = { startedAt: new Date(), completedAt: new Date() };

    const report = reporter.generateReport(stateStore, manifest, timing);

    assert.ok(report.includes('BLOCKERS'));
    assert.ok(report.includes('(none)'));
  });

  test('generateReport shows revert points', () => {
    const reporter = new Reporter();
    const stateStore = createTestStateStore();
    stateStore.setTask('task-1', {
      status: 'completed',
      revertPoint: 'abc123def456',
    });
    stateStore.save();

    const manifest = {
      tasks: [{ taskId: 'task-1' }],
      model: 'sonnet',
    };
    const timing = { startedAt: new Date(), completedAt: new Date() };

    const report = reporter.generateReport(stateStore, manifest, timing);

    assert.ok(report.includes('REVERT POINTS'));
    assert.ok(report.includes('abc123def456'));
  });

  test('generateReport shows next steps', () => {
    const reporter = new Reporter();
    const stateStore = createTestStateStore();
    stateStore.setTask('task-1', { status: 'completed' });
    stateStore.setTask('task-2', { status: 'pending' });
    stateStore.save();

    const manifest = {
      tasks: [
        { taskId: 'task-1' },
        { taskId: 'task-2' },
      ],
      model: 'sonnet',
    };
    const timing = { startedAt: new Date(), completedAt: new Date() };

    const report = reporter.generateReport(stateStore, manifest, timing);

    assert.ok(report.includes('NEXT STEPS'));
    assert.ok(report.includes('--resume'));
  });

  test('_statusIcon returns correct icons', () => {
    const reporter = new Reporter();

    assert.strictEqual(reporter._statusIcon('completed'), '✓');
    assert.strictEqual(reporter._statusIcon('blocked'), '⊘');
    assert.strictEqual(reporter._statusIcon('in-progress'), '◐');
    assert.strictEqual(reporter._statusIcon('pending'), '○');
    assert.strictEqual(reporter._statusIcon('unknown'), '○'); // Default
  });

  test('_formatDuration handles hours and minutes', () => {
    const reporter = new Reporter();

    const result1 = reporter._formatDuration(
      new Date('2024-01-01T10:00:00Z'),
      new Date('2024-01-01T11:30:00Z')
    );
    assert.strictEqual(result1, '1h 30m');

    const result2 = reporter._formatDuration(
      new Date('2024-01-01T10:00:00Z'),
      new Date('2024-01-01T10:45:00Z')
    );
    assert.strictEqual(result2, '45m');

    const result3 = reporter._formatDuration(
      new Date('2024-01-01T10:00:00Z'),
      new Date('2024-01-01T12:00:00Z')
    );
    assert.strictEqual(result3, '2h 0m');
  });

  test('_formatMs converts to minutes', () => {
    const reporter = new Reporter();

    assert.strictEqual(reporter._formatMs(60000), '1m');
    assert.strictEqual(reporter._formatMs(120000), '2m');
    assert.strictEqual(reporter._formatMs(90000), '1m'); // Rounds down
  });

  test('_formatDate formats correctly', () => {
    const reporter = new Reporter();
    const result = reporter._formatDate(new Date('2024-01-15T14:30:45.123Z'));
    assert.strictEqual(result, '2024-01-15 14:30:45');
  });

  test('_formatTaskRow truncates long descriptions', () => {
    const reporter = new Reporter();
    const task = { taskId: 'task-1', description: 'This is a very long description that exceeds thirty characters' };
    const state = { status: 'pending' };

    const result = reporter._formatTaskRow(task, state, null);
    assert.ok(result.includes('...'));
    assert.ok(result.includes('task-1'));
  });

  test('generateReport handles duration IN PROGRESS', () => {
    const reporter = new Reporter();
    const stateStore = createTestStateStore();
    stateStore.setTask('task-1', { status: 'in-progress' });
    stateStore.save();

    const manifest = {
      tasks: [{ taskId: 'task-1' }],
      model: 'sonnet',
    };
    const timing = { startedAt: new Date() }; // No completedAt

    const report = reporter.generateReport(stateStore, manifest, timing);

    assert.ok(report.includes('IN PROGRESS'));
  });
});
