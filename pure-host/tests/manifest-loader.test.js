/**
 * Tests for ManifestLoader — manifest.yaml parsing.
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { ManifestLoader } = require('../lib/manifest-loader');

const TEST_MANIFEST_DIR = path.join(__dirname, 'test_manifest');

function createManifestLoader() {
  return new ManifestLoader();
}

describe('ManifestLoader', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_MANIFEST_DIR)) {
      fs.rmSync(TEST_MANIFEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_MANIFEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_MANIFEST_DIR)) {
      fs.rmSync(TEST_MANIFEST_DIR, { recursive: true });
    }
  });

  test('loads valid YAML manifest', () => {
    const manifest = {
      model: 'sonnet',
      tasks: [
        { taskId: 'task-1', description: 'Test', prompt: 'Do something', dependsOn: [] },
        { taskId: 'task-2', description: 'Test 2', prompt: 'Do something else', dependsOn: ['task-1'] },
      ],
    };
    fs.writeFileSync(path.join(TEST_MANIFEST_DIR, 'manifest.yaml'), YAML.stringify(manifest), 'utf-8');

    const loader = createManifestLoader();
    const loaded = loader.load(TEST_MANIFEST_DIR);

    assert.strictEqual(loaded.model, 'sonnet');
    assert.strictEqual(loaded.tasks.length, 2);
    assert.strictEqual(loaded.tasks[0].taskId, 'task-1');
    assert.strictEqual(loaded.tasks[1].dependsOn[0], 'task-1');
  });

  test('loads valid JSON manifest', () => {
    const manifest = {
      model: 'haiku',
      tasks: [
        { taskId: 'task-1', description: 'Test', prompt: 'Do something', dependsOn: [] },
      ],
    };
    fs.writeFileSync(path.join(TEST_MANIFEST_DIR, 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const loader = createManifestLoader();
    const loaded = loader.load(TEST_MANIFEST_DIR);

    assert.strictEqual(loaded.model, 'haiku');
    assert.strictEqual(loaded.tasks.length, 1);
  });

  test('prefers manifest.yaml over manifest.yml', () => {
    fs.writeFileSync(path.join(TEST_MANIFEST_DIR, 'manifest.yaml'), 'model: yaml\ntasks: []', 'utf-8');
    fs.writeFileSync(path.join(TEST_MANIFEST_DIR, 'manifest.yml'), 'model: yml\ntasks: []', 'utf-8');

    const loader = createManifestLoader();
    const loaded = loader.load(TEST_MANIFEST_DIR);
    assert.strictEqual(loaded.model, 'yaml');
  });

  test('throws when no manifest found', () => {
    const loader = createManifestLoader();
    assert.throws(() => loader.load(TEST_MANIFEST_DIR), /No manifest found/);
  });

  test('throws when tasks array missing', () => {
    fs.writeFileSync(path.join(TEST_MANIFEST_DIR, 'manifest.yaml'), 'model: sonnet\ntasks: not-an-array', 'utf-8');

    const loader = createManifestLoader();
    assert.throws(() => loader.load(TEST_MANIFEST_DIR), /tasks.*array/);
  });

  test('throws when tasks is not an array', () => {
    fs.writeFileSync(path.join(TEST_MANIFEST_DIR, 'manifest.yaml'), 'model: sonnet\ntasks: "string"', 'utf-8');

    const loader = createManifestLoader();
    assert.throws(() => loader.load(TEST_MANIFEST_DIR), /tasks.*array/);
  });

  test('sets _sourceDir on loaded manifest', () => {
    fs.writeFileSync(path.join(TEST_MANIFEST_DIR, 'manifest.yaml'), 'model: sonnet\ntasks: []', 'utf-8');

    const loader = createManifestLoader();
    const loaded = loader.load(TEST_MANIFEST_DIR);
    assert.strictEqual(loaded._sourceDir, TEST_MANIFEST_DIR);
  });

  test('handles empty tasks array', () => {
    fs.writeFileSync(path.join(TEST_MANIFEST_DIR, 'manifest.yaml'), 'model: sonnet\ntasks: []', 'utf-8');

    const loader = createManifestLoader();
    const loaded = loader.load(TEST_MANIFEST_DIR);
    assert.strictEqual(loaded.tasks.length, 0);
  });
});

// Minimal YAML serializer for test fixtures
const YAML = {
  stringify: (obj) => {
    const lines = [];
    if (obj.model) lines.push(`model: ${obj.model}`);
    lines.push('tasks:');
    for (const task of obj.tasks) {
      lines.push(`  - taskId: ${task.taskId}`);
      if (task.description) lines.push(`    description: ${task.description}`);
      if (task.prompt) lines.push(`    prompt: |`);
      for (const line of task.prompt.split('\n')) {
        lines.push(`      ${line}`);
      }
      if (task.dependsOn && task.dependsOn.length > 0) {
        lines.push(`    dependsOn:`);
        for (const dep of task.dependsOn) {
          lines.push(`      - ${dep}`);
        }
      } else {
        lines.push(`    dependsOn: []`);
      }
    }
    return lines.join('\n');
  },
};
