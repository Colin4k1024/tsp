# Delivery Plan — Loop Engineering 可落地化

> **Status**: reviewed  
> **Owner**: tech-lead  
> **Date**: 2025-07-09  
> **Slug**: loop-engineering

---

## 1. 目标

将 TSP 的 Loop Engineering 能力从 `proposed` 推进到 `implemented`，支持按计划自动触发 AI Agent 执行任务，实现「自动定时任务需求的自动落地」。

## 2. 需求挑战会结论

### 核心假设验证

| # | 假设 | 验证结果 | 影响 |
|---|------|---------|------|
| H1 | 需要从零构建定时任务系统 | ❌ 否决 — TSP 已有完整 Loop Engineering 设计和核心脚本 | 节省 60%+ 工期 |
| H2 | 调度层需 TSP 自建 | ⚠️ 部分 — Session Mode 复用 Cordis，External Mode 需适配 | 采用双模式架构 |
| H3 | 定时任务可在本地持续运行 | ⚠️ 有限 — DSH 是会话级进程，持久化需外置调度器 | 提供 CLI 入口解耦 |
| H4 | maker/checker 对 Agent 任务有效 | ✅ 确认 — `loop-oracle.js` 已有此设计 | 直接复用 |
| H5 | 预算控制能防止 Agent 失控 | ⚠️ 需增强 — Agent 任务 cost 更难预估 | 增加 token 级追踪 |

### 阻断条件（已决策）

| 阻断项 | ADR | 决策 |
|--------|-----|------|
| 调度宿主未定 | ADR-001 | 双模式：Session Mode（Cordis） + External Mode（OS cron/GitHub Actions） |
| 执行隔离未定 | ADR-002 | 共享进程、独立 Fiber — Cordis 原生隔离 |
| MVP 调度边界未定 | ADR-003 | 标准 5 位 cron + UTC 时区 |

### 关键洞察

- **时间驱动只是触发模型之一** — 真实场景更多是事件驱动（PR merge、CI 失败），设计应支持可插拔触发器
- **复用 > 新建** — 扩展 Loop Engineering 的 `one-shot` 和 `watch` 模式，而非新建模块
- **MVP 聚焦 CI Triage** — 设计文档推荐的首个 loop 模板，客观 gate + bounded permissions

---

## 3. Brownfield 上下文快照

### 已有资产

| 资产 | 路径 | 状态 | 复用方式 |
|------|------|------|---------|
| 设计文档 | `docs/plans/loop-engineering-support-design.md` | proposed → 实施蓝图 | 直接作为架构参考 |
| 状态存储 | `scripts/lib/loop-state-store.js` (221行) | 已实现 | 加固测试覆盖 |
| 心跳引擎 | `scripts/lib/heartbeat-scheduler.js` (280行) | 已实现，依赖 Claude CronCreate | 适配 DSH 调度层 |
| 规格解析 | `scripts/lib/loop-spec.js` | 已实现 | 补齐 schema 校验 |
| Oracle | `scripts/lib/loop-oracle.js` | 已实现 | 直接复用 |
| 命令 | `commands/loop-start.md`, `commands/loop-status.md` | 已定义，实现薄 | 增强实现 |
| 技能 | `skills/loop-heartbeat/SKILL.md` | 已定义 | 直接复用 |

### 缺失部分

| 缺失 | 对应 Story | 优先级 |
|------|-----------|--------|
| Loop Spec JSON Schema | Story 0 | P0 |
| DSH 调度适配器 | Story 2 | P0 |
| Agent Task Runner | Story 3 | P0 |
| 外置调度器 CLI 入口 | Story 5 | P1 |
| `/loop-status` 完整实现 | Story 6 | P1 |
| CI Triage 模板 | Story 7 | P1 |
| 可插拔触发器抽象 | Story 0 | P0 |

---

## 4. Story Slice 列表

