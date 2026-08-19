'use strict';

const { BaseTriggerAdapter, TriggerAdapterError } = require('./base-adapter');

/**
 * EventAdapter — 事件驱动触发器
 *
 * 监听 Cordis Event 或自定义事件，当匹配事件发生时触发 loop 执行。
 *
 * 适用场景：
 *   - PR merge 后自动跑回归测试
 *   - CI 失败时自动触发修复 loop
 *   - 依赖更新时自动运行安全扫描
 *   - 文件变更时自动执行 lint + format
 *
 * 使用方式：
 *   const adapter = new EventAdapter(eventBus);
 *   adapter.registerTrigger(loopSpec, {
 *     events: ['pr:merged', 'ci:failed'],
 *     filter: (event) => event.branch === 'main',
 *   });
 *   await adapter.start(loopSpec, onTrigger);
 */
class EventAdapter extends BaseTriggerAdapter {
  /**
   * @param {Object} [eventBus] - 事件总线（可选，支持 Cordis ctx 或自定义 EventEmitter）
   * @param {function(string, function): void} [eventBus.on] - 监听事件
   * @param {function(string, function): void} [eventBus.off] - 移除监听
   */
  constructor(eventBus) {
    super('event');
    this._eventBus = eventBus;
    this._eventHandlers = new Map(); // loopId → [{ event, handler }]
    this._filters = new Map();       // loopId → filter function
  }

  /**
   * Event adapter 需要 eventBus 才可用
   * @returns {boolean}
   */
  isAvailable() {
    return this._eventBus != null
      && typeof this._eventBus.on === 'function'
      && typeof this._eventBus.off === 'function';
  }

  /**
   * 注册事件触发条件
   * 必须在 start() 之前调用
   *
   * @param {string} loopId - loop 标识
   * @param {Object} config - 触发配置
   * @param {string[]} config.events - 要监听的事件名列表
   * @param {function(Object): boolean} [config.filter] - 事件过滤函数
   */
  registerTrigger(loopId, config) {
    if (!Array.isArray(config.events) || config.events.length === 0) {
      throw new TriggerAdapterError('config.events must be a non-empty array', {
        code: 'invalid_config',
      });
    }

    this._eventHandlers.set(loopId, config.events);
    if (typeof config.filter === 'function') {
      this._filters.set(loopId, config.filter);
    }
  }

  /**
   * 启动事件监听
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

    if (!this.isAvailable()) {
      throw new TriggerAdapterError('EventAdapter requires an eventBus with on/off methods', {
        code: 'no_event_bus',
      });
    }

    const events = this._eventHandlers.get(loopId);
    if (!events) {
      throw new TriggerAdapterError(
        `No events registered for loop '${loopId}'. Call registerTrigger() first.`, {
          code: 'no_events',
        }
      );
    }

    const filter = this._filters.get(loopId);
    const handlers = [];

    for (const eventName of events) {
      const handler = async (eventData) => {
        // 应用过滤器
        if (filter && !filter(eventData)) return;

        const triggerEvent = {
          loopId,
          triggerType: 'event',
          triggeredAt: new Date().toISOString(),
          metadata: {
            adapter: this.adapterType,
            eventName,
            eventData: this._sanitizeEventData(eventData),
          },
        };

        try {
          await onTrigger(triggerEvent);
        } catch (error) {
          // 事件触发的异常不应导致监听器移除
          if (this._registeredLoops.has(loopId)) {
            const entry = this._registeredLoops.get(loopId);
            entry.lastError = {
              message: error.message,
              eventName,
              at: new Date().toISOString(),
            };
          }
        }
      };

      this._eventBus.on(eventName, handler);
      handlers.push({ eventName, handler });
    }

    this._registeredLoops.set(loopId, {
      spec: loopSpec,
      onTrigger,
      timerId: null,
      handlers,
    });
  }

  /**
   * 停止事件监听
   * @param {string} loopId - loop 标识
   * @returns {Promise<void>}
   */
  async stop(loopId) {
    const entry = this._registeredLoops.get(loopId);
    if (!entry) return;

    // 移除所有事件监听器
    if (entry.handlers && this._eventBus) {
      for (const { eventName, handler } of entry.handlers) {
        this._eventBus.off(eventName, handler);
      }
    }

    this._registeredLoops.delete(loopId);
    this._eventHandlers.delete(loopId);
    this._filters.delete(loopId);
  }

  /**
   * 获取指定 loop 的状态
   * @param {string} loopId - loop 标识
   * @returns {TriggerStatus|null}
   */
  getStatus(loopId) {
    const entry = this._registeredLoops.get(loopId);
    if (!entry) return null;

    const events = this._eventHandlers.get(loopId) || [];

    return {
      loopId,
      running: true,
      nextRun: null, // 事件驱动无法预测下次触发时间
      lastRun: entry.lastTriggeredAt || null,
      totalRuns: entry.totalRuns || 0,
      adapter: this.adapterType,
      listeningEvents: events,
    };
  }

  /**
   * 清理事件数据中的不可序列化内容
   * @param {Object} data - 事件数据
   * @returns {Object}
   */
  _sanitizeEventData(data) {
    if (!data || typeof data !== 'object') return {};
    try {
      // 只保留可 JSON 序列化的字段
      return JSON.parse(JSON.stringify(data, (key, value) => {
        if (typeof value === 'function' || typeof value === 'symbol') return undefined;
        return value;
      }));
    } catch {
      return {};
    }
  }
}

module.exports = { EventAdapter };
