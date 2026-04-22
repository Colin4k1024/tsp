---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Codex 并行编排提示模板

本文聚焦 Codex 里最常见的几种并行表达方式：什么时候该让多个 specialist 并行跑，什么时候必须先收口回主链。

如果你想先看命令全景和对应能力，先读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。如果你想先理解 observation、budget、compact、cost、instinct 这些后台机制，读 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

## 1. 先 intake，再决定是否并行

```text
先按 /team-intake 锁定目标、范围、约束和参与角色。
只有在 intake 明确存在多视角或多子系统时，再建议进入 /multi-* 或其他 specialist。
```

适用场景：避免一上来就并行跑很多 agent，结果没有统一入口。

## 2. 前端多视角并行

```text
/multi-frontend
基于当前 intake 结果，从实现方案、UI/UX 风险、QA 验证三个视角并行拆解。
输出时请分成两部分：
1. 各视角结论
2. 哪些内容必须进入最终 /handoff
```

适用场景：前端页面改动同时涉及实现、体验和验收门禁。

## 3. 后端多子系统并行

```text
/multi-backend
基于当前 intake 或 plan，把接口实现、权限边界、测试策略三部分并行分析。
如果命中 私有流程或权限集成，请明确说明是 custom overlay 还是仅保留为候选项。
最终请整理出可直接回写 /team-plan 的结果。
```

适用场景：后端任务跨接口、权限和 company 边界时。

## 4. 复杂任务先规划再并行

```text
/plan
请先把当前任务拆成阶段、角色职责、依赖和风险。
然后指出哪些阶段适合并行，哪些阶段必须串行。
输出最后补一段：建议用哪个 /multi-* 或 specialist，以及为什么。
```

适用场景：任务很大，但你不想凭感觉决定怎么并行。

## 5. 并行结果回收到 handoff

```text
请把上面的多 agent 结论整理成一次正式 /handoff。
不要重复每个 agent 的原话，只保留：
- 已确认结论
- 未决问题
- 风险与依赖
- 下一角色动作清单
```

适用场景：这是 Codex 最重要的一步，避免 specialist 输出散落在上下文里。

## 6. 并行后进入 review

```text
基于当前 handoff，继续执行 /team-review。
如果前面有 specialist 结论，请只保留那些会影响评审结论、阻塞项和放行建议的内容。
```

适用场景：多 agent 分析完成后，要把 review 聚焦在放行判断，而不是重复过程。

## 7. 发布阶段的并行补充

```text
基于当前 release 输入，先判断是否需要 GitLab 手动流水线、Langfuse 追踪或其他 company/runbook 补充。
如果需要，请给出它们在 /team-release 中的回写方式；如果不需要，也请明确说明原因。
```

适用场景：发布阶段要补企业扩展，但不想让扩展能力抢走主链。

## 8. 构建失败时的编排方式

```text
先用 /build-fix 定位当前构建失败原因。
如果修复路径仍不清楚，再补 /verify 或 /code-review。
最后请把结论整理成可直接回到 /team-execute 的动作清单。
```

适用场景：构建故障最容易无限分叉，这个模板强调先收敛，再继续。

## 9. 先测试后并行的编排方式

```text
先基于当前 /team-plan 结果执行 /tdd，锁定测试、边界和成功标准。
只有当实现阶段明确存在多子系统或多视角时，再进入 /multi-*。
最后请把 /tdd 和 /multi-* 的结论合并成一次正式 /handoff。
```

适用场景：任务既复杂又容易返工，先锁测试再并行能减少分叉。

## 10. 平台能力自检的编排方式

```text
/harness-audit
请从命令覆盖、skills 完整度、hooks 有效性、文档同步、集成深度五个方向审视当前平台。
输出时按优先级分成：
1. 必须立刻修补
2. 可下一轮收敛
3. 仅记录观察
最后把高优先级项整理成文档、命令、skills、hooks 四类动作。
```

适用场景：仓库最近做过大规模能力扩充，想快速审视还有哪些入口没有同步。

## 11. 常见错误

- 并行前没有先做 intake，导致目标和范围不统一
- 并行结果直接当最终结论，没有回写 handoff
- overlay、runbook、toolkit 只在 specialist 里提到，没有进入 review 或 release 正式输出
- 平台治理问题没有用 `/harness-audit`，反而拆成很多零散 specialist，导致结论分散
- 任务明显适合 `/tdd`，却直接并行实现，导致后面还要回头补测试标准

如果你想先看 Codex 的整体使用节奏，回到 [codex-workflow-essentials.md](codex-workflow-essentials.md)；如果你想看更短的主链骨架，回到 [team-commands-quick-prompts.md](team-commands-quick-prompts.md)；如果你想知道 specialist 的边界，继续看 [specialist-commands-playbook.md](specialist-commands-playbook.md)。
