---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Product Manager 需求澄清对话样例

本文给出一份偏 Product Manager 视角的成品对话样例，重点展示怎样把业务语言整理成能直接进入 `/team-intake` 的输入，而不是停留在模糊需求层。

## 1. 场景

- 任务：业务方提出“审批记录查询太难用，需要优化”
- 当前输入：只有业务诉求，没有清晰范围和验收标准
- 目标：把需求整理成可进入主链的澄清结果

## 2. 用户怎么说

```text
请以 product-manager 视角整理当前需求。
输出：业务目标、核心用户场景、In Scope、Out of Scope、验收标准、待确认事项。
最后补一段：这些内容怎样进入 /team-intake。
```

## 3. 期望结果长什么样

```text
业务目标
- 让运营同学能更快查询审批记录，降低人工翻找成本

核心用户场景
- 运营按订单号、审批状态、创建时间筛选审批记录
- 运营查看空结果和异常提示时能快速判断下一步动作

In Scope
- 审批记录查询列表页
- 后端查询接口
- 分页、筛选、空态和错误态

Out of Scope
- 审批流程定义改造
- 历史数据回填
- 导出能力新增

验收标准
- 支持按订单号、状态、时间范围查询
- 无结果时有明确空态提示
- 无权限时有明确错误提示

待确认事项
- 是否需要兼容旧查询入口的字段顺序
- 是否存在特定角色的权限差异

进入 /team-intake 的建议
- 目标：新增审批记录查询能力
- 范围：列表页、查询接口、测试计划
- 不做：流程定义改造、历史数据回填、导出新增
- 约束：判断是否涉及权限中心或 custom overlay
```

## 4. 不合格结果通常长什么样

```text
需求是把审批记录查询做好一点。
```

这类结果的问题是：

- 没有用户场景
- 没有范围边界
- 没有验收标准

## 5. Product Manager 在对话里最容易漏什么

- Out of Scope
- 可测的验收标准
- 待确认事项
- 这些内容如何回落成 `/team-intake` 输入

## 6. 继续推进时怎么说

当澄清结果形成后，下一句通常是：

```text
请基于上面的需求澄清结果继续执行 /team-intake，输出参与角色、风险和下一步建议。
```

与这些文档配合阅读：[product-manager-daily-operations.md](product-manager-daily-operations.md)、[requirement-clarity-and-scope-walkthrough.md](requirement-clarity-and-scope-walkthrough.md)、[role-prompt-recipes.md](role-prompt-recipes.md)
