#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = require('../team-skills-data.json').plugin.name;

/**
 * 读取 Markdown 文件内容
 */
function readMarkdownFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}: ${error.message}`);
    return '';
  }
}

/**
 * 扫描目录中的所有 .md 文件
 */
function scanMarkdownFiles(dirPath, prefix = '') {
  const files = [];

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push({
        path: relativePath,
        fullPath,
        name: entry.name,
      });
    } else if (entry.isDirectory()) {
      files.push(...scanMarkdownFiles(fullPath, relativePath));
    }
  }

  return files;
}

/**
 * 生成规则索引部分
 */
function generateRulesIndex(rulesDir) {
  const lines = [];
  const commonDir = path.join(rulesDir, 'common');
  const zhDir = path.join(rulesDir, 'zh');

  lines.push('## 规则索引');
  lines.push('');
  lines.push('本项目包含以下规则文件，可通过 `@path` 语法引用：');
  lines.push('');

  // 通用规则
  if (fs.existsSync(commonDir)) {
    lines.push('### 通用规则 (rules/common/)');
    lines.push('');
    const commonFiles = scanMarkdownFiles(commonDir, 'rules/common');
    for (const file of commonFiles) {
      const content = readMarkdownFile(file.fullPath);
      const title = extractTitle(content, file.name);
      lines.push(`- **${title}**: \`@${file.path}\``);
    }
    lines.push('');
  }

  // 中文规则
  if (fs.existsSync(zhDir)) {
    lines.push('### 中文规则 (rules/zh/)');
    lines.push('');
    const zhFiles = scanMarkdownFiles(zhDir, 'rules/zh');
    for (const file of zhFiles) {
      const content = readMarkdownFile(file.fullPath);
      const title = extractTitle(content, file.name);
      lines.push(`- **${title}**: \`@${file.path}\``);
    }
    lines.push('');
  }

  // 语言特定规则
  const languageDirs = ['typescript', 'python', 'golang', 'java', 'kotlin', 'rust', 'swift', 'cpp', 'csharp', 'php', 'perl'];
  for (const lang of languageDirs) {
    const langDir = path.join(rulesDir, lang);
    if (fs.existsSync(langDir)) {
      lines.push(`### ${lang.charAt(0).toUpperCase() + lang.slice(1)} 规则 (rules/${lang}/)`);
      lines.push('');
      const langFiles = scanMarkdownFiles(langDir, `rules/${lang}`);
      for (const file of langFiles) {
        const content = readMarkdownFile(file.fullPath);
        const title = extractTitle(content, file.name);
        lines.push(`- **${title}**: \`@${file.path}\``);
      }
      lines.push('');
    }
  }

  return lines;
}

/**
 * 从 Markdown 内容中提取标题
 */
function extractTitle(content, fallback) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.slice(2).trim();
    }
  }
  return fallback.replace('.md', '');
}

/**
 * 生成角色索引部分
 */
function generateRolesIndex(agentsDir) {
  const lines = [];
  const rolesDir = path.join(agentsDir, 'roles');

  if (!fs.existsSync(rolesDir)) {
    return lines;
  }

  lines.push('## 可用角色');
  lines.push('');

  const roleDisplay = {
    'tech-lead': 'Tech Lead（技术负责人）',
    'product-manager': 'Product Manager（产品经理）',
    'project-manager': 'Project Manager（项目管理）',
    'architect': 'Architect（架构师）',
    'frontend-engineer': 'Frontend Engineer（前端开发）',
    'backend-engineer': 'Backend Engineer（后端开发）',
    'qa-engineer': 'QA Engineer（测试工程师）',
    'devops-engineer': 'DevOps Engineer（运维工程师）',
  };

  const roleFiles = fs.readdirSync(rolesDir)
    .filter(name => name.endsWith('.md'))
    .sort();

  for (const roleFile of roleFiles) {
    const roleName = path.parse(roleFile).name;
    const displayName = roleDisplay[roleName] || roleName;
    lines.push(`- **${displayName}**: \`plugins/${PLUGIN_NAME}/agents/roles/${roleFile}\``);
  }

  lines.push('');
  return lines;
}

/**
 * 生成命令索引部分
 */
function generateCommandsIndex(commandsDir) {
  const lines = [];

  if (!fs.existsSync(commandsDir)) {
    return lines;
  }

  lines.push('## 核心团队命令');
  lines.push('');
  lines.push('| 命令 | 用途 |');
  lines.push('|------|------|');

  const commandFiles = fs.readdirSync(commandsDir)
    .filter(name => name.endsWith('.md'))
    .sort();

  const commandDescriptions = {
    'team-help': '根据当前阶段、artifacts 与阻塞项推荐下一步主链命令',
    'team-intake': '接收需求并锁定目标、范围、约束',
    'team-plan': '拆解任务、角色分工、依赖与里程碑',
    'team-execute': '驱动研发角色在边界内实施',
    'team-review': '做方案、质量、测试和放行评审',
    'team-release': '做发布准备、上线检查与回滚保障',
    'team-closeout': '在观察窗口结束后做最终收口与 backlog 回写',
    'handoff': '在角色间做结构化交接',
    'plan': '创建实现计划',
    'tdd': '测试驱动开发',
    'code-review': '代码审查',
    'build-fix': '修复构建错误',
    'verify': '验证实现',
  };

  for (const commandFile of commandFiles) {
    const commandName = path.parse(commandFile).name;
    const description = commandDescriptions[commandName] || '团队命令';
    lines.push(`| \`/${commandName}\` | ${description} |`);
  }

  lines.push('');
  return lines;
}

