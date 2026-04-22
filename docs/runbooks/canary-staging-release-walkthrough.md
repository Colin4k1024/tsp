---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 金丝雀灰度发布演练

本文演示一个正常版本如何通过 staging、灰度、全量三个阶段安全发布。重点是观察指标、放量条件和回退条件。

## 1. 场景

- 功能已完成，准备按计划发布
- 变更影响核心链路，不适合直接全量
- 团队需要一份可执行的灰度方案

## 2. 推荐链路

1. `/team-plan`
2. `/team-execute`
3. `/verify`
4. `/handoff`
5. `/team-release`

## 3. 关键输出

- staging 验证结论
- 灰度比例和观察窗口
- 放量条件与终止条件
- 回滚条件和责任人

## 4. 合格结果的检查点

- 指标和阈值明确
- 放量步骤明确
- 出问题时能快速停止或回退

## 5. 常见错误

- 灰度只写比例，不写观察指标
- 放量节奏过快
- 回滚条件没有提前约定

与这些文档配合阅读：[devops-engineer-daily-operations.md](devops-engineer-daily-operations.md)、[hotfix-emergency-release-walkthrough.md](hotfix-emergency-release-walkthrough.md)