### Story 0: 可插拔触发器抽象层设计
- **目标**: 定义 TriggerAdapter 接口，支持 cron / event / webhook 三种触发模型
- **验收标准**: 接口文档完成、`session-adapter.js` 骨架可运行
- **Owner**: architect
- **依赖**: 无
- **预估**: 1 天
- **风险**: 接口过度设计 — 坚持最小接口原则

### Story 1: Loop Spec Schema 与状态存储加固
- **目标**: 新增 `schemas/loop-spec.schema.json`，加固 `loop-state-store.js` 测试
- **验收标准**: 无效 spec 报 actionable error、状态可跨 target 读写、`TSP_LOOP_STATE_DIR` 生效、测试覆盖 ≥80%
- **Owner**: backend-engineer
- **依赖**: Story 0
- **预估**: 1-2 天
- **风险**: 低

### Story 2: DSH 调度适配器（Cordis Plugin）
- **目标**: 实现 `session-adapter.js`，基于 Cordis Event + setInterval 驱动定时触发
- **验收标准**: `/loop-start` 注册定时任务、会话内存活期间按 cron 触发、会话结束优雅清理
- **Owner**: backend-engineer
- **依赖**: Story 0, Story 1
- **预估**: 2-3 天
- **风险**: Cordis Fiber 隔离在长任务下的内存泄漏 — 需压力测试

### Story 3: Agent Task Runner（执行器抽象层）
- **目标**: 实现无人值守 Agent 任务执行器，含超时、重试、并发控制、结果持久化
- **验收标准**: 任务执行与用户会话隔离、超时自动终止（默认 10min）、失败重试 3 次 + 指指数退避、并发上限 2、结果写入 state store
- **Owner**: backend-engineer
- **依赖**: Story 2
- **预估**: 3-4 天
- **风险**: Agent 任务 cost 不可控 — 需增加 token 级预算追踪

### Story 4: Heartbeat Engine 接入 DSH
- **目标**: 将 `heartbeat-scheduler.js` 从 Claude CronCreate 适配到 DSH 调度层
- **验收标准**: heartbeat.yaml 配置驱动扫描、扫描结果路由到 goal/triage/notify、预算控制生效
- **Owner**: backend-engineer
- **依赖**: Story 2, Story 3
- **预估**: 2 天
- **风险**: 扫描命令在不同 target 下的兼容性 — 需 target 适配

### Story 5: 外置调度器适配（OS cron / GitHub Actions）
- **目标**: 提供 `tsp loop run <loopId>` CLI 入口、GitHub Actions workflow 模板、OS crontab 示例
- **验收标准**: CLI 可独立执行 loop task、GHA workflow 模板可直接使用、文档完整
- **Owner**: devops-engineer
- **依赖**: Story 3
- **预估**: 1-2 天
- **风险**: 低

### Story 6: `/loop-status` 增强与监控
- **目标**: 完善 loop 状态查询，输出迭代进度、预算消耗、收敛趋势、升级建议
- **验收标准**: 结构化状态输出、预算告警触发、收敛趋势可视化（Markdown 表格）
- **Owner**: backend-engineer
- **依赖**: Story 1
- **预估**: 1 天
- **风险**: 低

### Story 7: 第一个 Loop 模板 — CI Triage
- **目标**: 实现 `.tsp/loops/ci-triage.yaml` 模板，gate 为 `validate-library.js` + `npm test`
- **验收标准**: 模板可运行、maker/backend-engineer + checker/qa-engineer 分离、结果路由正确
- **Owner**: backend-engineer + qa-engineer
- **依赖**: Story 3, Story 4
- **预估**: 2 天
- **风险**: gate 命令在不同环境下的 exit code 不一致 — 需 wrapper

---

## 5. 执行顺序与里程碑

