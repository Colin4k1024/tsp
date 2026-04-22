#!/usr/bin/env node
'use strict';

const { readState, writeState } = require('../lib/pua-state');

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput || '{}');
    const toolName = String(input.tool_name || '');
    if (!toolName) return rawInput;

    const state = readState();
    if (state.failure_count > 0) {
      const nextState = {
        ...state,
        failure_count: 0,
        level: 'L0',
        last_tool: toolName,
        last_success_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      };
      writeState(nextState);
      process.stderr.write('[PUA] successful tool execution detected — failure counter reset\n');
    }
  } catch (err) {
    process.stderr.write(`[PUA Hook] success reset skipped: ${err.message}\n`);
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
