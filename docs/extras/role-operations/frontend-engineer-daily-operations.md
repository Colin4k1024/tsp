---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Frontend Engineer 日常操作手册

本文面向前端工程师，说明在 Team Skills Platform 下，页面、交互和联调工作应该怎样在主链里落地。

如果你想先看公开命令、UI 相关 specialist 和 runtime 的全景关系，先读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。

## 1. 你的默认职责

- 实现页面、表单、交互与状态流
- 产出前端自测结果
- 补齐响应式、A11y、性能和 UI 证据
- 把前端视角的风险交接给 QA 和 tech-lead

## 2. 开始实现前必须确认什么

- 页面范围和范围外事项
- 接口契约是否已清楚
- 设计约束和交互状态是否明确
- 是否需要 `ui-review-checklist`

## 3. 页面实现的固定检查

- 断点策略
- 空态与错误态
- 键盘可达性
- 异步 loading 状态
- 视觉回归风险

## 4. 进入 QA 前应交付什么

- 代码变更摘要
- 自测范围
- 响应式和 UI 证据
- 已知限制与剩余风险

## 5. 常用命令组合

- `/team-intake`：确认目标与范围
- `/team-plan`：拆页面和联调任务
- `/tdd`：先锁交互边界、回归点和成功标准
- `/multi-frontend`：做专项拆解
- `/team-execute`：汇总实现和自测
- `/handoff`：交给 QA 或 tech-lead

## 6. 常见错误

- 只改 happy path，不补空态和错误态
- 进入 QA 前没有任何自测证据
- 明明适合先用 `/tdd` 锁交互和回归口径，却直接开始实现
- 页面联调后才发现接口字段理解不一致

前端专项场景可继续看 [../../examples/saas-nextjs-CLAUDE.md](../../examples/saas-nextjs-CLAUDE.md)。
