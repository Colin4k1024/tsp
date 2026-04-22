'use strict';

/**
 * Post-install step for oris-claude-bridge and self-evolution enablement.
 *
 * 1. Copy the bundled prebuilt binary from bin/prebuilt/{platform}-{arch}/
 *    to <installRoot>/crates/oris-claude-bridge/target/release/ so that
 *    hook commands referencing ${CLAUDE_PLUGIN_ROOT}/crates/oris-claude-bridge/
 *    target/release/oris-claude-bridge work immediately after installation
 *    without requiring a Rust toolchain.
 * 2. Inject ECC_ENABLE_EVOLUTION=1 into the Claude settings.json env block.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const ui = require('./ui');

// Lazy-loaded: syncPrebuilt is only needed for tryHydratePrebuiltBinary (dev use)
const DEFAULT_GITHUB_API_BASE = 'https://api.github.com';

// ── Helpers ────────────────────────────────────────────────────────────────────

function detectArch() {
  const arch = os.arch();     // 'arm64', 'x64', etc.
  const plat = os.platform(); // 'darwin', 'linux', 'win32'
  return { arch, plat };
}

function getPlatformKey() {
  const { arch, plat } = detectArch();
  return `${plat}-${arch}`;
}

function ignoreJunk(sourcePath) {
  const name = path.basename(sourcePath);
  return name === '.DS_Store' || name === '__pycache__' || name.endsWith('.pyc');
}

function copyCrateBundle(packageRoot, installRoot) {
  const sourceCrateDir = path.join(packageRoot, 'crates', 'oris-claude-bridge');
  if (!fs.existsSync(sourceCrateDir)) {
    return null;
  }

  const destCrateDir = path.join(installRoot, 'crates', 'oris-claude-bridge');
  fs.rmSync(destCrateDir, { recursive: true, force: true });
  fs.cpSync(sourceCrateDir, destCrateDir, {
    recursive: true,
    filter: (currentPath) => {
      if (ignoreJunk(currentPath)) {
        return false;
      }
      const relativePath = path.relative(sourceCrateDir, currentPath);
      return !relativePath.split(path.sep).includes('target');
    },
  });

  ui.success(`Installed crate bundle → ${destCrateDir}`);
  return destCrateDir;
}

function resolveCargoBinary() {
  const pathEntries = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const candidateNames = process.platform === 'win32' ? ['cargo.exe', 'cargo.cmd'] : ['cargo'];

  for (const entry of pathEntries) {
    for (const candidateName of candidateNames) {
      const candidatePath = path.join(entry, candidateName);
      if (fs.existsSync(candidatePath)) {
        return candidatePath;
      }
    }
  }

  const defaultCargoPath = path.join(os.homedir(), '.cargo', 'bin', process.platform === 'win32' ? 'cargo.exe' : 'cargo');
  return fs.existsSync(defaultCargoPath) ? defaultCargoPath : null;
}

function tryBuildBridge(crateDir, binaryName, destBinary) {
  const cargoBinary = resolveCargoBinary();
  if (!cargoBinary) {
    return null;
  }

  ui.step('B2', 'No bundled prebuilt found, building oris-claude-bridge from source ...');
  try {
    execFileSync(cargoBinary, ['+stable', 'build', '--release'], {
      cwd: crateDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        HOME: os.homedir(),
        CARGO_HOME: process.env.CARGO_HOME || path.join(os.homedir(), '.cargo'),
        RUSTUP_HOME: process.env.RUSTUP_HOME || path.join(os.homedir(), '.rustup'),
      },
    });
  } catch (error) {
    ui.warn(`cargo build failed for oris-claude-bridge: ${error.message}`);
    return null;
  }

  const builtBinary = path.join(crateDir, 'target', 'release', binaryName);
  if (!fs.existsSync(builtBinary)) {
    ui.warn(`Built binary missing after cargo build: ${builtBinary}`);
    return null;
  }

  fs.mkdirSync(path.dirname(destBinary), { recursive: true });
  fs.copyFileSync(builtBinary, destBinary);
  if (binaryName !== 'oris-claude-bridge.exe') {
    fs.chmodSync(destBinary, 0o755);
  }
  ui.success(`Built and installed oris-claude-bridge → ${destBinary}`);
  return destBinary;
}

/**
 * Resolve the path to the bundled prebuilt binary for the current platform.
 * Convention: bin/prebuilt/{platform}-{arch}/oris-claude-bridge[.exe]
 *
 * @param {string} packageRoot
 * @returns {string|null} absolute path if the file exists, otherwise null
 */
