# /team-execute

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

用于驱动前端、后端等实现角色在既定边界内完成交付，但只有在 readiness proof、需求挑战会、设计收口和 handoff 都齐备后才允许进入实现。

## 主责角色

- `backend-engineer`

## 期望输入

- 方案、契约、任务拆解
- docs/memory/project-context.md（当前任务、关键依赖、活跃风险）
- story slice / 当前执行单元
- 实现范围与验收标准
- 技能装配清单
- 若涉及前端则附设计系统与体验约束
- 需求挑战会结论
- 上游 handoff
- downstream challenge record

## 标准输出

- 实现结果
- 自测结论
- 交给 QA 的说明
- story slice 完成状态
- 领域扩展执行记录
- 必要时补充 UI 检查清单
- readiness proof
- 阻断/回退说明

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 先确认本次实现范围与不做项，并核对是否已具备进入实现的 readiness proof。
2. 实现阶段默认遵循 `karpathy-guidelines`：锁定 in-scope / out-of-scope、优先最小实现、保持改动外科化，并按明确成功标准落地而不是边做边猜。
3. 执行前运行 `npm run workflow:readiness -- --phase execute --task-dir docs/artifacts/{YYYY-MM-DD}-{slug}`；若校验失败，停止实现并回补 challenge、design review、handoff 或 artifact 证据。
4. 若缺少需求挑战会、上游 handoff 或 Design Review 结论，立即停止并回交 tech-lead。
5. 开始实现前先消费 `docs/memory/project-context.md`，确认当前任务、关键依赖、活跃风险与团队约束未过期。
6. 一次 `/team-execute` 默认只消费一个 story-sized execution unit；若当前 slice 无法独立验收或独立 handoff，先回到 `/team-plan` 重切。
7. 若任务命中领域扩展层，先读取对应 `skills/` 技能；若命中配套 runbook / profile / toolkit，也先补看对应文档再开始实现。
8. 若包含前端变更，优先复用设计 token、遵循响应式与可访问性基线，并记录关键交互和边界态。
9. 若实现中遇到连续修错、跨模块链路或表象报错，切到 `systematic-debugging` 先定位根因，再继续修改。
10. 以最小改动完成实现并记录影响面。
11. 即便使用 private enterprise overlay，也要把最终实现说明、自测结果和风险统一归并到 `/handoff` 输出中。
12. 若前端变更需要真实浏览器验证，补用 `browser-smoke-testing` 形成关键页面 / 核心路径 smoke 证据。
13. 前端交付前使用 `templates/ui-review-checklist.md` 补齐自测证据，再通过 `/handoff` 交给 QA 或 DevOps。
14. 完成自测后通过 `/handoff` 交给 QA 或 DevOps。
15. 【落盘 — 必须执行，不可跳过】
① 确认任务 slug。
② 执行 `npm run artifact:persist -- ensure-artifact --date {YYYY-MM-DD} --slug {slug} --artifact execute-log --role backend-engineer --status draft --state execute` 创建 `execute-log.md`。
③ 立即在 `execute-log.md` 中补全：计划 vs 实际偏差、实施中的关键决定、阻塞与解决方式、影响面、未完成项。
④ 若实施中有轻量决策需要跨任务沉淀，执行 `npm run artifact:persist -- append-memory --date {YYYY-MM-DD} --memory-type decisions --title {decision_title} --content "{decision_markdown}"` 追加到 `docs/memory/decisions.md`。
⑤ 若实施中产生新 ADR，按既有规则在 `docs/adr/` 新建并同步 INDEX 的 ADR 列。
⑥ 完成后输出确认：`已创建 execute-log.md`。

## Claude 子 Agent 调用

> 以下调用需要 `runSubagent` 工具。满足触发条件时，在当前对话中发起。

### 并行调用（parallel）

**触发条件**：任务同时涉及前端和后端实现，且用户选择并行时

| 子 Agent | agentName | 职责范围 |
|-----------|-----------|----------|
| frontend-engineer | `frontend-engineer` | 页面与组件开发、样式与交互、自测证据 |
| backend-engineer | `backend-engineer` | 接口实现、数据访问、业务逻辑、自测验证 |

**Prompt 模板**（调用时将 `{task_context}` 替换为当前任务背景，`{role_name}` 替换为对应角色名，`{scope}` 替换为职责范围）：

> 你是 Team Skills Platform 中的 {role_name}。基于以下实现规范，完成 {scope} 的具体实现：
>
> {task_context}
>
> 要求：说明实现范围、关键决策、自测结果和影响面。

**汇总**：所有子 Agent 完成后，由 `tech-lead` 将结果合并落盘到 execute-log.md。
