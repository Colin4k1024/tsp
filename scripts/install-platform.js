#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  expectedGeneratedFiles,
  repoRoot,
  writeExpectedFiles,
} = require("./lib/team-skills-platform");
const { emitPre, emitPost } = require("./lib/audit-logger");
const { runPostInstallBridge } = require("../bin/lib/post-install-bridge");

const pluginData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "lib", "team-skills-data.json"), "utf8"),
);
const PLUGIN_NAME = pluginData.plugin.name;

function usage() {
  console.log(
    "Usage: node scripts/install-platform.js <codex|claude|cursor|opencode> " +
      "[--codex-home PATH] [--claude-home PATH] [--agents-home PATH] " +
      "[--cursor-home PATH] [--opencode-home PATH]",
  );
}

function ignoreJunk(sourcePath) {
  const name = path.basename(sourcePath);
  return name === ".DS_Store" || name === "__pycache__" || name.endsWith(".pyc");
}

function copyTree(src, dst) {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, {
    recursive: true,
    filter: (currentPath) => !ignoreJunk(currentPath),
  });
}

function collectInstallableSkillDirs(root) {
  const skillsRoot = path.join(root, "skills");
  const installable = new Map();

  if (!fs.existsSync(skillsRoot)) {
    return [];
  }

  for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const entryPath = path.join(skillsRoot, entry.name);
    if (fs.existsSync(path.join(entryPath, "SKILL.md"))) {
      installable.set(entry.name, entryPath);
      continue;
    }

    for (const nested of fs.readdirSync(entryPath, { withFileTypes: true })) {
      if (!nested.isDirectory()) {
        continue;
      }

      const nestedPath = path.join(entryPath, nested.name);
      if (fs.existsSync(path.join(nestedPath, "SKILL.md")) && !installable.has(nested.name)) {
        installable.set(nested.name, nestedPath);
      }
    }
  }

  return [...installable.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, sourcePath]) => ({ name, sourcePath }));
}

function installFlattenedSkills(root, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const skill of collectInstallableSkillDirs(root)) {
    copyTree(skill.sourcePath, path.join(targetDir, skill.name));
  }
}

function ensureGenerated(root) {
  writeExpectedFiles(expectedGeneratedFiles(root));
}

function mergePluginMarketplace(sourceMarketplace, targetMarketplace) {
  const source = JSON.parse(fs.readFileSync(sourceMarketplace, "utf8"));
  let target;
  if (fs.existsSync(targetMarketplace)) {
    target = JSON.parse(fs.readFileSync(targetMarketplace, "utf8"));
  } else {
    target = {
      name: source.name || "marketplace",
      interface: source.interface || {},
      plugins: [],
    };
  }

  const sourcePlugins = source.plugins || [];
  const targetPlugins = (target.plugins || []).filter((plugin) => plugin.name !== PLUGIN_NAME);
  if (sourcePlugins.length > 0) {
    targetPlugins.push(sourcePlugins[0]);
  }
  target.plugins = targetPlugins;

  for (const key of ["interface", "metadata", "owner", "$schema", "description"]) {
    if (key in source) {
      target[key] = source[key];
    }
  }

  fs.mkdirSync(path.dirname(targetMarketplace), { recursive: true });
  fs.writeFileSync(targetMarketplace, `${JSON.stringify(target, null, 2)}\n`, "utf8");
}

function replacePluginRootPlaceholders(value, pluginRoot) {
  if (!pluginRoot) {
    return value;
  }

  if (typeof value === "string") {
    return value.split("${CLAUDE_PLUGIN_ROOT}").join(pluginRoot);
  }

  if (Array.isArray(value)) {
    return value.map((item) => replacePluginRootPlaceholders(item, pluginRoot));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        replacePluginRootPlaceholders(nestedValue, pluginRoot),
      ]),
    );
  }

  return value;
}

