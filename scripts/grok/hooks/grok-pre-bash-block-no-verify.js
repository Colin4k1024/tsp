#!/usr/bin/env node
/**
 * Grok-compatible pre-bash-block-no-verify hook
 *
 * 阻止 git commit --no-verify 命令，保护 pre-commit hooks。
 * 使用 path-resolver 自动适配 Claude/Grok 路径。
 */

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
      // Grok 官方规范: camelCase (toolInput)，兼容 snake_case (tool_input)
      command = String(
        input.toolInput?.command ||
        input.tool_input?.command ||
        ''
      );
    } catch {
      console.log(raw);
      process.exit(0);
      return;
    }

    const normalized = command.replace(/\s+/g, ' ').trim();
    const isGitCommit = /\bgit\s+commit\b/.test(normalized);
    const hasNoVerify = /\s--no-verify(?:\s|$)/.test(normalized);

    if (isGitCommit && hasNoVerify) {
      // Grok 官方规范: exit 2 + stdout 输出 {"decision":"deny","reason":"..."}
      process.stderr.write(
        '[pre:bash:block-no-verify] BLOCKED: `git commit --no-verify` is not allowed. Git hooks must not be bypassed.\n'
      );
      console.log(JSON.stringify({
        decision: 'deny',
        reason: '`git commit --no-verify` is not allowed. Git hooks must not be bypassed.',
      }));
      process.exit(2);
      return;
    }

    // 通过 - exit 0 允许执行
    process.exit(0);
  });
}

if (require.main === module) {
  main();
}
