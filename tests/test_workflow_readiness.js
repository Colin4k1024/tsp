#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  WorkflowValidationError,
  validateTaskDir,
} = require('../scripts/validate-workflow-state');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
  }
}

function makeTempTaskDir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-ready-'));
  const sourceDir = path.join(__dirname, 'fixtures', 'workflow-valid');
  const taskDir = path.join(root, 'workflow-valid');
  fs.cpSync(sourceDir, taskDir, { recursive: true });
  return { root, taskDir };
}

function rewriteHandoff(taskDir, { currentPhase, targetPhase, readinessStatus }) {
  const handoffPath = path.join(taskDir, 'handoffs', '001-tech-lead-to-backend-engineer.md');
  const content = fs.readFileSync(handoffPath, 'utf8')
    .replace('current_phase: handoff-ready', `current_phase: ${currentPhase}`)
    .replace('target_phase: execute', `target_phase: ${targetPhase}`)
    .replace('readiness_status: handoff-ready', `readiness_status: ${readinessStatus}`)
    .replace('## current_phase\n\nhandoff-ready', `## current_phase\n\n${currentPhase}`)
    .replace('## target_phase\n\nexecute', `## target_phase\n\n${targetPhase}`)
    .replace('## readiness_status\n\nhandoff-ready', `## readiness_status\n\n${readinessStatus}`);
  fs.writeFileSync(handoffPath, content, 'utf8');
}

function addReleaseArtifacts(taskDir) {
  fs.writeFileSync(
    path.join(taskDir, 'test-plan.md'),
    '---\nartifact: test-plan\ntask: workflow-valid\ndate: 2026-04-11\nrole: qa-engineer\nstatus: finalized\n---\n\n# Test Plan\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(taskDir, 'launch-acceptance.md'),
    '---\nartifact: launch-acceptance\ntask: workflow-valid\ndate: 2026-04-11\nrole: qa-engineer\nstatus: accepted\n---\n\n# Launch Acceptance\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(taskDir, 'deployment-context.md'),
    '---\nartifact: deployment-context\ntask: workflow-valid\ndate: 2026-04-11\nrole: devops-engineer\nstatus: finalized\n---\n\n# Deployment Context\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(taskDir, 'release-plan.md'),
    '---\nartifact: release-plan\ntask: workflow-valid\ndate: 2026-04-11\nrole: devops-engineer\nstatus: finalized\n---\n\n# Release Plan\n',
    'utf8'
  );
}

