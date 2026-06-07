#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const OPENCODE_HOME = path.join(os.homedir(), '.config', 'opencode');
const PLUGIN_DIR = path.join(OPENCODE_HOME, 'plugins', 'team-skills-platform');

console.log('=== OpenCode 安装验证 ===\n');

let passed = 0;
let failed = 0;

function check(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
    failed++;
  }
}

// 检查目录结构
console.log('📁 目录结构检查:');
check('OPENCODE_HOME 目录存在', fs.existsSync(OPENCODE_HOME));
check('AGENTS.md 文件存在', fs.existsSync(path.join(OPENCODE_HOME, 'AGENTS.md')));
check('opencode.json 文件存在', fs.existsSync(path.join(OPENCODE_HOME, 'opencode.json')));
check('agents 目录存在', fs.existsSync(path.join(OPENCODE_HOME, 'agents')));
check('command 目录存在', fs.existsSync(path.join(OPENCODE_HOME, 'command')));
check('plugins 目录存在', fs.existsSync(path.join(OPENCODE_HOME, 'plugins')));
check('team-skills-platform 插件存在', fs.existsSync(PLUGIN_DIR));
check('tsp-hooks.js 插件存在', fs.existsSync(path.join(OPENCODE_HOME, 'plugins', 'tsp-hooks.js')));

console.log('\n📄 文件内容检查:');

// 检查 AGENTS.md
const agentsMdPath = path.join(OPENCODE_HOME, 'AGENTS.md');
if (fs.existsSync(agentsMdPath)) {
  const content = fs.readFileSync(agentsMdPath, 'utf8');
  check('AGENTS.md 包含团队技能平台标记', content.includes('<!-- team-skills-platform -->'));
  check('AGENTS.md 包含规则索引', content.includes('## 规则索引'));
  check('AGENTS.md 包含角色索引', content.includes('## 可用角色'));
  check('AGENTS.md 包含命令索引', content.includes('## 核心团队命令'));
  check('AGENTS.md 包含技能索引', content.includes('## 可用技能'));
}

// 检查 opencode.json
const configPath = path.join(OPENCODE_HOME, 'opencode.json');
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  check('opencode.json 包含 instructions', Array.isArray(config.instructions));
  check('opencode.json 包含 plugin', Array.isArray(config.plugin));
  check('opencode.json 包含 permission', typeof config.permission === 'object');
}

console.log('\n👥 Agents 检查:');
const agentsDir = path.join(OPENCODE_HOME, 'agents');
if (fs.existsSync(agentsDir)) {
  const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
  check(`agents 目录包含文件 (${agentFiles.length})`, agentFiles.length > 0);

  // 检查是否有角色 agents
  const roleAgents = ['tech-lead.md', 'product-manager.md', 'architect.md', 'frontend-engineer.md',
                      'backend-engineer.md', 'qa-engineer.md', 'devops-engineer.md'];
  for (const agent of roleAgents) {
    check(`角色 agent ${agent} 存在`, fs.existsSync(path.join(agentsDir, agent)));
  }

  // 检查是否有 specialist agents
  const specialistAgents = agentFiles.filter(f => f.startsWith('specialist-'));
  check(`specialist agents 存在 (${specialistAgents.length})`, specialistAgents.length > 0);

  // 检查 agent 文件格式
  if (agentFiles.length > 0) {
    const sampleAgent = fs.readFileSync(path.join(agentsDir, agentFiles[0]), 'utf8');
    check('agent 文件包含 YAML front matter', sampleAgent.startsWith('---'));
  }
}

console.log('\n📝 Commands 检查:');
const commandsDir = path.join(OPENCODE_HOME, 'command');
if (fs.existsSync(commandsDir)) {
  const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
  check(`commands 目录包含文件 (${commandFiles.length})`, commandFiles.length > 0);

  // 检查核心命令
  const coreCommands = ['team-intake.md', 'team-plan.md', 'team-execute.md', 'team-review.md',
                        'team-release.md', 'handoff.md'];
  for (const cmd of coreCommands) {
    check(`核心命令 ${cmd} 存在`, fs.existsSync(path.join(commandsDir, cmd)));
  }
}

console.log('\n🎯 Skills 检查:');
const skillsDir = path.join(PLUGIN_DIR, 'skills');
if (fs.existsSync(skillsDir)) {
  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  check(`skills 目录包含目录 (${skillDirs.length})`, skillDirs.length > 0);

  // 检查是否有 SKILL.md 文件
  let skillsWithMd = 0;
  for (const dir of skillDirs.slice(0, 10)) {
    if (fs.existsSync(path.join(skillsDir, dir, 'SKILL.md'))) {
      skillsWithMd++;
    }
  }
  check(`skills 包含 SKILL.md 文件 (${skillsWithMd})`, skillsWithMd > 0);
}

console.log('\n📜 Rules 检查:');
const rulesDir = path.join(PLUGIN_DIR, 'rules');
if (fs.existsSync(rulesDir)) {
  const ruleItems = fs.readdirSync(rulesDir);
  check(`rules 目录包含内容 (${ruleItems.length})`, ruleItems.length > 0);

  // 检查通用规则
  check('common 规则目录存在', fs.existsSync(path.join(rulesDir, 'common')));
  check('zh 规则目录存在', fs.existsSync(path.join(rulesDir, 'zh')));
}

console.log('\n⚡ Hooks 检查:');
const hooksPath = path.join(OPENCODE_HOME, 'plugins', 'tsp-hooks.js');
if (fs.existsSync(hooksPath)) {
  const hooksContent = fs.readFileSync(hooksPath, 'utf8');
  check('tsp-hooks.js 包含插件函数', hooksContent.includes('module.exports = function tspHooks'));
  check('tsp-hooks.js 包含 tool.execute.before', hooksContent.includes("'tool.execute.before'"));
  check('tsp-hooks.js 包含 tool.execute.after', hooksContent.includes("'tool.execute.after'"));
}

// 总结
console.log('\n=== 测试总结 ===');
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 所有测试通过！OpenCode 安装成功。');
  console.log('\n下一步:');
  console.log('1. 启动 OpenCode: opencode');
  console.log('2. 查看可用角色: AGENTS.md 中包含所有角色索引');
  console.log('3. 执行团队命令: /team-intake, /team-plan 等');
  console.log('4. 加载技能: skill frontend-engineering');
  console.log('5. 引用规则: @rules/common/coding-style.md');
  process.exit(0);
} else {
  console.log('\n⚠️  部分测试失败，请检查安装。');
  process.exit(1);
}
