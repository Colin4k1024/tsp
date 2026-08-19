'use strict';

const { BaseTriggerAdapter, TriggerAdapterError } = require('./base-adapter');

/**
 * SessionAdapter — 会话内定时触发器
 *
 * 使用 setInterval 在 DSH 进程内按 cadence 触发 loop。
 * 适用于：
 *   - 开发调试期间的 heartbeat 扫描
 *   - 会话存活期间的短周期任务
 *
 * 限制：
 *   - 会话结束后所有定时器自动清除
 *   - 不支持跨会话持久化
 *   - 进程重启后需重新注册
 *
 * 使用方式：
 *   const adapter = new SessionAdapter();
 *   await adapter.start(loopSpec, onTrigger);
 *   // ... 会话结束时 adapter.stopAll() 由 ctx.effect 保证
 */
class SessionAdapter extends BaseTriggerAdapter {
  constructor() {
    super('session');
    this._runHistory = new Map(); // loopId → { lastRun, totalRuns }
  }

  /**
   * Session adapter 始终可用（只要有 Node.js 进程就能 setInterval）
   * @returns {boolean}
   */
  isAvailable() {
    return typeof setInterval === 'function' && typeof clearInterval === 'function';
  }

  /**
   * 注册并启动一个 loop 的定时触发
   *
   * @param {Object} loopSpec - 已解析的 loop spec
   * @param {string} loopSpec.id - loop 标识
   * @param {string} loopSpec.cadence - 触发间隔 (e.g. '30m', '2h')
   * @param {function(TriggerEvent): Promise<void>} onTrigger - 触发回调
   * @returns {Promise<void>}
   */
  async start(loopSpec, onTrigger) {
    const { id: loopId, cadence } = loopSpec;

    if (this._registeredLoops.has(loopId)) {
      throw new TriggerAdapterError(
        `Loop '${loopId}' is already registered. Call stop() first.`, {
          code: 'already_registered',
        }
      );
    }

    if (typeof onTrigger !== 'function') {
      throw new TriggerAdapterError('onTrigger must be a function', {
        code: 'invalid_callback',
      });
    }

    const intervalMs = this._parseCadenceMs(cadence);

    // 初始化运行历史
    this._runHistory.set(loopId, {
      lastRun: null,
      totalRuns: 0,
      startedAt: new Date().toISOString(),
    });

    // 创建定时器
    const timerId = setInterval(async () => {
      const history = this._runHistory.get(loopId);
      if (!history) return;

      const event = {
        loopId,
        triggerType: 'cron',
        triggeredAt: new Date().toISOString(),
        metadata: {
          adapter: this.adapterType,
          cadence,
          runNumber: history.totalRuns + 1,
        },
      };

      try {
        history.totalRuns += 1;
        history.lastRun = event.triggeredAt;
        await onTrigger(event);
      } catch (error) {
        // 触发回调的异常不应导致定时器停止
        // 记录错误但继续调度下一次
        if (this._registeredLoops.has(loopId)) {
          history.lastError = {
            message: error.message,
            at: new Date().toISOString(),
          };
        }
      }
    }, intervalMs);

    // 防止 timer 阻止进程退出
    if (timerId && typeof timerId.unref === 'function') {
      timerId.unref();
    }

    this._registeredLoops.set(loopId, {
      spec: loopSpec,
      onTrigger,
      timerId,
    });
  }

  /**
   * 停止一个 loop 的定时触发
   * @param {string} loopId - loop 标识
   * @returns {Promise<void>}
   */
  async stop(loopId) {
    const entry = this._registeredLoops.get(loopId);
    if (!entry) return; // 幂等：已停止的 loop 不报错

    clearInterval(entry.timerId);
    this._registeredLoops.delete(loopId);
    // 保留 _runHistory 用于 getStatus 查询
  }

  /**
   * 停止所有 loop
   * @returns {Promise<void>}
   */
  async stopAll() {
    for (const [, entry] of this._registeredLoops) {
      clearInterval(entry.timerId);
    }
    this._registeredLoops.clear();
  }

  /**
   * 获取指定 loop 的触发状态
   * @param {string} loopId - loop 标识
   * @returns {TriggerStatus|null}
   */
  getStatus(loopId) {
    const entry = this._registeredLoops.get(loopId);
    const history = this._runHistory.get(loopId);

    if (!entry) return null;

    const intervalMs = entry ? this._parseCadenceMs(entry.spec.cadence) : 0;
    const lastRun = history?.lastRun || null;
    const nextRun = entry && lastRun
      ? new Date(new Date(lastRun).getTime() + intervalMs).toISOString()
      : entry
        ? new Date(Date.now() + intervalMs).toISOString()
        : null;

    return {
      loopId,
      running: !!entry,
      nextRun,
      lastRun,
      totalRuns: history?.totalRuns || 0,
      adapter: this.adapterType,
      lastError: history?.lastError || null,
    };
  }
}

module.exports = { SessionAdapter };
