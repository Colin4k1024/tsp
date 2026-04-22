#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SUPPORTED_PLATFORMS = [
  'darwin-arm64',
  'darwin-x64',
  'linux-x64',
  'linux-arm64',
  'win32-x64',
];

const DEFAULT_GITHUB_API_BASE = 'https://api.github.com';
const DEFAULT_NPM_REGISTRY_BASE = 'https://registry.npmjs.org';

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    root: process.cwd(),
    repo: null,
    ref: null,
    fallbackRef: null,
    token: process.env.GITHUB_TOKEN || null,
    apiBase: process.env.GITHUB_API_BASE || DEFAULT_GITHUB_API_BASE,
    platforms: [...SUPPORTED_PLATFORMS],
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') {
      options.root = path.resolve(args[index + 1] || options.root);
      index += 1;
      continue;
    }
    if (arg === '--repo') {
      options.repo = args[index + 1] || null;
      index += 1;
      continue;
    }
    if (arg === '--ref') {
      options.ref = args[index + 1] || null;
      index += 1;
      continue;
    }
    if (arg === '--fallback-ref') {
      options.fallbackRef = args[index + 1] || null;
      index += 1;
      continue;
    }
    if (arg === '--token') {
      options.token = args[index + 1] || null;
      index += 1;
      continue;
    }
    if (arg === '--api-base') {
      options.apiBase = args[index + 1] || options.apiBase;
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
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getHelpText() {
  return [
    'Usage: node scripts/sync-prebuilt-from-github.js [options]',
    '',
    'Download bin/prebuilt/<platform>/ binaries from GitHub into the local package tree',
    'before npm pack/publish so local npm pushes include bundled bridge binaries.',
    '',
    'Options:',
    '  --root <path>            Package root to hydrate. Defaults to cwd.',
    '  --repo <owner/repo>      Override repository slug. Defaults from package.json repository.url.',
    '  --ref <git-ref>          Primary git ref to download from. Defaults to TSP_PREBUILT_REF or v<package.version>.',
    '  --fallback-ref <git-ref> Fallback ref if --ref is missing binaries. Defaults to TSP_PREBUILT_FALLBACK_REF or main.',
    '  --platform <name> ...    Restrict platforms. Defaults to all supported platforms.',
    '  --token <token>          Optional GitHub token for private repos or higher API limits.',
    '  --api-base <url>         Override GitHub API base. Defaults to https://api.github.com.',
    '  --dry-run                Print the download plan without writing files.',
    '  -h, --help               Show help.',
  ].join('\n');
}

function expectedBinaryName(platform) {
  return platform.startsWith('win32-') ? 'oris-claude-bridge.exe' : 'oris-claude-bridge';
}

function readPackageJson(root) {
  const packageJsonPath = path.join(root, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found under ${root}`);
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

function normalizeRepositorySlug(repository) {
  const value = typeof repository === 'string' ? repository : repository && repository.url;
  if (!value) {
    throw new Error('Unable to resolve repository slug from package.json');
  }
  const match = String(value).match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Unsupported repository url: ${value}`);
  }
  return match[1];
}

function buildRefCandidates(options, packageJson) {
  const primary = options.ref || process.env.TSP_PREBUILT_REF || `v${packageJson.version}`;
  const fallbackRefs = options.fallbackRef || process.env.TSP_PREBUILT_FALLBACK_REF
    ? [options.fallbackRef || process.env.TSP_PREBUILT_FALLBACK_REF]
    : ['main', 'master'];
  return [...new Set([primary, ...fallbackRefs].filter(Boolean))];
}

function buildNpmPackageMetadataUrl(registryBase, packageName) {
  return `${registryBase.replace(/\/$/, '')}/${encodeURIComponent(packageName)}`;
}

function parseSemver(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(version));
  if (!match) {
    return null;
  }
  return match.slice(1).map((value) => Number.parseInt(value, 10));
}

function compareSemverDescending(left, right) {
  const leftParts = parseSemver(left);
  const rightParts = parseSemver(right);
  if (!leftParts || !rightParts) {
    return String(right).localeCompare(String(left));
  }

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return rightParts[index] - leftParts[index];
    }
  }
  return 0;
}

function selectNpmFallbackVersion(metadata, currentVersion) {
  const latest = metadata && metadata['dist-tags'] && metadata['dist-tags'].latest;
  if (latest && latest !== currentVersion && metadata.versions && metadata.versions[latest]) {
    return latest;
  }

  const versions = Object.keys((metadata && metadata.versions) || {})
    .filter((version) => version !== currentVersion)
    .sort(compareSemverDescending);
  return versions[0] || null;
}

