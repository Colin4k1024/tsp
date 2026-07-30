#!/usr/bin/env node
/**
 * Grok Event Bridge 测试
 *
 * 测试事件桥接层的映射逻辑。
 *
 * 覆盖范围：
 * - 事件名映射（pre_tool_use → PreToolUse，Grok 使用与 Claude Code 一致的 PascalCase）
 * - 工具名透传（Grok 自动映射，无需手动转换）
 * - 环境变量映射（CLAUDE_HOME → GROK_HOME，CLAUDE_PROJECT_ROOT → GROK_WORKSPACE_ROOT）
 * - 输入格式转换（snake_case → camelCase）
 * - hooks.json 批量转换
 */

const path = require("path");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// 加载模块
const GrokEventBridge = require("../scripts/grok/grok-event-bridge");

// ── 测试 1: 类实例化 ─────────────────────────────────────────────────

section("实例化");

const bridge = new GrokEventBridge({ debug: false });
assert(bridge instanceof GrokEventBridge, "GrokEventBridge 实例创建成功");
assert(typeof bridge.mapEventName === "function", "mapEventName 方法存在");
assert(typeof bridge.mapToolName === "function", "mapToolName 方法存在");
assert(typeof bridge.translateEnv === "function", "translateEnv 方法存在");
assert(typeof bridge.translateInput === "function", "translateInput 方法存在");
assert(typeof bridge.convertHooksJson === "function", "convertHooksJson 方法存在");

// ── 测试 2: 事件名映射 ─────────────────────────────────────────────

section("事件名映射");

// Grok 使用与 Claude Code 一致的 PascalCase 事件名
const eventTests = [
  ["PreToolUse", "PreToolUse"],
  ["PostToolUse", "PostToolUse"],
  ["Stop", "Stop"],
  ["SessionStart", "SessionStart"],
  ["SessionEnd", "SessionEnd"],
  // Legacy snake_case 兼容
  ["pre_tool_use", "PreToolUse"],
  ["post_tool_use", "PostToolUse"],
  ["stop", "Stop"],
  ["unknown_event", "unknown_event"],
];

for (const [input, expected] of eventTests) {
  assert(bridge.mapEventName(input) === expected, `"${input}" → "${expected}"`);
}

// ── 测试 3: 工具名转换 ─────────────────────────────────────────────

section("工具名透传（Grok 自动映射）");

// Grok 自动映射 Claude 工具名，mapToolName 透传原始值
const toolTests = [
  ["Bash", "Bash"],
  ["Read", "Read"],
  ["Write", "Write"],
  ["Edit", "Edit"],
  ["Grep", "Grep"],
  ["Glob", "Glob"],
  ["Agent", "Agent"],
  ["CustomTool", "CustomTool"],
];

for (const [input, expected] of toolTests) {
  assert(bridge.mapToolName(input) === expected, `"${input}" → "${expected}"（透传）`);
}

// ── 测试 4: 环境变量映射 ─────────────────────────────────────────────

section("环境变量映射");

const envTests = [
  { input: { CLAUDE_HOME: "/home/user/.claude" }, checkKey: "GROK_HOME", shouldExist: true },
  { input: { CLAUDE_PROJECT_ROOT: "/project" }, checkKey: "GROK_WORKSPACE_ROOT", shouldExist: true },
];

for (const envTest of envTests) {
  const result = bridge.translateEnv(envTest.input);
  assert(result[envTest.checkKey] !== undefined, `环境变量 ${envTest.checkKey} 已设置`);
  assert(result.GROK_HOME !== undefined, "GROK_HOME 始终被设置");
  assert(result.GROK_WORKSPACE_ROOT !== undefined, "GROK_WORKSPACE_ROOT 始终被设置");
}

// 验证原始 key 被删除
const envWithClaude = bridge.translateEnv({ CLAUDE_HOME: "/test" });
assert(envWithClaude.CLAUDE_HOME === undefined, "CLAUDE_HOME 被删除");

