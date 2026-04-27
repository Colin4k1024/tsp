#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { analyzeTask } = require('./workflow-help');

const TASK_DIR_PATTERN = /^\d{4}-\d{2}-\d{2}-.+/;
const DEFAULT_REGISTRY = path.join(os.homedir(), '.claude', 'homunculus', 'projects.json');
const DEFAULT_MAX_DEPTH = 2;
const IGNORED_SCAN_DIRS = new Set([
  '.git',
  '.hg',
  '.svn',
  '.cache',
  '.next',
  '.turbo',
  'dist',
  'build',
  'coverage',
  'node_modules',
  'target',
  'vendor',
]);

const ARTIFACTS = Object.freeze([
  ['prd', 'prd.md'],
  ['deliveryPlan', 'delivery-plan.md'],
  ['archDesign', 'arch-design.md'],
  ['executeLog', 'execute-log.md'],
  ['testPlan', 'test-plan.md'],
  ['launchAcceptance', 'launch-acceptance.md'],
  ['deploymentContext', 'deployment-context.md'],
  ['releasePlan', 'release-plan.md'],
  ['closeout', 'closeout-summary.md'],
]);

const MISSING_LABELS = Object.freeze({
  prd: 'prd.md',
  deliveryPlan: 'delivery-plan.md',
  archDesign: 'arch-design.md',
  handoff: 'handoffs/*.md',
  executeLog: 'execute-log.md',
  testPlan: 'test-plan.md',
  launchAcceptance: 'launch-acceptance.md',
  deploymentContext: 'deployment-context.md',
  releasePlan: 'release-plan.md',
  closeout: 'closeout-summary.md',
});

function parseArgs(argv) {
  const options = {
    help: false,
    json: false,
    registry: DEFAULT_REGISTRY,
    projects: [],
    scanRoots: [],
    maxDepth: DEFAULT_MAX_DEPTH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--registry' && argv[index + 1]) {
      options.registry = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--project' && argv[index + 1]) {
      options.projects.push(path.resolve(argv[index + 1]));
      index += 1;
      continue;
    }
    if (arg === '--scan-root' && argv[index + 1]) {
      options.scanRoots.push(path.resolve(argv[index + 1]));
      index += 1;
      continue;
    }
    if (arg === '--max-depth' && argv[index + 1]) {
      const maxDepth = Number(argv[index + 1]);
      if (!Number.isInteger(maxDepth) || maxDepth < 0) {
        throw new Error('--max-depth must be a non-negative integer');
      }
      options.maxDepth = maxDepth;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getHelpText() {
  return [
    'Usage: node scripts/project-progress.js [options]',
    '',
    'Options:',
    '  --registry <path>      Project registry JSON. Defaults to ~/.claude/homunculus/projects.json.',
    '  --project <path>       Add one project root. Repeatable.',
    '  --scan-root <path>     Scan a directory for Team Skills project roots. Repeatable.',
    '  --max-depth <n>        Max scan depth for --scan-root. Defaults to 2.',
    '  --json                 Emit structured JSON output.',
    '  -h, --help             Show this help message.',
    '',
    'The report is read-only and derives progress from docs/artifacts and docs/memory/project-context.md.',
  ].join('\n');
}

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function safeReadJson(filePath) {
  if (!exists(filePath)) {
    return null;
  }
  return JSON.parse(readText(filePath));
}

function loadRegistry(registryPath) {
  const payload = safeReadJson(registryPath);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return [];
  }

  return Object.entries(payload)
    .filter(([, value]) => value && typeof value === 'object')
    .map(([id, value]) => ({
      id,
      name: value.name || id,
      root: value.root || '',
      remote: value.remote || null,
      lastSeen: value.last_seen || value.lastSeen || null,
      source: 'registry',
    }));
}

function projectLooksTracked(projectRoot) {
  return exists(path.join(projectRoot, 'docs', 'artifacts'))
    || exists(path.join(projectRoot, 'docs', 'memory', 'project-context.md'));
}

function scanProjects(scanRoot, maxDepth) {
  if (!exists(scanRoot) || !fs.statSync(scanRoot).isDirectory()) {
    return [];
  }

  const found = [];

  function visit(currentPath, depth) {
    if (projectLooksTracked(currentPath)) {
      found.push({
        id: null,
        name: path.basename(currentPath),
        root: currentPath,
        remote: null,
        lastSeen: null,
        source: 'scan',
      });
      return;
    }

    if (depth >= maxDepth) {
      return;
    }

    let entries = [];
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (_error) {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || IGNORED_SCAN_DIRS.has(entry.name)) {
        continue;
      }
      visit(path.join(currentPath, entry.name), depth + 1);
    }
  }

  visit(path.resolve(scanRoot), 0);
  return found;
}

function normalizeProjectEntry(entry) {
  const root = entry.root ? path.resolve(entry.root) : '';
  return {
    id: entry.id || (root ? path.basename(root) : 'unknown'),
    name: entry.name || (root ? path.basename(root) : entry.id || 'unknown'),
    root,
    remote: entry.remote || null,
    lastSeen: entry.lastSeen || null,
    source: entry.source || 'explicit',
  };
}

