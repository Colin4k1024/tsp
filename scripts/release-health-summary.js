#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { listPublicInstallProfiles, listPublicInstallTargets } = require(path.join(__dirname, '..', 'bin', 'lib', 'install-surface'));
const { validateDocFreshness } = require('./validate-doc-freshness');
const { validateFileReferences } = require('./validate-file-references');
const { validatePrebuilt } = require('./validate-prebuilt');
const { resolveTarballPath, validateTarball } = require('./validate-packed-tarball');
const { collectTargetSupportMatrix, groupTargetSupportMatrix } = require('./lib/release-health');

function parseArgs(argv = process.argv) {
  const args = argv.slice(2);
  const options = {
    root: process.cwd(),
    profileId: 'team',
    json: false,
    help: false,
    tarball: null,
    packJson: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') {
      options.root = path.resolve(args[index + 1] || options.root);
      index += 1;
      continue;
    }
    if (arg === '--profile') {
      options.profileId = args[index + 1] || options.profileId;
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
    if (arg === '--json') {
      options.json = true;
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
    'Usage: node scripts/release-health-summary.js [options]',
    '',
    'Options:',
    '  --root <path>         Evaluate a specific project root.',
    '  --profile <id>       Profile used to summarize target support depth (default: team).',
    '  --tarball <file>     Validate a specific packed tarball.',
    '  --pack-json <file>   Validate a tarball resolved from npm pack JSON output.',
    '  --json               Emit machine-readable JSON.',
    '  -h, --help           Show this help message.',
  ].join('\n');
}

function summarizeOutput(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' | ');
}

function overallStatus(checks) {
  if (checks.some((check) => check.status === 'fail')) {
    return 'fail';
  }
  if (checks.some((check) => check.status === 'warn')) {
    return 'warn';
  }
  return 'pass';
}

