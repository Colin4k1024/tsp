#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  atomicWrite,
  appendMemory,
  ensureArtifact,
  ensureHandoff,
  ensureTask,
  nextAvailableFilePath,
  parseIndexFile,
  sanitizeRole,
  sanitizeSlug,
  validateContent,
  validateCwd,
  validateDate,
  validateTitle,
  writeSessionSummary,
  writeProjectContext,
  yamlEscape,
} = require('../scripts/artifact-persistence');

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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-persist-'));
  fs.mkdirSync(path.join(root, 'templates'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, '..', 'templates', 'launch-acceptance.md'), path.join(root, 'templates', 'launch-acceptance.md'));
  fs.copyFileSync(path.join(__dirname, '..', 'templates', 'deployment-context.md'), path.join(root, 'templates', 'deployment-context.md'));
  fs.copyFileSync(path.join(__dirname, '..', 'templates', 'release-plan.md'), path.join(root, 'templates', 'release-plan.md'));
  fs.copyFileSync(path.join(__dirname, '..', 'templates', 'closeout-summary.md'), path.join(root, 'templates', 'closeout-summary.md'));
  try {
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

console.log('Artifact persistence tests');

test('ensure-task creates task directory and canonical index row', () => {
  withTempProject((root) => {
    const result = ensureTask({ cwd: root, date: '2026-04-15', slug: 'router-upgrade', state: 'intake' });
    assert.ok(fs.existsSync(result.taskDir));

    const rows = parseIndexFile(path.join(root, 'docs', 'artifacts', 'INDEX.md'));
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].date, '2026-04-15');
    assert.strictEqual(rows[0].task, 'router-upgrade');
    assert.strictEqual(rows[0].status, 'intake');
    assert.ok(Object.prototype.hasOwnProperty.call(rows[0], 'launchAcceptance'));
    assert.ok(Object.prototype.hasOwnProperty.call(rows[0], 'deploymentContext'));
    assert.ok(Object.prototype.hasOwnProperty.call(rows[0], 'closeout'));
  });
});

test('ensure-artifact creates template-backed file and updates index', () => {
  withTempProject((root) => {
    ensureTask({ cwd: root, date: '2026-04-15', slug: 'router-upgrade', state: 'intake' });
    const result = ensureArtifact({
      cwd: root,
      date: '2026-04-15',
      slug: 'router-upgrade',
      artifact: 'launch-acceptance',
      role: 'qa-engineer',
      status: 'draft',
    });

    assert.ok(result.created);
    const content = fs.readFileSync(result.artifactPath, 'utf8');
    assert.ok(content.includes('artifact: launch-acceptance'));
    assert.ok(content.includes('role: qa-engineer'));
    assert.ok(content.includes('# 上线验收模板'));

    const rows = parseIndexFile(path.join(root, 'docs', 'artifacts', 'INDEX.md'));
    assert.strictEqual(rows[0].launchAcceptance, '[launch-acceptance.md](2026-04-15-router-upgrade/launch-acceptance.md)');
    assert.strictEqual(rows[0].status, 'accepted');
  });
});

test('ensure-artifact migrates legacy index schema when updating row', () => {
  withTempProject((root) => {
    const artifactsRoot = path.join(root, 'docs', 'artifacts');
    fs.mkdirSync(path.join(artifactsRoot, '2026-04-09-project-health-audit'), { recursive: true });
    fs.writeFileSync(
      path.join(artifactsRoot, 'INDEX.md'),
      [
        '# Artifacts Index',
        '',
        '| 日期 | 任务 | PRD | Delivery Plan | Arch Design | ADR | Test Plan | Release Plan | 状态 |',
        '|------|------|-----|---------------|-------------|-----|-----------|--------------|------|',
        '| 2026-04-09 | project-health-audit | [prd.md](2026-04-09-project-health-audit/prd.md) | - | - | - | - | - | review |',
        '',
      ].join('\n'),
      'utf8'
    );

    ensureArtifact({
      cwd: root,
      taskDir: path.join(artifactsRoot, '2026-04-09-project-health-audit'),
      artifact: 'deployment-context',
      role: 'devops-engineer',
      status: 'draft',
    });

    const indexContent = fs.readFileSync(path.join(artifactsRoot, 'INDEX.md'), 'utf8');
    assert.ok(indexContent.includes('Launch Acceptance'));
    assert.ok(indexContent.includes('Deployment Context'));
    assert.ok(indexContent.includes('Closeout'));
    assert.ok(fs.existsSync(path.join(artifactsRoot, 'INDEX.md.backup')));

    const rows = parseIndexFile(path.join(artifactsRoot, 'INDEX.md'));
    assert.strictEqual(rows[0].deploymentContext, '[deployment-context.md](2026-04-09-project-health-audit/deployment-context.md)');
    assert.strictEqual(rows[0].status, 'released');
  });
});

