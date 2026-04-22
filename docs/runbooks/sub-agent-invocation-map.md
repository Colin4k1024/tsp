---
version: "1.0.0"
status: active
created: 2026-04-02
updated: 2026-04-17
owner: 工程团队
doc_tier: governance
last_verified: 2026-04-17
source_of_truth:
  - ../../scripts/lib/team-skills-data.json
  - ./agent-governance.md
---

# 子 Agent 调用映射

本文是当前平台 **唯一权威的调用映射来源**：明确每条命令触发哪个 agent、该 agent 可以调用哪些子 agent、以及贯穿全链路的管控约束。

所有 agent（role + specialist）必须同时遵循 [agent-governance.md](../runbooks/agent-governance.md) 中的统一管控策略。

---

## 1. 调用模型说明

平台采用两层 agent 调用模型：

```
用户命令
  └─ 主链 Role Agent（owner，对产出负最终责任）
       ├─ 可调用 Specialist Agent（分析、评审、规划）
       └─ 产出落盘到 docs/artifacts/ 或通过 /handoff 交接下游 Role Agent
```

- **Role Agent**：有主责输出、交接责任、需落盘
- **Specialist Agent**：只产出建议，结论必须回落到 Role Agent 的输出中
- **调用方式**：在 Claude 对话中明确说 `用 <agent-id> 角色执行`，或通过 `runSubagent` 工具调用（agent 名称对应 `agents/roles/` 或 `agents/specialists/` 中的文件名去掉 `.md`）

---

## 2. 主链命令 → Role Agent 映射

| 命令 | 调用 Role Agent | 可调用 Specialist | 典型输出 |
|------|----------------|-------------------|----------|
| `/team-intake` | `tech-lead` | `planner`（复杂需求拆解）、`ui-ux-designer`（涉及 UI 时提供初步体验约束） | `prd.md` + `requirement-challenge` 输入 |
| `/team-plan` | `tech-lead` | `planner`、`architect`、`ui-ux-designer`、`project-manager`（动态分组讨论与挑战会） | `delivery-plan.md`、`arch-design.md`、`design-review` 结论 |
| `/handoff` | 当前主责角色 | — | handoff 结构化记录，写入下游，推进到 `handoff-ready` |
| `/team-execute` | `backend-engineer` 或 `frontend-engineer` | `planner`、`build-error-resolver`（遇到构建失败）、语言 reviewer（问题定位）、`loop-operator`（多轮验证） | `execute-log.md`，前提为 `handoff-ready` |
| `/team-review` | `qa-engineer` | `code-reviewer`、`security-reviewer`、语言 reviewer、`tdd-guide` | `test-plan.md`，放行结论 |
| `/team-release` | `devops-engineer` | `chief-of-staff`（跨角色同步）、`harness-optimizer`（平台审计） | `release-plan.md` |

---

## 3. Specialist 命令 → Specialist Agent 映射

| 命令 | 调用 Specialist Agent | 结论回落 |
|------|-----------------------|----------|
| `/plan` | `planner` | 回落到 `/team-plan` 或 `/handoff` |
| `/tdd` | `tdd-guide` | 回落到 `/team-execute` 或 `/team-review` |
| `/code-review` | `code-reviewer` | 回落到 `/team-review` 或 `/handoff` |
| `/build-fix` | `build-error-resolver`（通用），或 `java-build-resolver`、`go-build-resolver`、`rust-build-resolver`、`python-reviewer`、`typescript-reviewer`、`kotlin-build-resolver`、`pytorch-build-resolver`（语言专项） | 回落到 `/team-execute` |
| `/verify` | `loop-operator`、`tdd-guide` | 回落到 `/team-review` 或 `/team-execute` |
| `/multi-frontend` | `planner` 编排，`frontend-engineer` 执行 | 回落到 `/team-execute` |
| `/multi-backend` | `planner` 编排，`backend-engineer` 执行 | 回落到 `/team-execute` |
| `/harness-audit` | `harness-optimizer` | 输出平台改进建议，更新 `docs/memory/` |

---

## 4. Role Agent 之间的标准传递路径

