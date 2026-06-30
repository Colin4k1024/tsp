'use strict';

const crypto = require('crypto');
const { execSync } = require('child_process');
const loopStateStore = require('./loop-state-store');

const GOAL_STATES = {
  active: 'active',
  paused: 'paused',
  converged: 'converged',
  escalated: 'escalated',
  failed: 'failed',
};

const ESCALATION_REASONS = {
  budgetExhausted: 'budget_exhausted',
  repeatedFailure: 'repeated_failure',
  oracleUncertain: 'oracle_uncertain',
  manual: 'manual',
};

function generateGoalId() {
  return `goal-${crypto.randomBytes(4).toString('hex')}`;
}

function createGoal(objective, options = {}) {
  const now = new Date().toISOString();
  return {
    goalId: generateGoalId(),
    objective,
    stoppingConditions: options.stoppingConditions || inferStoppingConditions(objective),
    budget: {
      maxIterations: options.maxIterations || 15,
      maxDuration: options.maxDuration || '2h',
      maxDollars: options.maxDollars || 10,
    },
    oracle: {
      model: options.checkerModel || 'haiku',
      allowedTools: ['Read', 'Bash'],
      prompt: options.oraclePrompt || null,
    },
    state: GOAL_STATES.active,
    currentIteration: 0,
    createdAt: now,
    updatedAt: now,
    history: [],
    escalation: null,
  };
}

function inferStoppingConditions(objective) {
  const lower = objective.toLowerCase();
  const conditions = [];

  if (lower.includes('test') && (lower.includes('pass') || lower.includes('fix'))) {
    conditions.push({
      type: 'test_pass',
      command: 'npm test 2>&1; echo "EXIT:$?"',
      description: 'All tests pass',
    });
  }

  if (lower.includes('lint') || lower.includes('eslint')) {
    conditions.push({
      type: 'lint_clean',
      command: 'npm run lint -- --quiet 2>&1; echo "EXIT:$?"',
      description: 'Linter reports no errors',
    });
  }

  if (lower.includes('coverage')) {
    const match = lower.match(/(\d+)\s*%/);
    const threshold = match ? parseInt(match[1], 10) : 80;
    conditions.push({
      type: 'coverage_threshold',
      command: 'npm test -- --coverage --coverageReporters=text-summary 2>&1',
      threshold,
      description: `Test coverage >= ${threshold}%`,
    });
  }

  if (lower.includes('build') && (lower.includes('pass') || lower.includes('fix'))) {
    conditions.push({
      type: 'build_pass',
      command: 'npm run build 2>&1; echo "EXIT:$?"',
      description: 'Build succeeds',
    });
  }

  if (conditions.length === 0) {
    conditions.push({
      type: 'custom_command',
      command: 'echo "Manual verification required"; exit 1',
      description: 'Requires explicit stopping condition — use --condition flag',
    });
  }

  return conditions;
}

