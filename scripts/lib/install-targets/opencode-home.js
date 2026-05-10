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

function rootAgentFileName(sourcePath, fileName) {
  const normalizedSourcePath = normalizeRelativePath(sourcePath);
  if (normalizedSourcePath === 'agents/specialists' || normalizedSourcePath.startsWith('agents/specialists/')) {
    return `specialist-${fileName}`;
  }
  return fileName;
}

function addRootAgentOperations(operations, seen, moduleId, sourceRelativePath, input, targetRoot) {
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
      const fileName = rootAgentFileName(path.dirname(sourcePath), path.basename(sourcePath));
      addCopyOperation(
        operations,
        seen,
        moduleId,
        sourcePath,
        path.join(targetRoot, 'agents', fileName),
        'flatten-agent-copy'
      );
      continue;
    }

    if (!stat.isDirectory()) {
      continue;
    }

    for (const entry of fs.readdirSync(absoluteSourceDir, { withFileTypes: true }).sort((left, right) => (
      left.name.localeCompare(right.name)
    ))) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const fileName = rootAgentFileName(sourcePath, entry.name);
        addCopyOperation(
          operations,
          seen,
          moduleId,
          path.join(sourcePath, entry.name),
          path.join(targetRoot, 'agents', fileName),
          'flatten-agent-copy'
        );
      }
    }
  }
}

function planOpenCodeOperations(input, adapter) {
  const targetRoot = adapter.resolveRoot(input);
  const pluginRoot = path.join(targetRoot, 'plugins', PLUGIN_NAME);
  const operations = [];
  const seen = new Set();

  for (const module of Array.isArray(input.modules) ? input.modules : []) {
    for (const rawSourcePath of Array.isArray(module.paths) ? module.paths : []) {
      const sourceRelativePath = normalizeRelativePath(rawSourcePath);

      addCopyOperation(
        operations,
        seen,
        module.id,
        sourceRelativePath,
        path.join(pluginRoot, sourceRelativePath),
        'plugin-copy'
      );

      if (sourceRelativePath === 'commands' || sourceRelativePath.startsWith('commands/')) {
        const commandSuffix = sourceRelativePath === 'commands'
          ? ''
          : sourceRelativePath.slice('commands/'.length);
        addCopyOperation(
          operations,
          seen,
          module.id,
          sourceRelativePath,
          path.join(targetRoot, 'command', commandSuffix),
          'opencode-command-copy'
        );
      }

      addRootAgentOperations(operations, seen, module.id, sourceRelativePath, input, targetRoot);
    }
  }

  return operations;
}

module.exports = createInstallTargetAdapter({
  id: 'opencode-home',
  target: 'opencode',
  kind: 'home',
  rootSegments: ['.config', 'opencode'],
  installStatePathSegments: ['ecc-install-state.json'],
  nativeRootRelativePath: '.opencode',
  planOperations: planOpenCodeOperations,
});
