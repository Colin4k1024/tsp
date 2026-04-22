#!/usr/bin/env node
/**
 * pure-host.js — CLI entry point for the pure-host execution engine.
 *
 * Usage:
 *   node pure-host.js --manifest <path>          Run a new execution
 *   node pure-host.js --resume                  Resume from SHARED_TASK_NOTES.md
 *   node pure-host.js --revert <taskId>         Revert a specific task
 *   node pure-host.js --status                  Show current state only
 *   node pure-host.js --report                  Generate report from saved state
 */
'use strict';

// Parse CLI arguments manually (no external dependency)
const argv = process.argv.slice(2);
const options = {};
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--manifest' || arg === '-m') {
    options.manifest = argv[++i];
  } else if (arg === '--resume' || arg === '-r') {
    options.resume = true;
  } else if (arg === '--revert') {
    options.revert = argv[++i];
  } else if (arg === '--status' || arg === '-s') {
    options.status = true;
  } else if (arg === '--report') {
    options.report = true;
  } else if (arg === '--model') {
    options.model = argv[++i];
  } else if (arg === '--help' || arg === '-h') {
    printHelp();
    process.exit(0);
  } else if (arg === '--') {
    // Stop parsing -- pass through to subprocess
    break;
  }
}

// Dynamic imports (loaded on demand to allow partial dependency usage)
const { StateStore } = require('./lib/state-store');
const { ManifestLoader } = require('./lib/manifest-loader');
const { DependencyGraph } = require('./lib/dependency-graph');
const { Executor } = require('./lib/executor');
const { RetryHandler } = require('./lib/retry-handler');
const { GitManager } = require('./lib/git-manager');
const { Reporter } = require('./lib/reporter');

// ─── HELP ───────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
pure-host — AI-augmented task execution engine

USAGE
  node pure-host.js [OPTIONS]

OPTIONS
  --manifest <dir>   Path to manifest directory (contains manifest.yaml)
  --resume           Resume execution from SHARED_TASK_NOTES.md
  --revert <taskId>  Revert a specific task to its revert point
  --status           Show current execution state and exit
  --report           Generate and print report from saved state
  --model <model>    Claude model to use (default: sonnet)
  --help, -h         Show this help message

EXAMPLES
  node pure-host.js --manifest docs/artifacts/my-feature/
  node pure-host.js --resume
  node pure-host.js --revert task-2
  node pure-host.js --status
  node pure-host.js --report
