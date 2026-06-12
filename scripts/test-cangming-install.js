#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const CANGMING_HOME = path.join(os.homedir(), '.config', 'cangming');
const PLUGIN_DIR = path.join(CANGMING_HOME, 'plugins', 'team-skills-platform');

console.log('=== Cangming 安装验证 ===\n');

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

console.log('📁 目录结构检查:');
check('CANGMING_HOME 目录存在', fs.existsSync(CANGMING_HOME));
check('AGENTS.md 文件存在', fs.existsSync(path.join(CANGMING_HOME, 'AGENTS.md')));
check('agents 目录存在', fs.existsSync(path.join(CANGMING_HOME, 'agents')));
check('command 目录存在', fs.existsSync(path.join(CANGMING_HOME, 'command')));
check('plugins 目录存在', fs.existsSync(path.join(CANGMING_HOME, 'plugins')));
check('team-skills-platform 插件存在', fs.existsSync(PLUGIN_DIR));

console.log('\n📄 文件内容检查:');

const agentsMdPath = path.join(CANGMING_HOME, 'AGENTS.md');
if (fs.existsSync(agentsMdPath)) {
  const content = fs.readFileSync(agentsMdPath, 'utf8');
  check('AGENTS.md 包含团队技能平台标记', content.includes('<!-- team-skills-platform -->'));
  check('AGENTS.md 包含角色索引', content.includes('## 可用角色'));
  check('AGENTS.md 包含命令索引', content.includes('## 核心团队命令'));
  check('AGENTS.md 包含插件根路径', content.includes('## 插件根路径'));
}

console.log('\n👥 Agents 检查:');
const agentsDir = path.join(CANGMING_HOME, 'agents');
if (fs.existsSync(agentsDir)) {
  const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
  check(`agents 目录包含文件 (${agentFiles.length})`, agentFiles.length > 0);

  const roleAgents = ['tech-lead.md', 'product-manager.md', 'architect.md', 'frontend-engineer.md',
                      'backend-engineer.md', 'qa-engineer.md', 'devops-engineer.md'];
  for (const agent of roleAgents) {
    check(`角色 agent ${agent} 存在`, fs.existsSync(path.join(agentsDir, agent)));
  }

  const specialistAgents = agentFiles.filter(f => f.startsWith('specialist-'));
  check(`specialist agents 存在 (${specialistAgents.length})`, specialistAgents.length > 0);
}

console.log('\n📝 Commands 检查:');
const commandsDir = path.join(CANGMING_HOME, 'command');
if (fs.existsSync(commandsDir)) {
  const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
  check(`commands 目录包含文件 (${commandFiles.length})`, commandFiles.length > 0);

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
}

console.log('\n📜 Rules 检查:');
const rulesDir = path.join(PLUGIN_DIR, 'rules');
if (fs.existsSync(rulesDir)) {
  const ruleItems = fs.readdirSync(rulesDir);
  check(`rules 目录包含内容 (${ruleItems.length})`, ruleItems.length > 0);
  check('common 规则目录存在', fs.existsSync(path.join(rulesDir, 'common')));
}

// 总结
console.log('\n=== 测试总结 ===');
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 所有测试通过！Cangming 安装成功。');
  console.log('\n下一步:');
  console.log('1. 启动 Cangming: cangming');
  console.log('2. 查看可用角色: AGENTS.md 中包含所有角色索引');
  console.log('3. 执行团队命令: /team-intake, /team-plan 等');
  process.exit(0);
} else {
  console.log('\n⚠️  部分测试失败，请检查安装。');
  process.exit(1);
}
