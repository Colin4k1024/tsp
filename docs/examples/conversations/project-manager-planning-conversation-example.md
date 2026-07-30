---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Project Manager 计划推进对话样例

本文给出一份偏 Project Manager 视角的成品对话样例，重点展示怎样把目标、依赖、里程碑和阻塞项整理成可执行的推进计划。

## 1. 场景

- 任务：审批记录查询需求已经完成 intake
- 当前输入：目标、范围、参与角色已经明确
- 目标：形成可执行的阶段计划和 handoff 节点

## 2. 用户怎么说

```text
请以 project-manager 视角拆当前任务。
输出：里程碑、关键依赖、角色协作顺序、风险、升级条件。
如果存在并行开发，请说明哪些 handoff 必须提前约定。
```

## 3. 期望结果长什么样

```text
里程碑
- M1：architect 确认接口契约与权限边界
- M2：backend-engineer 完成接口实现与自测
- M3：frontend-engineer 完成列表页与筛选交互
- M4：qa-engineer 完成功能与权限回归

关键依赖
- 接口契约先于前后端联调
- 权限边界先于 QA 用例冻结

角色协作顺序
- architect -> backend-engineer / frontend-engineer -> qa-engineer -> devops-engineer

风险
- 接口字段若晚变更，会影响联调和 QA 用例
- 权限口径若晚确认，会导致回归重复执行

升级条件
- 若接口契约在开发开始后仍频繁变更，升级给 tech-lead
- 若 QA 回归窗口不足，提前升级给 tech-lead 和 devops-engineer

必须提前约定的 handoff
- architect 到研发：接口契约、字段口径、权限边界
- 研发到 QA：实现结果、自测证据、已知风险
```

## 4. 不合格结果通常长什么样

```text
这周先做开发，下周测一下。
```

这类结果的问题是：

- 没有依赖顺序
- 没有阻塞条件
- 没有 handoff 节点

## 5. Project Manager 在对话里最容易漏什么

- QA 和 release 的时间窗口
- 明确的升级条件
- 对 handoff 的前置约束

## 6. 继续推进时怎么说

当阶段计划形成后，下一句通常是：

```text
请把上面的计划整理成可直接进入 /team-plan 的输出格式，包含角色职责、依赖、handoff 节点和风险。
```

与这些文档配合阅读：[project-manager-daily-operations.md](project-manager-daily-operations.md)、[parallel-development-coordination-walkthrough.md](parallel-development-coordination-walkthrough.md)、[role-prompt-recipes.md](role-prompt-recipes.md)
