'use strict';

const crypto = require('crypto');

const { WorkflowExecutorError } = require('./errors');
const { WORKFLOW_EXECUTION_FIELDS, WORKFLOW_NODE_STATUSES } = require('./types');

function computeWorkflowFingerprint(workflow) {
  const signature = {
    version: workflow.version || null,
    name: workflow.name,
    nodes: workflow.nodes.map(node => ({
      id: node.id,
      dependsOn: [...node.depends_on],
      mode: resolveExecutionMode(node),
      prompt: node.prompt || null,
      command: node.command || null,
      bash: node.bash || null,
      timeoutMs: node.timeout_ms || null,
      loop: node.loop || null,
    })),
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(signature))
    .digest('hex');
}

function resolveExecutionMode(node) {
  return WORKFLOW_EXECUTION_FIELDS.find(field => node[field] !== undefined) || null;
}

function createExecutionBatches(workflow) {
  const pendingCounts = new Map();
  const dependentsByNode = new Map();

  for (const node of workflow.nodes) {
    pendingCounts.set(node.id, node.depends_on.length);
    dependentsByNode.set(node.id, []);
  }

  for (const node of workflow.nodes) {
    for (const dependencyId of node.depends_on) {
      dependentsByNode.get(dependencyId).push(node.id);
    }
  }

  const batches = [];
  let ready = workflow.nodes
    .filter(node => pendingCounts.get(node.id) === 0)
    .map(node => node.id)
    .sort();
  let visitedCount = 0;

  while (ready.length > 0) {
    batches.push(ready);
    const nextReady = [];
    for (const nodeId of ready) {
      visitedCount += 1;
      for (const dependentId of dependentsByNode.get(nodeId)) {
        const remaining = pendingCounts.get(dependentId) - 1;
        pendingCounts.set(dependentId, remaining);
        if (remaining === 0) {
          nextReady.push(dependentId);
        }
      }
    }
    ready = nextReady.sort();
  }

  if (visitedCount !== workflow.nodes.length) {
    throw new WorkflowExecutorError('Workflow graph is not executable because dependencies never resolve', {
      code: 'unresolvable_graph',
    });
  }

  return batches;
}

function createRunState(workflow, { resumeFromRunState } = {}) {
  const nodes = {};
  for (const node of workflow.nodes) {
    const resumedNodeState = resumeFromRunState && resumeFromRunState.nodes
      ? resumeFromRunState.nodes[node.id]
      : null;
    const reused = resumedNodeState && resumedNodeState.status === WORKFLOW_NODE_STATUSES.succeeded;
    nodes[node.id] = {
      id: node.id,
      mode: resolveExecutionMode(node),
      status: reused ? WORKFLOW_NODE_STATUSES.succeeded : WORKFLOW_NODE_STATUSES.pending,
      dependsOn: [...node.depends_on],
      startedAt: reused ? resumedNodeState.startedAt || null : null,
      finishedAt: reused ? resumedNodeState.finishedAt || null : null,
      output: reused ? resumedNodeState.output ?? null : null,
      error: reused ? resumedNodeState.error ?? null : null,
      reused,
    };
  }

  return {
    workflowName: workflow.name,
    status: WORKFLOW_NODE_STATUSES.pending,
    startedAt: null,
    finishedAt: null,
    nodes,
  };
}

function markPendingNodesSkipped(runState, reason) {
  const now = new Date().toISOString();
  for (const nodeState of Object.values(runState.nodes)) {
    if (nodeState.status === WORKFLOW_NODE_STATUSES.pending) {
      nodeState.status = WORKFLOW_NODE_STATUSES.skipped;
      nodeState.startedAt = nodeState.startedAt || now;
      nodeState.finishedAt = now;
      nodeState.error = reason;
    }
  }
}

function emitEvent(events, onEvent, type, payload) {
  const event = {
    type,
    at: new Date().toISOString(),
    ...payload,
  };
  events.push(event);
  if (typeof onEvent === 'function') {
    onEvent(event);
  }
}

