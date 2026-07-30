# /loop-start

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

启动循环任务，设置目标、收敛条件和预算。

## 主责角色

- `loop-engineer`

## 期望输入



## 标准输出



输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 读取 .tsp/loop.yaml 或交互式收集循环任务规格。
2. 验证收敛条件和预算设置。
3. 启动循环任务并注册 heartbeat。
