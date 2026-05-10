#!/usr/bin/env node
'use strict';

/**
 * Plugin completeness tests for claude, codex, and opencode install targets.
 *
 * Verifies that after a full-profile install:
 * - The number of installed skills/commands/agents matches the install-plan expectation
 * - Target-specific paths are used (codex: flatten-skill-copy, opencode: command/ singular)
 * - Skipped modules (hooks-runtime/evolution for codex, rtk-optimization for both) are absent
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

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
    console.error(`    ${error.message}`);
  }
}

function withTempHome(fn) {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-completeness-'));
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
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `install-apply exited with ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

function runInstallPlan(target, profileId = 'full') {
  const result = spawnSync(
    'node',
    ['scripts/install-plan.js', '--profile', profileId, '--target', target, '--json'],
    {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      env: process.env,
    }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `install-plan exited with ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

/** Count immediate subdirectories of a directory */
function countSubdirs(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((name) => {
    const p = path.join(dir, name);
    return fs.statSync(p).isDirectory();
  }).length;
}

/** List .md files (non-recursive) in a directory */
function listMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
}

console.log('Plugin completeness tests');

// ─── codex ──────────────────────────────────────────────────────────────────

test('codex full plan produces skippedModuleIds for hooks-runtime, evolution, rtk-optimization', () => {
  const plan = runInstallPlan('codex', 'full');
  assert.deepStrictEqual(
    plan.skippedModuleIds.sort(),
    ['evolution', 'hooks-runtime', 'rtk-optimization'],
    'codex should skip exactly hooks-runtime, evolution, and rtk-optimization'
  );
});

test('codex full plan includes flatten-skill-copy operations for all non-skipped skills', () => {
  const plan = runInstallPlan('codex', 'full');
  const skillCopies = plan.operations.filter((op) => op.strategy === 'flatten-skill-copy');
  assert.ok(skillCopies.length > 100, `Expected >100 flatten-skill-copy ops, got ${skillCopies.length}`);

  // Verify all skill destinations point to ~/.codex/skills/ (using plan targetRoot)
  const codexSkillsDir = path.join(plan.targetRoot, 'skills');
  skillCopies.forEach((op) => {
    assert.ok(
      op.destinationPath.startsWith(codexSkillsDir),
      `Skill op destination ${op.destinationPath} should be under ${codexSkillsDir}`
    );
  });
});

test('codex full install: installed skill count matches plan flatten-skill-copy count', () => {
  const plan = runInstallPlan('codex', 'full');
  const expectedSkillCount = plan.operations.filter((op) => op.strategy === 'flatten-skill-copy').length;

  withTempHome((tempHome) => {
    const agentsHome = path.join(tempHome, '.agents');
    runInstallApply(['--profile', 'full', '--target', 'codex', '--json'], {
      HOME: tempHome,
      AGENTS_HOME_DIR: agentsHome,
    });

    const codexSkillsDir = path.join(tempHome, '.codex', 'skills');
    const installedCount = countSubdirs(codexSkillsDir);
    assert.strictEqual(
      installedCount,
      expectedSkillCount,
      `Expected ${expectedSkillCount} skill dirs in ~/.codex/skills/, got ${installedCount}`
    );
  });
});

test('codex full install: root commands directory contains all codex-command-copy entries', () => {
  const plan = runInstallPlan('codex', 'full');
  const commandCopyOps = plan.operations.filter((op) => op.strategy === 'codex-command-copy');
  const expectedFiles = commandCopyOps
    .filter((op) => op.sourceRelativePath && op.sourceRelativePath.endsWith('.md'))
    .map((op) => path.basename(op.destinationPath));

  withTempHome((tempHome) => {
    const agentsHome = path.join(tempHome, '.agents');
    runInstallApply(['--profile', 'full', '--target', 'codex', '--json'], {
      HOME: tempHome,
      AGENTS_HOME_DIR: agentsHome,
    });

    const codexCmdsDir = path.join(tempHome, '.codex', 'commands');
    const installedFiles = listMdFiles(codexCmdsDir);

    expectedFiles.forEach((f) => {
      assert.ok(
        installedFiles.includes(f),
        `Expected ${f} in ~/.codex/commands/, but not found (installed: ${installedFiles.slice(0, 5).join(', ')}...)`
      );
    });
  });
});

