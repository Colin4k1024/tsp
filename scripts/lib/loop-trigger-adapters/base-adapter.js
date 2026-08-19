'use strict';

/**
 * TriggerAdapter — 可插拔触发器抽象接口
 *
 * 所有调度模式（session / external / event）共享同一套 Loop Spec、
 * State Store、Oracle 逻辑，只是触发层不同。
 *
 * 生命周期：
 *   start() → 按 cadence 触发 onTrigger → stop()
 *
 * 约束：
 *   - adapter 只负责"怎么触发"，不负责"做什么"
 *   - 执行逻辑由 TaskRunner 统一处理
 *   - 状态持久化由 loop-state-store 统一处理
 */

class TriggerAdapterError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'TriggerAdapterError';
    this.details = details;
    this.code = details.code || 'trigger_adapter_error';
  }
}

/**
 * @typedef {Object} TriggerStatus
 * @property {string} loopId - loop 标识
 * @property {boolean} running - 是否正在运行
 * @property {string|null} nextRun - 下次执行时间 (ISO string)
 * @property {string|null} lastRun - 上次执行时间 (ISO string)
 * @property {number} totalRuns - 总执行次数
 * @property {string} adapter - adapter 类型标识
 */

/**
 * @typedef {Object} TriggerEvent
 * @property {string} loopId - loop 标识
 * @property {string} triggerType - 触发类型: 'cron' | 'event' | 'manual'
 * @property {string} triggeredAt - 触发时间 (ISO string)
 * @property {Object} metadata - 额外上下文
 */

/**
 * 可插拔触发器基类
 * @abstract
 */
class BaseTriggerAdapter {
  /**
   * @param {string} adapterType - adapter 类型标识 (e.g. 'session', 'external', 'event')
   */
  constructor(adapterType) {
    this.adapterType = adapterType;
    this._registeredLoops = new Map(); // loopId → { spec, onTrigger, timerId }
  }

  /**
   * 当前 adapter 是否可用
   * @abstract
   * @returns {boolean}
   */
  isAvailable() {
    throw new Error('Subclass must implement isAvailable()');
  }

  /**
   * 注册并启动一个 loop 的定时触发
   * @param {Object} loopSpec - 已解析的 loop spec (from loop-spec.js)
   * @param {function(TriggerEvent): Promise<void>} onTrigger - 触发回调
   * @returns {Promise<void>}
   */
  async start(loopSpec, onTrigger) {
    throw new Error('Subclass must implement start()');
  }

  /**
   * 停止一个 loop 的定时触发
   * @param {string} loopId - loop 标识
   * @returns {Promise<void>}
   */
  async stop(loopId) {
    throw new Error('Subclass must implement stop()');
  }

  /**
   * 停止所有已注册的 loop
   * @returns {Promise<void>}
   */
  async stopAll() {
    const loopIds = Array.from(this._registeredLoops.keys());
    await Promise.all(loopIds.map(id => this.stop(id)));
  }

  /**
   * 获取指定 loop 的触发状态
   * @param {string} loopId - loop 标识
   * @returns {TriggerStatus|null}
   */
  getStatus(loopId) {
    throw new Error('Subclass must implement getStatus()');
  }

  /**
   * 获取所有已注册 loop 的状态
   * @returns {TriggerStatus[]}
   */
  listStatuses() {
    return Array.from(this._registeredLoops.keys())
      .map(id => this.getStatus(id))
      .filter(Boolean);
  }

  /**
   * 手动触发一次执行（跳过定时等待）
   * @param {string} loopId - loop 标识
   * @returns {Promise<void>}
   */
  async runOnce(loopId) {
    const entry = this._registeredLoops.get(loopId);
    if (!entry) {
      throw new TriggerAdapterError(`Loop '${loopId}' is not registered`, {
        code: 'not_registered',
      });
    }

    const event = {
      loopId,
      triggerType: 'manual',
      triggeredAt: new Date().toISOString(),
      metadata: { adapter: this.adapterType },
    };

    await entry.onTrigger(event);
  }

  /**
   * 将 cadence 字符串解析为毫秒数
   * 支持: Nm (分钟), Nh (小时), Nd (天)
   * @param {string} cadence - e.g. '30m', '2h', '1d'
   * @returns {number} 毫秒数
   */
  _parseCadenceMs(cadence) {
    const match = cadence.match(/^(\d+)(m|h|d)$/);
    if (!match) {
      throw new TriggerAdapterError(`Invalid cadence format: '${cadence}'. Expected Nm, Nh, or Nd.`, {
        code: 'invalid_cadence',
      });
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default:
        throw new TriggerAdapterError(`Unknown cadence unit: '${unit}'`, {
          code: 'invalid_cadence',
        });
    }
  }
}

module.exports = {
  BaseTriggerAdapter,
  TriggerAdapterError,
};
