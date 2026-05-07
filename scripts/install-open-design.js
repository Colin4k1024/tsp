#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_REPO_URL = 'https://github.com/nexu-io/open-design.git';
const DEFAULT_INSTALL_DIR = path.join(os.homedir(), '.tsp', 'open-design');
const DEFAULT_REF = 'main';

function parseArgs(argv) {
  const parsed = {
    installDir: process.env.TSP_OPEN_DESIGN_HOME || process.env.OPEN_DESIGN_HOME || DEFAULT_INSTALL_DIR,
    repoUrl: process.env.TSP_OPEN_DESIGN_REPO || DEFAULT_REPO_URL,
    ref: process.env.TSP_OPEN_DESIGN_REF || DEFAULT_REF,
    skipDeps: process.env.TSP_OPEN_DESIGN_SKIP_DEPS === '1',
    dryRun: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dir') {
      parsed.installDir = argv[index + 1] || parsed.installDir;
      index += 1;
      continue;
    }
    if (arg === '--repo') {
      parsed.repoUrl = argv[index + 1] || parsed.repoUrl;
      index += 1;
      continue;
    }
    if (arg === '--ref') {
      parsed.ref = argv[index + 1] || parsed.ref;
      index += 1;
      continue;
    }
    if (arg === '--skip-deps') {
      parsed.skipDeps = true;
      continue;
    }
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  parsed.installDir = path.resolve(parsed.installDir);
  return parsed;
}

function printHelp() {
  console.log(`
Install or update Open Design for TSP.

Usage:
  node scripts/install-open-design.js [--dir <path>] [--repo <url>] [--ref <git-ref>] [--skip-deps] [--dry-run]

Environment:
  TSP_OPEN_DESIGN_HOME       Override install directory. Default: ~/.tsp/open-design
  TSP_OPEN_DESIGN_REPO       Override upstream repository URL.
  TSP_OPEN_DESIGN_REF        Override git ref. Default: main
  TSP_OPEN_DESIGN_SKIP_DEPS  Set to 1 to skip pnpm dependency install.
`);
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  return result.status === 0;
}

function run(command, args, options = {}) {
  const printable = [command, ...args].join(' ');
  if (options.dryRun) {
    console.log(`[dry-run] ${printable}`);
    return;
  }

  const result = spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    encoding: 'utf8',
    stdio: options.quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

  if (result.status !== 0) {
    const stderr = result.stderr ? `\n${result.stderr.trim()}` : '';
    throw new Error(`Command failed: ${printable}${stderr}`);
  }
}

function readGitRemote(installDir) {
  const result = spawnSync('git', ['-C', installDir, 'remote', 'get-url', 'origin'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function isOpenDesignRemote(remoteUrl, expectedRepoUrl) {
  const normalized = String(remoteUrl || '').replace(/\.git$/, '');
  const expected = String(expectedRepoUrl || '').replace(/\.git$/, '');
  return normalized === expected || normalized.endsWith('/nexu-io/open-design');
}

function ensureOpenDesignCheckout(options) {
  const gitDir = path.join(options.installDir, '.git');
  if (!fs.existsSync(options.installDir)) {
    console.log(`Installing Open Design into ${options.installDir}`);
    if (!options.dryRun) {
      fs.mkdirSync(path.dirname(options.installDir), { recursive: true });
    }
    run('git', [
      'clone',
      '--depth',
      '1',
      '--branch',
      options.ref,
      options.repoUrl,
      options.installDir,
    ], { dryRun: options.dryRun });
    return;
  }

  if (!fs.existsSync(gitDir)) {
    throw new Error(`Open Design install path exists but is not a git checkout: ${options.installDir}`);
  }

  const remoteUrl = readGitRemote(options.installDir);
  if (!isOpenDesignRemote(remoteUrl, options.repoUrl)) {
    throw new Error(
      `Refusing to update ${options.installDir}; origin is ${remoteUrl || '(unknown)'}, expected ${options.repoUrl}`
    );
  }

  console.log(`Updating Open Design at ${options.installDir}`);
  run('git', ['-C', options.installDir, 'fetch', '--depth', '1', 'origin', options.ref], {
    dryRun: options.dryRun,
  });
  run('git', ['-C', options.installDir, 'checkout', 'FETCH_HEAD'], {
    dryRun: options.dryRun,
  });
}

function installDependencies(options) {
  if (options.skipDeps) {
    console.log('Skipping Open Design dependency install because --skip-deps or TSP_OPEN_DESIGN_SKIP_DEPS=1 is set.');
    return;
  }

  if (!commandExists('corepack')) {
    console.warn(
      'Open Design source is installed, but corepack/pnpm is not available. '
      + 'Install Node 24 with corepack, then run `corepack enable && pnpm install` in the Open Design directory.'
    );
    return;
  }

  run('corepack', ['enable'], {
    cwd: options.installDir,
    dryRun: options.dryRun,
  });

  if (!commandExists('pnpm')) {
    console.warn(
      'Open Design source is installed, but pnpm is still not available after `corepack enable`. '
      + 'Run `corepack prepare pnpm@10.33.2 --activate && pnpm install` in the Open Design directory.'
    );
    return;
  }

  run('pnpm', ['install'], {
    cwd: options.installDir,
    dryRun: options.dryRun,
  });
}

function main() {
  try {
    const options = parseArgs(process.argv);
    if (options.help) {
      printHelp();
      return;
    }

    if (!commandExists('git')) {
      throw new Error('git is required to install Open Design');
    }

    ensureOpenDesignCheckout(options);
    installDependencies(options);
    console.log(`Open Design ready: ${options.installDir}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
