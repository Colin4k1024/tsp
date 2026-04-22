/**
 * State store for persisting execution state across runs.
 * Persists to SHARED_TASK_NOTES.md in the project root.
 */
'use strict';

const fs = require('fs');
const path = require('path');

class StateStore {
  /**
   * @param {string} [stateFile] - Override the default state file path
   */
  constructor(stateFile) {
    /** @type {string} Path to the state file */
    this.stateFile = stateFile || path.join(
      process.env.PURE_HOST_ROOT || process.cwd(),
      'SHARED_TASK_NOTES.md'
    );
    /** @type {Map<string, object>} taskId -> task state */
    this.tasks = new Map();
    /** @type {{ lastUpdated: string, currentTask: string|null, completedTasks: string[], blockedTasks: string[] }} */
    this.globalState = {
      lastUpdated: null,
      currentTask: null,
      completedTasks: [],
      blockedTasks: [],
    };
  }

  /**
   * Load state from disk.
   * @returns {StateStore}
   */
  load() {
    if (!fs.existsSync(this.stateFile)) return this;
    const content = fs.readFileSync(this.stateFile, 'utf-8');
    try {
      const json = this._parseFrontmatter(content);
      if (json.tasks) {
        this.tasks = new Map(Object.entries(json.tasks));
      }
      if (json.globalState) {
        this.globalState = { ...this.globalState, ...json.globalState };
      }
    } catch {
      // If parsing fails, start fresh
    }
    return this;
  }

  /**
   * Save state to disk.
   */
  save() {
    const json = {
      tasks: Object.fromEntries(this.tasks),
      globalState: {
        ...this.globalState,
        lastUpdated: new Date().toISOString(),
      },
    };
    const frontmatter = `---\n${JSON.stringify(json, null, 2)}\n---\n`;
    const header = `# SHARED TASK NOTES\n\n> Auto-managed by pure-host. Do not edit manually.\n\n`;
    fs.writeFileSync(this.stateFile, header + frontmatter, 'utf-8');
  }

  /**
   * @param {string} taskId
   * @returns {object|null}
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * @param {string} taskId
   * @param {object} state
   */
  setTask(taskId, state) {
    this.tasks.set(taskId, {
      ...this.getTask(taskId),
      ...state,
      taskId,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * @param {string} content
   * @returns {object}
   */
  _parseFrontmatter(content) {
    // Match frontmatter between --- delimiters (handles markdown header before it)
    const match = content.match(/\n---\n([\s\S]*?)\n---\n/);
    if (!match) return {};
    return JSON.parse(match[1]);
  }

  /**
   * Get all tasks as array.
   * @returns {object[]}
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * Mark a task as blocked.
   * @param {string} taskId
   * @param {string} reason
   * @param {object} error
   */
  blockTask(taskId, reason, error) {
    this.setTask(taskId, {
      status: 'blocked',
      blockedReason: reason,
      error: error || {},
    });
    if (!this.globalState.blockedTasks.includes(taskId)) {
      this.globalState.blockedTasks.push(taskId);
    }
  }

  /**
   * Mark a task as completed.
   * @param {string} taskId
   */
  completeTask(taskId) {
    this.setTask(taskId, { status: 'completed' });
    if (!this.globalState.completedTasks.includes(taskId)) {
      this.globalState.completedTasks.push(taskId);
    }
    this.globalState.currentTask = null;
  }

  /**
   * Mark a task as in progress.
   * @param {string} taskId
   */
  startTask(taskId) {
    this.setTask(taskId, { status: 'in-progress', startedAt: new Date().toISOString() });
    this.globalState.currentTask = taskId;
  }
}

module.exports = { StateStore, STATE_FILE: path.join(process.cwd(), 'SHARED_TASK_NOTES.md') };
