'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { writeInstallState } = require('../install-state');
const { writeInstallAuditManifest } = require('../install-audit-manifest');

const PLUGIN_NAME = require('../team-skills-data.json').plugin.name;
const OPENCODE_AGENTS_MD_MARKER = '<!-- team-skills-platform -->';

function readJsonObject(filePath, label) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse ${label} at ${filePath}: ${error.message}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid ${label} at ${filePath}: expected a JSON object`);
  }

  return parsed;
}

function replacePluginRootPlaceholders(value, pluginRoot) {
  if (!pluginRoot) {
    return value;
  }

  if (typeof value === 'string') {
    return value.split('${CLAUDE_PLUGIN_ROOT}').join(pluginRoot);
  }

  if (Array.isArray(value)) {
    return value.map(item => replacePluginRootPlaceholders(item, pluginRoot));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        replacePluginRootPlaceholders(nestedValue, pluginRoot),
      ])
    );
  }

  return value;
}

function buildLegacyHookSignature(entry, pluginRoot) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }

  const normalizedEntry = replacePluginRootPlaceholders(entry, pluginRoot);

  if (typeof normalizedEntry.matcher !== 'string' || !Array.isArray(normalizedEntry.hooks)) {
    return null;
  }

  const hookSignature = normalizedEntry.hooks.map(hook => JSON.stringify({
    type: hook && typeof hook === 'object' ? hook.type : undefined,
    command: hook && typeof hook === 'object' ? hook.command : undefined,
    timeout: hook && typeof hook === 'object' ? hook.timeout : undefined,
    async: hook && typeof hook === 'object' ? hook.async : undefined,
  }));

  return JSON.stringify({
    matcher: normalizedEntry.matcher,
    hooks: hookSignature,
  });
}

function getHookEntryAliases(entry, pluginRoot) {
  const aliases = [];

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return aliases;
  }

  const normalizedEntry = replacePluginRootPlaceholders(entry, pluginRoot);

  if (typeof normalizedEntry.id === 'string' && normalizedEntry.id.trim().length > 0) {
    aliases.push(`id:${normalizedEntry.id.trim()}`);
  }

  const legacySignature = buildLegacyHookSignature(normalizedEntry, pluginRoot);
  if (legacySignature) {
    aliases.push(`legacy:${legacySignature}`);
  }

  aliases.push(`json:${JSON.stringify(normalizedEntry)}`);

  return aliases;
}

function mergeHookEntries(existingEntries, incomingEntries, pluginRoot) {
  const mergedEntries = [];
  const seenEntries = new Set();

  for (const entry of [...existingEntries, ...incomingEntries]) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }

    if ('id' in entry && typeof entry.id !== 'string') {
      continue;
    }

    const aliases = getHookEntryAliases(entry, pluginRoot);
    if (aliases.some(alias => seenEntries.has(alias))) {
      continue;
    }

    for (const alias of aliases) {
      seenEntries.add(alias);
    }
    mergedEntries.push(replacePluginRootPlaceholders(entry, pluginRoot));
  }

  return mergedEntries;
}

function findHooksSourcePath(plan, hooksDestinationPath) {
  const operation = plan.operations.find(item => item.destinationPath === hooksDestinationPath);
  return operation ? operation.sourcePath : null;
}

function buildMergedSettings(plan) {
  if (!plan.adapter || plan.adapter.target !== 'claude') {
    return null;
  }

  const pluginRoot = plan.targetRoot;
  const hooksDestinationPath = path.join(plan.targetRoot, 'hooks', 'hooks.json');
  const hooksSourcePath = findHooksSourcePath(plan, hooksDestinationPath) || hooksDestinationPath;
  if (!fs.existsSync(hooksSourcePath)) {
    return null;
  }

  const hooksConfig = readJsonObject(hooksSourcePath, 'hooks config');
  const incomingHooks = replacePluginRootPlaceholders(hooksConfig.hooks, pluginRoot);
  if (!incomingHooks || typeof incomingHooks !== 'object' || Array.isArray(incomingHooks)) {
    throw new Error(`Invalid hooks config at ${hooksSourcePath}: expected "hooks" to be a JSON object`);
  }

  const settingsPath = path.join(plan.targetRoot, 'settings.json');
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    settings = readJsonObject(settingsPath, 'existing settings');
  }

  const existingHooks = settings.hooks && typeof settings.hooks === 'object' && !Array.isArray(settings.hooks)
    ? settings.hooks
    : {};
  const mergedHooks = { ...existingHooks };

  for (const [eventName, incomingEntries] of Object.entries(incomingHooks)) {
    const currentEntries = Array.isArray(existingHooks[eventName]) ? existingHooks[eventName] : [];
    const nextEntries = Array.isArray(incomingEntries) ? incomingEntries : [];
    mergedHooks[eventName] = mergeHookEntries(currentEntries, nextEntries, pluginRoot);
  }

  const mergedSettings = {
    ...settings,
    hooks: mergedHooks,
  };

  return {
    settingsPath,
    mergedSettings,
    hooksDestinationPath,
    resolvedHooksConfig: {
      ...hooksConfig,
      hooks: incomingHooks,
    },
  };
}

function runExternalInstall(externalInstall) {
  const args = [];
  if (externalInstall.scriptPath) {
    args.push(externalInstall.scriptPath);
  } else if (externalInstall.script) {
    args.push(externalInstall.script);
  }
  if (Array.isArray(externalInstall.args)) {
    args.push(...externalInstall.args);
  }

  const command = externalInstall.command || 'node';
  const label = externalInstall.id || externalInstall.moduleId || command;
  console.log(`Running external install: ${label}`);

  const result = spawnSync(command, args, {
    cwd: externalInstall.cwd || process.cwd(),
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`External install failed: ${label}`);
  }
}

function mergePluginMarketplace(sourceMarketplace, targetMarketplace) {
  if (!fs.existsSync(sourceMarketplace)) {
    return;
  }

  const source = readJsonObject(sourceMarketplace, 'source marketplace');
  let target = {
    name: source.name || 'marketplace',
    interface: source.interface || {},
    plugins: [],
  };

  if (fs.existsSync(targetMarketplace)) {
    target = readJsonObject(targetMarketplace, 'target marketplace');
    if (!Array.isArray(target.plugins)) {
      target.plugins = [];
    }
  }

  const targetPlugins = target.plugins || [];
  const nextPluginsByName = new Map();
  for (const plugin of targetPlugins) {
    if (plugin && typeof plugin.name === 'string') {
      nextPluginsByName.set(plugin.name, plugin);
    }
  }
  for (const plugin of source.plugins || []) {
    if (plugin && typeof plugin.name === 'string') {
      nextPluginsByName.set(plugin.name, plugin);
    }
  }

  target.plugins = [...nextPluginsByName.values()];
  fs.mkdirSync(path.dirname(targetMarketplace), { recursive: true });
  fs.writeFileSync(targetMarketplace, JSON.stringify(target, null, 2) + '\n', 'utf8');
}

function registerCodexPlugin(plan) {
  const configPath = path.join(plan.targetRoot, 'config.toml');
  const marker = `[plugins."${PLUGIN_NAME}"]`;
  const content = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
  if (!content.includes(marker)) {
    const entry = `\n${marker}\nenabled = true\n`;
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, `${content.replace(/\n+$/, '')}${entry}`, 'utf8');
  }

  const homeDir = path.basename(plan.targetRoot) === '.codex'
    ? path.dirname(plan.targetRoot)
    : (process.env.HOME || os.homedir());
  const agentsHome = process.env.AGENTS_HOME_DIR || path.join(homeDir, '.agents');
  mergePluginMarketplace(
    path.join(plan.targetRoot, 'plugins', PLUGIN_NAME, '.agents', 'plugins', 'marketplace.json'),
    path.join(agentsHome, 'plugins', 'marketplace.json')
  );
}

function buildOpenCodeAgentsMd(pluginRoot) {
  const agentsDir = path.join(pluginRoot, 'agents', 'roles');
  const roleNames = fs.existsSync(agentsDir)
    ? fs
      .readdirSync(agentsDir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => path.parse(name).name)
      .sort()
    : [];
  const roleDisplay = {
    'tech-lead': 'Tech Lead（技术负责人）',
    'product-manager': 'Product Manager（产品经理）',
    'project-manager': 'Project Manager（项目管理）',
    architect: 'Architect（架构师）',
    'frontend-engineer': 'Frontend Engineer（前端开发）',
    'backend-engineer': 'Backend Engineer（后端开发）',
    'qa-engineer': 'QA Engineer（测试工程师）',
    'devops-engineer': 'DevOps Engineer（运维工程师）',
  };
  const lines = [
    OPENCODE_AGENTS_MD_MARKER,
    '# Team Skills Platform — OpenCode Agent Index',
    '',
    '本文件由安装脚本自动生成。在 OpenCode 中与任何角色交互时，可直接引用下列角色和命令。',
    '',
    '## 可用角色',
    '',
  ];
  for (const role of roleNames) {
    lines.push(`- **${roleDisplay[role] || role}**: \`plugins/${PLUGIN_NAME}/agents/roles/${role}.md\``);
  }
  lines.push(
    '',
    '## 核心团队命令',
    '',
    '| 命令 | 用途 |',
    '|------|------|',
    '| `/team-help` | 根据当前阶段、artifacts 与阻塞项推荐下一步主链命令 |',
    '| `/team-intake` | 接收需求并锁定目标、范围、约束 |',
    '| `/team-plan` | 拆解任务、角色分工、依赖与里程碑 |',
    '| `/team-execute` | 驱动研发角色在边界内实施 |',
    '| `/team-review` | 做方案、质量、测试和放行评审 |',
    '| `/team-release` | 做发布准备、上线检查与回滚保障 |',
    '| `/team-closeout` | 在观察窗口结束后做最终收口与 backlog 回写 |',
    '| `/handoff` | 在角色间做结构化交接 |',
    '',
    '## 插件根路径',
    '',
    '`~/.config/opencode/plugins/team-skills-platform/`',
    '',
    `<!-- end ${PLUGIN_NAME} -->`
  );
  return `${lines.join('\n')}\n`;
}

