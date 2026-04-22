const fs = require("fs");
const path = require("path");

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "team-skills-data.json"), "utf8"),
);

const plugin = data.plugin;
const TEAM_COMMAND_DEFINITIONS = data.teamCommandDefinitions;
const ECC_COMMAND_DEFINITIONS = data.eccCommandDefinitions;
const ALL_COMMAND_DEFINITIONS = [...TEAM_COMMAND_DEFINITIONS, ...ECC_COMMAND_DEFINITIONS];
const SPECIALIST_AGENT_DEFINITIONS = data.specialistAgentDefinitions;
const REQUIRED_TEMPLATE_FILES = data.requiredTemplateFiles;
const REQUIRED_SHARED_SKILLS = data.requiredSharedSkills;
const REQUIRED_ECC_SKILLS = data.requiredEccSkills;
const SHARED_SKILL_REFERENCE_FILES = data.sharedSkillReferenceFiles;
const REQUIRED_RULES = data.requiredRules;
const REQUIRED_RULE_PACK_FILES = data.requiredRulePackFiles;
const REQUIRED_EXTRA_FILES = data.requiredExtraFiles;
const ROLE_REQUIRED_FIELDS = data.roleRequiredFields;
const ROLE_OPTIONAL_LIST_FIELDS = data.roleOptionalListFields;

function repoRoot() {
  return path.resolve(__dirname, "..", "..");
}

function bullets(items, prefix = "- ") {
  return items.map((item) => `${prefix}${item}`).join("\n");
}

function optionalMarkdownSection(title, items) {
  if (!items.length) {
    return "";
  }
  return `\n## ${title}\n\n${bullets(items)}`;
}

function renderTemplate(templatePath, values) {
  const template = fs.readFileSync(templatePath, "utf8");
  const rendered = template.replace(/\$\{([^}]+)\}/g, (_, key) => values[key] ?? "");
  return `${rendered.trimEnd()}\n`;
}

function listDirectories(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }
  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function loadRoles(root = repoRoot()) {
  const rolesPath = path.join(root, "roles");
  const roleFiles = listDirectories(rolesPath)
    .map((roleId) => path.join(rolesPath, roleId, "role.yaml"))
    .filter((filePath) => fs.existsSync(filePath))
    .sort();
  const roles = roleFiles.map((roleFile) => {
    let role;
    try {
      role = JSON.parse(fs.readFileSync(roleFile, "utf8"));
    } catch (error) {
      throw new Error(`${roleFile} 不是合法的 JSON-compatible YAML: ${error}`);
    }
    for (const field of ROLE_REQUIRED_FIELDS) {
      if (!(field in role)) {
        throw new Error(`${roleFile} 缺少字段: ${field}`);
      }
    }
    for (const field of ROLE_OPTIONAL_LIST_FIELDS) {
      if (!(field in role)) {
        role[field] = [];
      }
      if (!Array.isArray(role[field])) {
        throw new Error(`${roleFile} 的 ${field} 必须为数组`);
      }
    }
    if (role.id !== path.basename(path.dirname(roleFile))) {
      throw new Error(`${roleFile} 的 id 必须与目录名一致`);
    }
    const expectedAgentFile = `${plugin.roleAgentDir}/${role.id}.md`;
    if (role.platform_bindings?.agent_file !== expectedAgentFile) {
      throw new Error(`${roleFile} 的 platform_bindings.agent_file 必须为 ${expectedAgentFile}`);
    }
    return role;
  });

  const roleIds = new Set(roles.map((role) => role.id));
  const allSkillIds = new Set(listDirectories(path.join(root, "skills")));
  const sharedSkillIds = allSkillIds;
  const eccSkillIds = allSkillIds;
  const domainSkillIds = allSkillIds;

  for (const role of roles) {
    const missingHandoffs = role.handoff_to.filter((item) => !roleIds.has(item));
    if (missingHandoffs.length) {
      throw new Error(`${role.id} 引用了不存在的 handoff_to: ${missingHandoffs.join(", ")}`);
    }
    const missingShared = role.recommended_shared_skills.filter((item) => !sharedSkillIds.has(item));
    if (missingShared.length) {
      throw new Error(`${role.id} 引用了不存在的 recommended_shared_skills: ${missingShared.join(", ")}`);
    }
    const missingEcc = role.recommended_ecc_skills.filter((item) => !eccSkillIds.has(item));
    if (missingEcc.length) {
      throw new Error(`${role.id} 引用了不存在的 recommended_ecc_skills: ${missingEcc.join(", ")}`);
    }
    const missingDomain = role.recommended_domain_skills.filter((item) => !domainSkillIds.has(item));
    if (missingDomain.length) {
      throw new Error(`${role.id} 引用了不存在的 recommended_domain_skills: ${missingDomain.join(", ")}`);
    }
    const missingRules = role.governance_rules.filter((item) => !fs.existsSync(path.join(root, item)));
    if (missingRules.length) {
      throw new Error(`${role.id} 引用了不存在的 governance_rules: ${missingRules.join(", ")}`);
    }
  }

  const commandNames = new Set(ALL_COMMAND_DEFINITIONS.map((item) => `/${item.name}`));
  for (const role of roles) {
    const invalidCommands = role.default_commands.filter((item) => !commandNames.has(item));
    if (invalidCommands.length) {
      throw new Error(`${role.id} 引用了未知命令: ${invalidCommands.join(", ")}`);
    }
  }

  return roles;
}

