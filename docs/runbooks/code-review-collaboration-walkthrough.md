---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Code Review 协作演练

本文演示一轮完整的 code review 协作：发起评审、处理问题、回收结论、再次确认。

## 1. 场景

- 功能已基本完成
- 希望在 QA 前先暴露工程质量问题
- 需要把 review 结论结构化回收到主链

## 2. 推荐链路

1. `/code-review`
2. `/team-execute` 或直接修复
3. `/code-review` 二次确认
4. `/handoff`
5. `/team-review`

## 3. 第一轮 review 输入示例

```text
/code-review
目标：评审审批记录查询接口与前端列表页改动
重点关注：权限校验、错误处理、空态与响应式
```

## 4. 第一轮输出如何处理

- Critical：立即修
- High：通常不应带入 QA
- Medium：能修则修，至少记录
- Low：作为后续优化

## 5. 二次确认示例

```text
/code-review
基于上一轮评审意见，已修复权限校验和空态问题。
请确认当前是否还存在阻塞 QA 的问题。
```

## 6. 最终回落到 handoff

handoff 中至少要写：

- review 发现了什么
- 已修复什么
- 还剩什么已知问题
- QA 需要重点验证什么

## 7. 常见错误

- review 结果没有进入 handoff
- 第二轮 review 只是重复跑，没有说明修了什么
- 把 review 当成 QA 的替代

与通用说明配合阅读：[claude-code-review-workflow.md](claude-code-review-workflow.md)
