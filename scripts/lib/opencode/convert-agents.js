#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * 角色配置映射
 */
const ROLE_CONFIGS = {
  'tech-lead': {
    description: 'Tech Lead（技术负责人）- 负责需求 intake、任务拆解、角色分派、冲突决策与最终交付收口',
    tools: { '*': true },
    color: '#3B82F6',
  },
  'product-manager': {
    description: 'Product Manager（产品经理）- 负责需求澄清、PRD 编写、用户故事和验收标准定义',
    tools: { read: true, write: true, grep: true, glob: true, webfetch: true },
    color: '#10B981',
  },
  'project-manager': {
    description: 'Project Manager（项目管理）- 负责排期、依赖管理、里程碑跟踪和风险推进',
    tools: { read: true, write: true, grep: true, glob: true },
    color: '#F59E0B',
  },
  'architect': {
    description: 'Architect（架构师）- 负责 ADR、系统边界、接口与数据契约设计',
    tools: { read: true, write: true, grep: true, glob: true, webfetch: true },
    color: '#8B5CF6',
  },
  'frontend-engineer': {
    description: 'Frontend Engineer（前端开发）- 负责前端实现与自测',
    tools: { edit: true, write: true, bash: true, read: true, grep: true, glob: true },
    color: '#EC4899',
  },
  'backend-engineer': {
    description: 'Backend Engineer（后端开发）- 负责后端实现与自测',
    tools: { edit: true, write: true, bash: true, read: true, grep: true, glob: true },
    color: '#06B6D4',
  },
  'qa-engineer': {
    description: 'QA Engineer（测试工程师）- 负责测试计划、回归验证和放行建议',
    tools: { read: true, grep: true, glob: true, bash: true },
    color: '#F97316',
  },
  'devops-engineer': {
    description: 'DevOps Engineer（运维工程师）- 负责发布、监控、回滚与运行保障',
    tools: { edit: true, write: true, bash: true, read: true, grep: true, glob: true },
    color: '#6366F1',
  },
};

/**
 * Specialist 配置映射
 */
const SPECIALIST_CONFIGS = {
  'planner': {
    description: 'Planner - 实现规划专家',
    tools: { read: true, grep: true, glob: true },
    hidden: true,
  },
  'architect': {
    description: 'Architect - 系统设计专家',
    tools: { read: true, grep: true, glob: true },
    hidden: true,
  },
  'tdd-guide': {
    description: 'TDD Guide - 测试驱动开发专家',
    tools: { read: true, write: true, edit: true, bash: true, grep: true },
    hidden: true,
  },
  'code-reviewer': {
    description: 'Code Reviewer - 代码审查专家',
    tools: { read: true, grep: true, glob: true, bash: true },
    hidden: true,
  },
  'security-reviewer': {
    description: 'Security Reviewer - 安全审查专家',
    tools: { read: true, grep: true, glob: true },
    hidden: true,
  },
  'build-error-resolver': {
    description: 'Build Error Resolver - 构建错误修复专家',
    tools: { read: true, write: true, edit: true, bash: true, grep: true, glob: true },
    hidden: true,
  },
};

/**
 * 从 Markdown 内容中提取描述
 */
function extractDescription(content, fallback) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.slice(2).trim();
    }
  }
  return fallback;
}

/**
 * 为 Agent 文件添加 YAML front matter
 */
function addFrontMatter(filePath, config, isSpecialist = false) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.parse(filePath).name;

  // 检查是否已经有 front matter
  if (content.startsWith('---')) {
    console.log(`Skipping ${fileName} - already has front matter`);
    return content;
  }

  const description = config.description || extractDescription(content, fileName);
  const tools = config.tools || { '*': true };

  const frontMatter = [
    '---',
    `description: "${description.replace(/"/g, '\\"')}"`,
    `tools:`,
  ];

  // Format tools as YAML object
  for (const [tool, enabled] of Object.entries(tools)) {
    frontMatter.push(`  ${tool}: ${enabled}`);
  }

  if (config.color) {
    frontMatter.push(`color: "${config.color}"`);
  }

  if (config.hidden) {
    frontMatter.push(`hidden: true`);
  }

  frontMatter.push('---', '');

  return `${frontMatter.join('\n')}${content}`;
}

/**
 * 转换角色 agents
 */
function convertRoleAgents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    console.log(`Source directory not found: ${sourceDir}`);
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.md'))
    .sort();

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    const roleName = path.parse(file).name;

    const config = ROLE_CONFIGS[roleName] || {
      description: extractDescription(fs.readFileSync(sourcePath, 'utf8'), roleName),
      tools: { '*': true },
    };

    const content = addFrontMatter(sourcePath, config, false);
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log(`Converted role agent: ${file}`);
  }
}

/**
 * 转换 specialist agents
 */
function convertSpecialistAgents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    console.log(`Source directory not found: ${sourceDir}`);
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.md'))
    .sort();

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    const specialistName = path.parse(file).name;

    const config = SPECIALIST_CONFIGS[specialistName] || {
      description: extractDescription(fs.readFileSync(sourcePath, 'utf8'), specialistName),
      tools: { '*': true },
      hidden: true,
    };

    const content = addFrontMatter(sourcePath, config, true);
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log(`Converted specialist agent: ${file}`);
  }
}

/**
 * 主函数
 */
function main() {
  const root = path.join(__dirname, '../../..');
  const opencodeHome = process.argv[2] || path.join(require('os').homedir(), '.config', 'opencode');
  const pluginDir = path.join(opencodeHome, 'plugins', 'team-skills-platform');

  console.log('Converting agents for OpenCode...');
  console.log(`Root: ${root}`);
  console.log(`Target: ${opencodeHome}`);

  // 转换角色 agents
  const rolesSourceDir = path.join(root, 'agents', 'roles');
  const rolesTargetDir = path.join(pluginDir, 'agents', 'roles');
  convertRoleAgents(rolesSourceDir, rolesTargetDir);

  // 转换 specialist agents
  const specialistsSourceDir = path.join(root, 'agents', 'specialists');
  const specialistsTargetDir = path.join(pluginDir, 'agents', 'specialists');
  convertSpecialistAgents(specialistsSourceDir, specialistsTargetDir);

  // 同时复制到 opencodeHome/agents/ 目录
  const agentsTargetDir = path.join(opencodeHome, 'agents');
  fs.mkdirSync(agentsTargetDir, { recursive: true });

  // 复制角色 agents
  if (fs.existsSync(rolesTargetDir)) {
    for (const file of fs.readdirSync(rolesTargetDir)) {
      if (file.endsWith('.md')) {
        fs.copyFileSync(
          path.join(rolesTargetDir, file),
          path.join(agentsTargetDir, file)
        );
      }
    }
  }

  // 复制 specialist agents
  if (fs.existsSync(specialistsTargetDir)) {
    for (const file of fs.readdirSync(specialistsTargetDir)) {
      if (file.endsWith('.md')) {
        fs.copyFileSync(
          path.join(specialistsTargetDir, file),
          path.join(agentsTargetDir, `specialist-${file}`)
        );
      }
    }
  }

  console.log('✅ Agent conversion completed');
}

// 导出函数供其他脚本使用
module.exports = {
  addFrontMatter,
  convertRoleAgents,
  convertSpecialistAgents,
  ROLE_CONFIGS,
  SPECIALIST_CONFIGS,
};

// 如果直接运行此脚本
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('Error converting agents:', error.message);
    process.exitCode = 1;
  }
}
