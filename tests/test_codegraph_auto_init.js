#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  codegraphDbPath,
  readState,
  runAutoInit,
} = require('../scripts/hooks/codegraph-auto-init');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
  }
}

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-auto-init-'));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function withEnv(env, fn) {
  const previous = {};
  for (const key of Object.keys(env)) {
    previous[key] = process.env[key];
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  }

  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function createProject(dir) {
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"fixture"}\n', 'utf8');
}

function createGitProject(dir) {
  createProject(dir);
  fs.mkdirSync(path.join(dir, '.git', 'info'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.git', 'info', 'exclude'), '# local excludes\n', 'utf8');
}

function createFakeCodeGraph(dir) {
  const fakePath = path.join(dir, 'fake-codegraph');
  const script = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
fs.writeFileSync(process.env.CODEGRAPH_FAKE_LOG, JSON.stringify(process.argv.slice(2)));
const projectRoot = process.argv[process.argv.length - 1];
fs.mkdirSync(path.join(projectRoot, '.codegraph'), { recursive: true });
fs.writeFileSync(path.join(projectRoot, '.codegraph', 'codegraph.db'), 'fake');
process.exit(Number(process.env.CODEGRAPH_FAKE_EXIT || '0'));
`;
  fs.writeFileSync(fakePath, script, 'utf8');
  fs.chmodSync(fakePath, 0o755);
  return fakePath;
}

console.log('CodeGraph auto-init hook tests');

test('auto-init skips when CodeGraph database already exists', () => {
  withTempDir((dir) => {
    createProject(dir);
    fs.mkdirSync(path.dirname(codegraphDbPath(dir)), { recursive: true });
    fs.writeFileSync(codegraphDbPath(dir), 'already indexed');

    withEnv({
      CODEGRAPH_AUTO_INIT_PROJECT_ROOT: dir,
      CODEGRAPH_INSTALL_BIN: '/missing/codegraph',
      TSP_CODEGRAPH_AUTO_INIT: undefined,
    }, () => {
      const result = runAutoInit('');
      assert.strictEqual(result.status, 'skipped');
      assert.strictEqual(result.reason, 'already-initialized');
    });
  });
});

test('auto-init skips when no project marker exists', () => {
  withTempDir((dir) => {
    withEnv({
      CODEGRAPH_AUTO_INIT_PROJECT_ROOT: dir,
      CODEGRAPH_INSTALL_BIN: '/missing/codegraph',
      TSP_CODEGRAPH_AUTO_INIT: undefined,
    }, () => {
      const result = runAutoInit('');
      assert.strictEqual(result.status, 'skipped');
      assert.strictEqual(result.reason, 'no-project-root');
    });
  });
});

test('auto-init can be disabled with TSP_CODEGRAPH_AUTO_INIT=0', () => {
  withTempDir((dir) => {
    createProject(dir);

    withEnv({
      CODEGRAPH_AUTO_INIT_PROJECT_ROOT: dir,
      CODEGRAPH_INSTALL_BIN: '/missing/codegraph',
      TSP_CODEGRAPH_AUTO_INIT: '0',
    }, () => {
      const result = runAutoInit('');
      assert.strictEqual(result.status, 'skipped');
      assert.strictEqual(result.reason, 'disabled');
    });
  });
});

test('auto-init invokes fake CodeGraph binary with init -i projectRoot', () => {
  withTempDir((dir) => {
    const projectDir = path.join(dir, 'project');
    fs.mkdirSync(projectDir);
    createProject(projectDir);
    const fakeLog = path.join(dir, 'fake-log.json');
    const fakeBin = createFakeCodeGraph(dir);

    withEnv({
      CODEGRAPH_AUTO_INIT_PROJECT_ROOT: projectDir,
      CODEGRAPH_FAKE_LOG: fakeLog,
      CODEGRAPH_INSTALL_BIN: fakeBin,
      TSP_CODEGRAPH_AUTO_INIT: undefined,
      TSP_CODEGRAPH_AUTO_INIT_RETRY_MS: '0',
    }, () => {
      const result = runAutoInit('');
      assert.strictEqual(result.status, 'initialized');
      const normalizedProjectDir = fs.realpathSync(projectDir);
      assert.deepStrictEqual(JSON.parse(fs.readFileSync(fakeLog, 'utf8')), [
        'init',
        '-i',
        normalizedProjectDir,
      ]);
      assert.strictEqual(readState(projectDir).status, 'initialized');
    });
  });
});

test('auto-init adds .codegraph/ to git info exclude', () => {
  withTempDir((dir) => {
    const fakeLog = path.join(dir, 'fake-log.json');
    const fakeBin = createFakeCodeGraph(dir);
    createGitProject(dir);

    withEnv({
      CODEGRAPH_AUTO_INIT_PROJECT_ROOT: dir,
      CODEGRAPH_FAKE_LOG: fakeLog,
      CODEGRAPH_INSTALL_BIN: fakeBin,
      TSP_CODEGRAPH_AUTO_INIT: undefined,
      TSP_CODEGRAPH_AUTO_INIT_RETRY_MS: '0',
    }, () => {
      const result = runAutoInit('');
      assert.strictEqual(result.status, 'initialized');
      const exclude = fs.readFileSync(path.join(dir, '.git', 'info', 'exclude'), 'utf8');
      assert.ok(exclude.includes('.codegraph/'), exclude);
    });
  });
});

console.log(`\nCodeGraph auto-init hook: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
