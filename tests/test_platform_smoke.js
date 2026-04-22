#!/usr/bin/env node
/**
 * Platform smoke tests — verify that the Team Skills Platform installation
 * left all critical paths in place under ~/.claude.
 */
const fs = require("fs");
const path = require("path");

const CLAUDE_HOME = path.join(process.env.HOME || "", ".claude");
const BRIDGE_BINARY = process.platform === "win32" ? "oris-claude-bridge.exe" : "oris-claude-bridge";

function _installed(rel) {
  return path.join(CLAUDE_HOME, rel);
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}

// ── Agent role prompts ──────────────────────────────────────────────────────

const ROLES = [
  "tech-lead",
  "product-manager",
  "project-manager",
  "architect",
  "frontend-engineer",
  "backend-engineer",
  "qa-engineer",
  "devops-engineer",
];

for (const role of ROLES) {
  assert(
    fs.existsSync(_installed(`agents/roles/${role}.md`)),
    `Role agent missing: agents/roles/${role}.md`
  );
}

// ── Specialist agents ───────────────────────────────────────────────────────

const SPECIALISTS = [
  "planner.md",
  "tdd-guide.md",
  "code-reviewer.md",
  "build-error-resolver.md",
  "loop-operator.md",
  "harness-optimizer.md",
];

for (const specialist of SPECIALISTS) {
  assert(
    fs.existsSync(_installed(`agents/specialists/${specialist}`)),
    `Specialist agent missing: agents/specialists/${specialist}`
  );
}

// ── Team commands ───────────────────────────────────────────────────────────

const COMMANDS = [
  "team-help.md",
  "team-intake.md",
  "team-plan.md",
  "team-execute.md",
  "team-review.md",
  "team-release.md",
  "handoff.md",
  "plan.md",
  "tdd.md",
  "code-review.md",
  "build-fix.md",
  "verify.md",
];

for (const cmd of COMMANDS) {
  assert(
    fs.existsSync(_installed(`commands/${cmd}`)),
    `Command file missing: commands/${cmd}`
  );
}

// ── Skills ──────────────────────────────────────────────────────────────────

const SKILLS = [
  "tech-lead",
  "architect",
  "frontend-engineer",
  "backend-engineer",
  "qa-engineer",
];

for (const skill of SKILLS) {
  assert(
    fs.existsSync(_installed(`skills/${skill}/SKILL.md`)),
    `Role skill missing: skills/${skill}/SKILL.md`
  );
}

// ── Plugin and marketplace ──────────────────────────────────────────────────

assert(
  fs.existsSync(_installed("plugins/team-skills-platform")),
  "Plugin manifest directory missing: plugins/team-skills-platform"
);

const marketplacePath = _installed("marketplace.json");
assert(fs.existsSync(marketplacePath), "marketplace.json missing");
if (fs.existsSync(marketplacePath)) {
  try {
    const data = JSON.parse(fs.readFileSync(marketplacePath, "utf-8"));
    const names = (data.plugins || []).map((p) => p.name);
    assert(
      names.includes("team-skills-platform"),
      `Plugin not in marketplace: ${JSON.stringify(names)}`
    );
  } catch (e) {
    failed++;
    console.error(`FAIL: marketplace.json parse error: ${e.message}`);
  }
}

// ── Rules ───────────────────────────────────────────────────────────────────

const RULES = [
  "team-operating-model.md",
  "handoff-contract.md",
  "artifact-standards.md",
  "escalation-policy.md",
];

for (const ruleFile of RULES) {
  assert(
    fs.existsSync(_installed(`rules/${ruleFile}`)),
    `Rule file missing: rules/${ruleFile}`
  );
}

// ── Bridge crate and binary ─────────────────────────────────────────────────

assert(
  fs.existsSync(_installed("crates/oris-claude-bridge/Cargo.toml")),
  "Bridge crate missing: crates/oris-claude-bridge/Cargo.toml"
);

assert(
  fs.existsSync(_installed(`crates/oris-claude-bridge/target/release/${BRIDGE_BINARY}`)),
  `Bridge binary missing: crates/oris-claude-bridge/target/release/${BRIDGE_BINARY}`
);

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\nPlatform smoke: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
