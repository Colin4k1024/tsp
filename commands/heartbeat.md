# /heartbeat

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

查看和管理 heartbeat 发现扫描的结果。

## 主责角色

- `loop-engineer`

## 期望输入



## 标准输出



输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 查看最近的 heartbeat 发现扫描结果。
2. 按类型分类结果（auto-goal/triage/notify/ignore）。
3. 管理 heartbeat 调度配置。
