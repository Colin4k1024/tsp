---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Langfuse 追踪与可观测性集成指南

本文说明 Langfuse 在 Team Skills Platform 中应该怎样作为可观测性补充能力使用。重点是何时启用、记录什么、如何回写主链，而不是单独讨论脚本调用。

## 1. 什么时候值得启用

- 任务跨多个阶段，需要追踪关键决策或验证链路
- 发布或事故处理需要保留更可追溯的执行证据
- 团队需要把 AI 辅助执行与后续排障连接起来

## 2. 不应该指望它做什么

- 不替代 `/team-execute` 的实现说明
- 不替代 `/team-review` 的质量结论
- 不替代 `/team-release` 的放行、回滚和观察窗口

## 3. 推荐记录粒度

- trace：一次任务、一次发布、一次事故处理
- span：某个阶段，如 intake、execute、verify、release
- 关键标签：任务名、角色、风险级别、是否命中 custom overlay

## 4. 回写位置

- execute 阶段：记录是否开启 trace、关键 span 与异常点
- review 阶段：只在可观测性证据影响结论时引用
- release 阶段：记录观察窗口、异常事件和后续动作

## 5. 常见错误

- 没有决定记录粒度，就把所有步骤都打点
- 追踪信息很多，但主链输出没有任何回写
- 把 Langfuse 追踪误当成审计结论本身

与这些文档配合阅读：[langfuse-coding-trace.md](langfuse-coding-trace.md)、[production-incident-response-walkthrough.md](production-incident-response-walkthrough.md)
