# Handoff Contract

## 强制字段

每次角色交接至少包含以下内容：

1. `背景`：为什么发起这次交接。
2. `输入依据`：来自哪些文档、代码、讨论或测试结果。
3. `结论`：当前角色已经完成并确认的内容。
4. `风险`：已知风险、假设、未覆盖项。
5. `待确认项`：需要下游确认或补充的信息。
6. `下一跳角色`：谁来接，接手后要产出什么。
7. `当前阶段`：`intake` / `requirement-challenge` / `design-swarm` / `design-review` / `handoff-ready` / `execute` / `review` / `release`。
8. `目标阶段`：这次 handoff 要推进到哪个阶段。
9. `就绪状态`：`not-ready` / `ready-for-review` / `handoff-ready` / `release-ready` / `blocked` / `accepted`。
10. `readiness proof`（兼容别名：`执行前提证据`、`implementation-readiness`）：证明下一阶段准入条件已满足的证据摘要，至少说明 challenge / design review / handoff / gate 结果。
11. `accepted_by`：接收方角色，表示谁已经接受并开始消费这次交接。
12. `阻塞项`：当前无法推进的硬阻塞条件，必须显式列出。

若任务启用了 company skill，或使用了配套 runbook / profile / toolkit，还应补充：

1. `技能装配清单`：本次实际启用的 `shared / ecc / company` 技能组合，以及按场景附带的 runbook / profile / toolkit，至少说明触发原因和主责角色。
2. `领域扩展执行记录`：实施阶段实际使用了哪些 company skill 或配套资料、关键变量如何解析、读了哪些资料、结论已回落到哪个主链输出。
3. `领域扩展约束核对结果 / 可选领域扩展执行记录`：QA 或 Release 若命中了领域扩展能力，必须说明约束核对状态，或记录发布期扩展执行摘要。

若交付物包含前端变更，还应补充：

1. `UI 证据`：关键页面/组件、设计 token、边界态、自测截图或清单。
2. `体验门禁状态`：响应式、无障碍、性能、交互反馈是否已达标。

每次角色交接，接收方必须补充：

1. `下游质疑记录`：接收方针对上游输入提出的质疑、质疑结论和处理方式。至少包含 1 条对上游输入合理性的质疑，以及该质疑的解决结论（接受 / 修改 / 升级）。格式示例：
    - 质疑内容：「……」
    - 质疑目标：上游的哪个产出
    - 结论：接受原方案 / 要求上游修改 / 升级给 tech-lead
    - 处理说明：简述修改内容或升级结果

相关输出结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 不允许的交接

- 只有链接，没有摘要。
- 只有结论，没有依据。
- 把未确认事项包装成已完成。
- 把“需要谁决策”留空。
- 缺少 `当前阶段`、`目标阶段`、`就绪状态`、`readiness proof`、`accepted_by` 或 `阻塞项`。
- 已启用领域扩展能力，但不说明技能装配、变量解析或结果回落位置。
- 前端交付只给代码路径，不给关键页面说明、截图或检查结论。
- 接收方未对上游输入提出至少 1 条质疑就直接开始工作——每次 handoff 的接收方必须留下质疑记录。
