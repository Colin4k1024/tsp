#!/usr/bin/env node
'use strict';

/**
 * session-start-goal-resume.js
 *
 * SessionStart hook that checks for active goals and injects a resume reminder.
 *
 * Part of the Loop Engineering upgrade (Phase 1.3: Inter-session state bridge).
 * When active goals exist from a previous session, this hook adds context to the
 * session start output so the user knows they can resume with `/goal resume`.
 *
 * Behavior:
 *   1. Scans ~/.claude/goals/ for goal files with state "active" or "paused"
 *   2. If found, appends a summary to the hook output
 *   3. Non-blocking: failures are silently ignored
 */

const fs = require('fs');
const path = require('path');

function getGoalsDir() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.claude', 'goals');
}

function scanActiveGoals() {
  const dir = getGoalsDir();
  if (!fs.existsSync(dir)) return [];

  try {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        } catch {
          return null;
        }
      })
      .filter(g => g && (g.state === 'active' || g.state === 'paused'))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch {
    return [];
  }
}

function formatGoalSummary(goal) {
  const stateIcon = goal.state === 'active' ? '▶' : '⏸';
  const progress = `${goal.currentIteration}/${goal.budget?.maxIterations || 15}`;
  const lastHint = goal.history?.length > 0
    ? goal.history[goal.history.length - 1].nextHint || ''
    : '';
  return `  ${stateIcon} [${goal.goalId}] "${goal.objective}" (iter ${progress})${lastHint ? `\n    Last hint: ${lastHint.slice(0, 120)}` : ''}`;
}

function main() {
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    // stdin may not be available
  }

  const activeGoals = scanActiveGoals();

  if (activeGoals.length === 0) {
    process.stdout.write(raw);
    return;
  }

  // Parse the input event and add goal context
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    process.stdout.write(raw);
    return;
  }

  const goalSummary = activeGoals.map(formatGoalSummary).join('\n');
  const message = `\n[Loop Engineering] ${activeGoals.length} active goal(s) from previous session:\n${goalSummary}\n\nResume with: /goal resume\n`;

  // Inject into session context if possible
  if (event && typeof event === 'object') {
    if (!event.additionalContext) {
      event.additionalContext = '';
    }
    event.additionalContext += message;
  }

  process.stdout.write(JSON.stringify(event));
}

main();
