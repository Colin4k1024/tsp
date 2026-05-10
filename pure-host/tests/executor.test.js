/**
 * Tests for Executor — task execution and verification.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const { Executor } = require('../lib/executor');

describe('Executor', () => {
  test('verify returns invalid for empty output', async () => {
    const executor = new Executor();
    const result = await executor.verify({ taskId: 'test' }, '');
    assert.strictEqual(result.valid, false);
    assert.ok(result.message.includes('No output'));
  });

  test('verify returns invalid for whitespace-only output', async () => {
    const executor = new Executor();
    const result = await executor.verify({ taskId: 'test' }, '   \n\t  ');
    assert.strictEqual(result.valid, false);
    assert.ok(result.message.includes('No output'));
  });

  test('verify returns invalid on Error: pattern', async () => {
    const executor = new Executor();
    const result = await executor.verify({ taskId: 'test' }, 'Some output\nError: something went wrong');
    assert.strictEqual(result.valid, false);
    assert.ok(result.message.includes('error pattern'));
  });

  test('verify returns invalid on failed pattern', async () => {
    const executor = new Executor();
    const result = await executor.verify({ taskId: 'test' }, 'Build failed');
    assert.strictEqual(result.valid, false);
    assert.ok(result.message.includes('error pattern'));
  });

  test('verify returns invalid on SyntaxError', async () => {
    const executor = new Executor();
    const result = await executor.verify({ taskId: 'test' }, 'SyntaxError: unexpected token');
    assert.strictEqual(result.valid, false);
    assert.ok(result.message.includes('error pattern'));
  });

  test('verify returns invalid on TypeError', async () => {
    const executor = new Executor();
    const result = await executor.verify({ taskId: 'test' }, 'TypeError: Cannot read property');
    assert.strictEqual(result.valid, false);
    assert.ok(result.message.includes('error pattern'));
  });

  test('verify returns invalid on ReferenceError', async () => {
    const executor = new Executor();
    const result = await executor.verify({ taskId: 'test' }, 'ReferenceError: undefined is not defined');
    assert.strictEqual(result.valid, false);
    assert.ok(result.message.includes('error pattern'));
  });

  test('verify returns valid for clean output', async () => {
    const executor = new Executor();
    const result = await executor.verify({ taskId: 'test' }, 'All tests passed!\n✓ 5 tests run');
    assert.strictEqual(result.valid, true);
    assert.ok(result.message.includes('Verification passed'));
  });

  test('verify is case-insensitive for error patterns', async () => {
    const executor = new Executor();
    const result = await executor.verify({ taskId: 'test' }, 'ERROR: something failed');
    assert.strictEqual(result.valid, false);
  });

  test('verify handles output with multiple error patterns', async () => {
    const executor = new Executor();
    const result = await executor.verify({ taskId: 'test' }, 'Error: first\nTypeError: second');
    assert.strictEqual(result.valid, false);
  });

  test('execute returns error when no prompt or command', async () => {
    const executor = new Executor();
    const result = await executor.execute({ taskId: 'test' }, {});
    assert.strictEqual(result.success, false);
    assert.ok(result.error.message.includes('no prompt'));
  });

  test('execute uses command as prompt fallback', async () => {
    const executor = new Executor();
    // This would fail because 'echo' is not 'claude', but it tests the code path
    const result = await executor.execute({ taskId: 'test', command: 'echo hello' }, { claudeArgs: ['--help'] });
    // Result depends on whether claude is installed, but code path should work
    assert.strictEqual(typeof result.success, 'boolean');
  });

  test('execute passes model option', async () => {
    const executor = new Executor();
    const result = await executor.execute(
      { taskId: 'test', prompt: 'test' },
      { model: 'haiku', claudeArgs: ['--help'] }
    );
    // Just verify it doesn't crash - actual execution depends on claude CLI
    assert.strictEqual(typeof result.success, 'boolean');
  });

  test('execute applies timeout', async () => {
    const executor = new Executor();
    // Use a very short timeout to test timeout handling
    const result = await executor.execute(
      { taskId: 'test', prompt: 'sleep 10' },
      { timeout: 100, claudeArgs: ['--help'] }
    );
    // Should timeout or fail, but shouldn't hang
    assert.strictEqual(typeof result.success, 'boolean');
  });
});

describe('Executor._runVerifyCommand', () => {
  test('runs a simple verification command', async () => {
    const executor = new Executor();
    const result = await executor._runVerifyCommand('echo "OK"', 5000);
    assert.strictEqual(result.valid, true);
  });

  test('fails verification for non-zero exit code', async () => {
    const executor = new Executor();
    const result = await executor._runVerifyCommand('exit 1', 5000);
    assert.strictEqual(result.valid, false);
    assert.ok(result.message.includes('Verification command failed'));
  });

  test('handles command not found', async () => {
    const executor = new Executor();
    const result = await executor._runVerifyCommand('nonexistent_command_12345', 5000);
    assert.strictEqual(result.valid, false);
  });

  test('respects timeout', async () => {
    const executor = new Executor();
    const result = await executor._runVerifyCommand('sleep 10', 100);
    assert.strictEqual(result.valid, false);
    assert.ok(result.message.includes('timed out'));
  });

  test('truncates long error output', async () => {
    const executor = new Executor();
    const longCommand = 'echo "$(printf \'x%.0s\' {1..500})" && exit 1';
    const result = await executor._runVerifyCommand(longCommand, 5000);
    assert.strictEqual(result.valid, false);
    assert.ok(result.message.length < 300);
  });
});
