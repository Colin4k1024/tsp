'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class LoopSpecError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'LoopSpecError';
    this.details = details;
    this.code = details.code || 'loop_spec_error';
  }
}

function ensureObject(value, label, filePath) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LoopSpecError(`${label} must be an object`, {
      filePath,
      code: 'invalid_payload',
    });
  }
}

function ensureNonEmptyString(value, label, filePath) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new LoopSpecError(`${label} must be a non-empty string`, {
      filePath,
      code: 'invalid_field',
    });
  }
}

function ensurePositiveNumber(value, label, filePath) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new LoopSpecError(`${label} must be a positive number`, {
      filePath,
      code: 'invalid_budget',
    });
  }
}

function normalizeGate(gate, index, filePath) {
  ensureObject(gate, `loop.gates[${index}]`, filePath);
  ensureNonEmptyString(gate.name, `loop.gates[${index}].name`, filePath);
  ensureNonEmptyString(gate.command, `loop.gates[${index}].command`, filePath);

  return {
    name: gate.name.trim(),
    command: gate.command.trim(),
    description: typeof gate.description === 'string' && gate.description.trim()
      ? gate.description.trim()
      : null,
  };
}

function normalizeBudget(budget, filePath) {
  ensureObject(budget, 'loop.budget', filePath);
  ensurePositiveNumber(budget.maxIterations, 'loop.budget.maxIterations', filePath);
  ensurePositiveNumber(budget.maxDollars, 'loop.budget.maxDollars', filePath);
  ensureNonEmptyString(budget.maxDuration, 'loop.budget.maxDuration', filePath);

  if (!/^(\d+)(m|h)$/.test(budget.maxDuration)) {
    throw new LoopSpecError('loop.budget.maxDuration must use Nm or Nh format', {
      filePath,
      code: 'invalid_budget_duration',
    });
  }

  return {
    maxIterations: budget.maxIterations,
    maxDuration: budget.maxDuration,
    maxDollars: budget.maxDollars,
  };
}

function normalizeActor(actor, label, filePath) {
  ensureObject(actor, label, filePath);
  ensureNonEmptyString(actor.role, `${label}.role`, filePath);

  return {
    role: actor.role.trim(),
    writeAccess: actor.writeAccess === true,
  };
}

function normalizeLoopSpec(payload, filePath = '<inline>') {
  ensureObject(payload, 'loop spec', filePath);
  ensureObject(payload.loop, 'loop', filePath);

  const loop = payload.loop;
  ensureNonEmptyString(loop.id, 'loop.id', filePath);
  ensureNonEmptyString(loop.description, 'loop.description', filePath);
  ensureNonEmptyString(loop.cadence, 'loop.cadence', filePath);
  ensureNonEmptyString(loop.skill, 'loop.skill', filePath);
  ensureNonEmptyString(loop.stateFile, 'loop.stateFile', filePath);

  if (!/^(\d+)(m|h|d)$/.test(loop.cadence)) {
    throw new LoopSpecError('loop.cadence must use Nm, Nh, or Nd format', {
      filePath,
      code: 'invalid_cadence',
    });
  }

  if (!Array.isArray(loop.gates) || loop.gates.length === 0) {
    throw new LoopSpecError('loop.gates must include at least one hard verification gate', {
      filePath,
      code: 'missing_gates',
    });
  }

  // automation 配置（可选，默认 session adapter）
  const automation = loop.automation ? {
    adapter: loop.automation.adapter || 'session',
    enabled: loop.automation.enabled !== false,
    onMissedRun: loop.automation.onMissedRun || 'triage',
  } : {
    adapter: 'session',
    enabled: true,
    onMissedRun: 'triage',
  };

  // metrics 配置（可选）
  const metrics = loop.metrics ? {
    acceptedChangeRateMin: loop.metrics.acceptedChangeRateMin ?? 0.5,
    reviewWindowHours: loop.metrics.reviewWindowHours ?? 48,
  } : null;

  return {
    id: loop.id.trim(),
    description: loop.description.trim(),
    cadence: loop.cadence.trim(),
    skill: loop.skill.trim(),
    stateFile: loop.stateFile.trim(),
    gates: loop.gates.map((gate, index) => normalizeGate(gate, index, filePath)),
    maker: normalizeActor(loop.maker, 'loop.maker', filePath),
    checker: normalizeActor(loop.checker, 'loop.checker', filePath),
    budget: normalizeBudget(loop.budget, filePath),
    escalation: {
      onBudgetExhausted: loop.escalation?.onBudgetExhausted || 'triage',
      onSecurityFinding: loop.escalation?.onSecurityFinding || 'human',
    },
    automation,
    metrics,
  };
}