test('yamlEscape quotes special characters for frontmatter safety', () => {
  assert.strictEqual(yamlEscape('qa:lead'), '"qa:lead"');
  assert.strictEqual(yamlEscape('line\nbreak'), '"line\\nbreak"');
});

test('sanitizeSlug rejects path traversal input', () => {
  assert.throws(() => sanitizeSlug('../escape'));
  assert.throws(() => sanitizeSlug('nested/path'));
  assert.throws(() => sanitizeSlug('x'.repeat(51)), /Slug too long/);
});

test('sanitizeRole rejects path separators and unexpected characters', () => {
  assert.strictEqual(sanitizeRole('tech-lead'), 'tech-lead');
  assert.throws(() => sanitizeRole('../lead'));
  assert.throws(() => sanitizeRole('lead/admin'));
  assert.throws(() => sanitizeRole('x'.repeat(51)), /Role too long/);
});

test('validateDate rejects impossible calendar values', () => {
  assert.strictEqual(validateDate('2026-04-15'), '2026-04-15');
  assert.throws(() => validateDate('2026-13-40'), /Invalid date value/);
});

test('validateTitle rejects multiline input and validateContent enforces size', () => {
  assert.strictEqual(validateTitle('Release Notes'), 'Release Notes');
  assert.throws(() => validateTitle('line 1\nline 2'), /Title must not contain newlines/);
  assert.strictEqual(validateContent('ok'), 'ok');
  assert.throws(() => validateContent('x'.repeat(100001)), /Content exceeds maximum length/);
});

test('validateCwd rejects missing directories', () => {
  withTempProject((root) => {
    assert.strictEqual(validateCwd(root), root);
    assert.throws(() => validateCwd(path.join(root, 'missing-dir')), /Invalid cwd/);
  });
});

test('atomicWrite cleans up temp file when rename fails', () => {
  withTempProject((root) => {
    const targetPath = path.join(root, 'docs', 'memory', 'project-context.md');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    const originalRenameSync = fs.renameSync;
    try {
      fs.renameSync = () => {
        throw new Error('rename failed');
      };

      assert.throws(() => atomicWrite(targetPath, 'hello world'), /rename failed/);
      const tempPath = `${targetPath}.tmp.${process.pid}`;
      assert.ok(!fs.existsSync(tempPath));
    } finally {
      fs.renameSync = originalRenameSync;
    }
  });
});

test('nextAvailableFilePath skips existing file names', () => {
  withTempProject((root) => {
    const handoffDir = path.join(root, 'docs', 'artifacts', '2026-04-15-router-upgrade', 'handoffs');
    fs.mkdirSync(handoffDir, { recursive: true });
    fs.writeFileSync(path.join(handoffDir, '001-tech-lead-to-backend-engineer.md'), 'existing', 'utf8');

    const result = nextAvailableFilePath(
      (sequence) => path.join(handoffDir, `${String(sequence).padStart(3, '0')}-tech-lead-to-backend-engineer.md`),
      1
    );

    assert.strictEqual(path.basename(result.filePath), '002-tech-lead-to-backend-engineer.md');
    assert.strictEqual(result.sequence, 2);
  });
});

