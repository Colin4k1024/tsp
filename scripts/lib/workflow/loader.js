'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { WorkflowLoaderError } = require('./errors');
const { assertValidWorkflowDefinition } = require('./schema');
const { extractRequiredVars } = require('./template');
const { WORKFLOW_EXECUTION_FIELDS } = require('./types');

function ensureObject(value, label, filePath) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new WorkflowLoaderError(`${label} must be an object`, {
      filePath,
      code: 'invalid_payload',
    });
  }
}

function normalizeNode(node, filePath, index) {
  ensureObject(node, `nodes[${index}]`, filePath);

  const executionFieldCount = WORKFLOW_EXECUTION_FIELDS.reduce((count, field) => {
    return node[field] !== undefined ? count + 1 : count;
  }, 0);

  if (executionFieldCount !== 1) {
    throw new WorkflowLoaderError(
      `nodes[${index}] must define exactly one execution field: ${WORKFLOW_EXECUTION_FIELDS.join(', ')}`,
      { filePath, code: 'invalid_execution_mode' }
    );
  }

  return {
    ...node,
    depends_on: Array.isArray(node.depends_on) ? [...node.depends_on] : [],
  };
}

function assertAcyclic(nodes, nodesById, filePath) {
  const visited = new Set();
  const active = new Set();

  for (const startNode of nodes) {
    if (visited.has(startNode.id)) {
      continue;
    }

    const stack = [{ nodeId: startNode.id, ancestry: [] }];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const { nodeId, ancestry } = frame;
      const node = nodesById.get(nodeId);

      if (active.has(nodeId)) {
        const cyclePath = [...ancestry, nodeId].join(' -> ');
        throw new WorkflowLoaderError(`Circular dependency detected: ${cyclePath}`, {
          filePath,
          code: 'circular_dependency',
        });
      }

      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        active.add(nodeId);

        const unvisitedDeps = node.depends_on.filter(depId => !visited.has(depId));
        if (unvisitedDeps.length > 0) {
          for (let i = unvisitedDeps.length - 1; i >= 0; i--) {
            stack.push({ nodeId: unvisitedDeps[i], ancestry: [...ancestry, nodeId] });
          }
        } else {
          active.delete(nodeId);
          stack.pop();
        }
      } else {
        active.delete(nodeId);
        stack.pop();
      }
    }
  }
}

function normalizeWorkflowDefinition(definition, filePath) {
  ensureObject(definition, 'workflow definition', filePath);
  assertValidWorkflowDefinition(definition, filePath);

  const nodes = definition.nodes.map((node, index) => normalizeNode(node, filePath, index));
  const nodesById = new Map();

  for (const node of nodes) {
    if (nodesById.has(node.id)) {
      throw new WorkflowLoaderError(`Duplicate node id: ${node.id}`, {
        filePath,
        code: 'duplicate_node_id',
      });
    }
    nodesById.set(node.id, node);
  }

  for (const node of nodes) {
    for (const dependencyId of node.depends_on) {
      if (!nodesById.has(dependencyId)) {
        throw new WorkflowLoaderError(
          `Node "${node.id}" depends on unknown node "${dependencyId}"`,
          { filePath, code: 'unknown_dependency' }
        );
      }
    }
  }

  assertAcyclic(nodes, nodesById, filePath);

  const normalized = {
    version: definition.version,
    name: definition.name,
    description: definition.description,
    provider: definition.provider || null,
    model: definition.model || null,
    interactive: definition.interactive === true,
    additionalDirectories: Array.isArray(definition.additionalDirectories)
      ? [...definition.additionalDirectories]
      : [],
    nodes,
    nodesById,
    requiredVariables: extractRequiredVars({ nodes, nodesById }),
  };

  return normalized;
}

function parseWorkflowContent(content, filePath) {
  let definition;
  try {
    definition = yaml.load(content, {
      filename: path.basename(filePath),
      schema: yaml.JSON_SCHEMA,
    });
  } catch (error) {
    throw new WorkflowLoaderError(`Failed to parse workflow YAML: ${error.message}`, {
      filePath,
      code: 'yaml_parse_error',
    });
  }

  return normalizeWorkflowDefinition(definition, filePath);
}

function loadWorkflowFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new WorkflowLoaderError(`Failed to read workflow file: ${error.message}`, {
      filePath,
      code: 'read_error',
    });
  }

  return {
    path: filePath,
    workflow: parseWorkflowContent(content, filePath),
  };
}

module.exports = {
  WorkflowLoaderError,
  loadWorkflowFile,
  normalizeWorkflowDefinition,
  parseWorkflowContent,
};
