#!/usr/bin/env node
/**
 * Grok-compatible session-start hook
 *
 * 会话启动时注入上下文，使用 path-resolver 自动适配 Claude/Grok 路径。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getHomeDir, getProjectRoot, isGrok } = require('./path-resolver');

// 读取 stdin 输入
const raw = fs.readFileSync(0, 'utf8');

function main() {
  try {
    const input = raw.trim() ? JSON.parse(raw) : {};
    const homeDir = getHomeDir();
    const projectRoot = getProjectRoot();

    // 构建上下文信息
    const context = {
      platform: isGrok() ? 'grok' : 'claude',
      homeDir,
      projectRoot,
      timestamp: new Date().toISOString(),
      sessionId: input.session_id || input.sessionId || 'unknown',
    };

    // 读取项目上下文（如果存在）
    const projectContextPath = path.join(projectRoot, 'docs/memory/project-context.md');
    if (fs.existsSync(projectContextPath)) {
      context.projectContext = fs.readFileSync(projectContextPath, 'utf-8');
    }

    // 读取最近的会话摘要（如果存在）
    const sessionDir = path.join(homeDir, 'session-data');
    if (fs.existsSync(sessionDir)) {
      const sessions = fs.readdirSync(sessionDir)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse()
        .slice(0, 5);

      if (sessions.length > 0) {
        context.recentSessions = sessions.map(f => {
          const content = fs.readFileSync(path.join(sessionDir, f), 'utf-8');
          const titleMatch = content.match(/^#\s+(.+)$/m);
          return {
            file: f,
            title: titleMatch ? titleMatch[1] : f,
          };
        });
      }
    }

    // 输出 Grok 兼容的格式
    const output = {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: formatContext(context),
      },
    };

    console.log(JSON.stringify(output));
  } catch (error) {
    // 静默失败，不阻塞会话
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: '',
      },
    }));
  }
}

function formatContext(context) {
  let output = '# Session Context\n\n';
  output += `**Platform:** ${context.platform}\n`;
  output += `**Project:** ${context.projectRoot}\n`;
  output += `**Session:** ${context.sessionId}\n`;
  output += `**Time:** ${context.timestamp}\n\n`;

  if (context.projectContext) {
    output += '## Project Context\n\n';
    output += context.projectContext.substring(0, 500) + '\n\n';
  }

  if (context.recentSessions && context.recentSessions.length > 0) {
    output += '## Recent Sessions\n\n';
    for (const session of context.recentSessions) {
      output += `- ${session.title}\n`;
    }
    output += '\n';
  }

  return output;
}

main();