test('nextAvailableFilePath fails after max sequence attempts', () => {
  withTempProject((root) => {
    const handoffDir = path.join(root, 'docs', 'artifacts', '2026-04-15-router-upgrade', 'handoffs');
    fs.mkdirSync(handoffDir, { recursive: true });
    fs.writeFileSync(path.join(handoffDir, '001-tech-lead-to-backend-engineer.md'), 'existing', 'utf8');
    fs.writeFileSync(path.join(handoffDir, '002-tech-lead-to-backend-engineer.md'), 'existing', 'utf8');

    assert.throws(() => nextAvailableFilePath(
      (sequence) => path.join(handoffDir, `${String(sequence).padStart(3, '0')}-tech-lead-to-backend-engineer.md`),
      1,
      1
    ), /Exceeded maximum sequence attempts/);
  });
});

test('ensure-artifact rejects duplicate artifact writes', () => {
  withTempProject((root) => {
    ensureTask({ cwd: root, date: '2026-04-15', slug: 'router-upgrade', state: 'intake' });
    ensureArtifact({
      cwd: root,
      date: '2026-04-15',
      slug: 'router-upgrade',
      artifact: 'prd',
      role: 'tech-lead',
      status: 'draft',
    });

    assert.throws(() => ensureArtifact({
      cwd: root,
      date: '2026-04-15',
      slug: 'router-upgrade',
      artifact: 'prd',
      role: 'tech-lead',
      status: 'draft',
    }));
  });
});

test('ensure-artifact fails with clear message when template is missing', () => {
  withTempProject((root) => {
    fs.rmSync(path.join(root, 'templates', 'launch-acceptance.md'));
    ensureTask({ cwd: root, date: '2026-04-15', slug: 'router-upgrade', state: 'intake' });

    assert.throws(
      () => ensureArtifact({
        cwd: root,
        date: '2026-04-15',
        slug: 'router-upgrade',
        artifact: 'launch-acceptance',
        role: 'qa-engineer',
        status: 'draft',
      }),
      /Template not found/
    );
  });
});

test('ensure-handoff creates numbered files with structured skeleton', () => {
  withTempProject((root) => {
    ensureTask({ cwd: root, date: '2026-04-15', slug: 'router-upgrade', state: 'plan' });

    const first = ensureHandoff({
      cwd: root,
      date: '2026-04-15',
      slug: 'router-upgrade',
      fromRole: 'tech-lead',
      toRole: 'backend-engineer',
      status: 'draft',
    });
    const second = ensureHandoff({
      cwd: root,
      date: '2026-04-15',
      slug: 'router-upgrade',
      fromRole: 'backend-engineer',
      toRole: 'qa-engineer',
      status: 'draft',
    });

    assert.ok(first.handoffPath.endsWith('001-tech-lead-to-backend-engineer.md'));
    assert.ok(second.handoffPath.endsWith('002-backend-engineer-to-qa-engineer.md'));
    const content = fs.readFileSync(first.handoffPath, 'utf8');
    assert.ok(content.includes('artifact: handoff'));
    assert.ok(content.includes('# Handoff: tech-lead -> backend-engineer'));
    assert.ok(content.includes('## 下游质疑记录'));
  });
});

test('ensure-handoff rejects invalid role names', () => {
  withTempProject((root) => {
    ensureTask({ cwd: root, date: '2026-04-15', slug: 'router-upgrade', state: 'plan' });

    assert.throws(() => ensureHandoff({
      cwd: root,
      date: '2026-04-15',
      slug: 'router-upgrade',
      fromRole: '../tech-lead',
      toRole: 'backend-engineer',
      status: 'draft',
    }), /Invalid role name/);
  });
});

