# Example Codex Conversation Script

这份脚本适合第一次在 Codex 里跑“主链 + 并行分析 + 收口”时直接复制。

## 场景 A：前端并行修复

第一句：

```text
/team-intake
目标：修复控制台首页在 iPad 横屏下的布局溢出
范围：页面布局、响应式回归、UI 验证清单
不做：接口与数据结构改造
约束：必须遵守 frontend-quality-gates
```

第二句：

```text
/multi-frontend
基于当前 intake 结果，从实现、UI/UX、QA 风险三个视角拆解工作。
要求指出哪些结论必须进入最终 handoff。
```

第三句：

```text
请把上面的多 agent 结论整理成一次正式 /handoff。
不要重复每个 agent 的原话，只保留已确认结论、风险与依赖、下一角色动作清单。
```

第四句：

```text
/team-execute
按当前结论执行前端修复。
输出改动摘要、自测结论、待 QA 关注点，以及需要进入 review 的内容。
```

第五句：

```text
/team-review
基于当前 handoff 和 execute 结果，输出评审结论、阻塞项、放行建议和残余风险。
```

## 场景 B：复杂后端接口

第一句：

```text
/team-intake
目标：新增订单审批状态流转接口
范围：接口、权限校验、测试计划
不做：前端页面
约束：如果命中私有企业扩展场景，先判断是否需要 enterprise overlay
```

第二句：

```text
/team-plan
基于 intake 结果，拆解 architect、backend-engineer、qa-engineer 的职责，给出依赖和风险。
```

第三句：

```text
/multi-backend
基于当前 intake 或 plan，把接口实现、权限边界、测试策略三部分并行分析。
如果命中 private enterprise overlay 或私有 runbook 扩展，请明确说明是正式启用、仅保留候选，还是按场景使用。
最终请整理出可直接回写 /team-plan 的结果。
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
目标：新增订单审批状态流转接口
现有缺口：还没有测试先行路径和回归边界
成功标准：给出 red-green-refactor 步骤，并整理成可直接回到 /team-execute 的动作清单
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

- 并行前先做 intake，不要直接开跑多个 specialist
- 并行后第一件事永远是收口到 handoff
- 如果你想知道 `/tdd`、`/harness-audit` 分别适合什么任务，先看 [../docs/runbooks/specialist-commands-playbook.md](../docs/runbooks/specialist-commands-playbook.md)
- 如果任务已经落到私有企业扩展场景，先看 [../docs/runbooks/enterprise-overlay.md](../docs/runbooks/enterprise-overlay.md) 和 [../docs/runbooks/enterprise-extension-quick-start.md](../docs/runbooks/enterprise-extension-quick-start.md)
- 如果你想看更细的并行表达，继续看 [../docs/runbooks/codex-parallel-prompt-recipes.md](../docs/runbooks/codex-parallel-prompt-recipes.md)
- 如果你想看完整成品对话，继续看 [../docs/runbooks/codex-end-to-end-conversation-example.md](../docs/runbooks/codex-end-to-end-conversation-example.md)