function buildWorkflowRunRecord(runId, workflow, runState, batches, events, options = {}) {
  return {
    id: runId,
    sessionId: options.sessionId ?? null,
    workflowName: workflow.name,
    workflowFingerprint: computeWorkflowFingerprint(workflow),
    inputContext: options.inputContext || {},
    source: options.source ?? null,
    filePath: options.filePath ?? null,
    resumedFromRunId: options.resumedFromRunId ?? null,
    status: runState.status,
    startedAt: runState.startedAt,
    finishedAt: runState.finishedAt,
    batches,
    runState,
    events,
    createdAt: options.createdAt || runState.startedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function persistWorkflowRun(stateStore, runId, workflow, runState, batches, events, options = {}) {
  if (!stateStore) {
    if (options.requirePersistence) {
      throw new WorkflowExecutorError('Workflow persistence is required but no state store was provided', {
        code: 'missing_state_store',
      });
    }
    return null;
  }

  if (typeof stateStore.upsertWorkflowRun !== 'function') {
    throw new WorkflowExecutorError('State store does not support workflow run persistence', {
      code: 'unsupported_state_store',
    });
  }

  try {
    return stateStore.upsertWorkflowRun(
      buildWorkflowRunRecord(runId, workflow, runState, batches, events, options)
    );
  } catch (error) {
    throw new WorkflowExecutorError(`Failed to persist workflow run: ${error.message}`, {
      code: 'workflow_persistence_failed',
    });
  }
}

async function executeNode(node, context) {
  const mode = resolveExecutionMode(node);
  const handler = context.handlers[mode];
  if (typeof handler !== 'function') {
    throw new WorkflowExecutorError(`No handler registered for workflow mode: ${mode}`, {
      code: 'missing_handler',
      nodeId: node.id,
    });
  }

  return handler({
    workflow: context.workflow,
    node,
    runState: context.runState,
    events: context.events,
  });
}

async function executeWorkflow(workflow, options = {}) {
  const handlers = options.handlers || {};
  const continueOnError = options.continueOnError === true;
  const onEvent = options.onEvent;
  const stateStore = options.stateStore || null;
  const runId = options.runId || crypto.randomUUID();
  const batches = createExecutionBatches(workflow);
  const runState = createRunState(workflow, {
    resumeFromRunState: options.resumeFromRunState || null,
  });
  const events = [];
  const resumedNodeIds = Object.values(runState.nodes)
    .filter(nodeState => nodeState.reused)
    .map(nodeState => nodeState.id);

  runState.status = WORKFLOW_NODE_STATUSES.running;
  runState.startedAt = new Date().toISOString();
  emitEvent(events, onEvent, 'workflow.started', {
    workflowName: workflow.name,
    batchCount: batches.length,
    resumedFromRunId: options.resumedFromRunId || null,
    resumedNodeCount: resumedNodeIds.length,
  });
  persistWorkflowRun(stateStore, runId, workflow, runState, batches, events, options);

  let failed = false;

  for (const batch of batches) {
    // Batches are dependency layers. Nodes remain sequential within a batch for now,
    // but later layers only begin after the current layer is fully evaluated.
    emitEvent(events, onEvent, 'workflow.batch.started', {
      workflowName: workflow.name,
      nodeIds: batch,
    });

    for (const nodeId of batch) {
      const node = workflow.nodesById.get(nodeId);
      const nodeState = runState.nodes[nodeId];

      if (nodeState.reused) {
        emitEvent(events, onEvent, 'workflow.node.reused', {
          workflowName: workflow.name,
          nodeId,
          mode: nodeState.mode,
          resumedFromRunId: options.resumedFromRunId || null,
        });
        continue;
      }

      const blockedDependency = node.depends_on.find(dependencyId => {
        const dependencyState = runState.nodes[dependencyId];
        return dependencyState.status !== WORKFLOW_NODE_STATUSES.succeeded;
      });

      if (blockedDependency) {
        nodeState.status = WORKFLOW_NODE_STATUSES.skipped;
        nodeState.startedAt = new Date().toISOString();
        nodeState.finishedAt = nodeState.startedAt;
        nodeState.error = `Blocked by dependency ${blockedDependency}`;
        emitEvent(events, onEvent, 'workflow.node.skipped', {
          workflowName: workflow.name,
          nodeId,
          reason: nodeState.error,
        });
        persistWorkflowRun(stateStore, runId, workflow, runState, batches, events, options);
        continue;
      }

      nodeState.status = WORKFLOW_NODE_STATUSES.running;
      nodeState.startedAt = new Date().toISOString();
      emitEvent(events, onEvent, 'workflow.node.started', {
        workflowName: workflow.name,
        nodeId,
        mode: nodeState.mode,
      });

      try {
        const output = await executeNode(node, {
          workflow,
          handlers,
          runState,
          events,
        });
        nodeState.status = WORKFLOW_NODE_STATUSES.succeeded;
        nodeState.finishedAt = new Date().toISOString();
        nodeState.output = output === undefined ? null : output;
        emitEvent(events, onEvent, 'workflow.node.completed', {
          workflowName: workflow.name,
          nodeId,
          mode: nodeState.mode,
        });
        persistWorkflowRun(stateStore, runId, workflow, runState, batches, events, options);
      } catch (error) {
        failed = true;
        nodeState.status = WORKFLOW_NODE_STATUSES.failed;
        nodeState.finishedAt = new Date().toISOString();
        nodeState.error = error instanceof Error ? error.message : String(error);
        emitEvent(events, onEvent, 'workflow.node.failed', {
          workflowName: workflow.name,
          nodeId,
          mode: nodeState.mode,
          error: nodeState.error,
        });
        persistWorkflowRun(stateStore, runId, workflow, runState, batches, events, options);

        if (!continueOnError) {
          // Preserve same-layer execution while preventing downstream layers from starting.
          continue;
        }
      }
    }

    emitEvent(events, onEvent, 'workflow.batch.completed', {
      workflowName: workflow.name,
      nodeIds: batch,
    });

    if (failed && !continueOnError) {
      markPendingNodesSkipped(runState, `Workflow aborted after batch ${batch.join(', ')} failed`);
      persistWorkflowRun(stateStore, runId, workflow, runState, batches, events, options);
      break;
    }
  }

  runState.status = failed ? WORKFLOW_NODE_STATUSES.failed : WORKFLOW_NODE_STATUSES.succeeded;
  runState.finishedAt = new Date().toISOString();
  emitEvent(events, onEvent, failed ? 'workflow.failed' : 'workflow.completed', {
    workflowName: workflow.name,
    status: runState.status,
  });
  persistWorkflowRun(stateStore, runId, workflow, runState, batches, events, options);

  return {
    runId,
    workflowName: workflow.name,
    inputContext: options.inputContext || {},
    batches,
    runState,
    events,
  };
}

module.exports = {
  WorkflowExecutorError,
  computeWorkflowFingerprint,
  createExecutionBatches,
  createRunState,
  executeWorkflow,
  persistWorkflowRun,
  resolveExecutionMode,
};
