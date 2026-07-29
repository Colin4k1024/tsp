#!/usr/bin/env node
/**
 * Grok-compatible post-bash-command-log hook
 *
 * 将 bash 命令记录到日志文件，支持 audit 和 cost 两种模式。
 * 使用 path-resolver 自动适配 Claude/Grok 路径。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getHomeDir } = require('./path-resolver');

const MAX_STDIN = 1024 * 1024;
let raw = '';

const MODE_CONFIG = {
  audit: {
    fileName: 'bash-commands.log',
    format: command => `[${new Date().toISOString()}] ${command}`,
  },
  cost: {
    fileName: 'cost-tracker.log',
    format: command => `[${new Date().toISOString()}] tool=Bash command=${command}`,
  },
};

function sanitizeCommand(command) {
  return String(command || '')
    .replace(/\n/g, ' ')
    .replace(/--token[= ][^ ]*/g, '--token=<REDACTED>')
    .replace(/Authorization:[: ]*[^ ]*[: ]*[^ ]*/gi, 'Authorization:<REDACTED>')
    .replace(/\bAKIA[A-Z0-9]{16}\b/g, '<REDACTED>')
    .replace(/\bASIA[A-Z0-9]{16}\b/g, '<REDACTED>')
    .replace(/password[= ][^ ]*/gi, 'password=<REDACTED>')
    .replace(/\bghp_[A-Za-z0-9_]+\b/g, '<REDACTED>')
    .replace(/\bgho_[A-Za-z0-9_]+\b/g, '<REDACTED>')
    .replace(/\bghs_[A-Za-z0-9_]+\b/g, '<REDACTED>')
    .replace(/\bgithub_pat_[A-Za-z0-9_]+\b/g, '<REDACTED>');
}

function appendLine(filePath, line) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${line}\n`, 'utf8');
}

function main() {
  const config = MODE_CONFIG[process.argv[2]];

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    if (raw.length < MAX_STDIN) {
      const remaining = MAX_STDIN - raw.length;
      raw += chunk.substring(0, remaining);
    }
  });

  process.stdin.on('end', () => {
    try {
      if (config) {
        const input = raw.trim() ? JSON.parse(raw) : {};
        // 支持 Grok 和 Claude 两种输入格式
        const command = sanitizeCommand(
          input.tool_input?.command ||
          input.toolInput?.command ||
          '?'
        );
        const homeDir = getHomeDir();
        appendLine(path.join(homeDir, config.fileName), config.format(command));
      }
    } catch {
      // Logging must never block the calling hook.
    }

    // 输出原始输入（Grok 需要 JSON 输出到 stdout）
    console.log(raw);
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  sanitizeCommand,
};
