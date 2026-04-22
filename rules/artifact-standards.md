# Artifact Standards

## 标准交付物

| 交付物 | 模板 | 主责角色 | 存储路径（消费方仓库） |
|--------|------|----------|------------------------|
| PRD | 本文最小字段要求 | `product-manager` | `docs/artifacts/{slug}/prd.md` |
| Delivery Plan | 本文最小字段要求 | `project-manager` | `docs/artifacts/{slug}/delivery-plan.md` |
| Arch Design | 本文最小字段要求 | `architect` | `docs/artifacts/{slug}/arch-design.md` |
| ADR | 本文最小字段要求 | `architect` | `docs/adr/ADR-{NNN}-{title}.md` |
| API Contract | `templates/api-contract.md` | `architect` / `backend-engineer` | `docs/artifacts/{slug}/api-contract.md` |
| Execute Log | 本文最小字段要求 | `backend-engineer` / `frontend-engineer` | `docs/artifacts/{slug}/execute-log.md` |
| Design System Brief | `templates/design-system-brief.md` | `tech-lead` / `frontend-engineer` | `docs/artifacts/{slug}/` |
| UI Implementation Plan | `templates/ui-implementation-plan.md` | `frontend-engineer` | `docs/artifacts/{slug}/` |
| Test Plan | 本文最小字段要求 | `qa-engineer` | `docs/artifacts/{slug}/test-plan.md` |
| Deployment Context | `templates/deployment-context.md` | `devops-engineer` / `tech-lead` | `docs/artifacts/{slug}/deployment-context.md` |
| Launch Acceptance | `templates/launch-acceptance.md` | `qa-engineer` / `tech-lead` | `docs/artifacts/{slug}/launch-acceptance.md` |
| UI Review Checklist | `templates/ui-review-checklist.md` | `frontend-engineer` / `qa-engineer` | `docs/artifacts/{slug}/` |
| Release Plan | `templates/release-plan.md` | `devops-engineer` | `docs/artifacts/{slug}/release-plan.md` |
| Closeout Summary | `templates/closeout-summary.md` | `tech-lead` / `devops-engineer` | `docs/artifacts/{slug}/closeout-summary.md` |
| Backlog Snapshot | `templates/backlog-snapshot.md` | `tech-lead` / `project-manager` | `docs/memory/backlog.md`（持续更新） |
| Incident Brief | 本文最小字段要求 | `tech-lead` / `devops-engineer` | `docs/artifacts/{slug}/` |
| Project Context | 最小字段：项目名 / tech stack / 当前任务 / 风险 | `tech-lead` | `docs/memory/project-context.md`（覆盖更新） |
| Decisions Log | 最小字段：日期 / 决策标题 / 背景 / 决策 / 影响 | `backend-engineer` / `architect` | `docs/memory/decisions.md`（追加） |
| Lessons Learned | 最小字段：日期 / 标题 / 场景 / 问题 / 建议 | `qa-engineer` / `devops-engineer` | `docs/memory/lessons-learned.md`（追加） |
| Session Summary | 最小字段：链路起止 / 任务 / 产出 / 遗留事项 | `devops-engineer` / `tech-lead` | `docs/memory/sessions/{YYYY-MM-DD}-{NNN}-{slug}.md` |

## 编写要求

- 结论先行，假设与风险显式列出。
- 使用中文说明，保留必要英文技术名词。
- 若启用文档架构能力，必须严格映射到现有 artifact 文件，不新增平行主目录作为交付事实源。
- 能复用现有模板时不重新发明结构；PRD、Delivery Plan、Test Plan、Incident Brief 直接按本文字段生成。
- 任何跨角色交接产物都要可直接被下游执行。
- `/team-*` 主链命令的输出结构统一遵循 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)；涉及 role handoff 时，再叠加 [handoff-contract.md](handoff-contract.md) 的字段要求。
- **所有产物必须持久化到文件**：`/team-*` 命令执行完毕后，按 [artifact-persistence.md](../docs/runbooks/artifact-persistence.md) 约定写入消费方项目仓库，不允许仅在对话中输出。
- 涉及前端变更时，至少补齐设计系统摘要、实现计划或 UI 评审清单中的一项；进入 QA 前必须有 `templates/ui-review-checklist.md` 证据。
- 进入正式发布前，至少应存在 `deployment-context.md` 与 `launch-acceptance.md`；solo mode 下也不能把这两类事实压缩进对话。
- 发布后进入收口阶段时，必须产出 `closeout-summary.md`，并同步更新 `docs/memory/backlog.md` 承接遗留项、技术债和下一阶段候选。
- ADR 至少包含：决策信息、背景与约束、备选方案、决策结果、企业内控补充、后续动作。
- Release Plan 至少包含：发布信息、变更与风险、执行步骤、验证与监控、回滚方案、放行结论。

### 文档能力映射规则

