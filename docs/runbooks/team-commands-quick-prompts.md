---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Team 命令快速提示

本文给出 `/team-*` 主链命令的最短输入模板和输出要点，适合第一次起手时直接复制改写。它不是完整规范，完整字段仍以 [team-command-output-contracts.md](team-command-output-contracts.md) 为准。

如果你还想配套使用 specialist 命令，继续看 [specialist-commands-playbook.md](specialist-commands-playbook.md)。

## 1. /team-intake

输入模板：

```text
/team-intake
目标：
范围：
不做：
约束：
输出：参与角色、风险、下一步命令建议
```

输出至少应包含：目标、范围外事项、参与角色、待确认项、是否命中 overlay 候选项。

## 2. /team-plan

输入模板：

```text
/team-plan
基于当前 intake 结果，拆角色职责、风险、依赖、handoff 节点和技能装配。
```

输出至少应包含：交付计划、角色分工、风险与依赖、技能装配清单。

## 3. /team-execute

输入模板：

```text
/team-execute
按当前 plan 执行实现。
请汇总改动结果、自测结论、交给 QA 的说明，以及领域扩展执行记录。
```

输出至少应包含：实现结果、自测结论、交给 QA 的说明、必要的 UI 或 company 执行记录。

## 4. /handoff

输入模板：

```text
/handoff
请把当前阶段结论整理成结构化交接，供下一角色继续处理。
```

输出至少应包含：已完成、未完成、风险、下一跳角色动作清单。

## 5. /team-review

输入模板：

```text
/team-review
基于当前实现说明、自测结果和验证结果，输出评审结论、阻塞项和放行建议。
```

输出至少应包含：评审结论、阻塞项、放行建议、残余风险。

## 6. /team-release

输入模板：

```text
/team-release
基于当前测试放行结果，整理发布方案、观察项、回滚条件和责任链。
```

输出至少应包含：发布方案、放行结论、观察项、回滚与监控动作。

## 7. 常见错误

- 只说“帮我做一下”，不写目标和范围
- 只写实现，不写风险与下一步
- 命中了 private enterprise overlay 或发布扩展，却没有进入主链输出

完整示例继续看：[team-intake-example.md](team-intake-example.md)、[team-plan-example.md](team-plan-example.md)、[team-execute-example.md](team-execute-example.md)、[team-handoff-example.md](team-handoff-example.md)、[team-review-example.md](team-review-example.md)、[team-release-example.md](team-release-example.md)

## 8. specialist 最短补充模板

### `/tdd`

```text
/tdd
目标：
现有缺口：
成功标准：
请先给出 red-green-refactor 路径，并整理为可直接进入 /team-execute 的动作清单。
```

### `/harness-audit`

```text
/harness-audit
目标：检查当前平台的命令、skills、hooks、rules、文档和集成深度。
输出：Overall Score、Dimension Scores、Top Actions、Recommendations。
请再补一段：哪些结论需要回到 README、quick start、examples 或 team-skills-usage。
```

### 主链 + specialist 组合

```text
基于当前 /team-plan 结果，先执行 /tdd。
完成后请不要停在专项结论，整理成可直接进入 /team-execute 的格式。
```

```text
在进入 /team-review 前，先执行 /harness-audit。
请把影响平台可用性的结论整理成后续文档或能力收敛动作。
```
