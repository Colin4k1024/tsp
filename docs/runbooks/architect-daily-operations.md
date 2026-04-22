---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Architect 日常操作手册

本文面向架构师，说明系统边界、接口契约、技术方案与风险控制如何在 Team Skills Platform 下落地。

如果你想先看平台当前有哪些公开命令和能力映射，先读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。

## 1. 你的默认职责

- 明确系统边界、依赖关系和关键约束
- 产出 ADR、接口契约、数据模型或实施边界说明
- 识别中长期技术风险和短期实施风险
- 把设计结论结构化交接给研发、QA 和 tech-lead

## 2. 开始设计前必须确认什么

- 需求目标、范围外事项和成功标准是否清楚
- 当前任务是接口演进、系统重构还是跨服务协作
- 哪些约束不可打破，例如兼容性、稳定性、权限边界
- 哪些风险需要在 plan 阶段提前暴露

## 3. 设计时的固定检查

- 边界是否单一清楚
- 契约是否可消费、可验证
- 兼容性和迁移路径是否说明
- 非功能约束是否写明
- 实施方是否能据此落地

## 4. 应交付什么

- 方案摘要
- ADR 或替代决策记录
- 接口或数据契约
- 实施建议与风险提醒
- 需要 handoff 的重点事项

如果需要成文化 ADR，直接按 [artifact-standards.md](../../rules/artifact-standards.md) 中的 ADR 最小字段组织：决策信息、背景与约束、备选方案、决策结果、企业内控补充、后续动作。

## 5. 常用命令组合

- `/team-intake`：确认目标、范围和约束
- `/team-plan`：把设计任务放入主链拆解
- `/multi-backend` 或 `/plan`：做专项方案分析
- `/tdd`：在高返工风险任务里提前锁边界行为和验证口径
- `/handoff`：把方案交给研发与 QA
- `/team-review`：确认方案落地后的剩余风险

## 6. 常见错误

- 设计只停留在概念层，没有可执行边界
- 契约写了 happy path，没有错误和兼容策略
- 方案已明确适合测试先行，却没有把 `/tdd` 约束前置到实现阶段
- 复杂任务没有留下决策记录

建议与这些文档配合阅读：[api-design-evolution-walkthrough.md](api-design-evolution-walkthrough.md)、[system-architecture-design-walkthrough.md](system-architecture-design-walkthrough.md)、[architect-design-conversation-example.md](architect-design-conversation-example.md)
