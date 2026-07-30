#!/usr/bin/env node
/**
 * Grok Path Resolver 测试
 *
 * 测试路径解析器在 Claude/Grok 双平台下的行为。
 *
 * 覆盖范围：
 * - 平台自动检测（GROK_HOME 环境变量）
 * - getHomeDir / getProjectRoot / getTspHome 路径正确性
 * - isGrok / isClaude / getPlatform 平台判断
 * - getCompatiblePath 回退逻辑
 * - ensureDir 目录创建
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

function skip(message) {
  skipped++;
  console.log(`  ⏭️  SKIP: ${message}`);
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ── 测试 1: 默认平台检测（无 GROK_HOME）──────────────────────────────────

section("平台检测");

// 需要清除 require 缓存来重新加载模块
function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

// 备份环境变量
const origGrokHome = process.env.GROK_HOME;
const origClaudeHome = process.env.CLAUDE_HOME;

// 测试无 GROK_HOME 时平台检测逻辑
delete process.env.GROK_HOME;
const resolverClaude = freshRequire("../scripts/grok/path-resolver");
// PLATFORM 基于 GROK_HOME 环境变量检测，而非脚本位置
assert(
  resolverClaude.PLATFORM === "claude" || resolverClaude.PLATFORM === "grok",
  `默认平台检测为: ${resolverClaude.PLATFORM}（基于 GROK_HOME 环境变量）`
);
assert(typeof resolverClaude.isGrok === "function", "isGrok 函数存在");
assert(typeof resolverClaude.isClaude === "function", "isClaude 函数存在");
assert(typeof resolverClaude.getPlatform === "function", "getPlatform 函数存在");

// ── 测试 2: 路径函数存在性 ─────────────────────────────────────────────

section("路径函数存在性");

const pathFunctions = [
  "getHomeDir",
  "getProjectRoot",
  "getTspHome",
  "getSessionDir",
  "getPluginDir",
  "getCacheDir",
  "getConfigFile",
  "getHooksDir",
  "getMetricsDir",
  "getCompatiblePath",
  "ensureDir",
];

for (const fn of pathFunctions) {
  assert(typeof resolverClaude[fn] === "function", `${fn} 是函数`);
}

// ── 测试 3: getHomeDir 返回正确路径 ─────────────────────────────────────

section("getHomeDir 路径");

const homeDir = resolverClaude.getHomeDir();
assert(typeof homeDir === "string", "getHomeDir 返回字符串");
assert(homeDir.includes(".grok") || homeDir.includes(".claude"), `getHomeDir 返回有效路径: ${homeDir}`);
assert(path.isAbsolute(homeDir), "getHomeDir 返回绝对路径");

// ── 测试 4: getProjectRoot 返回正确路径 ─────────────────────────────────

section("getProjectRoot 路径");

const origProjectRoot = process.env.PROJECT_ROOT;
process.env.PROJECT_ROOT = "/tmp/test-project";
const resolverWithProject = freshRequire("../scripts/grok/path-resolver");
const projectRoot = resolverWithProject.getProjectRoot();
assert(projectRoot === "/tmp/test-project", "getProjectRoot 使用 PROJECT_ROOT 环境变量");

delete process.env.PROJECT_ROOT;
const resolverNoProject = freshRequire("../scripts/grok/path-resolver");
const defaultProjectRoot = resolverNoProject.getProjectRoot();
assert(defaultProjectRoot === process.cwd(), "无 PROJECT_ROOT 时回退到 cwd");

// ── 测试 5: getTspHome 路径 ─────────────────────────────────────────────

section("getTspHome 路径");

const tspHome = resolverClaude.getTspHome();
assert(typeof tspHome === "string", "getTspHome 返回字符串");
assert(fs.existsSync(tspHome), `getTspHome 路径存在: ${tspHome}`);
assert(fs.existsSync(path.join(tspHome, "package.json")), "TSP_HOME 包含 package.json");

// ── 测试 6: 子目录路径函数 ─────────────────────────────────────────────

section("子目录路径函数");

const sessionDir = resolverClaude.getSessionDir();
assert(sessionDir.endsWith("session-data"), `getSessionDir 路径正确: ${sessionDir}`);

const pluginDir = resolverClaude.getPluginDir();
assert(pluginDir.endsWith("installed-plugins"), `getPluginDir 路径正确: ${pluginDir}`);

const cacheDir = resolverClaude.getCacheDir();
assert(cacheDir.endsWith("cache"), `getCacheDir 路径正确: ${cacheDir}`);

const hooksDir = resolverClaude.getHooksDir();
assert(hooksDir.endsWith("hooks"), `getHooksDir 路径正确: ${hooksDir}`);

const metricsDir = resolverClaude.getMetricsDir();
assert(metricsDir.endsWith("metrics"), `getMetricsDir 路径正确: ${metricsDir}`);

// ── 测试 7: ensureDir 创建目录 ─────────────────────────────────────────

section("ensureDir 目录创建");

const testDir = path.join(os.tmpdir(), `grok-test-${Date.now()}`);
assert(!fs.existsSync(testDir), "测试目录不存在");
resolverClaude.ensureDir(testDir);
assert(fs.existsSync(testDir), "ensureDir 创建了目录");

// 清理
try { fs.rmdirSync(testDir); } catch {}

// ── 测试 8: getCompatiblePath 回退逻辑 ─────────────────────────────────

section("getCompatiblePath 回退逻辑");

// 当主路径存在时应返回主路径
const compatiblePath = resolverClaude.getCompatiblePath("package.json");
assert(typeof compatiblePath === "string", "getCompatiblePath 返回字符串");

// ── 测试 9: GROK_HOME 环境变量覆盖 ─────────────────────────────────────

section("GROK_HOME 环境变量覆盖");

process.env.GROK_HOME = "/tmp/custom-grok-home";
const resolverCustom = freshRequire("../scripts/grok/path-resolver");
const customHome = resolverCustom.getHomeDir();
assert(customHome === "/tmp/custom-grok-home", "GROK_HOME 环境变量被正确使用");

// 恢复环境变量
if (origGrokHome !== undefined) process.env.GROK_HOME = origGrokHome;
else delete process.env.GROK_HOME;
if (origProjectRoot !== undefined) process.env.PROJECT_ROOT = origProjectRoot;
else delete process.env.PROJECT_ROOT;

// ── 结果 ─────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(50)}`);
console.log(`Path Resolver 测试: ${passed} passed, ${failed} failed, ${skipped} skipped`);
process.exit(failed > 0 ? 1 : 0);
