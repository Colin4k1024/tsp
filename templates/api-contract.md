# API Contract 模板

参考：API 契约写法可结合 [../docs/runbooks/api-design-evolution-walkthrough.md](../docs/runbooks/api-design-evolution-walkthrough.md)、[../docs/runbooks/api-lint-gates.md](../docs/runbooks/api-lint-gates.md)、[../docs/runbooks/api-breaking-change-gates.md](../docs/runbooks/api-breaking-change-gates.md) 与 [../docs/runbooks/contract-testing-playbook.md](../docs/runbooks/contract-testing-playbook.md)。

## 1. 接口概览

- 接口名称：
- 所属域：
- 所属服务（Service Catalog 对应项）：
- 调用方：
- 鉴权要求：

## 2. 请求

- Method / Path：
- Query / Path Params：
- Body Schema：

## 3. 响应

- 成功响应：
- 错误码：
- 幂等/重试约束：

## 4. 兼容性

- 版本策略：
- OpenAPI lint 结果：
- Breaking change 检查：
- Contract testing 计划 / 结果：
- 向后兼容要求：
- 变更同步对象：

## 5. 领域与通信映射

- 上游服务 / 下游服务：
- 通信方式：同步（REST/gRPC）/ 异步（Event/Message）
- 数据主权（Source of Truth）：
- 关联事件（若有）：

## 6. 一致性检查（评审时填写）

- 与 `arch-design.md` 服务名一致：是 / 否
- 与事件定义一致：是 / 否 / 不适用
- 与鉴权范围一致：是 / 否
- 待修正项：
