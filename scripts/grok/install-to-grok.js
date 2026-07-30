#!/usr/bin/env node
/**
 * TSP → Grok 本地安装脚本
 *
 * 将 TSP 的 skills、agents、commands 安装到本地 ~/.grok/ 目录。
 *
 * Usage:
 *   node scripts/grok/install-to-grok.js                # 安装全部
 *   node scripts/grok/install-to-grok.js --dry-run      # 预览
 *   node scripts/grok/install-to-grok.js --uninstall     # 卸载
 *   node scripts/grok/install-to-grok.js --skills-only   # 只装 skills
 *   node scripts/grok/install-to-grok.js --prefix tsp    # 加前缀避免冲突
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const TSP_ROOT = path.resolve(__dirname, "../..");
const GROK_HOME = process.env.GROK_HOME || path.join(os.homedir(), ".grok");
const BUILD_DIR = path.join(TSP_ROOT, ".grok-build");
const TSP_VERSION = require(path.join(TSP_ROOT, "package.json")).version;

// 解析参数
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isUninstall = args.includes("--uninstall");
const skillsOnly = args.includes("--skills-only");
const prefixIndex = args.indexOf("--prefix");
const prefix = prefixIndex !== -1 ? args[prefixIndex + 1] + "/" : "";
const PREFIX_TAG = prefixIndex !== -1 ? args[prefixIndex + 1] : "tsp";

let installed = 0;
let skipped = 0;
let removed = 0;

function log(msg) {
  console.log(`  ${msg}`);
}

function ok(msg) {
  console.log(`  ✅ ${msg}`);
  installed++;
}

function skip(msg) {
  console.log(`  ⏭️  ${msg}`);
  skipped++;
}

function del(msg) {
  console.log(`  🗑️  ${msg}`);
  removed++;
}

// 标记文件为 TSP 安装
function writeStamp(dir) {
  const stamp = path.join(dir, ".tsp-installed.json");
  fs.writeFileSync(
    stamp,
    JSON.stringify({
      version: TSP_VERSION,
      installed_at: new Date().toISOString(),
      source: TSP_ROOT,
    }, null, 2)
  );
}

function isTspInstalled(dir) {
  return fs.existsSync(path.join(dir, ".tsp-installed.json"));
}

// ═══════════════════════════════════════════════════════════════════════════
// 卸载
// ═══════════════════════════════════════════════════════════════════════════

function uninstall() {
  console.log("\n🗑️  卸载 TSP Skills\n");

  const skillsDir = path.join(GROK_HOME, "skills");
  if (!fs.existsSync(skillsDir)) {
    console.log("  没有找到 skills 目录");
    return;
  }

  // 查找所有 TSP 安装的 skill
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillDir = path.join(skillsDir, entry.name);
    if (isTspInstalled(skillDir)) {
      if (isDryRun) {
        log(`[DRY] 将删除: ${entry.name}`);
      } else {
        fs.rmSync(skillDir, { recursive: true, force: true });
        del(entry.name);
      }
    }
  }

  // 卸载 agents
  const agentsDir = path.join(GROK_HOME, "bundled", "agents");
  if (fs.existsSync(agentsDir)) {
    for (const file of fs.readdirSync(agentsDir)) {
      if (!file.endsWith(".md")) continue;
      const agentPath = path.join(agentsDir, file);
      const content = fs.readFileSync(agentPath, "utf-8");
      if (content.includes("tsp_source:")) {
        if (isDryRun) {
          log(`[DRY] 将删除 agent: ${file}`);
        } else {
          fs.unlinkSync(agentPath);
          del(`agent: ${file}`);
        }
      }
    }
  }

  console.log(`\n  已移除 ${removed} 个组件`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 安装
// ═══════════════════════════════════════════════════════════════════════════

function install() {
  // Step 1: 运行 packager
  console.log("\n📦 构建 Grok 插件包\n");

  if (!fs.existsSync(BUILD_DIR)) {
    log("运行 grok-packager...");
    try {
      execSync(`node scripts/grok/grok-packager.js`, {
        encoding: "utf-8",
        timeout: 30000,
        cwd: TSP_ROOT,
        stdio: "pipe",
      });
      ok("Packager 构建完成");
    } catch (e) {
      console.error(`\n❌ Packager 构建失败: ${e.message}`);
      process.exit(1);
    }
  } else {
    skip("构建目录已存在，跳过 packager");
  }

  // Step 2: 安装 Skills
  console.log("\n📚 安装 Skills\n");

  const buildSkillsDir = path.join(BUILD_DIR, "skills");
  const grokSkillsDir = path.join(GROK_HOME, "skills");

  if (!fs.existsSync(buildSkillsDir)) {
    console.error("❌ 构建目录中没有 skills");
    process.exit(1);
  }

  fs.mkdirSync(grokSkillsDir, { recursive: true });

  const skillDirs = fs.readdirSync(buildSkillsDir).filter((d) =>
    fs.statSync(path.join(buildSkillsDir, d)).isDirectory()
  );

  let skillsInstalled = 0;
  let skillsSkipped = 0;

  for (const skillName of skillDirs) {
    const sourceDir = path.join(buildSkillsDir, skillName);
    const targetName = prefix ? `${prefix}${skillName}` : skillName;
    const targetDir = path.join(grokSkillsDir, targetName);

    // 检查是否已存在非 TSP 安装的同名 skill
    if (fs.existsSync(targetDir) && !isTspInstalled(targetDir)) {
      skip(`${targetName} (非 TSP 安装，跳过)`);
      skillsSkipped++;
      continue;
    }

    if (isDryRun) {
      log(`[DRY] ${targetName}`);
    } else {
      // 删除旧版本
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      // 复制
      fs.cpSync(sourceDir, targetDir, { recursive: true });
      writeStamp(targetDir);
      ok(targetName);
    }
    skillsInstalled++;
  }

  // Step 3: 安装 Agents
  if (!skillsOnly) {
    console.log("\n🤖 安装 Agents\n");

    const buildAgentsDir = path.join(BUILD_DIR, "agents");
    const grokAgentsDir = path.join(GROK_HOME, "bundled", "agents");

    fs.mkdirSync(grokAgentsDir, { recursive: true });

    if (fs.existsSync(buildAgentsDir)) {
      const agentFiles = fs.readdirSync(buildAgentsDir).filter((f) => f.endsWith(".md"));

      for (const agentFile of agentFiles) {
        const sourcePath = path.join(buildAgentsDir, agentFile);
        const targetName = prefix ? `${PREFIX_TAG}-${agentFile}` : agentFile;
        const targetPath = path.join(grokAgentsDir, targetName);

        if (isDryRun) {
          log(`[DRY] agent: ${targetName}`);
        } else {
          // 如果已存在且不是 TSP 安装的，跳过
          if (fs.existsSync(targetPath)) {
            const content = fs.readFileSync(targetPath, "utf-8");
            if (!content.includes("tsp_source:")) {
              skip(`agent: ${targetName} (非 TSP 安装，跳过)`);
              continue;
            }
          }
          fs.copyFileSync(sourcePath, targetPath);
          ok(`agent: ${targetName}`);
        }
      }
    }
  }

  // Step 4: 安装 Hooks 配置说明
  if (!skillsOnly) {
    console.log("\n🪝 Hooks 说明\n");
    log("Grok hooks 需要在 config.toml 中配置，当前 TSP hooks 默认禁用。");
    log("如需启用，请手动在 ~/.grok/config.toml 中添加 hook 配置。");
    log("Hook 脚本位置: scripts/grok/hooks/");

    const hooksDir = path.join(BUILD_DIR, "scripts/grok/hooks");
    if (fs.existsSync(hooksDir)) {
      const hookFiles = fs.readdirSync(hooksDir).filter((f) => f.endsWith(".js"));
      for (const hook of hookFiles) {
        log(`  - ${hook}`);
      }
    }
  }

  // 写入安装记录
  if (!isDryRun) {
    const installRecord = path.join(GROK_HOME, ".tsp-install-record.json");
    fs.writeFileSync(
      installRecord,
      JSON.stringify({
        version: TSP_VERSION,
        prefix: PREFIX_TAG,
        installed_at: new Date().toISOString(),
        skills: skillsInstalled,
        source: TSP_ROOT,
        build_dir: BUILD_DIR,
      }, null, 2)
    );
  }

  // 汇总
  console.log(`\n${"═".repeat(50)}`);
  if (isDryRun) {
    console.log(`  [DRY RUN] 将安装 ${skillsInstalled} 个 skills`);
  } else {
    console.log(`  ✅ 已安装 ${installed} 个组件`);
    console.log(`  ⏭️  跳过 ${skipped} 个`);
    console.log(`\n  重启 Grok 后生效`);
    console.log(`  验证: ls ~/.grok/skills/ | grep -c tsp`);
  }
  console.log(`${"═".repeat(50)}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════════════════════════════════════

console.log("╔══════════════════════════════════════════════════╗");
console.log("║  TSP → Grok 安装器                               ║");
console.log("╚══════════════════════════════════════════════════╝");
console.log(`  TSP: ${TSP_VERSION}`);
console.log(`  Grok: ${GROK_HOME}`);
console.log(`  模式: ${isDryRun ? "预览" : isUninstall ? "卸载" : "安装"}`);
console.log(`  前缀: ${prefix || "(无)"}`);

if (isUninstall) {
  uninstall();
} else {
  install();
}
