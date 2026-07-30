#!/usr/bin/env node
/**
 * Grok Validate Plugin 测试
 *
 * 测试插件验证器的检测能力。
 *
 * 覆盖范围：
 * - plugin.json 格式校验
 * - Claude 目录引用扫描
 * - 文件完整性检查
 * - 正常插件通过验证
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

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

const { validateManifest, checkClaudeReferences, validatePlugin } = require("../scripts/grok/validate-plugin");

// ── 测试 1: plugin.json 格式校验 ─────────────────────────────────────

section("plugin.json 格式校验");

// 正常 manifest
const validDir = path.join(os.tmpdir(), `grok-validate-valid-${Date.now()}`);
const validManifestDir = path.join(validDir, ".grok-plugin");
fs.mkdirSync(validManifestDir, { recursive: true });
fs.writeFileSync(
  path.join(validManifestDir, "plugin.json"),
  JSON.stringify({
    name: "test-plugin",
    version: "1.0.0",
    description: "Test plugin",
    capabilities: { skills: true, agents: true },
    skills: [],
    agents: [],
  })
);

const validResult = validateManifest(path.join(validManifestDir, "plugin.json"));
assert(validResult.valid === true, "正常 manifest 验证通过");

// 缺少必需字段
const invalidDir = path.join(os.tmpdir(), `grok-validate-invalid-${Date.now()}`);
const invalidManifestDir = path.join(invalidDir, ".grok-plugin");
fs.mkdirSync(invalidManifestDir, { recursive: true });
fs.writeFileSync(
  path.join(invalidManifestDir, "plugin.json"),
  JSON.stringify({ name: "test" })
);

const invalidResult = validateManifest(path.join(invalidManifestDir, "plugin.json"));
assert(invalidResult.valid === false, "缺少字段的 manifest 验证失败");
assert(invalidResult.errors.some((e) => e.includes("version")), "报告缺少 version");
assert(invalidResult.errors.some((e) => e.includes("description")), "报告缺少 description");

// 不存在的文件
const missingResult = validateManifest("/nonexistent/plugin.json");
assert(missingResult.valid === false, "不存在的文件返回失败");
assert(missingResult.errors.some((e) => e.includes("not found")), "报告文件不存在");

// 无效 JSON
const badJsonDir = path.join(os.tmpdir(), `grok-validate-badjson-${Date.now()}`);
const badJsonManifestDir = path.join(badJsonDir, ".grok-plugin");
fs.mkdirSync(badJsonManifestDir, { recursive: true });
fs.writeFileSync(path.join(badJsonManifestDir, "plugin.json"), "not json");

const badJsonResult = validateManifest(path.join(badJsonManifestDir, "plugin.json"));
assert(badJsonResult.valid === false, "无效 JSON 返回失败");
assert(badJsonResult.errors.some((e) => e.includes("Failed to parse")), "报告解析失败");

// 无效版本格式
const badVersionDir = path.join(os.tmpdir(), `grok-validate-badversion-${Date.now()}`);
const badVersionManifestDir = path.join(badVersionDir, ".grok-plugin");
fs.mkdirSync(badVersionManifestDir, { recursive: true });
fs.writeFileSync(
  path.join(badVersionManifestDir, "plugin.json"),
  JSON.stringify({ name: "test", version: "abc", description: "test" })
);

const badVersionResult = validateManifest(path.join(badVersionManifestDir, "plugin.json"));
assert(badVersionResult.errors.some((e) => e.includes("version format")), "报告版本格式错误");

// ── 测试 2: Claude 目录引用扫描 ─────────────────────────────────────

section("Claude 目录引用扫描");

// 无引用的目录
const cleanDir = path.join(os.tmpdir(), `grok-validate-clean-${Date.now()}`);
fs.mkdirSync(cleanDir, { recursive: true });
fs.writeFileSync(path.join(cleanDir, "clean.md"), "# Clean\n\nNo references here.");

const cleanViolations = checkClaudeReferences(cleanDir);
assert(cleanViolations.length === 0, "无引用目录返回空违规列表");

// 有引用的目录
const dirtyDir = path.join(os.tmpdir(), `grok-validate-dirty-${Date.now()}`);
fs.mkdirSync(dirtyDir, { recursive: true });
fs.writeFileSync(
  path.join(dirtyDir, "dirty.md"),
  '# Dirty\n\nUse ~/.claude for config.\nSet ${CLAUDE_HOME} env var.\n'
);

const dirtyViolations = checkClaudeReferences(dirtyDir);
assert(dirtyViolations.length > 0, `检测到 ${dirtyViolations.length} 个引用`);
assert(dirtyViolations.some((v) => v.content.includes("~/.claude")), "检测到 ~/.claude");
assert(dirtyViolations.some((v) => v.content.includes("${CLAUDE_HOME}")), "检测到 ${CLAUDE_HOME}");

// ── 测试 3: 文件完整性检查 ─────────────────────────────────────────

section("文件完整性检查");

// 创建带引用的 skill 文件
const pluginDir = path.join(os.tmpdir(), `grok-validate-plugin-${Date.now()}`);
const pluginManifestDir = path.join(pluginDir, ".grok-plugin");
const skillsDir = path.join(pluginDir, "skills", "test-skill");
fs.mkdirSync(pluginManifestDir, { recursive: true });
fs.mkdirSync(skillsDir, { recursive: true });

// manifest 引用了一个存在的 skill
fs.writeFileSync(
  path.join(pluginManifestDir, "plugin.json"),
  JSON.stringify({
    name: "test",
    version: "1.0.0",
    description: "test",
    skills: ["skills/test-skill/SKILL.md"],
    agents: ["agents/missing-agent.md"],
  })
);
fs.writeFileSync(path.join(skillsDir, "SKILL.md"), "---\nname: test\n---\n# Test Skill");

const integrityResult = validatePlugin(pluginDir);
assert(integrityResult.valid === false, "缺失的 agent 文件导致验证失败");
assert(integrityResult.errors.some((e) => e.includes("missing-agent")), "报告缺失的 agent");

// ── 测试 4: 完整的 .grok-build 验证 ─────────────────────────────────

section("完整构建产物验证");

// 先运行 packager 生成构建产物
const { execSync } = require("child_process");
const buildDir = path.join(os.tmpdir(), `grok-validate-build-${Date.now()}`);

try {
  execSync(`node scripts/grok/grok-packager.js --output "${buildDir}"`, {
    encoding: "utf-8",
    timeout: 30000,
    cwd: path.resolve(__dirname, ".."),
  });

  const buildResult = validatePlugin(buildDir);
  assert(buildResult.valid === true, "Packager 生成的产物通过验证");
  assert(buildResult.warnings.length === 0 || buildResult.warnings.every((w) => w.includes("references")), "无严重警告");
} catch (e) {
  assert(false, `构建或验证失败: ${e.message}`);
}

// ── 清理 ─────────────────────────────────────────────────────────────────

for (const dir of [validDir, invalidDir, badJsonDir, badVersionDir, cleanDir, dirtyDir, pluginDir, buildDir]) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}

// ── 结果 ─────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(50)}`);
console.log(`Validate Plugin 测试: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
