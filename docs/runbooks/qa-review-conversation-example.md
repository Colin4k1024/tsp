---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# QA 放行对话样例

本文给出一份偏 QA 视角的成品对话样例，重点展示怎样把测试范围、阻塞项、放行建议和残余风险说清楚，而不是只给一句“测试通过”。

## 1. 场景

- 任务：审批记录查询接口与列表页已经完成研发自测
- 当前输入：已有 handoff、研发自测结果、已知风险
- 目标：形成一次正式 `/team-review` 结论

## 2. 用户怎么说

```text
/team-review
请以 qa-engineer 视角基于当前 handoff、自测结果和风险说明，输出测试结论、阻塞项、放行建议和残余风险。
如果存在 custom overlay 或发布扩展要求，也请说明是否需要额外验证证据。
```

## 3. 期望结果长什么样

```text
测试范围
- 功能查询、分页、筛选、空结果、异常提示
- 权限边界：有权限、无权限、非法参数
- 回归范围：审批记录旧查询入口和导出入口未受影响

评审结论
- 结论：有条件通过

阻塞项
- 无

非阻塞风险
- 旧客户端字段顺序兼容性建议在发布前再做一次 smoke

放行建议
- 可以进入 /team-release
- 发布前补一次兼容性 smoke

附加验证要求
- 本次未启用 custom overlay
- 发布阶段若启用 Langfuse 追踪，应把 trace 结果作为观察证据补回 release
```

## 4. 不合格结果通常长什么样

```text
测试通过，可以发布。
```

这类结果的问题是：

- 没写测试范围
- 没区分阻塞项和非阻塞风险
- 没说明为什么可以放行

## 5. QA 在对话里最容易漏什么

- 权限边界和异常路径
- 回归范围
- 发布前还要补的验证动作
- overlay / runbook / toolkit 是否需要额外证据

## 6. 继续推进时怎么说

如果 QA 结论已经形成，下一句通常是：

```text
基于当前 QA 结论继续执行 /team-release。
请把放行建议、观察窗口、回滚条件和责任链整理出来。
```

如果 QA 发现阻塞项，下一句通常是：

```text
请把阻塞项整理成一次正式 /handoff，交给 backend-engineer 和 tech-lead 继续处理。
```

与这些文档配合阅读：[qa-engineer-daily-operations.md](qa-engineer-daily-operations.md)、[team-review-example.md](team-review-example.md)、[role-prompt-recipes.md](role-prompt-recipes.md)