function buildLegacyHookSignature(entry, pluginRoot) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return null;
  }

  const normalizedEntry = replacePluginRootPlaceholders(entry, pluginRoot);
  if (typeof normalizedEntry.matcher !== "string" || !Array.isArray(normalizedEntry.hooks)) {
    return null;
  }

  const hookSignature = normalizedEntry.hooks.map((hook) =>
    JSON.stringify({
      type: hook && typeof hook === "object" ? hook.type : undefined,
      command: hook && typeof hook === "object" ? hook.command : undefined,
      timeout: hook && typeof hook === "object" ? hook.timeout : undefined,
      async: hook && typeof hook === "object" ? hook.async : undefined,
    }),
  );

  return JSON.stringify({
    matcher: normalizedEntry.matcher,
    hooks: hookSignature,
  });
}

function getHookEntryAliases(entry, pluginRoot) {
  const aliases = [];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return aliases;
  }

  const normalizedEntry = replacePluginRootPlaceholders(entry, pluginRoot);
  if (typeof normalizedEntry.id === "string" && normalizedEntry.id.trim().length > 0) {
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
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    if ("id" in entry && typeof entry.id !== "string") {
      continue;
    }

    const aliases = getHookEntryAliases(entry, pluginRoot);
    if (aliases.some((alias) => seenEntries.has(alias))) {
      continue;
    }

    for (const alias of aliases) {
      seenEntries.add(alias);
    }

    mergedEntries.push(replacePluginRootPlaceholders(entry, pluginRoot));
  }

  return mergedEntries;
}

function registerPluginHooks(root, claudeHome) {
  const hooksConfigPath = path.join(root, "hooks", "hooks.json");
  if (!fs.existsSync(hooksConfigPath)) {
    console.log("Plugin hooks.json not found — skipping hook merge.");
    return;
  }

  const hooksConfig = JSON.parse(fs.readFileSync(hooksConfigPath, "utf8"));
  const incomingHooks = replacePluginRootPlaceholders(hooksConfig.hooks || {}, claudeHome);
  const settingsPath = path.join(claudeHome, "settings.json");
  const data = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, "utf8")) : {};
  const existingHooks =
    data.hooks && typeof data.hooks === "object" && !Array.isArray(data.hooks) ? data.hooks : {};

  const mergedHooks = { ...existingHooks };
  let changed = false;
  for (const [eventName, incomingEntries] of Object.entries(incomingHooks)) {
    const currentEntries = Array.isArray(existingHooks[eventName]) ? existingHooks[eventName] : [];
    const nextEntries = Array.isArray(incomingEntries) ? incomingEntries : [];
    const mergedEntries = mergeHookEntries(currentEntries, nextEntries, claudeHome);
    if (JSON.stringify(mergedEntries) !== JSON.stringify(currentEntries)) {
      changed = true;
    }
    mergedHooks[eventName] = mergedEntries;
  }

  if (!changed) {
    console.log("Plugin hooks already merged into settings.json.");
    return;
  }

  data.hooks = mergedHooks;
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Merged plugin hooks into ${settingsPath}`);
}

function registerCodexPlugin(codexHome) {
  const configPath = path.join(codexHome, "config.toml");
  const marker = `[plugins."${PLUGIN_NAME}"]`;
  const content = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";
  if (content.includes(marker)) {
    console.log("Codex plugin already registered in config.toml — skipping.");
    return;
  }
  const entry = `\n${marker}\nenabled = true\n`;
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${content.replace(/\n+$/, "")}${entry}`, "utf8");
  console.log(`Registered plugin in ${configPath}`);
}

const LEGACY_PYTHON_HOOK_FILES = [
  "session_start.py",
  "session_end.py",
  "cost_tracker.py",
  "observe.py",
  "mcp_health_check.py",
  "quality_gate.py",
  "format_suggestion.py",
  "doc_file_warning.py",
  "console_log_warning.py",
  "tmux_reminder.py",
  "git_push_reminder.py",
  "pr_created.py",
  "pre_compact.py",
  "suggest_compact.py",
];