function cleanupTempTaskDir(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

function addReviewArtifacts(taskDir) {
  fs.writeFileSync(
    path.join(taskDir, 'execute-log.md'),
    '---\nartifact: execute-log\ntask: workflow-valid\ndate: 2026-04-11\nrole: backend-engineer\nstatus: finalized\n---\n\n# Execute Log\n',
    'utf8'
  );
}

console.log('Workflow readiness tests');

test('valid fixture passes execute readiness with handoff-ready status', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    validateTaskDir(taskDir, 'execute');
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('missing readiness proof blocks execute readiness', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    const handoffPath = path.join(taskDir, 'handoffs', '001-tech-lead-to-backend-engineer.md');
    const content = fs.readFileSync(handoffPath, 'utf8').replace(/## Readiness Proof[\s\S]*?## Downstream Challenge Record/, '## Downstream Challenge Record');
    fs.writeFileSync(handoffPath, content, 'utf8');

    assert.throws(
      () => validateTaskDir(taskDir, 'execute'),
      (error) => error instanceof WorkflowValidationError && /readiness/i.test(error.message)
    );
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('missing story slice plan blocks execute readiness', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    const deliveryPlanPath = path.join(taskDir, 'delivery-plan.md');
    const content = fs.readFileSync(deliveryPlanPath, 'utf8').replace(/## Story Slice Plan[\s\S]*?## Owners/, '## Owners');
    fs.writeFileSync(deliveryPlanPath, content, 'utf8');

    assert.throws(
      () => validateTaskDir(taskDir, 'execute'),
      (error) => error instanceof WorkflowValidationError && /story slice/i.test(error.message)
    );
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('iterative execute round with current_phase=execute still passes', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    rewriteHandoff(taskDir, {
      currentPhase: 'execute',
      targetPhase: 'execute',
      readinessStatus: 'handoff-ready',
    });

    validateTaskDir(taskDir, 'execute');
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('review readiness accepts ready-for-review status', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    addReviewArtifacts(taskDir);
    rewriteHandoff(taskDir, {
      currentPhase: 'execute',
      targetPhase: 'review',
      readinessStatus: 'ready-for-review',
    });

    validateTaskDir(taskDir, 'review');
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('iterative review round with current_phase=review still passes', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    addReviewArtifacts(taskDir);
    rewriteHandoff(taskDir, {
      currentPhase: 'review',
      targetPhase: 'review',
      readinessStatus: 'ready-for-review',
    });

    validateTaskDir(taskDir, 'review');
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('release readiness accepts release-ready status', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    addReviewArtifacts(taskDir);
    addReleaseArtifacts(taskDir);
    rewriteHandoff(taskDir, {
      currentPhase: 'review',
      targetPhase: 'release',
      readinessStatus: 'release-ready',
    });

    validateTaskDir(taskDir, 'release');
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('iterative release round with current_phase=release still passes', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    addReviewArtifacts(taskDir);
    addReleaseArtifacts(taskDir);
    rewriteHandoff(taskDir, {
      currentPhase: 'release',
      targetPhase: 'release',
      readinessStatus: 'release-ready',
    });

    validateTaskDir(taskDir, 'release');
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('closeout readiness accepts accepted status when release artifacts exist', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    addReviewArtifacts(taskDir);
    rewriteHandoff(taskDir, {
      currentPhase: 'release',
      targetPhase: 'closeout',
      readinessStatus: 'accepted',
    });
    addReleaseArtifacts(taskDir);

    validateTaskDir(taskDir, 'closeout');
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('missing brownfield context details blocks execute readiness', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    const deliveryPlanPath = path.join(taskDir, 'delivery-plan.md');
    const content = fs.readFileSync(deliveryPlanPath, 'utf8').replace(
      '- external integrations identified\n',
      ''
    );
    fs.writeFileSync(deliveryPlanPath, content, 'utf8');

    assert.throws(
      () => validateTaskDir(taskDir, 'execute'),
      (error) => error instanceof WorkflowValidationError && /brownfield/i.test(error.message)
    );
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('invalid story slice structure blocks execute readiness', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    const deliveryPlanPath = path.join(taskDir, 'delivery-plan.md');
    const content = fs.readFileSync(deliveryPlanPath, 'utf8').replace(
      '- slice: readiness-gate alignment / owner: tech-lead / handoff: backend-engineer',
      '- slice: readiness-gate alignment'
    );
    fs.writeFileSync(deliveryPlanPath, content, 'utf8');

    assert.throws(
      () => validateTaskDir(taskDir, 'execute'),
      (error) => error instanceof WorkflowValidationError && /slice\/owner\/handoff/i.test(error.message)
    );
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('empty story slice values block execute readiness', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    const deliveryPlanPath = path.join(taskDir, 'delivery-plan.md');
    const content = fs.readFileSync(deliveryPlanPath, 'utf8').replace(
      '- slice: readiness-gate alignment / owner: tech-lead / handoff: backend-engineer',
      '- slice:    / owner: tech-lead / handoff: backend-engineer'
    );
    fs.writeFileSync(deliveryPlanPath, content, 'utf8');

    assert.throws(
      () => validateTaskDir(taskDir, 'execute'),
      (error) => error instanceof WorkflowValidationError && /slice\/owner\/handoff/i.test(error.message)
    );
  } finally {
    cleanupTempTaskDir(root);
  }
});

test('legacy readiness_status=ready is rejected', () => {
  const { root, taskDir } = makeTempTaskDir();
  try {
    const handoffPath = path.join(taskDir, 'handoffs', '001-tech-lead-to-backend-engineer.md');
    const content = fs.readFileSync(handoffPath, 'utf8')
      .replace('readiness_status: handoff-ready', 'readiness_status: ready')
      .replace('## readiness_status\n\nhandoff-ready', '## readiness_status\n\nready');
    fs.writeFileSync(handoffPath, content, 'utf8');

    assert.throws(
      () => validateTaskDir(taskDir, 'execute'),
      (error) => error instanceof WorkflowValidationError && /readiness_status=ready/i.test(error.message)
    );
  } finally {
    cleanupTempTaskDir(root);
  }
});

console.log(`\nWorkflow readiness: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
