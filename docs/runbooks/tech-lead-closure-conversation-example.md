---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Tech Lead 收口对话样例

本文给出一份偏 Tech Lead 视角的成品对话样例，重点展示当 intake、plan、specialist、review、release 都已经出现时，最终应该怎么统一收口，而不是保留多份平行结论。

## 1. 场景

- 任务：审批记录查询能力已经经过 plan、execute、review、release
- 当前输入：存在多个 specialist 结论、QA 结论和发布观察记录
- 目标：形成一次可交付、可回溯的最终收口

## 2. 用户怎么说

```text
请以 tech-lead 视角基于当前 intake、plan、specialist、handoff、review 和 release 结果做最终收口。
输出必须包含：已确认结论、未决问题、阻塞风险、非阻塞风险、下一步动作。
如果 specialist 结论还没有完全回收到主链，也请指出缺口。
```

## 3. 期望结果长什么样

```text
已确认结论
- 审批记录查询接口和列表页已完成实现、自测、QA 验证与灰度发布
- 本次未正式启用 custom overlay
- GitLab 与 Langfuse 仅作为发布 runbook 补充

未决问题
- 旧客户端字段顺序兼容性仍需在下一次版本回顾中确认是否彻底下线

阻塞风险
- 无

非阻塞风险
- 低流量场景下暂未发现结构性问题，但仍需观察一周

specialist 收口情况
- /code-review 结论已回收进 handoff
- /verify 结论已回收进 review
- 无未回收的平行结论

下一步动作
- 由 project-manager 记录版本里程碑
- 由 tech-lead 在版本复盘中跟踪兼容性问题是否关闭
```

## 4. 不合格结果通常长什么样

```text
整体完成，可以结束。
```

这类结果的问题是：

- 没说明还有没有未决问题
- 没说明 specialist 是否真的回收进主链
- 没把后续责任链交代清楚

## 5. Tech Lead 在收口时最容易漏什么

- 把非阻塞风险遗漏掉
- 忘记检查 specialist 是否仍停留在平行结论
- 忘记把发布后观察动作转成后续责任

## 6. 什么时候该用这份样例

- 任务已经跨多个角色和阶段
- 需要正式结束一次交付
- 需要给项目经理、产品或下一个版本留清晰交接

与这些文档配合阅读：[tech-lead-daily-operations.md](tech-lead-daily-operations.md)、[role-prompt-recipes.md](role-prompt-recipes.md)、[handoff-filling-guide-with-examples.md](handoff-filling-guide-with-examples.md)
