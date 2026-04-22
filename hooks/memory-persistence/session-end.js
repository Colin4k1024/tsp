#!/usr/bin/env node
// session-end.js — Stop hook
// JS equivalent of scripts/hooks/session_end.py
//
// On session end, harvests experience from the repo (git log + docs/memory/ files)
// and writes capsules to ~/.claude/memory/sessions/.
//
// Does NOT wait for Claude to send structured data (which never happens).
// Silent-fail: any error → process.exit(0), never blocks.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { spawnSync } = require('child_process');

const MAX_COMMITS = 15;

// Domain classifier: maps changed file paths → domain label
const DOMAIN_RULES = [
  [/^skills\//,    'skills'],
  [/^commands\//,  'commands'],
  [/^roles\//,     'roles'],
  [/^agents\//,    'agents'],
  [/^docs\//,      'docs'],
  [/^scripts\//,   'scripts'],
  [/^hooks\//,     'hooks'],
  [/^rules\//,     'rules'],
  [/^templates\//, 'templates'],
];

function classifyDomain(file) {
  for (const [re, label] of DOMAIN_RULES) {
    if (re.test(file)) return label;
  }
  return 'other';
}

function resolveProjectPath(data) {
  return (
    process.env.CLAUDE_PROJECT_PATH ||
    process.env.CLAUDE_PROJECT_DIR ||
    data.cwd ||
    process.cwd()
  );
}

function gitLog(projectPath) {
  try {
    const res = spawnSync(
      'git', ['log', `--max-count=${MAX_COMMITS}`, '--pretty=format:%H|%s|%ai', '--name-only'],
      { cwd: projectPath, encoding: 'utf8', timeout: 10000 }
    );
    if (res.status !== 0) return [];
    return res.stdout.trim().split('\n');
  } catch (_) { return []; }
}

function parseGitLog(lines) {
  const commits = [];
  let current = null;
  for (const line of lines) {
    if (!line.trim()) {
      if (current) commits.push(current);
      current = null;
      continue;
    }
    if (line.includes('|')) {
      const [hash, msg, date] = line.split('|');
      current = { hash: hash.slice(0, 8), msg, date: date?.slice(0, 10), files: [] };
    } else if (current) {
      current.files.push(line.trim());
    }
  }
  if (current) commits.push(current);
  return commits.slice(0, MAX_COMMITS);
}

function readMemoryFile(projectPath, rel, maxChars = 2000) {
  const f = path.join(projectPath, 'docs', 'memory', rel);
  if (!fs.existsSync(f)) return '';
  try { return fs.readFileSync(f, 'utf8').slice(0, maxChars); } catch (_) { return ''; }
}

function buildExperienceCapsules(commits) {
  const capsules = [];
  const domainSet = new Set();

  for (const c of commits) {
    const domains = [...new Set(c.files.map(classifyDomain))];
    domains.forEach(d => domainSet.add(d));

    for (const domain of domains) {
      capsules.push({
        domain,
        type: c.msg.startsWith('fix') ? 'fix'
            : c.msg.startsWith('feat') ? 'feat'
            : c.msg.startsWith('docs') ? 'docs'
            : 'chore',
        summary: c.msg,
        commit: c.hash,
        date: c.date,
      });
    }
  }

  return { capsules, domains: [...domainSet] };
}

function writeExperience(sessionId, data) {
  const sessDir = path.join(os.homedir(), '.claude', 'memory', 'sessions');
  fs.mkdirSync(sessDir, { recursive: true });

  // Session summary (lightweight)
  const summaryPath = path.join(sessDir, `${sessionId}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify({
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    commits_harvested: data.commits.length,
    domains_touched: data.domains,
    recent_commits: data.commits.map(c => c.msg),
  }, null, 2), 'utf8');

  // Experience capsules (rich)
  const expPath = path.join(sessDir, `${sessionId}_experience.json`);
  fs.writeFileSync(expPath, JSON.stringify({
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    commits_harvested: data.commits.length,
    domains_touched: data.domains,
    recent_commits: data.commits.map(c => c.msg),
    experience_capsules: data.capsules,
    project_context_snapshot: data.contextSnapshot,
  }, null, 2), 'utf8');
}

// ─── main ───────────────────────────────────────────────────────────────────

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 10000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input || '{}');
    const projectPath = resolveProjectPath(data);
    const sessionId   = data.session_id || `js-${Date.now()}`;

    // ── Harvest git log ──
    const rawLines = gitLog(projectPath);
    const commits = parseGitLog(rawLines);

    // ── Harvest docs/memory/ ──
    const ctxSnapshot = readMemoryFile(projectPath, 'project-context.md', 500);

    // ── Build experience capsules ──
    const { capsules, domains } = buildExperienceCapsules(commits);

    // ── Check for uncommitted changes ──
    let uncommitted = 0;
    try {
      const res = spawnSync('git', ['status', '--porcelain'], { cwd: projectPath, encoding: 'utf8', timeout: 5000 });
      uncommitted = res.stdout.trim().split('\n').filter(Boolean).length;
    } catch (_) { /* ignore */ }

    if (uncommitted) {
      domains.push('other');
    }

    // ── Persist ──
    writeExperience(sessionId, { commits, capsules, domains, contextSnapshot: ctxSnapshot });

    process.stderr.write(
      `[memory-persistence] session_end: ${commits.length} commits, ${capsules.length} capsules, domains: ${domains.join(',')}\n`
    );
    process.exit(0);

  } catch (_) {
    process.exit(0);
  }
});
