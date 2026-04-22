#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { emitPre, emitPost } = require("./lib/audit-logger");

const H = "-----BEGIN ";
const T = " KEY-----";
const P = "PRIVATE";

const PRIVATE_KEY_PATTERNS = [
  `${H}RSA ${P}${T}`,
  `${H}${P}${T}`,
  `${H}ENCRYPTED ${P}${T}`,
  `${H}OPENSSH ${P}${T}`,
  `${H}EC ${P}${T}`,
  `${H}DSA ${P}${T}`,
  `-----BEGIN PGP ${P} KEY BLOCK-----`,
];

const SKIP_DIRS = new Set([".git", "node_modules", "__pycache__", ".tox", "venv", ".venv"]);

function listGitScopedFiles(root) {
  if (!fs.existsSync(path.join(root, ".git"))) {
    return null;
  }

  const result = spawnSync(
    "git",
    ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );

  if (result.error || result.status !== 0) {
    return null;
  }

  return result.stdout
    .split("\0")
    .filter(Boolean)
    .map((relativePath) => path.join(root, relativePath));
}

function scanFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    return PRIVATE_KEY_PATTERNS.filter((pattern) => text.includes(pattern));
  } catch {
    return [];
  }
}

function scanDir(root, findings) {
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return findings;
  }

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      scanDir(fullPath, findings);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }
    if (fullPath.split(path.sep).some((part) => SKIP_DIRS.has(part))) {
      continue;
    }

    const matches = scanFile(fullPath);
    if (matches.length) {
      findings.set(fullPath, matches);
    }
  }

  return findings;
}

function scanRepo(root) {
  const findings = new Map();
  const gitScopedFiles = listGitScopedFiles(root);
  if (!gitScopedFiles) {
    return scanDir(root, findings);
  }

  for (const fullPath of gitScopedFiles) {
    if (fullPath.split(path.sep).some((part) => SKIP_DIRS.has(part))) {
      continue;
    }
    const matches = scanFile(fullPath);
    if (matches.length) {
      findings.set(fullPath, matches);
    }
  }

  return findings;
}

function main(argv = process.argv.slice(2)) {
  const root = path.resolve(argv[0] || path.join(__dirname, ".."));
  const callId = emitPre({
    component: "script",
    action: "scan_leaked_keys",
    source: "scan_leaked_keys",
    projectPath: root,
    payload: { root },
  });
  const findings = scanRepo(root);

  if (findings.size === 0) {
    emitPost({
      component: "script",
      action: "scan_leaked_keys",
      status: "success",
      source: "scan_leaked_keys",
      projectPath: root,
      callId,
      payload: { root, finding_count: 0 },
    });
    process.stdout.write("No leaked private keys found.\n");
    return 0;
  }

  emitPost({
    component: "script",
    action: "scan_leaked_keys",
    status: "error",
    source: "scan_leaked_keys",
    projectPath: root,
    callId,
    payload: { root, finding_count: findings.size },
  });
  process.stderr.write("LEAKED PRIVATE KEY(S) DETECTED:\n");
  for (const [filePath, patterns] of [...findings.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const rel = path.relative(root, filePath);
    for (const pattern of patterns) {
      process.stderr.write(`  ${rel}: ${pattern}\n`);
    }
  }
  return 1;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  PRIVATE_KEY_PATTERNS,
  SKIP_DIRS,
  main,
  scanFile,
  scanRepo,
};
