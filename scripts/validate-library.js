#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const {
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
} = require("./lib/team-skills-platform");
const { emitPre, emitPost } = require("./lib/audit-logger");
const { validateFixtureDirs } = require("./validate-workflow-state");
const { validateFileReferences } = require("./validate-file-references");
const { validateSkillStructure } = require("./validate-skill-structure");
const { loadInstallManifests } = require("./lib/install-manifests");

const LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
const IGNORED_LINK_CHECK_DIRS = new Set(["node_modules", ".git", "dist", "build"]);

function ensureFilesExist(root, relativePaths) {
  const missing = relativePaths.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
  if (missing.length) {
    throw new Error(`缺少必需文件: ${JSON.stringify(missing)}`);
  }
}

function validateSkillDir(skillDir, root) {
  const relativeDir = path.relative(root, skillDir);
  const callId = emitPre({
    component: "skill",
    action: "validate_skill_dir",
    source: "validate-library",
    projectPath: root,
    payload: { skill_dir: relativeDir },
  });
  const skillFile = path.join(skillDir, "SKILL.md");
  const metaFile = path.join(skillDir, "agents", "openai.yaml");
  if (!fs.existsSync(skillFile) || !fs.existsSync(metaFile)) {
    emitPost({
      component: "skill",
      action: "validate_skill_dir",
      status: "error",
      source: "validate-library",
      projectPath: root,
      callId,
      payload: { skill_dir: relativeDir, reason: "required_files_missing" },
    });
    throw new Error(`技能缺少必需文件: ${relativeDir}`);
  }
  const text = fs.readFileSync(skillFile, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    throw new Error(`${path.relative(root, skillFile)} 缺少 frontmatter`);
  }
  const frontmatter = match[1];
  if (!frontmatter.includes("name:") || !frontmatter.includes("description:")) {
    throw new Error(`${path.relative(root, skillFile)} frontmatter 缺少 name/description`);
  }
  emitPost({
    component: "skill",
    action: "validate_skill_dir",
    status: "success",
    source: "validate-library",
    projectPath: root,
    callId,
    payload: { skill_dir: relativeDir },
  });
}

function validateSkillCatalog(root) {
  const callId = emitPre({
    component: "skill",
    action: "validate_skill_catalog",
    source: "validate-library",
    projectPath: root,
  });
  for (const skill of REQUIRED_SHARED_SKILLS) {
    const skillDir = path.join(root, "skills", skill);
    validateSkillDir(skillDir, root);
    for (const relativePath of SHARED_SKILL_REFERENCE_FILES[skill] || []) {
      if (!fs.existsSync(path.join(skillDir, relativePath))) {
        throw new Error(`${path.relative(root, skillDir)} 缺少引用文件: ${relativePath}`);
      }
    }
  }
  for (const skill of REQUIRED_ECC_SKILLS) {
    validateSkillDir(path.join(root, "skills", skill), root);
  }
  emitPost({
    component: "skill",
    action: "validate_skill_catalog",
    status: "success",
    source: "validate-library",
    projectPath: root,
    callId,
    payload: {
      shared_count: REQUIRED_SHARED_SKILLS.length,
      ecc_count: REQUIRED_ECC_SKILLS.length,
    },
  });
}

function validateHooks(root) {
  const hooksFile = path.join(root, "hooks", "hooks.json");
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(hooksFile, "utf8"));
  } catch (err) {
    throw new Error(`hooks/hooks.json の解析に失敗: ${err.message || err}`);
  }
  if (payload.hooks && typeof payload.hooks === "object") {
    for (const [eventKey, hookList] of Object.entries(payload.hooks)) {
      if (!Array.isArray(hookList)) {
        throw new Error(`hooks/hooks.json 的 hooks.${eventKey} 必须为数组`);
      }
    }
    return;
  }
  if (typeof payload.enabled !== "boolean") {
    throw new Error("hooks/hooks.json 的 enabled 必须为布尔值");
  }
  if (typeof payload.handlers !== "object" || payload.handlers === null) {
    throw new Error("hooks/hooks.json 的 handlers 必须为对象");
  }
  for (const target of Object.values(payload.handlers)) {
    if (typeof target !== "string") {
      throw new Error("hooks/hooks.json 的 handler 路径必须为字符串");
    }
    if (!fs.existsSync(path.join(root, target))) {
      throw new Error(`hooks/hooks.json 引用了不存在的脚本: ${target}`);
    }
  }
}

