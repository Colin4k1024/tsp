---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 团队培训阅读路径

本文面向团队培训、联合赋能和新成员入组，目标是让读者先理解怎么用，再决定看哪一条 vertical 或哪一类 specialist。

## 1. 适合谁

- 前后端研发
- QA / DevOps / PM / Architect 联合培训
- 新成员入组培训

## 2. 培训先讲什么

- 主链命令解决什么问题
- specialist 命令和主链是什么关系
- runtime 能力为什么不是“隐形魔法”，而是可解释的平台能力
- vertical 材料怎么选，不同项目为什么不用从零写脚本

## 3. 推荐顺序

1. [../presentation/workshop-facilitator-guide.md](../presentation/workshop-facilitator-guide.md)
2. [command-and-capability-matrix.md](command-and-capability-matrix.md)
3. [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
4. [specialist-commands-playbook.md](specialist-commands-playbook.md)
5. [vertical-scenario-capability-matrix.md](vertical-scenario-capability-matrix.md)

## 4. 培训分三段就够了

### 4.1 第一段：讲主链

先用 [first-team-command-60-seconds.md](first-team-command-60-seconds.md) 和 [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md) 讲最小闭环。

### 4.2 第二段：讲 specialist 和 runtime

用 [specialist-commands-playbook.md](specialist-commands-playbook.md) 解释 `/plan`、`/tdd`、`/code-review`、`/verify`，再用 [runtime-capabilities-overview.md](runtime-capabilities-overview.md) 讲 memory、observe、cost、budget、compact。

### 4.3 第三段：讲 vertical 复用

用 [vertical-scenario-capability-matrix.md](vertical-scenario-capability-matrix.md) 选一条完整 vertical，再进入对应 demo script 和 execution log。

## 5. 推荐练习顺序

1. 先跑一条最小主链
2. 再加一个 specialist 命令
3. 最后挑一个 vertical 做完整演练

## 6. 常见误区

- 一开始就把角色、命令、runtime、vertical 一次讲完，导致信息过载
- 只讲命令，不讲 handoff 回落和责任链
- 只讲理论，不给 demo script 或 execution log

## 7. 培训后继续分流

- 需要实施接入的人：转到 [implementation-onboarding-reading-path.md](implementation-onboarding-reading-path.md)
- 需要汇报价值的人：转到 [executive-value-one-page.md](executive-value-one-page.md)
- 需要按 Claude 或 Codex 分端阅读的人：转到 [claude-usage-scenarios.md](claude-usage-scenarios.md) 和 [codex-usage-scenarios.md](codex-usage-scenarios.md)
