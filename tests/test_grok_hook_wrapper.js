#!/usr/bin/env node
/**
 * Grok Hook Wrapper 测试
 *
 * 测试 hook 包装器的输入转换和执行能力。
 *
 * 覆盖范围：
 * - translateInput 格式转换
 * - executeHook 执行路径
 * - 错误处理策略（fail-open / fail-closed）
 * - 环境变量注入
 */

const path = require("path");
const fs = require("fs");

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
const { translateInput, executeHook } = require("../scripts/grok/grok-hook-wrapper");

// ── 测试 1: translateInput 基本转换 ──────────────────────────────────

section("translateInput 转换");

// 工具名透传（Grok 自动映射，无需手动转换）
const result1 = translateInput({ tool_name: "Bash", tool_input: { command: "ls" } });
assert(result1.toolName === "Bash", "Bash → Bash（透传）");
assert(result1.toolInput.command === "ls", "tool_input → toolInput");
assert(result1.tool_name === undefined, "tool_name 已删除");
assert(result1.tool_input === undefined, "tool_input 已删除");

// 所有工具名透传（Grok 自动映射）
const toolMap = [
  ["Bash", "Bash"],
  ["Read", "Read"],
  ["Write", "Write"],
  ["Edit", "Edit"],
  ["Grep", "Grep"],
  ["Glob", "Glob"],
  ["Agent", "Agent"],
];

for (const [claude, expected] of toolMap) {
  const r = translateInput({ tool_name: claude });
  assert(r.toolName === expected, `${claude} → ${expected}（透传）`);
}

// tool_output 转换
const result2 = translateInput({ tool_output: { content: "test" } });
assert(result2.toolOutput !== undefined, "tool_output → toolOutput");
assert(result2.tool_output === undefined, "tool_output 已删除");

// 未知工具名透传（Grok 自动映射）
const result3 = translateInput({ tool_name: "CustomTool" });
assert(result3.toolName === "CustomTool", "未知工具名透传");

// 无字段时不变
const result4 = translateInput({ other: "value" });
assert(result4.other === "value", "未知字段保留");

// ── 测试 2: Hook 脚本存在性检查 ─────────────────────────────────────

section("Hook 脚本存在性");

const hookDir = path.resolve(__dirname, "../scripts/grok/hooks");
const expectedHooks = [
  "grok-session-start.js",
  "grok-session-end.js",
  "grok-cost-tracker.js",
  "grok-post-bash-command-log.js",
  "grok-pre-bash-block-no-verify.js",
];

for (const hook of expectedHooks) {
  const hookPath = path.join(hookDir, hook);
  assert(fs.existsSync(hookPath), `Hook 文件存在: ${hook}`);
}

// ── 测试 3: grok-pre-bash-block-no-verify 功能测试 ─────────────────

section("pre-bash-block-no-verify hook 功能");

const { execSync } = require("child_process");

function runHookStdin(hookFile, inputData, extraArgs) {
  const args = extraArgs ? ` ${extraArgs}` : "";
  try {
    const result = execSync(`node "${hookFile}"${args}`, {
      input: JSON.stringify(inputData),
      encoding: "utf-8",
      timeout: 5000,
    });
    return { stdout: result.trim(), exitCode: 0 };
  } catch (error) {
    return {
      stdout: error.stdout ? error.stdout.trim() : "",
      exitCode: error.status || 1,
      stderr: error.stderr ? error.stderr.trim() : "",
    };
  }
}

const blockHook = path.join(hookDir, "grok-pre-bash-block-no-verify.js");

// 测试阻止 --no-verify
const blockResult = runHookStdin(blockHook, {
  tool_input: { command: "git commit -m 'test' --no-verify" },
});
assert(blockResult.exitCode === 2, "git commit --no-verify 被阻止 (exit 2)");

// 测试正常 commit 通过
const passResult = runHookStdin(blockHook, {
  tool_input: { command: "git commit -m 'test'" },
});
assert(passResult.exitCode === 0, "正常 git commit 通过 (exit 0)");

// 测试非 git 命令通过
const nonGitResult = runHookStdin(blockHook, {
  tool_input: { command: "ls -la" },
});
assert(nonGitResult.exitCode === 0, "非 git 命令通过 (exit 0)");

// 测试 Grok 格式输入（toolInput）
const grokFormatResult = runHookStdin(blockHook, {
  toolInput: { command: "git commit -m 'test' --no-verify" },
});
assert(grokFormatResult.exitCode === 2, "Grok 格式输入也被阻止");

// ── 测试 4: grok-post-bash-command-log 功能测试 ────────────────────

section("post-bash-command-log hook 功能");

const postHook = path.join(hookDir, "grok-post-bash-command-log.js");

// 测试 audit 模式（使用 extraArgs）
const auditResult = runHookStdin(postHook, {
  tool_input: { command: "echo hello" },
}, "audit");
assert(auditResult.exitCode === 0, "audit 模式执行成功");

// 测试 cost 模式
const costResult = runHookStdin(postHook, {
  tool_input: { command: "echo hello" },
}, "cost");
assert(costResult.exitCode === 0, "cost 模式执行成功");

// 测试敏感信息脱敏
const { sanitizeCommand } = require(postHook);
assert(
  sanitizeCommand("curl -H 'Authorization: Bearer secret123'").includes("<REDACTED>"),
  "Authorization 头被脱敏"
);
assert(
  sanitizeCommand("ghp_1234567890abcdef").includes("<REDACTED>"),
  "GitHub token 被脱敏"
);
assert(
  sanitizeCommand("git push --token=mysecret").includes("<REDACTED>"),
  "--token 参数被脱敏"
);

// ── 测试 5: grok-cost-tracker 功能测试 ─────────────────────────────

section("cost-tracker hook 功能");

const costTrackerHook = path.join(hookDir, "grok-cost-tracker.js");
const costTrackerResult = runHookStdin(costTrackerHook, {
  usage: { input_tokens: 1000, output_tokens: 500 },
  model: "claude-sonnet-4-20250514",
});
assert(costTrackerResult.exitCode === 0, "cost-tracker 执行成功");

// ── 测试 6: grok-session-start 功能测试 ─────────────────────────────

section("session-start hook 功能");

const sessionStartHook = path.join(hookDir, "grok-session-start.js");
const sessionStartResult = runHookStdin(sessionStartHook, {
  sessionId: "test-session-001",
});
assert(sessionStartResult.exitCode === 0, "session-start 执行成功");
// SessionStart 为被动事件，stdout 被忽略；只验证 exit 0

// ── 测试 7: grok-session-end 功能测试 ───────────────────────────────

section("session-end hook 功能");

const sessionEndHook = path.join(hookDir, "grok-session-end.js");
const sessionEndResult = runHookStdin(sessionEndHook, {
  sessionId: "test-session-002",
});
assert(sessionEndResult.exitCode === 0, "session-end 执行成功");
// SessionEnd 为被动事件，stdout 被忽略；只验证 exit 0

// ── 结果 ─────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(50)}`);
console.log(`Hook Wrapper 测试: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
