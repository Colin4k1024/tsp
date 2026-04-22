# /multi-backend

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

针对多服务、多模块或多数据边界的后端任务做编排。

## 主责角色

- `planner`

## 期望输入

- 服务边界
- 接口与数据影响
- 依赖与发布约束

## 标准输出

- 后端子任务拆解
- 依赖顺序
- 验证与发布注意项

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 先拆服务和模块边界，再拆验证与发布链。
2. 必要时联动 architecture、database 和 language specialists。
3. 结果回落到主团队交付链。
