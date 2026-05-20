#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const { resolveInstallPlan } = require(path.join(ROOT, 'scripts', 'lib', 'install-manifests'));
const { normalizeInstallRequest } = require(path.join(ROOT, 'scripts', 'lib', 'install', 'request'));
const { collectTargetSupportMatrix } = require(path.join(ROOT, 'scripts', 'lib', 'release-health'));

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

function withTempHome(fn) {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'code-agent-support-'));
  try {
    fn(tempHome);
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

function runInstallApply(args, env) {
  const result = spawnSync('node', ['scripts/install-apply.js', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      TSP_SKIP_EXTERNAL_INSTALLS: '1',
      ...env,
    },
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `install-apply exited with ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

function assertDoctorOk(target, env) {
  const report = runInstallApply(['doctor', '--target', target, '--json'], env);
  assert.strictEqual(report.summary.checkedCount, 1, `${target} doctor should inspect one target`);
  assert.strictEqual(report.summary.errorCount, 0, `${target} doctor should not report errors`);
  assert.strictEqual(report.summary.warningCount, 0, `${target} doctor should not report warnings`);
  assert.strictEqual(report.results[0].status, 'ok', `${target} doctor status should be ok`);
}

console.log('Code agent support realignment tests');

test('claude-code aliases normalize to canonical claude target', () => {
  for (const alias of ['claude-code', 'claudecode']) {
    const request = normalizeInstallRequest({
      target: alias,
      profileId: 'team',
      moduleIds: [],
      includeComponentIds: [],
      excludeComponentIds: [],
      languages: [],
    });
    assert.strictEqual(request.target, 'claude');

    const plan = resolveInstallPlan({ profileId: 'team', target: alias, repoRoot: ROOT });
    assert.strictEqual(plan.target, 'claude');
    assert.strictEqual(plan.targetAdapterId, 'claude-home');
  }
});

test('codex and opencode team/full plans include framework-language', () => {
  for (const target of ['codex', 'opencode']) {
    for (const profileId of ['team', 'full']) {
      const plan = resolveInstallPlan({ profileId, target, repoRoot: ROOT });
      assert.ok(plan.selectedModuleIds.includes('rules-core'), `${target}/${profileId} should select rules-core`);
      assert.ok(plan.selectedModuleIds.includes('framework-language'), `${target}/${profileId} should select framework-language`);
      assert.ok(!plan.skippedModuleIds.includes('framework-language'), `${target}/${profileId} should not skip framework-language`);
    }
  }
});

test('public release matrix defaults to the three recommended code agents', () => {
  const matrix = collectTargetSupportMatrix({ repoRoot: ROOT, profileId: 'team' });
  assert.deepStrictEqual(matrix.map((entry) => entry.target), ['claude', 'codex', 'opencode']);
  for (const entry of matrix) {
    assert.strictEqual(entry.level, 'recommended', `${entry.target} should be recommended`);
  }
});

test('claude apply creates Claude Code plugin assets and passes doctor', () => {
  withTempHome((tempHome) => {
    const payload = runInstallApply(['--profile', 'team', '--target', 'claude', '--json'], {
      HOME: tempHome,
    });
    assert.strictEqual(payload.result.target, 'claude');

    const claudeRoot = path.join(tempHome, '.claude');
    assert.ok(fs.existsSync(path.join(claudeRoot, 'plugin.json')));
    assert.ok(fs.existsSync(path.join(claudeRoot, 'commands', 'team-help.md')));
    assert.ok(fs.existsSync(path.join(claudeRoot, 'skills', 'frontend-engineering', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(claudeRoot, 'agents', 'roles', 'tech-lead.md')));

    const settings = JSON.parse(fs.readFileSync(path.join(claudeRoot, 'settings.json'), 'utf8'));
    assert.ok(settings.hooks, 'Claude settings should include merged hook registrations');

    assertDoctorOk('claude', { HOME: tempHome });
  });
});

test('codex apply creates plugin assets, root entrypoints, config, and marketplace', () => {
  withTempHome((tempHome) => {
    const agentsHome = path.join(tempHome, '.agents');
    const payload = runInstallApply(['--profile', 'team', '--target', 'codex', '--json'], {
      HOME: tempHome,
      AGENTS_HOME_DIR: agentsHome,
    });
    assert.strictEqual(payload.result.target, 'codex');

    assert.ok(fs.existsSync(path.join(tempHome, '.codex', 'plugins', 'team-skills-platform', '.codex-plugin', 'plugin.json')));
    assert.ok(fs.existsSync(path.join(tempHome, '.codex', 'commands', 'team-help.md')));
    assert.ok(fs.existsSync(path.join(tempHome, '.codex', 'skills', 'frontend-engineering', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(tempHome, '.codex', 'agents', 'tech-lead.md')));
    assert.ok(fs.existsSync(path.join(tempHome, '.codex', 'agents', 'specialist-architect.md')));

    const configToml = fs.readFileSync(path.join(tempHome, '.codex', 'config.toml'), 'utf8');
    assert.ok(configToml.includes('[plugins."team-skills-platform"]'));

    const marketplace = JSON.parse(fs.readFileSync(path.join(agentsHome, 'plugins', 'marketplace.json'), 'utf8'));
    assert.ok(marketplace.plugins.some((plugin) => plugin.name === 'team-skills-platform'));

    assertDoctorOk('codex', {
      HOME: tempHome,
      AGENTS_HOME_DIR: agentsHome,
    });
  });
});

test('opencode apply creates config-root plugin assets, command, agents, and AGENTS index', () => {
  withTempHome((tempHome) => {
    const payload = runInstallApply(['--profile', 'team', '--target', 'opencode', '--json'], {
      HOME: tempHome,
    });
    assert.strictEqual(payload.result.target, 'opencode');

    const opencodeRoot = path.join(tempHome, '.config', 'opencode');
    assert.ok(fs.existsSync(path.join(opencodeRoot, 'plugins', 'team-skills-platform', '.opencode-plugin', 'config.json')));
    assert.ok(fs.existsSync(path.join(opencodeRoot, 'command', 'team-help.md')));
    assert.ok(fs.existsSync(path.join(opencodeRoot, 'agents', 'tech-lead.md')));
    assert.ok(fs.existsSync(path.join(opencodeRoot, 'agents', 'specialist-architect.md')));

    const agentsMd = fs.readFileSync(path.join(opencodeRoot, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('<!-- team-skills-platform -->'));
    assert.ok(agentsMd.includes('plugins/team-skills-platform/agents/roles/tech-lead.md'));

    assertDoctorOk('opencode', { HOME: tempHome });
  });
});

console.log(`\nCode agent support realignment: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
