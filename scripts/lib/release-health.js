'use strict';

const { resolveInstallPlan } = require('./install-manifests');
const { listInstallTargetAdapters } = require('./install-targets/registry');

const SUPPORT_LEVEL_ORDER = Object.freeze(['recommended', 'strong', 'partial', 'baseline']);

function classifyTargetSupportLevel(plan = {}) {
  const selectedModuleIds = Array.isArray(plan.selectedModuleIds) ? plan.selectedModuleIds : [];
  const requestedModuleIds = Array.isArray(plan.requestedModuleIds) ? plan.requestedModuleIds : [];
  const selected = new Set(selectedModuleIds);
  const selectedCount = selected.size;
  const requestedCount = requestedModuleIds.length;
  const hasCommandsCore = selected.has('commands-core');
  const hasTeamWorkflow = selected.has('team-workflow');
  const hasSharedSkills = selected.has('shared-skills');

  if (requestedCount > 0 && selectedCount === requestedCount && hasCommandsCore && hasTeamWorkflow && hasSharedSkills) {
    return {
      level: 'recommended',
      reason: 'Full public workflow chain and primary documentation coverage are available.',
    };
  }

  if (hasCommandsCore && hasTeamWorkflow && hasSharedSkills) {
    return {
      level: 'strong',
      reason: 'Core commands and the team workflow chain are present, but some target-specific modules remain intentionally unsupported.',
    };
  }

  if (selectedCount >= 8) {
    return {
      level: 'partial',
      reason: 'The adapter works for a broad subset of modules, but workflow parity or shared-skill coverage is incomplete.',
    };
  }

  return {
    level: 'baseline',
    reason: 'This target is exposed as a public compatibility path, not a full `/team-*` parity install.',
  };
}

function collectTargetSupportMatrix(options = {}) {
  const profileId = options.profileId || 'team';
  const repoRoot = options.repoRoot;

  return listInstallTargetAdapters()
    .map((adapter) => adapter.target)
    .map((target) => {
      const plan = resolveInstallPlan({ profileId, target, repoRoot });
      const classification = classifyTargetSupportLevel(plan);
      return {
        target,
        profileId,
        level: classification.level,
        reason: classification.reason,
        requestedCount: Array.isArray(plan.requestedModuleIds) ? plan.requestedModuleIds.length : 0,
        selectedCount: Array.isArray(plan.selectedModuleIds) ? plan.selectedModuleIds.length : 0,
        skippedCount: Array.isArray(plan.skippedModuleIds) ? plan.skippedModuleIds.length : 0,
        selectedModuleIds: Array.isArray(plan.selectedModuleIds) ? [...plan.selectedModuleIds] : [],
        skippedModuleIds: Array.isArray(plan.skippedModuleIds) ? [...plan.skippedModuleIds] : [],
      };
    });
}

function groupTargetSupportMatrix(matrix = []) {
  return SUPPORT_LEVEL_ORDER
    .map((level) => ({
      level,
      entries: matrix.filter((entry) => entry.level === level),
    }))
    .filter((group) => group.entries.length > 0);
}

module.exports = {
  SUPPORT_LEVEL_ORDER,
  classifyTargetSupportLevel,
  collectTargetSupportMatrix,
  groupTargetSupportMatrix,
};