function collectProjectEntries(options) {
  const entries = [];
  const errors = [];

  try {
    entries.push(...loadRegistry(options.registry));
  } catch (error) {
    errors.push({
      source: options.registry,
      message: `Failed to read registry: ${error.message}`,
    });
  }

  for (const projectPath of options.projects) {
    entries.push({
      id: null,
      name: path.basename(projectPath),
      root: projectPath,
      remote: null,
      lastSeen: null,
      source: 'explicit',
    });
  }

  for (const scanRoot of options.scanRoots) {
    entries.push(...scanProjects(scanRoot, options.maxDepth));
  }

  const deduped = [];
  const seen = new Set();
  for (const rawEntry of entries) {
    const entry = normalizeProjectEntry(rawEntry);
    const key = entry.root || `id:${entry.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(entry);
  }

  return {
    projects: deduped,
    errors,
  };
}

function listTaskDirs(projectRoot) {
  const artifactsRoot = path.join(projectRoot, 'docs', 'artifacts');
  if (!exists(artifactsRoot)) {
    return [];
  }

  return fs
    .readdirSync(artifactsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && TASK_DIR_PATTERN.test(entry.name))
    .map((entry) => path.join(artifactsRoot, entry.name))
    .sort();
}

function hasHandoff(taskDir) {
  const handoffDir = path.join(taskDir, 'handoffs');
  if (!exists(handoffDir)) {
    return false;
  }
  return fs.readdirSync(handoffDir).some((name) => name.endsWith('.md'));
}

function inspectArtifacts(taskDir) {
  const result = {};
  for (const [key, fileName] of ARTIFACTS) {
    result[key] = exists(path.join(taskDir, fileName));
  }
  result.handoff = hasHandoff(taskDir);
  return result;
}

function inferTaskProgress(artifacts) {
  if (artifacts.closeout) {
    return { phase: 'closed', progress: 100 };
  }
  if (artifacts.deploymentContext && artifacts.releasePlan) {
    return { phase: 'release', progress: 85 };
  }
  if (artifacts.testPlan && artifacts.launchAcceptance) {
    return { phase: 'review', progress: 70 };
  }
  if (artifacts.executeLog) {
    return { phase: 'execute', progress: 55 };
  }
  if (artifacts.handoff) {
    return { phase: 'handoff-ready', progress: 40 };
  }
  if (artifacts.deliveryPlan) {
    return { phase: 'plan', progress: 30 };
  }
  if (artifacts.prd) {
    return { phase: 'intake', progress: 15 };
  }
  return { phase: 'untracked', progress: 0 };
}

function missingArtifacts(artifacts) {
  return Object.keys(MISSING_LABELS)
    .filter((key) => !artifacts[key])
    .map((key) => MISSING_LABELS[key]);
}

function parseTaskDirName(taskDir) {
  const name = path.basename(taskDir);
  const match = name.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  return {
    id: name,
    date: match ? match[1] : null,
    slug: match ? match[2] : name,
  };
}

function extractSectionBody(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`^##\\s+${escaped}\\s*$\\n+([\\s\\S]*?)(?=\\n##\\s+|$)`, 'm'));
  return match ? match[1].trim() : '';
}

function parseListSection(body) {
  if (!body) {
    return [];
  }
  return body
    .split('\n')
    .map((line) => line.trim().replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
    .filter((line) => !['待补齐', '暂无', 'n/a', 'na', 'none', 'tbd'].includes(line.toLowerCase()));
}

function parseProjectContext(projectRoot) {
  const projectContextPath = path.join(projectRoot, 'docs', 'memory', 'project-context.md');
  if (!exists(projectContextPath)) {
    return {
      phase: null,
      currentTask: null,
      risks: [],
      nextSteps: [],
    };
  }

  const text = readText(projectContextPath);
  const phase = parseListSection(extractSectionBody(text, '当前阶段'))[0] || null;
  const currentTask = parseListSection(extractSectionBody(text, '当前活跃任务'))[0] || null;
  return {
    phase,
    currentTask,
    risks: parseListSection(extractSectionBody(text, '活跃风险')),
    nextSteps: parseListSection(extractSectionBody(text, '下一步建议')),
  };
}

function analyzeNextCommand(projectRoot, taskDir) {
  try {
    return analyzeTask({
      cwd: projectRoot,
      taskDir,
      json: true,
      help: false,
      preferQuick: false,
    }).recommendedCommand;
  } catch (_error) {
    return null;
  }
}

function inspectTask(projectRoot, taskDir) {
  const task = parseTaskDirName(taskDir);
  const artifacts = inspectArtifacts(taskDir);
  const inferred = inferTaskProgress(artifacts);
  return {
    ...task,
    path: taskDir,
    phase: inferred.phase,
    progress: inferred.progress,
    artifacts,
    missing: missingArtifacts(artifacts),
    recommendedCommand: analyzeNextCommand(projectRoot, taskDir),
  };
}

function summarizeTasks(tasks) {
  const totalTasks = tasks.length;
  const closedTasks = tasks.filter((task) => task.progress === 100).length;
  const activeTasks = totalTasks - closedTasks;
  const averageProgress = totalTasks
    ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks)
    : 0;

  return {
    totalTasks,
    activeTasks,
    closedTasks,
    averageProgress,
  };
}

function inspectProject(project) {
  if (!project.root || !exists(project.root)) {
    return {
      ...project,
      status: 'missing',
      summary: summarizeTasks([]),
      currentContext: { phase: null, currentTask: null, risks: [], nextSteps: [] },
      tasks: [],
    };
  }

  if (!fs.statSync(project.root).isDirectory()) {
    return {
      ...project,
      status: 'missing',
      summary: summarizeTasks([]),
      currentContext: { phase: null, currentTask: null, risks: [], nextSteps: [] },
      tasks: [],
    };
  }

  try {
    const taskDirs = listTaskDirs(project.root);
    const tasks = taskDirs.map((taskDir) => inspectTask(project.root, taskDir));
    const summary = summarizeTasks(tasks);
    const status = tasks.length === 0
      ? 'untracked'
      : (summary.closedTasks === summary.totalTasks ? 'closed' : 'active');

    return {
      ...project,
      status,
      summary,
      currentContext: parseProjectContext(project.root),
      tasks,
    };
  } catch (error) {
    return {
      ...project,
      status: 'error',
      summary: summarizeTasks([]),
      currentContext: { phase: null, currentTask: null, risks: [], nextSteps: [] },
      tasks: [],
      error: error.message,
    };
  }
}

function buildReport(options) {
  const collected = collectProjectEntries(options);
  const projects = collected.projects.map(inspectProject);
  const errors = [...collected.errors];
  for (const project of projects) {
    if (project.status === 'error') {
      errors.push({
        project: project.name,
        root: project.root,
        message: project.error,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    projects,
    errors,
  };
}

function padRight(value, width) {
  const text = String(value === null || value === undefined ? '' : value);
  if (text.length >= width) {
    return text;
  }
  return text + ' '.repeat(width - text.length);
}

function renderTable(rows, columns) {
  const widths = columns.map((column) => Math.max(
    column.label.length,
    ...rows.map((row) => String(row[column.key] || '').length),
  ));
  const header = columns.map((column, index) => padRight(column.label, widths[index])).join('  ');
  const divider = widths.map((width) => '-'.repeat(width)).join('  ');
  const body = rows.map((row) => columns
    .map((column, index) => padRight(row[column.key] || '', widths[index]))
    .join('  '));
  return [header, divider, ...body].join('\n');
}

function formatHumanReport(report) {
  const lines = [];
  lines.push(`Project progress snapshot (${report.generatedAt})`);
  lines.push('');

  if (!report.projects.length) {
    lines.push('No projects found.');
  } else {
    const projectRows = report.projects.map((project) => ({
      project: project.name,
      status: project.status,
      tasks: String(project.summary.totalTasks),
      active: String(project.summary.activeTasks),
      closed: String(project.summary.closedTasks),
      avg: `${project.summary.averageProgress}%`,
      current: project.currentContext.currentTask || '-',
      phase: project.currentContext.phase || '-',
      root: project.root || '-',
    }));
    lines.push(renderTable(projectRows, [
      { key: 'project', label: 'Project' },
      { key: 'status', label: 'Status' },
      { key: 'tasks', label: 'Tasks' },
      { key: 'active', label: 'Active' },
      { key: 'closed', label: 'Closed' },
      { key: 'avg', label: 'Avg' },
      { key: 'current', label: 'Current Task' },
      { key: 'phase', label: 'Context Phase' },
      { key: 'root', label: 'Root' },
    ]));
  }

  for (const project of report.projects) {
    lines.push('');
    lines.push(`## ${project.name}`);
    if (project.error) {
      lines.push(`Error: ${project.error}`);
    }
    if (!project.tasks.length) {
      lines.push(project.status === 'missing' ? 'Project root is missing.' : 'No task artifacts found.');
      continue;
    }

    const taskRows = project.tasks.map((task) => ({
      task: task.id,
      phase: task.phase,
      progress: `${task.progress}%`,
      next: task.recommendedCommand || '-',
      missing: task.missing.slice(0, 4).join(', ') + (task.missing.length > 4 ? ', ...' : ''),
    }));
    lines.push(renderTable(taskRows, [
      { key: 'task', label: 'Task' },
      { key: 'phase', label: 'Phase' },
      { key: 'progress', label: 'Progress' },
      { key: 'next', label: 'Next' },
      { key: 'missing', label: 'Missing' },
    ]));
  }

  if (report.errors.length) {
    lines.push('');
    lines.push('Errors:');
    for (const error of report.errors) {
      lines.push(`- ${error.source || error.root || error.project || 'unknown'}: ${error.message}`);
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

  const report = buildReport(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }
  process.stdout.write(formatHumanReport(report));
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
  ARTIFACTS,
  buildReport,
  collectProjectEntries,
  formatHumanReport,
  inferTaskProgress,
  inspectArtifacts,
  inspectProject,
  loadRegistry,
  main,
  parseArgs,
  parseProjectContext,
  scanProjects,
  summarizeTasks,
};
