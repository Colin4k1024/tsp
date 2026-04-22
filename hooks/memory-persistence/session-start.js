#!/usr/bin/env node
// session-start.js — SessionStart hook
// JS equivalent of scripts/hooks/session_start.py
//
// On session start, injects project context into Claude's awareness from two sources:
//   A) <project>/docs/memory/  — structured project records (context, decisions, lessons)
//   B) ~/.claude/memory/sessions/*_experience.json — experience capsules from session_end
//
// Output: additionalContext JSON string injected into the session.
// Silent-fail: any unhandled error → process.exit(0), never blocks session start.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

let readPuaConfig = () => ({ always_on: false });
let readPuaState = () => ({});
let flavorLabel = () => '🟠 阿里';

try {
  const puaState = require('../../scripts/lib/pua-state');
  readPuaConfig = puaState.readConfig;
  readPuaState = puaState.readState;
  flavorLabel = puaState.flavorLabel;
} catch (_) {
  // PUA support is optional for session start; keep startup hook resilient.
}

function resolveProjectPath(data) {
  return (
    process.env.CLAUDE_PROJECT_PATH ||
    process.env.CLAUDE_PROJECT_DIR ||
    data.cwd ||
    process.cwd()
  );
}

function readMemoryFile(projectPath, rel, maxChars = 3000) {
  const filePath = path.join(projectPath, 'docs', 'memory', rel);
  if (!fs.existsSync(filePath)) return '';
  try {
    return fs.readFileSync(filePath, 'utf8').slice(0, maxChars);
  } catch (_) {
    return '';
  }
}

function latestSessionFile(projectPath) {
  const dir = path.join(projectPath, 'docs', 'memory', 'sessions');
  if (!fs.existsSync(dir)) return '';
  try {
    const files = fs.readdirSync(dir)
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => ({ name: fileName, mtime: fs.statSync(path.join(dir, fileName)).mtimeMs }))
      .sort((left, right) => right.mtime - left.mtime);
    if (!files.length) return '';
    return fs.readFileSync(path.join(dir, files[0].name), 'utf8').slice(0, 2000);
  } catch (_) {
    return '';
  }
}

function loadLatestExperience() {
  const sessionsDir = path.join(os.homedir(), '.claude', 'memory', 'sessions');
  if (!fs.existsSync(sessionsDir)) return null;
  try {
    const files = fs.readdirSync(sessionsDir)
      .filter(fileName => fileName.endsWith('_experience.json'))
      .map(fileName => ({ name: fileName, mtime: fs.statSync(path.join(sessionsDir, fileName)).mtimeMs }))
      .sort((left, right) => right.mtime - left.mtime);
    if (!files.length) return null;
    return JSON.parse(fs.readFileSync(path.join(sessionsDir, files[0].name), 'utf8'));
  } catch (_) {
    return null;
  }
}

