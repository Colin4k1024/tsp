const fs = require('fs');
const path = require('path');

const {
  createInstallTargetAdapter,
  createManagedOperation,
  normalizeRelativePath,
} = require('./helpers');

const PLUGIN_NAME = require('../team-skills-data.json').plugin.name;

function addOperation(operations, seen, operation) {
  const key = `${operation.sourceRelativePath}=>${operation.destinationPath}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  operations.push(operation);
}

function addCopyOperation(operations, seen, moduleId, sourceRelativePath, destinationPath, strategy = 'preserve-relative-path') {
  addOperation(operations, seen, createManagedOperation({
    moduleId,
    sourceRelativePath,
    destinationPath,
    strategy,
  }));
}

function sourceDir(input, sourceRelativePath) {
  return path.join(input.repoRoot || '', normalizeRelativePath(sourceRelativePath));
}

function addAgentOperations(operations, seen, moduleId, sourceRelativePath, input, targetRoot) {
  const normalizedSourcePath = normalizeRelativePath(sourceRelativePath);
  if (normalizedSourcePath !== 'agents' && !normalizedSourcePath.startsWith('agents/')) {
    return;
  }

  const agentDirs = normalizedSourcePath === 'agents'
    ? ['roles', 'specialists']
    : [''];

  for (const agentDir of agentDirs) {
    const sourcePath = agentDir ? path.join(normalizedSourcePath, agentDir) : normalizedSourcePath;
    const absoluteSourceDir = sourceDir(input, sourcePath);
    if (!input.repoRoot || !fs.existsSync(absoluteSourceDir)) {
      continue;
    }

    const stat = fs.statSync(absoluteSourceDir);
    if (stat.isFile() && path.extname(absoluteSourceDir) === '.md') {
      const fileName = path.basename(sourcePath);
      addCopyOperation(
        operations, seen, moduleId, sourcePath,
        path.join(targetRoot, 'agents', fileName),
        'flatten-agent-copy'
      );
      continue;
    }

    if (!stat.isDirectory()) {
      continue;
    }

    for (const entry of fs.readdirSync(absoluteSourceDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const prefix = agentDir === 'specialists' ? 'specialist-' : '';
        addCopyOperation(
          operations, seen, moduleId,
          path.join(sourcePath, entry.name),
          path.join(targetRoot, 'agents', `${prefix}${entry.name}`),
          'flatten-agent-copy'
        );
      }
    }
  }
}

function addRuleOperations(operations, seen, moduleId, sourceRelativePath, input, targetRoot) {
  const normalizedSourcePath = normalizeRelativePath(sourceRelativePath);
  if (normalizedSourcePath !== 'rules' && !normalizedSourcePath.startsWith('rules/')) {
    return;
  }

  const absoluteSourceDir = sourceDir(input, normalizedSourcePath);
  if (!input.repoRoot || !fs.existsSync(absoluteSourceDir) || !fs.statSync(absoluteSourceDir).isDirectory()) {
    return;
  }

  const entries = fs.readdirSync(absoluteSourceDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const entryPath = path.join(absoluteSourceDir, entry.name);
    if (entry.isDirectory()) {
      const subEntries = fs.readdirSync(entryPath, { withFileTypes: true });
      for (const sub of subEntries) {
        if (sub.isFile() && sub.name.endsWith('.md')) {
          addCopyOperation(
            operations, seen, moduleId,
            path.join(normalizedSourcePath, entry.name, sub.name),
            path.join(targetRoot, 'rules', entry.name, sub.name),
            'rule-copy'
          );
        }
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      addCopyOperation(
        operations, seen, moduleId,
        path.join(normalizedSourcePath, entry.name),
        path.join(targetRoot, 'rules', entry.name),
        'rule-copy'
      );
    }
  }
}

function planCodeWhaleOperations(input, adapter) {
  const targetRoot = adapter.resolveRoot(input);
  const operations = [];
  const seen = new Set();

  for (const module of Array.isArray(input.modules) ? input.modules : []) {
    for (const rawSourcePath of Array.isArray(module.paths) ? module.paths : []) {
      const sourceRelativePath = normalizeRelativePath(rawSourcePath);

      // Skills: preserve directory structure
      if (sourceRelativePath === 'skills' || sourceRelativePath.startsWith('skills/')) {
        addCopyOperation(
          operations, seen, module.id, sourceRelativePath,
          path.join(targetRoot, 'skills', sourceRelativePath.replace(/^skills\/?/, '')),
          'skill-copy'
        );
      }

      // Commands: flatten to commands/
      if (sourceRelativePath === 'commands' || sourceRelativePath.startsWith('commands/')) {
        const commandSuffix = sourceRelativePath === 'commands'
          ? ''
          : sourceRelativePath.slice('commands/'.length);
        addCopyOperation(
          operations, seen, module.id, sourceRelativePath,
          path.join(targetRoot, 'commands', commandSuffix),
          'command-copy'
        );
      }

      // Agents: flatten roles + specialists
      addAgentOperations(operations, seen, module.id, sourceRelativePath, input, targetRoot);

      // Rules: preserve namespace/file structure
      addRuleOperations(operations, seen, module.id, sourceRelativePath, input, targetRoot);

      // Contexts: direct copy
      if (sourceRelativePath === 'contexts' || sourceRelativePath.startsWith('contexts/')) {
        const contextSuffix = sourceRelativePath === 'contexts'
          ? ''
          : sourceRelativePath.slice('contexts/'.length);
        addCopyOperation(
          operations, seen, module.id, sourceRelativePath,
          path.join(targetRoot, 'contexts', contextSuffix),
          'context-copy'
        );
      }

      // Hooks: copy hooks directory for reference, config.toml injection handled by post-install
      if (sourceRelativePath === 'hooks' || sourceRelativePath.startsWith('hooks/')) {
        addCopyOperation(
          operations, seen, module.id, sourceRelativePath,
          path.join(targetRoot, 'hooks', sourceRelativePath.replace(/^hooks\/?/, '')),
          'hook-copy'
        );
      }
    }
  }

  return operations;
}

module.exports = createInstallTargetAdapter({
  id: 'codewhale-home',
  target: 'codewhale',
  kind: 'home',
  rootSegments: ['.codewhale'],
  installStatePathSegments: ['ecc-install-state.json'],
  nativeRootRelativePath: '.codewhale',
  planOperations: planCodeWhaleOperations,
});
