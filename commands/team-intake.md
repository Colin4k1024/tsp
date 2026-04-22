# /team-intake

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

用于接收需求、梳理目标、范围、约束和参与角色，并在涉及 UI 时提前锁定体验与质量门槛，同时输出需要进入需求挑战会的候选分组。

## 主责角色

- `tech-lead`

## 期望输入

- 需求背景
- 目标与优先级
- 关键约束与时间窗口
- 是否涉及 UI、终端与设计约束
- 是否企业内部应用、是否存在数据 / 合规风险
- 是否涉及私有流程、权限系统、内部发布流程、私有观测或专属业务建模等 private enterprise overlay 线索

## 标准输出

- 需求简报
- 参与角色清单
- 待确认项列表
- 企业治理待确认项
- 领域技能包启用建议
- UI 范围、终端假设与质量门禁
- 需求挑战会候选分组

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 识别问题、目标、成功标准和上线时限。
2. 默认使用 `karpathy-guidelines` 收敛 intake：显式写出关键假设、最小可行范围、非目标以及成功标准，避免把模糊愿望直接带进后续计划。
3. 若任务包含架构文档补齐或演进，启用 `doc-architecture`，按 `docs/runbooks/doc-architecture-integration.md` 收集 Project Profile Card 并约束后续映射。
4. 若为企业内部应用，先确认应用等级、技术架构等级、数据 / 合规风险是否需要后续补判。
5. 识别是否需要私有 enterprise overlay 才能完成任务，并列出候选 overlay 能力、私有 runbook 或额外安装前提。
6. 若需求包含前端变更，明确目标端、产品类型、关键页面、设计约束，以及可访问性和性能基线。
7. 若任务复杂或存在方案分歧，提前建议需要参加需求挑战会的动态分组。
8. 确认由哪些角色参与以及各自的输入缺口。
9. 输出结构化 intake 结果并准备进入 `/team-plan`。
10. 【落盘 — 必须执行，不可跳过】
① 根据需求标题生成 slug（小写英文 + 短横线，≤30 字符，例 `user-login-flow`）。
② 立即执行 `npm run artifact:persist -- ensure-task --date {YYYY-MM-DD} --slug {slug} --state intake`，确保 `docs/artifacts/{YYYY-MM-DD}-{slug}/` 和 INDEX 任务行存在。
③ 再执行 `npm run artifact:persist -- ensure-artifact --date {YYYY-MM-DD} --slug {slug} --artifact prd --role tech-lead --status draft --state intake` 创建 `prd.md`。
④ 立即在 `prd.md` 中补全本次 intake 的完整结构化内容（目标、范围、用户故事、风险、待确认项）。
⑤ 完成后输出确认：`已创建 docs/artifacts/{YYYY-MM-DD}-{slug}/prd.md`。
