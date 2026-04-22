'use strict';

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const { WorkflowLoaderError } = require('./errors');

const SCHEMA_PATH = path.join(__dirname, '..', '..', '..', 'schemas', 'workflow-definition.schema.json');

let cachedSchema = null;
let cachedValidator = null;

function readSchema() {
  if (cachedSchema) {
    return cachedSchema;
  }

  cachedSchema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  return cachedSchema;
}

function getValidator() {
  if (cachedValidator) {
    return cachedValidator;
  }

  const ajv = new Ajv({
    allErrors: true,
    strict: false,
  });
  cachedValidator = ajv.compile(readSchema());
  return cachedValidator;
}

function formatValidationErrors(errors = []) {
  return errors
    .map(error => `${error.instancePath || '/'} ${error.message}`)
    .join('; ');
}

function validateWorkflowDefinition(payload) {
  const validator = getValidator();
  const valid = validator(payload);
  return {
    valid,
    errors: validator.errors || [],
  };
}

function assertValidWorkflowDefinition(payload, label) {
  const result = validateWorkflowDefinition(payload);
  if (!result.valid) {
    throw new WorkflowLoaderError(
      `Invalid workflow definition${label ? ` (${label})` : ''}: ${formatValidationErrors(result.errors)}`,
      { filePath: label, code: 'invalid_workflow_definition' }
    );
  }
}

module.exports = {
  assertValidWorkflowDefinition,
  formatValidationErrors,
  readSchema,
  validateWorkflowDefinition,
};
