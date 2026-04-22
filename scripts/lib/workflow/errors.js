'use strict';

class WorkflowExecutorError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'WorkflowExecutorError';
    this.code = options.code || 'workflow_executor_error';
    this.nodeId = options.nodeId || null;
  }
}

class WorkflowLoaderError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'WorkflowLoaderError';
    this.filePath = options.filePath || null;
    this.code = options.code || 'workflow_loader_error';
  }
}

class WorkflowRegistryError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'WorkflowRegistryError';
    this.code = options.code || 'workflow_registry_error';
  }
}

module.exports = {
  WorkflowExecutorError,
  WorkflowLoaderError,
  WorkflowRegistryError,
};
