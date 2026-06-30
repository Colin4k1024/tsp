#!/usr/bin/env node
/**
 * PreCompact Hook - Save state before context compaction
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs before Claude compacts context, giving you a chance to
 * preserve important state that might get lost in summarization.
 */

const path = require('path');
const {
  getSessionsDir,
  getDateTimeString,
  getTimeString,
  findFiles,
  ensureDir,
  appendFile,
  log
} = require('../lib/utils');
const { recordCompactEvent } = require('../lib/context-window-state');

async function main(rawInput = '{}') {
  let input = {};
  try {
    input = JSON.parse(rawInput || '{}');
  } catch (_) {
    input = {};
  }

  const sessionsDir = getSessionsDir();
  const compactionLog = path.join(sessionsDir, 'compaction-log.txt');

  ensureDir(sessionsDir);

  // Log compaction event with timestamp
  const timestamp = getDateTimeString();
  let compactEvent = null;
  try {
    compactEvent = recordCompactEvent(input, {
      cwd: input.cwd || input.workspace?.current_dir || process.cwd(),
    });
  } catch (_) {
    compactEvent = null;
  }
  const compactCountSuffix = compactEvent
    ? ` (session compact #${compactEvent.sessionCompactCount}, total #${compactEvent.totalCompactCount})`
    : '';
  appendFile(compactionLog, `[${timestamp}] Context compaction triggered${compactCountSuffix}\n`);

  // If there's an active session file, note the compaction
  const sessions = findFiles(sessionsDir, '*-session.tmp');

  if (sessions.length > 0) {
    const activeSession = sessions[0].path;
    const timeStr = getTimeString();
    const countNote = compactEvent ? ` (compact #${compactEvent.sessionCompactCount})` : '';
    appendFile(activeSession, `\n---\n**[Compaction occurred at ${timeStr}${countNote}]** - Context was summarized\n`);
  }

  log(`[PreCompact] State saved before compaction${compactCountSuffix}`);
  process.exit(0);
}

if (require.main === module) {
  let input = '';
  const stdinTimeout = setTimeout(() => main(input), 5000);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    clearTimeout(stdinTimeout);
    main(input).catch(err => {
      console.error('[PreCompact] Error:', err.message);
      process.exit(0);
    });
  });
}

module.exports = { main };
