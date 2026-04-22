---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 角色高频提示模板

本文把高频角色的常用说法收成一页，适合在 Claude 或 Codex 里直接复制。它不替代主链命令规范，而是帮你更快拿到接近可执行产物的输出。

如果你想先看当前公开命令和能力映射，先读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。如果你关心 memory、observe、budget、compact、instinct 这些后台机制，再读 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

## 1. Tech Lead 起手模板

```text
请以 tech-lead 视角处理当前任务。
先执行 /team-intake，输出：目标、范围外事项、参与角色、主要风险、是否命中 overlay 候选项、下一步建议。

任务背景：
- 目标：
- 范围：
- 不做：
- 约束：
```

适用场景：任务刚进入平台，还没有统一边界。

## 2. Tech Lead 收口模板

```text
基于当前 intake、plan、specialist 和 handoff 结果，请以 tech-lead 视角收口。
输出必须包含：已确认结论、未决问题、阻塞风险、非阻塞风险、下一步命令建议。
如果 specialist 已参与，请说明哪些结论已经回收到主链，哪些还没有。
```

适用场景：并行分析很多，但没有统一收口时。

## 3. Product Manager 澄清模板

```text
请以 product-manager 视角整理当前需求。
输出：业务目标、核心用户场景、In Scope、Out of Scope、验收标准、待确认事项。
最后补一段：这些内容怎样进入 /team-intake。
```

适用场景：需求描述还是业务语言，尚未转成主链输入时。

## 4. Project Manager 计划模板

```text
请以 project-manager 视角拆当前任务。
输出：里程碑、关键依赖、角色协作顺序、风险、升级条件。
如果存在并行开发，请说明哪些 handoff 必须提前约定。
```

适用场景：任务不只是“能不能做”，而是“怎么稳妥推进”时。

## 5. Architect 方案模板

```text
请以 architect 视角处理当前任务。
输出：系统边界、接口契约、数据约束、主要技术风险、是否需要 private enterprise overlay。
如果需要 private enterprise overlay，请区分候选项和正式启用项。
```

适用场景：涉及接口、数据边界、流程引擎或权限中心时。

## 6. QA 放行模板

```text
请以 qa-engineer 视角给出当前任务的测试结论。
输出：测试范围、已验证项、阻塞项、非阻塞风险、放行建议、上线后观察建议。
如果存在 private enterprise overlay 或发布扩展，请说明是否需要额外验证证据。
```

适用场景：研发已交付，需要形成明确的 review 结论时。

## 7. DevOps 发布模板

```text
请以 devops-engineer 视角执行 /team-release。
输出：发布方案、观察窗口、核心指标、回滚条件、回滚步骤、责任链。
如果 GitLab 手动流水线或 Langfuse 追踪只作为 runbook 补充，而不是正式 private enterprise overlay，也请明确写出。
```

适用场景：发布阶段最容易漏写企业扩展和观察窗口时。

## 8. Review 重新收口模板

```text
请基于当前 handoff、自测和专项分析结果，生成一次正式 /team-review 输出。
要求区分：
- 可以放行的依据
- 必须阻塞的问题
- 上线后继续观察的问题
- overlay、runbook、toolkit 的执行记录是否需要进入结论
```

适用场景：信息很多，但你需要一份正式评审结论时。

## 9. Tech Lead 测试先行模板

```text
请以 tech-lead 视角衔接当前计划结果。
基于已有 /team-plan 输出，先整理进入 /tdd 所需的最小上下文。
输出必须包含：功能目标、边界行为、测试优先级、实现前置条件、完成后如何回收到 /team-execute 或 /handoff。
```

适用场景：任务已经拆清，但你希望先锁定 red-green-refactor 路径，而不是直接进入实现。

## 10. 平台能力体检模板

```text
请以 tech-lead 视角执行一次 /harness-audit。
重点审视：命令覆盖、skills 完整度、hooks 有效性、文档同步情况、集成深度。
输出必须包含：高风险缺口、可延后问题、建议优先级、哪些结论需要回写到 README / runbooks / examples。
```

适用场景：刚新增了命令、skills、hooks、规则或安装入口，想快速确认平台文档和能力面是否同步。

## 11. 常见错误

- 只指定角色，不说明希望输出什么结构
- 没有要求把 specialist 结论回收到主链
- 已经适合用 `/tdd` 或 `/harness-audit`，却还只写笼统的“帮我分析一下”
- 在 architect、qa、devops 场景里把 overlay、runbook、toolkit 的角色写混

如果你想看更偏 Claude 的完整说法，继续看 [claude-conversation-prompt-recipes.md](claude-conversation-prompt-recipes.md)；如果你想看更偏 Codex 的并行说法，继续看 [codex-parallel-prompt-recipes.md](codex-parallel-prompt-recipes.md)。
