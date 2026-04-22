#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

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

function runHelp(args, cwd = ROOT) {
  const result = spawnSync('node', ['scripts/workflow-help.js', ...args], {
    cwd,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `workflow-help exited with status ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

function withTempRepo(fn) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-help-catalog-'));
  const repoDir = path.join(tempRoot, 'repo');
  const taskName = '2026-04-17-router-catalog';
  const taskDir = path.join(repoDir, 'docs', 'artifacts', taskName);
  fs.mkdirSync(path.dirname(taskDir), { recursive: true });
  fs.cpSync(path.join(ROOT, 'tests', 'fixtures', 'workflow-valid'), taskDir, { recursive: true });
  fs.mkdirSync(path.join(repoDir, 'docs', 'memory'), { recursive: true });
  fs.writeFileSync(
    path.join(repoDir, 'docs', 'memory', 'project-context.md'),
    [
      '# Project Context',
      '',
      '## 当前活跃任务',
      `- ${taskName}`,
      '',
      '## 当前阶段',
      '- execute-prep',
      '',
      '## 关键依赖',
      '- workflow-help',
      '',
      '## 活跃风险',
      '- workflow-risk-monitored',
      '',
      '## 下一步建议',
      '- proceed execute',
      '',
    ].join('\n'),
    'utf8',
  );

  try {
    fn({
      repoDir,
      taskDir,
      taskName,
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

console.log('Workflow help catalog tests');

test('workflow-help JSON includes catalog routing metadata fields', () => {
  withTempRepo(({ repoDir, taskDir }) => {
    const payload = runHelp(['--cwd', repoDir, '--task-dir', taskDir, '--json']);
    assert.ok(typeof payload.routerSource === 'string');
    assert.ok(['catalog', 'fallback'].includes(payload.routerSource));
    assert.ok(payload.decisionEvidence && typeof payload.decisionEvidence === 'object');
    assert.ok(Array.isArray(payload.nextCommandCandidates));
    assert.ok(payload.nextCommandCandidates.length >= 1);
  });
});

test('workflow-help blocks progression when project-context required sections are missing', () => {
  withTempRepo(({ repoDir, taskDir }) => {
    fs.writeFileSync(
      path.join(repoDir, 'docs', 'memory', 'project-context.md'),
      '# Project Context\n\n## 当前阶段\n- execute-prep\n',
      'utf8',
    );

    const payload = runHelp(['--cwd', repoDir, '--task-dir', taskDir, '--json']);
    assert.strictEqual(payload.recommendedCommand, '/team-plan');
    assert.ok(
      payload.missingPrerequisites.some((item) => item.includes('write-project-context')),
      'expected remediation command in missing prerequisites',
    );
  });
});

console.log(`\nWorkflow help catalog: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