function hookCommandIncludes(hook, needle) {
  return typeof hook?.command === "string" && hook.command.includes(needle);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function commandDirectlyRunsFile(command, filename) {
  if (typeof command !== "string" || !command.trim()) {
    return false;
  }

  const escapedFilename = escapeRegExp(filename);
  const directInvocation = new RegExp(`\\bnode\\s+(?:["'][^"']*${escapedFilename}["']|\\S*${escapedFilename})(?:\\s|$)`);
  return directInvocation.test(command);
}

const MANAGED_JS_HOOKS = Object.freeze([
  {
    id: "pre:all:harness-statusline",
    tag: "harness-statusline",
    filename: "harness-statusline.js",
  },
  {
    id: "pre:all:harness-context-monitor",
    tag: "harness-context-monitor",
    filename: "harness-context-monitor.js",
  },
  {
    id: "pre:all:harness-prompt-guard",
    tag: "harness-prompt-guard",
    filename: "harness-prompt-guard.js",
  },
]);

function isManagedJsHookGroup(group, hook, managedHooks = MANAGED_JS_HOOKS) {
  return managedHooks.some((managedHook) => {
    const ownsGroup = group?.id === managedHook.id;
    const ownsHook = hook?.tag === managedHook.tag;
    if (!ownsGroup && !ownsHook) {
      return false;
    }
    return commandDirectlyRunsFile(hook?.command, managedHook.filename);
  });
}

function pruneHookEntries(hooksSection, shouldRemove) {
  let changed = false;

  for (const [eventName, eventList] of Object.entries(hooksSection)) {
    if (!Array.isArray(eventList)) {
      continue;
    }

    const nextList = [];
    for (const group of eventList) {
      if (!group || typeof group !== "object" || Array.isArray(group)) {
        nextList.push(group);
        continue;
      }

      if (!Array.isArray(group.hooks)) {
        nextList.push(group);
        continue;
      }

      const nextHooks = group.hooks.filter((hook) => !shouldRemove(hook, group, eventName));
      if (nextHooks.length !== group.hooks.length) {
        changed = true;
      }

      if (nextHooks.length > 0) {
        nextList.push({ ...group, hooks: nextHooks });
      } else {
        changed = true;
      }
    }

    if (JSON.stringify(nextList) !== JSON.stringify(eventList)) {
      hooksSection[eventName] = nextList;
    }
  }

  return changed;
}

function hasHookFilename(hooksSection, eventName, filename) {
  const eventList = Array.isArray(hooksSection[eventName]) ? hooksSection[eventName] : [];
  return eventList.some((group) =>
    Array.isArray(group.hooks) && group.hooks.some((hook) => hookCommandIncludes(hook, filename)),
  );
}

function appendHookEntry(hooksSection, entry) {
  const eventList = Array.isArray(hooksSection[entry.event]) ? hooksSection[entry.event] : [];
  hooksSection[entry.event] = eventList;
  eventList.push({
    matcher: entry.matcher,
    description: entry.description,
    id: entry.id,
    hooks: [
      {
        type: "command",
        command: entry.command,
        timeout: entry.timeout,
        async: entry.async,
      },
    ],
  });
}

function installCodex(root, codexHome, agentsHome) {
  const pluginDir = path.join(codexHome, "plugins", PLUGIN_NAME);
  fs.mkdirSync(path.dirname(pluginDir), { recursive: true });

  for (const name of [
    ".codex-plugin",
    ".claude-plugin",
    "skills",
    "commands",
    "rules",
    "templates",
    "agents",
    "hooks",
    "contexts",
    "examples",
    "mcp-configs",
  ]) {
    const src = path.join(root, name);
    if (fs.existsSync(src)) {
      copyTree(src, path.join(pluginDir, name));
    }
  }

  const commandsTarget = path.join(codexHome, "commands");
  fs.mkdirSync(commandsTarget, { recursive: true });
  for (const name of fs.readdirSync(path.join(root, "commands"))) {
    const src = path.join(root, "commands", name);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, path.join(commandsTarget, name));
    }
  }
  console.log(`Copied commands to ${commandsTarget}`);

  const skillsTarget = path.join(codexHome, "skills");
  installFlattenedSkills(root, skillsTarget);
  console.log(`Copied skills to ${skillsTarget}`);

  const agentsTarget = path.join(codexHome, "agents");
  fs.mkdirSync(agentsTarget, { recursive: true });
  for (const agentSubdir of ["roles", "specialists"]) {
    const srcDir = path.join(root, "agents", agentSubdir);
    if (!fs.existsSync(srcDir)) {
      continue;
    }
    for (const name of fs.readdirSync(srcDir)) {
      const src = path.join(srcDir, name);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(agentsTarget, name));
      }
    }
  }
  console.log(`Copied agents to ${agentsTarget}`);

  registerCodexPlugin(codexHome);
  mergePluginMarketplace(
    path.join(root, ".agents", "plugins", "marketplace.json"),
    path.join(agentsHome, "plugins", "marketplace.json"),
  );
  console.log(`Installed Codex plugin to ${pluginDir}`);
  console.log(`Updated Codex marketplace at ${path.join(agentsHome, "plugins", "marketplace.json")}`);
}