function shortText(text, limit = 56) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= limit) {
    return compact;
  }
  return `${compact.slice(0, limit - 1)}…`;
}

function roleValues(role) {
  const firstPrinciplesMd = bullets(role.first_principles || []);
  const socratic = role.socratic_questions || {};
  const workflowGatesMd = bullets(role.workflow_gates || []);
  const upstream = role.upstream_challenge || {};
  const mandatoryQuestions = upstream.mandatory_questions || [];
  const mandatoryQuestionsMd = mandatoryQuestions
    .map(
      (item) =>
        `- **${item.question}**\n  - 目标：${item.target}\n  - 升级：${item.escalation}`,
    )
    .join("\n");
  const upstreamMd = [
    `- **触发条件**：${upstream.trigger || ""}`,
    `- **必答问题**：\n${mandatoryQuestionsMd || "- 无"}`,
    `- **输出**：${upstream.output || ""}`,
    `- **门禁**：${upstream.gate || ""}`,
  ].join("\n");
  const socraticMd = [
    `- **Evidence（证据）**: ${socratic.evidence || ""}`,
    `- **Reasoning（推理）**: ${socratic.reasoning || ""}`,
    `- **Implications（影响）**: ${socratic.implications || ""}`,
  ].join("\n");
  return {
    role_id: role.id,
    display_name: role.display_name,
    mission: role.mission,
    inputs_md: bullets(role.inputs),
    outputs_md: bullets(role.outputs),
    handoff_md: bullets(role.handoff_to.map((item) => `\`${item}\``)),
    quality_gates_md: bullets(role.quality_gates),
    workflow_gates_md: workflowGatesMd,
    upstream_challenge_md: upstreamMd,
    default_commands_md: bullets(role.default_commands.map((item) => `\`${item}\``)),
    recommended_shared_skills_section: optionalMarkdownSection(
      "推荐共享技能",
      role.recommended_shared_skills.map((item) => `\`${item}\``),
    ),
    recommended_ecc_skills_section: optionalMarkdownSection(
      "推荐 ECC 技能",
      role.recommended_ecc_skills.map((item) => `\`${item}\``),
    ),
    recommended_domain_skills_section: optionalMarkdownSection(
      "推荐领域技能",
      role.recommended_domain_skills.map((item) => `\`${item}\``),
    ),
    governance_rules_section: optionalMarkdownSection(
      "治理规则",
      role.governance_rules.map((item) => `\`${item}\``),
    ),
    first_principles_md: firstPrinciplesMd,
    socratic_md: socraticMd,
  };
}

