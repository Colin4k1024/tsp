'use strict';

const WORKFLOW_SCHEMA_VERSION = 'ecc.workflow.v1';
const WORKFLOW_SOURCES = Object.freeze({
  bundled: 'bundled',
  project: 'project',
});
const WORKFLOW_EXECUTION_FIELDS = Object.freeze([
  'prompt',
  'bash',
  'command',
  'loop',
]);
const WORKFLOW_NODE_STATUSES = Object.freeze({
  pending: 'pending',
  running: 'running',
  succeeded: 'succeeded',
  failed: 'failed',
  skipped: 'skipped',
});

module.exports = {
  WORKFLOW_EXECUTION_FIELDS,
  WORKFLOW_NODE_STATUSES,
  WORKFLOW_SCHEMA_VERSION,
  WORKFLOW_SOURCES,
};
