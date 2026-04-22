# /team-closeout

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

用于在发布与观察窗口结束后做最终收口，确认最终验收状态、残余风险处置、遗留项回写和任务关闭结论。

## 主责角色

- `tech-lead`

## 期望输入

- 发布结果与观察窗口记录
- 最终验收或业务确认结论
- 残余风险与事故 / 回滚情况
- 需要回写的 backlog / follow-up 项
- 已落盘的 PRD、Delivery Plan、Review、Release 等主链 artifact

## 标准输出

- 最终收口结论
- 最终验收状态
- 观察窗口结论
- 残余风险处置结果
- backlog 回写清单
- 任务关闭状态

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 确认 `/team-release` 已完成，并具备发布结果、观察窗口、监控与回滚证据；若仍在发布中或观察窗口未结束，不得进入 closeout。
2. 复核最终验收是否满足上线目标、业务可用性与主要风险边界，必要时对发布结果、观察窗口充分性和遗留项处理方式提出质疑。
3. 把残余风险分类为接受、转移、延后处理或重新打开主链，并为每项风险明确责任人与下一步动作。
4. 若观察窗口内出现事故、回滚或严重偏差，明确任务状态为 `re-open` 或 `follow-up-required`，而不是直接关闭。
5. 若任务启用了 private enterprise overlay、配套私有 runbook 或 overlay，确认 closeout 结论已经消费这些领域证据，不允许只引用口头结论。
6. 形成最终收口结论，明确 `最终验收状态`、`观察窗口结论`、`backlog 回写` 和 `任务关闭结论`。
7. 向相关角色回传 closeout 结果：若已关闭则同步后续跟踪项；若未关闭则明确重开入口和责任链。
8. 【落盘 — 必须执行，不可跳过】
① 复用既有任务 slug。
② 执行 `npm run artifact:persist -- ensure-artifact --date {YYYY-MM-DD} --slug {slug} --artifact closeout-summary --role tech-lead --status draft --state {final_state}` 创建 `closeout-summary.md`，其中 `{final_state}` 取 `closed`、`re-open` 或 `follow-up-required`。
③ 立即在 `closeout-summary.md` 中补全：最终验收状态、观察窗口结论、残余风险处置、backlog 回写、任务关闭结论、lessons learned。
④ 执行 `npm run artifact:persist -- write-project-context --project-name {project_name} --current-task {YYYY-MM-DD}-{slug} --phase {final_state} --tech-stack "{tech_stack_item}" --dependency "{dependency_item}" --risk "{risk_item}" --next-step "{next_step_item}"` 刷新 `docs/memory/project-context.md`。
⑤ 若有 backlog 回写，执行 `npm run artifact:persist -- append-memory --date {YYYY-MM-DD} --memory-type backlog --title {backlog_title} --content "{backlog_markdown}"`。
⑥ 若有跨任务经验沉淀，执行 `npm run artifact:persist -- append-memory --date {YYYY-MM-DD} --memory-type lessons --title {lesson_title} --content "{lesson_markdown}"`。
⑦ 执行 `npm run artifact:persist -- write-session-summary --date {YYYY-MM-DD} --slug {slug} --role tech-lead --title "Closeout Summary - {slug}" --content "{session_summary_markdown}"` 写入 `docs/memory/sessions/{YYYY-MM-DD}-{NNN}-{slug}.md`。
⑧ 完成后逐条输出确认：`已创建 closeout-summary.md`，`已刷新 project-context.md`，`已创建 sessions/{filename}`。