function installAuditLib(root, claudeHome) {
  const srcLib = path.join(root, "scripts", "lib");
  const dstScripts = path.join(claudeHome, "scripts");
  const dstLib = path.join(dstScripts, "lib");
  fs.mkdirSync(dstLib, { recursive: true });
  for (const name of fs.readdirSync(srcLib)) {
    if (name.endsWith(".js")) {
      fs.copyFileSync(path.join(srcLib, name), path.join(dstLib, name));
    }
  }
  console.log(`Installed audit lib to ${dstLib}`);

  const srcScriptsHooksDir = path.join(root, "scripts", "hooks");
  const dstScriptsHooksDir = path.join(dstScripts, "hooks");
  if (fs.existsSync(srcScriptsHooksDir)) {
    copyTree(srcScriptsHooksDir, dstScriptsHooksDir);
    console.log(`Installed hook runtime scripts to ${dstScriptsHooksDir}`);
  }

  const srcQueryJs = path.join(root, "scripts", "query-audit-logs.js");
  if (fs.existsSync(srcQueryJs)) {
    fs.copyFileSync(srcQueryJs, path.join(dstScripts, "query-audit-logs.js"));
    console.log(`Installed query-audit-logs.js to ${path.join(dstScripts, "query-audit-logs.js")}`);
  }
}

function registerAuditHooks(claudeHome) {
  const settingsPath = path.join(claudeHome, "settings.json");
  const data = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, "utf8")) : {};
  const hooksSection = data.hooks || {};
  data.hooks = hooksSection;

  let changed = pruneHookEntries(
    hooksSection,
    (hook) => LEGACY_PYTHON_HOOK_FILES.some((filename) => hookCommandIncludes(hook, filename)),
  );

  const scriptsHooksDir = path.join(claudeHome, "scripts", "hooks");
  const desired = [
    {
      event: "SessionStart",
      matcher: "*",
      id: "session:start",
      description: "Load previous context and detect package manager on new session",
      filename: "session-start-bootstrap.js",
      command: `node "${path.join(scriptsHooksDir, "session-start-bootstrap.js")}"`,
    },
    {
      event: "PreToolUse",
      matcher: "Bash|Write|Edit|MultiEdit",
      id: "pre:governance-capture",
      description: "Capture governance events (secrets, policy violations, approval requests). Enable with ECC_GOVERNANCE_CAPTURE=1",
      filename: "governance-capture.js",
      command: `node "${path.join(scriptsHooksDir, "run-with-flags.js")}" "pre:governance-capture" "scripts/hooks/governance-capture.js" "standard,strict"`,
      timeout: 10,
    },
    {
      event: "PostToolUse",
      matcher: "Bash|Write|Edit|MultiEdit",
      id: "post:governance-capture",
      description: "Capture governance events from tool outputs. Enable with ECC_GOVERNANCE_CAPTURE=1",
      filename: "governance-capture.js",
      command: `node "${path.join(scriptsHooksDir, "run-with-flags.js")}" "post:governance-capture" "scripts/hooks/governance-capture.js" "standard,strict"`,
      timeout: 10,
    },
    {
      event: "Stop",
      matcher: "*",
      id: "stop:session-end",
      description: "Persist session state after each response (Stop carries transcript_path)",
      filename: "session-end.js",
      command: `node "${path.join(scriptsHooksDir, "run-with-flags.js")}" "stop:session-end" "scripts/hooks/session-end.js" "minimal,standard,strict"`,
      async: true,
      timeout: 10,
    },
    {
      event: "Stop",
      matcher: "*",
      id: "stop:cost-tracker",
      description: "Track token and cost metrics per session",
      filename: "cost-tracker.js",
      command: `node "${path.join(scriptsHooksDir, "run-with-flags.js")}" "stop:cost-tracker" "scripts/hooks/cost-tracker.js" "minimal,standard,strict"`,
      async: true,
      timeout: 10,
    },
  ];

  const changes = [];
  for (const entry of desired) {
    if (hasHookFilename(hooksSection, entry.event, entry.filename)) {
      continue;
    }
    appendHookEntry(hooksSection, entry);
    changes.push(`+ ${entry.event}: ${entry.id}`);
    changed = true;
  }

  if (changed) {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    if (changes.length > 0) {
      for (const change of changes) {
        console.log(`  ${change}`);
      }
      console.log(`Registered audit hooks in ${settingsPath}`);
    } else {
      console.log(`Cleaned legacy audit hooks in ${settingsPath}`);
    }
  } else {
    console.log("Audit hooks already registered — no settings.json changes needed.");
  }
}

