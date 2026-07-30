---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 前端重构演练

本文演示页面或组件重构任务如何拆解、验证和交接。重点不是新增功能，而是在不破坏现有体验的前提下改善结构。

## 1. 场景

- 重构控制台列表页的筛选区和表格结构
- 目标是提升可维护性和响应式一致性
- 不改变接口契约

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/multi-frontend`
4. `/team-execute`
5. `/code-review`
6. `/handoff`
7. `/team-review`

## 3. 关键输出

- 为什么要重构，而不是继续堆补丁
- 哪些行为保持不变
- UI、响应式和空态是否回归
- 哪些技术债仍然保留

## 4. 常见错误

- 把重构写成纯代码整理，不说明用户影响
- 缺少回归范围
- 引入样式变化却没有证据

与前端角色说明配合阅读：[frontend-engineer-daily-operations.md](frontend-engineer-daily-operations.md)
