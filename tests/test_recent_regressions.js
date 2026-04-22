#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  listMissingProductionDependencies,
  needsProductionDependencyInstall,
} = require('../bin/lib/source-installer');

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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recent-regressions-'));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('Recent regression tests');

test('source installer uses non-interactive claude-mem install', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'bin', 'lib', 'source-installer.js'), 'utf8');
  assert.ok(
    source.includes("execSync('npx --yes claude-mem install'"),
    'expected source installer to pass --yes to npx claude-mem install'
  );
});

test('source installer detects partial dependency trees', () => {
  withTempDir((root) => {
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'fixture',
        dependencies: {
          'sql.js': '^1.13.0',
          ajv: '^8.18.0',
        },
      }, null, 2),
      'utf8'
    );

    fs.mkdirSync(path.join(root, 'node_modules', 'ajv'), { recursive: true });

    const missing = listMissingProductionDependencies(root);
    assert.deepStrictEqual(missing, ['sql.js']);
    assert.strictEqual(needsProductionDependencyInstall(root), true);
  });
});

test('install:claude uses non-interactive npx path', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.ok(
    packageJson.scripts['install:claude'].includes('npx --yes claude-mem install'),
    'expected install:claude to pass --yes to npx claude-mem install'
  );
});

test('graphify preflight suggests the correct package name', () => {
  const result = spawnSync('node', ['scripts/graphify-preflight.js'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
  });
  const combinedOutput = `${result.stdout || ''}${result.stderr || ''}`;

  assert.notStrictEqual(result.status, 0, 'expected graphify preflight to fail when graphify is unavailable');
  assert.ok(
    combinedOutput.includes('pip install --upgrade graphify'),
    'expected graphify doctor to suggest installing the graphify package'
  );
  assert.ok(
    !combinedOutput.includes('graphifyy'),
    'expected graphify doctor to avoid the misspelled package name'
  );
});

test('release script guards repeated tag creation', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'release.sh'), 'utf8');
  assert.ok(
    source.includes('refs/tags/v${NEW_VERSION}') || source.includes('refs/tags/"v${NEW_VERSION}"'),
    'expected release script to check for an existing tag before creating it'
  );
});

test('README documents explicit prebuilt sync instead of implicit prepublish healing', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  assert.ok(
    source.includes('需要先显式执行 `npm run prebuilt:sync`'),
    'expected README to require an explicit prebuilt sync step before pack/publish'
  );
  assert.ok(
    !source.includes('prepublishOnly`，从 GitHub 回填 prebuilt bridge'),
    'expected README to stop claiming that prepublishOnly auto-syncs prebuilt binaries'
  );
});

console.log(`\nRecent regressions: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
