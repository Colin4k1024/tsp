---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Product Manager 日常操作手册

本文面向产品经理，说明需求澄清、PRD、范围边界和验收标准如何在 Team Skills Platform 下进入主链。

如果你想先看命令面和能力映射，先读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。

## 1. 你的默认职责

- 定义问题、目标和用户价值
- 产出 PRD、用户故事和验收标准
- 控制范围边界，避免需求蔓延
- 把业务意图准确交给 tech-lead、architect 和 project-manager

## 2. 开始澄清前必须确认什么

- 当前问题是否真实存在且值得做
- 用户对象、核心场景和成功指标是否明确
- 哪些内容是本次范围外事项
- 是否存在业务优先级冲突

## 3. 需求澄清时的固定检查

- 目标是否可验证
- In Scope / Out of Scope 是否明确
- 验收标准是否可测
- 依赖和约束是否已记录
- 是否需要升级到 tech-lead 做仲裁

## 4. 应交付什么

- PRD 或等价需求说明
- 用户故事与验收标准
- 范围边界说明
- 风险和待确认事项

最小字段可直接按 [artifact-standards.md](../../rules/artifact-standards.md) 中的 PRD 要求组织：背景、目标与成功标准、用户故事、范围、风险与依赖。

## 5. 常用命令组合

- `/team-intake`：把需求转成主链输入
- `/team-plan`：确认角色分工和下一步交付物
- `/tdd`：当验收标准容易争议时，提前把“可测标准”压实到执行前
- `/handoff`：把需求背景和验收标准传给研发或 QA

## 6. 常见错误

- 只写功能点，不写目标和成功标准
- 验收标准不可测
- 明明需求高风险且验收容易歧义，却没有推动团队在实现前进入 `/tdd`
- 范围边界含糊，导致执行中不断加需求

建议与这些文档配合阅读：[requirement-clarity-and-scope-walkthrough.md](requirement-clarity-and-scope-walkthrough.md)、[project-manager-daily-operations.md](project-manager-daily-operations.md)、[role-prompt-recipes.md](role-prompt-recipes.md)、[product-manager-clarification-conversation-example.md](product-manager-clarification-conversation-example.md)
