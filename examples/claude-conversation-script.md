# Example Claude Conversation Script

这份脚本适合第一次在 Claude 里跑 Team Skills Platform 主链时直接复制。它不是规范说明，而是一份可以边改边用的会话脚本。

## 场景 A：后端接口需求

第一句：

```text
请按 Team Skills Platform 工作模型处理当前任务。
先以 tech-lead 视角执行 /team-intake，输出目标、范围外事项、参与角色、主要风险和下一步建议。

任务背景：
- 目标：新增订单审批状态查询接口
- 范围：接口、权限校验、测试计划
- 不做：前端页面
- 约束：如果命中私有流程、权限或其他企业扩展场景，按 `enterprise-overlay-scenario-playbook.md` 的写法明确判断
```

第二句：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出角色职责、依赖、handoff 节点、风险和技能装配清单。
如果命中 custom overlay 或兼容 runbook，也请明确写出是正式启用、仅保留候选，还是按场景使用。
```

第三句：

```text
/team-execute
按当前 plan 执行 backend-engineer 的实现和自测。
输出代码变更摘要、自测结果、待确认事项，以及需要进入 handoff 的信息。
```

第四句：

```text
/handoff
请把当前阶段结论整理成结构化交接，供 QA 继续处理。
```

第五句：

```text
/team-review
基于当前 handoff 结果，输出测试结论、阻塞项、放行建议和残余风险。
```

## 场景 B：前端小缺陷

第一句：

```text
请按 Team Skills Platform 处理这个前端问题。
先执行 /team-intake，并明确输出是否命中 frontend-quality-gates、响应式验证和 ui-review-checklist。

任务：修复订阅页在 iPad 横屏下的布局溢出。
范围：页面布局、响应式回归、UI 自测证据。
不做：接口改造。
```

第二句：

```text
这是一个边界清晰的小修复。
请先判断是否可以走短链路；如果可以，按 /code-review -> /handoff -> /team-review 的顺序给出建议。
如果不适合短链路，请说明必须补 /team-plan 的原因。
```

## 场景 C：测试先行开发

第一句：

```text
/team-plan
基于当前需求拆解实现任务，并给出适合进入 /tdd 的最小上下文。
```

第二句：

```text
/tdd
目标：新增订单审批记录查询能力
现有缺口：还没有测试和回归边界
成功标准：请先给出 red-green-refactor 路径，并整理为可直接进入 /team-execute 的动作清单。
```

## 场景 D：平台能力自检

第一句：

```text
/harness-audit
目标：检查当前平台的命令、skills、hooks、rules、文档和集成深度。
输出：Overall Score、Dimension Scores、Top Actions、Recommendations。
请再补一段：哪些结论需要回到 README、quick start、examples 或 team-skills-usage。
```

## 使用建议

- 先改目标、范围、不做和约束，再发给模型
- specialist 出来后，补一句“整理成可进入 /handoff 的格式”
- 如果你想知道 `/tdd`、`/harness-audit` 分别适合什么任务，先看 [../docs/runbooks/specialist-commands-playbook.md](../docs/runbooks/specialist-commands-playbook.md)
- 如果任务命中私有流程、权限、发布或观测扩展，不要在这里继续堆细节，直接跳到 [enterprise-overlay-scenario-playbook.md](enterprise-overlay-scenario-playbook.md) 和 [enterprise-overlay-output-playbook.md](enterprise-overlay-output-playbook.md)
- 如果你更想看自然语言模板，继续看 [../docs/runbooks/claude-conversation-prompt-recipes.md](../docs/runbooks/claude-conversation-prompt-recipes.md)
- 如果你想看完整成品对话，继续看 [../docs/runbooks/claude-end-to-end-conversation-example.md](../docs/runbooks/claude-end-to-end-conversation-example.md)
