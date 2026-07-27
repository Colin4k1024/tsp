'use strict';

const path = require('path');
const fs = require('fs');
const { loadProfiles, classifyTask, getRecommendedModel } = require('../lib/model-router');

const VALID_MODELS = new Set(['sonnet', 'opus', 'haiku', 'fable']);

function isEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());
}

function getProfileName() {
  return String(process.env.ECC_MODEL_PROFILE || 'default').trim().toLowerCase() || 'default';
}

function logRouting(decision) {
  const logDir = path.join(process.env.HOME || '/tmp', '.claude', 'logs');
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const entry = JSON.stringify({ ...decision, ts: new Date().toISOString() }) + '\n';
    fs.appendFileSync(path.join(logDir, 'model-routing.jsonl'), entry);
  } catch {
    // Non-critical
  }
}

function run(rawInput) {
  if (!isEnabled(process.env.ECC_ENABLE_MODEL_ROUTER)) {
    return { exitCode: 0 };
  }

  let input;
  try {
    input = typeof rawInput === 'string'
      ? (rawInput.trim() ? JSON.parse(rawInput) : {})
      : (rawInput || {});
  } catch {
    return { exitCode: 0 };
  }

  if (input.tool_name !== 'Agent') {
    return { exitCode: 0 };
  }

  const toolInput = input.tool_input || {};

  if (toolInput.model && VALID_MODELS.has(toolInput.model)) {
    logRouting({ action: 'skip', reason: 'explicit_model_set', existingModel: toolInput.model });
    return { exitCode: 0 };
  }

  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..', '..');
  const profiles = loadProfiles(pluginRoot);
  if (!profiles) {
    return { exitCode: 0 };
  }

  const classificationText = [toolInput.prompt || '', toolInput.description || ''].join(' ').trim();
  if (!classificationText) {
    return { exitCode: 0 };
  }

  const classification = classifyTask(classificationText, profiles);
  if (!classification) {
    logRouting({ action: 'skip', reason: 'no_classification', textLength: classificationText.length });
    return { exitCode: 0 };
  }

  const profileName = getProfileName();
  const recommendation = getRecommendedModel(classification.taskType, profileName, profiles);
  if (!recommendation) {
    logRouting({ action: 'skip', reason: 'no_recommendation', taskType: classification.taskType, profile: profileName });
    return { exitCode: 0 };
  }

  if (classification.confidence === 'low') {
    logRouting({ action: 'skip', reason: 'low_confidence', taskType: classification.taskType, model: recommendation.model });
    return { exitCode: 0 };
  }

  const updatedInput = { ...toolInput, model: recommendation.model };

  const contextMessage =
    `[Model Router] Routed to ${recommendation.model} (task: ${classification.taskType}, ` +
    `confidence: ${classification.confidence}, profile: ${profileName}). ` +
    `Reason: ${recommendation.reason}`;

  logRouting({
    action: 'route',
    taskType: classification.taskType,
    model: recommendation.model,
    confidence: classification.confidence,
    profile: profileName,
    reason: recommendation.reason,
  });

  return {
    stdout: JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        updatedInput,
        additionalContext: contextMessage,
      },
    }),
    exitCode: 0,
  };
}

module.exports = { run };
