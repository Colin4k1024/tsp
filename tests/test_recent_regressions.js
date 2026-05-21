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

test('gitnexus doctor script is exposed without adding gitnexus as a dependency', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

  assert.strictEqual(
    packageJson.scripts['gitnexus:doctor'],
    'node scripts/gitnexus-preflight.js',
    'expected gitnexus:doctor to point at the controlled preflight script'
  );
  assert.ok(
    !Object.prototype.hasOwnProperty.call(packageJson.dependencies || {}, 'gitnexus'),
    'expected GitNexus to remain an optional external tool, not a production dependency'
  );
});

test('codegraph doctor script is exposed with CodeGraph as a production dependency', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

  assert.strictEqual(
    packageJson.scripts['codegraph:doctor'],
    'node scripts/codegraph-preflight.js',
    'expected codegraph:doctor to point at the controlled preflight script'
  );
  assert.strictEqual(
    packageJson.dependencies['@colbymchenry/codegraph'],
    '0.7.10',
    'expected CodeGraph to use a registry-published Node 18-compatible production dependency'
  );
});

test('gitnexus preflight blocks Node versions below 20', () => {
  const result = spawnSync('node', ['scripts/gitnexus-preflight.js'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      GITNEXUS_PREFLIGHT_NODE_VERSION: 'v18.19.0',
      GITNEXUS_PREFLIGHT_NPM_VIEW_JSON: JSON.stringify({
        version: '1.6.3',
        license: 'PolyForm-Noncommercial-1.0.0',
        engines: { node: '>=20.0.0' },
      }),
    },
  });
  const combinedOutput = `${result.stdout || ''}${result.stderr || ''}`;

  assert.notStrictEqual(result.status, 0, 'expected GitNexus preflight to fail under Node 18');
  assert.ok(
    combinedOutput.includes('requires Node >= 20'),
    'expected GitNexus preflight to explain the Node 20 requirement'
  );
});

test('gitnexus preflight keeps integration controlled and license-aware', () => {
  const result = spawnSync('node', ['scripts/gitnexus-preflight.js'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      GITNEXUS_PREFLIGHT_SKIP_COMMANDS: '1',
      GITNEXUS_PREFLIGHT_NODE_VERSION: 'v20.10.0',
      GITNEXUS_PREFLIGHT_NPM_VIEW_JSON: JSON.stringify({
        version: '1.6.3',
        license: 'PolyForm-Noncommercial-1.0.0',
        engines: { node: '>=20.0.0' },
      }),
    },
  });
  const combinedOutput = `${result.stdout || ''}${result.stderr || ''}`;

  assert.strictEqual(result.status, 0, combinedOutput);
  assert.ok(
    combinedOutput.includes('PolyForm-Noncommercial-1.0.0'),
    'expected GitNexus preflight to surface the upstream license'
  );
  assert.ok(
    combinedOutput.includes('npx --yes gitnexus@latest analyze --skip-agents-md'),
    'expected GitNexus preflight to recommend preserving existing AGENTS.md/CLAUDE.md content'
  );
  assert.ok(
    combinedOutput.includes('Do not run `gitnexus setup` automatically'),
    'expected GitNexus preflight to forbid automatic setup'
  );
  assert.ok(
    !combinedOutput.includes('gitnexus clean --all --force'),
    'expected GitNexus preflight to avoid destructive cleanup recommendations'
  );
});

test('knowledge graph module includes CodeGraph default surface and GitNexus optional surface', () => {
  const modules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifests', 'install-modules.json'), 'utf8'));
  const knowledgeGraph = modules.modules.find((item) => item.id === 'knowledge-graph');

  assert.ok(knowledgeGraph, 'expected knowledge-graph module to exist');
  assert.strictEqual(knowledgeGraph.defaultInstall, true, 'expected knowledge-graph to be part of default engineering installs');
  assert.ok(
    knowledgeGraph.paths.includes('skills/codegraph'),
    'expected knowledge-graph module to ship the CodeGraph skill'
  );
  assert.ok(
    knowledgeGraph.paths.includes('docs/runbooks/codegraph-code-intelligence-usage.md'),
    'expected knowledge-graph module to ship the CodeGraph runbook'
  );
  assert.ok(
    knowledgeGraph.paths.includes('scripts/install-codegraph.js'),
    'expected knowledge-graph module to ship the CodeGraph installer wrapper'
  );
  assert.strictEqual(
    knowledgeGraph.externalInstall && knowledgeGraph.externalInstall.script,
    'scripts/install-codegraph.js',
    'expected knowledge-graph module to run the CodeGraph target-scoped wrapper'
  );
  assert.ok(
    knowledgeGraph.paths.includes('skills/gitnexus'),
    'expected knowledge-graph module to ship the GitNexus skill'
  );
  assert.ok(
    knowledgeGraph.paths.includes('docs/runbooks/gitnexus-code-intelligence-usage.md'),
    'expected knowledge-graph module to ship the GitNexus runbook'
  );
});

test('Open Design external install is non-blocking for network failures', () => {
  const modules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifests', 'install-modules.json'), 'utf8'));
  const designPrototyping = modules.modules.find((item) => item.id === 'design-prototyping');

  assert.ok(designPrototyping, 'expected design-prototyping module to exist');
  assert.strictEqual(
    designPrototyping.externalInstall && designPrototyping.externalInstall.failureMode,
    'warn',
    'expected Open Design external install to warn instead of blocking core TSP installs'
  );
});

test('brownfield workflow guidance mentions GitNexus and Graphify evidence paths', () => {
  const teamSkillsData = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'lib', 'team-skills-data.json'), 'utf8');

  assert.ok(
    teamSkillsData.includes('CodeGraph') && teamSkillsData.includes('GitNexus') && teamSkillsData.includes('Graphify'),
    'expected workflow guidance to mention CodeGraph, GitNexus, and Graphify'
  );
  assert.ok(
    teamSkillsData.includes('/update-codemaps'),
    'expected brownfield guidance to keep /update-codemaps as the first structure snapshot step'
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
