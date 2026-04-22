---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 60 秒跑通第一个 Team 命令

本文只做一件事：让第一次接触平台的人在 60 秒内知道“该怎么说”和“下一步是什么”。

如果你想先看完整命令面和新增能力，不要只停在本文，继续看 [command-and-capability-matrix.md](command-and-capability-matrix.md) 和 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

## 场景 A：小 Bug 修复

你可以直接输入：

```text
/team-intake
目标：修复订阅页在 iPad 下的布局溢出
范围：页面布局、响应式验证、UI 自测证据
不做：接口改造
约束：必须附带 ui-review-checklist
```

你期望拿到：

- 参与角色建议
- 风险与待确认项
- 下一步是继续 `/team-execute` 还是先 `/team-plan`

## 场景 B：简单新接口

你可以直接输入：

```text
/team-intake
目标：新增订单审批状态查询接口
范围：接口、权限校验、测试计划
不做：前端页面
约束：判断是否启用 私有流程或权限集成
```

然后继续：

```text
/team-plan
基于 intake 结果拆角色职责、依赖和 handoff 节点。
```

你期望拿到：

- 哪些角色参与
- 是否需要 custom overlay
- 下一步该进入实现、专项分析还是交接

## 场景 C：先锁测试，再开始做

如果 `/team-plan` 已经拆清楚任务，你可以继续输入：

```text
/tdd
基于当前 /team-plan 结果，先锁定测试、边界行为、成功标准和实现顺序。
输出 red-green-refactor 路径，并整理成可直接进入 /team-execute 的动作清单。
```

你期望拿到：

- 优先测试点
- 实现顺序
- 哪些验证要在 handoff 前完成

## 场景 D：平台刚加了很多能力，先做体检

你可以直接输入：

```text
/harness-audit
请审视当前平台的命令覆盖、skills 完整度、hooks 有效性、文档同步和集成深度。
输出高优先级缺口、建议修补顺序，以及哪些 README / runbook / example 需要补齐。
```

你期望拿到：

- 哪些入口没有同步
- 哪些问题必须本轮修补
- 哪些问题可以放到下一轮

## 最短建议

- 第一步永远先把目标、范围、不做和约束说清楚
- 第二步看结论决定是短链路还是完整主链
- 如果已经拆完计划但还没开始实现，优先考虑 `/tdd`
- 如果刚扩了命令、skills 或 hooks，优先考虑 `/harness-audit`
- 如果想直接复制模板，看 [team-commands-quick-prompts.md](team-commands-quick-prompts.md)
