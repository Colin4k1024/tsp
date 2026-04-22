#!/usr/bin/env node
'use strict';

function parseArgs(argv) {
  const options = {
    help: false,
    stateDb: null,
    runId: null,
    limit: 10,
    json: false,
    status: null,
    workflowName: null,
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
    if (arg === '--state-db' && argv[index + 1]) {
      options.stateDb = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--run-id' && argv[index + 1]) {
      options.runId = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--workflow-name' && argv[index + 1]) {
      options.workflowName = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--status' && argv[index + 1]) {
      options.status = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--limit' && argv[index + 1]) {
      const parsedLimit = Number.parseInt(argv[index + 1], 10);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        throw new Error(`--limit must be a positive integer, got: ${argv[index + 1]}`);
      }
      options.limit = parsedLimit;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getHelpText() {
  return [
    'Usage: node scripts/workflow-runs.js [options]',
    '',
    'Options:',
    '  --state-db <path>  Use an explicit workflow state database path.',
    '  --run-id <id>      Show one workflow run instead of listing recent runs.',
    '  --workflow-name <name>  Filter listed runs by workflow name.',
    '  --status <status>       Filter listed runs by run status.',
    '  --limit <number>   Limit recent run results when listing.',
    '  --json             Emit structured JSON output.',
    '  -h, --help         Show this help message.',
    '',
    'Use --run-id to inspect one workflow run in detail, including inputContext and resume ancestry.',
  ].join('\n');
}

function summarizeRun(workflowRun) {
  return {
    id: workflowRun.id,
    workflowName: workflowRun.workflowName,
    workflowFingerprint: workflowRun.workflowFingerprint,
    inputContext: workflowRun.inputContext,
    source: workflowRun.source,
    filePath: workflowRun.filePath,
    resumedFromRunId: workflowRun.resumedFromRunId,
    status: workflowRun.status,
    startedAt: workflowRun.startedAt,
    finishedAt: workflowRun.finishedAt,
    sessionId: workflowRun.sessionId,
    eventCount: Array.isArray(workflowRun.events) ? workflowRun.events.length : 0,
  };
}

function filterRuns(runs, options) {
  return runs.filter((run) => {
    if (options.workflowName && run.workflowName !== options.workflowName) {
      return false;
    }
    if (options.status && run.status !== options.status) {
      return false;
    }
    return true;
  });
}

function formatInputContextSummary(inputContext) {
  const entries = Object.entries(inputContext || {});
  if (entries.length === 0) {
    return 'none';
  }

  return entries
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(', ');
}

function formatRunSummary(entry) {
  const parts = [
    `${entry.id} ${entry.workflowName} [${entry.status}]`,
    `vars=${formatInputContextSummary(entry.inputContext)}`,
  ];

  if (entry.startedAt) {
    parts.push(`started=${entry.startedAt}`);
  }

  if (entry.resumedFromRunId) {
    parts.push(`resumedFrom=${entry.resumedFromRunId}`);
  }
  if (entry.source) {
    parts.push(`source=${entry.source}`);
  }

  return `- ${parts.join(' ')}`;
}

function formatRunDetail(entry) {
  return [
    `Workflow run ${entry.id}: ${entry.workflowName} [${entry.status}]`,
    `  Source: ${entry.source || 'unknown'}`,
    `  File: ${entry.filePath || 'n/a'}`,
    `  Fingerprint: ${entry.workflowFingerprint || 'n/a'}`,
    `  Input context: ${formatInputContextSummary(entry.inputContext)}`,
    `  Resumed from: ${entry.resumedFromRunId || 'none'}`,
    `  Started: ${entry.startedAt || 'n/a'}`,
    `  Finished: ${entry.finishedAt || 'n/a'}`,
    `  Session: ${entry.sessionId || 'n/a'}`,
    `  Events: ${entry.eventCount}`,
  ].join('\n');
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
  const stateStore = await openStateStore({ dbPath: options.stateDb || undefined });

  try {
    const payload = options.runId
      ? stateStore.getWorkflowRunById(options.runId)
      : filterRuns(stateStore.listRecentWorkflowRuns({ limit: options.limit }).map(summarizeRun), options);

    if (options.json) {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
      return;
    }

    if (options.runId) {
      if (!payload) {
        process.stdout.write('Workflow run not found.\n');
        process.exitCode = 1;
        return;
      }
      process.stdout.write(`${formatRunDetail(summarizeRun(payload))}\n`);
      return;
    }

    if (payload.length === 0) {
      process.stdout.write('No workflow runs found.\n');
      return;
    }

    process.stdout.write('Workflow runs:\n');
    for (const entry of payload) {
      process.stdout.write(`${formatRunSummary(entry)}\n`);
    }
  } finally {
    stateStore.close();
  }
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  getHelpText,
  formatInputContextSummary,
  formatRunDetail,
  formatRunSummary,
  filterRuns,
  main,
  openStateStore,
  parseArgs,
  summarizeRun,
};
