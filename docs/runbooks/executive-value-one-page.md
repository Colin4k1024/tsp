---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 管理层价值速查一页

本文面向管理层、平台赞助人和需要快速判断投入产出的人，目标是在一页内回答 Team Skills Platform 值不值得继续推进。

## 1. 先判断这页适不适合你

- 你要的是价值判断，不是安装细节
- 你要的是平台边界、落地面和当前成熟度
- 你需要在 3 到 5 分钟内完成内部汇报或立项判断

## 2. 一句话说明

这不是 prompt 仓库，而是一套把角色分工、命令主链、specialist 能力、runtime 增强和 vertical 演示材料打包在一起的团队协作平台。

## 3. 当前能直接说明的价值

- 把需求、方案、研发、测试、发布收敛到统一主链：`/team-intake` 到 `/team-release`
- 把高频专项能力变成可控插拔，而不是每次临时拼 prompt：`/plan`、`/tdd`、`/code-review`、`/build-fix`、`/verify`
- 把 memory、并行分析、cost、compact 这类运行时能力沉淀成平台能力，而不是操作者个人技巧
- 已经具备 9 条完整 vertical 闭环，可直接用于 onboarding、方案汇报和内部演示

## 4. 管理层最关心的三个判断点

### 4.1 是否只是文档堆积

不是。平台有 canonical source、生成产物、安装脚本、校验脚本、命令面、角色面和 runbook/presentation 辅助资产。

### 4.2 是否只能做单点试验

不是。现在既能支撑首次接入，也能支撑日常研发、专项 review、跨角色 handoff 和发布收口。

### 4.3 是否有可复用演示资产

有。当前已经按 vertical 和按听众两条线把演示资产组织好，不需要每次从零准备讲稿。

## 5. 最短阅读顺序

1. [../presentation/executive-briefing-talk-track.md](../presentation/executive-briefing-talk-track.md)
2. `docs/presentation/team-skills-platform-intro.pptx`（运行 generate_ppt.py 生成）
3. `docs/presentation/agent-capability-matrix.pptx`（运行 generate_capability_matrix.py 生成）
4. [vertical-scenario-capability-matrix.md](vertical-scenario-capability-matrix.md)

## 6. 什么时候需要继续下钻

- 想看实施接入方式：继续看 [implementation-onboarding-reading-path.md](implementation-onboarding-reading-path.md)
- 想看团队培训材料：继续看 [team-training-reading-path.md](team-training-reading-path.md)
- 想按听众选 presentation 材料：继续看 [../presentation/audience-presentation-route-map.md](../presentation/audience-presentation-route-map.md)