function parseLoopSpecContent(content, filePath = '<inline>') {
  let payload;
  try {
    payload = yaml.load(content, {
      filename: path.basename(filePath),
      schema: yaml.JSON_SCHEMA,
    });
  } catch (error) {
    throw new LoopSpecError(`Failed to parse loop spec YAML: ${error.message}`, {
      filePath,
      code: 'yaml_parse_error',
    });
  }

  return normalizeLoopSpec(payload, filePath);
}

function loadLoopSpecFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new LoopSpecError(`Failed to read loop spec file: ${error.message}`, {
      filePath,
      code: 'read_error',
    });
  }

  return {
    path: filePath,
    loop: parseLoopSpecContent(content, filePath),
  };
}

/**
 * Loop Intake — 四项准入条件检查
 *
 * 阻塞规则：如果 taskRepeats、automatedVerification、budget、toolAccess
 * 中任何一项缺失，命令必须拒绝 loop 设置，推荐 one-shot 替代。
 *
 * @param {Object} spec - 已解析的 loop spec
 * @param {Object} [context] - 运行时上下文
 * @returns {IntakeResult}
 *
 * @typedef {Object} IntakeResult
 * @property {boolean} eligible - 是否全部通过
 * @property {boolean} taskRepeats - 任务是否重复发生
 * @property {boolean} automatedVerification - 是否有可执行的自动验证
 * @property {boolean} budgetDefined - 是否有预算上限
 * @property {boolean} toolAccessBounded - 权限是否受限
 * @property {string[]} blockers - 未通过条件的说明
 * @property {string} recommendedAlternative - 不通过时的推荐命令
 */
function checkIntake(spec) {
  const blockers = [];

  // 1. taskRepeats — cadence 存在即表示任务重复
  const taskRepeats = typeof spec.cadence === 'string' && spec.cadence.trim() !== '';
  if (!taskRepeats) {
    blockers.push('loop.cadence is missing — task does not repeat');
  }

  // 2. automatedVerification — 至少有一个 gate
  const automatedVerification = Array.isArray(spec.gates) && spec.gates.length > 0;
  if (!automatedVerification) {
    blockers.push('loop.gates is empty — no automated verification defined');
  }

  // 3. budgetDefined — budget 存在且有上限
  const budgetDefined = spec.budget
    && typeof spec.budget.maxIterations === 'number'
    && spec.budget.maxIterations > 0
    && typeof spec.budget.maxDollars === 'number'
    && spec.budget.maxDollars > 0;
  if (!budgetDefined) {
    blockers.push('loop.budget is missing or has no limits — unbounded execution risk');
  }

  // 4. toolAccessBounded — maker 有明确的 writeAccess 设置
  const toolAccessBounded = spec.maker
    && typeof spec.maker.role === 'string'
    && spec.maker.role.trim() !== '';
  if (!toolAccessBounded) {
    blockers.push('loop.maker.role is missing — tool access not bounded');
  }

  const eligible = blockers.length === 0;

  // 推荐替代命令
  let recommendedAlternative = '';
  if (!eligible) {
    if (!taskRepeats && !automatedVerification) {
      recommendedAlternative = '/quick';
    } else if (!automatedVerification) {
      recommendedAlternative = '/quick';
    } else if (!budgetDefined) {
      recommendedAlternative = '/goal';
    } else {
      recommendedAlternative = '/verify';
    }
  }

  return {
    eligible,
    taskRepeats,
    automatedVerification,
    budgetDefined,
    toolAccessBounded,
    blockers,
    recommendedAlternative,
  };
}

module.exports = {
  LoopSpecError,
  normalizeLoopSpec,
  parseLoopSpecContent,
  loadLoopSpecFile,
  checkIntake,
};