test('codex full install: no hooks directory or settings.json at root (hooks-runtime skipped)', () => {
  withTempHome((tempHome) => {
    const agentsHome = path.join(tempHome, '.agents');
    runInstallApply(['--profile', 'full', '--target', 'codex', '--json'], {
      HOME: tempHome,
      AGENTS_HOME_DIR: agentsHome,
    });

    const codexRoot = path.join(tempHome, '.codex');
    assert.ok(
      !fs.existsSync(path.join(codexRoot, 'hooks')),
      'hooks dir should NOT exist in ~/.codex/ (hooks-runtime is skipped for codex)'
    );
    assert.ok(
      !fs.existsSync(path.join(codexRoot, 'settings.json')),
      'settings.json should NOT exist in ~/.codex/ (hooks-runtime is skipped for codex)'
    );
  });
});

// ─── opencode ───────────────────────────────────────────────────────────────

test('opencode full plan: only rtk-optimization is skipped', () => {
  const plan = runInstallPlan('opencode', 'full');
  assert.deepStrictEqual(
    plan.skippedModuleIds.sort(),
    ['rtk-optimization'],
    'opencode should skip only rtk-optimization'
  );
});

test('opencode full plan: commands use opencode-command-copy strategy (not codex-command-copy)', () => {
  const plan = runInstallPlan('opencode', 'full');
  const opencodeOps = plan.operations.filter((op) => op.strategy === 'opencode-command-copy');
  const codexOps = plan.operations.filter((op) => op.strategy === 'codex-command-copy');
  assert.ok(opencodeOps.length > 0, 'opencode plan should have opencode-command-copy operations');
  assert.strictEqual(codexOps.length, 0, 'opencode plan should NOT have codex-command-copy operations');
});

test('opencode full install: commands go to command/ (singular), not commands/ (plural)', () => {
  const plan = runInstallPlan('opencode', 'full');
  const opencodeRoot = plan.targetRoot;
  const commandDirSingular = path.join(opencodeRoot, 'command');
  const commandDirPlural = path.join(opencodeRoot, 'commands');

  // Verify plan destinations all use singular "command/"
  const cmdOps = plan.operations.filter((op) => op.strategy === 'opencode-command-copy');
  cmdOps.forEach((op) => {
    if (op.destinationPath !== commandDirSingular && op.destinationPath.endsWith('.md')) {
      assert.ok(
        op.destinationPath.startsWith(commandDirSingular + path.sep),
        `opencode command op dest '${op.destinationPath}' should be under 'command/' not 'commands/'`
      );
    }
  });

  withTempHome((tempHome) => {
    runInstallApply(['--profile', 'full', '--target', 'opencode', '--json'], {
      HOME: tempHome,
    });

    const actualCommandSingular = path.join(tempHome, '.config', 'opencode', 'command');
    const actualCommandPlural = path.join(tempHome, '.config', 'opencode', 'commands');

    assert.ok(
      fs.existsSync(actualCommandSingular),
      'opencode install should create ~/.config/opencode/command/ (singular)'
    );
    assert.ok(
      !fs.existsSync(actualCommandPlural),
      'opencode install should NOT create ~/.config/opencode/commands/ (plural)'
    );
  });
});

