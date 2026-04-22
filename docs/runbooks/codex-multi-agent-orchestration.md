---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Codex 多 Agent 编排指南

本文聚焦 Codex 中最有价值的能力：把多角色和 specialist 并行跑起来，再把结果结构化收口。

## 1. 何时值得并行

- 前后端都要动
- 方案、实现、测试可以部分并行
- 单个任务信息量大，串行代价高

## 2. 推荐并行组合

### 2.1 全栈任务

- architect
- frontend-engineer
- backend-engineer
- qa-engineer

### 2.2 专项分析

- tech-lead + planner
- engineer + code-reviewer
- engineer + build-error-resolver

## 3. 并行前先锁定什么

- 目标
- 范围外事项
- 依赖关系
- 最终由谁收口

如果这些不清楚，并行只会制造更多平行结论。

## 4. 并行后的收口方式

推荐流程：

1. 每个 agent 只产出本角色视角结果
2. 用 `/handoff` 汇总关键结论
3. 由 tech-lead 或主链角色做最终合并

## 5. 冲突怎么处理

如果多 agent 给出冲突结论，优先按以下顺序处理：

1. 架构与约束优先
2. 阻塞性风险优先
3. 最终由 tech-lead 裁决

## 6. 常见错误

- 没有依赖关系，盲目并行
- 结果很多，但没有统一 handoff
- 把 specialist 当作某个角色的替代者

如果你需要更细的 specialist 分工，继续看 [specialist-commands-playbook.md](specialist-commands-playbook.md)。
