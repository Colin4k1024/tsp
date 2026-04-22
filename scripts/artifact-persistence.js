#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const INDEX_COLUMNS = [
  { key: 'date', label: '日期' },
  { key: 'task', label: '任务' },
  { key: 'prd', label: 'PRD' },
  { key: 'deliveryPlan', label: 'Delivery Plan' },
  { key: 'archDesign', label: 'Arch Design' },
  { key: 'testPlan', label: 'Test Plan' },
  { key: 'launchAcceptance', label: 'Launch Acceptance' },
  { key: 'deploymentContext', label: 'Deployment Context' },
  { key: 'releasePlan', label: 'Release Plan' },
  { key: 'closeout', label: 'Closeout' },
  { key: 'adr', label: 'ADR' },
  { key: 'status', label: '状态' },
];

const LEGACY_HEADER_TO_KEY = {
  '日期': 'date',
  '任务': 'task',
  'PRD': 'prd',
  'Delivery Plan': 'deliveryPlan',
  'Arch Design': 'archDesign',
  'Test Plan': 'testPlan',
  'Launch Acceptance': 'launchAcceptance',
  'Deployment Context': 'deploymentContext',
  'Release Plan': 'releasePlan',
  'Closeout': 'closeout',
  'ADR': 'adr',
  '状态': 'status',
};

const ARTIFACT_FILE_NAMES = {
  prd: 'prd.md',
  'delivery-plan': 'delivery-plan.md',
  'arch-design': 'arch-design.md',
  'api-contract': 'api-contract.md',
  'execute-log': 'execute-log.md',
  'test-plan': 'test-plan.md',
  'launch-acceptance': 'launch-acceptance.md',
  'deployment-context': 'deployment-context.md',
  'release-plan': 'release-plan.md',
  'closeout-summary': 'closeout-summary.md',
};

const ARTIFACT_COLUMN_KEYS = {
  prd: 'prd',
  'delivery-plan': 'deliveryPlan',
  'arch-design': 'archDesign',
  'test-plan': 'testPlan',
  'launch-acceptance': 'launchAcceptance',
  'deployment-context': 'deploymentContext',
  'release-plan': 'releasePlan',
  'closeout-summary': 'closeout',
};

const ARTIFACT_DEFAULT_STATUS = {
  prd: 'intake',
  'delivery-plan': 'plan',
  'arch-design': 'plan',
  'execute-log': 'execute',
  'test-plan': 'review',
  'launch-acceptance': 'accepted',
  'deployment-context': 'released',
  'release-plan': 'released',
  'closeout-summary': 'closed',
};

const ARTIFACT_TEMPLATES = {
  'launch-acceptance': 'launch-acceptance.md',
  'deployment-context': 'deployment-context.md',
  'release-plan': 'release-plan.md',
  'closeout-summary': 'closeout-summary.md',
};

const ARTIFACT_TITLES = {
  prd: 'PRD',
  'delivery-plan': 'Delivery Plan',
  'arch-design': 'Architecture Design',
  'api-contract': 'API Contract',
  'execute-log': 'Execute Log',
  'test-plan': 'Test Plan',
  'launch-acceptance': 'Launch Acceptance',
  'deployment-context': 'Deployment Context',
  'release-plan': 'Release Plan',
  'closeout-summary': 'Closeout Summary',
};

const VALID_STATES = new Set(['draft', 'intake', 'plan', 'execute', 'review', 'accepted', 'released', 'closed']);
const MAX_SLUG_LENGTH = 50;
const MAX_ROLE_LENGTH = 50;
const MAX_SEQUENCE_ATTEMPTS = 1000;

const KNOWN_FLAGS = new Set([
  '--help',
  '-h',
  '--json',
  '--cwd',
  '--slug',
  '--date',
  '--task-dir',
  '--artifact',
  '--role',
  '--status',
  '--state',
  '--project-name',
  '--phase',
  '--current-task',
  '--tech-stack',
  '--dependency',
  '--risk',
  '--next-step',
  '--from',
  '--to',
  '--memory-type',
  '--content',
  '--title',
]);

