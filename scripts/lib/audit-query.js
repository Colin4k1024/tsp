const fs = require("fs");
const path = require("path");

function loadAuditEvents(auditRoot) {
  if (!fs.existsSync(auditRoot)) {
    return [];
  }
  const events = [];
  for (const fileName of fs.readdirSync(auditRoot).sort()) {
    if (!/^audit-.*\.jsonl$/.test(fileName)) {
      continue;
    }
    const filePath = path.join(auditRoot, fileName);
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      try {
        events.push(JSON.parse(trimmed));
      } catch {
        continue;
      }
    }
  }
  return events;
}

function filterAuditEvents(
  events,
  { sessionId = "", callId = "", component = "", action = "" } = {},
) {
  return events.filter((event) => {
    if (sessionId && event.session_id !== sessionId) {
      return false;
    }
    if (callId && event.call_id !== callId) {
      return false;
    }
    if (component && event.component !== component) {
      return false;
    }
    if (action && event.action !== action) {
      return false;
    }
    return true;
  });
}

function countBy(events, key) {
  const counts = {};
  for (const event of events) {
    const bucket = event[key] || "unknown";
    counts[bucket] = (counts[bucket] || 0) + 1;
  }
  return counts;
}

function summarizeAuditEvents(events) {
  return {
    event_count: events.length,
    components: countBy(events, "component"),
    actions: countBy(events, "action"),
    statuses: countBy(events, "status"),
    phases: countBy(events, "phase"),
  };
}

function parseTimestamp(value) {
  const time = Date.parse(value || "");
  return Number.isNaN(time) ? null : time;
}

function reconstructCallChain(events, callId) {
  const matched = events
    .filter((event) => event.call_id === callId)
    .sort((left, right) => String(left.timestamp || "").localeCompare(String(right.timestamp || "")));

  if (!matched.length) {
    return {
      call_id: callId,
      event_count: 0,
      components: [],
      actions: [],
      statuses: [],
      duration_ms: null,
      events: [],
    };
  }

  const timestamps = matched
    .map((event) => parseTimestamp(event.timestamp))
    .filter((timestamp) => timestamp !== null);

  let durationMs = null;
  if (timestamps.length >= 2) {
    durationMs = timestamps[timestamps.length - 1] - timestamps[0];
  }

  return {
    call_id: callId,
    event_count: matched.length,
    components: matched.map((event) => event.component),
    actions: matched.map((event) => event.action),
    statuses: matched.map((event) => event.status),
    duration_ms: durationMs,
    events: matched,
  };
}

function listCallChains(events, sourceEvents = null) {
  const discovered = [];
  const seen = new Set();
  for (const event of events) {
    if (!event.call_id || seen.has(event.call_id)) {
      continue;
    }
    seen.add(event.call_id);
    discovered.push(event.call_id);
  }
  const chainSource = sourceEvents || events;
  return discovered.map((callId) => reconstructCallChain(chainSource, callId));
}

function renderTimeline(events) {
  return [...events]
    .sort((left, right) => String(left.timestamp || "").localeCompare(String(right.timestamp || "")))
    .map((event) => {
      const timestamp = event.timestamp || "";
      const phase = String(event.phase || "?").toUpperCase().padEnd(4, " ");
      const component = event.component || "unknown";
      const action = event.action || "unknown";
      const status = event.status || "unknown";
      const source = event.source || "";
      const callId = event.call_id || "";
      return `${timestamp} | ${phase} | ${component}:${action} | ${status} | source=${source} | call_id=${callId}`;
    });
}

function renderCountTable(title, label, counts) {
  const lines = ["", `### ${title}`, "", `| ${label} | Count |`, "| --- | ---: |"];
  for (const [key, value] of Object.entries(counts)) {
    lines.push(`| ${key} | ${value} |`);
  }
  return lines;
}

function renderMarkdownReport(payload) {
  const lines = ["# Audit Report", "", `- Audit Root: ${payload.audit_root || ""}`];
  const summary = payload.summary || {};

  if (Object.keys(summary).length) {
    lines.push("", "## Summary", "", `- Event Count: ${summary.event_count || 0}`);
    lines.push(...renderCountTable("Components", "Component", summary.components || {}));
    lines.push(...renderCountTable("Actions", "Action", summary.actions || {}));
    lines.push(...renderCountTable("Statuses", "Status", summary.statuses || {}));
    lines.push(...renderCountTable("Phases", "Phase", summary.phases || {}));
  }

  if (payload.chain) {
    lines.push(
      "",
      "## Chain",
      "",
      `- Call ID: ${payload.chain.call_id || ""}`,
      `- Event Count: ${payload.chain.event_count || 0}`,
      `- Duration ms: ${payload.chain.duration_ms}`,
    );
  }

  if (payload.timeline) {
    lines.push("", "## Timeline", "");
    for (const entry of payload.timeline) {
      lines.push(`- ${entry}`);
    }
  }

  if (payload.tail) {
    lines.push("", "## Tail", "", "```json", JSON.stringify(payload.tail, null, 2), "```");
  }

  return `${lines.join("\n")}\n`;
}

module.exports = {
  filterAuditEvents,
  listCallChains,
  loadAuditEvents,
  reconstructCallChain,
  renderMarkdownReport,
  renderTimeline,
  summarizeAuditEvents,
};
