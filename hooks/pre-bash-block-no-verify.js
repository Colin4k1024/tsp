#!/usr/bin/env node
'use strict';

const MAX_STDIN = 1024 * 1024;

function readStdin(callback) {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    if (raw.length < MAX_STDIN) {
      const remaining = MAX_STDIN - raw.length;
      raw += chunk.slice(0, remaining);
    }
  });
  process.stdin.on('end', () => callback(raw));
  process.stdin.on('error', () => callback(raw));
}

function main() {
  readStdin(raw => {
    let command = '';
    try {
      const input = raw.trim() ? JSON.parse(raw) : {};
      command = String(input.tool_input?.command || '');
    } catch {
      process.stdout.write(raw);
      process.exit(0);
      return;
    }

    const normalized = command.replace(/\s+/g, ' ').trim();
    const isGitCommit = /\bgit\s+commit\b/.test(normalized);
    const hasNoVerify = /\s--no-verify(?:\s|$)/.test(normalized);

    if (isGitCommit && hasNoVerify) {
      process.stderr.write(
        '[pre:bash:block-no-verify] BLOCKED: `git commit --no-verify` is not allowed. Git hooks must not be bypassed.\n',
      );
      process.stdout.write(raw);
      process.exit(2);
      return;
    }

    process.stdout.write(raw);
    process.exit(0);
  });
}

if (require.main === module) {
  main();
}
