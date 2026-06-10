#!/usr/bin/env node
/**
 * Compatibility entry for older strategic-compact hook paths.
 *
 * The canonical implementation lives in scripts/hooks/suggest-compact.js so
 * hooks.json, installers, tests, and audits share one behavior.
 */

'use strict';

const { buildHookOutput } = require('../../scripts/hooks/suggest-compact');

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 8000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const output = buildHookOutput(input);
    if (output) process.stdout.write(JSON.stringify(output));
  } catch (_) {
    process.exit(0);
  }
});
