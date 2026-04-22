#!/usr/bin/env node
'use strict';

const { appendJournal, readConfig, readState } = require('../lib/pua-state');

function run(rawInput) {
  try {
    const config = readConfig();
    const state = readState();
    appendJournal(
      [
        `## Compaction ${new Date().toISOString()}`,
        `- always_on: ${Boolean(config.always_on)}`,
        `- flavor: ${config.flavor || 'alibaba'}`,
        `- failure_count: ${state.failure_count || 0}`,
        `- level: ${state.level || 'L0'}`,
        `- last_tool: ${state.last_tool || ''}`,
      ].join('\n')
    );
  } catch (err) {
    process.stderr.write(`[PUA Hook] pre-compact snapshot skipped: ${err.message}\n`);
  }
  return rawInput;
}

if (require.main === module) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { raw += chunk; });
  process.stdin.on('end', () => {
    process.stdout.write(run(raw));
  });
}

module.exports = { run };
