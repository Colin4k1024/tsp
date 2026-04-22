# /build-fix

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

使用 build-error specialists 分析并修复构建、编译或测试失败。

## 主责角色

- `build-error-resolver`

## 期望输入

- 错误日志
- 构建命令
- 相关模块上下文

## 标准输出

- 失败归因
- 修复建议
- 建议的验证命令

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 先归因失败类型，再决定是否切到语言专项 resolver。
2. 优先给出最小修复路径和验证命令。
3. 完成后把结果回交给实现角色或 `tech-lead`。
