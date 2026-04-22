'use strict';

/**
 * Embedded (self-contained) installer.
 *
 * Runs when the npm package itself carries all platform resources.
 * Bridges wizard output into the existing install-apply pipeline.
 */

const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const ui = require('./ui');
const { runPostInstallBridge } = require('./post-install-bridge');

/**
 * @param {{target: string, profileId: string, includeComponentIds: string[], dryRun: boolean, json: boolean}} intent
 */
/**
 * @param {{target: string, profileId: string, includeComponentIds: string[], dryRun: boolean, json: boolean, registry?: string}} intent
 */
async function runEmbeddedInstall(intent) {
  // The npm package root is two levels up from bin/lib/
  const packageRoot = path.resolve(__dirname, '../..');

  // Load the existing installer modules relative to the package root
  const { normalizeInstallRequest } = require(path.join(packageRoot, 'scripts/lib/install/request'));
  const { createInstallPlanFromRequest } = require(path.join(packageRoot, 'scripts/lib/install/runtime'));
  const { applyInstallPlan } = require(path.join(packageRoot, 'scripts/lib/install-executor'));

  const request = normalizeInstallRequest({
    target: intent.target,
    profileId: intent.profileId,
    includeComponentIds: intent.includeComponentIds || [],
    excludeComponentIds: [],
    moduleIds: [],
    languages: [],
  });

  const plan = createInstallPlanFromRequest(request, {
    projectRoot: process.cwd(),
    homeDir: process.env.HOME || os.homedir(),
    sourceRoot: packageRoot,
  });

  if (intent.dryRun) {
    if (intent.json) {
      console.log(JSON.stringify({ dryRun: true, plan }, null, 2));
    } else {
      ui.printPlanSummary(plan);
      console.log(`  ${ui.dim('Planned file operations:')}`);
      for (const op of plan.operations) {
        console.log(`    ${ui.dim('→')} ${op.sourceRelativePath} ${ui.dim('→')} ${op.destinationPath}`);
      }
      console.log();
      ui.info('Dry-run mode — no files were written.');
    }
    return;
  }

  const result = applyInstallPlan(plan);

  // ── Post-install: provision oris-claude-bridge & enable evolution ──
  await runPostInstallBridge({
    packageRoot,
    installRoot: result.installRoot || result.targetRoot,
    target: intent.target,
  });

  // ── Post-install: install claude-mem plugin ──
  if (intent.target === 'claude') {
    try {
      ui.info('Installing claude-mem plugin ...');
      const claudeMemEnv = { ...process.env };
      if (intent.registry) claudeMemEnv.npm_config_registry = intent.registry;
      execSync('npx --yes claude-mem install', { stdio: 'inherit', env: claudeMemEnv });
    } catch (_e) {
      ui.warn('claude-mem install failed — run "npx claude-mem install" manually if needed.');
    }
  }

  if (intent.json) {
    console.log(JSON.stringify({ dryRun: false, result }, null, 2));
  } else {
    ui.printPlanSummary(result);
    ui.success(`Installed ${result.operations.length} files to ${ui.bold(result.installRoot)}`);
    console.log();
    ui.info(`Install state saved to ${result.installStatePath}`);
    console.log();
  }
}

module.exports = { runEmbeddedInstall };
