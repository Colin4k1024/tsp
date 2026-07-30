---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 跨角色问题分诊演练

本文演示 QA、前端、后端、架构师和 Tech Lead 在问题归因不明确时，如何快速分诊、分流和升级，而不是互相等待或反复甩锅。

## 1. 场景

- QA 发现审批列表在某些权限组合下返回异常
- 前端怀疑字段缺失，后端怀疑前端组装逻辑有误
- 需要快速确认是契约、实现还是环境问题

## 2. 推荐链路

1. `/team-execute`
2. `/verify`
3. `/handoff`
4. `/team-review`

必要时由 tech-lead 重新拉回 `/team-intake` 或 `/team-plan` 收口。

## 3. 分诊时的关键输出

- 问题现象和复现条件
- 初步归类：前端、后端、契约、环境或待确认
- 当前责任角色和下一步动作
- 是否阻塞当前里程碑

## 4. 什么时候要升级

- 连续两轮定位后仍无明确归因
- 问题跨多个角色边界
- 风险会影响上线或灰度计划

## 5. 常见错误

- 直接争论谁负责，而不先固化现象
- 问题在多个渠道讨论，没有统一事实源
- 分诊完没有生成可执行的下一步动作

与这些文档配合阅读：[bug-fix-complete-walkthrough.md](bug-fix-complete-walkthrough.md)、[team-command-output-contracts.md](team-command-output-contracts.md)
