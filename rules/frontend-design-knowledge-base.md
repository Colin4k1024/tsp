# Frontend Design Knowledge Base

## 用途

- 作为公司级前端设计知识库索引，统一连接共享 Skill、规则、模板和专题 runbook。
- 帮助 `tech-lead`、`frontend-engineer`、`qa-engineer` 在同一套词汇和标准下协作。

## 共享 Skill

- [frontend-engineering](../skills/frontend-engineering/SKILL.md)
- [frontend-ui-ux-system](../skills/frontend-ui-ux-system/SKILL.md)

## 参考资料

- [React/Next 基线](../skills/frontend-engineering/references/react-next-baseline.md)
- [组件模式](../skills/frontend-engineering/references/component-patterns.md)
- [工程质量检查表](../skills/frontend-engineering/references/quality-checklist.md)
- [产品类型与风格映射](../skills/frontend-ui-ux-system/references/product-style-map.md)
- [设计 Token 体系](../skills/frontend-ui-ux-system/references/design-tokens.md)
- [交互、无障碍与反馈](../skills/frontend-ui-ux-system/references/interaction-accessibility.md)
- [交付前清单](../skills/frontend-ui-ux-system/references/delivery-checklist.md)
- [DESIGN.md Token 字段映射](../skills/frontend-ui-ux-system/references/design-md-integration.md)

## 模板

- [design-system-brief.md](../templates/design-system-brief.md)
- [ui-implementation-plan.md](../templates/ui-implementation-plan.md)
- [ui-review-checklist.md](../templates/ui-review-checklist.md)
- [DESIGN.md 主模板](../templates/DESIGN.md)

## 使用建议

1. `tech-lead` 在 intake 和 plan 阶段先用本索引确定需要哪些前端资产。
2. `frontend-engineer` 实施前优先阅读共享 Skill 和参考资料，而不是临时发明规则。
3. `qa-engineer` 评审时以门禁和清单为准，不只凭主观观感给结论。

## DESIGN.md 品牌参考库

- **官方仓库**：[awesome-design-md](https://github.com/VoltAgent/awesome-design-md)（69+ 品牌，持续更新）
- **在线预览**：[getdesign.md](https://getdesign.md/)
- **使用工作流**：[docs/runbooks/design-md-workflow.md](../docs/runbooks/design-md-workflow.md)
- **推荐命令**：`npx getdesign@latest add <brand>`（在项目根目录执行，生成 DESIGN.md）
- **企业管理类推荐**：`notion`（温暖极简）、`linear.app`（SaaS 超极简）、`hashicorp`（企业简洁）
