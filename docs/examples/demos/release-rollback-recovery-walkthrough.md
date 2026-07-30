---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 发布后回滚与恢复演练

本文演示版本发布后发现问题时，如何判断是否回滚、如何验证恢复结果，以及如何把恢复过程记录回主链。

## 1. 场景

- 版本已全量发布
- 监控发现错误率或性能指标异常
- 团队需要在前向修复和回滚之间快速决策

## 2. 推荐链路

1. `/team-execute`
2. `/verify`
3. `/handoff`
4. `/team-release`

如果问题严重，可先走 [production-incident-response-walkthrough.md](production-incident-response-walkthrough.md) 的事故分级。

## 3. 关键输出

- 回滚还是前向修复的判断依据
- 回滚执行步骤
- 恢复后的验证结果
- 后续改进项

## 4. 合格结果的检查点

- 回滚条件事先或当场明确
- 恢复后关键指标恢复正常
- 数据一致性和依赖服务状态被复核

## 5. 常见错误

- 回滚之后不做恢复验证
- 只关注服务状态，不看数据一致性
- 问题消失后不补记录

与这些文档配合阅读：[canary-staging-release-walkthrough.md](canary-staging-release-walkthrough.md)、[devops-engineer-daily-operations.md](devops-engineer-daily-operations.md)
