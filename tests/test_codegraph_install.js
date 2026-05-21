#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  buildExternalInstallEnv,
  runExternalInstall,
} = require('../scripts/lib/install/apply');
const {
  buildInstallCommand,
  mapTarget,
} = require('../scripts/install-codegraph');

let passed = 0;
let failed = 0;

const ROOT = path.join(__dirname, '..');

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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-install-'));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function runInstallApply(args) {
  const result = spawnSync('node', ['scripts/install-apply.js', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const error = result.error ? ` (${result.error.message})` : '';
    throw new Error(result.stderr || `install-apply exited with status ${result.status}${error}`);
  }
  return JSON.parse(result.stdout);
}

function runInstallPlan(args) {
  const result = spawnSync('node', ['scripts/install-plan.js', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const error = result.error ? ` (${result.error.message})` : '';
    throw new Error(result.stderr || `install-plan exited with status ${result.status}${error}`);
  }
  return JSON.parse(result.stdout);
}

console.log('CodeGraph install tests');

test('external install env exposes target, profile, and module id', () => {
  const env = buildExternalInstallEnv({
    target: 'codex',
    profileId: 'developer',
    moduleId: 'knowledge-graph',
  });

  assert.strictEqual(env.TSP_INSTALL_TARGET, 'codex');
  assert.strictEqual(env.TSP_INSTALL_PROFILE, 'developer');
  assert.strictEqual(env.TSP_INSTALL_MODULE_ID, 'knowledge-graph');
});

test('external install runner passes TSP env to child process', () => {
  withTempDir((dir) => {
    const outputPath = path.join(dir, 'env.json');
    const scriptPath = path.join(dir, 'capture-env.js');
    fs.writeFileSync(
      scriptPath,
      `const fs = require('fs'); fs.writeFileSync(${JSON.stringify(outputPath)}, JSON.stringify({ target: process.env.TSP_INSTALL_TARGET, profile: process.env.TSP_INSTALL_PROFILE, module: process.env.TSP_INSTALL_MODULE_ID }));`,
      'utf8'
    );

    runExternalInstall({
      id: 'capture-env',
      moduleId: 'knowledge-graph',
      command: process.execPath,
      scriptPath,
      target: 'claude',
      profileId: 'team',
      cwd: dir,
    });

    const captured = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    assert.deepStrictEqual(captured, {
      target: 'claude',
      profile: 'team',
      module: 'knowledge-graph',
    });
  });
});

test('external install runner can skip side-effecting installers in tests', () => {
  withTempDir((dir) => {
    const outputPath = path.join(dir, 'should-not-exist.txt');
    const scriptPath = path.join(dir, 'write-file.js');
    fs.writeFileSync(
      scriptPath,
      `require('fs').writeFileSync(${JSON.stringify(outputPath)}, 'ran');`,
      'utf8'
    );

    const previous = process.env.TSP_SKIP_EXTERNAL_INSTALLS;
    process.env.TSP_SKIP_EXTERNAL_INSTALLS = '1';
    try {
      runExternalInstall({
        id: 'skip-fixture',
        moduleId: 'knowledge-graph',
        command: process.execPath,
        scriptPath,
        target: 'codex',
        profileId: 'team',
        cwd: dir,
      });
    } finally {
      if (previous === undefined) {
        delete process.env.TSP_SKIP_EXTERNAL_INSTALLS;
      } else {
        process.env.TSP_SKIP_EXTERNAL_INSTALLS = previous;
      }
    }

    assert.ok(!fs.existsSync(outputPath), 'expected skipped installer not to run');
  });
});

test('external install runner treats warn-mode failures as non-blocking', () => {
  withTempDir((dir) => {
    const scriptPath = path.join(dir, 'fail.js');
    fs.writeFileSync(scriptPath, 'process.exit(42);', 'utf8');

    assert.doesNotThrow(() => {
      runExternalInstall({
        id: 'optional-sidecar',
        moduleId: 'design-prototyping',
        command: process.execPath,
        scriptPath,
        target: 'claude',
        profileId: 'full',
        cwd: dir,
        failureMode: 'warn',
        failureHint: 'optional test sidecar',
      });
    });
  });
});

test('CodeGraph wrapper maps only upstream-supported targets', () => {
  assert.strictEqual(mapTarget('codex'), 'codex');
  assert.strictEqual(mapTarget('claude'), 'claude');
  assert.strictEqual(mapTarget('cursor'), 'cursor');
  assert.strictEqual(mapTarget('opencode'), 'opencode');
  assert.strictEqual(mapTarget('antigravity'), null);
});

test('CodeGraph wrapper accepts equals-form target arguments', () => {
  const result = spawnSync('node', ['scripts/install-codegraph.js', '--target=codex', '--dry-run'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      CODEGRAPH_INSTALL_BIN: 'codegraph',
    },
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;

  assert.strictEqual(result.status, 0, output);
  assert.ok(output.includes('--target=codex'), output);
});

test('CodeGraph wrapper never emits target auto for supported dry runs', () => {
  const result = spawnSync('node', ['scripts/install-codegraph.js', '--target', 'codex', '--dry-run'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      CODEGRAPH_INSTALL_BIN: 'codegraph',
    },
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`;

  assert.strictEqual(result.status, 0, output);
  assert.ok(output.includes('--target=codex'), output);
  assert.ok(!output.includes('--target=auto'), output);
  assert.ok(!output.includes('init -i'), output);
});

test('CodeGraph wrapper skips unsupported targets without resolving package bin', () => {
  const install = buildInstallCommand('codebuddy');

  assert.strictEqual(install.supported, false);
  assert.ok(install.reason.includes('codebuddy'));
});

test('developer codex install plan includes CodeGraph skill surface', () => {
  const payload = runInstallApply(['--profile', 'developer', '--target', 'codex', '--dry-run', '--json']);
  const operations = payload.plan.operations || [];

  assert.ok(
    payload.plan.selectedModuleIds.includes('knowledge-graph'),
    'expected developer codex plan to select knowledge-graph'
  );
  assert.ok(
    operations.some((operation) => operation.sourceRelativePath === 'skills/codegraph/SKILL.md'),
    'expected developer codex plan to copy CodeGraph skill'
  );
});

test('team claude install plan includes CodeGraph external install wrapper', () => {
  const plan = runInstallPlan(['--profile', 'team', '--target', 'claude', '--json']);
  const externalInstalls = plan.externalInstalls || [];

  assert.ok(
    plan.selectedModuleIds.includes('knowledge-graph'),
    'expected team claude plan to select knowledge-graph'
  );
  assert.ok(
    externalInstalls.some((install) => (
      install.id === 'codegraph'
        && install.script === 'scripts/install-codegraph.js'
        && install.target === 'claude'
        && install.profileId === 'team'
    )),
    'expected team claude plan to include target-scoped CodeGraph wrapper'
  );
});

test('team claude install apply dry run carries CodeGraph external install context', () => {
  const payload = runInstallApply(['--profile', 'team', '--target', 'claude', '--dry-run', '--json']);
  const externalInstalls = payload.plan.externalInstalls || [];

  assert.ok(
    externalInstalls.some((install) => (
      install.id === 'codegraph'
        && install.moduleId === 'knowledge-graph'
        && install.target === 'claude'
        && install.profileId === 'team'
    )),
    'expected install-apply dry run to carry CodeGraph target/profile/module context'
  );
});

test('full claude install plan marks Open Design as warn-on-failure sidecar', () => {
  const plan = runInstallPlan(['--profile', 'full', '--target', 'claude', '--json']);
  const externalInstalls = plan.externalInstalls || [];

  assert.ok(
    externalInstalls.some((install) => (
      install.id === 'open-design'
        && install.moduleId === 'design-prototyping'
        && install.script === 'scripts/install-open-design.js'
        && install.failureMode === 'warn'
    )),
    'expected full claude plan to keep Open Design optional and non-blocking'
  );
});

test('full claude install apply dry run carries Open Design failure hint', () => {
  const payload = runInstallApply(['--profile', 'full', '--target', 'claude', '--dry-run', '--json']);
  const externalInstalls = payload.plan.externalInstalls || [];
  const openDesign = externalInstalls.find((install) => install.id === 'open-design');

  assert.ok(openDesign, 'expected full claude dry run to include Open Design external install');
  assert.strictEqual(openDesign.failureMode, 'warn');
  assert.ok(
    openDesign.failureHint.includes('optional sidecar'),
    'expected Open Design warning hint to explain the optional sidecar behavior'
  );
});

console.log(`\nCodeGraph install: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
