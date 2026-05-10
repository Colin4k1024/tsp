#!/usr/bin/env node
/**
 * Refactored ECC installer runtime.
 *
 * Keeps the legacy language-based install entrypoint intact while moving
 * target-specific mutation logic into testable Node code.
 */

const os = require('os');
const {
  listLegacyCompatibilityLanguages,
  resolveInstallPlan,
} = require('./lib/install-manifests');
const {
  normalizeInstallRequest,
  parseInstallArgs,
} = require('./lib/install/request');
const {
  buildDoctorReport,
  discoverInstalledStates,
  repairInstalledStates,
  uninstallInstalledStates,
} = require('./lib/install-lifecycle');
const { deriveInstallManifestPath } = require('./lib/install-audit-manifest');
const { PUBLIC_INSTALL_TARGETS } = require('./lib/install-targets/registry');

const LIFECYCLE_COMMANDS = new Set(['plan', 'status', 'doctor', 'repair', 'uninstall']);

function dedupeStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim()).filter(Boolean))];
}

function parseCommand(argv) {
  const args = [...argv];
  const first = args[0];
  if (first && !first.startsWith('--') && LIFECYCLE_COMMANDS.has(first)) {
    return {
      command: first,
      args: args.slice(1),
    };
  }

  return {
    command: 'plan',
    args,
  };
}

