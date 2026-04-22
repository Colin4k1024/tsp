/**
 * Tests for StateStore — execution state persistence.
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { StateStore, STATE_FILE } = require('../lib/state-store');

const TEST_ROOT = path.join(__dirname, 'test_artifacts');
const TEST_STATE_FILE = path.join(TEST_ROOT, 'SHARED_TASK_NOTES.md');

function createFreshStateStore() {
  return new StateStore(TEST_STATE_FILE);
}

describe('StateStore', () => {
  beforeEach(() => {
    // Clean up test artifacts
    if (fs.existsSync(TEST_STATE_FILE)) {
      fs.unlinkSync(TEST_STATE_FILE);
    }
    if (fs.existsSync(TEST_ROOT)) {
      fs.rmSync(TEST_ROOT, { recursive: true });
    }
    fs.mkdirSync(TEST_ROOT, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_STATE_FILE)) {
      fs.unlinkSync(TEST_STATE_FILE);
    }
    if (fs.existsSync(TEST_ROOT)) {
      fs.rmSync(TEST_ROOT, { recursive: true });
    }
  });

  test('starts with empty state', () => {
    const store = createFreshStateStore();
    assert.deepStrictEqual(store.tasks, new Map());
    assert.deepStrictEqual(store.globalState.completedTasks, []);
    assert.deepStrictEqual(store.globalState.blockedTasks, []);
  });

  test('setTask and getTask work correctly', () => {
    const store = createFreshStateStore();
    store.setTask('task-1', { status: 'pending', description: 'Test task' });
    const task = store.getTask('task-1');
    assert.strictEqual(task.taskId, 'task-1');
    assert.strictEqual(task.status, 'pending');
    assert.strictEqual(task.description, 'Test task');
  });

  test('setTask merges with existing state', () => {
    const store = createFreshStateStore();
    store.setTask('task-1', { status: 'pending', description: 'Test' });
    store.setTask('task-1', { status: 'in-progress' });
    const task = store.getTask('task-1');
    assert.strictEqual(task.status, 'in-progress');
    assert.strictEqual(task.description, 'Test'); // Preserved
  });

  test('getTask returns null for unknown task', () => {
    const store = createFreshStateStore();
    assert.strictEqual(store.getTask('unknown'), null);
  });

  test('getAllTasks returns all tasks as array', () => {
    const store = createFreshStateStore();
    store.setTask('task-1', { status: 'pending' });
    store.setTask('task-2', { status: 'pending' });
    const tasks = store.getAllTasks();
    assert.strictEqual(tasks.length, 2);
  });

  test('completeTask marks task complete and updates global state', () => {
    const store = createFreshStateStore();
    store.setTask('task-1', { status: 'in-progress' });
    store.completeTask('task-1');
    const task = store.getTask('task-1');
    assert.strictEqual(task.status, 'completed');
    assert.ok(store.globalState.completedTasks.includes('task-1'));
    assert.strictEqual(store.globalState.currentTask, null);
  });

  test('completeTask does not duplicate in completedTasks', () => {
    const store = createFreshStateStore();
    store.setTask('task-1', { status: 'in-progress' });
    store.completeTask('task-1');
    store.completeTask('task-1');
    assert.strictEqual(store.globalState.completedTasks.filter(t => t === 'task-1').length, 1);
  });

  test('blockTask marks task blocked with reason', () => {
    const store = createFreshStateStore();
    store.setTask('task-1', { status: 'in-progress' });
    store.blockTask('task-1', 'Failed after 3 attempts', { type: 'Error', message: 'test' });
    const task = store.getTask('task-1');
    assert.strictEqual(task.status, 'blocked');
    assert.strictEqual(task.blockedReason, 'Failed after 3 attempts');
    assert.strictEqual(task.error.type, 'Error');
    assert.ok(store.globalState.blockedTasks.includes('task-1'));
  });

  test('startTask marks task in-progress', () => {
    const store = createFreshStateStore();
    store.startTask('task-1');
    const task = store.getTask('task-1');
    assert.strictEqual(task.status, 'in-progress');
    assert.strictEqual(store.globalState.currentTask, 'task-1');
    assert.ok(task.startedAt);
  });

  test('save and load persists state correctly', () => {
    const store1 = createFreshStateStore();
    store1.setTask('task-1', { status: 'completed', description: 'Test' });
    store1.completeTask('task-1');
    store1.save();

    const store2 = createFreshStateStore();
    store2.load();
    const task = store2.getTask('task-1');
    assert.strictEqual(task.status, 'completed');
    assert.strictEqual(task.description, 'Test');
    assert.ok(store2.globalState.completedTasks.includes('task-1'));
  });

  test('load handles missing file gracefully', () => {
    const store = createFreshStateStore();
    store.load(); // Should not throw
    assert.deepStrictEqual(store.tasks, new Map());
  });

  test('load handles corrupted frontmatter gracefully', () => {
    fs.writeFileSync(TEST_STATE_FILE, '# SHARED TASK NOTES\n\nnot valid frontmatter', 'utf-8');
    const store = createFreshStateStore();
    store.load(); // Should not throw
    assert.deepStrictEqual(store.tasks, new Map());
  });

  test('updatedAt is set on each setTask call', () => {
    const store = createFreshStateStore();
    store.setTask('task-1', { status: 'pending' });
    const task = store.getTask('task-1');
    assert.ok(task.updatedAt);
  });
});
