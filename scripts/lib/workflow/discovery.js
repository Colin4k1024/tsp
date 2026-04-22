'use strict';

const fs = require('fs');
const path = require('path');

const { WorkflowLoaderError, loadWorkflowFile } = require('./loader');
const { WORKFLOW_SOURCES } = require('./types');

const WORKFLOW_FILE_PATTERN = /\.ya?ml$/i;

function walkWorkflowFiles(rootDir) {
  if (!rootDir || !fs.existsSync(rootDir)) {
    return [];
  }

  const discovered = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }
      if (WORKFLOW_FILE_PATTERN.test(entry.name)) {
        discovered.push(entryPath);
      }
    }
  }

  return discovered.sort();
}

function normalizeRoot(rootDir, source) {
  if (!rootDir) {
    return null;
  }

  return {
    rootDir: path.resolve(rootDir),
    source,
  };
}

function createErrorRecord(filePath, source, error) {
  return {
    filePath,
    source,
    error: error instanceof Error ? error.message : String(error),
    code: error instanceof WorkflowLoaderError ? error.code : 'workflow_discovery_error',
  };
}

function discoverWorkflows(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const bundledRoot = options.bundledRoot
    ? path.resolve(options.bundledRoot)
    : path.join(cwd, 'workflows', 'defaults');
  const projectRoots = Array.isArray(options.projectRoots)
    ? options.projectRoots.map(rootDir => path.resolve(cwd, rootDir))
    : [path.join(cwd, '.archon', 'workflows')];

  const sources = [
    normalizeRoot(bundledRoot, WORKFLOW_SOURCES.bundled),
    ...projectRoots.map(rootDir => normalizeRoot(rootDir, WORKFLOW_SOURCES.project)),
  ].filter(Boolean);

  const workflowsByName = new Map();
  const errors = [];

  for (const source of sources) {
    const files = walkWorkflowFiles(source.rootDir);
    for (const filePath of files) {
      try {
        const loaded = loadWorkflowFile(filePath);
        const existing = workflowsByName.get(loaded.workflow.name);
        if (!existing || source.source === WORKFLOW_SOURCES.project) {
          workflowsByName.set(loaded.workflow.name, {
            workflow: loaded.workflow,
            filePath,
            source: source.source,
          });
        }
      } catch (error) {
        errors.push(createErrorRecord(filePath, source.source, error));
      }
    }
  }

  return {
    workflows: [...workflowsByName.values()].sort((left, right) => (
      left.workflow.name.localeCompare(right.workflow.name)
    )),
    errors,
  };
}

module.exports = {
  WORKFLOW_FILE_PATTERN,
  discoverWorkflows,
  walkWorkflowFiles,
};
