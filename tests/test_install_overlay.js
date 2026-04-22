#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { loadInstallConfig } = require('../scripts/lib/install/config');
const { loadInstallManifests } = require('../scripts/lib/install-manifests');
const { normalizeInstallRequest, parseInstallArgs } = require('../scripts/lib/install/request');

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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'install-overlay-'));
  try {
    fn(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function createOverlayFixture(rootDir) {
  const overlayRoot = path.join(rootDir, 'overlay-package');
  writeJson(path.join(overlayRoot, 'package.json'), {
    name: '@test/tsp-enterprise-overlay',
    version: '0.0.1',
  });
  writeJson(path.join(overlayRoot, 'ecc-overlay.json'), {
    version: 1,
    id: 'enterprise',
    manifests: {
      modulesPath: 'manifests/install-modules.json',
      profilesPath: 'manifests/install-profiles.json',
      componentsPath: 'manifests/install-components.json',
    },
  });
  writeJson(path.join(overlayRoot, 'manifests/install-modules.json'), {
    version: 1,
    modules: [
      {
        id: 'company-skills',
        kind: 'skills',
        description: 'Enterprise-only company skills.',
        paths: ['overlay/skills/company'],
        targets: ['claude', 'cursor'],
        dependencies: [],
        defaultInstall: false,
        cost: 'medium',
        stability: 'stable',
      },
      {
        id: 'enterprise-rules',
        kind: 'rules',
        description: 'Enterprise-only governance rules.',
        paths: ['overlay/rules/enterprise'],
        targets: ['claude', 'cursor', 'codex'],
        dependencies: ['rules-core'],
        defaultInstall: false,
        cost: 'light',
        stability: 'stable',
      },
    ],
  });
  writeJson(path.join(overlayRoot, 'manifests/install-profiles.json'), {
    version: 1,
    profiles: {
      team: {
        description: 'Patched team profile with enterprise overlay.',
        modules: [
          'rules-core',
          'agents-core',
          'commands-core',
          'hooks-runtime',
          'platform-configs',
          'team-workflow',
          'shared-skills',
          'workflow-quality',
          'enterprise-rules',
        ],
      },
      enterprise: {
        description: 'Enterprise overlay profile.',
        modules: [
          'rules-core',
          'agents-core',
          'commands-core',
          'hooks-runtime',
          'platform-configs',
          'team-workflow',
          'shared-skills',
          'workflow-quality',
          'enterprise-rules',
          'company-skills',
        ],
      },
    },
  });
  writeJson(path.join(overlayRoot, 'manifests/install-components.json'), {
    version: 1,
    components: [],
  });
  return overlayRoot;
}

console.log('Install overlay tests');

test('parseInstallArgs accepts repeated --overlay flags', () => {
  const parsed = parseInstallArgs([
    process.execPath,
    'scripts/install-apply.js',
    '--profile',
    'team',
    '--overlay',
    'enterprise',
    '--overlay',
    'internal-docs',
  ]);
  assert.deepStrictEqual(parsed.overlayIds, ['enterprise', 'internal-docs']);
});

test('install config loads overlays from ecc-install.json', () => {
  withTempDir((tempDir) => {
    const configPath = path.join(tempDir, 'ecc-install.json');
    writeJson(configPath, {
      version: 1,
      profile: 'team',
      overlays: ['enterprise'],
    });

    const config = loadInstallConfig(configPath, { cwd: tempDir });
    assert.deepStrictEqual(config.overlayIds, ['enterprise']);
  });
});

test('normalizeInstallRequest validates overlay modules against merged manifests', () => {
  withTempDir((tempDir) => {
    const overlayRoot = createOverlayFixture(tempDir);
    const request = normalizeInstallRequest({
      target: 'claude',
      profileId: 'enterprise',
      overlayIds: ['enterprise'],
      cwd: ROOT,
      overlayPackageMap: { enterprise: overlayRoot },
    });

    assert.deepStrictEqual(request.overlayIds, ['enterprise']);
    assert.strictEqual(request.profileId, 'enterprise');
  });
});

test('loadInstallManifests merges overlay modules and patched profiles', () => {
  withTempDir((tempDir) => {
    const overlayRoot = createOverlayFixture(tempDir);
    const manifests = loadInstallManifests({
      repoRoot: ROOT,
      overlayIds: ['enterprise'],
      overlayPackageMap: { enterprise: overlayRoot },
    });

    assert.ok(manifests.modulesById.has('company-skills'));
    assert.ok(manifests.modulesById.has('enterprise-rules'));
    assert.ok(Object.prototype.hasOwnProperty.call(manifests.profiles, 'enterprise'));
    assert.ok(manifests.profiles.team.modules.includes('enterprise-rules'));
  });
});

test('install-apply reports a clear error when enterprise overlay is requested but unavailable', () => {
  const result = spawnSync('node', ['scripts/install-apply.js', '--profile', 'team', '--target', 'claude', '--overlay', 'enterprise', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  assert.notStrictEqual(result.status, 0, 'expected install-apply to fail without an installed overlay package');
  assert.ok(
    result.stderr.includes('enterprise overlay'),
    `expected enterprise overlay error, got: ${result.stderr}`,
  );
});

console.log(`\nInstall overlay: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