function listDefaultInstallSkillFiles(root) {
  const manifests = loadInstallManifests({ repoRoot: root });
  const strictPaths = new Set();

  for (const module of manifests.modules) {
    if (!module.defaultInstall || module.kind !== "skills" || !Array.isArray(module.paths)) {
      continue;
    }

    for (const modulePath of module.paths) {
      if (!modulePath.startsWith("skills/")) {
        continue;
      }

      const skillFile = path.join(root, modulePath, "SKILL.md");
      if (fs.existsSync(skillFile)) {
        strictPaths.add(path.relative(root, skillFile));
      }
    }
  }

  return [...strictPaths].sort();
}

function validateLinks(root, files) {
  const eccContextFiles = new Set([path.join(root, "hooks", "README.md")]);
  for (const filePath of files) {
    if (eccContextFiles.has(filePath)) {
      continue;
    }
    const text = fs.readFileSync(filePath, "utf8");
    for (const match of text.matchAll(LINK_RE)) {
      const target = match[1];
      if (
        target.startsWith("http://") ||
        target.startsWith("https://") ||
        target.startsWith("#") ||
        target.startsWith("mailto:")
      ) {
        continue;
      }
      const normalizedTarget = target.split("#", 1)[0];
      if (!normalizedTarget) {
        continue;
      }
      const linkPath = path.resolve(path.dirname(filePath), normalizedTarget);
      if (!fs.existsSync(linkPath)) {
        throw new Error(`${path.relative(root, filePath)} 存在失效链接: ${target}`);
      }
    }
  }
}

function collectLinkCheckedFiles(root) {
  const candidates = [
    path.join(root, "README.md"),
    path.join(root, "AGENTS.md"),
    path.join(root, "CLAUDE.md"),
  ].filter((filePath) => fs.existsSync(filePath));
  // Link-check only non-ECC skill dirs — ECC skills may contain example
  // links (e.g., sample ADR filenames) that don't exist in this project.
  const linkCheckedSkillDirs = [
    "skills/roles",
    "skills/api-contract",
    "skills/doc-architecture",
    "skills/frontend-engineering",
    "skills/frontend-ui-ux-system",
    "skills/agent-dev-workshop",
  ];
  const linkCheckedDirs = [
    "docs",
    "rules",
    "templates",
    ...linkCheckedSkillDirs,
    "agents/roles",
    "commands",
    "hooks",
    "contexts",
    "examples",
  ];
  const eccSourcedSpecialists = new Set([
    "chief-of-staff.md",
    "gan-evaluator.md",
    "gan-generator.md",
    "gan-planner.md",
    "healthcare-reviewer.md",
    "flutter-reviewer.md",
    "opensource-forker.md",
    "opensource-packager.md",
    "opensource-sanitizer.md",
  ]);
  const specialistsDir = path.join(root, "agents", "specialists");
  if (fs.existsSync(specialistsDir)) {
    for (const entry of fs.readdirSync(specialistsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".md") && !eccSourcedSpecialists.has(entry.name)) {
        candidates.push(path.join(specialistsDir, entry.name));
      }
    }
  }
  for (const relativeDir of linkCheckedDirs) {
    const directory = path.join(root, relativeDir);
    if (!fs.existsSync(directory)) {
      continue;
    }
    walkMarkdown(directory, candidates);
  }
  return [...new Set(candidates)];
}

function walkMarkdown(directory, out) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_LINK_CHECK_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkMarkdown(fullPath, out);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(fullPath);
    }
  }
}

