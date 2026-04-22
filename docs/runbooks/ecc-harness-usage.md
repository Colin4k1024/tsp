---
version: "2.3.0"
status: draft
created: 2026-03-27
updated: 2026-04-18
owner: 工程团队
---

# ECC Harness Usage

本文说明如何在当前 Team Skills Platform 上使用 ECC 风格的 specialist layer、commands、rules 和运行时 hooks。它回答三个问题：哪些能力是用户直接调用的、哪些能力是后台机制、以及两者怎样回到主链。

## 1. 双层模型

- 主干：role-based Team Skills 平台，默认走 `/team-*`
- 增强层：ECC harness layer，提供 specialists、快捷 commands、分层规则、runtime hooks 与底层存储/预算/学习机制

## 2. specialist 使用方式

- 规划类：`planner`、`architect`、`chief-of-staff`
- review 类：`code-reviewer`、`security-reviewer`、语言 reviewers
- 解决类：`build-error-resolver`、语言 build resolvers
- 编排类：`loop-operator`、`harness-optimizer`

## 3. 命令接入原则

- `/team-*` 负责正式交付链
- `/plan`、`/tdd`、`/code-review`、`/build-fix`、`/verify`、`/multi-*`、`/harness-audit` 等负责 specialist 快捷编排
- specialist 命令的结论必须回落到 role handoff 或 `/team-*`

一个实用判断是：

- 业务任务优先从 `/team-*` 进入
- 实现路径不清时切 `/plan` 或 `/tdd`
- 代码已改完时切 `/code-review` 或 `/verify`
- 平台本身要审视 coverage、hook、文档和集成深度时切 `/harness-audit`

## 4. rules 与 skills

- `rules/common/` 提供 specialist 共用工程规则
- 语言规则目录提供专项 reviewer 的最小规则支撑
- `skills/` 提供高频工程技能入口，不替代现有 `skills/`

## 5. 运行时 hooks

- `hooks/hooks.json` 是 hooks 配置入口。
- `scripts/hooks/session-start.js`：在会话开始时加载最近一次会话摘要、待办和提示。
- `scripts/hooks/session-end.js`：在会话结束时保存任务摘要、决策和下一次会话提示。
- `scripts/hooks/pre-compact.js`：在压缩上下文前整理高价值信息。
- `scripts/hooks/suggest-compact.js`：在上下文使用率升高时给出压缩建议。
- `scripts/hooks/governance-capture.js`：观察关键工具调用与治理信号，供后续分析使用。
- `scripts/hooks/cost-tracker.js`：记录成本事件和任务复杂度信号。
- 底层状态与会话存储位于 [scripts/lib/state-store/index.js](../../scripts/lib/state-store/index.js)，默认写入运行时状态目录。

## 6. runtime 能力分层

### 6.1 用户直接感知到的能力

- memory persistence：重新进入会话时能拿到摘要、待办和提示
- strategic compact：长会话中出现压缩建议或强制整理
- parallel execution：可将任务拆分到 worktree 或多实例路径
- harness audit：可对平台能力面做 7 维评分和优先级建议

### 6.2 后台机制

- observation：`observe.py` 捕获工具与行为模式
- instinct learning：`instinct_store.py` 维护项目级 / 全局级 instincts
- cost awareness：`cost_tracker.py` 与 `context_budget.py` 管理成本和上下文预算
- archive pipeline：`trigger_compact.py`、`context_priority.py`、`context_archiver.py` 负责上下文重组与归档

### 6.3 典型流水线

1. 进入会话：`session_start.py` 加载摘要与 pending items
2. 执行任务：主链或 specialist 产出结果
3. 观察记录：`observe.py` 捕获行为信号，必要时更新 instinct 数据
4. 预算预警：`context_budget.py` 检测 70% / 85% 阈值
5. 压缩归档：`suggest_compact.py` 或 `pre_compact.py` 配合 archive/priority/trigger 组件做重组
6. 结束会话：`session_end.py` 保存摘要、决策与下一步提示

## 7. 相关增强能力

- 错误经验库：见 [error-experience-usage.md](error-experience-usage.md)
- 并行执行框架：见 [parallel-execution-usage.md](parallel-execution-usage.md)
- 完整 runtime 总览：见 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
- 完整演示场景：见 [demo-scenario.md](demo-scenario.md) 和 [demo-execution-log.md](demo-execution-log.md)

## 8. 使用建议

- specialist 负责专项分析，最终结论仍要回落到 `/handoff` 或 `/team-*`。
- hooks 和 memory 能力属于运行时增强，不替代主链输出字段。
- `harness-audit` 适合审视平台本身，不适合替代业务任务的 review 或 release。
- `tdd`、`eval-harness`、`verify` 适合形成“先定义标准 -> 再实现 -> 再验证”的闭环。
- 如果你要向团队展示整个平台，可直接使用 [../presentation/README.md](../presentation/README.md) 中的材料。
