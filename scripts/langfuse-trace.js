#!/usr/bin/env node
const http = require("http");
const https = require("https");
const { URL } = require("url");
const crypto = require("crypto");
const { emitPre, emitPost } = require("./lib/audit-logger");

function printHelp() {
  console.log(`Langfuse 编码流程追踪脚本

Environment:
  LANGFUSE_PUBLIC_KEY  - Langfuse 公钥
  LANGFUSE_SECRET_KEY  - Langfuse 私钥
  LANGFUSE_HOST        - 自部署地址，如 http://localhost:3000

Usage:
  node scripts/langfuse-trace.js trace-start --name "logic-layer-method-impl" [--input '{"method":"xxx"}']
  node scripts/langfuse-trace.js span-start --trace-id <id> --name "maven-compile" [--input '{"files":[]}']
  node scripts/langfuse-trace.js span-end --span-id <id> [--output '{"exit_code":0}'] [--level DEFAULT|WARNING|ERROR]
  node scripts/langfuse-trace.js trace-end --trace-id <id> [--output '{"status":"success"}']
`);
}

function parseJsonFlag(value, flagName) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON for ${flagName}: ${error.message}`);
  }
}

function parseArgs(argv) {
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) {
    return { help: true };
  }

  const command = argv[0];
  const options = { command };

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    switch (token) {
      case "--name":
        options.name = next || "";
        index += 1;
        break;
      case "--input":
        options.input = next || "";
        index += 1;
        break;
      case "--trace-id":
        options.traceId = next || "";
        index += 1;
        break;
      case "--span-id":
        options.spanId = next || "";
        index += 1;
        break;
      case "--output":
        options.output = next || "";
        index += 1;
        break;
      case "--level":
        options.level = next || "DEFAULT";
        index += 1;
        break;
      default:
        if (token.startsWith("-")) {
          throw new Error(`Unknown option: ${token}`);
        }
        break;
    }
  }

  return options;
}

function getConfig() {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY || "";
  const secretKey = process.env.LANGFUSE_SECRET_KEY || "";
  const host = (process.env.LANGFUSE_HOST || "https://cloud.langfuse.com").replace(/\/+$/, "");

  if (!publicKey || !secretKey) {
    throw new Error("LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY must be set");
  }

  return {
    host,
    credentials: Buffer.from(`${publicKey}:${secretKey}`).toString("base64"),
  };
}

function nowIso() {
  return new Date().toISOString();
}

function postJson(targetUrl, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const client = url.protocol === "http:" ? http : https;
    const request = client.request(
      {
        method: "POST",
        hostname: url.hostname,
        port: url.port || (url.protocol === "http:" ? 80 : 443),
        path: `${url.pathname}${url.search}`,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...headers,
        },
      },
      (response) => {
        let data = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            if (!data) {
              resolve(null);
              return;
            }
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
            return;
          }
          process.stderr.write(`Langfuse HTTP error ${response.statusCode}: ${data}\n`);
          resolve(null);
        });
      },
    );

    request.on("error", (error) => {
      reject(error);
    });
    request.write(body);
    request.end();
  });
}

async function ingest(host, credentials, batch) {
  try {
    return await postJson(`${host}/api/public/ingestion`, JSON.stringify({ batch }), {
      Authorization: `Basic ${credentials}`,
    });
  } catch (error) {
    process.stderr.write(`Langfuse ingestion failed: ${error instanceof Error ? error.message : String(error)}\n`);
    return null;
  }
}

async function cmdTraceStart(options) {
  const { host, credentials } = getConfig();
  const traceId = crypto.randomUUID();
  const inputData = options.input ? parseJsonFlag(options.input, "--input") : null;
  const batch = [
    {
      id: crypto.randomUUID(),
      type: "trace-create",
      timestamp: nowIso(),
      body: {
        id: traceId,
        name: options.name,
        timestamp: nowIso(),
        input: inputData,
        metadata: { source: "coding-workflow" },
      },
    },
  ];

  const result = await ingest(host, credentials, batch);
  if (result !== null) {
    console.log(traceId);
    return 0;
  }
  return 1;
}

async function cmdSpanStart(options) {
  const { host, credentials } = getConfig();
  const spanId = crypto.randomUUID();
  const inputData = options.input ? parseJsonFlag(options.input, "--input") : null;
  const batch = [
    {
      id: crypto.randomUUID(),
      type: "span-create",
      timestamp: nowIso(),
      body: {
        id: spanId,
        traceId: options.traceId,
        name: options.name,
        startTime: nowIso(),
        input: inputData,
      },
    },
  ];

  const result = await ingest(host, credentials, batch);
  if (result !== null) {
    console.log(spanId);
    return 0;
  }
  return 1;
}

async function cmdSpanEnd(options) {
  const { host, credentials } = getConfig();
  const outputData = options.output ? parseJsonFlag(options.output, "--output") : null;
  const batch = [
    {
      id: crypto.randomUUID(),
      type: "span-update",
      timestamp: nowIso(),
      body: {
        id: options.spanId,
        endTime: nowIso(),
        output: outputData,
        level: options.level || "DEFAULT",
      },
    },
  ];

  await ingest(host, credentials, batch);
  return 0;
}

async function cmdTraceEnd(options) {
  const { host, credentials } = getConfig();
  const outputData = options.output ? parseJsonFlag(options.output, "--output") : null;
  const batch = [
    {
      id: crypto.randomUUID(),
      type: "trace-create",
      timestamp: nowIso(),
      body: {
        id: options.traceId,
        output: outputData,
        metadata: { source: "coding-workflow", completed: true },
      },
    },
  ];

  await ingest(host, credentials, batch);
  return 0;
}

async function main(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    printHelp();
    return 0;
  }

  if (!parsed.command) {
    throw new Error("Missing command");
  }

  const callId = emitPre({
    component: "script",
    action: "langfuse_trace",
    source: "langfuse_trace",
    payload: { command: parsed.command },
  });

  let exitCode = 1;
  if (parsed.command === "trace-start") {
    if (!parsed.name) {
      throw new Error("--name is required");
    }
    exitCode = await cmdTraceStart(parsed);
  } else if (parsed.command === "span-start") {
    if (!parsed.traceId) {
      throw new Error("--trace-id is required");
    }
    if (!parsed.name) {
      throw new Error("--name is required");
    }
    exitCode = await cmdSpanStart(parsed);
  } else if (parsed.command === "span-end") {
    if (!parsed.spanId) {
      throw new Error("--span-id is required");
    }
    exitCode = await cmdSpanEnd(parsed);
  } else if (parsed.command === "trace-end") {
    if (!parsed.traceId) {
      throw new Error("--trace-id is required");
    }
    exitCode = await cmdTraceEnd(parsed);
  } else {
    throw new Error(`Unknown command: ${parsed.command}`);
  }

  if (exitCode === 0) {
    emitPost({
      component: "script",
      action: "langfuse_trace",
      status: "success",
      source: "langfuse_trace",
      callId,
      payload: { command: parsed.command },
    });
  }
  return exitCode;
}

if (require.main === module) {
  main()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}

module.exports = {
  main,
};