function validateCounts(root) {
  const specialistDir = path.join(root, "agents", "specialists");
  const specialistFiles = fs.existsSync(specialistDir)
    ? fs.readdirSync(specialistDir).filter((name) => name.endsWith(".md"))
    : [];
  if (specialistFiles.length < SPECIALIST_AGENT_DEFINITIONS.length) {
    throw new Error(`specialist agents 至少应有 ${SPECIALIST_AGENT_DEFINITIONS.length} 个，当前为 ${specialistFiles.length}`);
  }
  const commandsDir = path.join(root, "commands");
  const commandFiles = fs.existsSync(commandsDir)
    ? fs.readdirSync(commandsDir).filter((name) => name.endsWith(".md"))
    : [];
  if (commandFiles.length < ALL_COMMAND_DEFINITIONS.length) {
    throw new Error(`commands 至少应有 ${ALL_COMMAND_DEFINITIONS.length} 个，当前为 ${commandFiles.length}`);
  }
}

function validateEntryDocs(root) {
  const userGuidePath = path.join(root, 'docs', 'guides', 'user-guide.md');
  const onboardingPath = path.join(root, 'docs', 'runbooks', 'project-onboarding.md');

  const userGuide = fs.readFileSync(userGuidePath, 'utf8');
  const onboarding = fs.readFileSync(onboardingPath, 'utf8');

  if (!userGuide.includes('/team-help')) {
    throw new Error('docs/guides/user-guide.md 必须包含 /team-help 作为主链入口说明');
  }

  if (!onboarding.includes('/team-help')) {
    throw new Error('docs/runbooks/project-onboarding.md 必须包含 /team-help 作为接入入口');
  }

  for (const requiredPath of [
    'docs/memory/project-context.md',
    'docs/memory/decisions.md',
    'docs/memory/lessons-learned.md',
  ]) {
    if (!onboarding.includes(requiredPath)) {
      throw new Error(`docs/runbooks/project-onboarding.md 必须说明初始化 ${requiredPath}`);
    }
  }
}

function validateActiveSurfaceDocs(root) {
  const activeDocs = [
    "README.md",
    "AGENTS.md",
    path.join("docs", "runbooks", "project-onboarding.md"),
    path.join("docs", "runbooks", "team-skills-usage.md"),
    path.join("docs", "runbooks", "runtime-capabilities-overview.md"),
    path.join("docs", "runbooks", "command-and-capability-matrix.md"),
    path.join("docs", "runbooks", "claude-quick-start.md"),
    path.join("docs", "runbooks", "codex-quick-start.md"),
    path.join("docs", "runbooks", "cursor-quick-start.md"),
    path.join("docs", "runbooks", "opencode-quick-start.md"),
  ];

  const bannedPatterns = [
    "session_start.py",
    "session_end.py",
    "observe.py",
    "pre_compact.py",
    "suggest_compact.py",
    "build_platform_artifacts.py",
    "validate_library.py",
    "skills/shared",
    "skills/ecc",
    "skills/company",
  ];

  for (const relativePath of activeDocs) {
    const absolutePath = path.join(root, relativePath);
    const content = fs.readFileSync(absolutePath, "utf8");
    for (const pattern of bannedPatterns) {
      if (content.includes(pattern)) {
        throw new Error(`${relativePath} 包含旧引用: ${pattern}`);
      }
    }
  }

  const teamHelpRequired = [
    "README.md",
    "AGENTS.md",
    path.join("docs", "runbooks", "project-onboarding.md"),
    path.join("docs", "runbooks", "team-skills-usage.md"),
    path.join("docs", "runbooks", "command-and-capability-matrix.md"),
    path.join("docs", "runbooks", "claude-quick-start.md"),
    path.join("docs", "runbooks", "codex-quick-start.md"),
    path.join("docs", "runbooks", "cursor-quick-start.md"),
    path.join("docs", "runbooks", "opencode-quick-start.md"),
  ];
  for (const relativePath of teamHelpRequired) {
    const content = fs.readFileSync(path.join(root, relativePath), "utf8");
    if (!content.includes("/team-help")) {
      throw new Error(`${relativePath} 必须包含 /team-help`);
    }
  }

  const artifactPersistRequired = [
    "README.md",
    path.join("docs", "runbooks", "project-onboarding.md"),
    path.join("docs", "runbooks", "team-skills-usage.md"),
    path.join("docs", "runbooks", "command-and-capability-matrix.md"),
    path.join("docs", "runbooks", "claude-quick-start.md"),
    path.join("docs", "runbooks", "codex-quick-start.md"),
    path.join("docs", "runbooks", "cursor-quick-start.md"),
    path.join("docs", "runbooks", "opencode-quick-start.md"),
  ];
  for (const relativePath of artifactPersistRequired) {
    const content = fs.readFileSync(path.join(root, relativePath), "utf8");
    if (!content.includes("artifact:persist")) {
      throw new Error(`${relativePath} 必须说明 artifact:persist 落盘`);
    }
  }
}

