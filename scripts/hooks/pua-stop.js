#!/usr/bin/env node
'use strict';

const { appendJournal, readConfig, readState } = require('../lib/pua-state');

function run(rawInput) {
  try {
    const config = readConfig();
    const state = readState();
    if (!config.always_on && !state.failure_count) {
      return rawInput;
    }

    appendJournal(
      [
        `## Stop ${new Date().toISOString()}`,
        `- always_on: ${Boolean(config.always_on)}`,
        `- flavor: ${config.flavor || 'alibaba'}`,
        `- level: ${state.level || 'L0'}`,
        `- failure_count: ${state.failure_count || 0}`,
        `- route: ${state.route || config.flavor || 'alibaba'}`,
        `- last_reason: ${(state.last_reason || '').replace(/\n+/g, ' ').slice(0, 280)}`,
      ].join('\n')
    );
  } catch (err) {
    process.stderr.write(`[PUA Hook] stop journal skipped: ${err.message}\n`);
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
