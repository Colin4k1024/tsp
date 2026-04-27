#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  buildReport,
  collectProjectEntries,
  formatHumanReport,
  inferTaskProgress,
  scanProjects,
} = require('../scripts/project-progress');

const ROOT = path.join(__dirname, '..');

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
    console.error(`    ${error.stack || error.message}`);
  }
}

function withTempDir(fn) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'project-progress-'));
  try {
    fn(tempRoot);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function writeProjectContext(projectRoot, taskName = '2026-04-27-progress-demo', phase = 'execute') {
  const memoryDir = path.join(projectRoot, 'docs', 'memory');
  fs.mkdirSync(memoryDir, { recursive: true });
  fs.writeFileSync(
    path.join(memoryDir, 'project-context.md'),
    [
      '# Project Context',
      '',
      '## 当前活跃任务',
      `- ${taskName}`,
      '',
      '## 当前阶段',
      `- ${phase}`,
      '',
      '## 关键依赖',
      '- project-progress',
      '',
      '## 活跃风险',
      '- evidence freshness',
      '',
      '## 下一步建议',
      '- run progress snapshot',
      '',
    ].join('\n'),
    'utf8',
  );
}

function makeProject(tempRoot, name) {
  const projectRoot = path.join(tempRoot, name);
  fs.mkdirSync(projectRoot, { recursive: true });
  return projectRoot;
}

function makeTask(projectRoot, taskName, files = []) {
  const taskDir = path.join(projectRoot, 'docs', 'artifacts', taskName);
  fs.mkdirSync(taskDir, { recursive: true });
  for (const fileName of files) {
    if (fileName === 'handoff') {
      const handoffDir = path.join(taskDir, 'handoffs');
      fs.mkdirSync(handoffDir, { recursive: true });
      fs.writeFileSync(path.join(handoffDir, '001-tech-lead-to-backend-engineer.md'), 'handoff', 'utf8');
      continue;
    }
    fs.writeFileSync(path.join(taskDir, fileName), `---\nartifact: ${fileName.replace(/\.md$/, '')}\n---\n`, 'utf8');
  }
  return taskDir;
}

function writeRegistry(filePath, entries) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf8');
}

function runCli(args, cwd = ROOT) {
  return spawnSync('node', ['scripts/project-progress.js', ...args], {
    cwd,
    encoding: 'utf8',
  });
}

console.log('Project progress tests');

test('deduplicates registry and explicit project paths by root', () => {
  withTempDir((tempRoot) => {
    const projectRoot = makeProject(tempRoot, 'alpha');
    writeProjectContext(projectRoot);
    const registryPath = path.join(tempRoot, 'projects.json');
    writeRegistry(registryPath, {
      abc123: {
        name: 'alpha',
        root: projectRoot,
        remote: 'git@example.com:alpha.git',
        last_seen: '2026-04-27T00:00:00Z',
      },
    });

    const result = collectProjectEntries({
      registry: registryPath,
      projects: [projectRoot],
      scanRoots: [],
      maxDepth: 2,
    });

    assert.strictEqual(result.projects.length, 1);
    assert.strictEqual(result.projects[0].id, 'abc123');
    assert.strictEqual(result.projects[0].root, projectRoot);
  });
});

test('scan-root finds tracked projects within depth and ignores dependency directories', () => {
  withTempDir((tempRoot) => {
    const tracked = path.join(tempRoot, 'workspace', 'tracked');
    const ignored = path.join(tempRoot, 'workspace', 'node_modules', 'ignored');
    writeProjectContext(tracked);
    writeProjectContext(ignored);

    const found = scanProjects(path.join(tempRoot, 'workspace'), 2);
    assert.deepStrictEqual(found.map((entry) => entry.root), [tracked]);
  });
});

test('infers phase and progress from artifact presence', () => {
  assert.deepStrictEqual(inferTaskProgress({ prd: true }), { phase: 'intake', progress: 15 });
  assert.deepStrictEqual(inferTaskProgress({ prd: true, deliveryPlan: true }), { phase: 'plan', progress: 30 });
  assert.deepStrictEqual(inferTaskProgress({ handoff: true }), { phase: 'handoff-ready', progress: 40 });
  assert.deepStrictEqual(inferTaskProgress({ executeLog: true }), { phase: 'execute', progress: 55 });
  assert.deepStrictEqual(
    inferTaskProgress({ testPlan: true, launchAcceptance: true }),
    { phase: 'review', progress: 70 },
  );
  assert.deepStrictEqual(
    inferTaskProgress({ deploymentContext: true, releasePlan: true }),
    { phase: 'release', progress: 85 },
  );
  assert.deepStrictEqual(inferTaskProgress({ closeout: true }), { phase: 'closed', progress: 100 });
});

