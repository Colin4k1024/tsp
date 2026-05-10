#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const {
  buildProfileChoices,
  buildTargetChoices,
  listPublicInstallProfiles,
  listPublicInstallTargets,
} = require(path.join(ROOT, 'bin', 'lib', 'install-surface'));
const { listPublicInstallTargetAdapters } = require(path.join(ROOT, 'scripts', 'lib', 'install-targets', 'registry'));
const { listInstallProfiles } = require(path.join(ROOT, 'scripts', 'lib', 'install-manifests'));

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

console.log('tsp-create surface tests');

test('public target list tracks the public code agent registry', () => {
  const helperTargets = listPublicInstallTargets().map((target) => target.id);
  const registryTargets = listPublicInstallTargetAdapters().map((adapter) => adapter.target);
  assert.deepStrictEqual(helperTargets, registryTargets);
  assert.deepStrictEqual(helperTargets, ['claude', 'codex', 'opencode']);

  const choiceNames = buildTargetChoices().map((choice) => choice.name);
  assert.ok(choiceNames.some((name) => name.includes('~/.config/opencode/')), 'OpenCode should display the current install path');
  assert.ok(!choiceNames.some((name) => name.includes('Copilot')), 'Copilot should not be exposed in the public wizard');
  assert.ok(!choiceNames.some((name) => name.includes('Windsurf')), 'Windsurf should not be exposed in the public wizard');
  assert.ok(!choiceNames.some((name) => name.includes('Augment')), 'Augment should not be exposed in the public wizard');
});

test('public profile list tracks the manifest and excludes enterprise profile drift', () => {
  const helperProfiles = listPublicInstallProfiles().map((profile) => profile.id);
  const manifestProfiles = listInstallProfiles({ repoRoot: ROOT }).map((profile) => profile.id);
  assert.deepStrictEqual([...helperProfiles].sort(), [...manifestProfiles].sort());
  assert.ok(!helperProfiles.includes('enterprise'), 'public tsp-create surface should not expose enterprise profile');
  assert.ok(helperProfiles.indexOf('team') < helperProfiles.indexOf('full'), 'team should remain ordered ahead of full in user-facing surfaces');

  const choiceNames = buildProfileChoices().map((choice) => choice.name);
  assert.ok(choiceNames.some((name) => name.includes('team')), 'team profile should remain available');
  assert.ok(choiceNames.some((name) => name.includes('recommended')), 'team profile should remain marked recommended');
});

test('help output advertises current public targets and profiles only', () => {
  const result = spawnSync('node', ['bin/tsp-create.js', '--help'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.strictEqual(result.status, 0, `expected --help to succeed, got ${result.status}`);
  assert.match(result.stdout, /Target platform \(claude {2}codex {2}opencode\)/);
  assert.doesNotMatch(result.stdout, /copilot/);
  assert.doesNotMatch(result.stdout, /windsurf/);
  assert.doesNotMatch(result.stdout, /augment/);
  assert.match(result.stdout, /Public install profile \(core {2}developer {2}security {2}research {2}team {2}full\)/);
  assert.doesNotMatch(result.stdout, /Public install profile \([^)]*enterprise/, 'help output should not advertise enterprise as a public profile');
});

console.log(`\ntsp-create surface: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
