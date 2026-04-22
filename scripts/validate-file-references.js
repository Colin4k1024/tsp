#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);
const ARCHIVE_DIR_PREFIXES = [
  path.join('docs', 'plans'),
  path.join('docs', 'artifacts'),
  path.join('docs', 'memory', 'sessions'),
];
const DEFAULT_MARKDOWN_DIRS = [
  'docs',
  'rules',
  'templates',
  'commands',
  'contexts',
  'examples',
  path.join('agents', 'roles'),
  path.join('skills', 'roles'),
  path.join('skills', 'api-contract'),
  path.join('skills', 'doc-architecture'),
  path.join('skills', 'frontend-engineering'),
  path.join('skills', 'frontend-ui-ux-system'),
  path.join('skills', 'agent-dev-workshop'),
];
const EXCLUDED_MARKDOWN_FILES = new Set([
  path.join('hooks', 'README.md'),
]);
const EXCLUDED_SPECIALISTS = new Set([
  'chief-of-staff.md',
  'gan-evaluator.md',
  'gan-generator.md',
  'gan-planner.md',
  'healthcare-reviewer.md',
  'flutter-reviewer.md',
  'opensource-forker.md',
  'opensource-packager.md',
  'opensource-sanitizer.md',
]);
const STRICT_JSON_TARGETS = [
  path.join('hooks', 'hooks.json'),
  path.join('manifests', 'install-components.json'),
  path.join('manifests', 'install-modules.json'),
  path.join('manifests', 'install-profiles.json'),
  path.join('marketplace.json'),
  path.join('.claude-plugin', 'plugin.json'),
  path.join('.claude-plugin', 'marketplace.json'),
];
const PATH_LIKE_KEY_RE = /(path|file|dir|source|target)$/i;

function parseArgs(argv) {
  const options = {
    cwd: process.cwd(),
    strict: false,
    json: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--strict') {
      options.strict = true;
      continue;
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--cwd' && argv[index + 1]) {
      options.cwd = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getHelpText() {
  return [
    'Usage: node scripts/validate-file-references.js [options]',
    '',
    'Options:',
    '  --cwd <path>          Validate references under a specific project root.',
    '  --strict              Enable JSON path reference validation in addition to Markdown links.',
    '  --json                Emit machine-readable output.',
    '  -h, --help            Show this help message.',
  ].join('\n');
}

function isArchivePath(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  return ARCHIVE_DIR_PREFIXES.some((prefix) => {
    const archivePrefix = prefix.split(path.sep).join('/');
    return normalized === archivePrefix || normalized.startsWith(`${archivePrefix}/`);
  });
}

function walkMarkdownFiles(rootDir, directory, out) {
  if (!fs.existsSync(directory)) {
    return;
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
      continue;
    }
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(rootDir, absolutePath, out);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }
    out.push(path.relative(rootDir, absolutePath));
  }
}

function collectMarkdownCandidates(root) {
  const candidates = [];
  for (const relativeDir of DEFAULT_MARKDOWN_DIRS) {
    walkMarkdownFiles(root, path.join(root, relativeDir), candidates);
  }
  for (const rootFile of ['README.md', 'AGENTS.md', 'CLAUDE.md']) {
    if (fs.existsSync(path.join(root, rootFile))) {
      candidates.push(rootFile);
    }
  }
  const specialistsDir = path.join(root, 'agents', 'specialists');
  if (fs.existsSync(specialistsDir)) {
    for (const entry of fs.readdirSync(specialistsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md') || EXCLUDED_SPECIALISTS.has(entry.name)) {
        continue;
      }
      candidates.push(path.join('agents', 'specialists', entry.name));
    }
  }

  const unique = [...new Set(candidates)]
    .filter((relativePath) => !EXCLUDED_MARKDOWN_FILES.has(relativePath))
    .sort();
  return unique;
}

function shouldSkipLinkTarget(target) {
  return (
    target.startsWith('http://')
    || target.startsWith('https://')
    || target.startsWith('#')
    || target.startsWith('mailto:')
  );
}

