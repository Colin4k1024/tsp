# Audience Presentation Route Map

这份导览页回答一个问题：面对不同听众，Team Skills Platform 现有材料该怎么组合，不需要每次从头拼讲法。

## 1. 使用方式

- 如果听众是管理层，先看“管理层路线”
- 如果听众是准备接入项目的 Tech Lead / Architect，先看“实施接入路线”
- 如果听众是团队培训或内部赋能，先看“培训路线”

## 2. 管理层路线

### 适合谁

- 管理层
- 平台赞助人
- 需要快速判断平台价值与落地面的负责人

### 推荐目标

- 解释平台不是 prompts 仓库，而是角色化协作平台
- 解释公开命令、runtime 与 9 条 vertical 闭环的业务价值
- 解释当前能力已经可用于 onboarding、治理与演示

### 推荐顺序

1. [executive-briefing-talk-track.md](executive-briefing-talk-track.md)
2. `team-skills-platform-intro.pptx`（运行 generate_ppt.py 生成）
3. `agent-capability-matrix.pptx`（运行 generate_capability_matrix.py 生成）
4. [vertical-scenario-route-map.md](vertical-scenario-route-map.md)
5. 如果需要 runbook 层的一页材料，继续看 [../runbooks/executive-value-one-page.md](../runbooks/executive-value-one-page.md)

## 3. 实施接入路线

### 适合谁

- Tech Lead
- Architect
- Project Manager
- 负责把平台接入新仓库的实施人

### 推荐目标

- 明确该从哪个模板起手
- 明确主链、specialist 与 handoff 怎么接
- 明确 vertical 材料能否直接复用到当前项目

### 推荐顺序

1. [implementation-onboarding-brief.md](implementation-onboarding-brief.md)
2. [../../examples/INDEX.md](../../examples/INDEX.md)
3. [../../examples/project-type-starter-playbook.md](../../examples/project-type-starter-playbook.md)
4. [vertical-scenario-route-map.md](vertical-scenario-route-map.md)
5. [../runbooks/vertical-scenario-capability-matrix.md](../runbooks/vertical-scenario-capability-matrix.md)
6. 如果要按实施步骤继续读，转到 [../runbooks/implementation-onboarding-reading-path.md](../runbooks/implementation-onboarding-reading-path.md)

## 4. 培训路线

### 适合谁

- 研发团队
- QA / DevOps / PM / Architect 联合培训
- 新成员入组培训

### 推荐目标

- 理解主链和 specialist 的边界
- 理解 runtime 与显式命令的区别
- 理解不同 vertical 场景该如何选材料和复用 demo

### 推荐顺序

1. [workshop-facilitator-guide.md](workshop-facilitator-guide.md)
2. [presentation-talk-track.md](presentation-talk-track.md)
3. [../runbooks/command-and-capability-matrix.md](../runbooks/command-and-capability-matrix.md)
4. [../runbooks/runtime-capabilities-overview.md](../runbooks/runtime-capabilities-overview.md)
5. [../runbooks/vertical-scenario-capability-matrix.md](../runbooks/vertical-scenario-capability-matrix.md)
6. 如果要按培训节奏展开，转到 [../runbooks/team-training-reading-path.md](../runbooks/team-training-reading-path.md)

## 5. 一页判断

- 只想讲价值和成果：走管理层路线
- 只想让项目开始接入：走实施接入路线
- 只想让团队理解如何日常使用：走培训路线
