---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Codex 工作流要领

本文说明 Codex 端的工作方式和 Claude 有什么差别，以及为什么 Codex 更适合“主链 + specialist + 并行 agent”的组合。

如果你想先看完整命令面，读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。如果你想理解并行之外的预算、compact、observation、instinct 等后台机制，读 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

## 1. Codex 的适用特点

- 更适合围绕插件目录连续工作
- 更适合把多个 agent 结果并行收集再回到主链
- 更适合较大、依赖较多的任务

## 2. 安装后的第一步

完成 [codex-quick-start.md](codex-quick-start.md) 后，建议再做三件事：

1. 确认插件目录里能看到命令和 agents
2. 选一个真实任务跑最小闭环
3. 明确哪些 specialist 会成为你的高频工具
4. 区分哪些是显式命令，哪些是 runtime 自动生效的后台能力

## 3. 主链在 Codex 中怎么跑

推荐顺序：

1. `/team-intake`
2. `/team-plan`
3. 按任务形态插入 `/plan`、`/tdd`、`/multi-*`、`/build-fix`、`/verify`
4. `/handoff`
5. `/team-review` 或 `/team-release`

## 4. Specialist 如何插入

高频用法：

- 方案复杂：`/plan`
- 测试先行：`/tdd`
- 前端复杂：`/multi-frontend`
- 后端复杂：`/multi-backend`
- 构建问题：`/build-fix`
- 结果验证：`/verify`
- 平台自检：`/harness-audit`

建议你把 specialist 分成三类理解：

- 面向业务交付的命令：`/plan`、`/tdd`、`/build-fix`、`/verify`
- 面向并行编排的命令：`/multi-frontend`、`/multi-backend`
- 面向平台治理的命令：`/harness-audit`

## 5. 结果聚合原则

Codex 的关键不是“多跑几个 agent”，而是“能不能把结果安全回收到主链”。

建议每次 specialist 之后都补：

```text
请把上面的专项结论整理为可直接进入 /handoff 的格式。
```

如果刚跑完的是 `/tdd`，再补一句：

```text
请把测试约束、实现顺序和验证口径整理成可直接进入 /team-execute 的动作清单。
```

如果刚跑完的是 `/harness-audit`，再补一句：

```text
请把高优先级缺口拆成文档、命令、skills、hooks 四类收敛动作。
```

## 6. 常见错误

- 并行跑了很多 agent，却没有统一收口
- specialist 跳过主链直接变成最终结论
- 复杂任务没有先做 intake 和 plan
- 把 `/harness-audit` 当成业务任务评审命令使用
- 不区分显式命令和 runtime，导致把 observation、compact 误写成“手动执行步骤”

如果你需要更深入的并行编排，继续看 [codex-multi-agent-orchestration.md](codex-multi-agent-orchestration.md)；如果你想直接复制高频表达方式，继续看 [codex-parallel-prompt-recipes.md](codex-parallel-prompt-recipes.md)；如果你想看平台能力自检怎么做，继续看 [specialist-commands-playbook.md](specialist-commands-playbook.md)。
