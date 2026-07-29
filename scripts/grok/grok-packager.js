#!/usr/bin/env node

/**
 * TSP Grok Packager
 *
 * 生成 Grok 兼容的插件包：
 * - Skills: 直接复用，添加 provenance 元数据
 * - Commands: 转换为 namespaced skills
 * - Agents: 生成 Grok YAML frontmatter
 * - Rules/Profiles: 合成为 governance skill
 *
 * Usage:
 *   node scripts/grok/grok-packager.js [--output <dir>] [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const TSP_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.resolve(TSP_ROOT, '.grok-build');
const TSP_VERSION = require(path.join(TSP_ROOT, 'package.json')).version;
const ADAPTER_VERSION = '0.1.0';
const GENERATED_AT = new Date().toISOString();

// 确保输出目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 读取 YAML frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { metadata: {}, body: content };

  const metadata = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  }

  return { metadata, body: match[2] };
}

// 添加 provenance 元数据
function addProvenance(content, sourcePath) {
  const { metadata, body } = parseFrontmatter(content);

  const newMetadata = {
    ...metadata,
    tsp_source: sourcePath,
    tsp_version: TSP_VERSION,
    adapter_version: ADAPTER_VERSION,
    generated_at: GENERATED_AT,
  };

  // 替换 metadata 中的 Claude 引用
  for (const key of Object.keys(newMetadata)) {
    if (typeof newMetadata[key] === 'string') {
      newMetadata[key] = newMetadata[key]
        .replace(/~\/\.claude/g, '~/.grok')
        .replace(/\$\{CLAUDE_HOME\}/g, '${GROK_HOME}')
        .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, '${GROK_PLUGIN_ROOT}')
        .replace(/CLAUDE_HOME/g, 'GROK_HOME')
        .replace(/CLAUDE_PROJECT_ROOT/g, 'PROJECT_ROOT');
    }
  }

  const frontmatter = Object.entries(newMetadata)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  // 替换 body 中的 Claude 引用
  let finalBody = body
    .replace(/~\/\.claude/g, '~/.grok')
    .replace(/\$\{CLAUDE_HOME\}/g, '${GROK_HOME}')
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, '${GROK_PLUGIN_ROOT}')
    .replace(/CLAUDE_HOME/g, 'GROK_HOME')
    .replace(/CLAUDE_PROJECT_ROOT/g, 'PROJECT_ROOT');

  return `---\n${frontmatter}\n---\n${finalBody}`;
}

// 收集 skills
function collectSkills() {
  const skillsDir = path.join(TSP_ROOT, 'skills');
  const skills = [];

  if (!fs.existsSync(skillsDir)) return skills;

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      skills.push({
        name: entry.name,
        source: `skills/${entry.name}/SKILL.md`,
        content: fs.readFileSync(skillFile, 'utf-8'),
      });
    }
  }

  return skills;
}

// 收集 commands
function collectCommands() {
  const commandsDir = path.join(TSP_ROOT, 'commands');
  const commands = [];

  if (!fs.existsSync(commandsDir)) return commands;

  const entries = fs.readdirSync(commandsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    const name = entry.name.replace('.md', '');
    const commandFile = path.join(commandsDir, entry.name);
    commands.push({
      name,
      source: `commands/${entry.name}`,
      content: fs.readFileSync(commandFile, 'utf-8'),
    });
  }

  return commands;
}

// 收集 agents (roles + specialists)
function collectAgents() {
  const agents = [];

  // Role agents
  const rolesDir = path.join(TSP_ROOT, 'agents/roles');
  if (fs.existsSync(rolesDir)) {
    const entries = fs.readdirSync(rolesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

      const name = entry.name.replace('.md', '');
      const agentFile = path.join(rolesDir, entry.name);
      agents.push({
        name: `role-${name}`,
        source: `agents/roles/${entry.name}`,
        content: fs.readFileSync(agentFile, 'utf-8'),
        type: 'role',
      });
    }
  }

  // Specialist agents
  const specialistsDir = path.join(TSP_ROOT, 'agents/specialists');
  if (fs.existsSync(specialistsDir)) {
    const entries = fs.readdirSync(specialistsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

      const name = entry.name.replace('.md', '');
      const agentFile = path.join(specialistsDir, entry.name);
      agents.push({
        name: `specialist-${name}`,
        source: `agents/specialists/${entry.name}`,
        content: fs.readFileSync(agentFile, 'utf-8'),
        type: 'specialist',
      });
    }
  }

  return agents;
}

// 生成 Grok 兼容的 agent 文件
function generateGrokAgent(agent) {
  const content = addProvenance(agent.content, agent.source);

  // 确保有 Grok 需要的 frontmatter 字段
  const { metadata, body } = parseFrontmatter(content);

  if (!metadata.name) {
    metadata.name = agent.name;
  }
  if (!metadata.description) {
    metadata.description = `${agent.type} agent: ${agent.name}`;
  }

  const frontmatter = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  return `---\n${frontmatter}\n---\n${body}`;
}

// 生成 plugin manifest
function generateManifest(skills, commands, agents) {
  return {
    name: 'tsp',
    version: TSP_VERSION,
    description: 'Team Skills Platform - 角色化多 Agent 协作平台',
    author: 'Colin4k1024',
    license: 'MIT',
    homepage: 'https://github.com/Colin4k1024/tsp',
    engines: {
      grok: '>=0.1.0',
    },
    capabilities: {
      skills: true,
      commands: true,
      agents: true,
      hooks: false, // Phase 3
    },
    skills: skills.map((s) => `skills/${s.name}/SKILL.md`),
    commands: commands.map((c) => `skills/command-${c.name}/SKILL.md`),
    agents: agents.map((a) => `agents/${a.name}.md`),
    dependencies: {
      node: '>=18',
    },
  };
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const outputIndex = args.indexOf('--output');
  const outputDir = outputIndex !== -1 ? args[outputIndex + 1] : OUTPUT_DIR;

  console.log('TSP Grok Packager');
  console.log('=================');
  console.log(`TSP Version: ${TSP_VERSION}`);
  console.log(`Adapter Version: ${ADAPTER_VERSION}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  // 收集组件
  const skills = collectSkills();
  const commands = collectCommands();
  const agents = collectAgents();

  console.log(`Found:`);
  console.log(`  Skills: ${skills.length}`);
  console.log(`  Commands: ${commands.length}`);
  console.log(`  Agents: ${agents.length}`);
  console.log('');

  if (isDryRun) {
    console.log('Dry run - no files written');
    return;
  }

  // 确保输出目录存在
  ensureDir(outputDir);
  ensureDir(path.join(outputDir, 'skills'));
  ensureDir(path.join(outputDir, 'agents'));

  // 写入 skills
  for (const skill of skills) {
    const skillDir = path.join(outputDir, 'skills', skill.name);
    ensureDir(skillDir);
    const content = addProvenance(skill.content, skill.source);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
  }

  // 写入 commands (转换为 namespaced skills)
  for (const command of commands) {
    const skillDir = path.join(outputDir, 'skills', `command-${command.name}`);
    ensureDir(skillDir);
    const content = addProvenance(command.content, command.source);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
  }

  // 写入 agents
  for (const agent of agents) {
    const content = generateGrokAgent(agent);
    fs.writeFileSync(path.join(outputDir, 'agents', `${agent.name}.md`), content);
  }

  // 写入 manifest
  const manifest = generateManifest(skills, commands, agents);
  const manifestDir = path.join(outputDir, '.grok-plugin');
  ensureDir(manifestDir);
  fs.writeFileSync(
    path.join(manifestDir, 'plugin.json'),
    JSON.stringify(manifest, null, 2)
  );

  // 写入 provenance 记录
  const provenance = {
    tsp_version: TSP_VERSION,
    adapter_version: ADAPTER_VERSION,
    generated_at: GENERATED_AT,
    components: {
      skills: skills.length,
      commands: commands.length,
      agents: agents.length,
    },
    sources: {
      skills: skills.map((s) => s.source),
      commands: commands.map((c) => c.source),
      agents: agents.map((a) => a.source),
    },
  };
  fs.writeFileSync(
    path.join(outputDir, 'provenance.json'),
    JSON.stringify(provenance, null, 2)
  );

  console.log('Build complete!');
  console.log(`  Skills: ${skills.length}`);
  console.log(`  Commands (as skills): ${commands.length}`);
  console.log(`  Agents: ${agents.length}`);
  console.log(`  Output: ${outputDir}`);
}

main();