function evaluateCondition(condition) {
  try {
    const output = execSync(condition.command, {
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    let passed = true;

    if (condition.type === 'coverage_threshold' && condition.threshold) {
      const coverageMatch = output.match(/(?:All files|Statements)\s*[:|]\s*([\d.]+)%/);
      if (coverageMatch) {
        passed = parseFloat(coverageMatch[1]) >= condition.threshold;
      } else {
        passed = false;
      }
    } else {
      const exitMatch = output.match(/EXIT:(\d+)$/);
      if (exitMatch) {
        passed = exitMatch[1] === '0';
      }
    }

    return { type: condition.type, passed, output: output.slice(0, 500) };
  } catch (error) {
    return {
      type: condition.type,
      passed: false,
      output: (error.stderr || error.message || '').slice(0, 500),
    };
  }
}

function buildOraclePrompt(goal, conditionResults, iterationSummary) {
  const recentHistory = goal.history.slice(-3);

  return `You are a completion oracle. Your job is to evaluate whether a goal has been achieved.
You CANNOT modify code — you can only read and evaluate.

## Goal
Objective: ${goal.objective}

## Stopping Conditions Results
${conditionResults.map(r => `- [${r.passed ? 'PASS' : 'FAIL'}] ${r.type}: ${r.output.slice(0, 200)}`).join('\n')}

## Maker's Iteration Summary
${iterationSummary || '(no summary provided)'}

## Recent History
${recentHistory.map(h => `Iteration ${h.iteration}: ${h.oracleVerdict} — ${(h.failReasons || []).join(', ')}`).join('\n') || '(first iteration)'}

## Your Task
Evaluate whether ALL stopping conditions are met. Respond with EXACTLY this JSON:
{
  "converged": <true if ALL conditions pass, false otherwise>,
  "conditionResults": [{"type": "...", "passed": true/false, "output": "brief"}],
  "reasons": ["why not converged, if applicable"],
  "nextHint": "specific guidance for the maker's next iteration (if not converged)",
  "confidence": <0.0 to 1.0>
}`;
}

function checkBudget(goal) {
  if (goal.currentIteration >= goal.budget.maxIterations) {
    return { exhausted: true, reason: ESCALATION_REASONS.budgetExhausted, detail: 'Max iterations reached' };
  }

  const durationMs = parseDuration(goal.budget.maxDuration);
  const elapsed = Date.now() - new Date(goal.createdAt).getTime();
  if (elapsed >= durationMs) {
    return { exhausted: true, reason: ESCALATION_REASONS.budgetExhausted, detail: 'Max duration reached' };
  }

  const totalCost = goal.history.reduce((sum, h) => sum + (h.costDollars || 0), 0);
  if (totalCost >= goal.budget.maxDollars) {
    return { exhausted: true, reason: ESCALATION_REASONS.budgetExhausted, detail: 'Max cost reached' };
  }

  const recentFails = goal.history.slice(-5).filter(h => h.oracleVerdict === 'fail');
  if (recentFails.length >= 5) {
    return { exhausted: true, reason: ESCALATION_REASONS.repeatedFailure, detail: '5 consecutive failures' };
  }

  return { exhausted: false };
}

function parseDuration(duration) {
  const match = duration.match(/^(\d+)(m|h)$/);
  if (!match) return 2 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  return match[2] === 'h' ? value * 60 * 60 * 1000 : value * 60 * 1000;
}

function recordIteration(goal, verdict, costDollars = 0) {
  const entry = {
    iteration: goal.currentIteration,
    makerSummary: verdict.makerSummary || null,
    oracleVerdict: verdict.converged ? 'pass' : 'fail',
    failReasons: verdict.reasons || [],
    nextHint: verdict.nextHint || null,
    timestamp: new Date().toISOString(),
    costDollars,
  };
  goal.history.push(entry);
  goal.currentIteration += 1;
  goal.updatedAt = new Date().toISOString();

  if (verdict.converged) {
    goal.state = GOAL_STATES.converged;
  }

  return entry;
}

function escalateGoal(goal, reason, detail) {
  goal.state = GOAL_STATES.escalated;
  goal.escalation = {
    reason,
    details: detail,
    escalatedAt: new Date().toISOString(),
  };
  goal.updatedAt = new Date().toISOString();
}

function pauseGoal(goal) {
  goal.state = GOAL_STATES.paused;
  goal.updatedAt = new Date().toISOString();
}

function resumeGoal(goal) {
  if (goal.state === GOAL_STATES.paused || goal.state === GOAL_STATES.escalated) {
    goal.state = GOAL_STATES.active;
    goal.updatedAt = new Date().toISOString();
  }
}

function saveGoal(goal) {
  return loopStateStore.saveGoal(goal);
}

function loadGoal(goalId) {
  return loopStateStore.loadGoal(goalId);
}

function listGoals(filter) {
  return loopStateStore.listGoals(filter);
}

function getActiveGoals() {
  return listGoals(GOAL_STATES.active);
}

// Oracle execution (integration point for claude -p or sub-agent)

function runOracleEvaluation(goal, iterationSummary) {
  const conditionResults = goal.stoppingConditions.map(evaluateCondition);
  const allPassed = conditionResults.every(r => r.passed);

  if (allPassed) {
    return {
      converged: true,
      conditionResults,
      reasons: [],
      nextHint: null,
      confidence: 1.0,
    };
  }

  const failedConditions = conditionResults.filter(r => !r.passed);
  return {
    converged: false,
    conditionResults,
    reasons: failedConditions.map(r => `${r.type}: ${r.output.slice(0, 100)}`),
    nextHint: `Focus on: ${failedConditions.map(r => r.type).join(', ')}. ${failedConditions[0].output.slice(0, 200)}`,
    confidence: 0.7,
    oraclePrompt: buildOraclePrompt(goal, conditionResults, iterationSummary),
  };
}

// Main loop driver (called by the goal command handler)

async function runGoalIteration(goal, makerFn) {
  const budgetCheck = checkBudget(goal);
  if (budgetCheck.exhausted) {
    escalateGoal(goal, budgetCheck.reason, budgetCheck.detail);
    saveGoal(goal);
    return { action: 'escalated', goal };
  }

  const makerResult = await makerFn(goal);

  const oracleResult = runOracleEvaluation(goal, makerResult.summary);

  const entry = recordIteration(goal, {
    ...oracleResult,
    makerSummary: makerResult.summary,
  }, makerResult.costDollars || 0);

  saveGoal(goal);

  if (oracleResult.converged) {
    return { action: 'converged', goal, entry };
  }

  return { action: 'continue', goal, entry, nextHint: oracleResult.nextHint };
}

module.exports = {
  GOAL_STATES,
  ESCALATION_REASONS,
  generateGoalId,
  createGoal,
  inferStoppingConditions,
  evaluateCondition,
  buildOraclePrompt,
  checkBudget,
  recordIteration,
  escalateGoal,
  pauseGoal,
  resumeGoal,
  saveGoal,
  loadGoal,
  listGoals,
  getActiveGoals,
  runOracleEvaluation,
  runGoalIteration,
};
