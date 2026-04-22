#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawn } = require('child_process');

const { computeWorkflowFingerprint, executeWorkflow, WorkflowExecutorError } = require('./lib/workflow/executor');
const { resolveWorkflowReference, resolveWorkflowReferenceFromRun } = require('./lib/workflow/registry');
const { getMissingRequiredVars } = require('./lib/workflow/template');

const EXIT_CODE_BY_ERROR_CODE = {
  unresolvable_graph: 2,
  missing_handler: 3,
  workflow_persistence_failed: 4,
  missing_state_store: 5,
  unsupported_state_store: 6,
};

function mapErrorToExitCode(error) {
  if (error instanceof WorkflowExecutorError && error.code && Object.prototype.hasOwnProperty.call(EXIT_CODE_BY_ERROR_CODE, error.code)) {
    return EXIT_CODE_BY_ERROR_CODE[error.code];
  }
  return 1;
}

function parseArgs(argv) {
  const options = {
    cwd: process.cwd(),
    bundledRoot: null,
    help: false,
    name: null,
    filePath: null,
    stateDb: null,
    sessionId: null,
    runId: null,
    resumeRunId: null,
    handlersPath: null,
    vars: {},
    json: false,
    continueOnError: false,
    preview: false,
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
    if (arg === '--preview') {
      options.preview = true;
      continue;
    }
    if (arg === '--continue-on-error') {
      options.continueOnError = true;
      continue;
    }
    if (arg === '--cwd' && argv[index + 1]) {
      options.cwd = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--bundled-root' && argv[index + 1]) {
      options.bundledRoot = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--name' && argv[index + 1]) {
      options.name = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--file' && argv[index + 1]) {
      options.filePath = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--state-db' && argv[index + 1]) {
      options.stateDb = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--session-id' && argv[index + 1]) {
      options.sessionId = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--run-id' && argv[index + 1]) {
      options.runId = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--resume-run-id' && argv[index + 1]) {
      options.resumeRunId = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--handlers' && argv[index + 1]) {
      options.handlersPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--var' && argv[index + 1]) {
      const raw = argv[index + 1];
      const separatorIndex = raw.indexOf('=');
      if (separatorIndex <= 0) {
        throw new Error(`Invalid --var value: ${raw}`);
      }
      const key = raw.slice(0, separatorIndex).trim();
      const value = raw.slice(separatorIndex + 1);
      if (!key) {
        throw new Error(`Invalid --var key: ${raw}`);
      }
      options.vars[key] = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.resumeRunId && (options.name || options.filePath)) {
    throw new Error('Cannot combine --resume-run-id with --name or --file');
  }

  return options;
}

function getHelpText() {
  return [
    'Usage: node scripts/workflow-run.js [options]',
    '',
    'Workflow reference:',
    '  --name <workflow>      Run a discovered workflow by name.',
    '  --file <path>          Run a workflow file directly.',
    '  --resume-run-id <id>   Resume a failed workflow run from state-store.',
    '',
    'Execution options:',
    '  --cwd <path>           Resolve workflow-relative paths from this directory.',
    '  --bundled-root <path>  Override the bundled workflow root.',
    '  --state-db <path>      Use an explicit workflow state database path.',
    '  --session-id <id>      Attach the run to a session id.',
    '  --run-id <id>          Use a deterministic workflow run id.',
    '  --handlers <path>      Load custom workflow handlers from a module.',
    '  --var key=value        Provide templating input for workflow nodes. Repeatable.',
    '  --preview              Resolve variables and render nodes without executing.',
    '  --continue-on-error    Continue into later batches after failures when possible.',
    '  --json                 Emit structured JSON output.',
    '  -h, --help             Show this help message.',
    '',
    'Variable discovery:',
    '  Run "npm run workflow:list" to inspect each workflow\'s required vars before execution.',
  ].join('\n');
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = sortObjectKeys(value[key]);
    return result;
  }, {});
}

function normalizeInputContext(vars) {
  return sortObjectKeys(vars || {});
}

function resolveInputContext(options, previousRun) {
  const explicitVars = normalizeInputContext(options.vars);
  if (!previousRun) {
    return explicitVars;
  }

  const previousInputContext = normalizeInputContext(previousRun.inputContext || {});
  if (Object.keys(explicitVars).length === 0) {
    return previousInputContext;
  }

  return explicitVars;
}

