/**
 * Git manager — wraps git operations for revert points and commits.
 */
'use strict';

const { spawn } = require('child_process');

class GitManager {
  /**
   * Run a git command.
   * @param {string[]} args
   * @returns {Promise<{ stdout: string, stderr: string, code: number }>}
   */
  async _run(args) {
    return new Promise((resolve) => {
      const proc = spawn('git', args, { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => resolve({ stdout, stderr, code }));
      proc.on('error', (err) => resolve({ stdout: '', stderr: err.message, code: -1 }));
    });
  }

  /**
   * Mark a revert point — commits current state with a tag.
   * @param {string} taskId
   * @param {string[]} files
   * @returns {Promise<string>} commit SHA
   */
  async markRevertPoint(taskId, files = []) {
    // Stage and commit
    if (files.length === 0) {
      const result = await this._run(['add', '-A']);
      if (result.code !== 0) {
        throw new Error(`git add failed: ${result.stderr}`);
      }
    } else {
      for (const f of files) {
        const result = await this._run(['add', f]);
        if (result.code !== 0) {
          throw new Error(`git add ${f} failed: ${result.stderr}`);
        }
      }
    }

    const msg = `chore(${taskId}): revert point before task execution`;
    const result = await this._run(['commit', '-m', msg]);
    if (result.code !== 0) {
      throw new Error(`git commit failed: ${result.stderr}`);
    }

    const shaResult = await this._run(['rev-parse', 'HEAD']);
    return shaResult.stdout.trim();
  }

  /**
   * Commit task result.
   * @param {string} taskId
   * @param {number} attempt
   * @returns {Promise<string>} commit SHA
   */
  async commit(taskId, attempt) {
    const result = await this._run(['add', '-A']);
    if (result.code !== 0) {
      throw new Error(`git add failed: ${result.stderr}`);
    }

    const msg = `feat(${taskId}): task completed [attempt ${attempt}]`;
    const commitResult = await this._run(['commit', '-m', msg]);
    if (commitResult.code !== 0) {
      throw new Error(`git commit failed: ${commitResult.stderr}`);
    }

    const shaResult = await this._run(['rev-parse', 'HEAD']);
    return shaResult.stdout.trim();
  }

  /**
   * Revert to the revert point for a task.
   * @param {string} taskId
   * @param {string} sha
   * @returns {Promise<void>}
   */
  async revert(taskId, sha) {
    const result = await this._run(['revert', '--no-commit', sha]);
    if (result.code !== 0) {
      // Fallback: reset to sha
      const resetResult = await this._run(['reset', '--hard', sha]);
      if (resetResult.code !== 0) {
        throw new Error(`Revert failed: ${resetResult.stderr}`);
      }
    }
  }

  /**
   * Get the current git status.
   * @returns {Promise<string>}
   */
  async status() {
    const result = await this._run(['status', '--short']);
    return result.stdout;
  }

  /**
   * Check if git repo is clean.
   * @returns {Promise<boolean>}
   */
  async isClean() {
    const status = await this.status();
    return status.trim().length === 0;
  }
}

module.exports = { GitManager };
