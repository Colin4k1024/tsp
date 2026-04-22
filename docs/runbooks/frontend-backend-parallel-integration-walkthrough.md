---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 前后端并行开发与联调演练

本文演示前后端在同一需求上并行推进时，如何通过契约、Mock、同步点和 handoff 避免互相阻塞。

## 1. 场景

- 任务：订单详情页新增审批轨迹区域
- 前端和后端需同时开工
- 接口契约已初步确定，但实现节奏不同

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/team-execute`
4. `/handoff`
5. `/verify`
6. `/team-review`

## 3. 并行阶段的关键动作

- 先锁定接口契约和字段语义
- 前端基于 Mock 或固定响应先开发
- 后端明确真实接口的交付时间点
- 中途变更字段时，必须立即回收到 handoff

## 4. 联调阶段的关键输出

- 前后端字段映射结果
- 异常路径与空态验证结果
- 已知差异与剩余阻塞项
- QA 应重点回归的链路

## 5. 常见错误

- 接口契约还没稳定就并行开工
- 字段含义变化后只在口头同步
- 联调完成后没有回写 handoff

与这些文档配合阅读：[api-design-evolution-walkthrough.md](api-design-evolution-walkthrough.md)、[api-mocking-strategy-and-lifecycle-guide.md](api-mocking-strategy-and-lifecycle-guide.md)、[frontend-backend-integration-acceptance-checklist.md](frontend-backend-integration-acceptance-checklist.md)、[handoff-filling-guide-with-examples.md](handoff-filling-guide-with-examples.md)
