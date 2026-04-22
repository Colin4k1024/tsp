---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Team Plan 完整示例

本文对标 [team-command-output-contracts.md](team-command-output-contracts.md) 和 [../../commands/team-plan.md](../../commands/team-plan.md)，给出可直接参考的完整 plan 输出示例。

## 1. 场景

延续 [team-intake-example.md](team-intake-example.md) 的导出需求。

## 2. 输入示例

```text
/team-plan
基于导出能力 intake 结果，拆解角色职责、风险、依赖与技能装配。
```

## 3. 完整输出示例

```text
交付计划
- 阶段 1：锁定导出接口契约与权限策略
- 阶段 2：前后端并行实现与自测
- 阶段 3：联调、验证与发布准备

角色分工
- product-manager：补齐导出字段范围和验收标准
- architect：确认权限边界与接口契约
- backend-engineer：实现导出接口与权限判断
- frontend-engineer：实现导出按钮、状态和错误提示
- qa-engineer：设计权限组合与导出内容验证用例

风险与依赖清单
- 风险：权限规则不清会拖慢接口设计
- 风险：导出字段可能涉及敏感数据
- 依赖：私有权限中心 是否启用需在本阶段锁定

是否需要 ADR
- 本次不需要完整 ADR，但需保留权限策略决策记录

技能装配清单
- shared：不单独挂载方案 skill，方案决策直接回落到 architect / tech-lead 主链
- ecc：verification，按场景启用，触发原因是联调和验收，主责角色 qa-engineer
- enterprise：私有权限中心，按场景启用，触发原因是导出权限边界，主责角色 architect

前端交付物与检查点
- 导出按钮交互说明
- loading / 成功 / 失败态
- 桌面端和 iPad 横屏验证证据
```

## 4. 常见错误

- 只有任务拆分，没有依赖和风险
- custom overlay启用结果没写清楚
- 前端检查点没有进入计划输出
