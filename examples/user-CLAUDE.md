# Example User CLAUDE.md

下面是一份适合放在用户目录的 `CLAUDE.md` 示例。目标不是把所有规则一次性塞进全局上下文，而是把你最常走的工作方式固定下来。

```md
# My Default Claude Workflow

默认把复杂任务按 Team Skills Platform 方式处理：

- 先用 `tech-lead` 明确目标、边界、风险和交付物
- 需要规划时优先走 `/team-intake` -> `/team-plan`
- 需要专项分析时使用 `/plan`、`/code-review`、`/build-fix`，但结论必须回到 `/handoff` 或 `/team-*`
- 前端任务默认补齐响应式、A11y、性能和 `ui-review-checklist`
- 如果涉及私有流程、权限中心或公司域扩展，明确说明是否需要启用 enterprise overlay；安装约定看 [../docs/runbooks/enterprise-overlay.md](../docs/runbooks/enterprise-overlay.md)

常用入口：

- 项目规划：`/team-intake`、`/team-plan`
- 开发执行：`/team-execute`、`/handoff`
- 质量校验：`/team-review`、`/code-review`、`/verify`

输出偏好：

- 先给结论，再给风险和下一步
- 不要跳过角色边界
- 小任务可走短链路，但要保留验证证据
```

推荐把用户级 `CLAUDE.md` 只用于声明偏好和默认工作流，把项目特有约束放到项目根目录的 `CLAUDE.md`。这样不同仓库不会互相污染。

如果你还没决定项目级该选哪个示例，先看 [INDEX.md](INDEX.md)。

首次可直接复制的对话模板：

```text
请按 Team Skills Platform 工作模型处理这个任务。
先以 tech-lead 视角执行 /team-intake，给出目标、范围外事项、风险和建议参与角色。
如果任务适合短链路，也请明确说明为什么不需要走完整主链。
```