function validateResumeRun(previousRun, workflow, inputContext) {
  if (!previousRun) {
    return;
  }

  if (previousRun.status !== 'failed') {
    throw new Error(`Workflow run ${previousRun.id} is not resumable because it is ${previousRun.status}`);
  }

  if (previousRun.workflowName !== workflow.name) {
    throw new Error(
      `Workflow run ${previousRun.id} cannot be resumed because it targets ${previousRun.workflowName}, not ${workflow.name}`
    );
  }

  const currentFingerprint = computeWorkflowFingerprint(workflow);
  const previousFingerprint = previousRun.workflowFingerprint || null;
  if (previousFingerprint && previousFingerprint !== currentFingerprint) {
    throw new Error(
      `Workflow run ${previousRun.id} cannot be resumed because the workflow definition changed`
    );
  }

  const previousInputContext = normalizeInputContext(previousRun.inputContext || {});
  const currentInputContext = normalizeInputContext(inputContext || {});
  if (JSON.stringify(previousInputContext) !== JSON.stringify(currentInputContext)) {
    throw new Error(`Workflow run ${previousRun.id} cannot be resumed because the input context changed`);
  }
}

function renderTemplateString(value, vars) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) {
      throw new Error(`Missing workflow variable: ${key}`);
    }
    return String(vars[key]);
  });
}

function renderNode(node, vars) {
  const rendered = {
    ...node,
    depends_on: Array.isArray(node.depends_on) ? [...node.depends_on] : [],
  };

  if (typeof rendered.prompt === 'string') {
    rendered.prompt = renderTemplateString(rendered.prompt, vars);
  }
  if (typeof rendered.command === 'string') {
    rendered.command = renderTemplateString(rendered.command, vars);
  }
  if (typeof rendered.bash === 'string') {
    rendered.bash = renderTemplateString(rendered.bash, vars);
  }
  if (rendered.loop && typeof rendered.loop === 'object') {
    rendered.loop = {
      ...rendered.loop,
      prompt: renderTemplateString(rendered.loop.prompt, vars),
      until: renderTemplateString(rendered.loop.until, vars),
    };
  }

  return rendered;
}

function renderWorkflow(workflow, vars) {
  const nodes = workflow.nodes.map(node => renderNode(node, vars));
  const nodesById = new Map(nodes.map(node => [node.id, node]));

  return {
    ...workflow,
    nodes,
    nodesById,
  };
}

function createMissingVarsError(workflow, inputContext) {
  const missingVars = getMissingRequiredVars(workflow, inputContext);
  if (missingVars.length === 0) {
    return null;
  }

  const noun = missingVars.length === 1 ? 'variable' : 'variables';
  const pronoun = missingVars.length === 1 ? 'it' : 'them';
  return new Error(
    `Workflow "${workflow.name}" is missing required ${noun}: ${missingVars.join(', ')}. ` +
    `Provide ${pronoun} with --var key=value. ` +
    `Required vars for this workflow: ${(workflow.requiredVariables || []).join(', ') || 'none'}. ` +
    `Tip: run "npm run workflow:list" to inspect workflow requirements.`
  );
}

function executeShellCommand(command, cwd, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;

    const timeoutHandle = Number.isInteger(timeoutMs) && timeoutMs > 0
      ? setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, timeoutMs)
      : null;

    function clearTimer() {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }

    function resolveOnce(value) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimer();
      resolve(value);
    }

    function rejectOnce(error) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimer();
      reject(error);
    }

    child.stdout.on('data', chunk => {
      stdout += String(chunk);
    });
    child.stderr.on('data', chunk => {
      stderr += String(chunk);
    });
    child.on('error', rejectOnce);
    child.on('close', code => {
      if (timedOut) {
        rejectOnce(new Error(`Command timed out after ${timeoutMs}ms: ${command}`));
        return;
      }
      if (code === 0) {
        resolveOnce({ command, exitCode: code, stdout, stderr });
        return;
      }
      rejectOnce(new Error(`Command failed with exit code ${code}: ${command}${stderr ? `\n${stderr.trim()}` : ''}`));
    });
  });
}

function createDefaultHandlers(cwd) {
  return {
    prompt: async input => ({ stubbed: true, type: 'prompt', prompt: input.node.prompt }),
    command: async input => ({ stubbed: true, type: 'command', command: input.node.command }),
    loop: async input => ({
      stubbed: true,
      type: 'loop',
      prompt: input.node.loop.prompt,
      until: input.node.loop.until,
    }),
    bash: async input => executeShellCommand(input.node.bash, cwd, input.node.timeout_ms),
  };
}

function loadHandlerOverrides(handlersPath, cwd) {
  if (!handlersPath) {
    return {};
  }

  const modulePath = path.resolve(cwd, handlersPath);
  let loaded;
  try {
    loaded = require(modulePath);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(`Workflow handlers module not found: ${modulePath}`);
    }
    throw new Error(`Failed to load workflow handlers from ${modulePath}: ${err.message}`);
  }
  if (!loaded || typeof loaded !== 'object') {
    throw new Error(`Invalid workflow handlers module: ${modulePath}`);
  }
  return loaded;
}

