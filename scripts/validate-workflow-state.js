#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const PHASE_ORDER = [
  "intake",
  "requirement-challenge",
  "design-swarm",
  "design-review",
  "handoff-ready",
  "execute",
  "review",
  "release",
  "closeout",
];

const DELIVERY_PLAN_MARKERS = [
  ["dynamic discussion group", "动态分组讨论", "动态讨论组"],
  ["requirement challenge session", "需求挑战会"],
  ["design review board", "设计评审委员会"],
];

const BROWNFIELD_CONTEXT_MARKERS = [
  ["existing modules", "现有模块"],
  ["external integrations", "外部集成"],
  ["legacy constraints", "历史约束", "历史包袱", "技术债"],
];

const STORY_SLICE_MARKERS = [
  ["story slice plan", "story slices", "执行单元切片", "story-sized execution units"],
];

const HANDOFF_REQUIRED_FRONTMATTER = {
  artifact: "handoff",
};

const HANDOFF_REQUIRED_MARKERS = [
  ["current_phase"],
  ["target_phase"],
  ["readiness_status"],
  ["readiness proof", "执行前提证据", "implementation-readiness"],
  ["downstream challenge record", "下游质疑记录"],
];

const TARGET_PHASE_ACCEPTABLE_STATUSES = {
  execute: ["handoff-ready"],
  review: ["ready-for-review", "accepted"],
  release: ["release-ready", "accepted"],
  closeout: ["accepted"],
};

const TARGET_PHASE_ALLOWED_CURRENT = {
  // 同阶段值用于支持多轮迭代：例如 execute 阶段内切换下一个 story slice，
  // 或 review/release 阶段内因返工、补证据再次发起同阶段 handoff。
  execute: ["handoff-ready", "execute"],
  review: ["execute", "review"],
  release: ["review", "release"],
  closeout: ["release", "closeout"],
};

const REQUIRED_ARTIFACTS_BY_TARGET_PHASE = {
  execute: [
    ["prd.md", "prd"],
    ["delivery-plan.md", "delivery-plan"],
  ],
  review: [
    ["prd.md", "prd"],
    ["delivery-plan.md", "delivery-plan"],
    ["execute-log.md", "execute-log"],
  ],
  release: [
    ["prd.md", "prd"],
    ["delivery-plan.md", "delivery-plan"],
    ["execute-log.md", "execute-log"],
    ["test-plan.md", "test-plan"],
    ["launch-acceptance.md", "launch-acceptance"],
  ],
  closeout: [
    ["prd.md", "prd"],
    ["delivery-plan.md", "delivery-plan"],
    ["execute-log.md", "execute-log"],
    ["test-plan.md", "test-plan"],
    ["launch-acceptance.md", "launch-acceptance"],
    ["deployment-context.md", "deployment-context"],
    ["release-plan.md", "release-plan"],
  ],
};

class WorkflowValidationError extends Error {}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseFrontmatter(filePath) {
  const text = readText(filePath);
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    throw new WorkflowValidationError(`${filePath} 缺少 frontmatter`);
  }
  const fields = {};
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trim();
    if (!line || !line.includes(":")) {
      continue;
    }
    const index = line.indexOf(":");
    fields[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return fields;
}

function containsAny(text, markerGroup) {
  const lowered = text.toLowerCase();
  return markerGroup.some((marker) => lowered.includes(marker.toLowerCase()));
}

function extractSection(text, heading) {
  const lines = text.split("\n");
  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, "i");
  const nextHeadingPattern = /^##\s+/i;
  const startIndex = lines.findIndex((line) => headingPattern.test(line.trim()));
  if (startIndex === -1) {
    return "";
  }

  const sectionLines = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (nextHeadingPattern.test(lines[index].trim())) {
      break;
    }
    sectionLines.push(lines[index]);
  }

  return sectionLines.join("\n").trim();
}

function requireMarkersInText(text, markerGroups, label, filePath) {
  const missing = markerGroups.filter((group) => !containsAny(text, group)).map((group) => group.join("/"));
  if (missing.length) {
    throw new WorkflowValidationError(`${filePath} 缺少 ${label}: ${missing.join(", ")}`);
  }
}

function requireMarkers(filePath, markerGroups, label) {
  requireMarkersInText(readText(filePath), markerGroups, label, filePath);
}

function phaseIndex(phase) {
  const index = PHASE_ORDER.indexOf(phase);
  if (index === -1) {
    throw new WorkflowValidationError(`未知 workflow phase: ${phase}`);
  }
  return index;
}

