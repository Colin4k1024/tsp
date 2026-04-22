---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# API 设计与演进演练

本文演示接口从设计、联调到兼容性验证的完整链路，适用于前后端协作和跨服务接口调整。

## 1. 场景

- 订单查询接口新增状态聚合字段
- 前端需要新字段，旧调用方不能被破坏
- 需要补契约说明和联调验证

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/multi-backend`
4. `/team-execute`
5. `/code-review`
6. `/verify`
7. `/handoff`

## 3. 关键输出

- 接口变更说明
- 兼容性策略
- 联调结果
- 回滚与降级说明

## 4. 常见错误

- 只说新增字段，不说兼容性
- 后端改完才通知前端
- 没有明确哪些调用方需要回归

与后端角色说明配合阅读：[backend-engineer-daily-operations.md](backend-engineer-daily-operations.md)