function parseLifecycleArgs(argv) {
  const parsed = {
    targets: [],
    json: false,
    help: false,
    apply: false,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--target' && argv[index + 1]) {
      parsed.targets.push(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--targets' && argv[index + 1]) {
      parsed.targets.push(...argv[index + 1].split(','));
      index += 1;
      continue;
    }
    if (arg === '--json') {
      parsed.json = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }
    if (arg === '--apply') {
      parsed.apply = true;
      continue;
    }
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (parsed.apply && parsed.dryRun) {
    throw new Error('--apply and --dry-run cannot be used together');
  }

  parsed.targets = dedupeStrings(parsed.targets);
  return parsed;
}

function evaluateCodexKnownRisk(planLike) {
  const target = planLike && planLike.target ? planLike.target : null;
  const skipped = Array.isArray(planLike && planLike.skippedModuleIds) ? planLike.skippedModuleIds : [];
  if (target === 'codex' && skipped.includes('commands-core')) {
    return [{
      code: 'codex-commands-core-regression',
      message: 'Regression detected: target codex skipped commands-core in selective-install resolution. Investigate manifest target coverage or adapter planning drift.',
    }];
  }
  return [];
}

function getHelpText(command = 'all') {
  const languages = listLegacyCompatibilityLanguages();
  const publicTargets = [...PUBLIC_INSTALL_TARGETS, 'claude-code', 'claudecode'];
  const planUsage = `
Usage: install.sh [plan] [--target <${publicTargets.join('|')}>] [--dry-run] [--json] <language> [<language> ...]
       install.sh [plan] [--target <${publicTargets.join('|')}>] [--dry-run] [--json] [--overlay <id>]... --profile <name> [--with <component>]... [--without <component>]...
       install.sh [plan] [--target <${publicTargets.join('|')}>] [--dry-run] [--json] [--overlay <id>]... --modules <id,id,...> [--with <component>]... [--without <component>]...
       install.sh [plan] [--dry-run] [--json] --config <path>

Targets:
  claude       (default) - Install Claude Code assets to ~/.claude/
  codex        - Install Codex assets to ~/.codex/ and register the plugin
  opencode     - Install OpenCode assets to ~/.config/opencode/
  claude-code  - Alias for claude
  claudecode   - Alias for claude

Options:
  --profile <name>    Resolve and install a manifest profile
  --modules <ids>     Resolve and install explicit module IDs
  --overlay <id>      Apply an optional install overlay (for example: enterprise)
  --with <component>  Include a user-facing install component
  --without <component>
                      Exclude a user-facing install component
  --config <path>     Load install intent from ecc-install.json
  --dry-run           Show the install plan without copying files
  --json              Emit machine-readable plan/result JSON
`;
  const lifecycleUsage = `
Lifecycle subcommands:
  install.sh status [--target <id>] [--targets <id,id,...>] [--json]
  install.sh doctor [--target <id>] [--targets <id,id,...>] [--json]
  install.sh repair [--target <id>] [--targets <id,id,...>] [--json] [--apply]
  install.sh uninstall [--target <id>] [--targets <id,id,...>] [--json] [--apply]

Lifecycle notes:
  - status/doctor are read-only.
  - repair/uninstall default to dry-run; use --apply to mutate filesystem.
`;

  if (command === 'plan') {
    return `${planUsage}
Available languages:
${languages.map((language) => `  - ${language}`).join('\n')}
`;
  }

  if (command !== 'all') {
    return `${lifecycleUsage}`;
  }

  return `${planUsage}
${lifecycleUsage}
Available languages:
${languages.map((language) => `  - ${language}`).join('\n')}
`;
}

function showHelp(command = 'all', exitCode = 0) {
  console.log(getHelpText(command));
  process.exit(exitCode);
}

function printHumanPlan(plan, dryRun, knownRisks = []) {
  console.log(`${dryRun ? 'Dry-run install plan' : 'Applying install plan'}:\n`);
  console.log(`Mode: ${plan.mode}`);
  console.log(`Target: ${plan.target}`);
  console.log(`Adapter: ${plan.adapter.id}`);
  console.log(`Install root: ${plan.installRoot}`);
  console.log(`Install-state: ${plan.installStatePath}`);
  if (plan.mode === 'legacy') {
    console.log(`Languages: ${plan.languages.join(', ')}`);
  } else {
    if (plan.mode === 'legacy-compat') {
      console.log(`Legacy languages: ${plan.legacyLanguages.join(', ')}`);
    }
    console.log(`Profile: ${plan.profileId || '(custom modules)'}`);
    console.log(`Included components: ${plan.includedComponentIds.join(', ') || '(none)'}`);
    console.log(`Excluded components: ${plan.excludedComponentIds.join(', ') || '(none)'}`);
    console.log(`Requested modules: ${plan.requestedModuleIds.join(', ') || '(none)'}`);
    console.log(`Selected modules: ${plan.selectedModuleIds.join(', ') || '(none)'}`);
    if (plan.skippedModuleIds.length > 0) {
      console.log(`Skipped modules: ${plan.skippedModuleIds.join(', ')}`);
    }
    if (plan.excludedModuleIds.length > 0) {
      console.log(`Excluded modules: ${plan.excludedModuleIds.join(', ')}`);
    }
  }
  console.log(`Operations: ${plan.operations.length}`);
  if (Array.isArray(plan.externalInstalls) && plan.externalInstalls.length > 0) {
    console.log(`External installs: ${plan.externalInstalls.length}`);
  }

  if (plan.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of plan.warnings) {
      console.log(`- ${warning}`);
    }
  }
  if (knownRisks.length > 0) {
    console.log('\nKnown risks:');
    for (const risk of knownRisks) {
      console.log(`- [${risk.code}] ${risk.message}`);
    }
  }

  console.log('\nPlanned file operations:');
  for (const operation of plan.operations) {
    console.log(`- ${operation.sourceRelativePath} -> ${operation.destinationPath}`);
  }
  if (Array.isArray(plan.externalInstalls) && plan.externalInstalls.length > 0) {
    console.log('\nPlanned external installs:');
    for (const externalInstall of plan.externalInstalls) {
      console.log(`- ${externalInstall.id}: ${externalInstall.description || externalInstall.script}`);
    }
  }

  if (!dryRun) {
    console.log(`\nDone. Install-state written to ${plan.installStatePath}`);
    if (plan.installManifestPath) {
      console.log(`Install-manifest written to ${plan.installManifestPath}`);
    }
  }
}

function printStatusReport(report, knownRisks = []) {
  console.log('Install status:\n');
  for (const record of report.records) {
    const lifecycleStatus = record.exists ? (record.error ? 'invalid' : 'installed') : 'missing';
    console.log(`- ${record.adapter.target}: ${lifecycleStatus}`);
    console.log(`  install-state: ${record.installStatePath}`);
    console.log(`  install-manifest: ${deriveInstallManifestPath(record.installStatePath)}`);
    if (record.error) {
      console.log(`  error: ${record.error}`);
    }
  }
  if (knownRisks.length > 0) {
    console.log('\nKnown risks:');
    for (const risk of knownRisks) {
      console.log(`- [${risk.code}] ${risk.message}`);
    }
  }
}

