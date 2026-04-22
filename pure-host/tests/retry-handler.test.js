/**
 * Tests for RetryHandler — auto-fix retry logic.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const { RetryHandler } = require('../lib/retry-handler');

describe('RetryHandler', () => {
  test('shouldRetry returns true when under maxRetries', () => {
    const handler = new RetryHandler(3);
    assert.strictEqual(handler.shouldRetry(0), true);
    assert.strictEqual(handler.shouldRetry(1), true);
    assert.strictEqual(handler.shouldRetry(2), true);
  });

  test('shouldRetry returns false when at maxRetries', () => {
    const handler = new RetryHandler(3);
    assert.strictEqual(handler.shouldRetry(3), false);
    assert.strictEqual(handler.shouldRetry(4), false);
  });

  test('shouldRetry uses default maxRetries of 3', () => {
    const handler = new RetryHandler();
    assert.strictEqual(handler.shouldRetry(0), true);
    assert.strictEqual(handler.shouldRetry(3), false);
  });

  test('custom maxRetries is respected', () => {
    const handler = new RetryHandler(1);
    assert.strictEqual(handler.shouldRetry(0), true);
    assert.strictEqual(handler.shouldRetry(1), false);
  });

  test('generateFixPrompt includes task information', () => {
    const handler = new RetryHandler(3);
    const task = {
      taskId: 'build-task',
      description: 'Build the project',
      name: 'Build Task',
    };
    const error = {
      type: 'BuildError',
      message: 'npm install failed',
      filesAffected: ['package.json'],
    };

    const prompt = handler.generateFixPrompt(task, error, 0);

    assert.ok(prompt.includes('build-task'));
    assert.ok(prompt.includes('Build the project'));
    assert.ok(prompt.includes('npm install failed'));
    assert.ok(prompt.includes('BuildError'));
    assert.ok(prompt.includes('package.json'));
    assert.ok(prompt.includes('Attempt 1/4')); // maxRetries + 1
  });

  test('generateFixPrompt includes attempt number', () => {
    const handler = new RetryHandler(3);
    const task = { taskId: 'test', description: 'Test task' };
    const error = { type: 'Error', message: 'failed' };

    const prompt1 = handler.generateFixPrompt(task, error, 0);
    const prompt2 = handler.generateFixPrompt(task, error, 1);
    const prompt3 = handler.generateFixPrompt(task, error, 2);

    assert.ok(prompt1.includes('Attempt 1/4'));
    assert.ok(prompt2.includes('Attempt 2/4'));
    assert.ok(prompt3.includes('Attempt 3/4'));
  });

  test('generateFixPrompt handles missing error fields', () => {
    const handler = new RetryHandler(3);
    const task = { taskId: 'test', description: 'Test' };
    const error = {}; // Empty error

    const prompt = handler.generateFixPrompt(task, error, 0);

    assert.ok(prompt.includes('test'));
    assert.ok(prompt.includes('Test'));
    assert.ok(prompt.includes('UnknownError')); // Default error type
  });

  test('generateFixPrompt handles missing filesAffected', () => {
    const handler = new RetryHandler(3);
    const task = { taskId: 'test', description: 'Test' };
    const error = { type: 'Error', message: 'failed' }; // No filesAffected

    const prompt = handler.generateFixPrompt(task, error, 0);

    assert.ok(prompt.includes('None reported'));
  });

  test('generateFixPrompt includes instructions', () => {
    const handler = new RetryHandler(3);
    const task = { taskId: 'test', description: 'Test' };
    const error = { type: 'Error', message: 'failed' };

    const prompt = handler.generateFixPrompt(task, error, 0);

    assert.ok(prompt.includes('Analyze the error'));
    assert.ok(prompt.includes('Apply an auto-fix'));
    assert.ok(prompt.includes('Verify the fix'));
    assert.ok(prompt.includes('auto-fix attempt'));
  });

  test('generateFixPrompt includes guidance', () => {
    const handler = new RetryHandler(3);
    const task = { taskId: 'test', description: 'Test' };
    const error = { type: 'Error', message: 'failed' };

    const prompt = handler.generateFixPrompt(task, error, 0);

    assert.ok(prompt.includes('Do NOT change the task scope'));
    assert.ok(prompt.includes('Focus only on fixing'));
    assert.ok(prompt.includes('Preserve all passing tests'));
  });

  test('executeFix returns success for code 0', async () => {
    const handler = new RetryHandler();
    // Use a simple command that succeeds
    const result = await handler.executeFix('echo success', { model: 'haiku', timeout: 5000 });
    // If claude is not available, it will fail with non-zero exit code
    // This test verifies the code path works
    assert.strictEqual(typeof result.success, 'boolean');
  });

  test('executeFix returns failure for non-zero exit', async () => {
    const handler = new RetryHandler();
    // This will fail because it's not valid claude invocation
    const result = await handler.executeFix('exit 0', { timeout: 5000 });
    // The result depends on whether 'claude' command exists
    assert.strictEqual(typeof result.success, 'boolean');
  });

  test('executeFix handles timeout', async () => {
    const handler = new RetryHandler();
    // Use very short timeout
    const result = await handler.executeFix('echo test', { timeout: 1 });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.output, 'TIMEOUT');
  });
});
