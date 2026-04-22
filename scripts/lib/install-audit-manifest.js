'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MANIFEST_SCHEMA_VERSION = 'ecc.install.manifest.v1';

function deriveInstallManifestPath(installStatePath) {
  if (typeof installStatePath !== 'string' || installStatePath.trim().length === 0) {
    throw new Error('installStatePath is required to derive install-manifest path');
  }

  if (installStatePath.endsWith('ecc-install-state.json')) {
    return installStatePath.replace(/ecc-install-state\.json$/, 'ecc-install-manifest.json');
  }

  if (installStatePath.endsWith(path.join('ecc', 'install-state.json'))) {
    return installStatePath.replace(/ecc[\\/]+install-state\.json$/, `ecc${path.sep}install-manifest.json`);
  }

  return path.join(path.dirname(installStatePath), 'install-manifest.json');
}

function computeSha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function normalizeOperations(operations) {
  if (!Array.isArray(operations)) {
    return [];
  }

  return operations.filter((operation) => {
    if (!operation || typeof operation !== 'object') {
      return false;
    }
    if (operation.ownership && operation.ownership !== 'managed') {
      return false;
    }
    return typeof operation.destinationPath === 'string' && operation.destinationPath.length > 0;
  });
}

function createInstallAuditManifest(plan, options = {}) {
  const operations = normalizeOperations(plan.operations);
  const files = [];

  for (const operation of operations) {
    if (!fs.existsSync(operation.destinationPath)) {
      continue;
    }

    const stat = fs.statSync(operation.destinationPath);
    if (!stat.isFile()) {
      continue;
    }

    files.push({
      moduleId: operation.moduleId || 'unknown',
      sourceRelativePath: operation.sourceRelativePath || null,
      destinationPath: operation.destinationPath,
      sha256: computeSha256(operation.destinationPath),
      sizeBytes: stat.size,
    });
  }

  const installManifestPath = options.installManifestPath || deriveInstallManifestPath(plan.installStatePath);

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    target: {
      adapterId: plan.adapter && plan.adapter.id ? plan.adapter.id : null,
      target: plan.target || null,
      kind: plan.adapter && plan.adapter.kind ? plan.adapter.kind : null,
      root: plan.targetRoot || null,
      installStatePath: plan.installStatePath,
      installManifestPath,
    },
    source: {
      repoVersion: plan.statePreview && plan.statePreview.source ? plan.statePreview.source.repoVersion || null : null,
      repoCommit: plan.statePreview && plan.statePreview.source ? plan.statePreview.source.repoCommit || null : null,
      manifestVersion: plan.statePreview && plan.statePreview.source
        ? plan.statePreview.source.manifestVersion || null
        : null,
    },
    request: {
      profileId: plan.profileId || null,
      requestedModuleIds: Array.isArray(plan.requestedModuleIds) ? [...plan.requestedModuleIds] : [],
    },
    resolution: {
      selectedModuleIds: Array.isArray(plan.selectedModuleIds) ? [...plan.selectedModuleIds] : [],
      skippedModuleIds: Array.isArray(plan.skippedModuleIds) ? [...plan.skippedModuleIds] : [],
      excludedModuleIds: Array.isArray(plan.excludedModuleIds) ? [...plan.excludedModuleIds] : [],
    },
    summary: {
      operationCount: operations.length,
      fileCount: files.length,
    },
    files,
  };
}

function writeInstallAuditManifest(plan, options = {}) {
  const manifest = createInstallAuditManifest(plan, options);
  const installManifestPath = manifest.target.installManifestPath;
  fs.mkdirSync(path.dirname(installManifestPath), { recursive: true });
  fs.writeFileSync(installManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return {
    installManifestPath,
    manifest,
  };
}

function readInstallAuditManifest(installManifestPath) {
  const payload = JSON.parse(fs.readFileSync(installManifestPath, 'utf8'));
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('install-manifest must be a JSON object');
  }
  return payload;
}

function verifyInstallAuditManifest(installManifestPath) {
  if (!fs.existsSync(installManifestPath)) {
    return {
      status: 'missing',
      issues: [{
        severity: 'warning',
        code: 'install-manifest-missing',
        message: `install-manifest not found: ${installManifestPath}`,
      }],
      checkedFileCount: 0,
      mismatchedFileCount: 0,
      missingFileCount: 0,
    };
  }

  let manifest;
  try {
    manifest = readInstallAuditManifest(installManifestPath);
  } catch (error) {
    return {
      status: 'invalid',
      issues: [{
        severity: 'warning',
        code: 'install-manifest-invalid',
        message: `Failed to parse install-manifest: ${error.message}`,
      }],
      checkedFileCount: 0,
      mismatchedFileCount: 0,
      missingFileCount: 0,
    };
  }

  const issues = [];
  if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    issues.push({
      severity: 'warning',
      code: 'install-manifest-schema-mismatch',
      message: `Unexpected install-manifest schema: ${manifest.schemaVersion || '(missing)'}`,
    });
  }

  const files = Array.isArray(manifest.files) ? manifest.files : [];
  let checkedFileCount = 0;
  let mismatchedFileCount = 0;
  let missingFileCount = 0;

  for (const fileEntry of files) {
    if (!fileEntry || typeof fileEntry !== 'object') {
      continue;
    }

    const destinationPath = fileEntry.destinationPath;
    if (typeof destinationPath !== 'string' || destinationPath.length === 0) {
      continue;
    }

    checkedFileCount += 1;
    if (!fs.existsSync(destinationPath)) {
      missingFileCount += 1;
      issues.push({
        severity: 'warning',
        code: 'install-manifest-missing-file',
        message: `Managed file is missing: ${destinationPath}`,
      });
      continue;
    }

    if (typeof fileEntry.sha256 !== 'string' || fileEntry.sha256.length === 0) {
      continue;
    }

    const actualHash = computeSha256(destinationPath);
    if (actualHash !== fileEntry.sha256) {
      mismatchedFileCount += 1;
      issues.push({
        severity: 'warning',
        code: 'install-manifest-hash-mismatch',
        message: `Managed file hash mismatch: ${destinationPath}`,
      });
    }
  }

  return {
    status: issues.length > 0 ? 'warning' : 'ok',
    issues,
    checkedFileCount,
    mismatchedFileCount,
    missingFileCount,
    manifest,
  };
}

module.exports = {
  MANIFEST_SCHEMA_VERSION,
  createInstallAuditManifest,
  deriveInstallManifestPath,
  readInstallAuditManifest,
  verifyInstallAuditManifest,
  writeInstallAuditManifest,
};