function buildPayload(execution, workflowRef) {
  return {
    runId: execution.runId,
    workflowName: execution.workflowName,
    source: workflowRef.source,
    filePath: workflowRef.filePath,
    inputContext: execution.inputContext,
    status: execution.runState.status,
    batches: execution.batches,
    nodeStatuses: Object.fromEntries(
      Object.entries(execution.runState.nodes).map(([nodeId, nodeState]) => [nodeId, nodeState.status])
    ),
    eventCount: execution.events.length,
  };
}

function buildPreviewPayload(workflowRef, renderedWorkflow, inputContext) {
  return {
    workflowName: renderedWorkflow.name,
    source: workflowRef.source,
    filePath: workflowRef.filePath,
    inputContext,
    requiredVars: renderedWorkflow.requiredVariables || [],
    nodeCount: renderedWorkflow.nodes.length,
    nodes: renderedWorkflow.nodes.map((node) => ({
      id: node.id,
      mode: node.prompt !== undefined
        ? 'prompt'
        : node.command !== undefined
          ? 'command'
          : node.bash !== undefined
            ? 'bash'
            : node.loop !== undefined
              ? 'loop'
              : 'unknown',
      dependsOn: node.depends_on,
      prompt: node.prompt,
      command: node.command,
      bash: node.bash,
      timeoutMs: node.timeout_ms || null,
      loop: node.loop,
    })),
  };
}

function formatPreviewText(payload) {
  const lines = [
    `Workflow preview: ${payload.workflowName} [${payload.source}]`,
    `File: ${payload.filePath || 'n/a'}`,
    `Required vars: ${payload.requiredVars.join(', ') || 'none'}`,
    `Input context: ${Object.keys(payload.inputContext).length === 0
      ? 'none'
      : Object.entries(payload.inputContext)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(', ')}`,
    'Nodes:',
  ];

  for (const node of payload.nodes) {
    lines.push(`- ${node.id} [${node.mode}] dependsOn=${node.dependsOn.join(', ') || 'none'}`);
  }

  return lines.join('\n');
}

async function openStateStore(options = {}) {
  const { createStateStore } = require('./lib/state-store');
  return createStateStore(options);
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${getHelpText()}\n`);
    return;
  }
  const shouldOpenStateStore = !options.preview || Boolean(options.resumeRunId);
  const stateStore = shouldOpenStateStore
    ? await openStateStore({ dbPath: options.stateDb || undefined })
    : null;

  try {
    const previousRun = options.resumeRunId
      ? stateStore.getWorkflowRunById(options.resumeRunId)
      : null;
    if (options.resumeRunId && !previousRun) {
      throw new Error(`Workflow run not found: ${options.resumeRunId}`);
    }

    const workflowRef = previousRun
      ? resolveWorkflowReferenceFromRun(previousRun, options)
      : resolveWorkflowReference(options);
    const inputContext = resolveInputContext(options, previousRun);
    validateResumeRun(previousRun, workflowRef.workflow, inputContext);
    const missingVarsError = createMissingVarsError(workflowRef.workflow, inputContext);
    if (missingVarsError) {
      throw missingVarsError;
    }
    const renderedWorkflow = renderWorkflow(workflowRef.workflow, inputContext);
    if (options.preview) {
      const payload = buildPreviewPayload(workflowRef, renderedWorkflow, inputContext);
      if (options.json) {
        process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
      } else {
        process.stdout.write(`${formatPreviewText(payload)}\n`);
      }
      return;
    }
    const handlers = {
      ...createDefaultHandlers(options.cwd),
      ...loadHandlerOverrides(options.handlersPath, options.cwd),
    };
    const execution = await executeWorkflow(renderedWorkflow, {
      continueOnError: options.continueOnError,
      stateStore,
      sessionId: options.sessionId,
      runId: options.runId || undefined,
      resumeFromRunState: previousRun ? previousRun.runState : null,
      resumedFromRunId: previousRun ? previousRun.id : null,
      inputContext,
      source: workflowRef.source,
      filePath: workflowRef.filePath,
      handlers,
    });
    const payload = buildPayload(execution, workflowRef);

    if (options.json) {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } else {
      process.stdout.write(`Workflow ${payload.workflowName} completed with status ${payload.status}.\n`);
      process.stdout.write(`Run ID: ${payload.runId}\n`);
    }

    if (payload.status === 'failed') {
      process.exitCode = 1;
    }
  } finally {
    if (stateStore) {
      stateStore.close();
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = mapErrorToExitCode(error);
  });
}

module.exports = {
  buildPayload,
  buildPreviewPayload,
  createDefaultHandlers,
  executeShellCommand,
  formatPreviewText,
  getHelpText,
  loadHandlerOverrides,
  main,
  normalizeInputContext,
  openStateStore,
  parseArgs,
  createMissingVarsError,
  renderTemplateString,
  resolveInputContext,
  validateResumeRun,
};