/**
 * 生成技能索引部分
 */
function generateSkillsIndex(skillsDir) {
  const lines = [];

  if (!fs.existsSync(skillsDir)) {
    return lines;
  }

  lines.push('## 可用技能');
  lines.push('');
  lines.push('以下技能可通过 `skill` 工具加载：');
  lines.push('');

  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  for (const skillDir of skillDirs) {
    const skillFile = path.join(skillsDir, skillDir, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      const content = readMarkdownFile(skillFile);
      const title = extractTitle(content, skillDir);
      lines.push(`- **${title}**: \`skills/${skillDir}/SKILL.md\``);
    }
  }

  lines.push('');
  return lines;
}

/**
 * 生成完整的 AGENTS.md 内容
 */
function generateAgentsMd(root) {
  const lines = [];

  // 头部标记
  lines.push('<!-- team-skills-platform -->');
  lines.push('# Team Skills Platform — OpenCode 配置');
  lines.push('');
  lines.push('本文件由安装脚本自动生成，包含 TSP 平台的完整配置和规则。');
  lines.push('');

  // 插件根路径
  lines.push('## 插件路径');
  lines.push('');
  lines.push(`- 插件根目录: \`~/.config/opencode/plugins/${PLUGIN_NAME}/\``);
  lines.push(`- 规则目录: \`~/.config/opencode/plugins/${PLUGIN_NAME}/rules/\``);
  lines.push(`- 技能目录: \`~/.config/opencode/plugins/${PLUGIN_NAME}/skills/\``);
  lines.push(`- 命令目录: \`~/.config/opencode/command/\``);
  lines.push(`- Agent 目录: \`~/.config/opencode/agents/\``);
  lines.push('');

  // 规则索引
  const rulesDir = path.join(root, 'rules');
  lines.push(...generateRulesIndex(rulesDir));

  // 角色索引
  const agentsDir = path.join(root, 'agents');
  lines.push(...generateRolesIndex(agentsDir));

  // 命令索引
  const commandsDir = path.join(root, 'commands');
  lines.push(...generateCommandsIndex(commandsDir));

  // 技能索引
  const skillsDir = path.join(root, 'skills');
  lines.push(...generateSkillsIndex(skillsDir));

  // 使用说明
  lines.push('## 使用说明');
  lines.push('');
  lines.push('1. **引用规则**: 使用 `@rules/common/coding-style.md` 语法引用特定规则');
  lines.push('2. **加载技能**: 使用 `skill` 工具加载 `SKILL.md` 文件');
  lines.push('3. **执行命令**: 使用 `/team-intake` 等命令执行团队工作流');
  lines.push('4. **切换角色**: 使用 `@tech-lead` 等方式切换到特定角色');
  lines.push('');

  // 尾部标记
  lines.push(`<!-- end ${PLUGIN_NAME} -->`);

  return `${lines.join('\n')}\n`;
}

/**
 * 合并 AGENTS.md 内容
 */
function mergeAgentsMd(targetPath, newContent) {
  const markerEnd = `<!-- end ${PLUGIN_NAME} -->`;

  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, newContent, 'utf8');
    return;
  }

  const existing = fs.readFileSync(targetPath, 'utf8');
  if (existing.includes('<!-- team-skills-platform -->')) {
    const startIdx = existing.indexOf('<!-- team-skills-platform -->');
    let endIdx = existing.indexOf(markerEnd, startIdx);
    if (endIdx !== -1) {
      endIdx += markerEnd.length;
      if (existing[endIdx] === '\n') {
        endIdx += 1;
      }
      fs.writeFileSync(targetPath, `${existing.slice(0, startIdx)}${newContent}`, 'utf8');
      return;
    }
  }

  const separator = existing.endsWith('\n') ? '\n' : '\n\n';
  fs.writeFileSync(targetPath, `${existing}${separator}${newContent}`, 'utf8');
}

/**
 * 主函数
 */
function main() {
  const root = path.join(__dirname, '../../..');
  const opencodeHome = process.argv[2] || path.join(require('os').homedir(), '.config', 'opencode');

  console.log('Generating OpenCode AGENTS.md...');
  console.log(`Root: ${root}`);
  console.log(`Target: ${opencodeHome}`);

  const content = generateAgentsMd(root);
  const targetPath = path.join(opencodeHome, 'AGENTS.md');

  mergeAgentsMd(targetPath, content);

  console.log(`✅ Generated AGENTS.md at ${targetPath}`);
  console.log(`   Size: ${content.length} characters`);
  console.log(`   Lines: ${content.split('\n').length}`);
}

// 导出函数供其他脚本使用
module.exports = {
  generateAgentsMd,
  mergeAgentsMd,
  generateRulesIndex,
  generateRolesIndex,
  generateCommandsIndex,
  generateSkillsIndex,
};

// 如果直接运行此脚本
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('Error generating AGENTS.md:', error.message);
    process.exitCode = 1;
  }
}
