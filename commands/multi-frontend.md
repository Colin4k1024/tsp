# /multi-frontend

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

针对前端复杂改版、跨页面交互或多前端子域任务做专门编排。

## 主责角色

- `planner`

## 期望输入

- 前端范围
- 设计与接口约束
- 交付窗口

## 标准输出

- 前端子任务拆解
- 页面/组件责任边界
- 前端验证链路

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 优先识别页面、组件、状态、接口和设计系统五个维度。
2. 联动 `frontend-engineer`、`qa-engineer` 和前端 specialists。
3. 结果必须回落到 `/team-plan`、`/team-execute`、`/team-review`。