function latestHandoff(taskDir) {
  const handoffDir = path.join(taskDir, "handoffs");
  if (!fs.existsSync(handoffDir)) {
    throw new WorkflowValidationError(`${taskDir} 缺少 handoffs 目录`);
  }
  const handoffs = fs.readdirSync(handoffDir).filter((name) => name.endsWith(".md")).sort();
  if (!handoffs.length) {
    throw new WorkflowValidationError(`${taskDir} 缺少 handoff 文件`);
  }
  return path.join(handoffDir, handoffs[handoffs.length - 1]);
}

function validateArtifactFrontmatter(filePath, expectedArtifact) {
  const fields = parseFrontmatter(filePath);
  if (fields.artifact !== expectedArtifact) {
    throw new WorkflowValidationError(`${filePath} artifact frontmatter 必须为 ${expectedArtifact}`);
  }
}

function validateRequiredArtifacts(taskDir, targetPhase) {
  const requiredArtifacts = REQUIRED_ARTIFACTS_BY_TARGET_PHASE[targetPhase];
  if (!requiredArtifacts) {
    throw new WorkflowValidationError(`未知 target phase: ${targetPhase}`);
  }

  const missing = requiredArtifacts
    .filter(([name]) => !fs.existsSync(path.join(taskDir, name)))
    .map(([name]) => name);
  if (missing.length) {
    throw new WorkflowValidationError(`${taskDir} 缺少进入 ${targetPhase} 的必需 artifact: ${missing.join(", ")}`);
  }

  for (const [name, artifact] of requiredArtifacts) {
    validateArtifactFrontmatter(path.join(taskDir, name), artifact);
  }
}

function validateDeliveryPlan(taskDir) {
  const deliveryPlan = path.join(taskDir, "delivery-plan.md");
  validateArtifactFrontmatter(deliveryPlan, "delivery-plan");
  requireMarkers(deliveryPlan, DELIVERY_PLAN_MARKERS, "workflow gate sections");
}

function validateStorySlicesForExecute(taskDir) {
  const deliveryPlan = path.join(taskDir, "delivery-plan.md");
  const text = readText(deliveryPlan);
  requireMarkersInText(text, STORY_SLICE_MARKERS, "story slice sections", deliveryPlan);

  const storySliceSection = extractSection(text, "Story Slice Plan");
  if (!storySliceSection) {
    throw new WorkflowValidationError(`${deliveryPlan} 缺少 Story Slice Plan 章节内容`);
  }

  const sliceLines = storySliceSection
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"));
  if (!sliceLines.length) {
    throw new WorkflowValidationError(`${deliveryPlan} Story Slice Plan 至少需要 1 条 slice 条目`);
  }

  const invalidLines = sliceLines.filter(
    (line) => {
      const parts = line.replace(/^-\s*/, "").split(/\s*\/\s*/);
      if (parts.length !== 3) {
        return true;
      }
      return !(
        /^slice:\s*\S(?:[\s\S]*\S)?$/i.test(parts[0]) &&
        /^owner:\s*\S(?:[\s\S]*\S)?$/i.test(parts[1]) &&
        /^handoff:\s*\S(?:[\s\S]*\S)?$/i.test(parts[2])
      );
    }
  );
  if (invalidLines.length) {
    throw new WorkflowValidationError(
      `${deliveryPlan} Story Slice Plan 条目必须包含 slice/owner/handoff: ${invalidLines.join(" | ")}`
    );
  }
}

function validateBrownfieldContextIfPresent(taskDir) {
  const deliveryPlan = path.join(taskDir, "delivery-plan.md");
  const text = readText(deliveryPlan);
  const brownfieldSection = extractSection(text, "Brownfield Context Snapshot");
  if (!brownfieldSection) {
    return;
  }

  requireMarkersInText(
    brownfieldSection,
    BROWNFIELD_CONTEXT_MARKERS,
    "brownfield context sections",
    deliveryPlan
  );
}

function validateArchDesignIfNeeded(taskDir) {
  const deliveryText = readText(path.join(taskDir, "delivery-plan.md")).toLowerCase();
  const fullstackMarkers = ["frontend-engineer", "backend-engineer", "architect"];
  if (fullstackMarkers.every((marker) => deliveryText.includes(marker))) {
    const archDesign = path.join(taskDir, "arch-design.md");
    if (!fs.existsSync(archDesign)) {
      throw new WorkflowValidationError(`${taskDir} 缺少 arch-design.md（全栈/架构任务必须提供）`);
    }
    validateArtifactFrontmatter(archDesign, "arch-design");
  }
}

