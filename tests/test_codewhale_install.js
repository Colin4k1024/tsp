/**
 * Test: CodeWhale install target adapter
 *
 * Verifies that the codewhale-home adapter correctly plans operations
 * for skills, commands, agents, rules, contexts, and hooks.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { getInstallTargetAdapter, planInstallTargetScaffold } = require('../scripts/lib/install-targets/registry');

function test_adapter_registration() {
  const adapter = getInstallTargetAdapter('codewhale');
  assert.strictEqual(adapter.target, 'codewhale');
  assert.strictEqual(adapter.kind, 'home');
  assert.strictEqual(adapter.id, 'codewhale-home');
  console.log('  ✓ adapter registered correctly');
}

function test_adapter_supports() {
  const adapter = getInstallTargetAdapter('codewhale');
  assert.strictEqual(adapter.supports('codewhale'), true);
  assert.strictEqual(adapter.supports('claude'), false);
  console.log('  ✓ supports() works correctly');
}

function test_resolve_root() {
  const adapter = getInstallTargetAdapter('codewhale');
  const homeDir = os.tmpdir();
  const root = adapter.resolveRoot({ homeDir });
  assert.strictEqual(root, path.join(homeDir, '.codewhale'));
  console.log('  ✓ resolveRoot() returns ~/.codewhale/');
}

function test_plan_skills_operations() {
  const repoRoot = path.join(__dirname, '..');
  const adapter = getInstallTargetAdapter('codewhale');
  const homeDir = os.tmpdir();

  const operations = adapter.planOperations({
    repoRoot,
    homeDir,
    modules: [{
      id: 'test-module',
      paths: ['skills'],
    }],
  });

  const skillOps = operations.filter(op => op.strategy === 'skill-copy');
  assert(skillOps.length > 0, 'should plan skill copy operations');
  console.log(`  ✓ planned ${skillOps.length} skill operations`);
}

function test_plan_commands_operations() {
  const repoRoot = path.join(__dirname, '..');
  const adapter = getInstallTargetAdapter('codewhale');
  const homeDir = os.tmpdir();

  const operations = adapter.planOperations({
    repoRoot,
    homeDir,
    modules: [{
      id: 'test-module',
      paths: ['commands'],
    }],
  });

  const cmdOps = operations.filter(op => op.strategy === 'command-copy');
  assert(cmdOps.length > 0, 'should plan command copy operations');
  console.log(`  ✓ planned ${cmdOps.length} command operations`);
}

function test_plan_agents_operations() {
  const repoRoot = path.join(__dirname, '..');
  const adapter = getInstallTargetAdapter('codewhale');
  const homeDir = os.tmpdir();

  const operations = adapter.planOperations({
    repoRoot,
    homeDir,
    modules: [{
      id: 'test-module',
      paths: ['agents'],
    }],
  });

  const agentOps = operations.filter(op => op.strategy === 'flatten-agent-copy');
  assert(agentOps.length > 0, 'should plan agent copy operations');

  const hasSpecialist = agentOps.some(op => op.destinationPath.includes('specialist-'));
  assert(hasSpecialist, 'should have specialist-prefixed agents');
  console.log(`  ✓ planned ${agentOps.length} agent operations (includes specialists)`);
}

function test_plan_rules_operations() {
  const repoRoot = path.join(__dirname, '..');
  const adapter = getInstallTargetAdapter('codewhale');
  const homeDir = os.tmpdir();

  const operations = adapter.planOperations({
    repoRoot,
    homeDir,
    modules: [{
      id: 'test-module',
      paths: ['rules'],
    }],
  });

  const ruleOps = operations.filter(op => op.strategy === 'rule-copy');
  assert(ruleOps.length > 0, 'should plan rule copy operations');
  console.log(`  ✓ planned ${ruleOps.length} rule operations`);
}

function test_plan_hooks_operations() {
  const repoRoot = path.join(__dirname, '..');
  const adapter = getInstallTargetAdapter('codewhale');
  const homeDir = os.tmpdir();

  const operations = adapter.planOperations({
    repoRoot,
    homeDir,
    modules: [{
      id: 'test-module',
      paths: ['hooks'],
    }],
  });

  const hookOps = operations.filter(op => op.strategy === 'hook-copy');
  assert(hookOps.length > 0, 'should plan hook copy operations');
  console.log(`  ✓ planned ${hookOps.length} hook operations`);
}

function test_plan_scaffold_integration() {
  const repoRoot = path.join(__dirname, '..');
  const homeDir = os.tmpdir();

  const result = planInstallTargetScaffold({
    target: 'codewhale',
    repoRoot,
    homeDir,
    modules: [
      { id: 'skills-core', paths: ['skills'] },
      { id: 'commands-core', paths: ['commands'] },
      { id: 'agents-core', paths: ['agents'] },
    ],
  });

  assert.strictEqual(result.adapter.target, 'codewhale');
  assert.strictEqual(result.adapter.id, 'codewhale-home');
  assert(result.operations.length > 0, 'should produce operations');
  assert(result.targetRoot.endsWith('.codewhale'), 'targetRoot should end with .codewhale');
  console.log(`  ✓ planInstallTargetScaffold: ${result.operations.length} total operations`);
}

// Run all tests
console.log('\n[CodeWhale Install Target Tests]');
console.log('================================\n');

const tests = [
  ['Adapter registration', test_adapter_registration],
  ['Adapter supports()', test_adapter_supports],
  ['resolveRoot()', test_resolve_root],
  ['Skills operations', test_plan_skills_operations],
  ['Commands operations', test_plan_commands_operations],
  ['Agents operations', test_plan_agents_operations],
  ['Rules operations', test_plan_rules_operations],
  ['Hooks operations', test_plan_hooks_operations],
  ['Full scaffold integration', test_plan_scaffold_integration],
];

let passed = 0;
let failed = 0;

for (const [name, fn] of tests) {
  try {
    fn();
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
