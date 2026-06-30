'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_TARGET = 'claude';

const TARGET_STATE_DIRS = Object.freeze({
  claude: ['.claude', 'loops'],
  codex: ['.codex', 'loops'],
  opencode: ['.config', 'opencode', 'loops'],
  cangming: ['.cangming', 'loops'],
  codewhale: ['.codewhale', 'loops'],
  codebuddy: ['.codebuddy', 'loops'],
});

const LEGACY_CLAUDE_DIRS = Object.freeze({
  goals: ['.claude', 'goals'],
  triage: ['.claude', 'triage'],
  heartbeatLastRun: ['.claude', 'heartbeat-last-run.json'],
});

function readHome() {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

function normalizeTarget(target) {
  return String(target || process.env.TSP_LOOP_TARGET || DEFAULT_TARGET).trim().toLowerCase() || DEFAULT_TARGET;
}

function projectLocalStateDir(projectRoot) {
  if (!projectRoot) return null;
  return path.join(path.resolve(projectRoot), '.tsp', 'loops');
}

function targetDefaultStateDir(target) {
  const home = readHome();
  const parts = TARGET_STATE_DIRS[normalizeTarget(target)] || TARGET_STATE_DIRS[DEFAULT_TARGET];
  return path.join(home, ...parts);
}

function getLoopStateDir(options = {}) {
  if (process.env.TSP_LOOP_STATE_DIR) {
    return path.resolve(process.env.TSP_LOOP_STATE_DIR);
  }

  if (options.stateDir) {
    return path.resolve(options.stateDir);
  }

  if (options.projectRoot) {
    return projectLocalStateDir(options.projectRoot);
  }

  return targetDefaultStateDir(options.target);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function ensureLoopStateDir(options = {}) {
  return ensureDir(getLoopStateDir(options));
}

function getNamespaceDir(namespace, options = {}) {
  return path.join(getLoopStateDir(options), namespace);
}

function ensureNamespaceDir(namespace, options = {}) {
  return ensureDir(getNamespaceDir(namespace, options));
}

function getGoalPath(goalId, options = {}) {
  return path.join(getNamespaceDir('goals', options), `${goalId}.json`);
}

function getTriageInboxPath(options = {}) {
  return path.join(getNamespaceDir('triage', options), 'inbox.jsonl');
}

function getHeartbeatPath(loopId = 'default', options = {}) {
  return path.join(getNamespaceDir('heartbeat', options), `${loopId}.json`);
}

function getLoopMarkdownStatePath(loopId, options = {}) {
  return path.join(getNamespaceDir('state', options), `${loopId}.md`);
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return filePath;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveGoal(goal, options = {}) {
  return writeJson(getGoalPath(goal.goalId, options), goal);
}

function loadGoal(goalId, options = {}) {
  const filePath = getGoalPath(goalId, options);
  if (fs.existsSync(filePath)) {
    return readJson(filePath);
  }

  const legacyPath = getLegacyGoalPath(goalId);
  if (!options.disableLegacyLookup && legacyPath && fs.existsSync(legacyPath)) {
    return readJson(legacyPath);
  }

  return null;
}

function listJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter(fileName => fileName.endsWith('.json'))
    .map(fileName => path.join(dirPath, fileName));
}

function listGoals(filter, options = {}) {
  const filePaths = listJsonFiles(getNamespaceDir('goals', options));

  if (!options.disableLegacyLookup) {
    const legacyDir = getLegacyDir('goals');
    if (legacyDir && path.resolve(legacyDir) !== path.resolve(getNamespaceDir('goals', options))) {
      filePaths.push(...listJsonFiles(legacyDir));
    }
  }

  const seenGoalIds = new Set();
  return filePaths
    .map(filePath => {
      try {
        return readJson(filePath);
      } catch {
        return null;
      }
    })
    .filter(goal => {
      if (!goal || !goal.goalId || seenGoalIds.has(goal.goalId)) return false;
      seenGoalIds.add(goal.goalId);
      return true;
    })
    .filter(goal => !filter || goal.state === filter)
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
}

function appendTriageItem(item, options = {}) {
  const inboxPath = getTriageInboxPath(options);
  ensureDir(path.dirname(inboxPath));
  fs.appendFileSync(inboxPath, `${JSON.stringify(item)}\n`, 'utf8');
  return inboxPath;
}

function saveHeartbeat(loopId, value, options = {}) {
  return writeJson(getHeartbeatPath(loopId, options), value);
}

function loadHeartbeat(loopId = 'default', options = {}) {
  const filePath = getHeartbeatPath(loopId, options);
  if (fs.existsSync(filePath)) {
    return readJson(filePath);
  }

  const legacyPath = getLegacyHeartbeatLastRunPath();
  if (!options.disableLegacyLookup && loopId === 'last-run' && legacyPath && fs.existsSync(legacyPath)) {
    return readJson(legacyPath);
  }

  return null;
}

function saveLoopMarkdownState(loopId, content, options = {}) {
  const statePath = getLoopMarkdownStatePath(loopId, options);
  ensureDir(path.dirname(statePath));
  fs.writeFileSync(statePath, String(content), 'utf8');
  return statePath;
}

function getLegacyDir(namespace) {
  const parts = LEGACY_CLAUDE_DIRS[namespace];
  if (!parts) return null;
  return path.join(readHome(), ...parts);
}

function getLegacyGoalPath(goalId) {
  const legacyDir = getLegacyDir('goals');
  return legacyDir ? path.join(legacyDir, `${goalId}.json`) : null;
}

function getLegacyHeartbeatLastRunPath() {
  return path.join(readHome(), ...LEGACY_CLAUDE_DIRS.heartbeatLastRun);
}

module.exports = {
  TARGET_STATE_DIRS,
  getLoopStateDir,
  ensureLoopStateDir,
  getNamespaceDir,
  ensureNamespaceDir,
  getGoalPath,
  getTriageInboxPath,
  getHeartbeatPath,
  getLoopMarkdownStatePath,
  saveGoal,
  loadGoal,
  listGoals,
  appendTriageItem,
  saveHeartbeat,
  loadHeartbeat,
  saveLoopMarkdownState,
  targetDefaultStateDir,
  projectLocalStateDir,
};
