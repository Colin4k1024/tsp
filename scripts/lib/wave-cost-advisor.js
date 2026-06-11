'use strict';

/**
 * wave-cost-advisor.js
 *
 * Budget-aware wave scheduling for Loop Engineering.
 * Calculates optimal parallelism based on remaining budget, estimated costs,
 * and worker availability before launching a wave.
 *
 * Integrates with wave-execution skill and the workflow executor.
 */

const DEFAULT_COST_PER_WORKER = 0.50; // USD per worker iteration (conservative estimate)
const DEFAULT_MAX_PARALLEL = 4;
const DEFAULT_BUDGET = 10.0; // USD

function createCostAdvisor(options = {}) {
  const totalBudget = options.totalBudget || DEFAULT_BUDGET;
  let spent = options.spent || 0;
  const maxParallel = options.maxParallel || DEFAULT_MAX_PARALLEL;
  const costPerWorker = options.costPerWorker || DEFAULT_COST_PER_WORKER;

  return {
    get remaining() { return totalBudget - spent; },
    get spent() { return spent; },
    get totalBudget() { return totalBudget; },

    recordSpend(amount) {
      spent += amount;
    },

    adviseBatchSize(taskCount, options = {}) {
      const estimatedIterations = options.estimatedIterations || 1;
      const taskCost = options.costPerTask || costPerWorker;
      const maxWorkers = Math.min(taskCount, maxParallel);

      if (spent >= totalBudget) {
        return {
          recommended: 0,
          reason: 'budget_exhausted',
          remaining: 0,
          canAfford: 0,
        };
      }

      const remaining = totalBudget - spent;
      const costPerBatch = maxWorkers * taskCost * estimatedIterations;

      if (costPerBatch <= remaining) {
        return {
          recommended: maxWorkers,
          reason: 'within_budget',
          remaining,
          estimatedCost: costPerBatch,
          canAfford: maxWorkers,
        };
      }

      // Reduce parallelism to fit budget
      const affordableWorkers = Math.max(1, Math.floor(remaining / (taskCost * estimatedIterations)));
      const actualWorkers = Math.min(affordableWorkers, taskCount);

      return {
        recommended: actualWorkers,
        reason: 'budget_constrained',
        remaining,
        estimatedCost: actualWorkers * taskCost * estimatedIterations,
        canAfford: affordableWorkers,
        requestedButDenied: maxWorkers - actualWorkers,
      };
    },

    adviseWavePlan(waves, options = {}) {
      const taskCost = options.costPerTask || costPerWorker;
      const plan = [];
      let projectedSpend = spent;

      for (let i = 0; i < waves.length; i++) {
        const wave = waves[i];
        const taskCount = Array.isArray(wave) ? wave.length : wave.taskCount || 1;
        const remaining = totalBudget - projectedSpend;

        if (remaining <= 0) {
          plan.push({
            waveIndex: i,
            status: 'deferred',
            reason: 'budget_exhausted',
            tasks: taskCount,
            parallelism: 0,
          });
          continue;
        }

        const maxForWave = Math.min(taskCount, maxParallel);
        const waveCost = maxForWave * taskCost;

        if (waveCost <= remaining) {
          plan.push({
            waveIndex: i,
            status: 'full',
            tasks: taskCount,
            parallelism: maxForWave,
            estimatedCost: waveCost,
          });
          projectedSpend += waveCost;
        } else {
          const affordable = Math.max(1, Math.floor(remaining / taskCost));
          const actual = Math.min(affordable, taskCount);
          plan.push({
            waveIndex: i,
            status: 'reduced',
            tasks: taskCount,
            parallelism: actual,
            estimatedCost: actual * taskCost,
            note: `Reduced from ${maxForWave} to ${actual} workers due to budget`,
          });
          projectedSpend += actual * taskCost;
        }
      }

      return {
        plan,
        projectedTotalCost: projectedSpend,
        remainingAfterPlan: totalBudget - projectedSpend,
        budgetUtilization: projectedSpend / totalBudget,
      };
    },

    shouldPause() {
      return spent >= totalBudget;
    },

    formatSummary() {
      const pct = ((spent / totalBudget) * 100).toFixed(1);
      return `Budget: $${spent.toFixed(2)} / $${totalBudget.toFixed(2)} (${pct}% used), $${(totalBudget - spent).toFixed(2)} remaining`;
    },
  };
}

function estimateGoalCost(goal, averageCostPerIteration) {
  const remainingIterations = (goal.budget?.maxIterations || 15) - (goal.currentIteration || 0);
  const avgCost = averageCostPerIteration || DEFAULT_COST_PER_WORKER;
  return {
    bestCase: avgCost,
    expectedCase: avgCost * Math.min(3, remainingIterations),
    worstCase: avgCost * remainingIterations,
  };
}

module.exports = {
  DEFAULT_COST_PER_WORKER,
  DEFAULT_MAX_PARALLEL,
  createCostAdvisor,
  estimateGoalCost,
};
