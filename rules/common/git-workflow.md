# Common Git Workflow

## 提交原则

- 提交要围绕单一意图组织，标题能直接说明“做了什么、为什么”。
- 先有可验证结果，再提交；不要把明显未完成的半状态混进主提交。
- 当改动影响文档、规则、命令或 skills 时，一并更新相关入口。

## Review 与 PR

- PR 描述应包含目标、风险、验证命令和文档影响。
- reviewer 优先指出行为回归、风险和缺测，不围绕风格争吵。
- 若 specialist 给出建议，最终决策仍由主责角色和 `tech-lead` 收口。
- 需要 worktree 并行隔离、PR 收口或分支清理时，参考 [git-pr-workflow.md](../../docs/runbooks/git-pr-workflow.md)。
- 若仓库希望把依赖升级从手工处理转成持续发现、分批 triage 和可控自动化，参考 [dependency-update-automation.md](../../docs/runbooks/dependency-update-automation.md)。