function createIssue(kind, relativeFile, target, message) {
  return {
    kind,
    file: relativeFile,
    target,
    message,
  };
}

function validateMarkdownLinks(root, relativePath, issues) {
  const absolutePath = path.join(root, relativePath);
  const text = fs.readFileSync(absolutePath, 'utf8');
  const archivePath = isArchivePath(relativePath);

  for (const match of text.matchAll(LINK_RE)) {
    const target = match[1];
    if (shouldSkipLinkTarget(target)) {
      continue;
    }

    const normalizedTarget = target.split('#', 1)[0];
    if (!normalizedTarget) {
      continue;
    }

    const linkPath = path.resolve(path.dirname(absolutePath), normalizedTarget);
    if (!fs.existsSync(linkPath)) {
      issues.push(createIssue(
        archivePath ? 'warning' : 'error',
        relativePath,
        target,
        `Broken Markdown reference: ${target}`,
      ));
    }
  }
}

function shouldTreatAsPathReference(key, value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }
  if (!PATH_LIKE_KEY_RE.test(key)) {
    return false;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return false;
  }
  if (value.includes('${')) {
    return false;
  }
  if (value.startsWith('~')) {
    return false;
  }
  if (path.isAbsolute(value)) {
    return false;
  }
  return value.includes('/') || /\.[a-z0-9]+$/i.test(value);
}

function walkJsonReferences(node, visit, trail = []) {
  if (Array.isArray(node)) {
    node.forEach((value, index) => walkJsonReferences(value, visit, [...trail, String(index)]));
    return;
  }
  if (!node || typeof node !== 'object') {
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    const nextTrail = [...trail, key];
    if (shouldTreatAsPathReference(key, value)) {
      visit({
        key,
        value,
        pathTrail: nextTrail,
      });
    }
    walkJsonReferences(value, visit, nextTrail);
  }
}

function validateJsonPathReferences(root, relativePath, issues) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return;
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    issues.push(createIssue('warning', relativePath, null, `Failed to parse JSON: ${error.message}`));
    return;
  }

  walkJsonReferences(payload, (reference) => {
    const resolved = path.resolve(path.dirname(absolutePath), reference.value);
    if (!fs.existsSync(resolved)) {
      issues.push(createIssue(
        'error',
        relativePath,
        reference.value,
        `Broken JSON path reference at ${reference.pathTrail.join('.')}: ${reference.value}`,
      ));
    }
  });
}

function validateFileReferences(options = {}) {
  const root = options.cwd || process.cwd();
  const strict = Boolean(options.strict);
  const issues = [];
  const markdownFiles = collectMarkdownCandidates(root);

  for (const relativePath of markdownFiles) {
    validateMarkdownLinks(root, relativePath, issues);
  }

  const jsonFiles = strict
    ? STRICT_JSON_TARGETS.filter((relativePath) => fs.existsSync(path.join(root, relativePath)))
    : [];
  for (const relativePath of jsonFiles) {
    validateJsonPathReferences(root, relativePath, issues);
  }

  const errors = issues.filter((issue) => issue.kind === 'error');
  const warnings = issues.filter((issue) => issue.kind === 'warning');

  return {
    root,
    strict,
    checkedMarkdownFileCount: markdownFiles.length,
    checkedJsonFileCount: jsonFiles.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
  };
}

function formatHumanReport(report) {
  const lines = [];
  lines.push(`Checked Markdown files: ${report.checkedMarkdownFileCount}`);
  lines.push(`Checked JSON files: ${report.checkedJsonFileCount}`);
  lines.push(`Errors: ${report.errorCount}`);
  lines.push(`Warnings: ${report.warningCount}`);

  if (report.errors.length > 0) {
    lines.push('\nErrors:');
    for (const issue of report.errors) {
      lines.push(`- ${issue.file}: ${issue.message}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('\nWarnings:');
    for (const issue of report.warnings) {
      lines.push(`- ${issue.file}: ${issue.message}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${getHelpText()}\n`);
    return;
  }

  const report = validateFileReferences(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(formatHumanReport(report));
  }

  if (report.errorCount > 0) {
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
  validateFileReferences,
};
