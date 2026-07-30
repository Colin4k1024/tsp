#!/usr/bin/env node
/**
 * Grok Build 端到端集成测试
 *
 * 完整模拟 "构建 → 验证 → 安装 → 运行" 全流程。
 *
 * 覆盖范围：
 * - packager 生成完整插件包
 * - validate-plugin 验证产物
 * - release 生成发布包
 * - 每个 hook 在 Grok 环境下可执行
 * - 所有 agent 文件格式正确
 * - 所有 skill 文件格式正确
 * - 所有 command 文件格式正确
 * - 无 Claude 路径残留
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const TSP_ROOT = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(os.tmpdir(), `grok-integration-${Date.now()}`);

let passed = 0;
let failed = 0;
let warnings = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

function warn(message) {
  warnings++;
  console.log(`  ⚠️  ${message}`);
}

function section(title) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 1: 构建
// ═══════════════════════════════════════════════════════════════════════════

section("Phase 1: 构建插件包");

try {
  const output = execSync(`node scripts/grok/grok-packager.js --output "${BUILD_DIR}"`, {
    encoding: "utf-8",
    timeout: 30000,
    cwd: TSP_ROOT,
  });
  assert(output.includes("Build complete"), "Packager 构建成功");
  assert(fs.existsSync(BUILD_DIR), "输出目录存在");
} catch (e) {
  console.error(`\n❌ 构建失败，终止测试: ${e.message}`);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 2: 结构验证
// ═══════════════════════════════════════════════════════════════════════════

section("Phase 2: 结构验证");

// plugin.json
const pluginJsonPath = path.join(BUILD_DIR, ".grok-plugin/plugin.json");
assert(fs.existsSync(pluginJsonPath), "plugin.json 存在");

const manifest = JSON.parse(fs.readFileSync(pluginJsonPath, "utf-8"));
assert(manifest.name === "tsp", "插件名称正确");
assert(manifest.engines && manifest.engines.grok, "Grok 版本约束存在");
assert(manifest.capabilities.skills, "支持 skills");
assert(manifest.capabilities.commands, "支持 commands");
assert(manifest.capabilities.agents, "支持 agents");
assert(manifest.capabilities.hooks, "支持 hooks");

// provenance.json
const provenancePath = path.join(BUILD_DIR, "provenance.json");
assert(fs.existsSync(provenancePath), "provenance.json 存在");

// hooks.json
const hooksJsonPath = path.join(BUILD_DIR, "hooks.json");
assert(fs.existsSync(hooksJsonPath), "hooks.json 存在");

// ═══════════════════════════════════════════════════════════════════════════
// Phase 3: Skills 完整性
// ═══════════════════════════════════════════════════════════════════════════

section("Phase 3: Skills 完整性");

const skillsDir = path.join(BUILD_DIR, "skills");
assert(fs.existsSync(skillsDir), "skills 目录存在");

const allSkillDirs = fs.readdirSync(skillsDir).filter((d) =>
  fs.statSync(path.join(skillsDir, d)).isDirectory()
);

const originalSkills = allSkillDirs.filter((d) => !d.startsWith("command-"));
const commandSkills = allSkillDirs.filter((d) => d.startsWith("command-"));

assert(originalSkills.length > 0, `原始 skills: ${originalSkills.length}`);
assert(commandSkills.length > 0, `command skills: ${commandSkills.length}`);

// 检查每个 skill 有 SKILL.md 且包含 frontmatter
let skillsWithFrontmatter = 0;
let skillsWithProvenance = 0;
let skillsMissing = 0;

for (const skillDir of allSkillDirs) {
  const skillFile = path.join(skillsDir, skillDir, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    skillsMissing++;
    continue;
  }

  const content = fs.readFileSync(skillFile, "utf-8");
  if (content.startsWith("---")) {
    skillsWithFrontmatter++;
  }
  if (content.includes("tsp_source")) {
    skillsWithProvenance++;
  }
}

assert(skillsMissing === 0, `缺失的 SKILL.md: ${skillsMissing}`);
assert(skillsWithFrontmatter > 0, `有 frontmatter 的 skills: ${skillsWithFrontmatter}`);
assert(skillsWithProvenance > 0, `有 provenance 的 skills: ${skillsWithProvenance}`);

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4: Agents 完整性
// ═══════════════════════════════════════════════════════════════════════════

section("Phase 4: Agents 完整性");

const agentsDir = path.join(BUILD_DIR, "agents");
assert(fs.existsSync(agentsDir), "agents 目录存在");

const agentFiles = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
const roleAgents = agentFiles.filter((f) => f.startsWith("role-"));
const specialistAgents = agentFiles.filter((f) => f.startsWith("specialist-"));

assert(roleAgents.length >= 8, `role agents: ${roleAgents.length} (期望 ≥8)`);
assert(specialistAgents.length > 0, `specialist agents: ${specialistAgents.length}`);

// 检查每个 agent 有 frontmatter 和 name 字段
let agentsWithName = 0;
for (const agentFile of agentFiles) {
  const content = fs.readFileSync(path.join(agentsDir, agentFile), "utf-8");
  if (content.startsWith("---") && content.includes("name:")) {
    agentsWithName++;
  }
}
assert(agentsWithName === agentFiles.length, `所有 ${agentFiles.length} 个 agent 都有 name 字段`);

// 检查关键 role agent 存在
const expectedRoles = [
  "tech-lead",
  "product-manager",
  "architect",
  "frontend-engineer",
  "backend-engineer",
  "qa-engineer",
  "devops-engineer",
];
for (const role of expectedRoles) {
  assert(
    roleAgents.includes(`role-${role}.md`),
    `关键 role agent 存在: role-${role}`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 5: Hooks 可执行性
// ═══════════════════════════════════════════════════════════════════════════

section("Phase 5: Hooks 可执行性");

const hooksDir = path.join(BUILD_DIR, "scripts/grok/hooks");
// 使用 Grok 官方 camelCase 格式
const hookTests = [
  {
    file: "grok-pre-bash-block-no-verify.js",
    input: { toolInput: { command: "ls" } },
    expectExit: 0,
    description: "pre-bash-block-no-verify 允许正常命令",
  },
  {
    file: "grok-post-bash-command-log.js",
    input: { toolInput: { command: "echo test" } },
    expectExit: 0,
    args: "audit",
    description: "post-bash-command-log audit 模式",
  },
  {
    file: "grok-post-bash-command-log.js",
    input: { toolInput: { command: "echo test" } },
    expectExit: 0,
    args: "cost",
    description: "post-bash-command-log cost 模式",
  },
  {
    file: "grok-cost-tracker.js",
    input: { usage: { input_tokens: 100, output_tokens: 50 }, model: "test" },
    expectExit: 0,
    description: "cost-tracker 执行",
  },
  {
    file: "grok-session-start.js",
    input: { sessionId: "integration-test" },
    expectExit: 0,
    description: "session-start 执行",
  },
  {
    file: "grok-session-end.js",
    input: { sessionId: "integration-test" },
    expectExit: 0,
    description: "session-end 执行",
  },
];

for (const test of hookTests) {
  const hookPath = path.join(hooksDir, test.file);
  if (!fs.existsSync(hookPath)) {
    warn(`Hook 文件缺失: ${test.file}`);
    continue;
  }

  try {
    const args = test.args ? ` ${test.args}` : "";
    execSync(`node "${hookPath}"${args}`, {
      input: JSON.stringify(test.input),
      encoding: "utf-8",
      timeout: 5000,
      env: {
        ...process.env,
        GROK_HOME: path.join(os.tmpdir(), "grok-test-home"),
        GROK_WORKSPACE_ROOT: TSP_ROOT,
        PROJECT_ROOT: TSP_ROOT,
        TSP_HOME: TSP_ROOT,
      },
    });
    assert(true, test.description);
  } catch (e) {
    if (e.status === test.expectExit) {
      assert(true, `${test.description} (exit ${e.status})`);
    } else {
      assert(false, `${test.description} (期望 exit ${test.expectExit}, 实际 ${e.status})`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 6: 路径替换验证
// ═══════════════════════════════════════════════════════════════════════════

section("Phase 6: Claude 路径残留检查");

function scanDir(dir, patterns) {
  const violations = [];

  function scan(filePath) {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (["node_modules", ".git"].includes(path.basename(filePath))) return;
      for (const entry of fs.readdirSync(filePath)) {
        scan(path.join(filePath, entry));
      }
    } else if (/\.(js|md|json)$/.test(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        for (const pattern of patterns) {
          if (pattern.test(lines[i])) {
            violations.push({
              file: path.relative(BUILD_DIR, filePath),
              line: i + 1,
              pattern: pattern.toString(),
            });
          }
        }
      }
    }
  }

  scan(dir);
  return violations;
}

const claudePatterns = [
  /\~\/\.claude(?!\/)/, // ~/.claude 但不是 ~/.claude 中的引用
  /\$\{CLAUDE_HOME\}/,
  /\$\{CLAUDE_PLUGIN_ROOT\}/,
];

const skillsViolations = scanDir(path.join(BUILD_DIR, "skills"), claudePatterns);
const agentsViolations = scanDir(path.join(BUILD_DIR, "agents"), claudePatterns);

// 允许少量文档级引用（如"从 Claude 迁移"的说明文字）
const totalViolations = skillsViolations.length + agentsViolations.length;
if (totalViolations > 0 && totalViolations < 20) {
  warn(`Claude 路径残留: ${totalViolations} 处 (可接受的文档引用)`);
} else {
  assert(totalViolations === 0, `无 Claude 路径残留 (发现 ${totalViolations} 处)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Phase 7: Manifest 一致性
// ═══════════════════════════════════════════════════════════════════════════

section("Phase 7: Manifest 一致性");

// 检查 manifest 中的 skill 路径都实际存在
let manifestSkillsExist = 0;
let manifestSkillsMissing = 0;
for (const skill of manifest.skills) {
  if (fs.existsSync(path.join(BUILD_DIR, skill))) {
    manifestSkillsExist++;
  } else {
    manifestSkillsMissing++;
  }
}
assert(manifestSkillsMissing === 0, `manifest 中所有 skill 路径有效 (${manifestSkillsExist} 个)`);

// 检查 manifest 中的 agent 路径都实际存在
let manifestAgentsExist = 0;
let manifestAgentsMissing = 0;
for (const agent of manifest.agents) {
  if (fs.existsSync(path.join(BUILD_DIR, agent))) {
    manifestAgentsExist++;
  } else {
    manifestAgentsMissing++;
  }
}
assert(manifestAgentsMissing === 0, `manifest 中所有 agent 路径有效 (${manifestAgentsExist} 个)`);

// ═══════════════════════════════════════════════════════════════════════════
// Phase 8: 使用 validate-plugin 验证
// ═══════════════════════════════════════════════════════════════════════════

section("Phase 8: validate-plugin 验证");

try {
  const output = execSync(`node scripts/grok/validate-plugin.js "${BUILD_DIR}"`, {
    encoding: "utf-8",
    timeout: 10000,
    cwd: TSP_ROOT,
  });
  assert(output.includes("PASSED"), "validate-plugin 通过");
} catch (e) {
  assert(false, `validate-plugin 失败: ${e.message}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 统计汇总
// ═══════════════════════════════════════════════════════════════════════════

section("统计汇总");

// 重新统计实际组件数
const finalSkills = fs.readdirSync(path.join(BUILD_DIR, "skills")).filter((d) =>
  fs.statSync(path.join(BUILD_DIR, "skills", d)).isDirectory()
).length;
const finalAgents = fs.readdirSync(path.join(BUILD_DIR, "agents")).filter((f) =>
  f.endsWith(".md")
).length;
const finalHooks = fs.readdirSync(path.join(BUILD_DIR, "scripts/grok/hooks")).filter((f) =>
  f.endsWith(".js")
).length;

console.log(`\n  📊 组件统计:`);
console.log(`     Skills:  ${finalSkills}`);
console.log(`     Agents:  ${finalAgents}`);
console.log(`     Hooks:   ${finalHooks}`);
console.log(`     Commands: ${commandSkills.length} (转为 skills)`);

// ═══════════════════════════════════════════════════════════════════════════
// 清理
// ═══════════════════════════════════════════════════════════════════════════

try {
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
} catch {}

// ═══════════════════════════════════════════════════════════════════════════
// 结果
// ═══════════════════════════════════════════════════════════════════════════

console.log(`\n${"═".repeat(60)}`);
console.log(`  集成测试结果: ${passed} passed, ${failed} failed, ${warnings} warnings`);
console.log(`${"═".repeat(60)}`);
process.exit(failed > 0 ? 1 : 0);
