# /handoff

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

用于在角色之间执行标准化交接，保证上下游共享同一事实，并把阶段切换、下游质疑和 readiness proof 一起交接。

## 主责角色

- `tech-lead`

## 期望输入

- 当前角色结论
- 输入依据
- 风险与待确认项
- 必要时附上 UI 方案、截图或检查清单
- 当前阶段与目标阶段
- readiness proof

## 标准输出

- 结构化交接摘要
- 下一跳角色动作清单
- 可追溯的设计和质量证据
- 阶段切换凭证
- readiness proof
- 下游质疑记录

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 按 `rules/handoff-contract.md` 固定交接字段。
2. 先确认当前阶段、目标阶段与 readiness 状态，再决定是否允许下一跳开始。
3. 在 handoff 文件的 frontmatter 中显式写入 `current_phase`、`target_phase`、`readiness_status`、`accepted_by`；在正文中保留 `readiness proof` 与 `downstream challenge record`。
4. 若变更涉及前端，附上设计 token、异常态说明、响应式约束和自测/评审证据。
5. 显式说明已完成内容、未完成内容和风险。
6. 接收方必须先留下至少 1 条下游质疑记录，再开始消费交接内容。
7. 指定下一跳角色与期望产出。
8. 【落盘 — 必须执行，不可跳过】
① 确认当前任务 slug（目录格式 `{YYYY-MM-DD}-{slug}`）。
② 立即执行 `npm run artifact:persist -- ensure-handoff --date {YYYY-MM-DD} --slug {slug} --from {from-role} --to {to-role} --status draft`，自动创建 `handoffs/{NNN}-{from-role}-to-{to-role}.md`。
③ 立即在生成的 handoff 文件中补全本次交接的完整结构化内容（背景、输入依据、结论、风险、待确认项、下一跳角色、下游质疑记录）。
④ 完成后输出确认：`已创建 handoffs/{NNN}-{from-role}-to-{to-role}.md`。
