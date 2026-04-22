#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { auditRoot } = require("./lib/audit-logger");
const {
  filterAuditEvents,
  listCallChains,
  loadAuditEvents,
  reconstructCallChain,
  renderMarkdownReport,
  renderTimeline,
  summarizeAuditEvents,
} = require("./lib/audit-query");

function printHelp() {
  console.log(`Query local jsonl audit logs.

Options:
  --audit-root <path>   Override audit root directory
  --session-id <id>     Filter by session id
  --call-id <id>        Filter by call id
  --component <name>    Filter by component
  --action <name>       Filter by action
  --tail <n>            Number of matching events to print (default: 10)
  --summary-only        Only print summary
  --show-chain          Show reconstructed chain for --call-id
  --list-chains         List reconstructed call chain summaries
  --timeline            Render matching events or selected chain as a timeline
  --export-json <path>  Write the query payload to a JSON file
  --export-md <path>    Write the query payload to a Markdown report
  -h, --help            Show this help
`);
}

function parseArgs(argv) {
  const options = {
    auditRoot: "",
    sessionId: "",
    callId: "",
    component: "",
    action: "",
    tail: 10,
    summaryOnly: false,
    showChain: false,
    listChains: false,
    timeline: false,
    exportJson: "",
    exportMd: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    switch (token) {
      case "--audit-root":
        options.auditRoot = next || "";
        index += 1;
        break;
      case "--session-id":
        options.sessionId = next || "";
        index += 1;
        break;
      case "--call-id":
        options.callId = next || "";
        index += 1;
        break;
      case "--component":
        options.component = next || "";
        index += 1;
        break;
      case "--action":
        options.action = next || "";
        index += 1;
        break;
      case "--tail":
        options.tail = Number.parseInt(next || "10", 10);
        index += 1;
        break;
      case "--summary-only":
        options.summaryOnly = true;
        break;
      case "--show-chain":
        options.showChain = true;
        break;
      case "--list-chains":
        options.listChains = true;
        break;
      case "--timeline":
        options.timeline = true;
        break;
      case "--export-json":
        options.exportJson = next || "";
        index += 1;
        break;
      case "--export-md":
        options.exportMd = next || "";
        index += 1;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        if (token.startsWith("-")) {
          throw new Error(`未知参数: ${token}`);
        }
        break;
    }
  }

  if (!Number.isFinite(options.tail) || options.tail < 0) {
    throw new Error("--tail 必须是非负整数");
  }
  return options;
}

function writeFile(targetPath, content) {
  const absolutePath = path.resolve(targetPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = args.auditRoot ? path.resolve(args.auditRoot) : auditRoot();
  const events = loadAuditEvents(root);
  const filtered = filterAuditEvents(events, {
    sessionId: args.sessionId,
    callId: args.callId,
    component: args.component,
    action: args.action,
  });

  const payload = {
    audit_root: root,
    summary: summarizeAuditEvents(filtered),
  };

  if (args.showChain && args.callId) {
    const chain = reconstructCallChain(events, args.callId);
    payload.chain = chain;
    if (args.timeline) {
      payload.timeline = renderTimeline(chain.events);
    }
  } else if (args.listChains) {
    payload.chains = listCallChains(filtered, events);
  } else if (args.timeline) {
    payload.timeline = renderTimeline(filtered);
  }

  if (!args.summaryOnly) {
    payload.tail = filtered.slice(-args.tail);
  }

  if (args.exportJson) {
    writeFile(args.exportJson, `${JSON.stringify(payload, null, 2)}\n`);
  }
  if (args.exportMd) {
    writeFile(args.exportMd, renderMarkdownReport(payload));
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
