#!/usr/bin/env node

/**
 * Grok Hook Wrapper
 *
 * 包装 TSP hooks 以在 Grok 中运行：
 * - 处理环境变量差异
 * - 转换事件格式
 * - 提供统一的错误处理
 *
 * Usage:
 *   node scripts/grok/grok-hook-wrapper.js <hook-script> [input-json]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const TSP_HOME = path.resolve(__dirname, '../..');
const GROK_HOME = process.env.GROK_HOME || path.join(os.homedir(), '.grok');
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

// 环境变量映射
const ENV_MAP = {
  CLAUDE_HOME: GROK_HOME,
  CLAUDE_PROJECT_ROOT: PROJECT_ROOT,
  TSP_HOME: TSP_HOME,
  GROK_HOME: GROK_HOME,
  PROJECT_ROOT: PROJECT_ROOT,
};

// 工具名映射（Claude → Grok）
const TOOL_NAME_MAP = {
  Bash: 'bash',
  Read: 'read',
  Write: 'write',
  Edit: 'edit',
  Grep: 'grep',
  Glob: 'glob',
  Agent: 'agent',
};

// 转换输入格式
function translateInput(claudeInput) {
  const grokInput = { ...claudeInput };

  // 转换工具名
  if (grokInput.tool_name) {
    grokInput.toolName = TOOL_NAME_MAP[grokInput.tool_name] || grokInput.tool_name.toLowerCase();
    delete grokInput.tool_name;
  }

  // 转换工具输入
  if (grokInput.tool_input) {
    grokInput.toolInput = grokInput.tool_input;
    delete grokInput.tool_input;
  }

  // 转换工具输出
  if (grokInput.tool_output) {
    grokInput.toolOutput = grokInput.tool_output;
    delete grokInput.tool_output;
  }

  return grokInput;
}

// 执行 hook
function executeHook(hookScript, input) {
  const hookPath = path.resolve(TSP_HOME, hookScript);

  if (!fs.existsSync(hookPath)) {
    console.error(`Hook not found: ${hookPath}`);
    process.exit(1);
  }

  // 转换输入
  const grokInput = translateInput(input);

  // 准备环境变量
  const env = { ...process.env, ...ENV_MAP };

  try {
    const result = execSync(`node "${hookPath}"`, {
      input: JSON.stringify(grokInput),
      env,
      encoding: 'utf-8',
      timeout: 5000,
    });

    // 输出结果
    console.log(result.trim());

    // 尝试解析决策
    try {
      const decision = JSON.parse(result);
      if (decision.decision === 'block') {
        process.exit(1);
      }
    } catch (e) {
      // 不是 JSON 格式，继续
    }

    process.exit(0);
  } catch (error) {
    if (error.status !== undefined) {
      process.exit(error.status);
    }
    console.error(`Hook execution failed: ${error.message}`);
    process.exit(1);
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage:');
    console.log('  grok-hook-wrapper.js <hook-script> [input-json]');
    console.log('');
    console.log('Examples:');
    console.log('  grok-hook-wrapper.js hooks/pre-bash-block-no-verify.js \'{"tool_name":"Bash","tool_input":{"command":"git commit"}}\'');
    process.exit(1);
  }

  const hookScript = args[0];
  const input = args[1] ? JSON.parse(args[1]) : {};

  executeHook(hookScript, input);
}

module.exports = { translateInput, executeHook };
