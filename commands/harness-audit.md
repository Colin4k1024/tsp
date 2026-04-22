# /harness-audit

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

检查 Harness 配置的完整性和有效性，输出 7 维度评分和改进建议。

## 主责角色

- `harness-optimizer`

## 期望输入



## 标准输出

- Overall Score
- Dimension Scores
- Top Actions
- Recommendations

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 评估 Agent Coverage（代理覆盖）。
2. 评估 Skill Completeness（技能完整性）。
3. 评估 Hook Effectiveness（Hook 有效性）。
4. 评估 Rule Enforcement（规则执行）。
5. 评估 Command Coverage（命令覆盖）。
6. 评估 Documentation Quality（文档质量）。
7. 评估 Integration Depth（集成深度）。
8. 输出改进建议和优先级。
