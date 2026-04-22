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
    'Usage: node scripts/validate-workflows.js [options]',
    '',
    'Options:',
    '  --cwd <path>           Resolve project workflows relative to this directory.',
    '  --bundled-root <path>  Override the bundled workflow root.',
    '  --json                 Emit structured JSON output.',
    '  -h, --help             Show this help message.',
  ].join('\n');
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
  const payload = {
    valid: result.errors.length === 0,
    workflowCount: result.workflows.length,
    errors: result.errors,
  };

  if (options.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else if (payload.valid) {
    process.stdout.write(`Workflow validation passed (${payload.workflowCount} workflow(s)).\n`);
  } else {
    process.stdout.write(`Workflow validation failed (${payload.errors.length} error(s)).\n`);
    for (const error of payload.errors) {
      process.stdout.write(`- ${error.filePath}: ${error.error}\n`);
    }
  }

  if (!payload.valid) {
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
  getHelpText,
  main,
  parseArgs,
};