test('ensure-handoff skips conflicting sequence files without overwriting', () => {
  withTempProject((root) => {
    ensureTask({ cwd: root, date: '2026-04-15', slug: 'router-upgrade', state: 'plan' });
    const handoffDir = path.join(root, 'docs', 'artifacts', '2026-04-15-router-upgrade', 'handoffs');
    fs.mkdirSync(handoffDir, { recursive: true });
    fs.writeFileSync(path.join(handoffDir, '001-tech-lead-to-backend-engineer.md'), 'existing', 'utf8');

    const created = ensureHandoff({
      cwd: root,
      date: '2026-04-15',
      slug: 'router-upgrade',
      fromRole: 'tech-lead',
      toRole: 'backend-engineer',
      status: 'draft',
    });

    assert.ok(created.handoffPath.endsWith('002-tech-lead-to-backend-engineer.md'));
    assert.strictEqual(fs.readFileSync(path.join(handoffDir, '001-tech-lead-to-backend-engineer.md'), 'utf8'), 'existing');
  });
});

test('append-memory creates and appends lessons entries', () => {
  withTempProject((root) => {
    const first = appendMemory({
      cwd: root,
      date: '2026-04-15',
      memoryType: 'lessons',
      title: 'Gate Drift',
      content: '- keep workflow gates aligned',
    });
    appendMemory({
      cwd: root,
      date: '2026-04-15',
      memoryType: 'lessons',
      title: 'Second Note',
      content: '- verify persistence output',
    });

    const content = fs.readFileSync(first.memoryPath, 'utf8');
    assert.ok(content.includes('# Lessons Learned'));
    assert.ok(content.includes('## 2026-04-15 - Gate Drift'));
    assert.ok(content.includes('## 2026-04-15 - Second Note'));
  });
});

test('write-session-summary creates incrementing session files', () => {
  withTempProject((root) => {
    const first = writeSessionSummary({
      cwd: root,
      date: '2026-04-15',
      slug: 'router-upgrade',
      role: 'tech-lead',
      status: 'draft',
      content: '## 链路起止\n- `/team-intake` -> `/team-closeout`',
    });
    const second = writeSessionSummary({
      cwd: root,
      date: '2026-04-15',
      slug: 'router-upgrade',
      role: 'tech-lead',
      status: 'draft',
      content: '## 链路起止\n- replay',
    });

    assert.ok(first.sessionPath.endsWith('2026-04-15-001-router-upgrade.md'));
    assert.ok(second.sessionPath.endsWith('2026-04-15-002-router-upgrade.md'));
    const content = fs.readFileSync(first.sessionPath, 'utf8');
    assert.ok(content.includes('artifact: session-summary'));
    assert.ok(content.includes('## 链路起止'));
  });
});

test('write-session-summary skips conflicting file names without overwriting', () => {
  withTempProject((root) => {
    const sessionsDir = path.join(root, 'docs', 'memory', 'sessions');
    fs.mkdirSync(sessionsDir, { recursive: true });
    const existingPath = path.join(sessionsDir, '2026-04-15-001-router-upgrade.md');
    fs.writeFileSync(existingPath, 'existing', 'utf8');

    const created = writeSessionSummary({
      cwd: root,
      date: '2026-04-15',
      slug: 'router-upgrade',
      role: 'tech-lead',
      status: 'draft',
      content: '## 链路起止\n- replay',
    });

    assert.ok(created.sessionPath.endsWith('2026-04-15-002-router-upgrade.md'));
    assert.strictEqual(fs.readFileSync(existingPath, 'utf8'), 'existing');
  });
});

test('write-project-context refreshes structured project context file', () => {
  withTempProject((root) => {
    const result = writeProjectContext({
      cwd: root,
      projectName: 'Harness Demo',
      currentTask: '2026-04-15-router-upgrade',
      phase: 'release-prep',
      techStack: ['Node.js', 'Markdown'],
      dependency: ['GitHub Actions', 'docs/artifacts/INDEX.md'],
      risk: ['artifact drift'],
      nextStep: ['run artifact:persist for release-plan'],
    });

    const content = fs.readFileSync(result.projectContextPath, 'utf8');
    assert.ok(content.includes('## 项目名称'));
    assert.ok(content.includes('Harness Demo'));
    assert.ok(content.includes('- 2026-04-15-router-upgrade'));
    assert.ok(content.includes('- release-prep'));
    assert.ok(content.includes('- artifact drift'));
  });
});

console.log(`\nArtifact persistence: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
