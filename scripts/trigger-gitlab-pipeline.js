#!/usr/bin/env node
"use strict";

const https = require("https");
const { URL } = require("url");

const GITLAB_URL = process.env.GITLAB_URL || "https://gitlab.example.com";

function requestJson(urlString, { method = "GET", headers = {}, body = null } = {}) {
  const url = new URL(urlString);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
      },
      (res) => {
        let chunks = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          chunks += chunk;
        });
        res.on("end", () => {
          const text = chunks.trim();
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${text}`));
            return;
          }
          if (!text) {
            resolve(null);
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });
      },
    );
    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function requestText(urlString, { method = "GET", headers = {}, body = null } = {}) {
  const url = new URL(urlString);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
      },
      (res) => {
        let chunks = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          chunks += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${chunks.trim()}`));
            return;
          }
          resolve(chunks);
        });
      },
    );
    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function triggerManualPipeline(projectId, projectToken) {
  const headers = { "PRIVATE-TOKEN": projectToken };
  const baseApi = `${GITLAB_URL}/api/v4`;

  const pipelines = await requestJson(
    `${baseApi}/projects/${encodeURIComponent(projectId)}/pipelines?per_page=1&order_by=id&sort=desc`,
    { headers },
  );

  if (!Array.isArray(pipelines) || pipelines.length === 0) {
    console.log("No pipeline records found");
    return 0;
  }

  const pipeline = pipelines[0];
  if (!pipeline || !pipeline.id) {
    console.error('No pipeline found or pipeline has no ID');
    return;
  }
  const pipelineId = pipeline.id;
  console.log(`Latest Pipeline ID: ${pipelineId}, Status: ${pipeline.status}`);

  const jobs = await requestJson(
    `${baseApi}/projects/${encodeURIComponent(projectId)}/pipelines/${encodeURIComponent(pipelineId)}/jobs`,
    { headers },
  );

  if (!Array.isArray(jobs)) {
    console.error('Invalid jobs response: expected an array');
    return 0;
  }
  const manualJobs = jobs.filter((job) => job.status === "manual");
  if (manualJobs.length === 0) {
    console.log("No manual jobs to trigger");
    return 0;
  }

  console.log(`Found ${manualJobs.length} manual job(s), triggering...`);
  for (const job of manualJobs) {
    const playUrl = `${baseApi}/projects/${encodeURIComponent(projectId)}/jobs/${encodeURIComponent(job.id)}/play`;
    try {
      await requestText(playUrl, { method: "POST", headers });
      console.log(`[OK] Triggered: ${job.name}`);
    } catch (error) {
      console.log(`[FAIL] ${job.name}: ${error.message}`);
    }
  }
  return 0;
}

async function main(argv = process.argv.slice(2)) {
  const projectId = process.env.GITLAB_PROJECT_ID || argv[0];
  const projectToken = process.env.GITLAB_TOKEN || argv[1];
  if (!projectId || !projectToken) {
    console.error('Usage: Set GITLAB_PROJECT_ID and GITLAB_TOKEN env vars, or pass as arguments: <projectId> <projectToken>');
    process.exit(1);
  }
  await triggerManualPipeline(projectId, projectToken);
  return 0;
}

if (require.main === module) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    },
  );
}

module.exports = {
  GITLAB_URL,
  main,
  triggerManualPipeline,
};
