#!/usr/bin/env node
'use strict';

/**
 * tsp-create — interactive npx installer for the Team Skills Platform.
 *
 * Usage:
 *   npx @colin4k1024/tsp-create                      # interactive wizard
 *   npx @colin4k1024/tsp-create --target claude --profile team
 *   npx @colin4k1024/tsp-create --from-source         # git clone mode
 *   npx @colin4k1024/tsp-create --dry-run
 *   npx @colin4k1024/tsp-create --help
 */

const ui = require('./lib/ui');
const {
  formatInlineList,
  listPublicInstallProfiles,
  listPublicInstallTargets,
} = require('./lib/install-surface');

// ─── Arg parsing ───────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = {
    help: false,
    version: false,
    dryRun: false,
    json: false,
    fromSource: false,
    target: null,
    profileId: null,
    includeComponentIds: [],
    repoUrl: null,
    cloneDir: null,
    branch: null,
    registry: process.env.npm_config_registry || null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg === '--version' || arg === '-v') {
      parsed.version = true;
    } else if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--json') {
      parsed.json = true;
    } else if (arg === '--from-source') {
      parsed.fromSource = true;
    } else if (arg === '--target') {
      parsed.target = args[++i] || null;
    } else if (arg === '--profile') {
      parsed.profileId = args[++i] || null;
    } else if (arg === '--with') {
      const val = args[++i];
      if (val) parsed.includeComponentIds.push(val.trim());
    } else if (arg === '--repo-url') {
      parsed.repoUrl = args[++i] || null;
    } else if (arg === '--clone-dir') {
      parsed.cloneDir = args[++i] || null;
    } else if (arg === '--branch') {
      parsed.branch = args[++i] || null;
    } else if (arg === '--registry') {
      parsed.registry = args[++i] || null;
    } else if (arg.startsWith('--')) {
      ui.error(`Unknown option: ${arg}`);
      showHelp(1);
    }
  }

  return parsed;
}

// ─── Help ──────────────────────────────────────────────────────────────────────

function showHelp(exitCode = 0) {
  const targetIds = formatInlineList(listPublicInstallTargets().map((target) => target.id));
  const profileIds = formatInlineList(listPublicInstallProfiles().map((profile) => profile.id));
  console.log(`
${ui.bold('tsp-create')} — Team Skills Platform interactive installer

${ui.bold('Usage:')}
  npx @colin4k1024/tsp-create                       Interactive wizard
  npx @colin4k1024/tsp-create --target claude --profile team
  npx @colin4k1024/tsp-create --from-source          Clone from git
  npx @colin4k1024/tsp-create --dry-run              Preview without writing

${ui.bold('Options:')}
  --target <name>       Target platform (${targetIds})
  --profile <name>      Public install profile (${profileIds})
  --with <component>    Include extra component (e.g. lang:typescript, capability:security)
  --dry-run             Show plan without writing files
  --json                Emit machine-readable JSON output
  --registry <url>      npm registry URL (e.g. https://registry.npmmirror.com)
  --from-source         Clone repo and install from source instead of the npm package
  --repo-url <url>      Custom git URL (with --from-source)
  --clone-dir <path>    Custom clone directory (with --from-source)
  --branch <name>       Git branch (with --from-source, default: main)
  -v, --version         Show version
  -h, --help            Show this help text

${ui.bold('Notes:')}
  Private enterprise capabilities are delivered through optional overlays in
  advanced/source install flows. They are not exposed as a public tsp-create profile.
`);
  process.exit(exitCode);
}

// ─── Version ───────────────────────────────────────────────────────────────────

function showVersion() {
  const pkg = require('../package.json');
  console.log(`${pkg.name}@${pkg.version}`);
  process.exit(0);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) showHelp(0);
  if (opts.version) showVersion();

  // ─── From-source mode ──────────────────────────────────────────────────────
  if (opts.fromSource) {
    const { runSourceInstall } = require('./lib/source-installer');

    // If target and profile are provided, skip wizard
    if (opts.target && opts.profileId) {
      await runSourceInstall({
        target: opts.target,
        profileId: opts.profileId,
        includeComponentIds: opts.includeComponentIds,
        dryRun: opts.dryRun,
        json: opts.json,
        repoUrl: opts.repoUrl,
        cloneDir: opts.cloneDir,
        branch: opts.branch,
      });
      return;
    }

    // Otherwise run wizard then source-install
  if (!process.stdin.isTTY) {
      const targetIds = formatInlineList(listPublicInstallTargets().map((target) => target.id));
      const profileIds = formatInlineList(listPublicInstallProfiles().map((profile) => profile.id));
      ui.warn('stdin is not a TTY — the interactive wizard cannot run.');
      ui.info('Use non-interactive flags instead:');
      ui.info('  npx @colin4k1024/tsp-create --from-source --target claude --profile team');
      ui.info(`Available targets:  ${targetIds}`);
      ui.info(`Available profiles: ${profileIds}`);
      process.exit(1);
    }
    const { runWizard } = require('./lib/wizard');
    const intent = await runWizard();
    await runSourceInstall({
      ...intent,
      dryRun: opts.dryRun,
      json: opts.json,
      repoUrl: opts.repoUrl,
      cloneDir: opts.cloneDir,
      branch: opts.branch,
    });
    return;
  }

  // ─── Embedded mode (default) ───────────────────────────────────────────────
  const { runEmbeddedInstall } = require('./lib/embedded-installer');

  // Non-interactive: both target and profile supplied via CLI
  if (opts.target && opts.profileId) {
    await runEmbeddedInstall({
      target: opts.target,
      profileId: opts.profileId,
      includeComponentIds: opts.includeComponentIds,
      dryRun: opts.dryRun,
      json: opts.json,
      registry: opts.registry,
    });
    return;
  }

  // Interactive wizard — requires a real TTY
  if (!process.stdin.isTTY) {
    const targetIds = formatInlineList(listPublicInstallTargets().map((target) => target.id));
    const profileIds = formatInlineList(listPublicInstallProfiles().map((profile) => profile.id));
    ui.warn('stdin is not a TTY — the interactive wizard cannot run.');
    ui.info('Use non-interactive flags instead:');
    ui.info('  npx @colin4k1024/tsp-create --target claude --profile team');
    ui.info('');
    ui.info(`Available targets:  ${targetIds}`);
    ui.info(`Available profiles: ${profileIds}`);
    process.exit(1);
  }
  const { runWizard } = require('./lib/wizard');
  const intent = await runWizard();
  await runEmbeddedInstall({
    ...intent,
    dryRun: opts.dryRun,
    json: opts.json,
    registry: opts.registry,
  });
}

main().catch((err) => {
  // User pressed Ctrl+C in inquirer
  if (err.name === 'ExitPromptError' || err.message?.includes('User force closed')) {
    console.log();
    ui.warn('Installation cancelled.');
    process.exit(0);
  }
  ui.error(err.message || String(err));
  process.exit(1);
});