function registerJsHooks(claudeHome) {
  const settingsPath = path.join(claudeHome, "settings.json");
  const data = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, "utf8")) : {};
  const hooksSection = data.hooks || {};
  data.hooks = hooksSection;
  let changed = false;

  const hd = path.join(claudeHome, "hooks");
  const desired = [
    {
      event: "PreToolUse",
      matcher: ".*",
      id: "pre:all:harness-statusline",
      command: `node "${path.join(hd, "harness-statusline.js")}"`,
      timeout: 5,
    },
    {
      event: "PreToolUse",
      matcher: ".*",
      id: "pre:all:harness-context-monitor",
      command: `node "${path.join(hd, "harness-context-monitor.js")}"`,
      timeout: 10,
    },
    {
      event: "PreToolUse",
      matcher: ".*",
      id: "pre:all:harness-prompt-guard",
      command: `node "${path.join(hd, "harness-prompt-guard.js")}"`,
      timeout: 5,
    },
  ];

  for (const event of ["PreToolUse", "PostToolUse"]) {
    const eventList = hooksSection[event] || [];
    const before = JSON.stringify(eventList);
    for (const group of eventList) {
      group.hooks = (group.hooks || []).filter((hook) => {
        return !isManagedJsHookGroup(group, hook);
      });
    }
    hooksSection[event] = eventList.filter((group) => (group.hooks || []).length > 0);
    if (before !== JSON.stringify(hooksSection[event])) {
      changed = true;
    }
  }

  const changes = [];
  for (const cfg of desired) {
    const eventList = hooksSection[cfg.event] || [];
    hooksSection[cfg.event] = eventList;
    const managedHook = {
      id: cfg.id,
      tag: path.basename(cfg.command, ".js"),
      filename: path.basename(cfg.command),
    };
    const already = eventList.some((group) =>
      group.id === cfg.id ||
      (group.hooks || []).some((hook) => isManagedJsHookGroup(group, hook, [managedHook])),
    );
    if (already) {
      continue;
    }
    eventList.push({
      id: cfg.id,
      matcher: cfg.matcher,
      hooks: [
        {
          type: "command",
          command: cfg.command,
          timeout: cfg.timeout,
        },
      ],
    });
    changes.push(`+ ${cfg.event}: ${cfg.id}`);
    changed = true;
  }

  if (changed) {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    if (changes.length > 0) {
      for (const change of changes) {
        console.log(`  ${change}`);
      }
      console.log(`Registered JS hooks in ${settingsPath}`);
    } else {
      console.log(`Cleaned stale JS hooks in ${settingsPath}`);
    }
  } else {
    console.log("JS hooks already registered — no settings.json changes needed.");
  }
}

const MDC_GLOBS = {
  java: ["**/*.java"],
  typescript: ["**/*.ts", "**/*.tsx"],
  python: ["**/*.py"],
  golang: ["**/*.go"],
  rust: ["**/*.rs"],
  kotlin: ["**/*.kt", "**/*.kts"],
};
const MDC_ALWAYS_APPLY = new Set(["", "common"]);

function mdDescription(content, fallback) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return trimmed.slice(2).trim();
    }
  }
  return fallback;
}

function writeMdc(src, dst, description, alwaysApply, globs) {
  const body = fs.readFileSync(src, "utf8");
  const lines = ["---"];
  lines.push(`description: "${description.replace(/"/g, '\\"')}"`);
  lines.push(`alwaysApply: ${alwaysApply ? "true" : "false"}`);
  if (globs.length > 0) {
    lines.push(`globs: [${globs.map((glob) => `"${glob}"`).join(", ")}]`);
  }
  lines.push("---", "");
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, `${lines.join("\n")}${body}`, "utf8");
}

