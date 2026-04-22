---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Claude 新功能开发指南

本文说明在 Claude 中如何用 Team Skills Platform 跑一条完整的新功能开发链路，适合日常功能开发而不是仅做快速试验。

如果你想先看新增命令与能力映射，先看 [command-and-capability-matrix.md](command-and-capability-matrix.md)。如果你想先理解后台机制怎样影响长会话，再看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

## 1. 适用场景

- 需要明确范围、依赖和角色分工的新功能
- 需要前后端协作或至少涉及 QA 验证
- 希望把 specialist 作为辅助，而不是主链替代品

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/team-execute`
4. `/handoff`
5. `/team-review`
6. `/team-release`

如果任务很小，可把 `/team-release` 留到需要真正发布时再进入。

## 3. 第一步：锁定目标和约束

典型输入：

```text
/team-intake
目标：新增订单导出功能
范围：导出接口、前端触发按钮、测试计划
不做：导出模板重构、历史数据修复
约束：需要评估是否涉及权限中心
```

Claude 里这一段最关键的不是“需求描述多完整”，而是把 `范围`、`不做` 和 `约束` 写清楚。

## 4. 第二步：拆解角色与交付物

进入 `/team-plan` 时，建议显式要求输出：

- 任务拆解
- 依赖关系
- handoff 最小交付物
- custom overlay 是否启用

如果 plan 没写交付物，后续 Claude 很容易在长对话中丢信息。

## 5. 第三步：执行与 specialist 配合

Claude 中使用 specialist 的原则：

- 先跑主链，再插入 specialist
- specialist 只负责专项结论
- specialist 结果必须回到 `/handoff` 或 `/team-*`

常见组合：

- 方案复杂：`/plan`
- 想先锁测试：`/tdd`
- 代码改完：`/code-review`
- 构建失败：`/build-fix`
- 最终验证：`/verify`

推荐顺序通常是：

1. `/team-intake`
2. `/team-plan`
3. 如果需求边界已清楚且返工成本高，补 `/tdd`
4. `/team-execute`
5. `/handoff`
6. `/team-review`

## 6. 第四步：交接与 QA

进入 `/handoff` 时，至少要覆盖：

- 改了什么
- 自测了什么
- 剩余风险是什么
- QA 接手时最该关注什么

如果功能涉及 custom overlay，还要把 `技能装配清单` 或 `领域扩展执行记录` 合并进去。

## 7. 第五步：收口与发布

`/team-review` 应该输出：

- 测试范围
- 测试结论
- 阻塞项
- 是否建议放行

是否进入 `/team-release`，由任务是否真正触及发布窗口决定。

## 8. 常见错误

- 直接从实现开始，跳过 intake 和 plan
- 该先用 `/tdd` 锁测试与成功标准，却直接进入实现
- 把 specialist 当最终决策者
- handoff 只有一句“已完成开发”
- custom overlay 被用到了，但没有记录启用原因和执行结果

需要完整实例时，继续看 [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md)。如果你想看 specialist 的边界，继续看 [specialist-commands-playbook.md](specialist-commands-playbook.md)。
