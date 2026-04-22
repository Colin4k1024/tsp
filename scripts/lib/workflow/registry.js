'use strict';

const path = require('path');

const { WorkflowRegistryError } = require('./errors');
const { discoverWorkflows } = require('./discovery');
const { loadWorkflowFile } = require('./loader');

function resolveWorkflowReference(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());

  // Compute allowed roots for path traversal validation
  const bundledRoot = options.bundledRoot
    ? path.resolve(cwd, options.bundledRoot)
    : path.join(cwd, 'workflows', 'defaults');
  const projectRoots = Array.isArray(options.projectRoots)
    ? options.projectRoots.map(rootDir => path.resolve(cwd, rootDir))
    : [path.join(cwd, '.archon', 'workflows')];
  const allowedRoots = [bundledRoot, ...projectRoots].filter(Boolean);

  function assertPathWithinAllowedRoots(resolvedPath) {
    const isAllowed = allowedRoots.some(allowedRoot => {
      return resolvedPath === allowedRoot || resolvedPath.startsWith(allowedRoot + path.sep);
    });

    if (!isAllowed) {
      throw new WorkflowRegistryError(
        `Path traversal detected: resolved path "${resolvedPath}" is not within allowed roots`,
        { code: 'path_traversal_detected' }
      );
    }
  }

  if (options.filePath) {
    // Absolute paths are already resolved — no traversal risk
    const isAbsolute = path.isAbsolute(options.filePath);
    const resolvedPath = isAbsolute
      ? options.filePath
      : path.resolve(cwd, options.filePath);
    if (!isAbsolute) {
      assertPathWithinAllowedRoots(resolvedPath);
    }
    const loaded = loadWorkflowFile(resolvedPath);
    return {
      workflow: loaded.workflow,
      filePath: loaded.path,
      source: options.source || 'file',
    };
  }

  if (!options.name) {
    throw new WorkflowRegistryError('Workflow reference requires either --name or --file', {
      code: 'missing_workflow_reference',
    });
  }

  const discovered = discoverWorkflows({
    cwd,
    bundledRoot: options.bundledRoot,
    projectRoots: options.projectRoots,
  });
  const match = discovered.workflows.find(entry => entry.workflow.name === options.name);

  if (!match) {
    throw new WorkflowRegistryError(`Unknown workflow: ${options.name}`, {
      code: 'workflow_not_found',
    });
  }

  return {
    workflow: match.workflow,
    filePath: match.filePath,
    source: match.source,
  };
}

function resolveWorkflowReferenceFromRun(workflowRun, options = {}) {
  if (!workflowRun || typeof workflowRun !== 'object') {
    throw new WorkflowRegistryError('Workflow run is required to resolve a workflow reference', {
      code: 'missing_workflow_run',
    });
  }

  if (workflowRun.filePath) {
    return resolveWorkflowReference({
      ...options,
      filePath: workflowRun.filePath,
      source: workflowRun.source || options.source || 'file',
    });
  }

  return resolveWorkflowReference({
    ...options,
    name: workflowRun.workflowName,
  });
}

module.exports = {
  WorkflowRegistryError,
  resolveWorkflowReference,
  resolveWorkflowReferenceFromRun,
};