function convertRulesToMdc(rulesDir, targetDir) {
  if (!fs.existsSync(rulesDir)) {
    return;
  }
  for (const item of fs.readdirSync(rulesDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (item.isFile() && item.name.endsWith(".md")) {
      const src = path.join(rulesDir, item.name);
      const description = mdDescription(fs.readFileSync(src, "utf8"), path.parse(item.name).name);
      writeMdc(src, path.join(targetDir, `${path.parse(item.name).name}.mdc`), description, true, []);
    } else if (item.isDirectory()) {
      const subdirKey = item.name;
      const alwaysApply = MDC_ALWAYS_APPLY.has(subdirKey);
      const globs = MDC_GLOBS[subdirKey] || [];
      const outSubdir = path.join(targetDir, subdirKey);
      fs.mkdirSync(outSubdir, { recursive: true });
      const srcDir = path.join(rulesDir, subdirKey);
      for (const mdName of fs.readdirSync(srcDir).filter((name) => name.endsWith(".md")).sort()) {
        const src = path.join(srcDir, mdName);
        const description = mdDescription(fs.readFileSync(src, "utf8"), path.parse(mdName).name);
        writeMdc(src, path.join(outSubdir, `${path.parse(mdName).name}.mdc`), description, alwaysApply, globs);
      }
    }
  }
}

const OPENCODE_AGENTS_MD_MARKER = "<!-- team-skills-platform -->";

function buildOpenCodeAgentsMd(root) {
  const agentsDir = path.join(root, "agents", "roles");
  const roleNames = fs.existsSync(agentsDir)
    ? fs
        .readdirSync(agentsDir)
        .filter((name) => name.endsWith(".md"))
        .map((name) => path.parse(name).name)
        .sort()
    : [];
  const roleDisplay = {
    "tech-lead": "Tech Lead（技术负责人）",
    "product-manager": "Product Manager（产品经理）",
    "project-manager": "Project Manager（项目管理）",
    architect: "Architect（架构师）",
    "frontend-engineer": "Frontend Engineer（前端开发）",
    "backend-engineer": "Backend Engineer（后端开发）",
    "qa-engineer": "QA Engineer（测试工程师）",
    "devops-engineer": "DevOps Engineer（运维工程师）",
  };
  const lines = [
    OPENCODE_AGENTS_MD_MARKER,
    "# Team Skills Platform — OpenCode Agent Index",
    "",
    "本文件由安装脚本自动生成。在 OpenCode 中与任何角色交互时，可直接引用下列角色和命令。",
    "",
    "## 可用角色",
    "",
  ];
  for (const role of roleNames) {
    lines.push(`- **${roleDisplay[role] || role}**: \`plugins/team-skills-platform/agents/roles/${role}.md\``);
  }
  lines.push(
    "",
    "## 核心团队命令",
    "",
    "| 命令 | 用途 |",
    "|------|------|",
    "| `/team-help` | 根据当前阶段、artifacts 与阻塞项推荐下一步主链命令 |",
    "| `/team-intake` | 接收需求并锁定目标、范围、约束 |",
    "| `/team-plan` | 拆解任务、角色分工、依赖与里程碑 |",
    "| `/team-execute` | 驱动研发角色在边界内实施 |",
    "| `/team-review` | 做方案、质量、测试和放行评审 |",
    "| `/team-release` | 做发布准备、上线检查与回滚保障 |",
    "| `/team-closeout` | 在观察窗口结束后做最终收口与 backlog 回写 |",
    "| `/handoff` | 在角色间做结构化交接 |",
    "",
    "## 插件根路径",
    "",
    "`~/.config/opencode/plugins/team-skills-platform/`",
    "",
    `<!-- end ${PLUGIN_NAME} -->`,
  );
  return `${lines.join("\n")}\n`;
}

function mergeOpenCodeAgentsMd(targetPath, newContent) {
  const markerEnd = `<!-- end ${PLUGIN_NAME} -->`;
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, newContent, "utf8");
    return;
  }
  const existing = fs.readFileSync(targetPath, "utf8");
  if (existing.includes(OPENCODE_AGENTS_MD_MARKER)) {
    const startIdx = existing.indexOf(OPENCODE_AGENTS_MD_MARKER);
    let endIdx = existing.indexOf(markerEnd, startIdx);
    if (endIdx !== -1) {
      endIdx += markerEnd.length;
      if (existing[endIdx] === "\n") {
        endIdx += 1;
      }
      fs.writeFileSync(targetPath, `${existing.slice(0, startIdx)}${newContent}`, "utf8");
      return;
    }
  }
  const separator = existing.endsWith("\n") ? "\n" : "\n\n";
  fs.writeFileSync(targetPath, `${existing}${separator}${newContent}`, "utf8");
}

