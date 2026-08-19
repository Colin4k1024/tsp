# Arch Design — Loop Engineering 可落地化

> **Status**: reviewed  
> **Owner**: architect  
> **Date**: 2025-07-09  
> **Slug**: loop-engineering

---

## 1. 架构概述

将 TSP Loop Engineering 从 `proposed` 推进到 `implemented`，采用**双模式调度 + 可插拔触发器**架构。

```
┌─────────────────────────────────────────────────────────┐
│                    Trigger Layer (可插拔)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Session Mode  │  │ External Mode│  │  Event Mode   │  │
│  │ (Cordis       │  │ (OS cron /   │  │ (PR merge /   │  │
│  │  setInterval) │  │  GitHub Act.)│  │  CI failure)  │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼─────────────────┼───────────────────┼─────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              Loop Engine (核心引擎)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Loop Spec│  │ Intake   │  │ Task     │  │ Oracle  │ │
│  │ Parser   │  │ Checker  │  │ Runner   │  │ (Maker/ │ │
│  │          │  │          │  │          │  │ Checker)│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              State Layer (持久化)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Goals    │  │ Triage   │  │ Heartbeat│  │ Metrics │ │
│  │ Store    │  │ Inbox    │  │ State    │  │ Store   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 2. 组件设计

### 2.1 TriggerAdapter 接口

```javascript
/**
 * 可插拔触发器抽象接口
 * @interface TriggerAdapter
 */
// 方法:
//   start(loopSpec, onTrigger) → void
//   stop(loopId) → void
//   getStatus(loopId) → { running, nextRun, lastRun }
```

三种实现：
- **SessionAdapter**: Cordis Plugin + `setInterval`，会话内有效
- **ExternalAdapter**: CLI 入口 `tsp loop run <loopId>`，由外部调度器调用
- **EventAdapter**: Cordis Event 监听，响应 PR merge / CI failure 等事件

### 2.2 Agent Task Runner

```javascript
/**
 * 无人值守 Agent 任务执行器
 * @interface TaskRunner
 */
// 方法:
//   execute(loopSpec, iteration) → TaskResult
//   abort(taskId) → void

/**
 * @typedef {Object} TaskResult
 * @property {string} status - 'success' | 'failure' | 'timeout' | 'partial'
 * @property {number} duration - 执行耗时 (ms)
 * @property {number} tokensUsed - token 消耗
 * @property {Object} gateOutput - gate 命令输出
 * @property {string} verdict - Oracle 判定: 'pass' | 'fail' | 'uncertain'
 */
```

执行隔离：Cordis Fiber 级隔离，每个任务独立 effect 作用域。

### 2.3 Safety Model

| 约束 | 实现 |
|------|------|
| 硬 gate | 命令 exit code、测试报告、schema 校验 |
| 预算控制 | maxIterations + maxDuration + maxDollars |
| 权限边界 | 每个 loop 独立 write scope，不能自我提升 |
| maker/checker 分离 | Oracle 独立于 maker，只看 gate output |
| 结果持久化 | 所有执行结果写入 state store |
| 防重复执行 | file-based lock + runId |

## 3. 数据流

```
用户配置 .tsp/loop.yaml
        │
        ▼
  Loop Spec Parser (校验 + 解析)
        │
        ▼
  Intake Checker (四项准入)
        │ pass
        ▼
  TriggerAdapter.start()
        │ cron 触发
        ▼
  TaskRunner.execute()
        │
        ├─── Gate 执行 (npm test, validate-*, etc.)
        │
        ▼
  Oracle 判定 (pass/fail/uncertain)
        │
        ├── pass → 记录 accepted change
        ├── fail → 创建 goal / 重试 / triage
        └── uncertain → triage inbox
```

## 4. 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `schemas/loop-spec.schema.json` | 新增 | JSON Schema 校验 |
| `scripts/lib/loop-trigger-adapters/session-adapter.js` | 新增 | Session Mode 触发器 |
| `scripts/lib/loop-trigger-adapters/external-adapter.js` | 新增 | External Mode 触发器 |
| `scripts/lib/loop-trigger-adapters/event-adapter.js` | 新增 | Event Mode 触发器 |
| `scripts/lib/loop-task-runner.js` | 新增 | Agent 任务执行器 |
| `scripts/lib/loop-state-store.js` | 修改 | 增加 metrics API |
| `scripts/lib/loop-spec.js` | 修改 | 增加 intake check |
| `scripts/lib/heartbeat-scheduler.js` | 修改 | 适配 DSH 调度层 |
| `commands/loop-start.md` | 修改 | 增强实现 |
| `commands/loop-status.md` | 修改 | 增强实现 |
| `.tsp/loops/ci-triage.yaml` | 新增 | 首个 loop 模板 |
| `skills/loop-heartbeat/SKILL.md` | 修改 | 更新调度适配说明 |

## 5. 非目标（Non-Goals）

- 不构建通用任务调度平台
- 不支持分布式调度
- 不自动合并 loop 产生的 PR
- 不替代 `/team-*` 治理链
- 不要求外部工具（Linear/Jira/Slack）
