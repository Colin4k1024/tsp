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

module.exports = {
  LoopSpecError,
  normalizeLoopSpec,
  parseLoopSpecContent,
  loadLoopSpecFile,
};
