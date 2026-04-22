---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 实施接入阅读路径

本文面向准备把 Team Skills Platform 接入新仓库的人，目标不是讲全，而是把阅读顺序压到最短。

## 1. 适合谁

- Tech Lead
- Architect
- Project Manager
- 负责新仓库 onboarding 的实施人

## 2. 先回答三个问题

### 2.1 我从哪个模板起手

先看 [../../examples/INDEX.md](../../examples/INDEX.md) 和 [../../examples/project-type-starter-playbook.md](../../examples/project-type-starter-playbook.md)。

### 2.2 我这个项目能不能直接套现成 vertical 材料

先看 [vertical-scenario-capability-matrix.md](vertical-scenario-capability-matrix.md)，再按需进入对应 walkthrough、demo script 和 execution log。

### 2.3 我需要先装平台还是先跑第一条任务

先看 [project-onboarding.md](project-onboarding.md)，再按最小闭环进入 [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md)。

## 3. 推荐顺序

1. [../presentation/implementation-onboarding-brief.md](../presentation/implementation-onboarding-brief.md)
2. [project-onboarding.md](project-onboarding.md)
3. [../../examples/INDEX.md](../../examples/INDEX.md)
4. [../../examples/project-type-starter-playbook.md](../../examples/project-type-starter-playbook.md)
5. [vertical-scenario-capability-matrix.md](vertical-scenario-capability-matrix.md)
6. [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md)

## 4. 接入时的最短判断

- 已知项目类型：直接从 examples 模板起手
- 已知 vertical：直接从矩阵检查 starter、walkthrough、demo 是否齐全
- 只想先跑通主链：跳过 vertical，先走 onboarding + walkthrough
- 需要 overlay / runbook / toolkit 边界：补看 [enterprise-extension-quick-start.md](enterprise-extension-quick-start.md)

## 5. 最小执行顺序

1. 运行安装与接入准备：看 [project-onboarding.md](project-onboarding.md)
2. 准备项目级入口：从 [../../examples/project-CLAUDE.md](../../examples/project-CLAUDE.md) 或对应 vertical 模板复制
3. 跑第一条主链：按 [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md)
4. 需要专项能力时，再补 [specialist-commands-playbook.md](specialist-commands-playbook.md)

## 6. 常见误区

- 先看完所有文档才开始接入，导致 onboarding 变成重阅读任务
- 已经命中某个 vertical，却仍然只用通用模板起手
- 把历史企业扩展导入区当成正式接入入口

## 7. 继续往下看什么

- 想按 Claude 端进入：看 [claude-usage-scenarios.md](claude-usage-scenarios.md)
- 想按 Codex 端进入：看 [codex-usage-scenarios.md](codex-usage-scenarios.md)
- 想给团队做培训：看 [team-training-reading-path.md](team-training-reading-path.md)
