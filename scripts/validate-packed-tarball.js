#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  SUPPORTED_PLATFORMS,
  expectedBinaryName,
  readTarEntriesFromTarGz,
} = require('./sync-prebuilt-from-github');

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    root: process.cwd(),
    tarball: null,
    packJson: null,
    platforms: [...SUPPORTED_PLATFORMS],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--root') {
      options.root = path.resolve(args[index + 1] || options.root);
      index += 1;
      continue;
    }

    if (arg === '--tarball') {
      options.tarball = path.resolve(options.root, args[index + 1] || '');
      index += 1;
      continue;
    }

    if (arg === '--pack-json') {
      options.packJson = path.resolve(options.root, args[index + 1] || '');
      index += 1;
      continue;
    }

    if (arg === '--platform') {
      options.platforms = [];
      while (index + 1 < args.length && !args[index + 1].startsWith('--')) {
        options.platforms.push(args[index + 1]);
        index += 1;
      }
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/validate-packed-tarball.js [--root PATH] [--tarball FILE | --pack-json FILE] [--platform <name> ...]');
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function expectedTarballFilenameForRoot(root) {
  const packageJsonPath = path.join(root, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (typeof pkg.name !== 'string' || pkg.name.length === 0 || typeof pkg.version !== 'string' || pkg.version.length === 0) {
      return null;
    }

    const normalizedName = pkg.name.replace(/^@/, '').replace(/\//g, '-');
    return `${normalizedName}-${pkg.version}.tgz`;
  } catch {
    return null;
  }
}

function resolveTarballPath(options) {
  if (options.tarball) {
    return options.tarball;
  }

  if (options.packJson) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(options.packJson, 'utf8'));
    } catch (error) {
      throw new Error(`Unable to parse npm pack JSON at ${options.packJson}: ${error.message}`);
    }

    if (!Array.isArray(data) || !data[0] || typeof data[0].filename !== 'string' || data[0].filename.length === 0) {
      throw new Error(`npm pack JSON is missing a filename entry: ${options.packJson}`);
    }

    return path.resolve(path.dirname(options.packJson), data[0].filename);
  }

  const candidates = fs
    .readdirSync(options.root)
    .filter((entry) => entry.endsWith('.tgz'))
    .sort((left, right) => {
      const leftStat = fs.statSync(path.join(options.root, left));
      const rightStat = fs.statSync(path.join(options.root, right));
      return rightStat.mtimeMs - leftStat.mtimeMs;
    });

  if (candidates.length === 0) {
    throw new Error(`No .tgz tarball found under ${options.root}; pass --tarball or --pack-json explicitly.`);
  }

  const expectedTarballFilename = expectedTarballFilenameForRoot(options.root);
  if (expectedTarballFilename && candidates.includes(expectedTarballFilename)) {
    return path.join(options.root, expectedTarballFilename);
  }

  return path.join(options.root, candidates[0]);
}

function validateTarball(tarballPath, platforms) {
  const tarEntries = readTarEntriesFromTarGz(fs.readFileSync(tarballPath));
  const missing = [];

  for (const platform of platforms) {
    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const tarPath = `package/bin/prebuilt/${platform}/${expectedBinaryName(platform)}`;
    if (!tarEntries.has(tarPath)) {
      missing.push(tarPath);
    }
  }

  return {
    tarballPath,
    missing,
  };
}

function main(argv = process.argv) {
  const options = parseArgs(argv);
  const tarballPath = resolveTarballPath(options);
  const result = validateTarball(tarballPath, options.platforms);

  if (result.missing.length > 0) {
    console.error(`Tarball is missing bundled prebuilt binaries: ${path.basename(tarballPath)}`);
    for (const missingPath of result.missing) {
      console.error(`- ${missingPath}`);
    }
    process.exit(1);
  }

  console.log(`Validated tarball prebuilt binaries: ${path.basename(tarballPath)} (${options.platforms.length} platforms)`);
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
  expectedTarballFilenameForRoot,
  main,
  parseArgs,
  resolveTarballPath,
  validateTarball,
};