function parseArgs(argv) {
  const options = {
    cwd: process.cwd(),
    command: null,
    help: false,
    json: false,
    slug: null,
    date: null,
    taskDir: null,
    artifact: null,
    role: null,
    status: 'draft',
    state: null,
    projectName: null,
    phase: null,
    currentTask: null,
    techStack: [],
    dependency: [],
    risk: [],
    nextStep: [],
    fromRole: null,
    toRole: null,
    memoryType: null,
    content: null,
    title: null,
  };

  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if ((arg.startsWith('--') || arg === '-h') && !KNOWN_FLAGS.has(arg.split('=')[0])) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true;
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
    if (arg === '--slug' && argv[index + 1]) {
      options.slug = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--date' && argv[index + 1]) {
      options.date = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--task-dir' && argv[index + 1]) {
      options.taskDir = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--artifact' && argv[index + 1]) {
      options.artifact = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--role' && argv[index + 1]) {
      options.role = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--status' && argv[index + 1]) {
      options.status = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--state' && argv[index + 1]) {
      options.state = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--project-name' && argv[index + 1]) {
      options.projectName = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--phase' && argv[index + 1]) {
      options.phase = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--current-task' && argv[index + 1]) {
      options.currentTask = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--tech-stack' && argv[index + 1]) {
      options.techStack.push(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--dependency' && argv[index + 1]) {
      options.dependency.push(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--risk' && argv[index + 1]) {
      options.risk.push(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--next-step' && argv[index + 1]) {
      options.nextStep.push(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--from' && argv[index + 1]) {
      options.fromRole = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--to' && argv[index + 1]) {
      options.toRole = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--memory-type' && argv[index + 1]) {
      options.memoryType = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--content' && argv[index + 1]) {
      options.content = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--title' && argv[index + 1]) {
      options.title = argv[index + 1];
      index += 1;
      continue;
    }
    positional.push(arg);
  }

  options.command = positional[0] || null;
  return options;
}

function getHelpText() {
  return [
    'Usage: node scripts/artifact-persistence.js <command> [options]',
    '',
    'Commands:',
    '  ensure-task            Create docs/artifacts/{date}-{slug} and ensure INDEX row exists.',
    '  ensure-artifact        Create one artifact file with frontmatter/template and update INDEX.',
    '  ensure-handoff         Create docs/artifacts/{task}/handoffs/{NNN}-{from}-to-{to}.md.',
    '  append-memory          Append an entry to docs/memory/backlog.md, lessons-learned.md, or decisions.md.',
    '  write-session-summary  Create docs/memory/sessions/{date}-{NNN}-{slug}.md.',
    '  write-project-context  Refresh docs/memory/project-context.md.',
    '',
    'Common options:',
    '  --cwd <path>           Resolve docs/, templates/ and memory/ relative to this directory.',
    '  --date <YYYY-MM-DD>    Target artifact date.',
    '  --slug <slug>          Task slug without date prefix.',
    '  --task-dir <path>      Explicit task artifact directory.',
    '  --json                 Emit structured JSON output.',
    '  -h, --help             Show this help message.',
    '',
    'ensure-artifact options:',
    '  --artifact <name>      Artifact id such as prd, delivery-plan, launch-acceptance.',
    '  --role <role>          Artifact owner role for frontmatter.',
    '  --status <status>      Frontmatter status, defaults to draft.',
    '  --state <state>        Override INDEX status value.',
    '',
    'ensure-handoff options:',
    '  --from <role>          Upstream role id for filename and body skeleton.',
    '  --to <role>            Downstream role id for filename and body skeleton.',
    '  --status <status>      Frontmatter status, defaults to draft.',
    '',
    'append-memory options:',
    '  --memory-type <name>   One of backlog, lessons, decisions.',
    '  --title <title>        Optional section title for the appended entry.',
    '  --content <text>       Required markdown content to append.',
    '',
    'write-session-summary options:',
    '  --role <role>          Session summary owner role for frontmatter.',
    '  --title <title>        Optional heading title.',
    '  --content <text>       Required markdown body content.',
    '',
    'write-project-context options:',
    '  --project-name <name>  Project display name.',
    '  --current-task <slug>  Current task slug or directory name.',
    '  --phase <phase>        Current project phase.',
    '  --tech-stack <item>    Repeatable tech stack line.',
    '  --dependency <item>    Repeatable dependency line.',
    '  --risk <item>          Repeatable risk line.',
    '  --next-step <item>     Repeatable next-step line.',
  ].join('\n');
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function removeFileIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function atomicWrite(filePath, content) {
  const tempPath = `${filePath}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, filePath);
  } finally {
    removeFileIfExists(tempPath);
  }
}

function pathsForCwd(cwd) {
  return {
    artifactsRoot: path.join(cwd, 'docs', 'artifacts'),
    memoryRoot: path.join(cwd, 'docs', 'memory'),
    sessionsRoot: path.join(cwd, 'docs', 'memory', 'sessions'),
    templatesRoot: path.join(cwd, 'templates'),
    indexPath: path.join(cwd, 'docs', 'artifacts', 'INDEX.md'),
    projectContextPath: path.join(cwd, 'docs', 'memory', 'project-context.md'),
  };
}

function resolveTaskDir(options) {
  if (options.taskDir) {
    return options.taskDir;
  }
  if (!options.date || !options.slug) {
    throw new Error('Task resolution requires --task-dir or both --date and --slug');
  }
  return path.join(pathsForCwd(options.cwd).artifactsRoot, `${options.date}-${sanitizeSlug(options.slug)}`);
}

function sanitizeSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    throw new Error('Slug must be a non-empty string');
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    throw new Error(`Slug too long (max ${MAX_SLUG_LENGTH} characters): ${slug.length}`);
  }
  if (slug.includes('..') || /[\\/<>:"|?*]/.test(slug)) {
    throw new Error(`Invalid slug: ${slug}`);
  }
  return slug;
}

function sanitizeRole(role) {
  if (!role || typeof role !== 'string') {
    throw new Error('Role must be a non-empty string');
  }
  if (role.length > MAX_ROLE_LENGTH) {
    throw new Error(`Role too long (max ${MAX_ROLE_LENGTH} characters): ${role.length}`);
  }
  if (!/^[a-z0-9_-]+$/i.test(role)) {
    throw new Error(`Invalid role name: ${role}`);
  }
  return role;
}

function validateDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`Invalid date value: ${date}`);
  }
  return date;
}

function validateContent(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Content must be a non-empty string');
  }
  if (content.length > 100000) {
    throw new Error('Content exceeds maximum length of 100KB');
  }
  return content;
}

function validateTitle(title) {
  if (title === null || title === undefined) {
    return title;
  }
  if (/[\r\n]/.test(title)) {
    throw new Error('Title must not contain newlines');
  }
  return title;
}

function validateCwd(cwdPath) {
  const resolved = path.resolve(cwdPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`Invalid cwd: ${cwdPath} does not exist or is not a directory`);
  }
  return resolved;
}

function yamlEscape(value) {
  if (value === null || value === undefined) {
    return '""';
  }
  const text = String(value);
  if (/[\n\r\t:#|'"[\]{}&*?!@`]/.test(text)) {
    return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`;
  }
  return text;
}

function validateOptions(options) {
  options.cwd = validateCwd(options.cwd);
  if (options.date && !/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
    throw new Error(`Invalid date format: ${options.date}. Expected YYYY-MM-DD`);
  }
  if (options.date) {
    validateDate(options.date);
  }
  if (options.slug) {
    sanitizeSlug(options.slug);
  }
  if (options.artifact && !ARTIFACT_FILE_NAMES[options.artifact]) {
    throw new Error(`Unknown artifact: ${options.artifact}`);
  }
  if (options.status && !VALID_STATES.has(options.status)) {
    throw new Error(`Invalid status: ${options.status}`);
  }
  if (options.state && !VALID_STATES.has(options.state)) {
    throw new Error(`Invalid state: ${options.state}`);
  }
  if (options.command === 'ensure-artifact' && !options.role) {
    throw new Error('--role is required for ensure-artifact');
  }
  if (options.role) {
    sanitizeRole(options.role);
  }
  if (options.command === 'ensure-handoff' && (!options.fromRole || !options.toRole)) {
    throw new Error('--from and --to are required for ensure-handoff');
  }
  if (options.fromRole) {
    sanitizeRole(options.fromRole);
  }
  if (options.toRole) {
    sanitizeRole(options.toRole);
  }
  if (options.command === 'append-memory') {
    if (!options.memoryType || !['backlog', 'lessons', 'decisions'].includes(options.memoryType)) {
      throw new Error('--memory-type must be one of backlog, lessons, decisions');
    }
    if (!options.content) {
      throw new Error('--content is required for append-memory');
    }
  }
  if (options.command === 'write-session-summary' && !options.content) {
    throw new Error('--content is required for write-session-summary');
  }
  if (options.content) {
    validateContent(options.content);
  }
  if (options.title) {
    validateTitle(options.title);
  }
}

function padSequence(sequence) {
  return String(sequence).padStart(3, '0');
}

function nextSequenceFromNames(names, pattern) {
  const sequences = names
    .map((name) => name.match(pattern))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  return (sequences.length ? Math.max(...sequences) : 0) + 1;
}

function nextAvailableFilePath(buildPath, startSequence, maxAttempts = MAX_SEQUENCE_ATTEMPTS) {
  let sequence = startSequence;
  let candidatePath = buildPath(sequence);
  let attempts = 0;
  while (fs.existsSync(candidatePath)) {
    attempts += 1;
    if (attempts > maxAttempts) {
      throw new Error(`Exceeded maximum sequence attempts (${maxAttempts})`);
    }
    sequence += 1;
    candidatePath = buildPath(sequence);
  }
  return {
    sequence,
    filePath: candidatePath,
  };
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parseMarkdownLink(value) {
  const match = value.match(/^\[(.+?)\]\((.+?)\)$/);
  if (!match) {
    return { label: value, href: null };
  }
  return { label: match[1], href: match[2] };
}

function getSlugFromTaskDir(taskDir) {
  const baseName = path.basename(taskDir);
  return baseName.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function getDateFromTaskDir(taskDir) {
  const match = path.basename(taskDir).match(/^(\d{4}-\d{2}-\d{2})-/);
  if (!match) {
    throw new Error(`Task dir does not start with date prefix: ${taskDir}`);
  }
  return match[1];
}

function emptyRow() {
  return INDEX_COLUMNS.reduce((row, column) => {
    row[column.key] = '-';
    return row;
  }, {});
}

function parseIndexFile(indexPath) {
  if (!fs.existsSync(indexPath)) {
    return [];
  }

  const text = fs.readFileSync(indexPath, 'utf8');
  const lines = text.split('\n').filter((line) => line.trim());
  const tableLines = lines.filter((line) => line.trim().startsWith('|'));
  if (tableLines.length < 2) {
    return [];
  }

  const headers = splitTableRow(tableLines[0]);
  const rows = [];
  for (const line of tableLines.slice(2)) {
    const cells = splitTableRow(line);
    const row = emptyRow();
    headers.forEach((label, index) => {
      const key = LEGACY_HEADER_TO_KEY[label];
      if (key) {
        row[key] = cells[index] || '-';
      }
    });
    if (row.task !== '-') {
      rows.push(row);
    }
  }
  return rows;
}

function indexNeedsBackup(indexPath) {
  if (!fs.existsSync(indexPath)) {
    return false;
  }
  const text = fs.readFileSync(indexPath, 'utf8');
  const tableLines = text.split('\n').filter((line) => line.trim().startsWith('|'));
  if (!tableLines.length) {
    return false;
  }
  const headers = splitTableRow(tableLines[0]);
  if (headers.length !== INDEX_COLUMNS.length) {
    return true;
  }
  return headers.some((label) => !LEGACY_HEADER_TO_KEY[label]);
}

function renderIndex(rows) {
  const header = `| ${INDEX_COLUMNS.map((column) => column.label).join(' | ')} |`;
  const separator = `| ${INDEX_COLUMNS.map(() => '------').join(' | ')} |`;
  const body = rows
    .map((row) => `| ${INDEX_COLUMNS.map((column) => row[column.key] || '-').join(' | ')} |`)
    .join('\n');
  return ['# Artifacts Index', '', header, separator, body].filter(Boolean).join('\n') + '\n';
}

function upsertIndexRow(indexPath, taskDir, updates = {}) {
  if (indexNeedsBackup(indexPath)) {
    const backupPath = `${indexPath}.backup`;
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(indexPath, backupPath);
    }
  }

  const rows = parseIndexFile(indexPath);
  const slug = getSlugFromTaskDir(taskDir);
  const date = getDateFromTaskDir(taskDir);
  const existingIndex = rows.findIndex((row) => parseMarkdownLink(row.task).label === slug && row.date === date);
  const row = existingIndex >= 0 ? rows[existingIndex] : emptyRow();

  row.date = date;
  row.task = slug;
  Object.assign(row, updates);

  if (existingIndex >= 0) {
    rows[existingIndex] = row;
  } else {
    rows.push(row);
  }

  rows.sort((left, right) => `${left.date}-${left.task}`.localeCompare(`${right.date}-${right.task}`));
  ensureDir(path.dirname(indexPath));
  atomicWrite(indexPath, renderIndex(rows));
  return row;
}

function linkForTaskArtifact(taskDir, fileName) {
  return `[${fileName}](${path.basename(taskDir)}/${fileName})`;
}

function artifactBody(options) {
  const templateName = ARTIFACT_TEMPLATES[options.artifact];
  if (templateName) {
    const templatePath = path.join(pathsForCwd(options.cwd).templatesRoot, templateName);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    return fs.readFileSync(templatePath, 'utf8').trim();
  }

  const title = ARTIFACT_TITLES[options.artifact] || options.artifact;
  return `# ${title}\n`;
}

function frontmatter(options, taskDir) {
  const slug = getSlugFromTaskDir(taskDir);
  const date = getDateFromTaskDir(taskDir);
  return [
    '---',
    `artifact: ${yamlEscape(options.artifact)}`,
    `task: ${yamlEscape(slug)}`,
    `date: ${yamlEscape(date)}`,
    `role: ${yamlEscape(options.role)}`,
    `status: ${yamlEscape(options.status)}`,
    '---',
    '',
  ].join('\n');
}

function resolveMemoryFile(memoryRoot, memoryType) {
  const mapping = {
    backlog: path.join(memoryRoot, 'backlog.md'),
    lessons: path.join(memoryRoot, 'lessons-learned.md'),
    decisions: path.join(memoryRoot, 'decisions.md'),
  };
  return mapping[memoryType];
}

function defaultMemoryHeader(memoryType) {
  const mapping = {
    backlog: '# Backlog\n',
    lessons: '# Lessons Learned\n',
    decisions: '# Decisions Log\n',
  };
  return mapping[memoryType] || '# Notes\n';
}

function appendMemory(options) {
  const { memoryRoot } = pathsForCwd(options.cwd);
  const filePath = resolveMemoryFile(memoryRoot, options.memoryType);
  ensureDir(memoryRoot);
  const heading = `## ${options.date || new Date().toISOString().slice(0, 10)}${options.title ? ` - ${validateTitle(options.title)}` : ''}`;
  const existing = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8').trimEnd()
    : defaultMemoryHeader(options.memoryType).trimEnd();
  const nextContent = `${existing}\n\n${heading}\n\n${validateContent(options.content).trim()}\n`;
  atomicWrite(filePath, nextContent);
  return {
    memoryPath: filePath,
    memoryType: options.memoryType,
  };
}

function ensureHandoff(options) {
  const targetTaskDir = resolveTaskDir(options);
  const handoffDir = path.join(targetTaskDir, 'handoffs');
  ensureDir(handoffDir);
  const fromRole = sanitizeRole(options.fromRole);
  const toRole = sanitizeRole(options.toRole);

  const sequence = nextSequenceFromNames(
    fs.readdirSync(handoffDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name),
    /^(\d{3})-/
  );
  const handoffCandidate = nextAvailableFilePath(
    (currentSequence) => path.join(handoffDir, `${padSequence(currentSequence)}-${fromRole}-to-${toRole}.md`),
    sequence
  );
  const handoffPath = handoffCandidate.filePath;
  const date = options.date || getDateFromTaskDir(targetTaskDir);
  const slug = getSlugFromTaskDir(targetTaskDir);
  const content = [
    '---',
    'artifact: handoff',
    `task: ${yamlEscape(slug)}`,
    `date: ${yamlEscape(date)}`,
    `role: ${yamlEscape(fromRole)}`,
    `status: ${yamlEscape(options.status)}`,
    '---',
    '',
    `# Handoff: ${fromRole} -> ${toRole}`,
    '',
    '## 背景',
    '- 待补齐',
    '',
    '## 输入依据',
    '- 待补齐',
    '',
    '## 结论',
    '- 待补齐',
    '',
    '## 风险',
    '- 待补齐',
    '',
    '## 待确认项',
    '- 待补齐',
    '',
    '## 下一跳角色',
    `- ${toRole}`,
    '',
    '## 下游质疑记录',
    '- 待补齐',
    '',
  ].join('\n');
  atomicWrite(handoffPath, content);
  return {
    handoffPath,
    sequence: handoffCandidate.sequence,
  };
}

function writeSessionSummary(options) {
  const { sessionsRoot } = pathsForCwd(options.cwd);
  ensureDir(sessionsRoot);
  const date = options.date || new Date().toISOString().slice(0, 10);
  const taskDir = options.taskDir ? resolveTaskDir(options) : null;
  const slug = sanitizeSlug(options.slug || (taskDir ? getSlugFromTaskDir(taskDir) : 'session'));
  const pattern = new RegExp(`^${date}-(\\d{3})-${slug}(?:\\.md$|-)`);
  const sequence = nextSequenceFromNames(
    fs.readdirSync(sessionsRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name),
    pattern
  );
  const sessionCandidate = nextAvailableFilePath(
    (currentSequence) => path.join(sessionsRoot, `${date}-${padSequence(currentSequence)}-${slug}.md`),
    sequence
  );
  const sessionPath = sessionCandidate.filePath;
  const content = [
    '---',
    'artifact: session-summary',
    `task: ${yamlEscape(slug)}`,
    `date: ${yamlEscape(date)}`,
    `role: ${yamlEscape(sanitizeRole(options.role || 'tech-lead'))}`,
    `status: ${yamlEscape(options.status)}`,
    '---',
    '',
    `# ${options.title ? validateTitle(options.title) : `Session Summary - ${slug}`}`,
    '',
    validateContent(options.content).trim(),
    '',
  ].join('\n');
  atomicWrite(sessionPath, content);
  return {
    sessionPath,
    sequence: sessionCandidate.sequence,
  };
}

function ensureTask(options) {
  const targetTaskDir = resolveTaskDir(options);
  const { indexPath } = pathsForCwd(options.cwd);
  ensureDir(targetTaskDir);
  const row = upsertIndexRow(indexPath, targetTaskDir, {
    status: options.state || 'intake',
  });

  return {
    taskDir: targetTaskDir,
    indexUpdated: true,
    row,
  };
}

function ensureArtifact(options) {
  const targetTaskDir = resolveTaskDir(options);
  const { indexPath } = pathsForCwd(options.cwd);
  const fileName = ARTIFACT_FILE_NAMES[options.artifact];
  if (!fileName) {
    throw new Error(`Unsupported artifact: ${options.artifact}`);
  }
  if (!options.role) {
    throw new Error('--role is required for ensure-artifact');
  }

  ensureDir(targetTaskDir);
  const artifactPath = path.join(targetTaskDir, fileName);
  if (fs.existsSync(artifactPath)) {
    throw new Error(`Artifact already exists: ${artifactPath}`);
  }
  atomicWrite(artifactPath, `${frontmatter(options, targetTaskDir)}${artifactBody(options)}\n`);

  const updates = {
    status: options.state || ARTIFACT_DEFAULT_STATUS[options.artifact] || 'draft',
  };
  const columnKey = ARTIFACT_COLUMN_KEYS[options.artifact];
  if (columnKey) {
    updates[columnKey] = linkForTaskArtifact(targetTaskDir, fileName);
  }
  const row = upsertIndexRow(indexPath, targetTaskDir, updates);

  return {
    artifactPath,
    created: true,
    indexUpdated: true,
    row,
  };
}

function writeProjectContext(options) {
  const { memoryRoot, projectContextPath } = pathsForCwd(options.cwd);
  ensureDir(memoryRoot);
  const content = [
    `# Project Context — ${options.projectName || path.basename(options.cwd)}`,
    '',
    '## 项目名称',
    options.projectName || path.basename(options.cwd),
    '',
    '## Tech Stack',
    ...(options.techStack.length ? options.techStack.map((item) => `- ${item}`) : ['- 待补齐']),
    '',
    '## 当前活跃任务',
    options.currentTask ? `- ${options.currentTask}` : '- 待补齐',
    '',
    '## 当前阶段',
    options.phase ? `- ${options.phase}` : '- 待补齐',
    '',
    '## 关键依赖',
    ...(options.dependency.length ? options.dependency.map((item) => `- ${item}`) : ['- 暂无']),
    '',
    '## 活跃风险',
    ...(options.risk.length ? options.risk.map((item) => `- ${item}`) : ['- 暂无']),
    '',
    '## 下一步建议',
    ...(options.nextStep.length ? options.nextStep.map((item) => `- ${item}`) : ['- 待补齐']),
    '',
  ].join('\n');
  atomicWrite(projectContextPath, content);
  return {
    projectContextPath,
  };
}

function run(options) {
  switch (options.command) {
    case 'ensure-task':
      return ensureTask(options);
    case 'ensure-artifact':
      return ensureArtifact(options);
    case 'ensure-handoff':
      return ensureHandoff(options);
    case 'append-memory':
      return appendMemory(options);
    case 'write-session-summary':
      return writeSessionSummary(options);
    case 'write-project-context':
      return writeProjectContext(options);
    default:
      throw new Error(`Unknown command: ${options.command || '(missing)'}`);
  }
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help || !options.command) {
    process.stdout.write(`${getHelpText()}\n`);
    return;
  }

  validateOptions(options);
  const result = run(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
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
  ARTIFACT_COLUMN_KEYS,
  ARTIFACT_DEFAULT_STATUS,
  ARTIFACT_FILE_NAMES,
  appendMemory,
  ensureArtifact,
  ensureHandoff,
  ensureTask,
  getDateFromTaskDir,
  getHelpText,
  getSlugFromTaskDir,
  atomicWrite,
  nextAvailableFilePath,
  parseArgs,
  parseIndexFile,
  removeFileIfExists,
  renderIndex,
  run,
  sanitizeRole,
  sanitizeSlug,
  upsertIndexRow,
  validateContent,
  validateCwd,
  validateDate,
  validateTitle,
  writeSessionSummary,
  writeProjectContext,
  yamlEscape,
};
