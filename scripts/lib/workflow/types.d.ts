/**
 * TypeScript type definitions for the workflow system.
 * This file is the canonical type reference alongside types.js
 */

// Error Interfaces - defined in errors.js

export interface WorkflowExecutorError extends Error {
  name: 'WorkflowExecutorError';
  code: string;
  nodeId: string | null;
}

export interface WorkflowLoaderError extends Error {
  name: 'WorkflowLoaderError';
  code: string;
  filePath: string | null;
}

export interface WorkflowRegistryError extends Error {
  name: 'WorkflowRegistryError';
  code: string;
}

// Enum Types

export enum WorkflowSchemaVersion {
  CURRENT = 'ecc.workflow.v1',
}

export enum WorkflowSource {
  BUNDLED = 'bundled',
  PROJECT = 'project',
}

export enum WorkflowNodeStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export type WorkflowExecutionField = 'prompt' | 'bash' | 'command' | 'loop';

// Workflow Node Types

export interface WorkflowNodeLoop {
  prompt: string;
  until: string;
  fresh_context?: boolean;
  interactive?: boolean;
}

export interface WorkflowNode {
  id: string;
  depends_on?: string[];
  prompt?: string;
  bash?: string;
  command?: string;
  timeout_ms?: number;
  interactive?: boolean;
  loop?: WorkflowNodeLoop;
}

export interface WorkflowDefinition {
  version: string;
  name: string;
  description: string;
  provider?: string;
  model?: string;
  interactive?: boolean;
  additionalDirectories?: string[];
  nodes: WorkflowNode[];
}

// Internal normalized workflow type (used after loading)
export interface NormalizedWorkflow extends WorkflowDefinition {
  nodesById: Map<string, WorkflowNode>;
  requiredVariables: string[];
}

// Run state types
export interface WorkflowNodeState {
  id: string;
  mode: WorkflowExecutionField | null;
  status: WorkflowNodeStatus;
  dependsOn: string[];
  startedAt: string | null;
  finishedAt: string | null;
  output: unknown | null;
  error: string | null;
  reused: boolean;
}

export interface WorkflowRunState {
  workflowName: string;
  status: WorkflowNodeStatus;
  startedAt: string | null;
  finishedAt: string | null;
  nodes: Record<string, WorkflowNodeState>;
}

// Event types
export interface WorkflowEvent {
  type: string;
  at: string;
  [key: string]: unknown;
}

// Workflow run record
export interface WorkflowRunRecord {
  id: string;
  sessionId: string | null;
  workflowName: string;
  workflowFingerprint: string;
  inputContext: Record<string, unknown>;
  source: string | null;
  filePath: string | null;
  resumedFromRunId: string | null;
  status: WorkflowNodeStatus;
  startedAt: string | null;
  finishedAt: string | null;
  batches: string[][];
  runState: WorkflowRunState;
  events: WorkflowEvent[];
  createdAt: string;
  updatedAt: string;
}

// Executor options
export interface ExecuteWorkflowOptions {
  handlers?: Record<WorkflowExecutionField, (context: unknown) => Promise<unknown>>;
  continueOnError?: boolean;
  onEvent?: (event: WorkflowEvent) => void;
  stateStore?: unknown;
  runId?: string;
  resumeFromRunState?: WorkflowRunState;
  inputContext?: Record<string, unknown>;
  sessionId?: string;
  source?: string;
  filePath?: string;
  createdAt?: string;
}

// Executor result
export interface ExecuteWorkflowResult {
  runId: string;
  workflowName: string;
  inputContext: Record<string, unknown>;
  batches: string[][];
  runState: WorkflowRunState;
  events: WorkflowEvent[];
}

// Discovery types
export interface DiscoveredWorkflow {
  workflow: NormalizedWorkflow;
  filePath: string;
  source: WorkflowSource;
}

export interface DiscoverWorkflowsOptions {
  cwd?: string;
  bundledRoot?: string;
  projectRoots?: string[];
}

export interface DiscoverWorkflowsResult {
  workflows: DiscoveredWorkflow[];
}

// Re-export constants as types for backward compatibility
export type WORKFLOW_SCHEMA_VERSION = WorkflowSchemaVersion;
export type WORKFLOW_SOURCES = WorkflowSource;
export type WORKFLOW_EXECUTION_FIELDS = WorkflowExecutionField;
export type WORKFLOW_NODE_STATUSES = WorkflowNodeStatus;