function printDoctorReport(report) {
  console.log('Install doctor report:\n');
  console.log(`Checked targets: ${report.summary.checkedCount}`);
  console.log(`OK targets: ${report.summary.okCount}`);
  console.log(`Warnings: ${report.summary.warningCount}`);
  console.log(`Errors: ${report.summary.errorCount}`);
  if (report.knownRisks && report.knownRisks.length > 0) {
    console.log(`Known risks: ${report.knownRisks.length}`);
  }

  for (const result of report.results) {
    console.log(`\n- ${result.adapter.target}: ${result.status}`);
    console.log(`  install-state: ${result.installStatePath}`);
    if (result.installManifestPath) {
      console.log(`  install-manifest: ${result.installManifestPath}`);
    }
    if (Array.isArray(result.issues) && result.issues.length > 0) {
      for (const issue of result.issues) {
        console.log(`  [${issue.severity}] ${issue.code} - ${issue.message}`);
      }
    }
  }

  if (report.knownRisks && report.knownRisks.length > 0) {
    console.log('\nKnown risks:');
    for (const risk of report.knownRisks) {
      console.log(`- [${risk.code}] ${risk.message}`);
    }
  }
}

function printLifecycleMutationReport(title, report) {
  console.log(`${title}:\n`);
  console.log(`Dry-run: ${report.dryRun ? 'yes' : 'no'}`);
  console.log(`Checked targets: ${report.summary.checkedCount}`);
  if (Object.prototype.hasOwnProperty.call(report.summary, 'repairedCount')) {
    console.log(`Repaired: ${report.summary.repairedCount}`);
    console.log(`Planned repairs: ${report.summary.plannedRepairCount}`);
  }
  if (Object.prototype.hasOwnProperty.call(report.summary, 'uninstalledCount')) {
    console.log(`Uninstalled: ${report.summary.uninstalledCount}`);
    console.log(`Planned removals: ${report.summary.plannedRemovalCount}`);
  }
  console.log(`Errors: ${report.summary.errorCount}`);

  for (const result of report.results) {
    console.log(`\n- ${result.adapter.target}: ${result.status}`);
    console.log(`  install-state: ${result.installStatePath}`);
    if (result.installManifestPath) {
      console.log(`  install-manifest: ${result.installManifestPath}`);
    }
    if (Array.isArray(result.plannedRepairs) && result.plannedRepairs.length > 0) {
      console.log(`  planned repairs: ${result.plannedRepairs.join(', ')}`);
    }
    if (Array.isArray(result.plannedRemovals) && result.plannedRemovals.length > 0) {
      console.log(`  planned removals: ${result.plannedRemovals.join(', ')}`);
    }
    if (Array.isArray(result.repairedPaths) && result.repairedPaths.length > 0) {
      console.log(`  repaired paths: ${result.repairedPaths.join(', ')}`);
    }
    if (Array.isArray(result.removedPaths) && result.removedPaths.length > 0) {
      console.log(`  removed paths: ${result.removedPaths.join(', ')}`);
    }
    if (result.error) {
      console.log(`  error: ${result.error}`);
    }
  }
}

function defaultTargetsFromArgs(parsedLifecycleArgs) {
  return parsedLifecycleArgs.targets.length > 0 ? parsedLifecycleArgs.targets : undefined;
}

function shouldDryRunMutation(parsedLifecycleArgs) {
  if (parsedLifecycleArgs.apply) {
    return false;
  }
  return true;
}

function runPlanMode(planArgs) {
  const options = parseInstallArgs([process.argv[0], process.argv[1], ...planArgs]);

  if (options.help) {
    showHelp('plan', 0);
  }

  const {
    findDefaultInstallConfigPath,
    loadInstallConfig,
  } = require('./lib/install/config');
  const { applyInstallPlan } = require('./lib/install-executor');
  const { createInstallPlanFromRequest } = require('./lib/install/runtime');
  const defaultConfigPath = options.configPath || options.languages.length > 0
    ? null
    : findDefaultInstallConfigPath({ cwd: process.cwd() });
  const config = options.configPath
    ? loadInstallConfig(options.configPath, { cwd: process.cwd() })
    : (defaultConfigPath ? loadInstallConfig(defaultConfigPath, { cwd: process.cwd() }) : null);
  const request = normalizeInstallRequest({
    ...options,
    config,
    cwd: process.cwd(),
    repoRoot: process.cwd(),
  });
  const plan = createInstallPlanFromRequest(request, {
    projectRoot: process.cwd(),
    homeDir: process.env.HOME || os.homedir(),
    claudeRulesDir: process.env.CLAUDE_RULES_DIR || null,
  });
  const knownRisks = evaluateCodexKnownRisk(plan);

  if (options.dryRun) {
    if (options.json) {
      console.log(JSON.stringify({ dryRun: true, plan, knownRisks }, null, 2));
    } else {
      printHumanPlan(plan, true, knownRisks);
    }
    return;
  }

  const result = applyInstallPlan(plan);
  if (options.json) {
    console.log(JSON.stringify({ dryRun: false, result, knownRisks }, null, 2));
  } else {
    printHumanPlan(result, false, knownRisks);
  }
}