function installClaude(root, claudeHome) {
  const pluginDir = path.join(claudeHome, "plugins", PLUGIN_NAME);
  fs.mkdirSync(path.dirname(pluginDir), { recursive: true });
  for (const name of [
    ".claude-plugin",
    "skills",
    "commands",
    "rules",
    "templates",
    "agents",
    "hooks",
    "contexts",
    "examples",
    "mcp-configs",
  ]) {
    copyTree(path.join(root, name), path.join(pluginDir, name));
  }
  for (const relativeDir of [path.join("scripts", "hooks"), path.join("scripts", "lib")]) {
    const src = path.join(root, relativeDir);
    if (fs.existsSync(src)) {
      copyTree(src, path.join(pluginDir, relativeDir));
    }
  }

  mergePluginMarketplace(path.join(root, "marketplace.json"), path.join(claudeHome, "marketplace.json"));

  const skillsDir = path.join(claudeHome, "skills");
  installFlattenedSkills(root, skillsDir);

  for (const relativeDir of [
    path.join("agents", "roles"),
    path.join("agents", "specialists"),
    "commands",
    "rules",
    "templates",
    "hooks",
    "contexts",
    "examples",
    "mcp-configs",
  ]) {
    copyTree(path.join(root, relativeDir), path.join(claudeHome, relativeDir));
  }

  installAuditLib(root, claudeHome);
  registerPluginHooks(root, claudeHome);
  registerAuditHooks(claudeHome);
  registerJsHooks(claudeHome);
  runPostInstallBridge({
    packageRoot: root,
    installRoot: claudeHome,
    target: "claude",
  });

  console.log(`Installed Claude plugin assets to ${pluginDir}`);
  console.log(`Updated Claude marketplace at ${path.join(claudeHome, "marketplace.json")}`);
}

function installCursor(root, cursorHome) {
  const pluginDir = path.join(cursorHome, "plugins", PLUGIN_NAME);
  fs.mkdirSync(path.dirname(pluginDir), { recursive: true });
  for (const name of [
    ".cursor-plugin",
    "skills",
    "commands",
    "rules",
    "templates",
    "agents",
    "hooks",
    "contexts",
    "examples",
    "mcp-configs",
  ]) {
    const src = path.join(root, name);
    if (fs.existsSync(src)) {
      copyTree(src, path.join(pluginDir, name));
    }
  }
  const mdcTarget = path.join(cursorHome, "rules");
  fs.mkdirSync(mdcTarget, { recursive: true });
  convertRulesToMdc(path.join(root, "rules"), mdcTarget);
  console.log(`Installed Cursor plugin to ${pluginDir}`);
  console.log(`Converted rules to MDC in ${mdcTarget}`);
}