test('reports missing project roots without failing the whole report', () => {
  withTempDir((tempRoot) => {
    const registryPath = path.join(tempRoot, 'projects.json');
    writeRegistry(registryPath, {
      missing: {
        name: 'missing-project',
        root: path.join(tempRoot, 'does-not-exist'),
      },
    });

    const report = buildReport({
      registry: registryPath,
      projects: [],
      scanRoots: [],
      maxDepth: 2,
    });

    assert.strictEqual(report.projects.length, 1);
    assert.strictEqual(report.projects[0].status, 'missing');
    assert.strictEqual(report.projects[0].summary.totalTasks, 0);
  });
});

test('builds project summaries and task details for active and closed projects', () => {
  withTempDir((tempRoot) => {
    const activeRoot = makeProject(tempRoot, 'active');
    const activeTask = '2026-04-27-active-task';
    writeProjectContext(activeRoot, activeTask, 'execute');
    makeTask(activeRoot, activeTask, ['prd.md', 'delivery-plan.md', 'handoff', 'execute-log.md']);

    const closedRoot = makeProject(tempRoot, 'closed');
    const closedTask = '2026-04-26-closed-task';
    writeProjectContext(closedRoot, closedTask, 'closed');
    makeTask(closedRoot, closedTask, ['prd.md', 'delivery-plan.md', 'closeout-summary.md']);

    const registryPath = path.join(tempRoot, 'projects.json');
    writeRegistry(registryPath, {
      active: { name: 'active', root: activeRoot },
      closed: { name: 'closed', root: closedRoot },
    });

    const report = buildReport({
      registry: registryPath,
      projects: [],
      scanRoots: [],
      maxDepth: 2,
    });

    const active = report.projects.find((project) => project.name === 'active');
    const closed = report.projects.find((project) => project.name === 'closed');
    assert.strictEqual(active.status, 'active');
    assert.strictEqual(active.summary.averageProgress, 55);
    assert.strictEqual(active.currentContext.phase, 'execute');
    assert.strictEqual(active.tasks[0].phase, 'execute');
    assert.ok(active.tasks[0].missing.includes('test-plan.md'));
    assert.strictEqual(closed.status, 'closed');
    assert.strictEqual(closed.summary.averageProgress, 100);
  });
});

test('fixture projects cover no-artifacts, intake, execute, release, and closed states', () => {
  const fixtureRoot = path.join(ROOT, 'tests', 'fixtures', 'project-progress');
  const report = buildReport({
    registry: path.join(fixtureRoot, 'missing-registry.json'),
    projects: [],
    scanRoots: [fixtureRoot],
    maxDepth: 1,
  });

  const byName = Object.fromEntries(report.projects.map((project) => [project.name, project]));
  assert.strictEqual(byName['no-artifacts'].status, 'untracked');
  assert.strictEqual(byName['intake-only'].tasks[0].phase, 'intake');
  assert.strictEqual(byName['execute-ready'].tasks[0].phase, 'handoff-ready');
  assert.strictEqual(byName.released.tasks[0].phase, 'release');
  assert.strictEqual(byName.closed.status, 'closed');
});

test('human and JSON CLI output include project and task progress', () => {
  withTempDir((tempRoot) => {
    const projectRoot = makeProject(tempRoot, 'cli-project');
    const taskName = '2026-04-27-cli-task';
    writeProjectContext(projectRoot, taskName, 'review');
    makeTask(projectRoot, taskName, ['prd.md', 'delivery-plan.md', 'test-plan.md', 'launch-acceptance.md']);
    const registryPath = path.join(tempRoot, 'projects.json');
    writeRegistry(registryPath, {
      cli: { name: 'cli-project', root: projectRoot },
    });

    const jsonResult = runCli(['--registry', registryPath, '--json']);
    assert.strictEqual(jsonResult.status, 0, jsonResult.stderr);
    const payload = JSON.parse(jsonResult.stdout);
    assert.strictEqual(payload.projects[0].name, 'cli-project');
    assert.strictEqual(payload.projects[0].tasks[0].progress, 70);

    const human = formatHumanReport(payload);
    assert.ok(human.includes('cli-project'));
    assert.ok(human.includes('2026-04-27-cli-task'));

    const humanResult = runCli(['--registry', registryPath]);
    assert.strictEqual(humanResult.status, 0, humanResult.stderr);
    assert.ok(humanResult.stdout.includes('Project progress snapshot'));
    assert.ok(humanResult.stdout.includes('cli-project'));
  });
});

console.log(`\nProject progress: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