function main() {
  const root = repoRoot();
  const callId = emitPre({
    component: "script",
    action: "validate_library",
    source: "validate-library",
    projectPath: root,
  });

  const roles = loadRoles(root);
  if (roles.length !== 8) {
    emitPost({
      component: "script",
      action: "validate_library",
      status: "error",
      source: "validate-library",
      projectPath: root,
      callId,
      payload: { reason: "invalid_role_count", role_count: roles.length },
    });
    throw new Error(`角色数量应为 8，当前为 ${roles.length}`);
  }

  ensureFilesExist(root, REQUIRED_TEMPLATE_FILES);
  ensureFilesExist(root, REQUIRED_RULES);
  ensureFilesExist(root, REQUIRED_RULE_PACK_FILES);
  ensureFilesExist(root, REQUIRED_EXTRA_FILES);
  validateSkillCatalog(root);
  validateHooks(root);

  const expected = expectedGeneratedFiles(root);
  const mismatches = checkExpectedFiles(expected);
  if (mismatches.length) {
    throw new Error(
      "生成产物未同步，请先执行 scripts/build-platform-artifacts.js:\n" +
        mismatches.map((filePath) => `- ${path.relative(root, filePath)}`).join("\n"),
    );
  }

  validateCounts(root);
  validateEntryDocs(root);
  validateActiveSurfaceDocs(root);
  validateLinks(root, collectLinkCheckedFiles(root));
  const referenceReport = validateFileReferences({
    cwd: root,
    strict: true,
  });
  if (referenceReport.errorCount > 0) {
    throw new Error(
      "跨文件引用校验失败:\n"
      + referenceReport.errors
        .slice(0, 20)
        .map((issue) => `- ${issue.file}: ${issue.message}`)
        .join("\n"),
    );
  }
  const skillStructureReport = validateSkillStructure({
    cwd: root,
    strict: false,
    strictPaths: listDefaultInstallSkillFiles(root),
  });
  if (skillStructureReport.errorCount > 0) {
    throw new Error(
      "技能结构校验失败:\n"
      + skillStructureReport.errors
        .slice(0, 20)
        .map((issue) => `- ${issue.path}: ${issue.message}`)
        .join("\n"),
    );
  }
  validateFixtureDirs(path.join(root, "tests", "fixtures"));

  emitPost({
    component: "script",
    action: "validate_library",
    status: "success",
    source: "validate-library",
    projectPath: root,
    callId,
    payload: {
      roles: roles.length,
      shared_skills: REQUIRED_SHARED_SKILLS.length,
      ecc_skills: REQUIRED_ECC_SKILLS.length,
      specialist_agents: SPECIALIST_AGENT_DEFINITIONS.length,
      generated_artifacts: expected.size,
      reference_warnings: referenceReport.warningCount,
      skill_structure_warnings: skillStructureReport.warningCount,
    },
  });

  console.log("Validation passed.");
  console.log(`- Roles: ${roles.length}`);
  console.log(`- Shared skills: ${REQUIRED_SHARED_SKILLS.length}`);
  console.log(`- ECC skills: ${REQUIRED_ECC_SKILLS.length}`);
  console.log(`- Specialist agents: ${SPECIALIST_AGENT_DEFINITIONS.length}`);
  console.log(`- Generated artifacts: ${expected.size}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
