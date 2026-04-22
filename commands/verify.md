# /verify

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

运行 verification specialists，对结论、实现和交付证据做持续验证。

## 主责角色

- `loop-operator`

## 期望输入

- 目标结论
- 验证标准
- 现有证据与命令

## 标准输出

- 验证记录
- 未覆盖风险
- 是否建议继续迭代

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 明确验证标准、停机条件，以及本轮需要补齐的证据。
2. 逐轮区分哪些结论已经验证、哪些仍是未验证推测，不把计划当成证据。
3. 若出现证据缺口、结果冲突或复现不稳定，先停在事实收集和验证，不要继续边猜边改。
4. 把每一轮的验证结论回交给 `/handoff`、`/team-review` 或 `/team-release`，让主链能消费这些证据。
