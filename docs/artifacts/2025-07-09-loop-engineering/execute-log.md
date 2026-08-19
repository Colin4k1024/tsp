# Execute Log — Loop Engineering Story 0 & 1

> **Status**: completed  
> **Role**: backend-engineer  
> **Date**: 2025-07-09  
> **Slug**: loop-engineering

---

## 执行范围

本次执行覆盖 **Story 0（可插拔触发器抽象层）** 和 **Story 1（Loop Spec Schema 与状态存储加固）**。

### In-Scope
- TriggerAdapter 抽象接口 + 三个实现（session / external / event）
- Intake Checker（四项准入条件检查）
- Loop Spec Schema 增量（automation + metrics 字段）
- State Store 增强（metrics API、gate 记录、triage 操作）
- 测试覆盖（30 个新测试）

### Out-of-Scope
- Story 2-7（调度适配器集成、Task Runner、Heartbeat 接入等）
- 前端管理界面
- 分布式调度

---

## 实现结果

### 新增文件

| 文件 | 说明 |
|------|------|
| `scripts/lib/loop-trigger-adapters/base-adapter.js` | 抽象基类，定义 TriggerAdapter 接口 |
| `scripts/lib/loop-trigger-adapters/session-adapter.js` | 会话内 setInterval 触发器 |
| `scripts/lib/loop-trigger-adapters/external-adapter.js` | 外置调度器适配（OS cron / GHA） |
| `scripts/lib/loop-trigger-adapters/event-adapter.js` | 事件驱动触发器 |
| `scripts/lib/loop-trigger-adapters/index.js` | 模块入口 + 工厂函数 |
| `tests/test_loop_trigger_adapters.js` | 30 个测试用例 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `scripts/lib/loop-spec.js` | +automation/metrics 字段解析，+checkIntake() 函数 |
| `scripts/lib/loop-state-store.js` | +getLoopMetrics/recordGateRun/listLoopSummaries/listTriageItems/actOnTriageItem |
| `schemas/loop-spec.schema.json` | +automation/metrics JSON Schema 定义 |

---

## 关键决策

| 决策 | 理由 |
|------|------|
| Adapter 只负责触发，不负责执行 | 保持关注点分离，执行逻辑统一在 TaskRunner |
| SessionAdapter timer 使用 `unref()` | 不阻塞进程正常退出 |
| EventAdapter 要求先 registerTrigger 再 start | 确保事件监听在启动前配置完成 |
| ExternalAdapter 不预测 nextRun | 外置调度器决定执行时间，TSP 无法获知 |
| State Store metrics 保留最近 100 条 gate 记录 | 平衡存储空间与可观测性 |
| checkIntake 失败时推荐替代命令 | 引导用户到正确的命令入口 |

---

## 自测结果

```
=== Trigger Adapter Tests ===
BaseTriggerAdapter:     4/4  ✓
SessionAdapter:         7/7  ✓
ExternalAdapter:        5/5  ✓
EventAdapter:           4/4  ✓
createAdapter:          2/2  ✓
checkIntake:            6/6  ✓
parseLoopSpecContent:   2/2  ✓
─────────────────────────────
Total:                 30/30 ✓

=== Existing Tests ===
Loop engineering runtime: 5/5 ✓
```

---

## 计划 vs 实际偏差

| 维度 | 计划 | 实际 | 偏差原因 |
|------|------|------|---------|
| Story 0 预估 | 1 天 | ~2 小时 | 比预期顺利 |
| Story 1 预估 | 1-2 天 | ~1 小时 | 现有代码基础扎实，增量小 |
| 新增文件 | 11 个 | 6 个 | 将 adapter 合并到一个目录，减少文件数 |

---

## 影响面

- **向后兼容**: 所有新增字段均为可选，不影响现有 `.tsp/loop.yaml`
- **无破坏性变更**: existing 5 tests 全部通过
- **新依赖**: 无（仅使用 Node.js 内置模块）

---

## 未完成项

- [ ] Story 2: DSH 调度适配器（Cordis Plugin 集成 SessionAdapter）
- [ ] Story 3: Agent Task Runner（执行器抽象层）
- [ ] Story 4: Heartbeat Engine 接入 DSH
- [ ] Story 5: 外置调度器适配 CLI 入口
- [ ] Story 6: `/loop-status` 增强
- [ ] Story 7: CI Triage Loop 模板

---

## 交给 QA 的说明

请验证：
1. `node tests/test_loop_trigger_adapters.js` — 30 个测试全部通过
2. `node tests/test_loop_engineering_runtime.js` — 现有 5 个测试未被破坏
3. `scripts/lib/loop-spec.js` 的 checkIntake 对无效 spec 返回 actionable 错误
4. `schemas/loop-spec.schema.json` 接受 automation/metrics 字段
