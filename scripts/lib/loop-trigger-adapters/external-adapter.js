'use strict';

const { BaseTriggerAdapter, TriggerAdapterError } = require('./base-adapter');
const loopStateStore = require('../loop-state-store');

/**
 * ExternalAdapter — 外置调度器适配器
 *
 * 不在进程内维护 timer，而是提供 CLI 入口和配置模板，
 * 由外部调度器（OS cron / GitHub Actions / systemd timer）按计划调用。
 *
 * 适用场景：
 *   - 持久化定时任务（用户关机后仍需执行）
 *   - CI/CD 环境中的定期扫描
 *   - 生产级可靠性要求的任务
 *
 * 使用方式：
 *   - CLI: `tsp loop run <loopId>` — 由外部 cron 调用
 *   - GitHub Actions: 使用生成的 workflow 模板
 *   - OS crontab: 使用生成的 crontab 行
 */
class ExternalAdapter extends BaseTriggerAdapter {
  constructor() {
    super('external');
  }

  /**
   * External adapter 始终可用（CLI 入口总是可调用的）
   * @returns {boolean}
   */
  isAvailable() {
    return true;
  }

  /**
   * "注册"一个 loop — 实际是将其配置标记为已就绪
   * External adapter 不维护内存定时器，只记录 loop 已注册
   *
   * @param {Object} loopSpec - 已解析的 loop spec
   * @param {function(TriggerEvent): Promise<void>} onTrigger - 触发回调
   * @returns {Promise<void>}
   */
  async start(loopSpec, onTrigger) {
    const { id: loopId } = loopSpec;

    if (this._registeredLoops.has(loopId)) {
      throw new TriggerAdapterError(
        `Loop '${loopId}' is already registered.`, {
          code: 'already_registered',
        }
      );
    }

    this._registeredLoops.set(loopId, {
      spec: loopSpec,
      onTrigger,
      timerId: null, // external adapter 没有 timer
      registeredAt: new Date().toISOString(),
    });

    // 持久化注册状态
    loopStateStore.saveHeartbeat(loopId, {
      adapter: this.adapterType,
      registeredAt: new Date().toISOString(),
      cadence: loopSpec.cadence,
      status: 'registered',
    });
  }

  /**
   * "停止"一个 loop — 清除注册标记
   * @param {string} loopId - loop 标识
   * @returns {Promise<void>}
   */
  async stop(loopId) {
    this._registeredLoops.delete(loopId);

    loopStateStore.saveHeartbeat(loopId, {
      adapter: this.adapterType,
      stoppedAt: new Date().toISOString(),
      status: 'stopped',
    });
  }

  /**
   * 获取指定 loop 的状态
   * @param {string} loopId - loop 标识
   * @returns {TriggerStatus|null}
   */
  getStatus(loopId) {
    const entry = this._registeredLoops.get(loopId);
    if (!entry) return null;

    // 从持久化状态读取上次执行信息
    let lastRun = null;
    let totalRuns = 0;
    try {
      const heartbeat = loopStateStore.loadHeartbeat(loopId);
      if (heartbeat) {
        lastRun = heartbeat.lastRunAt || null;
        totalRuns = heartbeat.totalRuns || 0;
      }
    } catch {
      // 读取失败不影响状态返回
    }

    return {
      loopId,
      running: entry !== undefined,
      nextRun: null, // 外置调度器决定下次执行时间，TSP 无法预测
      lastRun,
      totalRuns,
      adapter: this.adapterType,
    };
  }

  /**
   * 生成外部调度器配置
   *
   * @param {Object} loopSpec - 已解析的 loop spec
   * @returns {{ cronExpression: string, cliCommand: string, ghActionsYaml: string, crontabLine: string }}
   */
  generateSchedulerConfig(loopSpec) {
    const cronExpression = this._cadenceToCron(loopSpec.cadence);
    const cliCommand = `tsp loop run ${loopSpec.id}`;
    const ghActionsYaml = this._generateGitHubActionsYaml(loopSpec, cronExpression);
    const crontabLine = `${cronExpression} ${cliCommand}`;

    return {
      cronExpression,
      cliCommand,
      ghActionsYaml,
      crontabLine,
    };
  }

  /**
   * 将 cadence 字符串转换为标准 5 位 cron 表达式
   * @param {string} cadence - e.g. '30m', '2h', '1d'
   * @returns {string} cron expression
   */
  _cadenceToCron(cadence) {
    const match = cadence.match(/^(\d+)(m|h|d)$/);
    if (!match) {
      throw new TriggerAdapterError(`Invalid cadence: '${cadence}'`, {
        code: 'invalid_cadence',
      });
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'm':
        if (value === 1) return '* * * * *';
        if (60 % value !== 0) return `*/${value} * * * *`;
        return `*/${value} * * * *`;
      case 'h':
        if (value === 1) return '0 * * * *';
        return `0 */${value} * * *`;
      case 'd':
        return `0 0 * * *`;
      default:
        throw new TriggerAdapterError(`Unknown cadence unit: '${unit}'`, {
          code: 'invalid_cadence',
        });
    }
  }

  /**
   * 生成 GitHub Actions workflow YAML
   * @param {Object} loopSpec - loop spec
   * @param {string} cronExpression - cron 表达式
   * @returns {string} YAML 字符串
   */
  _generateGitHubActionsYaml(loopSpec, cronExpression) {
    return `name: Loop — ${loopSpec.id}
on:
  schedule:
    - cron: '${cronExpression}'
  workflow_dispatch:

jobs:
  run-loop:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: tsp loop run ${loopSpec.id}
        env:
          TSP_LOOP_STATE_DIR: .tsp/loops
`;
  }
}

module.exports = { ExternalAdapter };
