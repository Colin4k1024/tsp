---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 系统架构设计与 ADR 演练

本文演示一个中等以上复杂度任务如何完成架构设计、ADR 决策和跨角色交接。重点不是细节实现，而是把设计结论变成可执行输入。

## 1. 场景

- 任务：审批中心要接入新的数据权限判断链路
- 涉及：接口边界、权限判定、跨服务依赖、兼容性
- 目标：在实施前把关键决策写清楚

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/plan` 或 `/multi-backend`
4. `/handoff`
5. `/team-review`

## 3. 关键输出

- 方案摘要
- ADR 或等价决策记录
- 服务边界与关键依赖
- 接口与兼容性约束
- 实施阶段需要特别关注的风险

如果需要结构化 ADR，直接按 [artifact-standards.md](../../rules/artifact-standards.md) 中的 ADR 最小字段组织：决策信息、背景与约束、备选方案、决策结果、企业内控补充、后续动作。

## 4. 合格结果的检查点

- 研发能基于方案直接拆实施任务
- QA 知道应验证哪些关键边界
- Tech Lead 能看出是否需要升级风险等级

## 5. 常见错误

- 只描述理想状态，不写迁移路径
- 把实现细节和架构决策混在一起
- 方案里没有明确舍弃什么

与这些文档配合阅读：[architect-daily-operations.md](architect-daily-operations.md)、[team-command-output-contracts.md](team-command-output-contracts.md)
