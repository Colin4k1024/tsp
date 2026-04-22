---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 生产事故应急响应演练

本文演示线上事故从快速分级、止血、修复到后续复盘的完整协作方式。重点是多角色协同，而不是单点修 bug。

## 1. 场景

- 线上告警触发，审批提交成功率突然下降
- 影响关键路径，需要快速止血
- 可能需要临时回滚、限流或降级

## 2. 推荐链路

1. `/team-intake`
2. `/team-execute`
3. `/verify`
4. `/handoff`
5. `/team-release`

问题复杂时，可在中间插入 `/code-review` 或 `/plan` 做专项分析。

## 3. 关键输出

- 事故等级与影响范围
- 止血方案与执行结果
- 根因假设或已确认根因
- 后续修复和复盘建议

若需要快速形成事故简报，直接按 [artifact-standards.md](../../rules/artifact-standards.md) 中的 Incident Brief 最小字段组织：事件概览、初步判断、协作分工、后续动作。

## 4. 合格结果的检查点

- 有单点决策人
- 止血动作和根治动作被区分开
- 事故记录可供后续复盘

## 5. 常见错误

- 多个角色同时给最终结论
- 先争论根因，延误止血
- 事故结束后没有沉淀后续动作

与这些文档配合阅读：[tech-lead-daily-operations.md](tech-lead-daily-operations.md)、[troubleshooting.md](troubleshooting.md)