function specialistValues(spec) {
  return {
    specialist_name: spec.name,
    display_name: spec.display_name,
    mission: spec.mission,
    triggers_md: bullets(spec.triggers),
    outputs_md: bullets(spec.outputs),
    default_commands_md: bullets(spec.default_commands.map((item) => `\`${item}\``)),
    focus_rules_section: optionalMarkdownSection("重点规则", (spec.focus_rules || []).map((item) => `\`${item}\``)),
    focus_skills_section: optionalMarkdownSection("重点技能", (spec.focus_skills || []).map((item) => `\`${item}\``)),
  };
}

function roleOpenAiYaml(role) {
  let prompt = `Use $${role.id} to take the lead on the ${role.display_name} responsibilities for this task.`;
  if (role.recommended_shared_skills.length) {
    prompt += ` Start with ${role.recommended_shared_skills.map((item) => `$${item}`).join(", ")} when those shared capabilities apply.`;
  }
  if (role.recommended_ecc_skills.length) {
    prompt += ` Pull in ${role.recommended_ecc_skills.map((item) => `$${item}`).join(", ")} when deeper engineering execution or verification guidance is needed.`;
  }
  if (role.recommended_domain_skills.length) {
    prompt += ` Only layer in ${role.recommended_domain_skills.map((item) => `$${item}`).join(", ")} when the task explicitly depends on a private enterprise overlay.`;
  }
  return [
    "interface:",
    `  display_name: "${role.display_name}"`,
    `  short_description: "${shortText(role.mission, 40)}"`,
    `  default_prompt: "${prompt}"`,
    "",
  ].join("\n");
}

function renderSubAgentBlock(invocations) {
  if (!invocations.length) {
    return "";
  }
  const lines = [
    "",
    "## Claude 子 Agent 调用",
    "",
    "> 以下调用需要 `runSubagent` 工具。满足触发条件时，在当前对话中发起。",
  ];
  for (const invocation of invocations) {
    const pattern = invocation.pattern || "parallel";
    const patternLabel = pattern === "parallel" ? "并行调用" : pattern === "challenge" ? "需求挑战会" : pattern;
    lines.push(
      "",
      `### ${patternLabel}（${pattern}）`,
      "",
      `**触发条件**：${invocation.condition}`,
      "",
      "| 子 Agent | agentName | 职责范围 |",
      "|-----------|-----------|----------|",
    );
    for (const agent of invocation.agents || []) {
      const scopeText = agent.condition ? `${agent.scope}（${agent.condition}）` : agent.scope;
      lines.push(`| ${agent.name} | \`${agent.name}\` | ${scopeText} |`);
    }
    lines.push(
      "",
      "**Prompt 模板**（调用时将 `{task_context}` 替换为当前任务背景，`{role_name}` 替换为对应角色名，`{scope}` 替换为职责范围）：",
      "",
    );
    for (const promptLine of (invocation.prompt_template || "").split("\n")) {
      lines.push(promptLine ? `> ${promptLine}` : ">");
    }
    lines.push(
      "",
      `**汇总**：所有子 Agent 完成后，由 \`${invocation.merge_by}\` 将结果合并落盘到 ${(invocation.merge_into || []).join("、")}。`,
    );
  }
  return lines.join("\n");
}

function commandValues(commandDefinition, roleInvocations = {}) {
  const primaryRole = commandDefinition.primary_role;
  const invocations = roleInvocations[primaryRole] || [];
  const matching = invocations.filter((item) => item.command === `/${commandDefinition.name}`);
  return {
    command_name: commandDefinition.name,
    summary: commandDefinition.summary,
    primary_role: primaryRole,
    inputs_md: bullets(commandDefinition.inputs),
    outputs_md: bullets(commandDefinition.outputs),
    steps_md: commandDefinition.steps.map((step, index) => `${index + 1}. ${step}`).join("\n"),
    sub_agent_block: renderSubAgentBlock(matching),
  };
}

