#!/usr/bin/env node

/**
 * Grok Event Bridge
 *
 * 将 TSP 的 Claude hooks 事件转换为 Grok 兼容格式：
 * - pre_tool_use → preToolUse
 * - post_tool_use → postToolUse
 * - stop → stop
 * - 处理环境变量差异（TSP_HOME, GROK_HOME, PROJECT_ROOT）
 *
 * Usage:
 *   node scripts/grok/grok-event-bridge.js <event> [options]
 */

const fs = require('fs');
const path = require('path');

// 事件映射：Claude → Grok (Grok 使用与 Claude Code 完全一致的事件名)
const EVENT_MAP = {
  PreToolUse: 'PreToolUse',
  PostToolUse: 'PostToolUse',
  PostToolUseFailure: 'PostToolUseFailure',
  SessionStart: 'SessionStart',
  SessionEnd: 'SessionEnd',
  Stop: 'Stop',
  StopFailure: 'StopFailure',
  UserPromptSubmit: 'UserPromptSubmit',
  PreCompact: 'PreCompact',
  PostCompact: 'PostCompact',
  PermissionDenied: 'PermissionDenied',
  Notification: 'Notification',
  SubagentStart: 'SubagentStart',
  SubagentStop: 'SubagentStop',
  // Legacy snake_case aliases (backward compat)
  pre_tool_use: 'PreToolUse',
  post_tool_use: 'PostToolUse',
  post_tool_use_failure: 'PostToolUseFailure',
  session_start: 'SessionStart',
  session_end: 'SessionEnd',
  stop: 'Stop',
  user_prompt_submit: 'UserPromptSubmit',
  pre_compact: 'PreCompact',
  post_compact: 'PostCompact',
};

// 环境变量映射
const ENV_MAP = {
  CLAUDE_HOME: 'GROK_HOME',
  CLAUDE_PROJECT_ROOT: 'GROK_WORKSPACE_ROOT',
  TSP_HOME: 'GROK_HOME',
};

// Grok 自动映射 Claude 工具名，无需手动转换
// 参见官方文档: "Claude tool names such as Bash, Read, and Edit are mapped to Grok's automatically"

class GrokEventBridge {
  constructor(options = {}) {
    this.tspHome = options.tspHome || process.env.TSP_HOME || path.resolve(__dirname, '../..');
    this.grokHome = options.grokHome || process.env.GROK_HOME || path.join(require('os').homedir(), '.grok');
    this.projectRoot = options.projectRoot || process.env.GROK_WORKSPACE_ROOT || process.env.PROJECT_ROOT || process.cwd();
    this.debug = options.debug || false;
  }

  // 转换事件名（Grok 使用与 Claude Code 一致的 PascalCase 事件名）
  mapEventName(claudeEvent) {
    return EVENT_MAP[claudeEvent] || claudeEvent;
  }

  // 检查事件名是否为 Grok 官方支持的事件
  isOfficialGrokEvent(eventName) {
    const official = [
      'SessionStart', 'SessionEnd', 'UserPromptSubmit',
      'PreToolUse', 'PostToolUse', 'PostToolUseFailure',
      'PermissionDenied', 'Stop', 'StopFailure',
      'Notification', 'SubagentStart', 'SubagentStop',
      'PreCompact', 'PostCompact',
    ];
    return official.includes(eventName);
  }

  // 工具名由 Grok 自动映射，透传原始值
  mapToolName(claudeTool) {
    return claudeTool;
  }

  // 转换环境变量
  translateEnv(env) {
    const translated = { ...env };

    for (const [claudeKey, grokKey] of Object.entries(ENV_MAP)) {
      if (translated[claudeKey]) {
        translated[grokKey] = translated[claudeKey];
        delete translated[claudeKey];
      }
    }

    // 设置 Grok 专用变量
    translated.GROK_HOME = this.grokHome;
    translated.GROK_WORKSPACE_ROOT = this.projectRoot;
    translated.TSP_HOME = this.tspHome;

    return translated;
  }