test('opencode full install: expected command files present in command/ directory', () => {
  const plan = runInstallPlan('opencode', 'full');
  const expectedFiles = plan.operations
    .filter((op) => op.strategy === 'opencode-command-copy' && op.sourceRelativePath && op.sourceRelativePath.endsWith('.md'))
    .map((op) => path.basename(op.destinationPath));

  withTempHome((tempHome) => {
    runInstallApply(['--profile', 'full', '--target', 'opencode', '--json'], {
      HOME: tempHome,
    });

    const cmdDir = path.join(tempHome, '.config', 'opencode', 'command');
    const installedFiles = listMdFiles(cmdDir);

    expectedFiles.forEach((f) => {
      assert.ok(
        installedFiles.includes(f),
        `Expected ${f} in ~/.config/opencode/command/, not found (installed: ${installedFiles.slice(0, 5).join(', ')}...)`
      );
    });
  });
});

test('opencode full install: agents flattened to ~/.config/opencode/agents/ (not nested)', () => {
  const plan = runInstallPlan('opencode', 'full');
  const agentOps = plan.operations.filter((op) => op.strategy === 'flatten-agent-copy');
  assert.ok(agentOps.length > 0, 'opencode plan should have flatten-agent-copy ops');

  withTempHome((tempHome) => {
    runInstallApply(['--profile', 'full', '--target', 'opencode', '--json'], {
      HOME: tempHome,
    });

    const agentsDir = path.join(tempHome, '.config', 'opencode', 'agents');
    assert.ok(fs.existsSync(agentsDir), 'opencode should install agents dir');
    const agentFiles = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
    assert.strictEqual(
      agentFiles.length,
      agentOps.length,
      `Expected ${agentOps.length} agent files in ~/.config/opencode/agents/, got ${agentFiles.length}`
    );
  });
});

// ─── claude ─────────────────────────────────────────────────────────────────

test('claude full plan: no modules skipped', () => {
  const plan = runInstallPlan('claude', 'full');
  assert.deepStrictEqual(
    plan.skippedModuleIds,
    [],
    `claude should skip no modules, but skipped: ${plan.skippedModuleIds.join(', ')}`
  );
});

test('claude full install: skills directory has all plan skill dirs', () => {
  // Expected skill count comes from the install plan (module-filtered, not raw source count)
  const plan = runInstallPlan('claude', 'full');
  const planSkillCount = plan.operations.filter(
    (op) => op.strategy === 'preserve-relative-path' && op.destinationPath.includes('/skills/')
  ).length;

  withTempHome((tempHome) => {
    runInstallApply(['--profile', 'full', '--target', 'claude', '--json'], {
      HOME: tempHome,
    });

    const claudeSkillsDir = path.join(tempHome, '.claude', 'skills');
    const installedSkillCount = countSubdirs(claudeSkillsDir);
    assert.strictEqual(
      installedSkillCount,
      planSkillCount,
      `claude install should include all ${planSkillCount} plan skill dirs, but got ${installedSkillCount}`
    );
  });
});

test('claudecode alias installs identical content as claude target', () => {
  withTempHome((tempHome1) => {
    withTempHome((tempHome2) => {
      runInstallApply(['--profile', 'team', '--target', 'claude', '--json'], { HOME: tempHome1 });
      runInstallApply(['--profile', 'team', '--target', 'claudecode', '--json'], { HOME: tempHome2 });

      // Both should produce the same plugin.json
      const plugin1 = JSON.parse(
        fs.readFileSync(path.join(tempHome1, '.claude', 'plugin.json'), 'utf8')
      );
      const plugin2 = JSON.parse(
        fs.readFileSync(path.join(tempHome2, '.claude', 'plugin.json'), 'utf8')
      );
      assert.strictEqual(plugin1.name, plugin2.name, 'claude and claudecode installs should produce same plugin.json name');

      // Both should produce the same commands
      const cmds1 = listMdFiles(path.join(tempHome1, '.claude', 'commands')).sort();
      const cmds2 = listMdFiles(path.join(tempHome2, '.claude', 'commands')).sort();
      assert.deepStrictEqual(cmds1, cmds2, 'claude and claudecode installs should have identical commands');
    });
  });
});

console.log(`\nPlugin completeness: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