function mergeOpenCodeAgentsMd(targetPath, newContent) {
  const markerEnd = `<!-- end ${PLUGIN_NAME} -->`;
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, newContent, 'utf8');
    return;
  }
  const existing = fs.readFileSync(targetPath, 'utf8');
  if (existing.includes(OPENCODE_AGENTS_MD_MARKER)) {
    const startIdx = existing.indexOf(OPENCODE_AGENTS_MD_MARKER);
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

function mergeOpenCodeAgentsIndex(plan) {
  const pluginRoot = path.join(plan.targetRoot, 'plugins', PLUGIN_NAME);
  mergeOpenCodeAgentsMd(
    path.join(plan.targetRoot, 'AGENTS.md'),
    buildOpenCodeAgentsMd(pluginRoot)
  );
}

function applyTargetPostInstall(plan) {
  if (plan.adapter && plan.adapter.target === 'codex') {
    registerCodexPlugin(plan);
  }
  if (plan.adapter && plan.adapter.target === 'opencode') {
    mergeOpenCodeAgentsIndex(plan);
  }
}

function replaceOperationByDestination(operations, replacement) {
  let replaced = false;
  const nextOperations = operations.map((operation) => {
    if (operation.destinationPath !== replacement.destinationPath) {
      return { ...operation };
    }
    replaced = true;
    return {
      ...operation,
      ...replacement,
    };
  });

  if (!replaced) {
    nextOperations.push(replacement);
  }

  return nextOperations;
}

function appendOperationIfMissing(operations, operation) {
  if (operations.some((item) => item.destinationPath === operation.destinationPath)) {
    return operations.map((item) => ({ ...item }));
  }
  return [...operations.map((item) => ({ ...item })), operation];
}

function buildPlanWithRuntimeManagedOperations(plan, mergedSettingsPlan) {
  if (!mergedSettingsPlan) {
    return plan;
  }

  const renderedHooksConfig = JSON.stringify(mergedSettingsPlan.resolvedHooksConfig, null, 2) + '\n';
  const hooksOperation = {
    kind: 'render-template',
    moduleId: 'hooks-runtime',
    sourceRelativePath: path.join('hooks', 'hooks.json'),
    destinationPath: mergedSettingsPlan.hooksDestinationPath,
    strategy: 'rendered-hooks-config',
    ownership: 'managed',
    scaffoldOnly: false,
    renderedContent: renderedHooksConfig,
  };
  const settingsOperation = {
    kind: 'merge-json',
    moduleId: 'hooks-runtime',
    sourceRelativePath: 'settings.json',
    destinationPath: mergedSettingsPlan.settingsPath,
    strategy: 'merge-claude-settings',
    ownership: 'managed',
    scaffoldOnly: false,
    payload: {
      hooks: mergedSettingsPlan.mergedSettings.hooks || {},
    },
  };

  const rewriteOperations = (operations = []) => appendOperationIfMissing(
    replaceOperationByDestination(operations, hooksOperation),
    settingsOperation
  );

  return {
    ...plan,
    operations: rewriteOperations(plan.operations),
    statePreview: plan.statePreview
      ? {
        ...plan.statePreview,
        operations: rewriteOperations(plan.statePreview.operations),
      }
      : plan.statePreview,
  };
}

function applyInstallPlan(plan) {
  const mergedSettingsPlan = buildMergedSettings(plan);

  for (const operation of plan.operations) {
    fs.mkdirSync(path.dirname(operation.destinationPath), { recursive: true });
    fs.copyFileSync(operation.sourcePath, operation.destinationPath);
  }

  if (mergedSettingsPlan) {
    fs.mkdirSync(path.dirname(mergedSettingsPlan.hooksDestinationPath), { recursive: true });
    fs.writeFileSync(
      mergedSettingsPlan.hooksDestinationPath,
      JSON.stringify(mergedSettingsPlan.resolvedHooksConfig, null, 2) + '\n',
      'utf8'
    );
    fs.mkdirSync(path.dirname(mergedSettingsPlan.settingsPath), { recursive: true });
    fs.writeFileSync(
      mergedSettingsPlan.settingsPath,
      JSON.stringify(mergedSettingsPlan.mergedSettings, null, 2) + '\n',
      'utf8'
    );
  }

  for (const externalInstall of Array.isArray(plan.externalInstalls) ? plan.externalInstalls : []) {
    runExternalInstall(externalInstall);
  }

  applyTargetPostInstall(plan);

  const statefulPlan = buildPlanWithRuntimeManagedOperations(plan, mergedSettingsPlan);
  writeInstallState(statefulPlan.installStatePath, statefulPlan.statePreview);
  const { installManifestPath } = writeInstallAuditManifest(statefulPlan);

  return {
    ...statefulPlan,
    applied: true,
    installManifestPath,
  };
}

module.exports = {
  applyInstallPlan,
};