function findPrebuiltBinary(packageRoot) {
  const { plat } = detectArch();
  const binaryName = plat === 'win32' ? 'oris-claude-bridge.exe' : 'oris-claude-bridge';
  const candidate = path.join(packageRoot, 'bin', 'prebuilt', getPlatformKey(), binaryName);
  return fs.existsSync(candidate) ? candidate : null;
}

async function tryHydratePrebuiltBinary(packageRoot, syncPrebuiltImpl) {
  if (!syncPrebuiltImpl) {
    syncPrebuiltImpl = require('../../scripts/sync-prebuilt-from-github').syncPrebuilt;
  }
  const platformKey = getPlatformKey();

  try {
    ui.step('B2', `Bundled prebuilt missing, syncing ${platformKey} binary ...`);
    await syncPrebuiltImpl({
      root: packageRoot,
      repo: null,
      ref: null,
      fallbackRef: null,
      token: process.env.GITHUB_TOKEN || null,
      apiBase: process.env.GITHUB_API_BASE || DEFAULT_GITHUB_API_BASE,
      platforms: [platformKey],
      dryRun: false,
    });
  } catch (error) {
    ui.warn(`Unable to sync prebuilt binary for ${platformKey}: ${error.message}`);
    return null;
  }

  const hydratedBinary = findPrebuiltBinary(packageRoot);
  if (hydratedBinary) {
    ui.success(`Hydrated bundled prebuilt binary (${platformKey})`);
  }
  return hydratedBinary;
}

// ── Binary provisioning ────────────────────────────────────────────────────────

/**
 * Ensure the oris-claude-bridge binary exists at the expected location
 * under the install target root.
 *
 * The binary is always sourced from the bundled prebuilt package at
 * bin/prebuilt/{platform}-{arch}/ and copied to:
 *   <installRoot>/crates/oris-claude-bridge/target/release/oris-claude-bridge[.exe]
 *
 * This path matches the ${CLAUDE_PLUGIN_ROOT}/crates/oris-claude-bridge/target/release/
 * reference used by hooks, so hooks work immediately after installation
 * without any Rust toolchain or compilation step.
 *
 * @param {string} packageRoot - Absolute path to the TSP package root
 * @param {string} installRoot - The Claude install root (~/.claude typically)
 */
async function provisionBridge(packageRoot, installRoot, crateDir, dependencies = {}) {
  const { arch, plat } = detectArch();
  const binaryName = plat === 'win32' ? 'oris-claude-bridge.exe' : 'oris-claude-bridge';
  const buildBridge = dependencies.buildBridge || tryBuildBridge;

  // Destination mirrors the path referenced in hooks.json:
  //   ${CLAUDE_PLUGIN_ROOT}/crates/oris-claude-bridge/target/release/oris-claude-bridge
  const destDir = path.join(installRoot, 'crates', 'oris-claude-bridge', 'target', 'release');
  const destBinary = path.join(destDir, binaryName);

  const prebuiltBinary = findPrebuiltBinary(packageRoot);
  if (prebuiltBinary) {
    ui.step('B1', `Copying bundled prebuilt binary (${plat}-${arch}) ...`);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(prebuiltBinary, destBinary);
    fs.chmodSync(destBinary, 0o755);
    ui.success(`Installed prebuilt oris-claude-bridge → ${destBinary}`);
    return destBinary;
  }

  const hydratedBinary = await tryHydratePrebuiltBinary(packageRoot, dependencies.syncPrebuilt);
  if (hydratedBinary) {
    ui.step('B1', `Copying hydrated prebuilt binary (${plat}-${arch}) ...`);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(hydratedBinary, destBinary);
    fs.chmodSync(destBinary, 0o755);
    ui.success(`Installed hydrated oris-claude-bridge → ${destBinary}`);
    return destBinary;
  }

  if (crateDir) {
    const builtBinary = buildBridge(crateDir, binaryName, destBinary);
    if (builtBinary) {
      return builtBinary;
    }
  }

  // The npm package should always contain prebuilt binaries for all platforms.
  // If the binary is missing, the package was not published correctly.
  ui.warn(
    `No bundled prebuilt binary found for ${plat}-${arch}.\n` +
    `  The npm package may have been published without prebuilt binaries.\n` +
    `  Try reinstalling: npx @colin4k1024/tsp-create@latest\n` +
    `  Or use source mode: npx @colin4k1024/tsp-create --from-source`
  );
  ui.warn('Self-evolution hooks will run in passthrough mode until the binary is provisioned.');
  return null;
}

