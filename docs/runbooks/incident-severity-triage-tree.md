---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 事故分级与应急决策树

本文用于事故发生后的前几分钟内快速分级，决定是止血、回滚还是继续排查。

## 1. 快速分级

- P1：关键流程不可用，影响核心用户路径
- P2：关键流程部分可用，但错误率明显升高
- P3：非核心路径异常或局部功能退化

## 2. 决策树

- 如果核心路径不可用：优先止血或回滚
- 如果核心路径可用但波动明显：先限制影响面，再继续验证
- 如果问题局部可控：记录问题，按 hotfix 或后续版本处理

## 3. 最小止血动作

- 回滚
- 关闭入口或降级
- 限流或隔离问题流量

## 4. 什么时候必须升级

- 多角色连续两轮仍无法统一结论
- 问题已影响发布窗口或灰度计划
- 问题已超出当前值守角色可控范围

## 5. 常见错误

- 先争论根因，后做止血
- 没有单点决策人
- 止血后没有后续动作记录

相关长文档见：[production-incident-response-walkthrough.md](production-incident-response-walkthrough.md)、[hotfix-emergency-release-walkthrough.md](hotfix-emergency-release-walkthrough.md)
