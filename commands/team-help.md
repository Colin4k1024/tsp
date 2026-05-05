# /team-help

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

作为 `/team-*` 主链唯一公开入口，根据当前项目阶段、已有 artifacts 与用户目标，推荐下一条最合适的 `/team-*` 或 `/quick` 命令，并指出前置缺口、阻塞项与降级路径。

## 主责角色

- `tech-lead`

## 期望输入

- 当前目标或遇到的问题
- 当前阶段（若已知）
- 已存在的 artifacts / handoff / 测试证据
- 是否为既有项目（brownfield）
- 是否希望走快速模式或完整主链

## 标准输出

- 推荐的下一条命令
- 推荐原因与适用前提
- 进入下一步前必须补齐的证据与 `artifact:persist` 落盘动作
- brownfield 补齐建议
- 若不满足条件时的降级路径

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 先识别用户当前所处阶段：是新需求、挑战会 / 设计收口、准备实现、准备评审、准备发布、观察窗口收口，还是只想处理小范围快速任务。
2. 默认以 `karpathy-guidelines` 的方式先暴露歧义、范围边界与更简单路径，不在入口阶段静默替用户补全高风险假设。
3. 检查现有证据是否齐备：PRD、delivery-plan、arch-design、handoff、execute-log、test-plan、launch-acceptance、deployment-context、release-plan、closeout-summary，以及 `docs/memory/project-context.md`。
4. 若任务边界清晰、影响面小、风险低，优先推荐 `/quick`；否则继续沿 `/team-*` 主链推进。
5. 若是既有项目（brownfield）且现状上下文不足，优先建议执行 `/update-codemaps` 并启用 `doc-architecture`，需要轻量结构证据时选择 Graphify，需要跨模块影响面或 MCP 证据时选择 GitNexus，再把现有模块、集成点、关键数据流和历史包袱回落到 `delivery-plan.md` / `arch-design.md`。
6. 若需求规模较大或涉及多角色并行，实现前先要求把计划切成可独立验收、可独立 handoff 的 story-sized execution units，并确认 `artifact:persist` 已创建对应任务目录与关键 artifact，再进入 `/team-execute`。
7. 若缺少 PRD 或需求边界，推荐 `/team-intake`；若缺少 challenge、design review 或 implementation-readiness，推荐 `/team-plan`；若 readiness proof 与 handoff 齐备，推荐 `/team-execute`；若已完成实现与自测，推荐 `/team-review`；若已获得放行，推荐 `/team-release`；若发布观察窗口结束，推荐 `/team-closeout`。
8. 若是既有项目且上下文不足，提示先补齐 brownfield / doc-architecture 类上下文；必要时用 Graphify 或 GitNexus 补图谱证据，再进入计划或执行。
9. 输出结构化建议：推荐命令、原因、阻塞项、降级路径，并说明是否需要先运行 `npm run workflow:readiness`。
