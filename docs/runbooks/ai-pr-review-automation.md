# AI PR Review 自动化手册

本手册承接 `qodo-ai/pr-agent` 的工程实践，用于说明如何把 AI 辅助 PR review 作为补充流程接入仓库。由于上游采用 `AGPL-3.0`，当前只作为 `reference-only-runbook` 使用，不直接并入正式 skill 或脚本层。

## 适用场景

- 团队希望在 PR 阶段提前获得变更摘要、潜在风险和 review 提示。
- 仓库改动较大、review 负担重，希望先用 AI 做首轮筛查。
- 希望把 AI review 作为 reviewer 的辅助输入，而不是替代人工判断。

## 不适用场景

- 团队尚未建立基本的 PR 描述、验证命令和 review 责任链。
- 代码存在大量历史噪音，AI 输出容易被低价值问题淹没。
- 期望用 AI 直接代替 reviewer、QA 或放行角色。

## 推荐落地方式

1. 先把 PR 基础信息补齐：目标、范围、风险、验证命令、文档影响。
2. 第一阶段只启用摘要、风险提示、重点 review 建议，不自动发评论到所有 PR。
3. 先在少量仓库或少量分支试点，观察噪音、误报和 reviewer 接受度。
4. 把 AI review 的角色定义清楚：它负责“发现候选问题和总结上下文”，不负责最终结论。
5. 若仓库同时启用 reviewdog，一定区分：
   - reviewdog 负责规则型问题和门禁注释
   - AI PR review 负责变更摘要、设计风险和人工 review 提示

## 最小接入模型

- `input layer`：PR 标题、描述、diff、验证信息
- `analysis layer`：AI 生成变更摘要、潜在风险、建议关注点
- `decision layer`：reviewer、`/code-review`、`/team-review` 决定哪些问题成立、哪些需要阻塞

先把这三层职责划清，再考虑扩大自动化范围。

## 反模式

- 没有清晰 PR 描述，却指望 AI 自动读懂全部上下文。
- 让 AI 直接替代 reviewer 结论，导致责任边界失真。
- 一上来就自动评论所有 PR，造成通知轰炸和低信号反馈。
- 将 AI review、reviewdog、CI checks 混成一层，最后没人知道哪类问题该由谁处理。

## 输出回落

- PR 阶段：把 AI 生成的变更摘要、重点风险和建议关注点回写到 PR 描述或 review 结论。
- 团队协作：在 `/code-review` 或 `/team-review` 中明确哪些发现来自 AI 辅助，哪些是人工确认的问题。
- 发布前：AI review 不能直接形成放行结论；若某项风险持续成立，仍需回写到 `/team-release` 或 handoff。

## 许可证边界

- 当前仅吸收方法论与接入策略，不复制或内嵌上游实现。
- 若后续需要更深接入，必须重新评估 `AGPL-3.0` 对仓库分发与插件安装面的影响。

## 参考来源

- [qodo-ai/pr-agent](https://github.com/qodo-ai/pr-agent)
- [reviewdog-pr-gates.md](reviewdog-pr-gates.md)
