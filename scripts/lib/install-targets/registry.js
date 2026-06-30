const antigravityProject = require('./antigravity-project');
const augmentProject = require('./augment-project');
const cangmingHome = require('./cangming-home');
const claudeHome = require('./claude-home');
const codebuddyProject = require('./codebuddy-project');
const codexHome = require('./codex-home');
const codewhaleHome = require('./codewhale-home');
const copilotHome = require('./copilot-home');
const cursorProject = require('./cursor-project');
const geminiProject = require('./gemini-project');
const opencodeHome = require('./opencode-home');
const windsurfProject = require('./windsurf-project');

const PUBLIC_INSTALL_TARGETS = Object.freeze(['claude', 'codex', 'opencode']);
const TARGET_ALIASES = Object.freeze({
  'claude-code': 'claude',
  claudecode: 'claude',
});

const ADAPTERS = Object.freeze([
  claudeHome,
  cursorProject,
  antigravityProject,
  codexHome,
  geminiProject,
  opencodeHome,
  cangmingHome,
  codewhaleHome,
  codebuddyProject,
  copilotHome,
  windsurfProject,
  augmentProject,
]);

function normalizeInstallTarget(target) {
  const normalized = String(target || '').trim().toLowerCase();
  return TARGET_ALIASES[normalized] || normalized;
}

function listInstallTargetAdapters() {
  return ADAPTERS.slice();
}

function listPublicInstallTargetAdapters() {
  const publicTargets = new Set(PUBLIC_INSTALL_TARGETS);
  return ADAPTERS.filter(adapter => publicTargets.has(adapter.target));
}

function getInstallTargetAdapter(targetOrAdapterId) {
  const normalizedTarget = normalizeInstallTarget(targetOrAdapterId);
  const adapter = ADAPTERS.find(candidate => (
    candidate.supports(normalizedTarget) || candidate.supports(targetOrAdapterId)
  ));

  if (!adapter) {
    throw new Error(`Unknown install target adapter: ${targetOrAdapterId}`);
  }

  return adapter;
}

function planInstallTargetScaffold(options = {}) {
  const adapter = getInstallTargetAdapter(options.target);
  const modules = Array.isArray(options.modules) ? options.modules : [];
  const planningInput = {
    repoRoot: options.repoRoot,
    projectRoot: options.projectRoot || options.repoRoot,
    homeDir: options.homeDir,
  };
  const validationIssues = adapter.validate(planningInput);
  const blockingIssues = validationIssues.filter(issue => issue.severity === 'error');
  if (blockingIssues.length > 0) {
    throw new Error(blockingIssues.map(issue => issue.message).join('; '));
  }
  const targetRoot = adapter.resolveRoot(planningInput);
  const installStatePath = adapter.getInstallStatePath(planningInput);
  const operations = adapter.planOperations({
    ...planningInput,
    modules,
  });

  return {
    adapter: {
      id: adapter.id,
      target: adapter.target,
      kind: adapter.kind,
    },
    targetRoot,
    installStatePath,
    validationIssues,
    operations,
  };
}

module.exports = {
  getInstallTargetAdapter,
  listInstallTargetAdapters,
  listPublicInstallTargetAdapters,
  normalizeInstallTarget,
  PUBLIC_INSTALL_TARGETS,
  planInstallTargetScaffold,
};
