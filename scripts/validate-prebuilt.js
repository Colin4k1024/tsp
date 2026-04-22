#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const SUPPORTED_PLATFORMS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-x64",
  "linux-arm64",
  "win32-x64",
];

function parseArgs(argv = process.argv) {
  const args = argv.slice(2);
  const options = {
    root: process.cwd(),
    platforms: [...SUPPORTED_PLATFORMS],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--root") {
      options.root = path.resolve(args[index + 1] || options.root);
      index += 1;
      continue;
    }

    if (arg === "--platform") {
      options.platforms = [];
      while (index + 1 < args.length && !args[index + 1].startsWith("--")) {
        options.platforms.push(args[index + 1]);
        index += 1;
      }
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/validate-prebuilt.js [--root PATH] [--platform <name> ...]");
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function expectedBinaryName(platform) {
  return platform.startsWith("win32-") ? "oris-claude-bridge.exe" : "oris-claude-bridge";
}

function validatePrebuilt(options = {}) {
  const missing = [];
  const root = path.resolve(options.root || process.cwd());
  const platforms = Array.isArray(options.platforms) && options.platforms.length > 0
    ? [...options.platforms]
    : [...SUPPORTED_PLATFORMS];

  for (const platform of platforms) {
    const binaryPath = path.join(
      root,
      "bin",
      "prebuilt",
      platform,
      expectedBinaryName(platform),
    );

    if (!fs.existsSync(binaryPath)) {
      missing.push(path.relative(root, binaryPath));
    }
  }

  return {
    root,
    platforms,
    missing,
    missingCount: missing.length,
  };
}

function main(argv = process.argv) {
  const options = parseArgs(argv);
  const report = validatePrebuilt(options);

  if (report.missing.length > 0) {
    console.error("Missing prebuilt binaries:");
    for (const missingPath of report.missing) {
      console.error(`- ${missingPath}`);
    }
    process.exit(1);
  }

  console.log(`Validated ${report.platforms.length} prebuilt binaries.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

module.exports = {
  SUPPORTED_PLATFORMS,
  expectedBinaryName,
  main,
  parseArgs,
  validatePrebuilt,
};