// ── 测试 5: 输入格式转换 ─────────────────────────────────────────────

section("输入格式转换");

const inputTests = [
  {
    name: "基本转换",
    input: { event: "pre_tool_use", tool_name: "Bash", tool_input: { command: "ls" } },
    checks: (result) => {
      assert(result.event === "PreToolUse", "event 转换");
      assert(result.toolName === "Bash", "toolName 透传（Grok 自动映射）");
      assert(result.toolInput.command === "ls", "toolInput 保留");
      assert(result.tool_name === undefined, "tool_name 已删除");
      assert(result.tool_input === undefined, "tool_input 已删除");
    },
  },
  {
    name: "带 tool_output",
    input: { tool_name: "Read", tool_output: { content: "hello" } },
    checks: (result) => {
      assert(result.toolOutput !== undefined, "toolOutput 存在");
      assert(result.tool_output === undefined, "tool_output 已删除");
    },
  },
  {
    name: "无事件",
    input: { some_field: "value" },
    checks: (result) => {
      assert(result.some_field === "value", "未知字段保留");
    },
  },
];

for (const test of inputTests) {
  section(`  输入转换: ${test.name}`);
  const result = bridge.translateInput(test.input);
  test.checks(result);
}

// ── 测试 6: hooks.json 批量转换 ─────────────────────────────────────

section("hooks.json 批量转换");

// 使用 PascalCase 事件名（Grok 官方规范）+ 测试 snake_case 兼容
const sampleHooks = {
  hooks: {
    PreToolUse: [
      {
        matcher: "Bash",
        hooks: [{ type: "command", command: "node \"${CLAUDE_PLUGIN_ROOT}/hooks/test.js\"" }],
      },
    ],
    PostToolUse: [
      {
        matcher: "Bash",
        hooks: [{ type: "command", command: "node \"${CLAUDE_HOME}/hooks/log.js\"" }],
      },
    ],
    Stop: [
      {
        matcher: "*",
        hooks: [{ type: "command", command: "node \"${CLAUDE_PLUGIN_ROOT}/hooks/stop.js\"" }],
      },
    ],
  },
};

const converted = bridge.convertHooksJson(sampleHooks);

assert(converted.hooks !== undefined, "转换结果有 hooks 字段");
assert(converted.hooks.PreToolUse !== undefined, "pre_tool_use → PreToolUse");
assert(converted.hooks.PostToolUse !== undefined, "post_tool_use → PostToolUse");
assert(converted.hooks.Stop !== undefined, "stop → Stop");

// 验证命令中的路径替换
const preToolHook = converted.hooks.PreToolUse[0];
const cmd = preToolHook.hooks[0].command;
assert(cmd.includes("${GROK_PLUGIN_ROOT}"), "CLAUDE_PLUGIN_ROOT → GROK_PLUGIN_ROOT");
assert(!cmd.includes("${CLAUDE_PLUGIN_ROOT}"), "CLAUDE_PLUGIN_ROOT 已被替换");

const postToolHook = converted.hooks.PostToolUse[0];
const postCmd = postToolHook.hooks[0].command;
assert(postCmd.includes("${GROK_HOME}"), "CLAUDE_HOME → GROK_HOME");
assert(!postCmd.includes("${CLAUDE_HOME}"), "CLAUDE_HOME 已被替换");

// ── 测试 7: 空 hooks 输入 ─────────────────────────────────────────────

section("边界条件");

const emptyConverted = bridge.convertHooksJson({});
assert(Object.keys(emptyConverted.hooks).length === 0, "空输入返回空 hooks");

const noHooksConverted = bridge.convertHooksJson({ hooks: null });
assert(Object.keys(noHooksConverted.hooks).length === 0, "null hooks 返回空对象");

// ── 结果 ─────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(50)}`);
console.log(`Event Bridge 测试: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
