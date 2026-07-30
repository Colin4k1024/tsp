---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 移动端与小程序交付演练

本文演示一个移动端 / 小程序需求如何从终端边界澄清、交互约束、适配拆解、实现、自测到 QA 收口完整跑通。重点是多终端和弱网边界，而不是只看桌面端页面开发。

## 1. 场景

- 任务：新增移动端报销申请页与提交流程
- 项目主要运行在手机和企业移动容器中
- 风险集中在弱网、终端权限、交互反馈和多尺寸适配

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/multi-frontend`
5. `/team-execute`
6. `/handoff`
7. `/team-review`

## 3. 第一步：/team-intake

### 输入示例

```text
/team-intake
目标：新增移动端报销申请页与提交流程
范围：页面布局、表单交互、终端权限、测试计划
不做：后端流程改造
约束：必须说明多尺寸适配、弱网、授权路径、拒绝态和加载反馈
```

### 期望输出重点

- 明确终端范围、机型范围和容器范围
- 锁定权限路径、拒绝态、网络异常态和加载态
- 判断是否需要额外引入 `backend-engineer` 或 `architect`

## 4. 第二步：/team-plan

### 应拆解的内容

- 页面和表单结构
- 授权路径和拒绝态
- 多尺寸与横竖屏适配
- QA 真机 / 模拟器 / 弱网验证范围
- handoff 中需要保留的终端风险说明

### 计划中最容易漏的内容

- 容器差异
- 弱网下的加载和重试
- 权限拒绝后的兜底方案

## 5. 第三步：/tdd

在移动端项目里，`/tdd` 建议优先锁定：

- 机型与尺寸范围
- 弱网场景
- 权限拒绝态
- 空态、异常态、加载态
- 成功提交与失败回退行为

## 6. 第四步：/multi-frontend

Multi-fronted 阶段建议并行拆成：

- 交互体验
- 终端适配
- QA 风险

输出最终要回到 handoff，至少包含：

- 已确认终端行为
- 剩余适配风险
- QA 重点回归链路

## 7. 第五步：/team-execute 与 /handoff

执行阶段要沉淀：

- 代码改动摘要
- 多终端自测范围
- 权限授权 / 拒绝行为
- 弱网和加载反馈结果

handoff 中则要把这些内容整理成 QA 能直接接住的结构化结论。

## 8. 第六步：/team-review

Review 阶段要回答：

- 哪些终端和场景已验证
- 是否还存在阻塞上线的终端风险
- 哪些问题可以留到下一轮优化

## 9. 常见错误

- 只验证 happy path，不验证弱网和拒绝态
- 只看浏览器模拟，不说明真机范围
- handoff 不写终端差异，导致 QA 只能重新摸索验证范围

建议配合阅读：[frontend-engineer-daily-operations.md](frontend-engineer-daily-operations.md)、[qa-engineer-daily-operations.md](qa-engineer-daily-operations.md)、[specialist-commands-playbook.md](specialist-commands-playbook.md)
