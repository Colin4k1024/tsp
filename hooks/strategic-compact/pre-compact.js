#!/usr/bin/env node
/**
 * Compatibility entry for older strategic-compact PreCompact hook paths.
 *
 * The canonical implementation lives in scripts/hooks/pre-compact.js so
 * native auto/manual compaction, compact counts, and stale-metric cleanup use
 * one code path.
 */

'use strict';

const { main } = require('../../scripts/hooks/pre-compact');

let input = '';
const stdinTimeout = setTimeout(() => main(input), 5000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  main(input).catch(() => process.exit(0));
});