function workflowHelpCatalog() {
  const routeOrder = [
    "/team-intake",
    "/team-plan",
    "/handoff",
    "/team-execute",
    "/team-review",
    "/team-release",
    "/team-closeout",
  ];
  const commandByName = new Map(TEAM_COMMAND_DEFINITIONS.map((definition) => [definition.name, definition]));
  const commands = {};

  for (const routeCommand of routeOrder) {
    const name = routeCommand.replace(/^\//, "");
    const definition = commandByName.get(name);
    if (!definition) {
      continue;
    }

    commands[routeCommand] = {
      command: routeCommand,
      summary: definition.summary,
      primaryRole: definition.primary_role,
      requiredInputs: definition.inputs,
      expectedOutputs: definition.outputs,
      gateHints: (definition.steps || [])
        .slice(0, 3)
        .map((step) => step.replace(/\s+/g, " ").trim()),
    };
  }

  return `${JSON.stringify({
    schemaVersion: "team.workflow-help-catalog.v1",
    generatedFrom: "scripts/lib/team-skills-data.json",
    entryCommand: "/team-help",
    routeOrder,
    commands,
  }, null, 2)}\n`;
}

function codexPluginManifest() {
  return `${JSON.stringify({
    name: plugin.name,
    version: plugin.version,
    description: "开源角色化 Team Skills 平台，含 ECC harness skeleton、前端工程与 UI/UX 治理能力",
    skills: "./skills/",
    interface: {
      displayName: "Team Skills Platform",
      shortDescription: "角色化团队平台 + ECC harness 增强层",
      longDescription: "通过 Tech Lead 编排与专业角色分工统一需求、方案、研发、测试和发布协作，并提供 ECC 风格的 specialist agents、commands、rules、hooks skeleton 与前端治理能力。",
      developerName: plugin.authorName,
      category: plugin.category,
      capabilities: ["Read", "Write", "Interactive"],
      defaultPrompt: [
        "让 Tech Lead 帮我拆解一个新需求。",
        "调用 Planner 和 Frontend Engineer 规划一次 UI 改版。",
        "用 Code Reviewer 和 Security Reviewer 检查当前方案。",
      ],
      brandColor: "#0F766E",
    },
  }, null, 2)}\n`;
}

function claudePluginManifest() {
  return `${JSON.stringify({
    name: plugin.name,
    version: plugin.version,
    description: "Role-based Team Skills platform with an ECC-style harness skeleton, specialist agents, layered rules, commands, hooks skeleton, and frontend governance.",
    author: { name: plugin.authorName, url: plugin.authorUrl },
    homepage: plugin.homepage,
    repository: plugin.repository,
    license: plugin.license,
    keywords: plugin.keywords,
  }, null, 2)}\n`;
}

function claudeMarketplaceManifest(source) {
  return `${JSON.stringify({
    $schema: "https://anthropic.com/claude-code/marketplace.schema.json",
    name: plugin.name,
    description: "Role-based Team Skills platform with an ECC-style harness skeleton, specialist agents, commands, rules, hooks skeleton, contexts, and curated engineering skills.",
    owner: { name: plugin.authorName, email: "engineering@example.com" },
    metadata: { description: "Hybrid role platform plus ECC-style harness skeleton" },
    plugins: [{
      name: plugin.name,
      source,
      description: "Team-oriented workflow plugin with role agents, 27 specialist agents, ECC-inspired commands, layered rules, and hooks skeleton.",
      version: plugin.version,
      author: { name: plugin.authorName, email: "engineering@example.com" },
      homepage: plugin.homepage,
      repository: plugin.repository,
      license: plugin.license,
      keywords: plugin.keywords,
      category: "workflow",
      tags: plugin.keywords,
      strict: false,
    }],
  }, null, 2)}\n`;
}

function codexMarketplaceManifest() {
  return `${JSON.stringify({
    name: "engineering-team-marketplace",
    interface: { displayName: "Engineering Team Skills" },
    plugins: [{
      name: plugin.name,
      source: { source: "local", path: `./plugins/${plugin.name}` },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
      category: plugin.category,
    }],
  }, null, 2)}\n`;
}

function cursorPluginManifest() {
  return `${JSON.stringify({
    name: plugin.name,
    version: plugin.version,
    description: "开源角色化 Team Skills 平台，含 ECC harness skeleton、前端工程与 UI/UX 治理能力（Cursor 版）",
    platform: "cursor",
    rules_dir: "./rules/",
    skills_dir: "./skills/",
    agents_dir: "./agents/",
    commands_dir: "./commands/",
    interface: {
      displayName: "Team Skills Platform",
      shortDescription: "角色化团队平台 + ECC harness 增强层",
      longDescription: "通过 Tech Lead 编排与专业角色分工统一需求、方案、研发、测试和发布协作，并提供 ECC 风格的 specialist agents、commands、rules（MDC 格式）与前端治理能力。",
      developerName: plugin.authorName,
      category: plugin.category,
      capabilities: ["Read", "Write", "Interactive"],
      brandColor: "#0F766E",
    },
    author: { name: plugin.authorName, url: plugin.authorUrl },
    homepage: plugin.homepage,
    repository: plugin.repository,
    license: plugin.license,
    keywords: plugin.keywords,
  }, null, 2)}\n`;
}

function opencodeConfigManifest() {
  return `${JSON.stringify({
    name: plugin.name,
    version: plugin.version,
    description: "开源角色化 Team Skills 平台，含 ECC harness skeleton、前端工程与 UI/UX 治理能力（OpenCode 版）",
    platform: "opencode",
    agents_dir: "./agents/",
    skills_dir: "./skills/",
    commands_dir: "./commands/",
    rules_dir: "./rules/",
    interface: {
      displayName: "Team Skills Platform",
      shortDescription: "角色化团队平台 + ECC harness 增强层",
      longDescription: "通过 Tech Lead 编排与专业角色分工统一需求、方案、研发、测试和发布协作，提供 ECC 风格 specialist agents、commands 与前端治理能力。",
      developerName: plugin.authorName,
      category: plugin.category,
      capabilities: ["Read", "Write", "Interactive"],
      brandColor: "#0F766E",
    },
    author: { name: plugin.authorName, url: plugin.authorUrl },
    homepage: plugin.homepage,
    repository: plugin.repository,
    license: plugin.license,
    keywords: plugin.keywords,
  }, null, 2)}\n`;
}

function expectedGeneratedFiles(root = repoRoot()) {
  const roles = loadRoles(root);
  const roleInvocations = Object.fromEntries(
    roles
      .filter((role) => (role.sub_agent_invocations || []).length)
      .map((role) => [role.id, role.sub_agent_invocations]),
  );
  const expected = new Map();
  const roleSkillTemplate = path.join(root, "templates", "system", "role-skill.md.tmpl");
  const roleAgentTemplate = path.join(root, "templates", "system", "agent-role.md.tmpl");
  const specialistAgentTemplate = path.join(root, "templates", "system", "specialist-agent.md.tmpl");
  const commandTemplate = path.join(root, "templates", "system", "command.md.tmpl");

  for (const role of roles) {
    const values = roleValues(role);
    expected.set(path.join(root, "skills", "roles", role.id, "SKILL.md"), renderTemplate(roleSkillTemplate, values));
    expected.set(path.join(root, "skills", "roles", role.id, "agents", "openai.yaml"), roleOpenAiYaml(role));
    expected.set(path.join(root, plugin.roleAgentDir, `${role.id}.md`), renderTemplate(roleAgentTemplate, values));
  }

  for (const spec of SPECIALIST_AGENT_DEFINITIONS) {
    expected.set(
      path.join(root, plugin.specialistAgentDir, `${spec.name}.md`),
      renderTemplate(specialistAgentTemplate, specialistValues(spec)),
    );
  }

  for (const commandDefinition of ALL_COMMAND_DEFINITIONS) {
    expected.set(
      path.join(root, "commands", `${commandDefinition.name}.md`),
      renderTemplate(commandTemplate, commandValues(commandDefinition, roleInvocations)),
    );
  }

  expected.set(path.join(root, ".codex-plugin", "plugin.json"), codexPluginManifest());
  expected.set(path.join(root, ".claude-plugin", "plugin.json"), claudePluginManifest());
  expected.set(path.join(root, ".claude-plugin", "marketplace.json"), claudeMarketplaceManifest("./"));
  expected.set(path.join(root, "marketplace.json"), claudeMarketplaceManifest("./"));
  expected.set(path.join(root, ".agents", "plugins", "marketplace.json"), codexMarketplaceManifest());
  expected.set(path.join(root, ".cursor-plugin", "plugin.json"), cursorPluginManifest());
  expected.set(path.join(root, ".opencode-plugin", "config.json"), opencodeConfigManifest());
  expected.set(path.join(root, "scripts", "lib", "workflow-help-catalog.json"), workflowHelpCatalog());
  return expected;
}

function writeExpectedFiles(expected) {
  const written = [];
  for (const [filePath, content] of expected.entries()) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
    if (current !== content) {
      fs.writeFileSync(filePath, content, "utf8");
      written.push(filePath);
    }
  }
  return written;
}

