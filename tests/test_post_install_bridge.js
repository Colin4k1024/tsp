#!/usr/bin/env node
const nodeAssert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { runPostInstallBridge } = require("../bin/lib/post-install-bridge");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function testUsesBundledPrebuilt() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tsp-post-install-bridge-"));
  try {
    const packageRoot = path.join(tempRoot, "package");
    const installRoot = path.join(tempRoot, "install-root");
    const platformKey = `${os.platform()}-${os.arch()}`;
    const binaryName = os.platform() === "win32" ? "oris-claude-bridge.exe" : "oris-claude-bridge";

    fs.mkdirSync(path.join(packageRoot, "crates", "oris-claude-bridge", "src"), { recursive: true });
    fs.writeFileSync(
      path.join(packageRoot, "crates", "oris-claude-bridge", "Cargo.toml"),
      "[package]\nname = \"oris-claude-bridge\"\nversion = \"0.1.0\"\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(packageRoot, "crates", "oris-claude-bridge", "src", "main.rs"),
      "fn main() {}\n",
      "utf8"
    );
    fs.mkdirSync(path.join(packageRoot, "bin", "prebuilt", platformKey), { recursive: true });
    fs.writeFileSync(
      path.join(packageRoot, "bin", "prebuilt", platformKey, binaryName),
      "bridge-binary",
      "utf8"
    );

    await runPostInstallBridge({
      packageRoot,
      installRoot,
      target: "claude",
    });

    const installedCrateToml = path.join(installRoot, "crates", "oris-claude-bridge", "Cargo.toml");
    const installedBinary = path.join(
      installRoot,
      "crates",
      "oris-claude-bridge",
      "target",
      "release",
      binaryName
    );
    const settingsPath = path.join(installRoot, "settings.json");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

    assert(fs.existsSync(installedCrateToml), "expected crate bundle to be copied into install root");
    assert(fs.existsSync(installedBinary), "expected prebuilt binary to be installed into release directory");
    assert(settings.env && settings.env.ECC_ENABLE_EVOLUTION === "1", "expected ECC_ENABLE_EVOLUTION to be enabled");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function testHydratesMissingPrebuilt() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tsp-post-install-hydrate-"));
  try {
    const packageRoot = path.join(tempRoot, "package");
    const installRoot = path.join(tempRoot, "install-root");
    const platformKey = `${os.platform()}-${os.arch()}`;
    const binaryName = os.platform() === "win32" ? "oris-claude-bridge.exe" : "oris-claude-bridge";

    fs.mkdirSync(path.join(packageRoot, "crates", "oris-claude-bridge", "src"), { recursive: true });
    fs.writeFileSync(
      path.join(packageRoot, "crates", "oris-claude-bridge", "Cargo.toml"),
      "[package]\nname = \"oris-claude-bridge\"\nversion = \"0.1.0\"\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(packageRoot, "crates", "oris-claude-bridge", "src", "main.rs"),
      "fn main() {}\n",
      "utf8"
    );

    let syncCalled = false;
    await runPostInstallBridge({
      packageRoot,
      installRoot,
      target: "claude",
    }, {
      syncPrebuilt: async ({ root, platforms }) => {
        syncCalled = true;
        nodeAssert.strictEqual(root, packageRoot, "expected syncPrebuilt to target package root");
        nodeAssert.deepStrictEqual(platforms, [platformKey], "expected syncPrebuilt to hydrate only current platform");
        fs.mkdirSync(path.join(packageRoot, "bin", "prebuilt", platformKey), { recursive: true });
        fs.writeFileSync(
          path.join(packageRoot, "bin", "prebuilt", platformKey, binaryName),
          "hydrated-bridge-binary",
          "utf8"
        );
      },
    });

    const installedBinary = path.join(
      installRoot,
      "crates",
      "oris-claude-bridge",
      "target",
      "release",
      binaryName
    );

    assert(syncCalled, "expected syncPrebuilt fallback to be called when bundled binary is missing");
    assert(fs.existsSync(installedBinary), "expected hydrated binary to be installed into release directory");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function testBuildsFromSourceWhenNoPrebuiltIsAvailable() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tsp-post-install-build-"));
  try {
    const packageRoot = path.join(tempRoot, "package");
    const installRoot = path.join(tempRoot, "install-root");
    const binaryName = os.platform() === "win32" ? "oris-claude-bridge.exe" : "oris-claude-bridge";

    fs.mkdirSync(path.join(packageRoot, "crates", "oris-claude-bridge", "src"), { recursive: true });
    fs.writeFileSync(
      path.join(packageRoot, "crates", "oris-claude-bridge", "Cargo.toml"),
      "[package]\nname = \"oris-claude-bridge\"\nversion = \"0.1.0\"\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(packageRoot, "crates", "oris-claude-bridge", "src", "main.rs"),
      "fn main() {}\n",
      "utf8"
    );

    let syncCalled = false;
    await runPostInstallBridge({
      packageRoot,
      installRoot,
      target: "claude",
    }, {
      syncPrebuilt: async () => {
        syncCalled = true;
      },
      buildBridge: (crateDir, receivedBinaryName, destBinary) => {
        nodeAssert.strictEqual(receivedBinaryName, binaryName, "expected build fallback to use current platform binary name");
        nodeAssert.strictEqual(
          crateDir,
          path.join(installRoot, "crates", "oris-claude-bridge"),
          "expected build fallback to target the installed crate directory"
        );
        fs.mkdirSync(path.dirname(destBinary), { recursive: true });
        fs.writeFileSync(destBinary, "built-bridge-binary", "utf8");
        return destBinary;
      },
    });

    const installedBinary = path.join(
      installRoot,
      "crates",
      "oris-claude-bridge",
      "target",
      "release",
      binaryName
    );

    assert(syncCalled, "expected syncPrebuilt to be attempted before local build fallback");
    assert(fs.existsSync(installedBinary), "expected local cargo build fallback to install a binary when no prebuilt exists");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function main() {
  await testUsesBundledPrebuilt();
  await testHydratesMissingPrebuilt();
  await testBuildsFromSourceWhenNoPrebuiltIsAvailable();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
