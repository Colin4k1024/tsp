---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Backend Engineer 日常操作手册

本文面向后端工程师，说明在 Team Skills Platform 下，接口、权限、数据库和发布风险应如何在主链中表达。

如果你想先看命令与能力总表，先读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。

## 1. 你的默认职责

- 设计并实现接口和领域逻辑
- 处理权限、错误码、分页和异常路径
- 提供单测、集成测试或迁移脚本结果
- 把兼容性和发布风险清楚交接出去

## 2. 开始实现前必须确认什么

- 接口契约是否已明确
- 是否涉及数据库变更
- 是否涉及 private enterprise overlay，如 私有流程、权限集成
- 是否需要 architect 或 devops-engineer 提前介入

## 3. 实现时的固定检查

- 兼容性
- 错误处理
- 权限边界
- 性能与查询风险
- 回滚可行性

## 4. 进入 QA 前应交付什么

- 代码变更摘要
- 单测/集成测试结果
- 接口兼容性说明
- 数据迁移与回滚说明
- 已知限制与剩余风险

## 5. 常用命令组合

- `/team-intake`：识别目标和 overlay 候选项
- `/team-plan`：拆接口、数据和测试任务
- `/tdd`：先锁接口边界、测试和回归口径
- `/multi-backend`：做专项拆解
- `/team-execute`：汇总实现与验证
- `/code-review`：做实现质量审查
- `/verify`：补关键路径和兼容性证据
- `/handoff`：交给 QA 或 tech-lead

## 6. 常见错误

- 只交付代码，不交付兼容性说明
- 数据库改了，但没有迁移和回滚方案
- 明明适合先用 `/tdd` 锁定接口与测试边界，却直接写实现
- private enterprise overlay 已用到，却没有执行记录

后端专项场景可继续看 [../../examples/springboot-service-CLAUDE.md](../../examples/springboot-service-CLAUDE.md)。
