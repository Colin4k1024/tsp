'use strict';

/**
 * Source-based installer.
 *
 * Clones the git repository to a local directory and then delegates
 * to the repo's own install-apply.js script.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ui = require('./ui');
const { runPostInstallBridge } = require('./post-install-bridge');

const DEFAULT_REPO_URL = 'https://github.com/Colin4k1024/tsp.git';
const DEFAULT_CLONE_DIR = path.join(os.homedir(), '.tsp-source');

function listMissingProductionDependencies(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const nodeModulesPath = path.join(projectRoot, 'node_modules');

  if (!fs.existsSync(packageJsonPath)) {
    return [];
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencyNames = Object.keys(packageJson.dependencies || {});

  return dependencyNames.filter((dependencyName) => (
    !fs.existsSync(path.join(nodeModulesPath, dependencyName))
  ));
}

function needsProductionDependencyInstall(projectRoot) {
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  return !fs.existsSync(nodeModulesPath) || listMissingProductionDependencies(projectRoot).length > 0;
}

/**
 * @param {{
 *   target: string,
 *   profileId: string,
 *   includeComponentIds: string[],
 *   dryRun: boolean,
 *   json: boolean,
 *   repoUrl?: string,
 *   cloneDir?: string,
 *   branch?: string,
 * }} intent
 */
async function runSourceInstall(intent) {
  const repoUrl = intent.repoUrl || DEFAULT_REPO_URL;
  const cloneDir = intent.cloneDir || DEFAULT_CLONE_DIR;
  const branch = intent.branch || 'main';

  // Step 1 — clone or pull
  if (fs.existsSync(path.join(cloneDir, '.git'))) {
    ui.info(`Updating existing source at ${cloneDir} ...`);
    try {
      execSync(`git -C ${JSON.stringify(cloneDir)} fetch origin ${JSON.stringify(branch)} --depth 1`, { stdio: 'pipe' });
      execSync(`git -C ${JSON.stringify(cloneDir)} checkout FETCH_HEAD`, { stdio: 'pipe' });
    } catch (err) {
      ui.warn(`Git pull failed (${err.message || err}), falling back to fresh clone.`);
      fs.rmSync(cloneDir, { recursive: true, force: true });
      cloneRepo(repoUrl, cloneDir, branch);
    }
  } else {
    cloneRepo(repoUrl, cloneDir, branch);
  }

  // Step 2 — ensure production dependencies are present in the clone
  const missingDependencies = listMissingProductionDependencies(cloneDir);
  if (needsProductionDependencyInstall(cloneDir)) {
    const reason = missingDependencies.length > 0
      ? `Repairing dependencies in cloned repo (missing: ${missingDependencies.join(', ')}) ...`
      : 'Installing dependencies in cloned repo ...';
    ui.info(reason);
    try {
      execSync('npm install --production', { cwd: cloneDir, stdio: 'pipe' });
    } catch (err) {
      ui.warn(`npm install failed in cloned repo (${err.message || err}). Dependencies may be incomplete.`);
    }
  }

  // Step 3 — delegate to install-apply.js
  const args = buildInstallArgs(intent);
  const cmd = `node scripts/install-apply.js ${args}`;
  ui.info(`Running: ${cmd}`);
  console.log();

  try {
    execSync(cmd, { cwd: cloneDir, stdio: 'inherit' });
  } catch (e) {
    ui.error(`Install script exited with code ${e.status || 1}`);
    process.exit(e.status || 1);
  }

  // ── Post-install: provision oris-claude-bridge & enable evolution ──
  const installRoot = intent.target === 'claude'
    ? path.join(os.homedir(), '.claude')
    : process.cwd();
  await runPostInstallBridge({
    packageRoot: cloneDir,
    installRoot,
    target: intent.target,
  });

  // ── Post-install: install claude-mem plugin ──
  if (intent.target === 'claude') {
    try {
      ui.info('Installing claude-mem plugin ...');
      execSync('npx --yes claude-mem install', { stdio: 'inherit' });
    } catch (_e) {
      ui.warn('claude-mem install failed — run "npx claude-mem install" manually if needed.');
    }
  }

  console.log();
  ui.success('Source-based installation complete.');
  ui.info(`Source cache: ${cloneDir}`);
}

function cloneRepo(repoUrl, cloneDir, branch) {
  ui.info(`Cloning ${repoUrl} (branch: ${branch}) ...`);
  fs.mkdirSync(path.dirname(cloneDir), { recursive: true });
  execSync(
    `git clone --depth 1 --branch ${JSON.stringify(branch)} ${JSON.stringify(repoUrl)} ${JSON.stringify(cloneDir)}`,
    { stdio: 'pipe' },
  );
  ui.success('Repository cloned.');
}

function buildInstallArgs(intent) {
  const parts = [];
  if (intent.target) parts.push(`--target ${intent.target}`);
  if (intent.profileId) parts.push(`--profile ${intent.profileId}`);
  for (const comp of (intent.includeComponentIds || [])) {
    parts.push(`--with ${comp}`);
  }
  if (intent.dryRun) parts.push('--dry-run');
  if (intent.json) parts.push('--json');
  return parts.join(' ');
}

module.exports = {
  listMissingProductionDependencies,
  needsProductionDependencyInstall,
  runSourceInstall,
};
