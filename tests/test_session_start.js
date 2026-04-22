#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

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

function withTempProject(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'session-start-'));
  const memoryDir = path.join(root, 'docs', 'memory');
  fs.mkdirSync(memoryDir, { recursive: true });
  try {
    fn(root, memoryDir);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

console.log('Session start tests');

test('session start surfaces structured project-context details', () => {
  withTempProject((root, memoryDir) => {
    fs.writeFileSync(
      path.join(memoryDir, 'project-context.md'),
      [
        '# Project Context',
        '',
        '## 项目名称',
        'Team Skills Platform',
        '',
        '## Tech Stack',
        '- Node.js',
        '- Markdown',
        '',
        '## 当前活跃任务',
        '- team-help MVP',
        '',
        '## 当前阶段',
        '- execute-prep',
        '',
        '## 活跃风险',
        '- gate drift',
        '',
        '## 下一步建议',
        '- run build and validate',
      ].join('\n'),
      'utf8'
    );

    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, '..', 'hooks', 'memory-persistence', 'session-start.js')],
      {
        input: '{}',
        encoding: 'utf8',
        env: {
          ...process.env,
          CLAUDE_PROJECT_PATH: root,
          HOME: os.homedir(),
        },
      }
    );

    assert.strictEqual(result.status, 0);
    const output = JSON.parse(result.stdout);
    const additionalContext = output.hookSpecificOutput.additionalContext;
    assert.ok(additionalContext.includes('🎯 当前任务: - team-help MVP'));
    assert.ok(additionalContext.includes('📍 当前阶段: - execute-prep'));
    assert.ok(additionalContext.includes('⚠️ 活跃风险: - gate drift'));
    assert.ok(additionalContext.includes('➡️ 下一步: - run build and validate'));
  });
});

console.log(`\nSession start: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