- Project Profile Card 回落到 `prd.md` 的背景 / 约束与 `delivery-plan.md` 的版本目标。
- Service Catalog、Communication Matrix、NFR Summary 回落到 `arch-design.md`，必要时在 `api-contract.md` 细化。
- API、事件、鉴权契约回落到 `api-contract.md` 与 `docs/adr/`。
- 一致性审计结果回落到 `test-plan.md` 的风险与放行建议，阻塞项必须可追溯到具体 artifact。
- 部署、配置、密钥、值守和回滚入口统一回落到 `deployment-context.md`，发布决策与执行步骤回落到 `release-plan.md`。
- 上线准入结论回落到 `launch-acceptance.md`，不能只写在 `test-plan.md` 或 `release-plan.md` 的尾部。
- 发布后观察、收口判断和 backlog 回填统一回落到 `closeout-summary.md`、`docs/memory/backlog.md` 和 `docs/memory/sessions/*.md`。

## 通用文档最小字段

### PRD

- 背景：业务问题、触发原因、当前约束。
- 目标与成功标准：业务目标、用户价值、成功指标。
- 用户故事：至少包含用户故事和可验证的验收标准。
- 范围：In Scope、Out of Scope。
- 风险与依赖：关键依赖、风险、待确认项。

### Delivery Plan

- 版本目标：版本或里程碑、范围说明、放行标准。
- 工作拆解：工作项、主责角色、依赖、计划时间。
- 风险与缓解：风险、影响、缓解措施、Owner。
- 节点检查：方案评审、开发完成、测试完成、发布准备。

### Arch Design

- 系统边界：外部依赖、集成点、边界内外划分。
- 组件拆分：主要模块 / 服务及其职责。
- 关键数据流：核心路径的数据流转，可用 Mermaid。
- 接口约定：主要 API 入口、协议、认证方式。
- 技术选型：关键语言、框架、中间件选择及原因。
- 风险与约束：已知技术风险和上线前必须解决的约束。

### ADR

- 决策信息：编号、决策标题、状态、日期、Owner、关联需求或命令入口。
- 背景与约束：当前问题、业务目标、约束条件、非目标。
- 备选方案：选项、适用条件、优点、风险或成本、不选原因。
- 决策结果：采用方案、原因、影响范围、兼容性或迁移影响、失败或回退思路。
- 企业内控补充：应用等级、技术架构等级、关键组件或平台偏离、资产文档入口。
- 后续动作：需要同步的文档、需要通知的角色、Owner、完成条件。

### Execute Log

- 计划 vs 实际：原计划完成哪些，实际完成哪些，偏差原因。
- 关键决定：实施过程中做出的技术决定。
- 阻塞与解决：遇到的阻塞、根因和最终解决方式。
- 影响面：涉及的模块、接口、数据库、配置。
- 未完成项：因范围或时间调整而延后的内容。

### Test Plan

- 测试范围：功能范围、非功能范围、不覆盖项。
- 测试矩阵：场景、类型、前置条件、预期结果。
- 风险：高风险路径、回归关注点、数据准备。
- 放行建议：是否建议放行、阻塞项、补充验证。

### Deployment Context

- 环境清单：各环境用途、访问入口、部署目标。
- 部署入口：主入口、手工入口、回退入口、前置条件。
- 配置与密钥：环境变量、配置项、密钥来源、访问方式。
- 运行保障：feature flag、灰度控制、监控、告警、值守安排、观察窗口。
- 恢复能力：回滚触发条件、回滚路径、验证方法。

### Launch Acceptance

- 验收概览：对象、时间、角色、验收方式。
- 验收范围：业务、技术、非功能边界与不在范围内项。
- 验收证据：测试结果、关键 artifact、关键环境。
- 风险判断：已满足项、可接受风险、阻塞项。
- 上线结论：是否允许上线、前提条件、观察重点、确认记录。

### Closeout Summary

- 收口对象：关联任务、release、观察窗口、收口角色。
- 结果判断：发布后观察结果、目标达成情况、当前状态判断。
- 残余事项：遗留项、残余风险、是否需要补丁或再次发布。
- 知识沉淀：lessons learned、后续 owner、回看时间。
- Backlog 回填：必须标明是否已同步到 `docs/memory/backlog.md`。

### Backlog Snapshot

- 快照信息：来源任务、更新时间、更新角色。
- 事项分类：未完成项、发布后遗留项、技术债、下一阶段候选。
- 排序信息：优先级、触发条件、建议处理阶段。
- 真相源：跨任务以 `docs/memory/backlog.md` 为准，不再只存在于 release 备注或对话。

### Incident Brief

- 事件概览：事件编号、发现时间、影响范围、当前状态。
- 初步判断：现象、疑似原因、临时止血措施。
- 协作分工：角色、负责人、当前动作。
- 后续动作：下一次同步时间、需升级的问题、复盘要求。
