/**
 * Reporter — generates execution report in Markdown format.
 */
'use strict';

require('./state-store');

class Reporter {
  /**
   * Generate a full execution report.
   * @param {import('./state-store').StateStore} stateStore
   * @param {{ tasks: object[], model: string, name: string, _sourceDir?: string }} manifest
   * @param {{ startedAt: Date, completedAt?: Date }} timing
   * @returns {string}
   */
  generateReport(stateStore, manifest, timing) {
    const lines = [];
    const tasks = manifest.tasks || [];

    lines.push(this._header(manifest, timing));
    lines.push(this._taskSummary(tasks, stateStore));
    lines.push(this._blockers(stateStore));
    lines.push(this._revertPoints(stateStore));
    lines.push(this._nextSteps(stateStore, tasks));

    return lines.join('\n');
  }

  /**
   * @param {{ tasks: object[], model: string, name: string }} manifest
   * @param {{ startedAt: Date, completedAt?: Date }} timing
   */
  _header(manifest, timing) {
    const duration = timing.completedAt
      ? this._formatDuration(timing.startedAt, timing.completedAt)
      : 'IN PROGRESS';

    const completedStr = timing.completedAt
      ? this._formatDate(timing.completedAt)
      : 'IN PROGRESS';

    return [
      '═'.repeat(57),
      '         PURE HOST EXECUTION REPORT',
      '═'.repeat(57),
      '',
      `Manifest: ${manifest.name || manifest._sourceDir || 'unknown'}`,
      `Model: ${manifest.model || 'sonnet'}`,
      `Started: ${this._formatDate(timing.startedAt)}`,
      `Completed: ${completedStr}`,
      `Duration: ${duration}`,
      '',
    ].join('\n');
  }

  /**
   * @param {object[]} tasks
   * @param {import('./state-store').StateStore} stateStore
   */
  _taskSummary(tasks, stateStore) {
    const lines = [];
    lines.push('─'.repeat(57));
    lines.push('TASK SUMMARY');
    lines.push('─'.repeat(57));

    for (const task of tasks) {
      const state = stateStore.getTask(task.taskId);
      lines.push(this._formatTaskRow(task, state, stateStore));
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * @param {object} task
   * @param {object|null} state
   * @param {import('./state-store').StateStore} stateStore
   */
  _formatTaskRow(task, state, _stateStore) {
    const status = state?.status || 'pending';
    const statusIcon = this._statusIcon(status);
    const attempts = state?.attempts || 0;
    const duration = state?.duration
      ? this._formatMs(state.duration)
      : (state?.startedAt ? 'running' : '—');

    const name = task.description || task.name || task.taskId;
    const desc = name.length > 30 ? name.substring(0, 27) + '...' : name;

    let statusDetail = '';
    if (status === 'completed') {
      statusDetail = `[${attempts} attempt${attempts !== 1 ? 's' : ''}, ${duration}]`;
    } else if (status === 'blocked') {
      statusDetail = '[BLOCKED]';
    } else if (status === 'in-progress') {
      statusDetail = '[IN PROGRESS]';
    } else {
      statusDetail = '[PENDING]';
    }

    return `${statusIcon} ${task.taskId}: ${desc.padEnd(33)} ${statusDetail}`;
  }

  /**
   * @param {string} status
   * @returns {string}
   */
  _statusIcon(status) {
    switch (status) {
      case 'completed': return '✓';
      case 'blocked': return '⊘';
      case 'in-progress': return '◐';
      default: return '○';
    }
  }

  /**
   * @param {import('./state-store').StateStore} stateStore
   * @param {object[]} tasks
   */
  _blockers(stateStore) {
    const lines = [];
    lines.push('─'.repeat(57));
    lines.push('BLOCKERS');
    lines.push('─'.repeat(57));

    const blocked = stateStore.getAllTasks().filter(t => t.status === 'blocked');
    if (blocked.length === 0) {
      lines.push('(none)');
      lines.push('');
      return lines.join('\n');
    }

    for (const task of blocked) {
      const reason = task.blockedReason || task.error?.message || 'Unknown error';
      const attempts = task.attempts || 0;
      const filesAffected = task.error?.filesAffected || [];

      lines.push(`${task.taskId}: ${reason}`);
      if (task.blockedReason && task.error?.message) {
        lines.push(`  Error: ${task.error.message}`);
      }
      lines.push(`  ${attempts} auto-fix attempt${attempts !== 1 ? 's' : ''} failed.`);
      if (filesAffected.length > 0) {
        lines.push(`  Files affected: ${filesAffected.join(', ')}`);
      }
      lines.push(`  Revert: node pure-host.js --revert ${task.taskId}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * @param {import('./state-store').StateStore} stateStore
   * @param {object[]} tasks
   */
  _revertPoints(stateStore) {
    const lines = [];
    lines.push('─'.repeat(57));
    lines.push('REVERT POINTS');
    lines.push('─'.repeat(57));

    const reverted = stateStore.getAllTasks().filter(t => t.revertPoint);
    if (reverted.length === 0) {
      lines.push('(none)');
      lines.push('');
      return lines.join('\n');
    }

    for (const task of reverted) {
      lines.push(`${task.taskId}: SHA ${task.revertPoint} @ ${task.revertPointFiles?.join(', ') || 'all files'}`);
    }
    lines.push('');

    return lines.join('\n');
  }

  /**
   * @param {import('./state-store').StateStore} stateStore
   * @param {object[]} tasks
   */
  _nextSteps(stateStore, _tasks) {
    const lines = [];
    lines.push('─'.repeat(57));
    lines.push('NEXT STEPS');
    lines.push('─'.repeat(57));

    const blocked = stateStore.globalState.blockedTasks;
    const pending = _tasks
      .map(t => t.taskId)
      .filter(id =>
        !stateStore.globalState.completedTasks.includes(id) &&
        !blocked.includes(id) &&
        (stateStore.getTask(id)?.status !== 'in-progress')
      );

    if (blocked.length > 0) {
      lines.push(`1. Manually resolve blocker(s): ${blocked.join(', ')}`);
      lines.push(`2. Run: node pure-host.js --resume`);
    } else if (pending.length > 0) {
      lines.push(`1. Resume execution: node pure-host.js --resume`);
      lines.push(`2. Pending tasks: ${pending.join(', ')}`);
    } else {
      lines.push('1. All tasks completed successfully.');
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Format a date to YYYY-MM-DD HH:MM:SS.
   * @param {Date} d
   * @returns {string}
   */
  _formatDate(d) {
    return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
  }

  /**
   * @param {Date} start
   * @param {Date} end
   * @returns {string}
   */
  _formatDuration(start, end) {
    const ms = end - start;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  /**
   * @param {number} ms
   * @returns {string}
   */
  _formatMs(ms) {
    const minutes = Math.floor(ms / 60000);
    return `${minutes}m`;
  }
}

module.exports = { Reporter };
