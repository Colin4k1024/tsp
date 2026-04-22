const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

function auditRoot() {
  const configured = process.env.CLAUDE_AUDIT_ROOT;
  const candidates = configured
    ? [configured, path.join("/tmp", "claude-audit")]
    : [path.join(os.homedir(), ".claude", "memory", "audit"), path.join("/tmp", "claude-audit")];

  for (const candidate of candidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true });
      const probe = path.join(candidate, `.write-test-${process.pid}-${crypto.randomUUID()}`);
      fs.writeFileSync(probe, "", "utf8");
      fs.unlinkSync(probe);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error("No writable audit root available");
}

function auditLogPath(now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return path.join(auditRoot(), `audit-${date}.jsonl`);
}

function baseEvent(component, action, source, payload = {}) {
  return {
    timestamp: new Date().toISOString(),
    component,
    action,
    source,
    payload,
    session_id: process.env.CLAUDE_SESSION_ID || "",
    project_path: process.env.CLAUDE_PROJECT_PATH || process.env.CLAUDE_PROJECT_DIR || "",
  };
}

function appendEvent(event) {
  fs.appendFileSync(auditLogPath(), `${JSON.stringify(event)}\n`, "utf8");
}

function emitPre({ component, action, source, payload = {}, projectPath, callId }) {
  const eventCallId = callId || crypto.randomUUID();
  const event = {
    ...baseEvent(component, action, source, payload),
    phase: "pre",
    status: "started",
    call_id: eventCallId,
  };
  if (projectPath) {
    event.project_path = projectPath;
  }
  appendEvent(event);
  return eventCallId;
}

function emitPost({ component, action, status, source, payload = {}, projectPath, callId }) {
  const eventCallId = callId || crypto.randomUUID();
  const event = {
    ...baseEvent(component, action, source, payload),
    phase: "post",
    status,
    call_id: eventCallId,
  };
  if (projectPath) {
    event.project_path = projectPath;
  }
  appendEvent(event);
  return eventCallId;
}

module.exports = {
  auditRoot,
  auditLogPath,
  emitPre,
  emitPost,
};
