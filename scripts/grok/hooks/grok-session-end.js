#!/usr/bin/env node
/**
 * Grok-compatible session-end hook
 *
 * 会话结束时保存会话状态，使用 path-resolver 自动适配 Claude/Grok 路径。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getHomeDir, getProjectRoot, isGrok } = require('../path-resolver');

// 读取 stdin 输入
const raw = fs.readFileSync(0, 'utf8');

function main() {
  try {
    const input = raw.trim() ? JSON.parse(raw) : {};
    const homeDir = getHomeDir();
    const projectRoot = getProjectRoot();

    // 构建会话摘要
    const summary = {
      platform: isGrok() ? 'grok' : 'claude',
      projectRoot,
      sessionId: input.sessionId || input.session_id || 'unknown',
      timestamp: new Date().toISOString(),
      transcriptPath: input.transcript_path || null,
    };

    // 保存会话摘要
    const sessionDir = path.join(homeDir, 'session-data');
    fs.mkdirSync(sessionDir, { recursive: true });

    const sessionFile = path.join(sessionDir, `${summary.sessionId}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(summary, null, 2));

    // SessionEnd 为被动事件，stdout 被忽略；exit 0 表示成功
  } catch (error) {
    // 静默失败，不阻塞会话
  }
}

main();