```
product-manager
      │ PRD、用户故事、UI/UX 约束摘要
      ▼
  tech-lead ◄────────────────────────── 所有冲突/升级
      │ Delivery Plan、任务拆解
      ├──────────────────────────────────────────┐
      ▼                                          ▼
  architect ──► frontend-engineer ◄── ui-ux-designer
      │ ADR        │ 前端实现           │ 交互流、设计 token
      │            │                    │ 体验风险清单
      ▼            ▼                    │
  backend-engineer ──────► qa-engineer ◄┘
      │ 后端实现、自测       │ 测试计划、放行建议
      │                    │
      └────────────────────┼──► devops-engineer
                           │         │ 发布方案、回滚
                           ▼         ▼
                       tech-lead（最终收口）
```

每次传递必须经过 `/handoff`，结构化字段见 [handoff-contract.md](../../rules/handoff-contract.md)。

---

## 5. 并行调用场景

以下场景允许多个 agent 并行调用，使用 `parallel-execution` skill 或 Git worktree 隔离：

| 场景 | 并行 Agent 组合 | 汇总角色 |
|------|----------------|----------|
| 需求挑战会 | `product-manager` + `project-manager` + `architect` + `tech-lead` | `tech-lead` |
| 四方并行设计 | `architect` + `ui-ux-designer` + `frontend-engineer` + `backend-engineer` | `tech-lead`（Design Review Board） |
| 多服务后端 | 多个 `backend-engineer` 实例（按服务拆分） | `planner` 编排 → `tech-lead` 收口 |
| 多模块前端 | 多个 `frontend-engineer` 实例（按页面拆分） | `planner` 编排 → `tech-lead` 收口 |
| Build-fix 并行 | 多个语言 `build-resolver` 并发修复各模块 | `build-error-resolver` 汇总 |

并行任务之间禁止写冲突；共享状态通过文件传递，由汇总角色负责合并。

### 5.1 动态分组规则

`/team-plan` 不能只按固定四方并行启动，必须按任务类型动态装配最小讨论组：

| 任务特征 | 基础参与角色 | 增补角色 |
|----------|--------------|----------|
| 业务目标/范围不清 | `product-manager`、`project-manager`、`tech-lead` | `architect` |
| 架构/接口/数据模型变更 | `architect`、`backend-engineer`、`project-manager`、`tech-lead` | `frontend-engineer`（若影响 UI） |
| UI / 体验变更 | `product-manager`、`ui-ux-designer`、`frontend-engineer`、`tech-lead` | `architect`、`backend-engineer` |
| 全栈改动 | `architect`、`frontend-engineer`、`backend-engineer`、`project-manager`、`tech-lead` | `ui-ux-designer`、`devops-engineer` |

每个被拉入的角色都必须对上游输入提出至少 1 条质疑，并把结论回落到 `/team-plan` 或 `/handoff`。

---

## 6. 单次 agent 调用的标准流程

无论是 role agent 还是 specialist agent，每次调用都必须：

1. **读取自身 agent 文件**：`agents/roles/<id>.md` 或 `agents/specialists/<id>.md`
2. **确认管控约束**：遵循 [agent-governance.md](../runbooks/agent-governance.md)
3. **确认输入依据**：来源 artifact、handoff 记录或用户输入
4. **执行并产出**：按角色定义的标准输出
5. **落盘或交接**：role agent 必须落盘；specialist agent 结论回落到 role agent 输出
6. **升级判断**：命中升级条件时，立即通知 `tech-lead`

---

## 7. 相关文档

- [agent-governance.md](../runbooks/agent-governance.md)：统一管控策略（所有 agent 必读）
- [handoff-contract.md](../../rules/handoff-contract.md)：交接字段要求
- [handoff-governance.md](../runbooks/handoff-governance.md)：全量 Handoff 流程图与交接矩阵
- [artifact-persistence.md](../runbooks/artifact-persistence.md)：落盘约定
- [parallel-execution-usage.md](../runbooks/parallel-execution-usage.md)：并行执行指南
- [ecc-harness-usage.md](../runbooks/ecc-harness-usage.md)：ECC 层使用说明
- [team-command-output-contracts.md](../runbooks/team-command-output-contracts.md)：命令输出字段定义
