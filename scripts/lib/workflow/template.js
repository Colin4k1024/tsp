'use strict';

/**
 * Shell metacharacters that must be escaped to prevent template injection attacks.
 * These characters have special meaning in bash/command contexts.
 */
const SHELL_METACHARACTERS = /[;|&$`(){}[\]<>#*?!~"']/g;

/**
 * Escapes a value for safe use within a double-quoted shell string.
 *
 * This prevents template injection attacks where malicious variable values
 * could break out of quoted strings and inject arbitrary shell commands.
 *
 * @param {unknown} value - The value to sanitize
 * @returns {string} The escaped value safe for shell use
 */
function sanitizeForShell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Escape backslashes first (since we use backslash as the escape character)
  // Then escape all shell metacharacters by prefixing with backslash
  return str.replace(/\\/g, '\\\\').replace(SHELL_METACHARACTERS, (match) => {
    return '\\' + match;
  });
}

/**
 * Substitutes {{variable}} placeholders in a workflow with values from context,
 * performing shell-safe escaping for bash/command node fields.
 *
 * SECURITY: bash and command node variable values are automatically escaped
 * to prevent template injection attacks. Prompt fields are substituted but
 * not shell-escaped (since they don't execute in a shell context).
 *
 * @param {object} workflow - The workflow object
 * @param {object} context - Object mapping variable names to values
 * @returns {object} New workflow object with substituted values
 */
function substituteVariables(workflow, context = {}) {
  function substituteValue(value, escapeForShell = false) {
    if (typeof value !== 'string') {
      return value;
    }

    return value.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, varName) => {
      const rawValue = context[varName];
      if (rawValue === undefined) {
        return match; // Preserve unresolved variables
      }

      const stringValue = String(rawValue);
      // Only escape for shell contexts (bash/command), not for prompts
      return escapeForShell ? sanitizeForShell(stringValue) : stringValue;
    });
  }

  function substituteNode(node) {
    const substituted = { ...node };

    // Shell-escape values in bash and command fields
    for (const field of ['bash', 'command']) {
      if (substituted[field]) {
        substituted[field] = substituteValue(substituted[field], true);
      }
    }

    // Substitute but don't shell-escape prompt fields
    if (substituted.prompt) {
      substituted.prompt = substituteValue(substituted.prompt, false);
    }

    // Handle loop nodes
    if (substituted.loop && typeof substituted.loop === 'object') {
      substituted.loop = { ...substituted.loop };
      if (substituted.loop.prompt) {
        substituted.loop.prompt = substituteValue(substituted.loop.prompt, false);
      }
      if (substituted.loop.until) {
        substituted.loop.until = substituteValue(substituted.loop.until, false);
      }
    }

    return substituted;
  }

  return {
    ...workflow,
    nodes: workflow.nodes.map(substituteNode),
  };
}

function extractTemplateVariables(value) {
  if (typeof value !== 'string') {
    return [];
  }

  const variables = new Set();
  for (const match of value.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g)) {
    variables.add(match[1]);
  }

  return [...variables];
}

function extractNodeVariables(node) {
  const variables = new Set();
  for (const key of ['prompt', 'command', 'bash']) {
    for (const variable of extractTemplateVariables(node[key])) {
      variables.add(variable);
    }
  }

  if (node.loop && typeof node.loop === 'object') {
    for (const key of ['prompt', 'until']) {
      for (const variable of extractTemplateVariables(node.loop[key])) {
        variables.add(variable);
      }
    }
  }

  return [...variables];
}

function extractRequiredVars(workflow) {
  const variables = new Set();
  for (const node of workflow.nodes || []) {
    for (const variable of extractNodeVariables(node)) {
      variables.add(variable);
    }
  }
  return [...variables].sort((left, right) => left.localeCompare(right));
}

function getMissingRequiredVars(workflow, inputContext = {}) {
  return extractRequiredVars(workflow).filter(variable => !Object.prototype.hasOwnProperty.call(inputContext, variable));
}

module.exports = {
  extractRequiredVars,
  extractTemplateVariables,
  getMissingRequiredVars,
  sanitizeForShell,
  substituteVariables,
};
