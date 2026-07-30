# /graph-impact

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

分析代码变更的影响面，追踪调用链和依赖关系，输出结构化的影响评估报告。

## 主责角色

- `graph-engineer`

## 期望输入

- 代码变更范围
- 分析深度要求

## 标准输出

- 影响面分析报告
- 调用链证据
- 验证建议

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 通过 CodeGraph 分析变更文件的直接和间接依赖。
2. 追踪调用链，标注每一步的 file:line 证据。
3. 按影响程度分级输出报告。