function runNodeCheck(root, label, relativeScriptPath, args = []) {
  const command = ['node', relativeScriptPath, ...args].join(' ');
  const result = spawnSync(process.execPath, [path.join(root, relativeScriptPath), ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  const details = summarizeOutput(result.stderr || result.stdout);

  return {
    id: label,
    label,
    command,
    status: result.status === 0 ? 'pass' : 'fail',
    details: details || (result.status === 0 ? 'passed' : `exit ${result.status}`),
  };
}

function buildDocFreshnessCheck(root) {
  const report = validateDocFreshness({ root });
  return {
    id: 'validate-doc-freshness',
    label: 'validate-doc-freshness',
    command: 'node scripts/validate-doc-freshness.js',
    status: report.errorCount > 0 ? 'fail' : 'pass',
    details: report.errorCount > 0
      ? report.errors[0]
      : (report.warningCount > 0 ? report.warnings[0] : `checked ${report.markdownFileCount} markdown files`),
  };
}

function buildReferenceCheck(root) {
  const report = validateFileReferences({ cwd: root, strict: true });
  return {
    id: 'validate-file-references',
    label: 'validate-file-references --strict',
    command: 'node scripts/validate-file-references.js --strict',
    status: report.errorCount > 0 ? 'fail' : (report.warningCount > 0 ? 'warn' : 'pass'),
    details: report.errorCount > 0
      ? report.errors[0].message
      : (report.warningCount > 0 ? report.warnings[0].message : `checked ${report.checkedMarkdownFileCount} markdown files / ${report.checkedJsonFileCount} json files`),
  };
}

function buildPrebuiltCheck(root) {
  const report = validatePrebuilt({ root });
  return {
    id: 'validate-prebuilt',
    label: 'validate-prebuilt',
    command: 'node scripts/validate-prebuilt.js',
    status: report.missingCount > 0 ? 'fail' : 'pass',
    details: report.missingCount > 0
      ? report.missing[0]
      : `validated ${report.platforms.length} platforms`,
  };
}

function packCurrentTarball(root) {
  const result = spawnSync('npm', ['pack', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(summarizeOutput(result.stderr || result.stdout) || `npm pack failed with exit ${result.status}`);
  }

  let data;
  try {
    data = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Unable to parse npm pack JSON output: ${error.message}`);
  }

  if (!Array.isArray(data) || !data[0] || typeof data[0].filename !== 'string' || data[0].filename.length === 0) {
    throw new Error('npm pack JSON output is missing a filename entry.');
  }

  const tarballPath = path.join(root, data[0].filename);
  return {
    tarballPath,
    cleanup() {
      fs.rmSync(tarballPath, { force: true });
    },
  };
}

function buildTarballCheck(options) {
  let cleanup = null;
  try {
    const usingExplicitInput = Boolean(options.tarball || options.packJson);
    const tarballPath = usingExplicitInput
      ? resolveTarballPath({
        root: options.root,
        tarball: options.tarball,
        packJson: options.packJson,
      })
      : (() => {
        const packed = packCurrentTarball(options.root);
        cleanup = packed.cleanup;
        return packed.tarballPath;
      })();
    const result = validateTarball(tarballPath, validatePrebuilt({ root: options.root }).platforms);
    return {
      id: 'validate-packed-tarball',
      label: 'validate-packed-tarball',
      command: options.packJson
        ? `node scripts/validate-packed-tarball.js --pack-json ${path.relative(options.root, options.packJson)}`
        : options.tarball
          ? `node scripts/validate-packed-tarball.js --tarball ${path.relative(options.root, tarballPath)}`
          : `npm pack --json --ignore-scripts && node scripts/validate-packed-tarball.js --tarball ${path.relative(options.root, tarballPath)}`,
      status: result.missing.length > 0 ? 'fail' : 'pass',
      details: result.missing.length > 0
        ? result.missing[0]
        : `validated ${path.basename(tarballPath)}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const explicitTarballRequested = Boolean(options.tarball || options.packJson);
    if (explicitTarballRequested) {
      return {
        id: 'validate-packed-tarball',
        label: 'validate-packed-tarball',
        command: 'node scripts/validate-packed-tarball.js',
        status: 'fail',
        details: message,
      };
    }

    return {
      id: 'validate-packed-tarball',
      label: 'validate-packed-tarball',
      command: 'node scripts/validate-packed-tarball.js',
      status: 'skip',
      details: message,
    };
  } finally {
    cleanup?.();
  }
}

function buildReleaseHealthReport(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const checks = [
    runNodeCheck(root, 'validate-library', 'scripts/validate-library.js'),
    buildDocFreshnessCheck(root),
    buildReferenceCheck(root),
    runNodeCheck(root, 'test-public-release-surface', 'tests/test_public_release_surface.js'),
    runNodeCheck(root, 'test-tsp-create-surface', 'tests/test_tsp_create_surface.js'),
    runNodeCheck(root, 'test-codex-install-plan', 'tests/test_codex_install_plan.js'),
    buildPrebuiltCheck(root),
    buildTarballCheck({
      root,
      tarball: options.tarball,
      packJson: options.packJson,
    }),
  ];

  const supportMatrix = collectTargetSupportMatrix({
    repoRoot: root,
    profileId: options.profileId,
  });

  return {
    generatedAt: new Date().toISOString(),
    root,
    profileId: options.profileId,
    overallStatus: overallStatus(checks),
    checks,
    publicSurface: {
      targetCount: listPublicInstallTargets().length,
      profileCount: listPublicInstallProfiles().length,
      targets: listPublicInstallTargets().map((target) => target.id),
      profiles: listPublicInstallProfiles().map((profile) => profile.id),
    },
    supportMatrix,
    supportGroups: groupTargetSupportMatrix(supportMatrix),
  };
}

function formatHumanReport(report) {
  const lines = [];
  lines.push('Open-source release health');
  lines.push('');
  lines.push(`Overall: ${report.overallStatus.toUpperCase()}`);
  lines.push(`Root: ${report.root}`);
  lines.push(`Support profile: ${report.profileId}`);
  lines.push(`Public surface: ${report.publicSurface.targetCount} targets / ${report.publicSurface.profileCount} profiles`);
  lines.push('');
  lines.push('Checks:');

  for (const check of report.checks) {
    lines.push(`- [${check.status.toUpperCase()}] ${check.label}`);
    lines.push(`  ${check.details}`);
  }

  lines.push('');
  lines.push(`Target support (${report.profileId} profile):`);
  for (const group of report.supportGroups) {
    const entries = group.entries
      .map((entry) => `${entry.target} (${entry.selectedCount}/${entry.requestedCount})`)
      .join(', ');
    lines.push(`- ${group.level}: ${entries}`);
  }

  lines.push('');
  lines.push('Note: partial/baseline targets are public compatibility paths, not full `/team-*` parity installs.');
  return `${lines.join('\n')}\n`;
}

function main(argv = process.argv) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${getHelpText()}\n`);
    return;
  }

  const report = buildReleaseHealthReport(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(formatHumanReport(report));
  }

  if (report.overallStatus === 'fail') {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  buildReleaseHealthReport,
  formatHumanReport,
  getHelpText,
  main,
  overallStatus,
  parseArgs,
};
