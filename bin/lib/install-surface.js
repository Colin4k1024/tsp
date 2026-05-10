'use strict';

const path = require('path');

const packageRoot = path.resolve(__dirname, '../..');
const { listInstallProfiles } = require(path.join(packageRoot, 'scripts/lib/install-manifests'));
const { listPublicInstallTargetAdapters } = require(path.join(packageRoot, 'scripts/lib/install-targets/registry'));

const TARGET_METADATA = Object.freeze({
  claude: {
    label: 'Claude',
    installPath: '~/.claude/',
    scope: 'home-level',
  },
  cursor: {
    label: 'Cursor',
    installPath: './.cursor/',
    scope: 'project-level',
  },
  antigravity: {
    label: 'Antigravity',
    installPath: './.agent/',
    scope: 'project-level',
  },
  codex: {
    label: 'Codex',
    installPath: '~/.codex/',
    scope: 'home-level',
  },
  gemini: {
    label: 'Gemini',
    installPath: './.gemini/',
    scope: 'project-level',
  },
  opencode: {
    label: 'OpenCode',
    installPath: '~/.config/opencode/',
    scope: 'home-level',
  },
  codebuddy: {
    label: 'CodeBuddy',
    installPath: './.codebuddy/',
    scope: 'project-level',
  },
  copilot: {
    label: 'Copilot',
    installPath: '~/.github/copilot-instructions.md',
    scope: 'home-level',
  },
  windsurf: {
    label: 'Windsurf',
    installPath: './.windsurf/',
    scope: 'project-level',
  },
  augment: {
    label: 'Augment',
    installPath: './.augment/',
    scope: 'project-level',
  },
});

const PROFILE_METADATA = Object.freeze({
  core: {
    summary: 'Minimal baseline (commands, hooks, platform configs)',
  },
  developer: {
    summary: 'Default engineering profile (frameworks, database, orchestration)',
  },
  security: {
    summary: 'Security-heavy setup with baseline runtime',
  },
  research: {
    summary: 'Research, synthesis, and publishing workflows',
  },
  team: {
    summary: 'Role-based collaboration + shared workflow stack',
    recommended: true,
  },
  full: {
    summary: 'Complete public install with every classified module',
  },
});

const PUBLIC_PROFILE_ORDER = Object.freeze(['core', 'developer', 'security', 'research', 'team', 'full']);

function titleCase(value) {
  return String(value || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function listPublicInstallTargets() {
  return listPublicInstallTargetAdapters().map((adapter) => {
    const metadata = TARGET_METADATA[adapter.target] || {};
    return {
      id: adapter.target,
      label: metadata.label || titleCase(adapter.target),
      installPath: metadata.installPath || (adapter.kind === 'home' ? `~/.${adapter.target}/` : `./.${adapter.target}/`),
      scope: metadata.scope || (adapter.kind === 'home' ? 'home-level' : 'project-level'),
    };
  });
}

function listPublicInstallProfiles() {
  const profiles = listInstallProfiles({ repoRoot: packageRoot }).map((profile) => {
    const metadata = PROFILE_METADATA[profile.id] || {};
    return {
      id: profile.id,
      summary: metadata.summary || profile.description || '',
      recommended: Boolean(metadata.recommended),
    };
  });

  const orderIndex = new Map(PUBLIC_PROFILE_ORDER.map((id, index) => [id, index]));
  profiles.sort((left, right) => {
    const leftIndex = orderIndex.has(left.id) ? orderIndex.get(left.id) : Number.MAX_SAFE_INTEGER;
    const rightIndex = orderIndex.has(right.id) ? orderIndex.get(right.id) : Number.MAX_SAFE_INTEGER;
    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }
    return left.id.localeCompare(right.id);
  });

  return profiles;
}

function formatChoiceRow(label, installPath, scope) {
  return `${label.padEnd(12)} — ${installPath.padEnd(30)} (${scope})`;
}

function buildTargetChoices() {
  return listPublicInstallTargets().map((target) => ({
    name: formatChoiceRow(target.label, target.installPath, target.scope),
    value: target.id,
  }));
}

function buildProfileChoices() {
  return listPublicInstallProfiles().map((profile) => ({
    name: `${profile.id.padEnd(11)} — ${profile.summary}${profile.recommended ? ' (recommended)' : ''}`,
    value: profile.id,
  }));
}

function formatInlineList(values) {
  return values.join('  ');
}

module.exports = {
  buildProfileChoices,
  buildTargetChoices,
  formatInlineList,
  listPublicInstallProfiles,
  listPublicInstallTargets,
};
