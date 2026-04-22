# /team-plan

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

用于先完成需求挑战会与设计收口，再锁定交付计划、角色分工、风险与依赖，并形成 implementation-readiness 结论，把前端治理要求前置到方案阶段。

## 主责角色

- `tech-lead`

## 期望输入

- 需求简报或 PRD
- 现有技术上下文
- 资源和时间约束
- 设计与体验约束
- intake 中识别的领域线索

## 标准输出

- 交付计划
- 需求挑战会结论
- implementation-readiness 结论与执行前提
- brownfield 上下文快照
- story slice 列表
- 角色分工
- 风险与依赖清单
- 应用等级 / 技术架构等级 / 关键组件偏离
- 是否需要 ADR
- 技能装配清单
- 前端交付物与检查点

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 先完成需求挑战会：明确至少 3 个核心假设、对应质疑人、结论与未决项，再进入方案收口。
2. 默认把 `karpathy-guidelines` 作为计划收口护栏：要求显式写出假设、更简单备选路径、当前不做项，以及为什么本轮范围已经足够。
3. 按任务特征装配动态讨论分组，先讨论再收敛，避免未经质疑直接进入计划冻结。
4. 若启用 `doc-architecture`，补齐 Service Catalog、Communication Matrix、NFR Summary，并明确其 artifact 回落位置。
5. 若是既有项目（brownfield），先梳理现有模块边界、外部依赖、历史约束和缺失文档；必要时运行 `/update-codemaps`，再把 brownfield snapshot 回落到 `delivery-plan.md` 与 `arch-design.md`。
6. 若为企业内部应用，锁定应用等级、技术架构等级、关键组件偏离和资产入口要求，并判断是否必须输出 ADR。
7. 为本次任务显式装配 shared 能力、ECC 增强与可选 enterprise overlay 组合，并说明哪些私有 overlay 能力、runbook 或 overlay 仅按场景启用。
8. 若存在多参数、多角色、多配置或多终端组合，提前判断是否需要 `pairwise-test-design` 压缩测试矩阵。
9. 若包含 UI，锁定产品类型、视觉方向、设计 token、响应式基线，以及 `/team-review` 需要的前端证据。
10. 在需求挑战会与并行设计都完成之前，不得把交付计划标记为可执行。
11. 把实现工作切成 story-sized execution units：每个 slice 必须有清晰目标、验收标准、依赖、owner 和 handoff 终点，避免把多个高风险改动揉成一次 `/team-execute`。
12. 在计划冻结前运行 `npm run workflow:readiness -- --phase execute --task-dir docs/artifacts/{YYYY-MM-DD}-{slug}` 校验 implementation-readiness；若失败，先回补 challenge、design review、handoff 或 artifact 证据。
13. 指定每个阶段的主责角色与交接顺序。
14. 明确风险、阻塞、升级点和检查节点，并沉淀 ADR 所需输入。
15. 【落盘 — 必须执行，不可跳过】
① 复用 intake 阶段已有的 slug。
② 立即执行 `npm run artifact:persist -- ensure-task --date {YYYY-MM-DD} --slug {slug} --state plan`，确保任务目录和 INDEX 行可复用。
③ 执行 `npm run artifact:persist -- ensure-artifact --date {YYYY-MM-DD} --slug {slug} --artifact delivery-plan --role tech-lead --status draft --state plan` 创建 `delivery-plan.md`。
④ 若本阶段产出架构设计，执行 `npm run artifact:persist -- ensure-artifact --date {YYYY-MM-DD} --slug {slug} --artifact arch-design --role architect --status draft --state plan` 创建 `arch-design.md`。
⑤ 如需 ADR，按既有规则在 `docs/adr/` 新建并同步 INDEX 的 ADR 列。
⑥ 执行 `npm run artifact:persist -- write-project-context --project-name {project_name} --current-task {YYYY-MM-DD}-{slug} --phase handoff-ready --tech-stack "{tech_stack_item}" --dependency "{dependency_item}" --risk "{risk_item}" --next-step "{next_step_item}"` 刷新 `docs/memory/project-context.md`。
⑦ 完成后逐条输出确认，例如：`已创建 delivery-plan.md / arch-design.md`，`已刷新 project-context.md`。

## Claude 子 Agent 调用

> 以下调用需要 `runSubagent` 工具。满足触发条件时，在当前对话中发起。

### 需求挑战会（challenge）

**触发条件**：需求刚进入方案阶段、核心假设尚未被挑战或任务存在明显分歧时

| 子 Agent | agentName | 职责范围 |
|-----------|-----------|----------|
| product-manager | `product-manager` | 业务目标、范围边界、用户价值与可验证假设 |
| project-manager | `project-manager` | 工期压力、依赖关系、串行假设与并行化机会 |
| architect | `architect` | 技术可行性、架构边界、方案取舍与失败模式 |

**Prompt 模板**（调用时将 `{task_context}` 替换为当前任务背景，`{role_name}` 替换为对应角色名，`{scope}` 替换为职责范围）：

> 你是 Team Skills Platform 中的 {role_name}。基于以下任务背景，先挑战 {scope} 相关的核心假设，不要直接进入方案收口：
>
> {task_context}
>
> 要求：至少列出 1 条质疑、1 个替代路径、1 个阻断条件，并输出可回填到 Requirement Challenge Session Log 的内容。

**汇总**：所有子 Agent 完成后，由 `tech-lead` 将结果合并落盘到 delivery-plan.md。

### 并行调用（parallel）

**触发条件**：任务涉及架构设计、接口设计或全栈改动时（由 tech-lead 在对话中判断）

| 子 Agent | agentName | 职责范围 |
|-----------|-----------|----------|
| architect | `architect` | 系统边界、组件拆分、数据流、接口约定、技术选型、风险与约束 |
| frontend-engineer | `frontend-engineer` | 关键页面结构、组件划分、设计 token、响应式基线、A11y 要求（任务涉及前端改动时） |
| backend-engineer | `backend-engineer` | 接口契约、数据模型、核心业务逻辑、异常路径 |
| ui-ux-designer | `ui-ux-designer` | 页面结构、交互流、设计 token、响应式策略、体验风险清单（任务涉及 UI 变更时） |

**Prompt 模板**（调用时将 `{task_context}` 替换为当前任务背景，`{role_name}` 替换为对应角色名，`{scope}` 替换为职责范围）：

> 你是 Team Skills Platform 中的 {role_name}。基于以下任务背景，产出 {scope} 方面的设计成果：
>
> {task_context}
>
> 要求：结论清晰，标注风险与约束，产出可落盘的格式。

**汇总**：所有子 Agent 完成后，由 `tech-lead` 将结果合并落盘到 delivery-plan.md、arch-design.md。
