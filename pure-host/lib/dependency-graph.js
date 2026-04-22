/**
 * Dependency graph — builds DAG, computes topological order, detects cycles.
 */
'use strict';

class DependencyGraph {
  /**
   * @param {object[]} tasks
   */
  constructor(tasks) {
    /** @type {Map<string, object>} */
    this.nodes = new Map();
    /** @type {Map<string, Set<string>} */
    this.edges = new Map();
    /** @type {Map<string, Set<string>} */
    this.reverseEdges = new Map();

    for (const task of tasks) {
      this.addNode(task);
    }
    for (const task of tasks) {
      if (task.dependsOn) {
        for (const dep of task.dependsOn) {
          this.addEdge(dep, task.taskId);
        }
      }
    }
  }

  /**
   * @param {object} task
   */
  addNode(task) {
    this.nodes.set(task.taskId, task);
    if (!this.edges.has(task.taskId)) this.edges.set(task.taskId, new Set());
    if (!this.reverseEdges.has(task.taskId)) this.reverseEdges.set(task.taskId, new Set());
  }

  /**
   * @param {string} from
   * @param {string} to
   */
  addEdge(from, to) {
    if (!this.nodes.has(from)) throw new Error(`Unknown task in dependency: ${from}`);
    if (!this.nodes.has(to)) throw new Error(`Unknown task in dependency: ${to}`);
    this.edges.get(from).add(to);
    this.reverseEdges.get(to).add(from);
  }

  /**
   * Topological sort (Kahn's algorithm).
   * @returns {string[]} ordered task IDs
   * @throws {Error} if cycle detected
   */
  topologicalSort() {
    const inDegree = new Map();
    for (const id of this.nodes.keys()) {
      inDegree.set(id, this.reverseEdges.get(id)?.size || 0);
    }

    const queue = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const sorted = [];
    while (queue.length > 0) {
      const node = queue.shift();
      sorted.push(node);
      for (const neighbor of this.edges.get(node) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) queue.push(neighbor);
      }
    }

    if (sorted.length !== this.nodes.size) {
      const remaining = [...this.nodes.keys()].filter(id => !sorted.includes(id));
      throw new Error(`Circular dependency detected involving: ${remaining.join(', ')}`);
    }

    return sorted;
  }

  /**
   * Get predecessors (dependencies) of a task.
   * @param {string} taskId
   * @returns {string[]}
   */
  getPredecessors(taskId) {
    return [...(this.reverseEdges.get(taskId) || [])];
  }

  /**
   * Get successors (dependents) of a task.
   * @param {string} taskId
   * @returns {string[]}
   */
  getSuccessors(taskId) {
    return [...(this.edges.get(taskId) || [])];
  }

  /**
   * Get parallelizable batch (tasks with all dependencies satisfied by completed set).
   * @param {Set<string>} completed
   * @param {number} maxParallel
   * @returns {string[]}
   */
  getNextBatch(completed, maxParallel = 2) {
    const batch = [];
    for (const [id] of this.nodes) {
      if (completed.has(id)) continue;
      const deps = this.getPredecessors(id);
      if (deps.every(d => completed.has(d))) {
        batch.push(id);
        if (batch.length >= maxParallel) break;
      }
    }
    return batch;
  }
}

module.exports = { DependencyGraph };