function runStatusMode(parsedArgs) {
  if (parsedArgs.help) {
    showHelp('status', 0);
  }
  const records = discoverInstalledStates({
    targets: defaultTargetsFromArgs(parsedArgs),
    projectRoot: process.cwd(),
    homeDir: process.env.HOME || os.homedir(),
  });
  let knownRisks = [];
  try {
    knownRisks = evaluateCodexKnownRisk(resolveInstallPlan({
      repoRoot: process.cwd(),
      projectRoot: process.cwd(),
      homeDir: process.env.HOME || os.homedir(),
      target: 'codex',
      profileId: 'full',
      moduleIds: [],
      includeComponentIds: [],
      excludeComponentIds: [],
    }));
  } catch (_error) {
    knownRisks = [];
  }
  const report = {
    generatedAt: new Date().toISOString(),
    records,
    summary: {
      checkedCount: records.length,
      installedCount: records.filter((record) => record.exists && !record.error).length,
      missingCount: records.filter((record) => !record.exists).length,
      invalidCount: records.filter((record) => Boolean(record.error)).length,
    },
    knownRisks,
  };

  if (parsedArgs.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printStatusReport(report, knownRisks);
  }
}

function runDoctorMode(parsedArgs) {
  if (parsedArgs.help) {
    showHelp('doctor', 0);
  }
  const report = buildDoctorReport({
    targets: defaultTargetsFromArgs(parsedArgs),
    projectRoot: process.cwd(),
    homeDir: process.env.HOME || os.homedir(),
    repoRoot: process.cwd(),
  });

  if (parsedArgs.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printDoctorReport(report);
  }
}

function runRepairMode(parsedArgs) {
  if (parsedArgs.help) {
    showHelp('repair', 0);
  }
  const report = repairInstalledStates({
    targets: defaultTargetsFromArgs(parsedArgs),
    projectRoot: process.cwd(),
    homeDir: process.env.HOME || os.homedir(),
    repoRoot: process.cwd(),
    dryRun: shouldDryRunMutation(parsedArgs),
  });
  if (parsedArgs.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printLifecycleMutationReport('Install repair report', report);
  }
}

function runUninstallMode(parsedArgs) {
  if (parsedArgs.help) {
    showHelp('uninstall', 0);
  }
  const report = uninstallInstalledStates({
    targets: defaultTargetsFromArgs(parsedArgs),
    projectRoot: process.cwd(),
    homeDir: process.env.HOME || os.homedir(),
    dryRun: shouldDryRunMutation(parsedArgs),
  });
  if (parsedArgs.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printLifecycleMutationReport('Install uninstall report', report);
  }
}

function main() {
  try {
    const parsed = parseCommand(process.argv.slice(2));
    if (parsed.args.includes('--help') || parsed.args.includes('-h')) {
      if (parsed.command === 'plan') {
        const quickParse = parseInstallArgs([process.argv[0], process.argv[1], ...parsed.args]);
        if (quickParse.help) {
          showHelp('plan', 0);
        }
      } else {
        const quickLifecycleParse = parseLifecycleArgs(parsed.args);
        if (quickLifecycleParse.help) {
          showHelp(parsed.command, 0);
        }
      }
    }

    if (parsed.command === 'plan') {
      runPlanMode(parsed.args);
      return;
    }

    const lifecycleArgs = parseLifecycleArgs(parsed.args);
    switch (parsed.command) {
      case 'status':
        runStatusMode(lifecycleArgs);
        return;
      case 'doctor':
        runDoctorMode(lifecycleArgs);
        return;
      case 'repair':
        runRepairMode(lifecycleArgs);
        return;
      case 'uninstall':
        runUninstallMode(lifecycleArgs);
        return;
      default:
        throw new Error(`Unsupported subcommand: ${parsed.command}`);
    }
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n\n${getHelpText('all')}`);
    process.exit(1);
  }
}

main();
