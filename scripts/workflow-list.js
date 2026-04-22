#!/usr/bin/env node
'use strict';

const path = require('path');

const { discoverWorkflows } = require('./lib/workflow/discovery');

function parseArgs(argv) {
  const options = {
    cwd: process.cwd(),
    bundledRoot: null,
    help: false,
    json: false,
    name: null,
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
    if (arg === '--name' && argv[index + 1]) {
      options.name = argv[index + 1];
      index += 1;
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
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getHelpText() {
  return [
    'Usage: node scripts/workflow-list.js [options]',
    '',
    'Options:',
    '  --name <workflow>      Filter to one workflow by name.',
    '  --cwd <path>           Resolve project workflows relative to this directory.',
    '  --bundled-root <path>  Override the bundled workflow root.',
    '  --json                 Emit structured JSON output.',
    '  -h, --help             Show this help message.',
  ].join('\n');
}

function toJsonEntry(entry) {
  return {
    name: entry.workflow.name,
    description: entry.workflow.description,
    source: entry.source,
    filePath: entry.filePath,
    nodeCount: entry.workflow.nodes.length,
    requiredVars: entry.workflow.requiredVariables || [],
  };
}

function filterWorkflows(workflows, options) {
  if (!options.name) {
    return workflows;
  }

  return workflows.filter(entry => entry.workflow.name === options.name);
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${getHelpText()}\n`);
    return;
  }
  const result = discoverWorkflows({
    cwd: options.cwd,
    bundledRoot: options.bundledRoot,
  });
  const workflows = filterWorkflows(result.workflows, options);

  if (options.json) {
    process.stdout.write(`${JSON.stringify({
      workflows: workflows.map(toJsonEntry),
      errors: result.errors,
    }, null, 2)}\n`);
    return;
  }

  if (workflows.length === 0) {
    process.stdout.write('No workflows found.\n');
  } else {
    process.stdout.write('Workflows:\n');
    for (const entry of workflows) {
      process.stdout.write(`- ${entry.workflow.name} [${entry.source}] (${entry.workflow.nodes.length} nodes)\n`);
      process.stdout.write(`  ${entry.workflow.description}\n`);
      process.stdout.write(`  Required vars: ${(entry.workflow.requiredVariables || []).join(', ') || 'none'}\n`);
    }
  }

  if (result.errors.length > 0) {
    process.stdout.write('\nErrors:\n');
    for (const error of result.errors) {
      process.stdout.write(`- ${error.filePath}: ${error.error}\n`);
    }
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
  getHelpText,
  filterWorkflows,
  main,
  parseArgs,
};
