#!/usr/bin/env node
/**
 * Grok Release 测试
 *
 * 测试发布脚本的验证和打包能力。
 *
 * 覆盖范围：
 * - 构建产物验证
 * - release manifest 生成
 * - release notes 生成
 * - tar.gz 包创建
 * - 版本一致性检查
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const TSP_ROOT = path.resolve(__dirname, "..");

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

// ── 前置: 生成构建产物 ─────────────────────────────────────────────

section("前置: 生成构建产物");

const buildDir = path.join(TSP_ROOT, ".grok-build");
let buildDirExisted = fs.existsSync(buildDir);
let buildDirBackup = null;

// 备份已有构建目录
if (buildDirExisted) {
  buildDirBackup = path.join(os.tmpdir(), `grok-build-backup-${Date.now()}`);
  fs.cpSync(buildDir, buildDirBackup, { recursive: true });
}

try {
  execSync(`node scripts/grok/grok-packager.js`, {
    encoding: "utf-8",
    timeout: 30000,
    cwd: TSP_ROOT,
  });
  assert(true, "Packager 构建成功");
} catch (e) {
  assert(false, `Packager 构建失败: ${e.message}`);
  process.exit(1);
}

// ── 测试 1: dry-run 模式 ─────────────────────────────────────────────

section("dry-run 模式");

try {
  const output = execSync(`node scripts/grok/release.js --dry-run`, {
    encoding: "utf-8",
    timeout: 30000,
    cwd: TSP_ROOT,
  });
  assert(output.includes("TSP Grok Release"), "输出标题");
  assert(output.includes("Dry run"), "标记为 dry run");
} catch (e) {
  assert(false, `dry-run 失败: ${e.message}`);
}

// ── 测试 2: release manifest 生成 ─────────────────────────────────

section("release manifest 生成");

try {
  execSync(`node scripts/grok/release.js`, {
    encoding: "utf-8",
    timeout: 30000,
    cwd: TSP_ROOT,
  });

  const manifestPath = path.join(buildDir, "release-manifest.json");
  assert(fs.existsSync(manifestPath), "release-manifest.json 已创建");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  assert(manifest.name === "tsp-grok-compatibility-pack", "name 正确");
  assert(typeof manifest.version === "string", "version 存在");
  assert(manifest.adapter_version === "0.1.0", "adapter_version 正确");
  assert(manifest.compatibility.grok === ">=0.2.109", "grok 兼容版本正确");
  assert(manifest.compatibility.node === ">=18", "node 兼容版本正确");
  assert(manifest.components.skills > 0, `skills 数量: ${manifest.components.skills}`);
  assert(manifest.components.agents > 0, `agents 数量: ${manifest.components.agents}`);
  assert(typeof manifest.git_commit === "string", "git_commit 存在");
  assert(typeof manifest.generated_at === "string", "generated_at 存在");
} catch (e) {
  assert(false, `release 生成失败: ${e.message}`);
}

// ── 测试 3: release notes 生成 ─────────────────────────────────────

section("release notes 生成");

const notesPath = path.join(buildDir, "RELEASE_NOTES.md");
assert(fs.existsSync(notesPath), "RELEASE_NOTES.md 已创建");

const notes = fs.readFileSync(notesPath, "utf-8");
assert(notes.includes("# TSP Grok Compatibility Pack"), "标题正确");
assert(notes.includes("## 版本信息"), "包含版本信息");
assert(notes.includes("## 组件统计"), "包含组件统计");
assert(notes.includes("## 安装方式"), "包含安装方式");
assert(notes.includes("grok plugin install"), "包含安装命令");
assert(notes.includes("## 已知限制"), "包含已知限制");

// ── 测试 4: tar.gz 包创建 ─────────────────────────────────────────

section("tar.gz 包创建");

const packagePath = path.join(TSP_ROOT, `tsp-grok-${require(path.join(TSP_ROOT, "package.json")).version}.tar.gz`);
if (fs.existsSync(packagePath)) {
  const stats = fs.statSync(packagePath);
  assert(stats.size > 0, `包大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  // 验证包内容
  try {
    const list = execSync(`tar -tzf "${packagePath}"`, { encoding: "utf-8" });
    assert(list.includes(".grok-plugin/plugin.json"), "包包含 plugin.json");
    assert(list.includes("skills/"), "包包含 skills 目录");
    assert(list.includes("agents/"), "包包含 agents 目录");
    assert(list.includes("provenance.json"), "包包含 provenance.json");
  } catch (e) {
    assert(false, `包内容验证失败: ${e.message}`);
  }
} else {
  assert(false, "tar.gz 包未创建");
}

// ── 测试 5: 版本一致性 ─────────────────────────────────────────────

section("版本一致性");

const tspVersion = require(path.join(TSP_ROOT, "package.json")).version;
const releaseManifest = JSON.parse(
  fs.readFileSync(path.join(buildDir, "release-manifest.json"), "utf-8")
);
assert(releaseManifest.version === tspVersion, `版本一致: ${tspVersion}`);

const pluginManifest = JSON.parse(
  fs.readFileSync(path.join(buildDir, ".grok-plugin/plugin.json"), "utf-8")
);
assert(pluginManifest.version === tspVersion, `plugin.json 版本一致: ${tspVersion}`);

const provenance = JSON.parse(
  fs.readFileSync(path.join(buildDir, "provenance.json"), "utf-8")
);
assert(provenance.tsp_version === tspVersion, `provenance 版本一致: ${tspVersion}`);

// ── 清理 ─────────────────────────────────────────────────────────────────

// 恢复原有构建目录
if (buildDirExisted && buildDirBackup) {
  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.cpSync(buildDirBackup, buildDir, { recursive: true });
  fs.rmSync(buildDirBackup, { recursive: true, force: true });
}

// 删除 tar.gz
try {
  fs.unlinkSync(packagePath);
} catch {}

// ── 结果 ─────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(50)}`);
console.log(`Release 测试: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