// ── Settings patching ──────────────────────────────────────────────────────────

/**
 * Ensure ECC_ENABLE_EVOLUTION=1 is set in the Claude settings.json env block,
 * and update hook commands to point to the installed binary location.
 *
 * @param {string} installRoot - The Claude install root (~/.claude typically)
 * @param {string|null} bridgeBinary - Absolute path to the installed binary
 */
function enableEvolutionInSettings(installRoot, bridgeBinary) {
  const settingsPath = path.join(installRoot, 'settings.json');

  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      ui.warn(`Could not parse ${settingsPath}, creating fresh settings.`);
      settings = {};
    }
  }

  // ── Inject env.ECC_ENABLE_EVOLUTION ──────────────────────────────
  if (!settings.env || typeof settings.env !== 'object' || Array.isArray(settings.env)) {
    settings.env = {};
  }
  settings.env.ECC_ENABLE_EVOLUTION = '1';

  // ── Patch hook commands to use installed binary path ─────────────
  if (bridgeBinary && settings.hooks && typeof settings.hooks === 'object') {
    patchHookCommands(settings.hooks, bridgeBinary);
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  ui.success('Enabled self-evolution (ECC_ENABLE_EVOLUTION=1) in settings.json');
}

/**
 * Walk all hook entries and replace stale oris-claude-bridge paths
 * with the newly installed binary path.
 */
function patchHookCommands(hooks, bridgeBinary) {
  const escapedBinary = bridgeBinary.replace(/"/g, '\\"');

  for (const eventEntries of Object.values(hooks)) {
    if (!Array.isArray(eventEntries)) continue;
    for (const entry of eventEntries) {
      if (!entry || !Array.isArray(entry.hooks)) continue;
      for (const hook of entry.hooks) {
        if (!hook || typeof hook.command !== 'string') continue;
        // Match any path ending in oris-claude-bridge (with optional quotes and path prefix)
        hook.command = hook.command.replace(
          /(?:"[^"]*\/oris-claude-bridge"|[^\s"]*\/oris-claude-bridge)/g,
          `"${escapedBinary}"`
        );
      }
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Run the full post-install bridge provisioning and evolution enablement.
 *
 * @param {object} opts
 * @param {string} opts.packageRoot - TSP package root (where crates/ lives)
 * @param {string} opts.installRoot - Claude install root (~/.claude)
 * @param {string} opts.target      - Install target name (e.g. 'claude')
 */
async function runPostInstallBridge(opts, dependencies = {}) {
  const { packageRoot, installRoot, target } = opts;

  // Only Claude target uses hooks + settings.json with evolution
  if (target !== 'claude') {
    ui.info('Skipping oris-claude-bridge setup (target is not claude).');
    return;
  }

  console.log();
  ui.separator();
  console.log(`  ${ui.bold('Self-Evolution Bridge Setup')}`);
  ui.separator();

  const crateDir = copyCrateBundle(packageRoot, installRoot);
  const bridgeBinary = await provisionBridge(packageRoot, installRoot, crateDir, dependencies);
  enableEvolutionInSettings(installRoot, bridgeBinary);

  console.log();
}

module.exports = {
  findPrebuiltBinary,
  provisionBridge,
  runPostInstallBridge,
  tryHydratePrebuiltBinary,
};
