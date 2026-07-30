---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Project Manager 日常操作手册

本文面向项目经理，说明排期、依赖、里程碑和风险推进如何在 Team Skills Platform 下落地。

如果你想先看当前公开命令和 specialist 入口，先读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。

## 1. 你的默认职责

- 把任务拆成可执行阶段和里程碑
- 识别跨角色依赖与阻塞项
- 跟踪风险状态和时间窗口
- 把进度与风险同步给 tech-lead

## 2. 进入 plan 前必须确认什么

- 目标和范围外事项是否稳定
- 谁负责关键交付物
- 哪些依赖会影响排期
- 是否存在必须升级给 tech-lead 的风险

## 3. 排期时的固定检查

- 依赖顺序是否清楚
- 是否需要分阶段交付
- 哪些事项必须作为阻塞项管理
- QA、发布和观察窗口是否预留

## 4. 应交付什么

- 里程碑和依赖清单
- 关键风险与缓解动作
- 阻塞项与责任人
- 建议的 handoff 节点

如果需要成文化交付计划，直接按 [artifact-standards.md](../../rules/artifact-standards.md) 中的 Delivery Plan 最小字段组织：版本目标、工作拆解、风险与缓解、节点检查。

## 5. 常用命令组合

- `/team-intake`：确认目标和参与角色
- `/team-plan`：形成阶段计划与依赖
- `/tdd`：在高返工任务里把测试前置，降低阶段返工风险
- `/handoff`：推动跨角色衔接
- `/team-review`：收口风险和剩余问题
- `/harness-audit`：平台刚新增入口或命令时，检查文档与命令面是否同步

## 6. 常见错误

- 只有时间点，没有依赖关系
- 风险写得很泛，无法行动
- 没有识别哪些任务应该先走 `/tdd`，导致计划上看似推进，实际上返工风险很高
- 没有为 QA 和 release 预留明确窗口

可结合这些文档一起看：[project-onboarding.md](project-onboarding.md)、[first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md)、[project-manager-planning-conversation-example.md](project-manager-planning-conversation-example.md)