```
Phase 0: 设计 (Day 1)
  └─ Story 0: TriggerAdapter 接口设计

Phase 1: 基础加固 (Day 2-3)
  ├─ Story 1: Spec Schema + State Store 加固
  └─ Story 6: /loop-status 增强 (可并行)

Phase 2: 核心实现 (Day 4-8)
  ├─ Story 2: DSH 调度适配器 (Day 4-6)
  └─ Story 3: Agent Task Runner (Day 5-8, 部分并行)

Phase 3: 集成与模板 (Day 9-12)
  ├─ Story 4: Heartbeat Engine 接入 (Day 9-10)
  ├─ Story 5: 外置调度器适配 (Day 9-10, 并行)
  └─ Story 7: CI Triage 模板 (Day 11-12)

Phase 4: 验证与收口 (Day 13-14)
  ├─ 集成测试
  ├─ npm run workflow:readiness
  └─ 文档更新
```

**总预估**: 10-14 人天（中等路径）

---

## 6. 角色分工

| 阶段 | 主责 | 协作 | 交接点 |
|------|------|------|--------|
| 设计 | architect | tech-lead | ADR → backend-engineer |
| 基础加固 | backend-engineer | — | Spec Schema → 全 Story |
| 核心实现 | backend-engineer | — | Task Runner → Story 4/5/7 |
| 集成模板 | backend-engineer | qa-engineer, devops-engineer | CLI + 模板 → 验证 |
| 验证收口 | qa-engineer | tech-lead | 放行建议 → tech-lead |

---

## 7. 风险与依赖

| 风险 | 概率 | 影响 | Mitigation |
|------|------|------|-----------|
| Cordis Fiber 长任务内存泄漏 | 中 | 高 | 压力测试 + 任务超时强制终止 |
| Agent 任务 cost 失控 | 中 | 高 | token 级预算追踪 + 硬上限 |
| gate 命令 exit code 不一致 | 低 | 中 | wrapper 脚本标准化 |
| 外置调度器环境差异 | 低 | 中 | Docker 容器化执行环境 |

---

## 8. 技能装配清单

| 能力 | 来源 | 用途 |
|------|------|------|
| `loop-heartbeat` | skills/loop-heartbeat/ | 心跳发现自动化 |
| `goal-convergence` | skills/goal-convergence/ | 目标收敛判定 |
| `verification-loop` | skills/verification-loop/ | 验证循环 |
| `session-continuity` | skills/session-continuity/ | 会话持久化 |
| `context-engineering` | skills/context-engineering/ | 上下文管理 |
| `coding-standards` | skills/coding-standards/ | 代码规范基线 |

---

## 9. 应用等级 / 技术架构等级

- **应用等级**: 内部工具链（非面向终端用户）
- **技术架构等级**: 中等（涉及调度、持久化、并发控制）
- **关键组件偏离**: `heartbeat-scheduler.js` 从 Claude 原语迁移到 DSH 适配层

---

## 10. 需要 ADR

| ADR | 状态 | 决策 |
|-----|------|------|
| ADR-001: 调度宿主选型 | ✅ Accepted | 双模式：Session Mode + External Mode |
| ADR-002: 执行隔离策略 | ✅ Accepted | 共享进程、独立 Fiber |
| ADR-003: MVP 调度能力边界 | ✅ Accepted | 标准 5 位 cron + UTC |

---

## 11. Implementation-Readiness 结论

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 需求挑战会完成 | ✅ | 3 个假设已验证、3 个 ADR 已决策 |
| 技术方案收敛 | ✅ | 复用 Loop Engineering + Cordis 适配 |
| 角色分工明确 | ✅ | architect → backend → devops → qa |
| 阻断条件已解决 | ✅ | 全部 ADR 已 Accepted |
| Story 切分合理 | ✅ | 8 个 story，每个 1-4 天 |
| 预算约束明确 | ✅ | maxIterations + maxDuration + maxDollars |
| 风险有 Mitigation | ✅ | 4 个风险均有应对方案 |

**结论**: Implementation-Readiness **PASS**，可进入 `/team-execute` 阶段。
