# Claude Scenario Playbook

这份示例集不解释概念，只回答一个问题：在 Claude 里碰到不同任务时，第一段话到底该怎么发。

## 快速选择

| 任务 | 推荐起手 | 何时用 |
|------|----------|--------|
| 新功能完整主链 | `/team-intake` -> `/team-plan` | 需求、角色、风险都还没锁定 |
| 小缺陷短链路 | `/code-review` -> `/handoff` -> `/team-review` | 范围清楚、无需复杂拆解 |
| 测试先行开发 | `/team-plan` -> `/tdd` -> `/team-execute` | 想先锁测试和成功标准，再进入实现 |
| 后端接口 + overlay 判断 | `/team-intake` -> `/team-plan` | 需要判断是否依赖自定义 overlay 扩展 |
| 发布收口 | `/team-release` | 已有实现、自测和 QA 结论 |
| specialist 结果回主链 | `/handoff` | 已经跑过 `/plan`、`/code-review`、`/verify` 等专项分析 |
| 平台能力自检 | `/harness-audit` | 新增了命令、skills、hooks 或文档后，想看还有哪些入口未同步 |
| 自定义 overlay 扩展专项 | 看 [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md) | 需要叠加自定义 overlay |

## 场景 1：新功能完整主链

```text
请按 Team Skills Platform 工作模型处理当前任务。
先以 tech-lead 视角执行 /team-intake，输出目标、范围外事项、参与角色、主要风险和下一步建议。

任务背景：
- 目标：新增订单审批记录查询能力
- 范围：接口、筛选条件、测试计划、最终 handoff
- 不做：审批流程定义改造、历史数据回填
- 约束：需要判断是否依赖 custom overlay 扩展
```

然后继续：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出角色职责、依赖、handoff 节点、风险和技能装配清单。
如果 custom overlay 不安装，也请明确写出未启用原因。
```

## 场景 2：小缺陷短链路

```text
这是一个边界清晰的小修复。
请先判断是否可以走短链路；如果可以，按 /code-review -> /handoff -> /team-review 的顺序给出建议。
如果不适合短链路，请说明必须补 /team-plan 的原因。

任务：修复订阅页在 iPad 横屏下的布局溢出。
范围：页面布局、响应式回归、UI 自测证据。
不做：接口改造。
```

## 场景 3：后端接口 + overlay 判断

```text
请先以 /team-intake 方式处理当前后端任务，并重点判断是否命中 custom overlay 候选项。
如果涉及私有流程、权限中心或公司专属平台，请给出候选项；如果不启用，也要说明原因。

任务：新增订单审批状态流转接口与权限校验。
范围：接口、权限、测试计划。
不做：前端页面。
```

接着补一句：

```text
基于当前结果继续执行 /team-plan。
请特别写清 architect、backend-engineer、qa-engineer 的依赖顺序，以及哪些字段必须进入最终 /handoff。
```

## 场景 4：测试先行开发

```text
基于当前任务先执行 /team-plan，拆出可测试的外部行为、边界态和最小交付物。
然后继续执行 /tdd，给出 red-green-refactor 路径，并整理成可直接进入 /team-execute 的动作清单。

任务：新增订单审批记录查询接口与列表页。
范围：接口、页面、测试计划。
不做：发布脚本重构。
```

## 场景 5：平台能力自检

```text
/harness-audit
目标：检查当前平台的命令、skills、hooks、rules、文档和集成深度。
输出：Overall Score、Dimension Scores、Top Actions、Recommendations。
请再补一段：哪些结论需要回到 README、quick start、examples 或 team-skills-usage。
```

适用场景：你刚新增了一批命令、skills、hooks、runbook 或示例，想快速看“事实变了但说明没跟上”的部分。

## 场景 6：发布收口

```text
基于当前实现、自测和 QA 结论，执行 /team-release。
请输出发布方案、观察窗口、回滚条件、责任链，并补充是否需要私有发布或观测扩展。
如果这些能力只是私有 runbook 补充，而不是正式 overlay 依赖，也请写清楚。
```

## 场景 7：specialist 结果回主链

```text
请不要停在专项结论。
把上面的 /plan、/code-review 或 /verify 结果整理成可直接进入 /handoff 的格式。
输出必须包含：已确认事项、未确认事项、风险、下一角色动作、是否需要补 /team-review 或 /team-release。
```

## 使用建议

- 先写目标、范围、不做、约束，再发命令。
- Claude 里 specialist 更适合做专项分析，不适合直接代替主链收口。
- 如果你想知道 `/tdd`、`/harness-audit` 背后分别搭哪些能力，先看 [../docs/runbooks/command-and-capability-matrix.md](../docs/runbooks/command-and-capability-matrix.md)。
- 如果你需要更短的命令骨架，回看 [../docs/runbooks/team-commands-quick-prompts.md](../docs/runbooks/team-commands-quick-prompts.md)。
- 如果你想看完整成品对话，继续看 [../docs/runbooks/claude-end-to-end-conversation-example.md](../docs/runbooks/claude-end-to-end-conversation-example.md)。
