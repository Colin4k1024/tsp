'use strict';

/**
 * loop-trigger-adapters — 可插拔触发器集合
 *
 * 三种 adapter 共享同一套 Loop Spec、State Store、Oracle 逻辑，
 * 只是"怎么触发"不同：
 *
 *   SessionAdapter  — 进程内 setInterval，会话内存活
 *   ExternalAdapter — CLI 入口，由 OS cron / GitHub Actions 调用
 *   EventAdapter    — 事件驱动，监听 Cordis Event 或自定义事件
 */

const { BaseTriggerAdapter, TriggerAdapterError } = require('./base-adapter');
const { SessionAdapter } = require('./session-adapter');
const { ExternalAdapter } = require('./external-adapter');
const { EventAdapter } = require('./event-adapter');

/**
 * 根据 adapter 类型名创建对应实例
 * @param {string} type - 'session' | 'external' | 'event'
 * @param {Object} [options] - 额外选项
 * @param {Object} [options.eventBus] - EventAdapter 需要的事件总线
 * @returns {BaseTriggerAdapter}
 */
function createAdapter(type, options = {}) {
  switch (type) {
    case 'session':
      return new SessionAdapter();
    case 'external':
      return new ExternalAdapter();
    case 'event':
      return new EventAdapter(options.eventBus);
    default:
      throw new TriggerAdapterError(`Unknown adapter type: '${type}'`, {
        code: 'unknown_adapter',
      });
  }
}

/**
 * 自动选择最佳可用 adapter
 * 优先级: session > external
 * @param {Object} [options] - 额外选项
 * @returns {BaseTriggerAdapter}
 */
function createDefaultAdapter(options = {}) {
  const session = new SessionAdapter();
  if (session.isAvailable()) return session;

  return new ExternalAdapter();
}

module.exports = {
  BaseTriggerAdapter,
  TriggerAdapterError,
  SessionAdapter,
  ExternalAdapter,
  EventAdapter,
  createAdapter,
  createDefaultAdapter,
};
