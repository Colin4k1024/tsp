/**
 * Retry handler — manages auto-fix attempts and retry logic.
 */
'use strict';

const { spawn } = require('child_process');

const DEFAULT_MAX_RETRIES = 3;

class RetryHandler {
  /**
   * @param {number} maxRetries
   */
  constructor(maxRetries = DEFAULT_MAX_RETRIES) {
    this.maxRetries = maxRetries;
  }

  /**
   * Generate an auto-fix prompt based on error.
   * @param {object} task
   * @param {object} error
   * @param {number} attempt
   * @returns {string}
   */
  generateFixPrompt(task, error, attempt) {
    const context = {
      taskId: task.taskId,
      taskDescription: task.description || task.name,
      errorMessage: error.message || String(error),
      errorType: error.type || 'UnknownError',
      filesAffected: error.filesAffected || [],
      attempt,
      maxRetries: this.maxRetries,
    };

    return `## Auto-Fix Attempt ${attempt + 1}/${this.maxRetries + 1}

### Task: ${context.taskId}
**Description:** ${context.taskDescription}

### Error
\`\`\`
${context.errorMessage}
\`\`\`

**Error Type:** ${context.errorType}
**Files Affected:** ${context.filesAffected.length > 0 ? context.filesAffected.join(', ') : 'None reported'}

### Instructions
1. Analyze the error and identify the root cause
2. Apply an auto-fix to resolve the issue
3. Verify the fix works by running relevant checks/tests
4. If successful, commit with message: \`fix(${context.taskId}): auto-fix attempt ${attempt + 1}\`

### Guidance
- Do NOT change the task scope
- Focus only on fixing the reported error
- Preserve all passing tests
- Document any changes made
`;
  }

  /**
   * Check if a task should be retried.
   * @param {number} attempt
   * @returns {boolean}
   */
  shouldRetry(attempt) {
    return attempt < this.maxRetries;
  }

  /**
   * Execute auto-fix using Claude CLI.
   * @param {string} fixPrompt
   * @param {object} options
   * @returns {Promise<{ success: boolean, output: string }>}
   */
  async executeFix(fixPrompt, options = {}) {
    const { timeout = 300000, model = 'sonnet' } = options;

    return new Promise((resolve) => {
      const args = ['-p', fixPrompt, '--model', model, '--output-format', 'stream-json'];
      const proc = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        resolve({ success: false, output: 'TIMEOUT' });
      }, timeout);

      proc.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          success: code === 0,
          output: stdout + stderr,
          exitCode: code,
        });
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({ success: false, output: err.message });
      });
    });
  }
}

module.exports = { RetryHandler };
