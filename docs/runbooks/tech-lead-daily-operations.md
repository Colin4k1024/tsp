---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Tech Lead 日常操作手册

本文面向 Tech Lead，说明如何在 Team Skills Platform 下负责 intake、计划编排、冲突仲裁和最终收口。

如果你想先看当前命令总表，直接看 [command-and-capability-matrix.md](command-and-capability-matrix.md)。如果你最近在排查 memory、observe、budget、compact、instinct 对会话的影响，再配合看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

## 1. 你的默认职责

- 锁定目标、范围和成功标准
- 决定哪些角色参与、哪些 specialist 需要介入
- 处理结论冲突、风险升级和优先级调整
- 对最终 handoff、review 和 release 结果负责

## 2. intake 阶段必须确认什么

- 目标是否单一且可执行
- 范围外事项是否明确
- custom overlay 是否只是候选项还是需要进入 plan
- 当前任务适合短链路还是完整主链

## 3. plan 阶段必须确认什么

- 角色边界是否清楚
- handoff 节点和最小交付物是否清楚
- 哪些问题需要 specialist 先分析
- 哪些风险需要 architect、qa 或 devops 提前介入

## 4. execute 到 review 的收口原则

- specialist 结论必须回到主链
- handoff 必须能支撑下一角色行动
- 风险必须分成阻塞和非阻塞
- release 之前必须有明确的验证和回滚视角

## 5. 常用命令组合

- `/team-intake`
- `/team-plan`
- `/plan`、`/tdd`、`/code-review`、`/verify`
- `/handoff`
- `/team-review`
- `/team-release`

常见判断方式：

- 任务拆不清时先补 `/plan`
- 想先锁成功标准和测试约束时补 `/tdd`
- 代码已经改完、要判断实现风险时补 `/code-review`
- 放行前缺关键证据时补 `/verify`
- 平台本身刚做过扩容或重构时补 `/harness-audit`

## 6. 常见错误

- 让多个角色并行输出，却没有单点收口
- 在 intake 阶段过早拍板 custom overlay
- 把 specialist 结论当成最终决定
- 平台治理问题没有和业务交付问题区分，导致该用 `/harness-audit` 时还在做零散 review

建议与这些文档配合阅读：[first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md)、[specialist-commands-playbook.md](specialist-commands-playbook.md)、[role-prompt-recipes.md](role-prompt-recipes.md)、[tech-lead-closure-conversation-example.md](tech-lead-closure-conversation-example.md)
