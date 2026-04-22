#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);

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
    'Usage: node scripts/validate-skill-structure.js [options]',
    '',
    'Options:',
    '  --cwd <path>          Validate skills under a specific project root.',
    '  --strict              Escalate warnings to errors.',
    '  --json                Emit machine-readable output.',
    '  -h, --help            Show this help message.',
  ].join('\n');
}

function collectSkillFiles(skillsRoot, out = []) {
  if (!fs.existsSync(skillsRoot)) {
    return out;
  }

  for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
      continue;
    }
    const absolutePath = path.join(skillsRoot, entry.name);
    if (entry.isDirectory()) {
      collectSkillFiles(absolutePath, out);
      continue;
    }
    if (entry.isFile() && entry.name === 'SKILL.md') {
      out.push(absolutePath);
    }
  }

  return out;
}

function isRoleSkill(relativeSkillPath) {
  const normalized = relativeSkillPath.split(path.sep).join('/');
  return normalized.startsWith('skills/roles/');
}

function createIssue(kind, relativePath, message) {
  return {
    kind,
    path: relativePath,
    message,
  };
}

function validateSkillFrontmatter(skillPath, relativeSkillPath, issues) {
  const text = fs.readFileSync(skillPath, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    issues.push(createIssue('error', relativeSkillPath, 'SKILL.md 缺少 frontmatter'));
    return { text, frontmatter: null };
  }

  const frontmatter = match[1];
  if (!frontmatter.includes('name:')) {
    issues.push(createIssue('error', relativeSkillPath, 'frontmatter 缺少 name 字段'));
  }
  if (!frontmatter.includes('description:')) {
    issues.push(createIssue('error', relativeSkillPath, 'frontmatter 缺少 description 字段'));
  }

  return { text, frontmatter };
}

function shouldSkipLinkTarget(target) {
  return (
    target.startsWith('http://')
    || target.startsWith('https://')
    || target.startsWith('#')
    || target.startsWith('mailto:')
  );
}

function validateSkillLinks(root, skillPath, relativeSkillPath, text, issues, strict) {
  for (const match of text.matchAll(LINK_RE)) {
    const target = match[1];
    if (shouldSkipLinkTarget(target)) {
      continue;
    }

    const normalizedTarget = target.split('#', 1)[0];
    if (!normalizedTarget) {
      continue;
    }

    const resolved = path.resolve(path.dirname(skillPath), normalizedTarget);
    if (!fs.existsSync(resolved)) {
      issues.push(createIssue(
        strict ? 'error' : 'warning',
        relativeSkillPath,
        `SKILL.md 存在失效引用: ${target}`,
      ));
    }
  }
}

function validateSkillAgentMetadata(skillDir, relativeSkillPath, issues) {
  const openaiPath = path.join(skillDir, 'agents', 'openai.yaml');
  if (!fs.existsSync(openaiPath)) {
    issues.push(createIssue(
      isRoleSkill(relativeSkillPath) ? 'error' : 'warning',
      relativeSkillPath,
      '缺少 agents/openai.yaml',
    ));
    return;
  }

  const yaml = fs.readFileSync(openaiPath, 'utf8');
  if (!yaml.includes('display_name:')) {
    issues.push(createIssue('warning', relativeSkillPath, 'agents/openai.yaml 缺少 display_name'));
  }
  if (!yaml.includes('short_description:')) {
    issues.push(createIssue('warning', relativeSkillPath, 'agents/openai.yaml 缺少 short_description'));
  }
  if (!yaml.includes('default_prompt:')) {
    issues.push(createIssue('warning', relativeSkillPath, 'agents/openai.yaml 缺少 default_prompt'));
  }
}

function validateSkillStructure(options = {}) {
  const root = options.cwd || process.cwd();
  const strict = Boolean(options.strict);
  const strictPaths = new Set(
    (Array.isArray(options.strictPaths) ? options.strictPaths : [])
      .map((relativePath) => String(relativePath).split(path.sep).join('/'))
  );
  const skillsRoot = path.join(root, 'skills');
  const issues = [];
  const skillFiles = collectSkillFiles(skillsRoot).sort();

  for (const skillFile of skillFiles) {
    const skillDir = path.dirname(skillFile);
    const relativeSkillPath = path.relative(root, skillFile);
    const { text } = validateSkillFrontmatter(skillFile, relativeSkillPath, issues);
    validateSkillLinks(root, skillFile, relativeSkillPath, text, issues, strict);
    validateSkillAgentMetadata(skillDir, relativeSkillPath, issues);
  }

  let errors = issues.filter((issue) => issue.kind === 'error');
  const warnings = issues.filter((issue) => issue.kind === 'warning');
  const escalatedWarnings = warnings.filter((warning) => (
    strict || strictPaths.has(warning.path.split(path.sep).join('/'))
  ));
  if (escalatedWarnings.length > 0) {
    errors = [...errors, ...escalatedWarnings.map((warning) => ({ ...warning, kind: 'error' }))];
  }

  return {
    root,
    strict,
    checkedSkillCount: skillFiles.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
  };
}

function formatHumanReport(report) {
  const lines = [];
  lines.push(`Checked skills: ${report.checkedSkillCount}`);
  lines.push(`Errors: ${report.errorCount}`);
  lines.push(`Warnings: ${report.warningCount}`);

  if (report.errors.length > 0) {
    lines.push('\nErrors:');
    for (const issue of report.errors) {
      lines.push(`- ${issue.path}: ${issue.message}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('\nWarnings:');
    for (const issue of report.warnings) {
      lines.push(`- ${issue.path}: ${issue.message}`);
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

  const report = validateSkillStructure(options);
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
  validateSkillStructure,
};
