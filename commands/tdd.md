# /tdd

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

使用 TDD specialist 帮助建立测试先行的实现节奏。

## 主责角色

- `tdd-guide`

## 期望输入

- 功能目标
- 现有测试缺口
- 相关接口或行为说明

## 标准输出

- 测试优先计划
- 建议的 red-green-refactor 步骤
- 回归验证重点

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 识别可先测试的外部行为与边界态。
2. 先产出测试切入点，再规划最小实现路径。
3. 把测试计划回交给研发角色或 QA 消费。