`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const stateStore = new StateStore().load();

  // --status: just show current state
  if (options.status) {
    printStatus(stateStore);
    return;
  }

  // --report: just generate report
  if (options.report) {
    const report = buildReport(stateStore);
    if (report) {
      console.log(report);
    }
    return;
  }

  // --revert: execute revert for a task
  if (options.revert) {
    await handleRevert(options.revert, stateStore);
    return;
  }

  // --resume: continue from saved state
  if (options.resume) {
    await handleResume(stateStore);
    return;
  }

  // --manifest: fresh execution
  if (options.manifest) {
    await handleFreshRun(options.manifest, options.model, stateStore);
    return;
  }

  console.error('Error: must specify --manifest, --resume, --revert, --status, or --report.');
  console.error('Run with --help for usage.');
  process.exit(1);
}

// ─── STATUS ──────────────────────────────────────────────────────────────────

function printStatus(stateStore) {
  const completed = stateStore.globalState.completedTasks;
  const blocked = stateStore.globalState.blockedTasks;
  const allTasks = stateStore.getAllTasks();

  console.log('\n=== CURRENT STATE ===\n');
  console.log(`Last updated: ${stateStore.globalState.lastUpdated || 'never'}`);
  console.log(`Completed: ${completed.length}`);
  console.log(`Blocked: ${blocked.length}`);
  console.log(`Total tracked: ${allTasks.length}`);

  if (blocked.length > 0) {
    console.log('\nBlocked tasks:');
    for (const taskId of blocked) {
      const t = stateStore.getTask(taskId);
      console.log(`  - ${taskId}: ${t?.blockedReason || 'unknown'}`);
    }
  }

  if (completed.length > 0) {
    console.log('\nCompleted tasks:');
    for (const taskId of completed) {
      console.log(`  - ${taskId}`);
    }
  }
}

// ─── REPORT ───────────────────────────────────────────────────────────────────

/**
 * @param {import('./lib/state-store').StateStore} stateStore
 * @returns {string|null}
 */
function buildReport(stateStore) {
  const allTasks = stateStore.getAllTasks();
  if (allTasks.length === 0) {
    console.log('No execution state found. Run with --manifest first.');
    return null;
  }

  const manifest = {
    tasks: allTasks.map(t => ({
      taskId: t.taskId,
      name: t.taskId,
      description: t.description || t.taskId,
    })),
    model: allTasks[0]?.model || 'sonnet',
    name: 'Resumed Execution',
  };

  const timing = {
    startedAt: new Date(allTasks[0]?.startedAt || Date.now()),
    completedAt: new Date(),
  };

  const reporter = new Reporter();
  return reporter.generateReport(stateStore, manifest, timing);
}

// ─── REVERT ──────────────────────────────────────────────────────────────────

/**
 * @param {string} taskId
 * @param {import('./lib/state-store').StateStore} stateStore
 */
async function handleRevert(taskId, stateStore) {
  const task = stateStore.getTask(taskId);
  if (!task) {
    console.error(`Error: task '${taskId}' not found in state.`);
    process.exit(1);
  }

  const revertPoint = task.revertPoint;
  if (!revertPoint) {
    console.error(`Error: no revert point found for task '${taskId}'.`);
    process.exit(1);
  }

  console.log(`Reverting ${taskId} to SHA ${revertPoint}...`);

  try {
    const gitManager = new GitManager();
    await gitManager.revert(taskId, revertPoint);

    stateStore.setTask(taskId, {
      status: 'pending',
      revertedAt: new Date().toISOString(),
    });
    stateStore.save();

    console.log(`✓ Reverted ${taskId} successfully.`);
  } catch (err) {
    console.error(`Revert failed: ${err.message}`);
    process.exit(1);
  }
}

// ─── RESUME ──────────────────────────────────────────────────────────────────

/**
 * @param {import('./lib/state-store').StateStore} stateStore
 */
async function handleResume(stateStore) {
  const allTasks = stateStore.getAllTasks();
  if (allTasks.length === 0) {
    console.error('Error: no state found to resume. Run with --manifest first.');
    process.exit(1);
  }

  console.log('Resuming from saved state...');

  // Reconstruct manifest from state
  const manifest = {
    tasks: allTasks.map(t => ({
      taskId: t.taskId,
      name: t.taskId,
      description: t.description || t.taskId,
      prompt: t.prompt,
      verifyCommand: t.verifyCommand,
      dependsOn: t.dependsOn || [],
    })),
    model: allTasks[0]?.model || 'sonnet',
    name: 'Resumed Execution',
  };

  await executeManifest(manifest, stateStore, { resume: true });
}

// ─── FRESH RUN ───────────────────────────────────────────────────────────────

/**
 * @param {string} manifestPath
 * @param {string} [model]
 * @param {import('./lib/state-store').StateStore} stateStore
 */
async function handleFreshRun(manifestPath, model, stateStore) {
  console.log(`Loading manifest from: ${manifestPath}`);

  let manifest;
  try {
    const loader = new ManifestLoader();
    manifest = loader.load(manifestPath);
  } catch (err) {
    console.error(`Failed to load manifest: ${err.message}`);
    process.exit(1);
  }

  manifest.model = model || manifest.model || 'sonnet';
  console.log(`Model: ${manifest.model}`);

  // Initialize state from manifest tasks
  for (const task of manifest.tasks) {
    if (!stateStore.getTask(task.taskId)) {
      stateStore.setTask(task.taskId, {
        taskId: task.taskId,
        description: task.description || task.name || task.taskId,
        prompt: task.prompt,
        verifyCommand: task.verifyCommand,
        dependsOn: task.dependsOn || [],
        model: manifest.model,
        status: 'pending',
        attempts: 0,
      });
    }
  }

  stateStore.save();
  await executeManifest(manifest, stateStore, { resume: false });
}

// ─── EXECUTION ENGINE ────────────────────────────────────────────────────────

/**
 * @param {{ tasks: object[], model: string, name: string }} manifest
 * @param {import('./lib/state-store').StateStore} stateStore
 * @param {{ resume: boolean }} opts
 */
async function executeManifest(manifest, stateStore, _opts) {
  const executor = new Executor();
  const retryHandler = new RetryHandler();
  const gitManager = new GitManager();
  const reporter = new Reporter();
  const graph = new DependencyGraph(manifest.tasks);

  const startedAt = new Date();
  console.log(`\n=== PURE HOST EXECUTION ===`);
  console.log(`Model: ${manifest.model}`);
  console.log(`Tasks: ${manifest.tasks.length}\n`);

  try {
    const sortedIds = graph.topologicalSort();
    console.log(`Execution order: ${sortedIds.join(' → ')}\n`);
  } catch (err) {
    console.error(`Dependency error: ${err.message}`);
    process.exit(1);
  }

  const completed = new Set(stateStore.globalState.completedTasks);
  const maxParallel = 2;

  // Main execution loop: process tasks in dependency order, respecting max parallelization
  const queue = [...manifest.tasks.map(t => t.taskId)];

  while (queue.length > 0) {
    const batch = [];

    // Build batch respecting dependencies and max parallel
    for (const taskId of queue) {
      if (batch.length >= maxParallel) break;
      const task = manifest.tasks.find(t => t.taskId === taskId);
      if (!task) continue;

      // Check if all dependencies are satisfied
      const deps = task.dependsOn || [];
      const depsSatisfied = deps.every(d => completed.has(d) || stateStore.getTask(d)?.status === 'completed');

      if (depsSatisfied && !completed.has(taskId) && stateStore.getTask(taskId)?.status !== 'blocked') {
        batch.push(task);
      }
    }

    if (batch.length === 0) {
      // No more tasks can run — check for blockers or cycles
      const pending = queue.map(id => manifest.tasks.find(t => t.taskId === id)).filter(Boolean);
      const blockers = pending.filter(t => {
        const deps = t.dependsOn || [];
        return deps.some(d => !completed.has(d) && stateStore.getTask(d)?.status === 'blocked');
      });

      if (blockers.length > 0) {
        console.error(`\nExecution blocked by failed dependencies:`);
        for (const b of blockers) {
          console.error(`  - ${b.taskId}: depends on ${b.dependsOn.join(', ')}`);
        }
      }
      break;
    }

    // Execute batch sequentially (batch is at most 2 tasks)
    for (const task of batch) {
      await executeTask(task, stateStore, manifest, executor, retryHandler, gitManager);

      // Mark as completed or blocked
      const taskState = stateStore.getTask(task.taskId);
      if (taskState?.status === 'completed') {
        completed.add(task.taskId);
        queue.splice(queue.indexOf(task.taskId), 1);
      } else if (taskState?.status === 'blocked') {
        queue.splice(queue.indexOf(task.taskId), 1);
        // Do NOT add to completed — keep as blocked
      }

      stateStore.save();
    }
  }

  // Generate final report
  const completedAt = new Date();
  const report = reporter.generateReport(stateStore, manifest, { startedAt, completedAt });
  console.log('\n' + report);

  const blockedCount = stateStore.globalState.blockedTasks.length;
  if (blockedCount > 0) {
    console.log(`\n⚠ Execution completed with ${blockedCount} blocker(s).`);
    process.exit(1);
  }
}

/**
 * Execute a single task: execute → verify → commit/retry/block.
 *
 * @param {object} task
 * @param {import('./lib/state-store').StateStore} stateStore
 * @param {{ tasks: object[], model: string }} manifest
 * @param {import('./lib/executor').Executor} executor
 * @param {import('./lib/retry-handler').RetryHandler} retryHandler
 * @param {import('./lib/git-manager').GitManager} gitManager
 */
async function executeTask(task, stateStore, manifest, executor, retryHandler, gitManager) {
  const taskState = stateStore.getTask(task.taskId);
  const attempt = (taskState?.attempts || 0);

  // Skip if already done
  if (taskState?.status === 'completed') {
    console.log(`⊘ ${task.taskId}: already completed (skipping)`);
    return;
  }
  if (taskState?.status === 'blocked') {
    console.log(`⊘ ${task.taskId}: blocked (skipping)`);
    return;
  }

  console.log(`\n▶ ${task.taskId} [attempt ${attempt + 1}]`);
  stateStore.startTask(task.taskId);
  stateStore.setTask(task.taskId, { attempts: attempt + 1 });
  stateStore.save();

  const taskStart = Date.now();

  // ── Execute ──
  const result = await executor.execute(task, {
    model: manifest.model,
    timeout: task.timeout || 300000,
  });

  const duration = Date.now() - taskStart;
  stateStore.setTask(task.taskId, { duration });

  if (!result.success) {
    console.error(`  ✗ Execution failed: ${result.error?.message}`);

    // ── Retry ──
    if (retryHandler.shouldRetry(attempt)) {
      const fixPrompt = retryHandler.generateFixPrompt(task, result.error, attempt);
      console.log(`  ↻ Auto-fix attempt ${attempt + 1}/${retryHandler.maxRetries + 1}...`);

      const fixResult = await retryHandler.executeFix(fixPrompt, { model: manifest.model });
      if (fixResult.success) {
        console.log(`  ✓ Auto-fix succeeded.`);
        // Re-verify after fix
        const verifyResult = await executor.verify(task, fixResult.output);
        if (verifyResult.valid) {
          await commitAndComplete(task, stateStore, gitManager, attempt + 1);
          return;
        }
      } else {
        console.error(`  ✗ Auto-fix failed.`);
      }

      // Increment attempt and retry
      stateStore.setTask(task.taskId, { attempts: attempt + 1 });
      stateStore.save();
      return await executeTask(task, stateStore, manifest, executor, retryHandler, gitManager);
    }

    // ── Block ──
    console.error(`  ⊘ ${task.taskId}: BLOCKED after ${attempt + 1} attempt(s)`);
    stateStore.blockTask(task.taskId, `Failed after ${attempt + 1} auto-fix attempts`, result.error);
    stateStore.save();
    return;
  }

  // ── Verify ──
  const verifyResult = await executor.verify(task, result.output);
  if (!verifyResult.valid) {
    console.error(`  ✗ Verification failed: ${verifyResult.message}`);
    if (retryHandler.shouldRetry(attempt)) {
      stateStore.setTask(task.taskId, { attempts: attempt + 1 });
      stateStore.save();
      return await executeTask(task, stateStore, manifest, executor, retryHandler, gitManager);
    }
    stateStore.blockTask(task.taskId, `Verification failed: ${verifyResult.message}`, {
      type: 'VerifyError',
      message: verifyResult.message,
    });
    stateStore.save();
    return;
  }

  // ── Commit & Complete ──
  await commitAndComplete(task, stateStore, gitManager, attempt + 1);
}

/**
 * @param {object} task
 * @param {import('./lib/state-store').StateStore} stateStore
 * @param {import('./lib/git-manager').GitManager} gitManager
 * @param {number} attempt
 */
async function commitAndComplete(task, stateStore, gitManager, attempt) {
  try {
    // Mark revert point before committing changes
    const revertSha = await gitManager.markRevertPoint(task.taskId);
    stateStore.setTask(task.taskId, { revertPoint: revertSha });

    // Commit the result
    const commitSha = await gitManager.commit(task.taskId, attempt);
    console.log(`  ✓ ${task.taskId}: completed (commit ${commitSha.substring(0, 7)})`);

    stateStore.setTask(task.taskId, {
      status: 'completed',
      commitSha,
      completedAt: new Date().toISOString(),
    });
    stateStore.completeTask(task.taskId);
  } catch (err) {
    // Non-git environments — still mark as complete
    if (err.message.includes('not a git repository') || err.message.includes('fatal:')) {
      console.warn(`  ⚠ Git unavailable — task marked complete without commit`);
      stateStore.setTask(task.taskId, { status: 'completed' });
      stateStore.completeTask(task.taskId);
    } else {
      console.error(`  ✗ Commit failed: ${err.message}`);
      stateStore.blockTask(task.taskId, `Commit failed: ${err.message}`, {
        type: 'GitError',
        message: err.message,
      });
    }
  }
  stateStore.save();
}

// ─── BOOTSTRAP ────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