function validatePlatforms(platforms) {
  for (const platform of platforms) {
    if (!SUPPORTED_PLATFORMS.includes(platform)) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

function buildGithubContentUrl(apiBase, repo, ref, relativePath) {
  const encodedPath = relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${apiBase.replace(/\/$/, '')}/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
}

function resolveExistingLocalDownloads(root, platforms, fsImpl = fs) {
  const downloads = [];

  for (const platform of platforms) {
    const binaryName = expectedBinaryName(platform);
    const relativePath = `bin/prebuilt/${platform}/${binaryName}`;
    const destinationPath = path.join(root, relativePath);
    if (!fsImpl.existsSync(destinationPath)) {
      return null;
    }

    downloads.push({
      platform,
      binaryName,
      relativePath,
      destinationPath,
      contents: fsImpl.readFileSync(destinationPath),
    });
  }

  return downloads;
}

async function downloadFile({ apiBase, repo, ref, relativePath, token, fetchImpl }) {
  const response = await fetchImpl(buildGithubContentUrl(apiBase, repo, ref, relativePath), {
    headers: {
      Accept: 'application/vnd.github.raw',
      'User-Agent': 'tsp-prebuilt-sync',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const suffix = response.status === 404 ? ' (not found)' : '';
    throw new Error(`GitHub download failed for ${ref}:${relativePath} -> ${response.status}${suffix}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function fetchNpmPackageMetadata({ registryBase, packageName, fetchImpl }) {
  const response = await fetchImpl(buildNpmPackageMetadataUrl(registryBase, packageName), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'tsp-prebuilt-sync',
    },
  });

  if (!response.ok) {
    throw new Error(`npm registry request failed with status ${response.status}`);
  }

  return response.json();
}

function readNullTerminatedString(buffer, start, length) {
  const slice = buffer.subarray(start, start + length);
  const nullIndex = slice.indexOf(0);
  const trimmed = slice.subarray(0, nullIndex === -1 ? slice.length : nullIndex).toString('utf8');
  return trimmed.replace(/\0+$/, '').trim();
}

function isSafeTarEntryPath(entryPath) {
  if (!entryPath || path.posix.isAbsolute(entryPath)) {
    return false;
  }
  return !entryPath.split('/').includes('..');
}

function verifyTarballIntegrity(tarballBuffer, dist) {
  if (dist && dist.integrity) {
    const [algorithm, expected] = String(dist.integrity).split('-', 2);
    if (!algorithm || !expected || !['sha512', 'sha1'].includes(algorithm)) {
      throw new Error(`Unsupported npm integrity format: ${dist.integrity}`);
    }

    const actual = crypto.createHash(algorithm).update(tarballBuffer).digest('base64');
    if (actual !== expected) {
      throw new Error(`npm tarball integrity check failed for algorithm ${algorithm}`);
    }
    return;
  }

  if (dist && dist.shasum) {
    const actual = crypto.createHash('sha1').update(tarballBuffer).digest('hex');
    if (actual !== dist.shasum) {
      throw new Error('npm tarball shasum check failed');
    }
  }
}

function readTarEntriesFromTarGz(buffer) {
  let tarBuffer;
  try {
    tarBuffer = zlib.gunzipSync(buffer);
  } catch (error) {
    throw new Error(`Failed to decompress npm tarball: ${error.message}`);
  }
  const entries = new Map();

  for (let offset = 0; offset + 512 <= tarBuffer.length; ) {
    const header = tarBuffer.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      break;
    }

    const name = readNullTerminatedString(header, 0, 100);
    const prefix = readNullTerminatedString(header, 345, 155);
    const fullName = prefix ? `${prefix}/${name}` : name;
    const sizeText = readNullTerminatedString(header, 124, 12);
    const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
    const typeFlag = header[156] === 0 ? '0' : String.fromCharCode(header[156]);
    const contentStart = offset + 512;
    const contentEnd = contentStart + size;

    if ((typeFlag === '0' || typeFlag === '\0') && fullName && isSafeTarEntryPath(fullName)) {
      entries.set(fullName, tarBuffer.subarray(contentStart, contentEnd));
    }

    offset = contentStart + Math.ceil(size / 512) * 512;
  }

  return entries;
}

async function resolveDownloadsFromNpmRegistry({ root, packageJson, platforms, fetchImpl, registryBase }) {
  const metadata = await fetchNpmPackageMetadata({
    registryBase,
    packageName: packageJson.name,
    fetchImpl,
  });

  const version = selectNpmFallbackVersion(metadata, packageJson.version);
  if (!version) {
    throw new Error(`No published npm version is available for ${packageJson.name}`);
  }

  const versionMetadata = metadata.versions && metadata.versions[version];
  const tarballUrl = versionMetadata && versionMetadata.dist && versionMetadata.dist.tarball;
  if (!tarballUrl) {
    throw new Error(`npm registry metadata for ${packageJson.name}@${version} is missing a tarball URL`);
  }

  const tarballResponse = await fetchImpl(tarballUrl, {
    headers: {
      Accept: 'application/octet-stream',
      'User-Agent': 'tsp-prebuilt-sync',
    },
  });

  if (!tarballResponse.ok) {
    throw new Error(`npm tarball download failed with status ${tarballResponse.status}`);
  }

  const tarballBuffer = Buffer.from(await tarballResponse.arrayBuffer());
  verifyTarballIntegrity(tarballBuffer, versionMetadata.dist);
  const tarEntries = readTarEntriesFromTarGz(tarballBuffer);
  const downloads = [];
  const missing = [];

  for (const platform of platforms) {
    const binaryName = expectedBinaryName(platform);
    const relativePath = `bin/prebuilt/${platform}/${binaryName}`;
    const tarPath = `package/${relativePath}`;
    const contents = tarEntries.get(tarPath);

    if (!contents) {
      missing.push(relativePath);
      continue;
    }

    downloads.push({
      platform,
      binaryName,
      relativePath,
      destinationPath: path.join(root, relativePath),
      contents: Buffer.from(contents),
    });
  }

  if (missing.length > 0) {
    throw new Error(`Missing binaries in npm tarball: ${missing.join(', ')}`);
  }

  return {
    source: 'npm',
    version,
    tarballUrl,
    downloads,
  };
}

async function resolveDownloadsForRef({ root, repo, ref, platforms, token, apiBase, fetchImpl }) {
  const downloads = [];
  for (const platform of platforms) {
    const binaryName = expectedBinaryName(platform);
    const relativePath = `bin/prebuilt/${platform}/${binaryName}`;
    const contents = await downloadFile({ apiBase, repo, ref, relativePath, token, fetchImpl });
    downloads.push({
      platform,
      binaryName,
      relativePath,
      destinationPath: path.join(root, relativePath),
      contents,
    });
  }
  return downloads;
}

async function planDownloads(options, dependencies = {}) {
  validatePlatforms(options.platforms);
  const packageJson = readPackageJson(options.root);
  const repo = options.repo || normalizeRepositorySlug(packageJson.repository);
  const refs = buildRefCandidates(options, packageJson);
  const fetchImpl = dependencies.fetchImpl || fetch;
  const fsImpl = dependencies.fsImpl || fs;
  let lastError = null;

  const localDownloads = resolveExistingLocalDownloads(options.root, options.platforms, fsImpl);
  if (localDownloads) {
    return { source: 'local', repo, ref: 'local', downloads: localDownloads };
  }

  for (const ref of refs) {
    try {
      const downloads = await resolveDownloadsForRef({
        root: options.root,
        repo,
        ref,
        platforms: options.platforms,
        token: options.token,
        apiBase: options.apiBase,
        fetchImpl,
      });
      return { repo, ref, downloads };
    } catch (error) {
      lastError = error;
    }
  }

  try {
    return await resolveDownloadsFromNpmRegistry({
      root: options.root,
      packageJson,
      platforms: options.platforms,
      fetchImpl,
      registryBase: dependencies.registryBase || DEFAULT_NPM_REGISTRY_BASE,
    });
  } catch (error) {
    lastError = error;
  }

  throw new Error(`Unable to resolve prebuilt binaries from GitHub refs ${refs.join(', ')} or npm registry: ${lastError.message}`);
}

function writeDownloads(downloads, fsImpl = fs) {
  for (const download of downloads) {
    fsImpl.mkdirSync(path.dirname(download.destinationPath), { recursive: true });
    fsImpl.writeFileSync(download.destinationPath, download.contents);
    if (!download.binaryName.endsWith('.exe')) {
      fsImpl.chmodSync(download.destinationPath, 0o755);
    }
  }
}

async function syncPrebuilt(options, dependencies = {}) {
  const plan = await planDownloads(options, dependencies);
  if (!options.dryRun) {
    writeDownloads(plan.downloads, dependencies.fsImpl || fs);
  }
  return plan;
}

async function main(argv = process.argv) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${getHelpText()}\n`);
    return;
  }

  const plan = await syncPrebuilt(options);
  const lines = [
    `Repository: ${plan.repo}`,
    `Ref: ${plan.ref}`,
    `Platforms: ${plan.downloads.map((item) => item.platform).join(', ')}`,
  ];

  for (const download of plan.downloads) {
    lines.push(`${options.dryRun ? 'Plan' : 'Downloaded'}: ${download.relativePath}`);
  }

  process.stdout.write(`${lines.join('\n')}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  SUPPORTED_PLATFORMS,
  buildGithubContentUrl,
  buildNpmPackageMetadataUrl,
  buildRefCandidates,
  compareSemverDescending,
  downloadFile,
  expectedBinaryName,
  fetchNpmPackageMetadata,
  getHelpText,
  isSafeTarEntryPath,
  main,
  normalizeRepositorySlug,
  parseArgs,
  planDownloads,
  readPackageJson,
  readTarEntriesFromTarGz,
  resolveExistingLocalDownloads,
  resolveDownloadsForRef,
  resolveDownloadsFromNpmRegistry,
  selectNpmFallbackVersion,
  syncPrebuilt,
  validatePlatforms,
  verifyTarballIntegrity,
  writeDownloads,
};
