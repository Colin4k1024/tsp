# /plan

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

调用 specialist planners 产出更细粒度的实施方案，并把结果回落到团队角色交接模型。

## 主责角色

- `planner`

## 期望输入

- 目标、约束、现有上下文
- 风险与边界条件

## 标准输出

- 实施计划
- 阶段拆解
- 需要回交给 `tech-lead` 的决策点

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 聚焦实现策略、拆解阶段和依赖顺序。
2. 明确哪些结论属于 specialist 建议，哪些需要角色或 `tech-lead` 决策。
3. 通过 `/handoff` 或 `/team-plan` 把结果回落到团队主链。
