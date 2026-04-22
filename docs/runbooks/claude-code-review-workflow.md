---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Claude 代码评审工作流

本文聚焦 Claude 中的 `/code-review` 使用方式，目标不是解释命令存在本身，而是说明何时触发、如何输入、如何把结论回落到主链。

## 1. 何时触发 `/code-review`

- 代码已经初步完成，准备联调前
- 涉及接口、权限、数据库或前端质量门禁
- 有明显回归风险，希望在 QA 前先暴露问题

## 2. 推荐输入方式

好的输入应该包含：

- 本次改动的目标
- 涉及的关键风险点
- 希望重点关注的方面

示例：

```text
/code-review
目标：评审订单导出接口与前端触发改动
重点关注：权限校验、错误处理、前端空态和导出失败路径
```

## 3. 如何理解输出

优先按严重度看：

- Critical：必须先修
- High：通常不应带着进入 QA
- Medium：能修就修，至少要记录
- Low：作为优化建议

## 4. 如何回到主链

`/code-review` 的结果不要停留在本地结论，建议立刻补一句：

```text
请把上面的评审结论整理为可直接进入 /handoff 的格式。
```

这样可以直接把结论并入下一步交接。

## 5. 前端与后端的差异

- 前端更关注：响应式、A11y、状态切换、视觉回归
- 后端更关注：兼容性、幂等性、错误码、数据库与权限边界

## 6. 与 `/team-review` 的区别

- `/code-review` 更偏工程实现质量
- `/team-review` 更偏测试和放行结论

不要把 `/code-review` 当作 QA 的替代。

## 7. 常见错误

- 还没明确目标就跑 `/code-review`
- 评审结论没有回落到 handoff
- 只看建议，不处理严重问题

如果要看完整循环，继续看 [code-review-collaboration-walkthrough.md](code-review-collaboration-walkthrough.md)。
