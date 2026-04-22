---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 紧急修复发布演练

本文演示紧急问题如何快速判断、修复、验证和发布。重点是快，但不能把结构化验证和回滚准备全部省掉。

## 1. 场景

- 线上 bug 影响关键流程
- 需要快速修复并发布
- 同时要保留最基本的 review、验证和回滚准备

## 2. 推荐链路

1. `/team-intake`
2. `/team-execute`
3. `/code-review`
4. `/verify`
5. `/team-release`

是否进入完整 `/team-plan`，由问题复杂度决定。

## 3. intake 阶段的判断重点

- 影响范围
- 是否为真正 hotfix
- 是否需要回滚优先于修复

## 4. execute 阶段的要求

- 修复范围最小化
- 自测覆盖关键路径
- 记录回归风险

## 5. verify 阶段的要求

- 验证关键用户路径
- 验证是否引入新问题
- 明确观察指标

## 6. release 阶段的要求

- 上线步骤
- 回滚条件
- 观察窗口
- 监控指标

## 7. 常见错误

- 紧急修复就完全跳过 review
- 没有观察窗口和回滚条件
- 问题修复后没有复盘

与排障和 release 相关说明配合阅读：[troubleshooting.md](troubleshooting.md)
