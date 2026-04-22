---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 前后端联调与验收清单

本文面向前端、后端和 QA，提供一份进入 QA 前后的联调验收清单，重点解决字段理解差异、错误码不一致和真实接口切换后的回归遗漏。

## 1. 联调前检查

- 接口契约已可读且版本明确
- Mock 覆盖范围和缺口已说明
- 权限、分页、空态和错误态规则已对齐
- 调试环境与日志入口可用

## 2. 联调中检查

- 字段名、空值语义、枚举值是否一致
- 错误码与错误提示是否匹配
- 慢请求、超时、重试与重复点击行为是否一致
- 前端展示逻辑与后端权限逻辑是否一致

## 3. 三色记录法

- 绿：完全匹配，可进入回归
- 黄：存在已知差异，但本次可接受
- 红：存在阻塞，必须回到 execute 或 plan

## 4. 进入 QA 前应产出什么

- 联调结果摘要
- 已知差异列表
- 重点回归路径
- 需要更新的契约或文档

## 5. 常见错误

- 联调只测 happy path
- 差异停留在聊天记录里，没有进入 handoff
- QA 接手时不知道哪些差异是已知的

与这些文档配合阅读：[frontend-backend-parallel-integration-walkthrough.md](frontend-backend-parallel-integration-walkthrough.md)、[team-review-example.md](team-review-example.md)
