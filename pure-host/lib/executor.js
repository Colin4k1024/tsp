/**
 * Executor — runs a task via Claude CLI subprocess with timeout management.
 */
'use strict';

const { spawn } = require('child_process');

const DEFAULT_TIMEOUT = 300000; // 5 minutes

class Executor {
  /**
   * Execute a single task via Claude CLI.
   * @param {object} task
   * @param {object} options
   * @returns {Promise<{ success: boolean, output: string, error: object|null }>}
   */
  async execute(task, options = {}) {
    const {
      timeout = DEFAULT_TIMEOUT,
      model = 'sonnet',
      claudeArgs = [],
    } = options;

    if (!task.prompt && !task.command) {
      return {
        success: false,
        output: '',
        error: { type: 'NoPromptError', message: 'Task has no prompt or command' },
      };
    }

    const prompt = task.prompt || `Execute: ${task.command}`;

    return new Promise((resolve) => {
      const args = [
        '-p', prompt,
        '--model', model,
        '--output-format', 'stream-json',
        ...claudeArgs,
      ];

      const proc = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';
      let resolved = false;

      const finish = (result) => {
        if (resolved) return;
        resolved = true;
        proc.kill('SIGTERM');
        resolve(result);
      };

      const timer = setTimeout(() => {
        finish({
          success: false,
          output: stdout + stderr,
          error: { type: 'TimeoutError', message: `Task exceeded ${timeout / 1000}s timeout` },
        });
      }, timeout);

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (resolved) return;

        if (code === 0) {
          finish({ success: true, output: stdout, error: null });
        } else {
          // Try to parse error from output
          let errorObj = { type: 'ExecutionError', message: stderr || `Exit code ${code}` };
          try {
            const lines = stderr.split('\n');
            for (const line of lines) {
              if (line.includes('Error:') || line.includes('error:')) {
                errorObj = { type: 'ExecutionError', message: line.trim() };
                break;
              }
            }
          } catch { /* ignore */ }

          finish({ success: false, output: stdout + stderr, error: errorObj });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        finish({
          success: false,
          output: '',
          error: { type: 'ProcessError', message: err.message },
        });
      });
    });
  }

  /**
   * Verify task output — runs basic checks and optionally executes verifyCommand.
   * @param {object} task
   * @param {string} output
   * @returns {Promise<{ valid: boolean, message: string }>}
   */
  async verify(task, output) {
    if (!output || output.trim().length === 0) {
      return { valid: false, message: 'No output produced' };
    }

    // Check for common error patterns in output
    const errorPatterns = [
      /Error:/i,
      /failed/i,
      /SyntaxError:/i,
      /TypeError:/i,
      /ReferenceError:/i,
    ];

    for (const pattern of errorPatterns) {
      if (pattern.test(output)) {
        return { valid: false, message: `Output contains error pattern: ${pattern}` };
      }
    }

    // Run custom verifyCommand if provided
    if (task.verifyCommand) {
      return this._runVerifyCommand(task.verifyCommand, task.timeout || DEFAULT_TIMEOUT);
    }

    return { valid: true, message: 'Verification passed' };
  }

  /**
   * Run a custom verification command.
   * @param {string} command
   * @param {number} timeout
   * @returns {Promise<{ valid: boolean, message: string }>}
   */
  _runVerifyCommand(command, timeout) {
    return new Promise((resolve) => {
      const isWin = process.platform === 'win32';
      const shell = isWin ? 'cmd.exe' : '/bin/sh';
      const shellFlag = isWin ? '/c' : '-c';

      const proc = spawn(shell, [shellFlag, command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
        timeout,
      });

      let stdout = '';
      let stderr = '';
      let resolved = false;

      const finish = (valid, message) => {
        if (resolved) return;
        resolved = true;
        proc.kill('SIGTERM');
        resolve({ valid, message });
      };

      const timer = setTimeout(() => {
        finish(false, `Verification command timed out after ${timeout}ms`);
      }, timeout);

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (resolved) return;

        if (code === 0) {
          finish(true, `Verification command passed`);
        } else {
          const errOutput = stderr || stdout;
          const truncated = errOutput.length > 200 ? errOutput.substring(0, 200) + '...' : errOutput;
          finish(false, `Verification command failed (exit ${code}): ${truncated}`);
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        finish(false, `Verification command error: ${err.message}`);
      });
    });
  }
}

module.exports = { Executor, DEFAULT_TIMEOUT };
