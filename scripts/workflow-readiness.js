#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const PHASE_TO_WORKFLOW = Object.freeze({
  execute: 'team-execute-readiness',
  exec: 'team-execute-readiness',
  review: 'team-review-readiness',
  rev: 'team-review-readiness',
  release: 'team-release-readiness',
  rel: 'team-release-readiness',
  closeout: 'team-closeout-readiness',
  close: 'team-closeout-readiness',
});

const CANONICAL_PHASES = Object.freeze({
  execute: 'execute',
  exec: 'execute',
  review: 'review',
  rev: 'review',
  release: 'release',
  rel: 'release',
  closeout: 'closeout',
  close: 'closeout',
});

function parseArgs(argv) {
  const options = {
    help: false,
    phase: null,
    taskDirs: [],
    stateDb: null,
    sessionId: null,
    runId: null,
    preview: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--preview') {
      options.preview = true;
      continue;
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--phase' && argv[index + 1]) {
      options.phase = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--task-dir' && argv[index + 1]) {
      options.taskDirs.push(path.resolve(argv[index + 1]));
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
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getHelpText() {
  return [
    'Usage: node scripts/workflow-readiness.js --phase <execute|review|release|closeout> --task-dir <path> [options]',
    '',
    'Options:',
    '  --phase <phase>       Target readiness phase: execute|exec, review|rev, release|rel, closeout|close.',
    '  --task-dir <path>     Artifact task directory to validate. Repeatable for batch checks.',
    '  --state-db <path>     Use an explicit workflow state database path.',
    '  --session-id <id>     Attach the run to a session id.',
    '  --run-id <id>         Use a deterministic workflow run id.',
    '  --preview             Resolve and preview the readiness workflow without executing.',
    '  --json                Emit structured JSON output.',
    '  -h, --help            Show this help message.',
    '',
    'This is a convenience wrapper around workflow:run for built-in readiness checks.',
    'When multiple --task-dir values are provided, checks run sequentially and return an aggregated summary.',
  ].join('\n');
}

function normalizePhase(phase) {
  if (!phase) {
    throw new Error('--phase is required');
  }

  const normalizedPhase = CANONICAL_PHASES[phase];
  if (!normalizedPhase) {
    throw new Error(`Unsupported phase: ${phase}. Expected one of: ${Object.keys(PHASE_TO_WORKFLOW).join(', ')}`);
  }

  return normalizedPhase;
}

function resolveWorkflowName(phase) {
  const workflowName = PHASE_TO_WORKFLOW[phase];
  if (!workflowName) {
    throw new Error(`Unsupported phase: ${phase}. Expected one of: ${Object.keys(PHASE_TO_WORKFLOW).join(', ')}`);
  }

  return workflowName;
}

function toWorkflowRunArgs(options) {
  return toWorkflowRunArgsForTask(options, options.taskDirs[0], 0);
}

function toWorkflowRunArgsForTask(options, taskDir, taskIndex = 0) {
  if (!taskDir) {
    throw new Error('--task-dir is required');
  }

  const normalizedPhase = normalizePhase(options.phase);

  const args = [
    '--name',
    resolveWorkflowName(options.phase),
    '--var',
    `taskDir=${taskDir}`,
    '--var',
    `targetPhase=${normalizedPhase}`,
  ];

  if (options.stateDb) {
    args.push('--state-db', options.stateDb);
  }
  if (options.sessionId) {
    args.push('--session-id', options.sessionId);
  }
  if (options.runId) {
    const runId = options.taskDirs.length > 1 ? `${options.runId}-${taskIndex + 1}` : options.runId;
    args.push('--run-id', runId);
  }
  if (options.preview) {
    args.push('--preview');
  }
  if (options.json) {
    args.push('--json');
  }

  return args;
}

function runBatch(options) {
  const results = [];

  for (let index = 0; index < options.taskDirs.length; index += 1) {
    const taskDir = options.taskDirs[index];
    const cliArgs = [path.join(__dirname, 'workflow-run.js'), ...toWorkflowRunArgsForTask(options, taskDir, index)];
    const child = spawnSync(process.execPath, cliArgs, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    const payload = options.json && child.stdout
      ? JSON.parse(child.stdout)
      : null;

    results.push({
      taskDir,
      exitCode: child.status || 0,
      stdout: child.stdout,
      stderr: child.stderr,
      payload,
    });
  }

  return results;
}

function writeBatchResults(results, jsonMode) {
  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(results.map(result => ({
      taskDir: result.taskDir,
      exitCode: result.exitCode,
      payload: result.payload,
      stderr: result.stderr,
    })), null, 2)}\n`);
    return;
  }

  process.stdout.write('Workflow readiness batch:\n');
  for (const result of results) {
    const status = result.exitCode === 0 ? 'succeeded' : 'failed';
    process.stdout.write(`- ${result.taskDir} [${status}]\n`);
  }
}

async function runWorkflowCli(argv) {
  const { main: runWorkflow } = require('./workflow-run');
  return runWorkflow(argv);
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${getHelpText()}\n`);
    return;
  }

  if (options.taskDirs.length === 0) {
    throw new Error('--task-dir is required');
  }

  if (options.taskDirs.length > 1) {
    const results = runBatch(options);
    writeBatchResults(results, options.json);
    if (results.some(result => result.exitCode !== 0)) {
      process.exitCode = 1;
    }
    return;
  }

  await runWorkflowCli(toWorkflowRunArgs(options));
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  getHelpText,
  main,
  parseArgs,
  normalizePhase,
  PHASE_TO_WORKFLOW,
  resolveWorkflowName,
  runWorkflowCli,
  toWorkflowRunArgs,
  toWorkflowRunArgsForTask,
  runBatch,
  writeBatchResults,
};
