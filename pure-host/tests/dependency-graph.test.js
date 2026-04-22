/**
 * Tests for DependencyGraph — DAG and topological sort.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const { DependencyGraph } = require('../lib/dependency-graph');

describe('DependencyGraph', () => {
  test('topologicalSort returns correct order for linear dependencies', () => {
    const tasks = [
      { taskId: 'a', dependsOn: [] },
      { taskId: 'b', dependsOn: ['a'] },
      { taskId: 'c', dependsOn: ['b'] },
    ];
    const graph = new DependencyGraph(tasks);
    const sorted = graph.topologicalSort();
    assert.deepStrictEqual(sorted, ['a', 'b', 'c']);
  });

  test('topologicalSort handles parallel tasks', () => {
    const tasks = [
      { taskId: 'a', dependsOn: [] },
      { taskId: 'b', dependsOn: [] },
      { taskId: 'c', dependsOn: ['a', 'b'] },
    ];
    const graph = new DependencyGraph(tasks);
    const sorted = graph.topologicalSort();
    // a and b can be in any order, but c must be last
    assert.strictEqual(sorted[2], 'c');
    assert.deepStrictEqual(sorted.slice(0, 2).sort(), ['a', 'b']);
  });

  test('topologicalSort handles diamond dependencies', () => {
    const tasks = [
      { taskId: 'a', dependsOn: [] },
      { taskId: 'b', dependsOn: ['a'] },
      { taskId: 'c', dependsOn: ['a'] },
      { taskId: 'd', dependsOn: ['b', 'c'] },
    ];
    const graph = new DependencyGraph(tasks);
    const sorted = graph.topologicalSort();
    const aIdx = sorted.indexOf('a');
    const bIdx = sorted.indexOf('b');
    const cIdx = sorted.indexOf('c');
    const dIdx = sorted.indexOf('d');
    // a must be before b, c, and d
    assert.ok(aIdx < bIdx);
    assert.ok(aIdx < cIdx);
    assert.ok(aIdx < dIdx);
    // d must be after b and c
    assert.ok(dIdx > bIdx);
    assert.ok(dIdx > cIdx);
  });

  test('topologicalSort throws on circular dependency', () => {
    const tasks = [
      { taskId: 'a', dependsOn: ['b'] },
      { taskId: 'b', dependsOn: ['a'] },
    ];
    const graph = new DependencyGraph(tasks);
    assert.throws(() => graph.topologicalSort(), /Circular dependency/);
  });

  test('topologicalSort throws on self-referential task', () => {
    const tasks = [
      { taskId: 'a', dependsOn: ['a'] },
    ];
    const graph = new DependencyGraph(tasks);
    assert.throws(() => graph.topologicalSort(), /Circular dependency/);
  });

  test('topologicalSort throws on unknown dependency', () => {
    const tasks = [
      { taskId: 'a', dependsOn: ['unknown'] },
    ];
    // Error is thrown during construction when adding edge
    assert.throws(() => new DependencyGraph(tasks), /Unknown task/);
  });

  test('getPredecessors returns direct dependencies', () => {
    const tasks = [
      { taskId: 'a', dependsOn: [] },
      { taskId: 'b', dependsOn: ['a'] },
      { taskId: 'c', dependsOn: ['a', 'b'] },
    ];
    const graph = new DependencyGraph(tasks);
    assert.deepStrictEqual(graph.getPredecessors('c').sort(), ['a', 'b']);
    assert.deepStrictEqual(graph.getPredecessors('b'), ['a']);
    assert.deepStrictEqual(graph.getPredecessors('a'), []);
  });

  test('getSuccessors returns direct dependents', () => {
    const tasks = [
      { taskId: 'a', dependsOn: [] },
      { taskId: 'b', dependsOn: ['a'] },
      { taskId: 'c', dependsOn: ['a', 'b'] },
    ];
    const graph = new DependencyGraph(tasks);
    assert.deepStrictEqual(graph.getSuccessors('a').sort(), ['b', 'c']);
    assert.deepStrictEqual(graph.getSuccessors('b'), ['c']);
    assert.deepStrictEqual(graph.getSuccessors('c'), []);
  });

  test('getNextBatch returns tasks with satisfied dependencies', () => {
    const tasks = [
      { taskId: 'a', dependsOn: [] },
      { taskId: 'b', dependsOn: ['a'] },
      { taskId: 'c', dependsOn: [] },
      { taskId: 'd', dependsOn: ['b', 'c'] },
    ];
    const graph = new DependencyGraph(tasks);

    const batch1 = graph.getNextBatch(new Set(), 2);
    assert.deepStrictEqual(batch1.sort(), ['a', 'c']);

    const batch2 = graph.getNextBatch(new Set(['a', 'c']), 2);
    assert.deepStrictEqual(batch2, ['b']);

    const batch3 = graph.getNextBatch(new Set(['a', 'c', 'b']), 2);
    assert.deepStrictEqual(batch3, ['d']);
  });

  test('handles tasks with no dependencies', () => {
    const tasks = [
      { taskId: 'a', dependsOn: [] },
      { taskId: 'b', dependsOn: [] },
    ];
    const graph = new DependencyGraph(tasks);
    const sorted = graph.topologicalSort();
    assert.strictEqual(sorted.length, 2);
  });

  test('handles single task', () => {
    const tasks = [{ taskId: 'a', dependsOn: [] }];
    const graph = new DependencyGraph(tasks);
    const sorted = graph.topologicalSort();
    assert.deepStrictEqual(sorted, ['a']);
  });

  test('getNextBatch respects maxParallel limit', () => {
    const tasks = [
      { taskId: 'a', dependsOn: [] },
      { taskId: 'b', dependsOn: [] },
      { taskId: 'c', dependsOn: [] },
      { taskId: 'd', dependsOn: [] },
    ];
    const graph = new DependencyGraph(tasks);

    const batch = graph.getNextBatch(new Set(), 2);
    assert.strictEqual(batch.length, 2);
  });
});
