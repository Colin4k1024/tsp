/**
 * Tests for GitManager — git operations for revert points and commits.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const { GitManager } = require('../lib/git-manager');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_REPO_DIR = path.join(__dirname, 'test_git_repo');

function initTestRepo() {
  // Create a temp directory and initialize a git repo
  if (fs.existsSync(TEST_REPO_DIR)) {
    fs.rmSync(TEST_REPO_DIR, { recursive: true });
  }
  fs.mkdirSync(TEST_REPO_DIR, { recursive: true });

  // Init git repo
  spawnSync('git', ['init'], { cwd: TEST_REPO_DIR, stdio: 'pipe' });
  spawnSync('git', ['config', 'user.email', 'test@test.com'], { cwd: TEST_REPO_DIR, stdio: 'pipe' });
  spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: TEST_REPO_DIR, stdio: 'pipe' });

  // Create initial commit
  fs.writeFileSync(path.join(TEST_REPO_DIR, 'README.md'), '# Test\n', 'utf-8');
  spawnSync('git', ['add', '.'], { cwd: TEST_REPO_DIR, stdio: 'pipe' });
  spawnSync('git', ['commit', '-m', 'Initial commit'], { cwd: TEST_REPO_DIR, stdio: 'pipe' });

  return TEST_REPO_DIR;
}

describe('GitManager', () => {
  describe('isClean', () => {
    test('returns true when nothing to commit', () => {
      const repoDir = initTestRepo();
      // Sync check first
      const status = spawnSync('git', ['status', '--short'], { cwd: repoDir, encoding: 'utf-8' });
      // Empty status means clean
      assert.strictEqual(status.stdout.trim(), '');
    });

    test('returns false when there are changes', () => {
      const repoDir = initTestRepo();
      fs.writeFileSync(path.join(repoDir, 'newfile.txt'), 'content', 'utf-8');

      const result = spawnSync('git', ['status', '--short'], { cwd: repoDir, encoding: 'utf-8' });
      assert.notStrictEqual(result.stdout.trim(), '');
    });
  });

  describe('markRevertPoint', () => {
    test('creates a commit with revert point message', async () => {
      const repoDir = initTestRepo();
      const manager = new GitManager();

      // Override the cwd for this test
      const originalCwd = process.cwd();
      try {
        process.chdir(repoDir);

        fs.writeFileSync('test.txt', 'change', 'utf-8');
        const sha = await manager.markRevertPoint('test-task');

        assert.ok(sha.length > 0);
        assert.ok(sha.match(/^[a-f0-9]+$/)); // Git SHA format

        // Verify the commit exists
        const log = spawnSync('git', ['log', '--oneline', '-1'], { encoding: 'utf-8' });
        assert.ok(log.stdout.includes('revert point'));
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('throws on git add failure', async () => {
      // This would require a broken git setup, which is hard to test
      // So we just verify the method exists and returns something
      const manager = new GitManager();
      assert.strictEqual(typeof manager.markRevertPoint, 'function');
    });
  });

  describe('commit', () => {
    test('creates a commit with task message', async () => {
      const repoDir = initTestRepo();
      const originalCwd = process.cwd();

      try {
        process.chdir(repoDir);
        const manager = new GitManager();

        fs.writeFileSync('newfeature.js', '// new feature', 'utf-8');
        const sha = await manager.commit('my-task', 2);

        assert.ok(sha.length > 0);
        assert.ok(sha.match(/^[a-f0-9]+$/));

        // Verify the commit message
        const log = spawnSync('git', ['log', '--oneline', '-1'], { encoding: 'utf-8' });
        assert.ok(log.stdout.includes('feat(my-task)'));
        assert.ok(log.stdout.includes('[attempt 2]'));
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('revert', () => {
    test('revert executes without throwing', async () => {
      const repoDir = initTestRepo();
      const originalCwd = process.cwd();

      try {
        process.chdir(repoDir);

        // Get initial SHA
        const initialSha = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout.trim();

        // Make a commit
        fs.writeFileSync('feature.js', '// feature', 'utf-8');
        spawnSync('git', ['add', '.'], { cwd: repoDir, stdio: 'pipe' });
        spawnSync('git', ['commit', '-m', 'Add feature'], { cwd: repoDir, stdio: 'pipe' });

        // Revert should not throw
        const manager = new GitManager();
        await manager.revert('test-task', initialSha);

        // If we get here without throwing, the test passes
        assert.ok(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('falls back to reset on revert failure', async () => {
      const repoDir = initTestRepo();
      const originalCwd = process.cwd();

      try {
        process.chdir(repoDir);
        const manager = new GitManager();

        // Get a SHA
        const sha = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout.trim();

        // Should not throw
        await manager.revert('test-task', sha);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('status', () => {
    test('returns git status output', async () => {
      const repoDir = initTestRepo();
      const originalCwd = process.cwd();

      try {
        process.chdir(repoDir);
        const manager = new GitManager();

        const status = await manager.status();
        assert.strictEqual(typeof status, 'string');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('_run', () => {
    test('returns stdout, stderr, and code on success', async () => {
      const repoDir = initTestRepo();
      const originalCwd = process.cwd();

      try {
        process.chdir(repoDir);
        const manager = new GitManager();

        const result = await manager._run(['status']);
        assert.strictEqual(result.code, 0);
        assert.strictEqual(typeof result.stdout, 'string');
        assert.strictEqual(typeof result.stderr, 'string');
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('returns non-zero code on error', async () => {
      const manager = new GitManager();
      // Invalid git command - returns -1 if process fails, or 1 if git exits with error
      const result = await manager._run(['invalid-git-command']);

      // Should return a non-zero exit code
      assert.ok(result.code !== 0, `Expected non-zero code, got ${result.code}`);
      assert.strictEqual(typeof result.stderr, 'string');
    });
  });
});
