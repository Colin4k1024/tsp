# Git / PR 收口工作流

本手册承接 `obra/superpowers` 中与 `using-git-worktrees`、`finishing-a-development-branch` 相关的工程实践。它用于规范分支隔离、PR 收口、验证证据和分支清理，不替代 [git-workflow.md](../../rules/common/git-workflow.md) 的基础规则。

## 适用场景

- 任务需要开独立分支提交、发起 PR、处理 review 再完成合并收口。
- 当前改动风险较高、并行任务较多，或需要用 worktree 把上下文隔离开。
- 团队希望把“写完代码”延伸到“PR 可审、可验、可清理”的完整闭环。

## 何时使用 worktree

优先考虑 `git worktree` 的场景：

- 同一仓库要并行推进两个以上任务。
- 当前主工作区已经有脏改动，不适合混进新任务。
- 需要在不打断现有上下文的前提下，开一个干净环境做修复或 review follow-up。

不必额外开 worktree 的场景：

- 单一任务、改动很小、当前工作区本来就是干净的。
- 只是补一两个 review comment，没有上下文污染风险。

## 默认做法

1. 先确认 base branch、任务边界、是否需要独立 worktree，再开始编码。
2. 若使用 worktree，保持“一任务一 worktree / 一分支”，不要让多个任务共享同一临时目录。
3. 提交按单一意图组织，保证每次提交都能说明“做了什么、为什么、怎么验证”。
4. 发 PR 前先补齐验证命令、风险、文档影响和回滚说明，不把这些信息留给 reviewer 反向追问。
5. 处理 review 时优先做增量修复和定向验证，避免把 unrelated cleanup 混进 follow-up。
6. 合并前确认 checks、review 状态和最终验证结果；合并后清理分支、临时 worktree 和过期上下文。

## PR 最小清单

- 目标：这次变更解决什么问题
- 范围：做了什么，明确没做什么
- 风险：可能影响哪些路径、模块或发布动作
- 验证：本地或 CI 跑了什么命令、覆盖了哪些关键路径
- 文档：是否同步了模板、规则、runbook、README 或交接说明

## 分支收口清单

1. 所有必要 review comment 已处理或显式记录暂不处理原因。
2. 最终验证结果与 PR 描述一致，没有“代码已变、描述没跟”。
3. 若使用 worktree，合并后清理对应目录，避免保留无主上下文。
4. 若变更影响发布、规则或知识入口，回写 `/handoff`、`/team-review` 或相关文档。

## 反模式

- 用一个分支混多个不相关任务。
- 为了“快一点”跳过本地验证，把失败风险留到 PR checks 或 reviewer 身上。
- review follow-up 顺手重构一大片，导致 reviewer 无法判断真正改了什么。
- worktree 创建了但不清理，后续没人知道哪个目录仍有效。

## 输出回落

- 开发与 review 阶段：回落到 PR 描述、`/handoff` 和 `/team-review` 的验证证据。
- 发布前：若 PR 收口影响上线判断，把最终分支状态、tag、验证结果回写到 `/team-release`。

## 参考来源

- [obra/superpowers](https://github.com/obra/superpowers)
- [rules/common/git-workflow.md](../../rules/common/git-workflow.md)
