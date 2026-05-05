#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { WorkflowValidationError, validateTaskDir } = require('./validate-workflow-state');

const TASK_DIR_PATTERN = /^\d{4}-\d{2}-\d{2}-.+/;
const QUICK_HINT = '/quick';
const FALLBACK_ROUTE_ORDER = [
  '/team-intake',
  '/team-plan',
  '/handoff',
  '/team-execute',
  '/team-review',
  '/team-release',
  '/team-closeout',
];
const REQUIRED_PROJECT_CONTEXT_SECTIONS = [
  '当前活跃任务',
  '当前阶段',
  '关键依赖',
  '活跃风险',
  '下一步建议',
];
const PROJECT_CONTEXT_PLACEHOLDERS = new Set([
  '待补齐',
  '暂无',
  'n/a',
  'na',
  'none',
  'tbd',
]);

function parseArgs(argv) {
  const options = {
    cwd: process.cwd(),
    help: false,
    json: false,
    taskDir: null,
    preferQuick: false,
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
    if (arg === '--prefer-quick') {
      options.preferQuick = true;
      continue;
    }
    if (arg === '--cwd' && argv[index + 1]) {
      options.cwd = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--task-dir' && argv[index + 1]) {
      options.taskDir = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getHelpText() {
  return [
    'Usage: node scripts/workflow-help.js [options]',
    '',
    'Options:',
    '  --task-dir <path>     Inspect a specific task artifact directory.',
    '  --cwd <path>          Resolve docs/, artifacts/, and memory/ relative to this directory.',
    '  --prefer-quick        Prefer /quick when no active task has started yet.',
    '  --json                Emit structured JSON output.',
    '  -h, --help            Show this help message.',
    '',
    'The router inspects task artifacts, latest handoff state, project-context, and readiness gates',
    'to recommend the next /team-* command plus prerequisite gaps and brownfield suggestions.',
  ].join('\n');
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function listTaskDirs(artifactsRoot) {
  if (!exists(artifactsRoot)) {
    return [];
  }

  return fs
    .readdirSync(artifactsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && TASK_DIR_PATTERN.test(entry.name))
    .map((entry) => path.join(artifactsRoot, entry.name))
    .sort();
}

function getPaths(cwd) {
  return {
    artifactsRoot: path.join(cwd, 'docs', 'artifacts'),
    projectContext: path.join(cwd, 'docs', 'memory', 'project-context.md'),
    helpCatalog: path.join(__dirname, 'lib', 'workflow-help-catalog.json'),
  };
}

function detectBrownfieldRepo(cwd) {
  const markers = ['package.json', 'commands', 'agents', 'skills', 'roles'];
  return markers.some((marker) => exists(path.join(cwd, marker)));
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSectionBody(text, heading) {
  const pattern = new RegExp(
    `^##\\s+${escapeRegex(heading)}\\s*$\\n+([\\s\\S]*?)(?=\\n##\\s+|$)`,
    'm',
  );
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

function isPlaceholderLine(line) {
  const normalized = line
    .replace(/^[-*•]\s*/, '')
    .replace(/`/g, '')
    .trim()
    .toLowerCase();
  return normalized.length === 0 || PROJECT_CONTEXT_PLACEHOLDERS.has(normalized);
}

function hasMeaningfulSectionBody(body) {
  if (!body) {
    return false;
  }
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    return false;
  }
  return lines.some((line) => !isPlaceholderLine(line));
}

function parseProjectContext(projectContextPath) {
  if (!exists(projectContextPath)) {
    return {
      exists: false,
      detectedPhase: null,
      missingSections: [...REQUIRED_PROJECT_CONTEXT_SECTIONS],
    };
  }

  const text = readText(projectContextPath);
  const sections = {};
  for (const heading of REQUIRED_PROJECT_CONTEXT_SECTIONS) {
    sections[heading] = extractSectionBody(text, heading);
  }
  const missingSections = REQUIRED_PROJECT_CONTEXT_SECTIONS.filter(
    (heading) => !hasMeaningfulSectionBody(sections[heading]),
  );

  const stageBody = sections['当前阶段'];
  const stageLine = stageBody
    ? stageBody
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !isPlaceholderLine(line))
    : null;
  const detectedPhase = stageLine ? stageLine.replace(/^[-*•]\s*/, '') : null;

  return {
    exists: true,
    detectedPhase,
    missingSections,
  };
}

function loadHelpCatalog(paths) {
  if (!exists(paths.helpCatalog)) {
    return null;
  }

  try {
    const payload = JSON.parse(readText(paths.helpCatalog));
    if (
      !payload
      || payload.schemaVersion !== 'team.workflow-help-catalog.v1'
      || !Array.isArray(payload.routeOrder)
      || !payload.commands
      || typeof payload.commands !== 'object'
    ) {
      return null;
    }
    return payload;
  } catch (_error) {
    return null;
  }
}

function inferTaskDir(options) {
  if (options.taskDir) {
    return {
      taskDir: options.taskDir,
      inferred: false,
    };
  }

  const { artifactsRoot } = getPaths(options.cwd);
  const taskDirs = listTaskDirs(artifactsRoot);
  if (!taskDirs.length) {
    return {
      taskDir: null,
      inferred: false,
    };
  }

  return {
    taskDir: taskDirs[taskDirs.length - 1],
    inferred: true,
  };
}

function hasArtifacts(taskDir, names) {
  return names.every((name) => exists(path.join(taskDir, name)));
}

function hasHandoff(taskDir) {
  const handoffDir = path.join(taskDir, 'handoffs');
  return exists(handoffDir) && fs.readdirSync(handoffDir).some((name) => name.endsWith('.md'));
}

function classifyReadinessFailure(message) {
  if (!message) {
    return null;
  }

  const lowered = message.toLowerCase();
  const patterns = [
    [/\bdeployment-context\b|\brelease-plan\b/, '/team-release'],
    [/\btest-plan\b|\blaunch-acceptance\b/, '/team-review'],
    [/\bexecute-log\b/, '/team-execute'],
    [/\bhandoff\b|\breadiness[_-]status\b|\baccepted_by\b|\bcurrent_phase\b/, '/handoff'],
    [/\bstory slice\b|\bbrownfield\b|\bdesign review\b|\brequirement challenge\b|\bdelivery-plan\b|\barch-design\b/, '/team-plan'],
  ];

  for (const [pattern, command] of patterns) {
    if (pattern.test(lowered)) {
      return command;
    }
  }

  return null;
}

function readinessCommand(phase, taskDir) {
  return `npm run workflow:readiness -- --phase ${phase} --task-dir ${taskDir}`;
}

function routeReason(catalog, command, fallbackReason) {
  if (!catalog) {
    return fallbackReason;
  }

  const entry = catalog.commands && catalog.commands[command];
  if (!entry || !entry.summary) {
    return fallbackReason;
  }

  if (entry.summary === fallbackReason) {
    return entry.summary;
  }

  return `${entry.summary}（${fallbackReason}）`;
}

function routeOrder(catalog) {
  if (catalog && Array.isArray(catalog.routeOrder) && catalog.routeOrder.length > 0) {
    return [...catalog.routeOrder];
  }
  return [...FALLBACK_ROUTE_ORDER];
}

function buildNextCommandCandidates(catalog, recommendedCommand, includeQuick = false) {
  const order = routeOrder(catalog);
  const candidates = [];

  if (recommendedCommand) {
    candidates.push(recommendedCommand);
    const index = order.indexOf(recommendedCommand);
    if (index >= 0 && index + 1 < order.length) {
      candidates.push(order[index + 1]);
    }
  }

  for (const command of order) {
    if (candidates.length >= 3) {
      break;
    }
    candidates.push(command);
  }

  if (includeQuick) {
    candidates.push(QUICK_HINT);
  }

  return [...new Set(candidates)];
}

function createResult(base) {
  return {
    recommendedCommand: null,
    reason: null,
    missingPrerequisites: [],
    brownfieldSuggestions: [],
    readinessCheck: null,
    taskDir: base.taskDir,
    inferredTaskDir: base.inferred,
    detectedPhase: base.detectedPhase,
    routerSource: base.routerSource,
    decisionEvidence: {
      artifacts: {},
      projectContext: {
        path: base.projectContextPath,
        exists: base.projectContextExists,
        missingSections: base.projectContextMissingSections,
      },
      readiness: null,
      brownfieldRepo: base.brownfieldRepo,
    },
    nextCommandCandidates: [],
  };
}

function addProjectContextRemediation(result, taskDir) {
  const missingSections = result.decisionEvidence.projectContext.missingSections || [];
  if (!missingSections.length) {
    return;
  }

  result.missingPrerequisites.push(`docs/memory/project-context.md 缺少必填段落: ${missingSections.join('、')}`);
  const slugHint = taskDir ? path.basename(taskDir) : '{YYYY-MM-DD}-{slug}';
  result.missingPrerequisites.push(
    `先执行 npm run artifact:persist -- write-project-context --project-name {project_name} --current-task ${slugHint} --phase {phase} --dependency "{dependency_item}" --risk "{risk_item}" --next-step "{next_step_item}"`,
  );
}

function finalizeResult(result, catalog, options = {}) {
  result.routerSource = catalog ? 'catalog' : 'fallback';
  result.nextCommandCandidates = buildNextCommandCandidates(
    catalog,
    result.recommendedCommand,
    Boolean(options.includeQuick),
  );
  return result;
}

function analyzeTask(options) {
  const inferred = inferTaskDir(options);
  const paths = getPaths(options.cwd);
  const catalog = loadHelpCatalog(paths);
  const projectContext = parseProjectContext(paths.projectContext);
  const detectedPhase = projectContext.detectedPhase;
  const brownfieldRepo = detectBrownfieldRepo(options.cwd);
  const result = createResult({
    taskDir: inferred.taskDir,
    inferred: inferred.inferred,
    detectedPhase,
    routerSource: catalog ? 'catalog' : 'fallback',
    projectContextPath: paths.projectContext,
    projectContextExists: projectContext.exists,
    projectContextMissingSections: projectContext.missingSections,
    brownfieldRepo,
  });

  if (options.preferQuick && !inferred.taskDir) {
    result.recommendedCommand = QUICK_HINT;
    result.reason = '当前未检测到活跃任务目录，且显式偏好快速模式。';
    if (brownfieldRepo) {
      result.brownfieldSuggestions.push('若这是既有仓库中的小改动，先确认是否真的低风险，再直接走 /quick。');
    }
    return finalizeResult(result, catalog, { includeQuick: true });
  }

  if (!inferred.taskDir) {
    result.recommendedCommand = '/team-intake';
    result.reason = routeReason(catalog, '/team-intake', '未检测到任务 artifact 目录，主链应从 intake 开始。');
    result.missingPrerequisites.push('缺少 docs/artifacts/{YYYY-MM-DD}-{slug}/ 任务目录');
    if (brownfieldRepo) {
      result.brownfieldSuggestions.push('既有项目建议先执行 /update-codemaps；需要轻量结构证据时用 Graphify，需要跨模块影响面或 MCP 证据时用 GitNexus，再进入 /team-plan 补齐 Brownfield Context Snapshot。');
    }
    if (!projectContext.exists || projectContext.missingSections.length > 0) {
      addProjectContextRemediation(result, null);
    }
    return finalizeResult(result, catalog);
  }

  const taskDir = inferred.taskDir;
  const prdPath = path.join(taskDir, 'prd.md');
  const deliveryPlanPath = path.join(taskDir, 'delivery-plan.md');
  const executeLogPath = path.join(taskDir, 'execute-log.md');
  const testPlanPath = path.join(taskDir, 'test-plan.md');
  const launchAcceptancePath = path.join(taskDir, 'launch-acceptance.md');
  const deploymentContextPath = path.join(taskDir, 'deployment-context.md');
  const releasePlanPath = path.join(taskDir, 'release-plan.md');
  const closeoutSummaryPath = path.join(taskDir, 'closeout-summary.md');
  const hasHandoffEvidence = hasHandoff(taskDir);

  result.decisionEvidence.artifacts = {
    prd: exists(prdPath),
    deliveryPlan: exists(deliveryPlanPath),
    handoff: hasHandoffEvidence,
    executeLog: exists(executeLogPath),
    testPlan: exists(testPlanPath),
    launchAcceptance: exists(launchAcceptancePath),
    deploymentContext: exists(deploymentContextPath),
    releasePlan: exists(releasePlanPath),
    closeoutSummary: exists(closeoutSummaryPath),
  };

  if (!exists(prdPath)) {
    result.recommendedCommand = '/team-intake';
    result.reason = routeReason(catalog, '/team-intake', '任务目录已存在，但缺少 PRD，仍应回到 intake 固化目标与范围。');
    result.missingPrerequisites.push('缺少 prd.md');
    addProjectContextRemediation(result, taskDir);
    return finalizeResult(result, catalog);
  }

  if (!exists(deliveryPlanPath)) {
    result.recommendedCommand = '/team-plan';
    result.reason = routeReason(catalog, '/team-plan', '已有 PRD，但尚未形成 Delivery Plan。');
    result.missingPrerequisites.push('缺少 delivery-plan.md');
    if (brownfieldRepo) {
      result.brownfieldSuggestions.push('如果是 brownfield 任务，在 delivery-plan.md 中补齐 Brownfield Context Snapshot；必要时引用 Graphify 或 GitNexus 图谱证据。');
    }
    addProjectContextRemediation(result, taskDir);
    return finalizeResult(result, catalog);
  }

  if (projectContext.missingSections.length > 0) {
    result.recommendedCommand = '/team-plan';
    result.reason = routeReason(
      catalog,
      '/team-plan',
      'project-context 是主链硬依赖，需先补齐必填段落后再推进下一阶段。',
    );
    addProjectContextRemediation(result, taskDir);
    return finalizeResult(result, catalog);
  }

  const deliveryPlanText = readText(deliveryPlanPath).toLowerCase();
  if (brownfieldRepo && !deliveryPlanText.includes('brownfield context snapshot')) {
    result.brownfieldSuggestions.push('建议在 delivery-plan.md 中补齐 Brownfield Context Snapshot；必要时引用 Graphify 或 GitNexus 图谱证据。');
  }

  if (!hasHandoffEvidence && !exists(executeLogPath)) {
    result.recommendedCommand = '/handoff';
    result.reason = routeReason(catalog, '/handoff', '已有计划，但还没有 handoff 证据，不能进入 execute。');
    result.missingPrerequisites.push('缺少 handoffs/*.md');
    result.missingPrerequisites.push('缺少 readiness proof 与 downstream challenge record');
    return finalizeResult(result, catalog);
  }

  if (!exists(executeLogPath)) {
    try {
      validateTaskDir(taskDir, 'execute');
      result.recommendedCommand = '/team-execute';
      result.reason = routeReason(catalog, '/team-execute', 'execute 前置证据已满足，可以进入实现。');
      result.readinessCheck = readinessCommand('execute', taskDir);
      result.decisionEvidence.readiness = {
        phase: 'execute',
        status: 'passed',
        command: result.readinessCheck,
      };
      return finalizeResult(result, catalog);
    } catch (error) {
      const message = error instanceof WorkflowValidationError ? error.message : String(error);
      result.recommendedCommand = classifyReadinessFailure(message) || '/team-plan';
      result.reason = routeReason(catalog, result.recommendedCommand, 'execute readiness 尚未通过，需要先补齐前置证据。');
      result.missingPrerequisites.push(message);
      result.readinessCheck = readinessCommand('execute', taskDir);
      result.decisionEvidence.readiness = {
        phase: 'execute',
        status: 'failed',
        command: result.readinessCheck,
        message,
      };
      return finalizeResult(result, catalog);
    }
  }

  if (!hasArtifacts(taskDir, ['test-plan.md', 'launch-acceptance.md'])) {
    result.recommendedCommand = '/team-review';
    result.reason = routeReason(catalog, '/team-review', '实现已完成，但 QA 放行证据尚未闭环。');
    if (!exists(testPlanPath)) {
      result.missingPrerequisites.push('缺少 test-plan.md');
    }
    if (!exists(launchAcceptancePath)) {
      result.missingPrerequisites.push('缺少 launch-acceptance.md');
    }
    return finalizeResult(result, catalog);
  }

  if (!hasArtifacts(taskDir, ['deployment-context.md', 'release-plan.md'])) {
    try {
      validateTaskDir(taskDir, 'release');
      result.recommendedCommand = '/team-release';
      result.reason = routeReason(catalog, '/team-release', 'review 证据已齐备，可以进入发布准备。');
      result.readinessCheck = readinessCommand('release', taskDir);
      result.decisionEvidence.readiness = {
        phase: 'release',
        status: 'passed',
        command: result.readinessCheck,
      };
      if (!exists(deploymentContextPath)) {
        result.missingPrerequisites.push('缺少 deployment-context.md');
      }
      if (!exists(releasePlanPath)) {
        result.missingPrerequisites.push('缺少 release-plan.md');
      }
      return finalizeResult(result, catalog);
    } catch (error) {
      const message = error instanceof WorkflowValidationError ? error.message : String(error);
      result.recommendedCommand = classifyReadinessFailure(message) || '/handoff';
      result.reason = routeReason(catalog, result.recommendedCommand, 'release readiness 尚未通过，需要先补齐 handoff 或 review 证据。');
      result.missingPrerequisites.push(message);
      result.readinessCheck = readinessCommand('release', taskDir);
      result.decisionEvidence.readiness = {
        phase: 'release',
        status: 'failed',
        command: result.readinessCheck,
        message,
      };
      return finalizeResult(result, catalog);
    }
  }

  if (!exists(closeoutSummaryPath)) {
    try {
      validateTaskDir(taskDir, 'closeout');
      result.recommendedCommand = '/team-closeout';
      result.reason = routeReason(catalog, '/team-closeout', '发布证据已齐备，可以进入观察窗口收口。');
      result.readinessCheck = readinessCommand('closeout', taskDir);
      result.decisionEvidence.readiness = {
        phase: 'closeout',
        status: 'passed',
        command: result.readinessCheck,
      };
      return finalizeResult(result, catalog);
    } catch (error) {
      const message = error instanceof WorkflowValidationError ? error.message : String(error);
      result.recommendedCommand = classifyReadinessFailure(message) || '/team-release';
      result.reason = routeReason(catalog, result.recommendedCommand, 'closeout readiness 尚未通过，需要先补齐 release 证据。');
      result.missingPrerequisites.push(message);
      result.readinessCheck = readinessCommand('closeout', taskDir);
      result.decisionEvidence.readiness = {
        phase: 'closeout',
        status: 'failed',
        command: result.readinessCheck,
        message,
      };
      return finalizeResult(result, catalog);
    }
  }

  result.recommendedCommand = '/team-intake';
  result.reason = routeReason(catalog, '/team-intake', '当前任务已形成 closeout-summary，可为下一项任务重新进入 intake。');
  return finalizeResult(result, catalog);
}

function formatHumanResult(result) {
  const lines = [];
  lines.push(`Recommended command: ${result.recommendedCommand}`);
  lines.push(`Reason: ${result.reason}`);
  if (result.taskDir) {
    lines.push(`Task dir: ${result.taskDir}${result.inferredTaskDir ? ' (inferred)' : ''}`);
  }
  if (result.detectedPhase) {
    lines.push(`Detected phase: ${result.detectedPhase}`);
  }
  lines.push(`Router source: ${result.routerSource}`);
  if (result.missingPrerequisites.length) {
    lines.push('Missing prerequisites:');
    for (const item of result.missingPrerequisites) {
      lines.push(`- ${item}`);
    }
  }
  if (result.brownfieldSuggestions.length) {
    lines.push('Brownfield suggestions:');
    for (const item of result.brownfieldSuggestions) {
      lines.push(`- ${item}`);
    }
  }
  if (result.readinessCheck) {
    lines.push(`Suggested readiness check: ${result.readinessCheck}`);
  }
  if (result.nextCommandCandidates.length) {
    lines.push(`Next command candidates: ${result.nextCommandCandidates.join(', ')}`);
  }
  return `${lines.join('\n')}\n`;
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${getHelpText()}\n`);
    return;
  }

  const result = analyzeTask(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  process.stdout.write(formatHumanResult(result));
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
  analyzeTask,
  classifyReadinessFailure,
  formatHumanResult,
  getHelpText,
  inferTaskDir,
  main,
  parseArgs,
};
