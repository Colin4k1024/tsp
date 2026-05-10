#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

const ROOT = path.join(__dirname, '..');
const TEXT_EXTENSIONS = new Set(['.md', '.json', '.yaml', '.yml']);
const FORBIDDEN_PATTERNS = [
  /acme-corp-internal/u,
  /\bAcmeCorp\b/u,
  /\bACMEPRMC\b/u,
  /\bcompany skills?\b/iu,
  /git\.acme-corp\.internal/iu,
];

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

function walk(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  const stats = fs.statSync(absolutePath);
  if (stats.isFile()) {
    return [relativePath];
  }

  const results = [];
  for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }
    const nestedRelativePath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(nestedRelativePath));
      continue;
    }
    if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(nestedRelativePath);
    }
  }

  return results;
}

console.log('Public release surface tests');

test('community documents exist and README links to them', () => {
  for (const relativePath of ['CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md', 'SUPPORT.md']) {
    assert.ok(fs.existsSync(path.join(ROOT, relativePath)), `${relativePath} should exist`);
  }

  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.ok(readme.includes('English:'), 'README should include an English-readable entry section');
  assert.ok(readme.includes('Quick Start / 最小安装'), 'README should include a bilingual quick start section');
  assert.ok(readme.includes('[CONTRIBUTING.md](CONTRIBUTING.md)'), 'README should link to CONTRIBUTING.md');
  assert.ok(readme.includes('[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)'), 'README should link to CODE_OF_CONDUCT.md');
  assert.ok(readme.includes('[SECURITY.md](SECURITY.md)'), 'README should link to SECURITY.md');
  assert.ok(readme.includes('[SUPPORT.md](SUPPORT.md)'), 'README should link to SUPPORT.md');
  assert.ok(readme.includes('--overlay enterprise'), 'README should explain the optional enterprise overlay entry point');
  assert.ok(readme.includes('npm run release:health'), 'README should expose the release health summary command');
  assert.ok(
    readme.includes('[docs/runbooks/open-source-release-checklist.md](docs/runbooks/open-source-release-checklist.md)'),
    'README should link to the open-source release checklist'
  );
  assert.ok(readme.includes('Support level'), 'README should disclose target support levels');
  assert.ok(readme.includes('Recommended | `claude`, `codex`, `opencode`'), 'README should identify primary supported code-agent targets');
  assert.ok(
    readme.includes('Hidden compatibility'),
    'README should identify hidden compatibility targets'
  );
  assert.ok(
    readme.includes('公开 quick-start / recipes / examples 聚焦 `claude`、`codex`、`opencode`'),
    'README should disclose where public onboarding depth is concentrated'
  );
  assert.ok(
    readme.includes('`prepack` 与 `prepublishOnly` 当前只运行 `npm run validate:prebuilt`'),
    'README should describe local prepack/prepublishOnly behavior accurately'
  );
  assert.ok(
    !readme.includes('本地 `npm pack` / `npm publish` 都会先执行 prebuilt 同步与校验'),
    'README should not claim local pack/publish auto-sync prebuilt binaries'
  );
});

test('GitHub community entry points use absolute URLs and current validation commands', () => {
  const issueConfig = fs.readFileSync(path.join(ROOT, '.github', 'ISSUE_TEMPLATE', 'config.yml'), 'utf8');
  assert.ok(
    issueConfig.includes('https://github.com/Colin4k1024/tsp/blob/main/docs/runbooks/team-skills-usage.md'),
    'issue contact links should use absolute GitHub URLs'
  );
  assert.ok(
    !issueConfig.includes('url: ./docs/'),
    'issue contact links should not use relative documentation paths'
  );

  const pullRequestTemplate = fs.readFileSync(path.join(ROOT, '.github', 'PULL_REQUEST_TEMPLATE.md'), 'utf8');
  assert.ok(
    pullRequestTemplate.includes('node scripts/validate-file-references.js --strict'),
    'PR template should require strict reference validation'
  );
  assert.ok(
    pullRequestTemplate.includes('node scripts/validate-doc-freshness.js'),
    'PR template should require doc freshness validation'
  );

  const support = fs.readFileSync(path.join(ROOT, 'SUPPORT.md'), 'utf8');
  assert.ok(support.includes('## Target support levels'), 'SUPPORT should document target support levels');
  assert.ok(
    support.includes('`claude`, `codex`, `opencode`'),
    'SUPPORT should call out recommended primary code-agent targets'
  );
  assert.ok(
    support.includes('Hidden compatibility'),
    'SUPPORT should call out hidden compatibility targets'
  );

  const openSourceChecklist = path.join(ROOT, 'docs', 'runbooks', 'open-source-release-checklist.md');
  assert.ok(fs.existsSync(openSourceChecklist), 'open-source release checklist should exist');
});

test('package metadata keeps the npm surface public-only', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(/open-source/i.test(pkg.description), 'package description should present the project as open source');
  assert.ok(!pkg.keywords.includes('enterprise'), 'package keywords should not market enterprise-only capabilities as default');
  assert.ok(Array.isArray(pkg.files), 'package files should be explicitly curated');
  assert.ok(!pkg.files.includes('docs/'), 'package tarball should not ship repository docs by default');
  assert.ok(!pkg.files.includes('.github/'), 'package tarball should not ship GitHub metadata');
});

test('public repository surfaces no longer expose private-enterprise brand residue', () => {
  const publicSurfaceFiles = [
    ...walk('README.md'),
    ...walk('CONTRIBUTING.md'),
    ...walk('SECURITY.md'),
    ...walk('SUPPORT.md'),
    ...walk('.github'),
    ...walk('commands'),
    ...walk('agents/roles'),
    ...walk('skills/roles'),
    ...walk('templates/system'),
    ...walk('docs/runbooks'),
    ...walk('docs/artifacts'),
    ...walk('docs/memory'),
    ...walk('examples'),
    ...walk('scripts/lib'),
    ...walk('manifests'),
  ];

  for (const relativePath of publicSurfaceFiles) {
    const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    for (const pattern of FORBIDDEN_PATTERNS) {
      assert.ok(!pattern.test(content), `${relativePath} should not contain ${pattern}`);
    }
  }
});

test('prebuilt workflows no longer try to commit ignored binaries back into git', () => {
  const workflow = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'build-prebuilt.yml'), 'utf8');
  assert.ok(workflow.includes('contents: read'), 'build-prebuilt workflow should only need read access');
  assert.ok(
    !workflow.includes('name: Commit prebuilt binaries'),
    'build-prebuilt workflow should not keep a commit-back job'
  );
  assert.ok(
    !workflow.includes('git add bin/prebuilt/'),
    'build-prebuilt workflow should not try to stage ignored prebuilt binaries'
  );
  assert.ok(
    !workflow.includes('git push'),
    'build-prebuilt workflow should not push generated binaries back into the repository'
  );
});

console.log(`\nPublic release surface: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