function checkExpectedFiles(expected) {
  const mismatches = [];
  for (const [filePath, content] of expected.entries()) {
    const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
    if (current !== content) {
      mismatches.push(filePath);
    }
  }
  return mismatches;
}

function resetGeneratedRoleDirs(root = repoRoot()) {
  const generatedRoles = path.join(root, "skills", "roles");
  if (!fs.existsSync(generatedRoles)) {
    return;
  }
  for (const child of fs.readdirSync(generatedRoles, { withFileTypes: true })) {
    if (child.isDirectory()) {
      fs.rmSync(path.join(generatedRoles, child.name), { recursive: true, force: true });
    }
  }
}

function resetGeneratedAgents(root = repoRoot()) {
  for (const relativeDir of [plugin.roleAgentDir, plugin.specialistAgentDir]) {
    const targetDir = path.join(root, relativeDir);
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  }
  const legacyAgentsDir = path.join(root, "agents");
  if (fs.existsSync(legacyAgentsDir)) {
    const roleNames = new Set(loadRoles(root).map((role) => role.id));
    for (const entry of fs.readdirSync(legacyAgentsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".md") && roleNames.has(path.basename(entry.name, ".md"))) {
        fs.unlinkSync(path.join(legacyAgentsDir, entry.name));
      }
    }
  }
}

function resetGeneratedCommands(root = repoRoot()) {
  const commandsDir = path.join(root, "commands");
  if (!fs.existsSync(commandsDir)) {
    return;
  }
  const generatedCommandNames = new Set(ALL_COMMAND_DEFINITIONS.map((item) => `${item.name}.md`));
  for (const entry of fs.readdirSync(commandsDir, { withFileTypes: true })) {
    if (entry.isFile() && generatedCommandNames.has(entry.name)) {
      fs.unlinkSync(path.join(commandsDir, entry.name));
    }
  }
}

module.exports = {
  ALL_COMMAND_DEFINITIONS,
  REQUIRED_ECC_SKILLS,
  REQUIRED_EXTRA_FILES,
  REQUIRED_RULE_PACK_FILES,
  REQUIRED_RULES,
  REQUIRED_SHARED_SKILLS,
  REQUIRED_TEMPLATE_FILES,
  SHARED_SKILL_REFERENCE_FILES,
  SPECIALIST_AGENT_DEFINITIONS,
  checkExpectedFiles,
  expectedGeneratedFiles,
  loadRoles,
  repoRoot,
  resetGeneratedAgents,
  resetGeneratedCommands,
  resetGeneratedRoleDirs,
  writeExpectedFiles,
};
