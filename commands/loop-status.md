# /loop-status

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

查看循环任务的当前状态、迭代进度和预算消耗。

## 主责角色

- `loop-engineer`

## 期望输入



## 标准输出



输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 读取循环任务状态文件。
2. 报告迭代次数、收敛趋势和预算消耗。
3. 给出继续/暂停/升级建议。
