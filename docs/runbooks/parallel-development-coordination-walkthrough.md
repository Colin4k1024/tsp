---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 并行研发协调演练

本文演示一个需求由多个角色并行推进时，如何管理依赖、同步点和阶段性风险，避免各自推进后在末端集中碰撞。

## 1. 场景

- 任务：审批中心新增筛选、导出和权限限制
- 前端、后端、QA、架构师都需并行参与
- 风险在于依赖和边界很容易中途漂移

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/team-execute`
4. `/handoff`
5. `/team-review`

## 3. 关键协调点

- 哪些事项必须先定，再并行开工
- 哪些事项允许局部占位或 Mock
- 每个阶段的同步节点和责任人
- 哪些偏差必须升级给 tech-lead

## 4. 关键输出

- 依赖顺序和里程碑
- 阶段性 handoff 清单
- 已知阻塞和替代方案
- 进入 QA 前的最小完备条件

## 5. 常见错误

- 只做任务分配，不做同步节点设计
- 出现偏差后继续各自推进
- QA 最后才第一次看到全局状态

与这些文档配合阅读：[project-manager-daily-operations.md](project-manager-daily-operations.md)、[tech-lead-daily-operations.md](tech-lead-daily-operations.md)