function installOpenCode(root, opencodeHome) {
  const pluginDir = path.join(opencodeHome, "plugins", PLUGIN_NAME);
  fs.mkdirSync(path.dirname(pluginDir), { recursive: true });
  for (const name of [
    ".opencode-plugin",
    "skills",
    "commands",
    "rules",
    "templates",
    "agents",
    "hooks",
    "contexts",
    "examples",
    "mcp-configs",
  ]) {
    const src = path.join(root, name);
    if (fs.existsSync(src)) {
      copyTree(src, path.join(pluginDir, name));
    }
  }

  const commandTarget = path.join(opencodeHome, "command");
  fs.mkdirSync(commandTarget, { recursive: true });
  const commandsSrc = path.join(root, "commands");
  if (fs.existsSync(commandsSrc)) {
    for (const name of fs.readdirSync(commandsSrc)) {
      const src = path.join(commandsSrc, name);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(commandTarget, name));
      }
    }
  }

  const agentsTarget = path.join(opencodeHome, "agents");
  fs.mkdirSync(agentsTarget, { recursive: true });
  const agentsSrc = path.join(root, "agents");
  if (fs.existsSync(agentsSrc)) {
    for (const agentSubdir of ["roles", "specialists"]) {
      const agentSrcDir = path.join(agentsSrc, agentSubdir);
      if (!fs.existsSync(agentSrcDir)) {
        continue;
      }
      for (const name of fs.readdirSync(agentSrcDir)) {
        const src = path.join(agentSrcDir, name);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, path.join(agentsTarget, name));
        }
      }
    }
  }

  mergeOpenCodeAgentsMd(path.join(opencodeHome, "AGENTS.md"), buildOpenCodeAgentsMd(root));
  console.log(`Installed OpenCode plugin to ${pluginDir}`);
  console.log(`Updated AGENTS.md at ${path.join(opencodeHome, "AGENTS.md")}`);
  console.log(`Copied commands to ${commandTarget}`);
  console.log(`Copied agents to ${agentsTarget}`);
}

function parseArgs(argv) {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    usage();
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const platform = argv[0];
  const options = {
    platform,
    codexHome: null,
    claudeHome: null,
    agentsHome: null,
    cursorHome: null,
    opencodeHome: null,
  };

  const mappings = {
    "--codex-home": "codexHome",
    "--claude-home": "claudeHome",
    "--agents-home": "agentsHome",
    "--cursor-home": "cursorHome",
    "--opencode-home": "opencodeHome",
  };

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    const key = mappings[arg];
    if (!key) {
      throw new Error(`Unknown argument: ${arg}`);
    }
    if (index + 1 >= argv.length) {
      throw new Error(`Missing value for ${arg}`);
    }
    options[key] = argv[index + 1];
    index += 1;
  }

  if (!["codex", "claude", "cursor", "opencode"].includes(platform)) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return options;
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const root = repoRoot();
  const callId = emitPre({
    component: "script",
    action: "install_platform",
    source: "install_platform",
    projectPath: root,
    payload: { platform: options.platform },
  });

  try {
    ensureGenerated(root);
    if (options.platform === "codex") {
      const codexHome = options.codexHome || path.join(os.homedir(), ".codex");
      const agentsHome = options.agentsHome || path.join(os.homedir(), ".agents");
      installCodex(root, codexHome, agentsHome);
      emitPost({
        component: "script",
        action: "install_platform",
        status: "success",
        source: "install_platform",
        projectPath: root,
        callId,
        payload: { platform: "codex", codex_home: codexHome, agents_home: agentsHome },
      });
      return;
    }
    if (options.platform === "cursor") {
      const cursorHome = options.cursorHome || path.join(os.homedir(), ".cursor");
      installCursor(root, cursorHome);
      emitPost({
        component: "script",
        action: "install_platform",
        status: "success",
        source: "install_platform",
        projectPath: root,
        callId,
        payload: { platform: "cursor", cursor_home: cursorHome },
      });
      return;
    }
    if (options.platform === "opencode") {
      const opencodeHome = options.opencodeHome || path.join(os.homedir(), ".config", "opencode");
      installOpenCode(root, opencodeHome);
      emitPost({
        component: "script",
        action: "install_platform",
        status: "success",
        source: "install_platform",
        projectPath: root,
        callId,
        payload: { platform: "opencode", opencode_home: opencodeHome },
      });
      return;
    }
    const claudeHome = options.claudeHome || path.join(os.homedir(), ".claude");
    installClaude(root, claudeHome);
    emitPost({
      component: "script",
      action: "install_platform",
      status: "success",
      source: "install_platform",
      projectPath: root,
      callId,
      payload: { platform: "claude", claude_home: claudeHome },
    });
  } catch (error) {
    emitPost({
      component: "script",
      action: "install_platform",
      status: "error",
      source: "install_platform",
      projectPath: root,
      callId,
      payload: {
        platform: options.platform,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  isManagedJsHookGroup,
};
