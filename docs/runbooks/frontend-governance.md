---
version: "0.1.0"
status: draft
created: 2026-03-27
updated: 2026-03-27
owner: 工程团队
---

# Frontend Governance Runbook

本文说明当前 Team Skills 平台如何承接 React/Next 优先的前端工程规范与 UI/UX 治理能力。

## 1. 何时启用前端能力包

- 需求包含页面、组件、交互、导航、样式、图表、表单或前端静态资源变更。
- `tech-lead` 在 `/team-intake` 或 `/team-plan` 已确认存在前端交付物。

## 2. 两层共享 Skill

| Skill | 作用 | 主用角色 |
|-------|------|----------|
| `frontend-engineering` | 统一组件结构、状态分层、语义化、可访问性与性能做法 | `frontend-engineer`、`architect` |
| `frontend-ui-ux-system` | 统一产品类型、视觉方向、设计 token、交互与体验门禁 | `tech-lead`、`frontend-engineer`、`qa-engineer` |

## 3. 推荐工作流

1. `tech-lead` 在 `/team-intake` 锁定目标端、产品类型、设计约束、响应式和 A11y/性能红线。
2. 需要新界面或较大 UI 变化时，先补 [design-system-brief.md](../../templates/design-system-brief.md)。
3. `frontend-engineer` 编写 [ui-implementation-plan.md](../../templates/ui-implementation-plan.md)，明确组件结构、状态流和交付风险。
4. 进入 QA 前，`frontend-engineer` 必须填写 [ui-review-checklist.md](../../templates/ui-review-checklist.md)。
5. 需要用真实浏览器做关键页面 / 发布前回归时，补用 [browser-smoke-testing](../../skills/browser-smoke-testing/SKILL.md) 明确 smoke 范围与证据。
6. `qa-engineer` 在 `/team-review` 依据 [frontend-quality-gates.md](../../rules/frontend-quality-gates.md) 给出结论。

## 4. 知识库结构

- 规则入口：[frontend-engineering-standards.md](../../rules/frontend-engineering-standards.md)、[frontend-ui-ux-standards.md](../../rules/frontend-ui-ux-standards.md)
- 门禁入口：[frontend-quality-gates.md](../../rules/frontend-quality-gates.md)
- 知识索引：[frontend-design-knowledge-base.md](../../rules/frontend-design-knowledge-base.md)
- 工程参考：[frontend-engineering](../../skills/frontend-engineering/SKILL.md)
- 浏览器验证：[browser-smoke-testing](../../skills/browser-smoke-testing/SKILL.md)
- 设计参考：[frontend-ui-ux-system](../../skills/frontend-ui-ux-system/SKILL.md)

## 5. 默认交付要求

- 任何前端变更都要说明主路径、边界态、异常态和已知风险。
- 任何设计 token 的新增或调整都要说明原因和适用范围。
- 任何前端上线都要有 smoke 范围、观察指标和回滚触发条件。