function extractLessons(lessonsMd, maxItems = 5) {
  const headings = [...lessonsMd.matchAll(/^#{2,3}\s+(.+)$/gm)].map(match => match[1]);
  return headings.slice(-maxItems);
}

function extractPendingDecisions(decisionsMd, maxItems = 5) {
  const pending = [];
  for (const line of decisionsMd.split('\n')) {
    if (/待|pending|open|未决|待确认/i.test(line) && line.trim()) {
      const cleaned = line.replace(/^[*#\-\s]+/, '').trim();
      if (cleaned) pending.push(cleaned);
      if (pending.length >= maxItems) break;
    }
  }
  return pending;
}

function extractRecentSessionBullets(sessionMd, maxItems = 5) {
  const bullets = [];
  for (const line of sessionMd.split('\n')) {
    if (/^[-*]\s+/.test(line.trim())) {
      bullets.push(line.trim().replace(/^[-*]\s+/, ''));
      if (bullets.length >= maxItems) break;
    }
  }
  return bullets;
}

function extractMarkdownSection(markdown, heading) {
  const lines = markdown.split('\n');
  const normalizedHeading = heading.trim().toLowerCase();
  let startIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed.startsWith('#')) continue;
    const title = trimmed.replace(/^#+\s*/, '').trim().toLowerCase();
    if (title === normalizedHeading) {
      startIndex = index + 1;
      break;
    }
  }

  if (startIndex === -1) return '';

  const collected = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().startsWith('#')) break;
    collected.push(line);
  }
  return collected.join('\n').trim();
}

function parseProjectContext(ctxMd) {
  return {
    currentTask: extractMarkdownSection(ctxMd, '当前活跃任务'),
    currentPhase: extractMarkdownSection(ctxMd, '当前阶段'),
    activeRisks: extractMarkdownSection(ctxMd, '活跃风险'),
    nextStep: extractMarkdownSection(ctxMd, '下一步建议'),
  };
}

function summariseProjectContext(ctxMd) {
  const lines = ctxMd.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .slice(0, 3);
  return lines.join(' / ');
}

function summarizeGlobalContext(content) {
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .slice(0, 2);
  return lines.join(' / ');
}

function loadGlobalContexts() {
  const contextsDir = path.join(os.homedir(), '.claude', 'contexts');
  if (!fs.existsSync(contextsDir)) return [];
  try {
    return fs.readdirSync(contextsDir)
      .filter(fileName => fileName.endsWith('.md'))
      .sort()
      .map(fileName => {
        try {
          return { name: path.basename(fileName, '.md'), content: fs.readFileSync(path.join(contextsDir, fileName), 'utf8').trim() };
        } catch (_) {
          return null;
        }
      })
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function runSessionStartHook(rawInput) {
  let data = {};
  try {
    data = JSON.parse(rawInput || '{}');
  } catch (_) {
    data = {};
  }

  try {
    const projectPath = resolveProjectPath(data);
    const ctxMd = readMemoryFile(projectPath, 'project-context.md');
    const decisionsMd = readMemoryFile(projectPath, 'decisions.md');
    const lessonsMd = readMemoryFile(projectPath, 'lessons-learned.md');
    const sessionText = latestSessionFile(projectPath);

    const repoFilesFound = ['project-context.md', 'decisions.md', 'lessons-learned.md']
      .filter(fileName => fs.existsSync(path.join(projectPath, 'docs', 'memory', fileName)));

    const experience = loadLatestExperience();
    const capsules = experience?.experience_capsules ?? [];
    const domainsTouched = experience?.domains_touched ?? [];
    const commitCount = experience?.commits_harvested ?? 0;
    const globalContexts = loadGlobalContexts();

    const contextDetails = parseProjectContext(ctxMd);
    const contextSummary = summariseProjectContext(ctxMd);
    const lessons = extractLessons(lessonsMd);
    const pendingItems = extractPendingDecisions(decisionsMd);
    const recentCommits = experience?.recent_commits?.slice(0, 10) ?? extractRecentSessionBullets(sessionText);

    let puaConfig = { always_on: false };
    let puaState = {};
    try {
      puaConfig = readPuaConfig();
      puaState = readPuaState();
    } catch (_) {
      puaConfig = { always_on: false };
      puaState = {};
    }

    const parts = [];
    if (contextSummary) parts.push(`📁 项目: ${contextSummary}`);
    if (contextDetails.currentTask) parts.push(`🎯 当前任务: ${contextDetails.currentTask}`);
    if (contextDetails.currentPhase) parts.push(`📍 当前阶段: ${contextDetails.currentPhase}`);
    if (contextDetails.activeRisks) parts.push(`⚠️ 活跃风险: ${contextDetails.activeRisks}`);
    if (contextDetails.nextStep) parts.push(`➡️ 下一步: ${contextDetails.nextStep}`);
    if (repoFilesFound.length) parts.push(`📚 docs/memory: ${repoFilesFound.join(', ')}`);
    if (pendingItems.length) parts.push(`⏳ 待确认: ${pendingItems.join(' | ')}`);
    if (lessons.length) parts.push(`💡 经验: ${lessons.join('; ')}`);
    if (sessionText) parts.push(`🗒️ 上次会话: ${sessionText.split('\n')[0]}`);
    if (commitCount) parts.push(`📦 上次提交 ${commitCount} 次`);
    if (domainsTouched.length) parts.push(`🔧 涉及域: ${domainsTouched.join(', ')}`);

    const globalContextLines = globalContexts.flatMap(({ name, content }) => {
      const summary = summarizeGlobalContext(content);
      return summary ? [`🌐 全局上下文(${name}): ${summary}`] : [];
    });
    if (globalContexts.length > 0 && globalContextLines.length === 0) {
      const names = globalContexts.map(context => context.name).join(', ');
      globalContextLines.push(`🌐 全局上下文: ${names}`);
    }
    if (globalContextLines.length) parts.push(...globalContextLines);

    if (puaConfig.always_on) {
      parts.push(`🔥 PUA Always-On: ${flavorLabel(puaConfig.flavor)} / ${puaState.level || 'L0'} / 连续失败 ${puaState.failure_count || 0} 次`);
    }

    const ctxLines = [
      '## 会话上下文 (memory-persistence)',
      ...parts,
    ];

    if (globalContexts.length) {
      ctxLines.push('');
      ctxLines.push('## 全局工作上下文');
      for (const { name, content } of globalContexts) {
        ctxLines.push(`### ${name}`);
        ctxLines.push(content);
      }
    }

    if (puaConfig.always_on) {
      ctxLines.push('');
      ctxLines.push('## PUA Always-On');
      ctxLines.push(`- 当前味道: ${flavorLabel(puaConfig.flavor)}`);
      ctxLines.push(`- 当前等级: ${puaState.level || 'L0'}`);
      ctxLines.push(`- 连续失败: ${puaState.failure_count || 0}`);
      ctxLines.push('- 三条红线: 没证据不算完成 / 没验证不允许归因 / 没穷尽不允许放弃');
      ctxLines.push('- 当前仓库对 PUA 的 hooks 映射支持 SessionStart、PostToolUse、PostToolUseFailure、PreCompact、Stop；不支持 UserPromptSubmit 级即时拦截。');
    }

    ctxLines.push('');
    ctxLines.push('> 以上来自 hooks/memory-persistence/session-start.js，基于 docs/memory/ 和 experience 记录。');

    return {
      project_context_summary: contextSummary,
      project_context_details: contextDetails,
      repo_memory_files_found: repoFilesFound,
      recent_accomplishments: recentCommits,
      lessons_available: lessons,
      pending_decisions_or_todos: pendingItems,
      payload: {
        project_context_summary: contextSummary,
        project_context_details: contextDetails,
        repo_memory_files_found: repoFilesFound,
        recent_accomplishments: recentCommits,
        lessons_available: lessons,
        pending_items: pendingItems,
        pending_decisions_count: pendingItems.length,
        experience_capsules: capsules.slice(0, 5),
        domains_touched: domainsTouched,
      },
      global_contexts_found: globalContexts.map(({ name }) => name),
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: ctxLines.join('\n'),
      },
      metadata: {
        trigger: data?.hook_event_name || data?.event || 'session-start',
        project_path: projectPath,
        memory_dir: path.join(projectPath, 'docs', 'memory'),
      },
    };
  } catch (error) {
    return {
      hookSpecificOutput: { additionalContext: '' },
      metadata: { error: String(error && error.message || error) },
    };
  }
}

module.exports = {
  extractMarkdownSection,
  parseProjectContext,
  summariseProjectContext,
  runSessionStartHook,
};

if (require.main === module) {
  let input = '';
  const stdinTimeout = setTimeout(() => process.exit(0), 10000);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    clearTimeout(stdinTimeout);
    process.stdout.write(JSON.stringify(runSessionStartHook(input)));
  });
  process.stdin.resume();
}
