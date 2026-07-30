---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 多服务后端集成演练

本文面向后端或全栈项目，演示一个涉及多个服务或多个模块的集成任务应该怎样拆解、执行和验证。

## 1. 场景

- 任务：订单服务新增审批记录查询能力，并与权限服务联动
- 涉及：接口契约、权限判断、测试和发布风险
- 可能命中：custom overlay 候选项

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/multi-backend`
4. `/team-execute`
5. `/verify`
6. `/handoff`
7. `/team-review`

## 3. intake 阶段要锁定什么

- 哪些服务或模块会受影响
- 接口契约由谁收口
- 是否命中 私有流程或权限集成 这类 overlay 候选项

## 4. multi-backend 阶段要输出什么

- 服务边界
- 数据流
- 测试策略
- 发布和回滚风险

## 5. execute 阶段要特别记录什么

- 接口兼容性说明
- 集成测试结果
- 权限边界结果
- 如果启用了 custom overlay，补执行记录

## 6. verify 阶段要特别验证什么

- 跨服务调用是否通
- 错误路径是否一致
- 关键边界态是否被覆盖

## 7. 常见错误

- 只有本服务视角，没有跨服务依赖视角
- 接口改了，但没有给消费方明确 handoff
- custom overlay 已经命中，却没有任何记录

与后端日常说明配合阅读：[backend-engineer-daily-operations.md](backend-engineer-daily-operations.md)
