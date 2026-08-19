# Project Context

> **Last Updated**: 2025-08-19  
> **Source**: /team-plan → artifact:persist

---

## Current Task

- **Task ID**: `2025-07-09-loop-engineering`
- **Phase**: execute (Story 0 & 1 complete)
- **Status**: Story 0 & 1 已实现，Story 2-7 待推进

## Tech Stack

- Node.js (CommonJS)
- Cordis 插件架构 (DSH)
- 现有 Loop Engineering 基础设施

## Dependencies

- `scripts/lib/loop-state-store.js` — 状态存储核心
- `scripts/lib/loop-spec.js` — 规格解析 + Intake Checker
- `scripts/lib/loop-oracle.js` — Maker/Checker Oracle
- `scripts/lib/loop-trigger-adapters/` — 可插拔触发器 (base/session/external/event)
- Cordis Plugin System — 调度适配层载体 (dsh-plugin/)
- `scripts/lib/heartbeat-scheduler.js` — 心跳引擎 (待接入)

## Risks

1. **Cordis Fiber 长任务内存泄漏** — 需压力测试
2. **Agent 任务 cost 失控** — 需 token 级预算追踪
3. **进程重启后任务丢失** — Session Mode 限制，External Mode 可缓解
4. **SessionAdapter 无并发保护** — 长时间任务可能重叠执行

## Decisions (ADR)

- **ADR-001**: 调度宿主 = 双模式（Session Mode + External Mode）
- **ADR-002**: 执行隔离 = 共享进程、独立 Fiber
- **ADR-003**: MVP 调度 = 标准 5 位 cron + UTC

## Next Steps

1. 实现 Story 2: DSH 调度适配器（Cordis Plugin 集成）
2. 实现 Story 3: Agent Task Runner（`loop-task-runner.js`）
3. 实现 Story 4-7: Heartbeat 接入、外置调度 CLI、/loop-status 增强、CI Triage 模板
4. 集成验证后进入 `/team-review`

## Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Delivery Plan | `docs/artifacts/2025-07-09-loop-engineering/delivery-plan.md` | reviewed |
| Arch Design | `docs/artifacts/2025-07-09-loop-engineering/arch-design.md` | reviewed |
| Execute Log | `docs/artifacts/2025-07-09-loop-engineering/execute-log.md` | completed |
| Implementation Design | `docs/plans/loop-engineering-phase2-implementation.md` | in-progress |
| Loop Engineering Design | `docs/plans/loop-engineering-support-design.md` | proposed |
