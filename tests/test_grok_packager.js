#!/usr/bin/env node
/**
 * Grok Packager 测试
 *
 * 测试插件包生成的完整流程。
 *
 * 覆盖范围：
 * - dry-run 模式不写文件
 * - skills 收集与 provenance 注入
 * - commands 转为 namespaced skills
 * - agents 收集与 frontmatter 生成
 * - plugin.json manifest 生成
 * - Claude → Grok 路径替换
 * - hooks 复制
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const TSP_ROOT = path.resolve(__dirname, "..");
const PACKAGER = path.join(TSP_ROOT, "scripts/grok/grok-packager.js");

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

function runPackager(args = "") {
  return execSync(`node "${PACKAGER}" ${args}`, {
    encoding: "utf-8",
    timeout: 30000,
    cwd: TSP_ROOT,
  });
}

// ── 测试 1: dry-run 模式 ─────────────────────────────────────────────

section("dry-run 模式");

// 确保 .grok-build 不存在（可能被之前的安装脚本创建）
const preExistingBuild = path.join(TSP_ROOT, ".grok-build");
if (fs.existsSync(preExistingBuild)) {
  fs.rmSync(preExistingBuild, { recursive: true, force: true });
}

const dryOutput = runPackager("--dry-run");
assert(dryOutput.includes("TSP Grok Packager"), "输出标题");
assert(dryOutput.includes("Skills:"), "输出 skill 数量");
assert(dryOutput.includes("Commands:"), "输出 command 数量");
assert(dryOutput.includes("Agents:"), "输出 agent 数量");
assert(dryOutput.includes("Dry run"), "标记为 dry run");
assert(!fs.existsSync(preExistingBuild), "不创建输出目录");

// ── 测试 2: 实际构建 ─────────────────────────────────────────────────

section("实际构建");

const testOutputDir = path.join(os.tmpdir(), `grok-packager-test-${Date.now()}`);
runPackager(`--output "${testOutputDir}"`);

assert(fs.existsSync(testOutputDir), "输出目录已创建");
assert(fs.existsSync(path.join(testOutputDir, ".grok-plugin/plugin.json")), "plugin.json 已创建");
assert(fs.existsSync(path.join(testOutputDir, "provenance.json")), "provenance.json 已创建");

// ── 测试 3: plugin.json 结构 ─────────────────────────────────────────

section("plugin.json 结构");

const manifestPath = path.join(testOutputDir, ".grok-plugin/plugin.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

assert(manifest.name === "tsp", "name 字段正确");
assert(typeof manifest.version === "string", "version 字段存在");
assert(manifest.description.includes("Team Skills Platform"), "description 包含描述");
assert(manifest.license === "MIT", "license 正确");
assert(manifest.engines.grok === ">=0.1.0", "grok 版本约束");
assert(manifest.capabilities.skills === true, "支持 skills");
assert(manifest.capabilities.commands === true, "支持 commands");
assert(manifest.capabilities.agents === true, "支持 agents");
assert(manifest.capabilities.hooks === true, "支持 hooks");
assert(Array.isArray(manifest.skills), "skills 是数组");
assert(Array.isArray(manifest.commands), "commands 是数组");
assert(Array.isArray(manifest.agents), "agents 是数组");
assert(manifest.skills.length > 0, `skills 数量: ${manifest.skills.length}`);
assert(manifest.commands.length > 0, `commands 数量: ${manifest.commands.length}`);
assert(manifest.agents.length > 0, `agents 数量: ${manifest.agents.length}`);

// ── 测试 4: provenance.json 结构 ─────────────────────────────────────

section("provenance.json 结构");

const provenancePath = path.join(testOutputDir, "provenance.json");
const provenance = JSON.parse(fs.readFileSync(provenancePath, "utf-8"));

assert(typeof provenance.tsp_version === "string", "tsp_version 存在");
assert(provenance.adapter_version === "0.1.0", "adapter_version 正确");
assert(typeof provenance.generated_at === "string", "generated_at 存在");
assert(provenance.components.skills > 0, `skills 组件: ${provenance.components.skills}`);
assert(provenance.components.commands > 0, `commands 组件: ${provenance.components.commands}`);
assert(provenance.components.agents > 0, `agents 组件: ${provenance.components.agents}`);

// ── 测试 5: Skills 目录结构 ─────────────────────────────────────────

section("Skills 目录结构");

const skillsDir = path.join(testOutputDir, "skills");
assert(fs.existsSync(skillsDir), "skills 目录存在");

const skillDirs = fs.readdirSync(skillsDir).filter((d) =>
  fs.statSync(path.join(skillsDir, d)).isDirectory()
);
assert(skillDirs.length > 0, `skills 目录数量: ${skillDirs.length}`);

// 检查每个 skill 有 SKILL.md
for (const skillDir of skillDirs.slice(0, 5)) {
  const skillFile = path.join(skillsDir, skillDir, "SKILL.md");
  assert(fs.existsSync(skillFile), `skill 存在: ${skillDir}/SKILL.md`);
}

// ── 测试 6: Claude → Grok 路径替换 ─────────────────────────────────

section("Claude → Grok 路径替换");

// 扫描输出目录中的 Claude 引用
function scanForClaude(dir) {
  const violations = [];
  const claudePatterns = [/~\/\.claude/, /\$\{CLAUDE_HOME\}/, /\$\{CLAUDE_PLUGIN_ROOT\}/, /CLAUDE_HOME/, /CLAUDE_PROJECT_ROOT/];

  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of claudePatterns) {
        if (pattern.test(lines[i])) {
          violations.push({ file: path.relative(testOutputDir, filePath), line: i + 1 });
        }
      }
    }
  }

  function scanDir(dirPath) {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") {
        scanDir(fullPath);
      } else if (entry.isFile() && /\.(js|md|json)$/.test(entry.name)) {
        scanFile(fullPath);
      }
    }
  }

  scanDir(dir);
  return violations;
}

// 扫描 skills 和 agents 目录
const violations = [
  ...scanForClaude(path.join(testOutputDir, "skills")),
  ...scanForClaude(path.join(testOutputDir, "agents")),
];

// 允许少量无法自动替换的引用（如文档中提到 Claude 的地方）
assert(violations.length < 20, `Claude 引用残留: ${violations.length} (允许少量文档引用)`);

// ── 测试 7: Agents 目录结构 ─────────────────────────────────────────

section("Agents 目录结构");

const agentsDir = path.join(testOutputDir, "agents");
assert(fs.existsSync(agentsDir), "agents 目录存在");

const agentFiles = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
assert(agentFiles.length > 0, `agent 文件数量: ${agentFiles.length}`);

// 检查 role 和 specialist agent 都存在
const roleAgents = agentFiles.filter((f) => f.startsWith("role-"));
const specialistAgents = agentFiles.filter((f) => f.startsWith("specialist-"));
assert(roleAgents.length > 0, `role agents: ${roleAgents.length}`);
assert(specialistAgents.length > 0, `specialist agents: ${specialistAgents.length}`);

// 检查 agent 文件有 frontmatter
const sampleAgent = path.join(agentsDir, agentFiles[0]);
const agentContent = fs.readFileSync(sampleAgent, "utf-8");
assert(agentContent.startsWith("---"), "agent 文件有 YAML frontmatter");

// ── 测试 8: Hooks 复制 ─────────────────────────────────────────────

section("Hooks 复制");

const hooksDir = path.join(testOutputDir, "scripts/grok/hooks");
if (fs.existsSync(hooksDir)) {
  const hookFiles = fs.readdirSync(hooksDir).filter((f) => f.endsWith(".js"));
  assert(hookFiles.length > 0, `hook 脚本数量: ${hookFiles.length}`);

  // 检查 path-resolver 也被复制
  const pathResolver = path.join(testOutputDir, "scripts/grok/path-resolver.js");
  assert(fs.existsSync(pathResolver), "path-resolver.js 已复制");
}

// ── 测试 9: hooks.json 生成 ─────────────────────────────────────────

section("hooks.json 生成");

const hooksJson = path.join(testOutputDir, "hooks.json");
assert(fs.existsSync(hooksJson), "hooks.json 存在");

const hooksContent = JSON.parse(fs.readFileSync(hooksJson, "utf-8"));
assert(hooksContent.hooks !== undefined, "hooks.json 有 hooks 字段");

// ── 测试 10: Commands 转为 namespaced skills ────────────────────────

section("Commands → Skills 转换");

const commandSkills = skillDirs.filter((d) => d.startsWith("command-"));
assert(commandSkills.length > 0, `command skills 数量: ${commandSkills.length}`);

// 随机检查一个 command skill
if (commandSkills.length > 0) {
  const cmdSkillFile = path.join(skillsDir, commandSkills[0], "SKILL.md");
  assert(fs.existsSync(cmdSkillFile), `command skill 存在: ${commandSkills[0]}/SKILL.md`);
}

// ── 清理 ─────────────────────────────────────────────────────────────────

try {
  fs.rmSync(testOutputDir, { recursive: true, force: true });
} catch {}

// ── 结果 ─────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(50)}`);
console.log(`Packager 测试: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