  // 转换 hook 输入
  translateInput(claudeInput) {
    const grokInput = { ...claudeInput };

    // 转换事件名
    if (grokInput.event) {
      grokInput.event = this.mapEventName(grokInput.event);
    }

    // 转换工具名字段（snake_case → camelCase，值保持原样由 Grok 自动映射）
    if (grokInput.tool_name) {
      grokInput.toolName = grokInput.tool_name;
      delete grokInput.tool_name;
    }

    // 转换工具输入（snake_case → camelCase）
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
  async executeHook(hookScript, input) {
    const { execSync } = require('child_process');

    // 转换输入
    const grokInput = this.translateInput(input);

    // 转换环境变量
    const env = this.translateEnv(process.env);

    if (this.debug) {
      console.error('[grok-event-bridge] Input:', JSON.stringify(grokInput, null, 2));
    }

    try {
      const result = execSync(`node "${hookScript}"`, {
        input: JSON.stringify(grokInput),
        env,
        encoding: 'utf-8',
        timeout: 5000,
      });

      return {
        decision: 'approve',
        output: result.trim(),
      };
    } catch (error) {
      if (this.debug) {
        console.error('[grok-event-bridge] Hook error:', error.message);
      }

      // Fail-open for observe-only hooks, fail-closed for blocking hooks
      return {
        decision: 'approve',
        output: '',
        error: error.message,
      };
    }
  }

  // 批量转换 hooks.json
  convertHooksJson(claudeHooksJson) {
    const grokHooks = {};

    for (const [event, hooks] of Object.entries(claudeHooksJson.hooks || {})) {
      const grokEvent = this.mapEventName(event);

      if (!grokHooks[grokEvent]) {
        grokHooks[grokEvent] = [];
      }

      for (const hook of hooks) {
        const translatedHook = {
          ...hook,
          event: grokEvent,
        };

        // 转换嵌套的 hooks 数组
        if (hook.hooks && Array.isArray(hook.hooks)) {
          translatedHook.hooks = hook.hooks.map((h) => {
            if (h.command) {
              return {
                ...h,
                command: h.command
                  .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, '${GROK_PLUGIN_ROOT}')
                  .replace(/\$\{CLAUDE_HOME\}/g, '${GROK_HOME}'),
              };
            }
            return h;
          });
        }

        // 转换顶层命令（如果存在）
        if (hook.command) {
          translatedHook.command = hook.command
            .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, '${GROK_PLUGIN_ROOT}')
            .replace(/\$\{CLAUDE_HOME\}/g, '${GROK_HOME}');
        }

        grokHooks[grokEvent].push(translatedHook);
      }
    }

    return { hooks: grokHooks };
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const bridge = new GrokEventBridge({ debug: args.includes('--debug') });

  switch (command) {
    case 'convert':
      // 转换 hooks.json
      const hooksFile = args[1] || path.join(bridge.tspHome, 'hooks/hooks.json');
      const output = args[2] || path.join(bridge.tspHome, '.grok-build/hooks.json');

      const claudeHooks = JSON.parse(fs.readFileSync(hooksFile, 'utf-8'));
      const grokHooks = bridge.convertHooksJson(claudeHooks);

      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, JSON.stringify(grokHooks, null, 2));
      console.log(`Converted hooks: ${hooksFile} → ${output}`);
      break;

    case 'translate-input':
      // 转换单个输入
      const input = JSON.parse(args[1] || '{}');
      const translated = bridge.translateInput(input);
      console.log(JSON.stringify(translated, null, 2));
      break;

    default:
      console.log('Usage:');
      console.log('  grok-event-bridge convert [input] [output]');
      console.log('  grok-event-bridge translate-input <json>');
      process.exit(1);
  }
}

module.exports = GrokEventBridge;
