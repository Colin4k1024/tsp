#!/usr/bin/env node
'use strict';

const { flavorLabel, levelFromFailures, readConfig, readState, writeState } = require('../lib/pua-state');

function severityMessage(level, flavor) {
  const label = flavorLabel(flavor);
  if (level === 'L1') return `${label} 第 2 次失败，别原地打转，换本质不同的方案。`;
  if (level === 'L2') return `${label} 第 3 次失败，停止猜测：搜索、读上下文、列 3 个假设。`;
  if (level === 'L3') return `${label} 第 4 次失败，进入 7 项检查清单，别空口说完成。`;
  if (level === 'L4') return `${label} 第 5 次以上失败，强制切换方法论，不允许继续同一路径打转。`;
  return `${label} 记录到一次失败。`;
}

function run(rawInput) {
  try {
    const input = JSON.parse(rawInput || '{}');
    const toolName = String(input.tool_name || '');
    const reason = String(input.tool_output?.output || input.error?.message || '').slice(0, 280);
    const config = readConfig();
    const state = readState();
    const nextCount = Number(state.failure_count || 0) + 1;
    const nextLevel = levelFromFailures(nextCount);
    const nextState = {
      ...state,
      failure_count: nextCount,
      level: nextLevel,
      last_tool: toolName,
      last_reason: reason,
      last_updated: new Date().toISOString(),
      route: config.flavor || state.route || 'alibaba',
    };
    writeState(nextState);
    process.stderr.write(`[PUA] ${severityMessage(nextLevel, config.flavor || 'alibaba')}\n`);
  } catch (err) {
    process.stderr.write(`[PUA Hook] failure escalation skipped: ${err.message}\n`);
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