function validateHandoff(taskDir, targetPhase) {
  const handoff = latestHandoff(taskDir);
  const fields = parseFrontmatter(handoff);
  for (const [key, expected] of Object.entries(HANDOFF_REQUIRED_FRONTMATTER)) {
    if (fields[key] !== expected) {
      throw new WorkflowValidationError(`${handoff} frontmatter ${key} 必须为 ${expected}`);
    }
  }
  requireMarkers(handoff, HANDOFF_REQUIRED_MARKERS, "handoff gate fields");

  const text = readText(handoff).toLowerCase();
  const currentPhase = fields.current_phase;
  const target = fields.target_phase;
  const readinessStatus = fields.readiness_status;
  const acceptedBy = fields.accepted_by;

  if (!currentPhase || !target || !readinessStatus || !acceptedBy) {
    throw new WorkflowValidationError(`${handoff} frontmatter 缺少 current_phase/target_phase/readiness_status/accepted_by`);
  }
  const acceptableStatuses = TARGET_PHASE_ACCEPTABLE_STATUSES[targetPhase] || [];
  if (!acceptableStatuses.includes(readinessStatus.toLowerCase())) {
    throw new WorkflowValidationError(
      `${handoff} readiness_status=${readinessStatus}，进入 ${targetPhase} 时必须为 ${acceptableStatuses.join("/")}`
    );
  }
  if (target !== targetPhase) {
    throw new WorkflowValidationError(`${handoff} target_phase=${target}，与期望 ${targetPhase} 不一致`);
  }
  const allowedCurrentPhases = TARGET_PHASE_ALLOWED_CURRENT[targetPhase];
  if (allowedCurrentPhases && !allowedCurrentPhases.includes(currentPhase)) {
    throw new WorkflowValidationError(
      `${handoff} current_phase=${currentPhase}，进入 ${targetPhase} 前必须为 ${allowedCurrentPhases.join("/")}`
    );
  }
  if (!allowedCurrentPhases && phaseIndex(currentPhase) >= phaseIndex(target)) {
    throw new WorkflowValidationError(`${handoff} current_phase=${currentPhase} 必须早于 target_phase=${target}`);
  }
  if (!text.includes("accepted") && !text.includes("接受")) {
    throw new WorkflowValidationError(`${handoff} 缺少下游接受/accepted 记录`);
  }
}

function validateTaskDir(taskDir, targetPhase = "execute") {
  if (!fs.existsSync(taskDir)) {
    throw new WorkflowValidationError(`任务目录不存在: ${taskDir}`);
  }
  validateRequiredArtifacts(taskDir, targetPhase);
  validateDeliveryPlan(taskDir);
  validateBrownfieldContextIfPresent(taskDir);
  validateArchDesignIfNeeded(taskDir);
  if (targetPhase === 'execute') {
    validateStorySlicesForExecute(taskDir);
  }
  if (["execute", "review", "release", "closeout"].includes(targetPhase)) {
    validateHandoff(taskDir, targetPhase === "execute" ? "execute" : targetPhase);
  }
}

function validateFixtureDirs(fixturesRoot) {
  const validDir = path.join(fixturesRoot, "workflow-valid");
  const invalidDirs = [
    path.join(fixturesRoot, "workflow-invalid-missing-handoff"),
    path.join(fixturesRoot, "workflow-invalid-missing-challenge"),
    path.join(fixturesRoot, "workflow-invalid-missing-design-review"),
  ];
  validateTaskDir(validDir, "execute");
  for (const invalidDir of invalidDirs) {
    try {
      validateTaskDir(invalidDir, "execute");
    } catch (error) {
      if (error instanceof WorkflowValidationError) {
        continue;
      }
      throw error;
    }
    throw new WorkflowValidationError(`${invalidDir} 预期校验失败，但实际通过`);
  }
}

function main(argv = process.argv.slice(2)) {
  if (!argv.length) {
    throw new WorkflowValidationError("Usage: node scripts/validate-workflow-state.js <task_dir> [--target-phase <phase>]");
  }
  const taskDir = path.resolve(argv[0]);
  let targetPhase = "execute";
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === "--target-phase" && argv[index + 1]) {
      targetPhase = argv[index + 1];
      index += 1;
    }
  }
  validateTaskDir(taskDir, targetPhase);
  console.log(`Workflow validation passed for ${argv[0]} -> ${targetPhase}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Workflow validation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

module.exports = {
  WorkflowValidationError,
  validateFixtureDirs,
  validateTaskDir,
};
