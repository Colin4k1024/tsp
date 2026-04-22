---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Claude 对话提示模板

本文给出更贴近 Claude 日常对话的起手模板。它们和 [team-commands-quick-prompts.md](team-commands-quick-prompts.md) 的区别是：这里不是只给命令骨架，而是给一段可以直接发给模型的完整说法。

如果你想先知道当前有哪些公开命令、ECC skills 和推荐组合，先看 [command-and-capability-matrix.md](command-and-capability-matrix.md)。如果你想先搞清后台机制，再看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

## 1. 第一次把任务拉进主链

```text
请按 Team Skills Platform 工作模型处理当前任务。
先以 tech-lead 视角执行 /team-intake，输出目标、范围外事项、参与角色、主要风险和下一步建议。

任务背景：
- 目标：新增订单审批状态查询接口
- 范围：接口、权限校验、测试计划
- 不做：前端页面和发布脚本重构
- 约束：需要判断 私有流程与权限集成 是否启用
```

适用场景：还没进入具体实现，需要先把边界锁住。

## 2. 已有 intake，要求继续拆计划

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出角色职责、依赖、handoff 节点、风险和技能装配清单。
如果 private enterprise overlay 不启用，也请明确写出未启用原因。
```

适用场景：你不想自己拼 plan 的字段，只想让输出直接变成可执行计划。

## 3. 要求 Claude 先做专项分析，再回到主链

```text
基于当前任务先调用 /code-review 做专项风险分析。
分析完成后，不要停在专项结论，请把结果整理成可直接进入 /handoff 的格式，包含：风险、建议动作、验证要求和下一角色关注点。
```

适用场景：中途插入 specialist，但不希望结果散掉。

## 4. 走短链路的小任务

```text
这是一个边界清晰的小修复。
请先判断是否可以走短链路；如果可以，按 /code-review -> /handoff -> /team-review 的顺序给出建议。
如果不适合短链路，请说明必须补 /team-plan 的原因。
```

适用场景：你怀疑任务不需要完整长链，但不想自己拍板。

## 5. 前端任务的常用起手式

```text
请按 Team Skills Platform 处理这个前端问题。
先执行 /team-intake，并明确输出是否命中 frontend-quality-gates、响应式验证和 ui-review-checklist。

任务：修复订阅页在 iPad 横屏下的布局溢出。
范围：页面布局、响应式回归、UI 自测证据。
不做：接口改造。
```

适用场景：你希望模型主动把前端门禁带进来，而不是只盯着代码。

## 6. 后端加 company 判断的起手式

```text
请先以 /team-intake 方式处理当前后端任务，并重点判断是否命中 private enterprise overlay 候选项。
如果涉及流程审批、权限中心或公司专属平台，请给出候选项；如果不启用，也要说明原因。

任务：新增订单审批流转接口与权限校验。
范围：接口、权限、测试计划。
不做：前端页面。
```

适用场景：后端任务容易提前把 private enterprise overlay 混成默认启用，这段模板可以把判断动作显式化。

## 7. 发布前让 Claude 帮你收口

```text
基于当前实现、自测和 QA 结论，执行 /team-release。
请输出发布方案、观察窗口、回滚条件、责任链，并补充是否需要 GitLab 手动流水线或 Langfuse 追踪。
如果这些能力只是 runbook 补充，而不是正式 private enterprise overlay，也请写清楚。
```

适用场景：发布阶段最容易把企业扩展写丢，这段模板可以把判断和回写一起带出来。

## 8. 先走测试先行的说法

```text
基于当前 /team-plan 结果，不要直接进入实现。
先执行 /tdd，输出 red-green-refactor 路径、优先测试点、边界行为和实现顺序。
最后把结果整理成可直接进入 /team-execute 的动作清单。
```

适用场景：需求已经拆完，但你希望先把测试与成功标准锁住，减少返工。

## 9. 对平台本身做体检的说法

```text
当前仓库刚新增了一批命令、skills、hooks 和文档入口。
请先执行 /harness-audit，重点审视命令覆盖、skills 完整度、hooks 有效性、文档同步和集成深度。
输出时请区分：必须立即补齐的问题、可排到下一轮的问题、建议先改哪些 runbook / example / README。
```

适用场景：你不是在做单个业务需求，而是在收敛平台本身。

## 10. 让 Claude 强制给出结构化结果

```text
请不要只给结论摘要。
输出必须包含：已确认事项、未确认事项、风险、下一步命令建议。
如果涉及 specialist 结果，请再补一段“如何回收到 /handoff 或 /team-*”。
```

适用场景：模型回答开始发散，或者只给了松散建议时。

## 11. 常见错误

- 把自然语言提示写得太短，导致目标、范围和约束缺失
- 要求 specialist 分析，却没有追加“回到主链”的要求
- 已经需要 `/tdd` 或 `/harness-audit`，却还停留在泛化问法，导致输出无法直接落成动作
- overlay、runbook、toolkit 明明只是在当前任务按场景使用，却被写成默认长期启用

如果你要看纯命令骨架，回到 [team-commands-quick-prompts.md](team-commands-quick-prompts.md)；如果你要看最短上手路径，继续看 [first-team-command-60-seconds.md](first-team-command-60-seconds.md)；如果你要看 specialist 的适用边界，继续看 [specialist-commands-playbook.md](specialist-commands-playbook.md)。
