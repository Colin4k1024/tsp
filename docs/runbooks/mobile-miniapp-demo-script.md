---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 移动端与小程序交付演示剧本

本文是一份可直接照着讲的演示脚本，面向移动端 / 小程序项目的终端边界、弱网、权限路径、多尺寸适配和 QA 验证场景。

## 1. 演示目标

- 说明移动端项目为什么不能只讲桌面端 happy path
- 说明 `/tdd` 如何前置锁定终端风险与异常态
- 说明 `/multi-frontend` 如何帮助并行识别交互、适配和 QA 风险

## 2. 适用对象

- 需要介绍移动端交付方法的 Tech Lead
- 需要讲终端适配与 QA 协作的前端负责人
- 需要向团队解释 handoff 为什么必须写清终端范围的讲解人

## 3. 演示时长建议

- 5 分钟：只讲终端边界、弱网、权限三类风险
- 10 分钟：再讲 `/tdd` 与 `/multi-frontend`
- 15 分钟：完整走一遍 intake -> plan -> tdd -> multi-frontend -> execute -> handoff -> review

## 4. 演示脚本

### Step 1. 先用 1 分钟讲清移动端交付的风险在哪

建议讲法：

```text
移动端项目最容易被低估的不是页面本身，而是终端差异、弱网、权限拒绝和容器环境差异。
如果这些不前置，最后 QA 和上线阶段才会集中暴露问题。
```

配套材料：

- [frontend-engineer-daily-operations.md](frontend-engineer-daily-operations.md)
- [qa-engineer-daily-operations.md](qa-engineer-daily-operations.md)

### Step 2. 用 `/team-intake` 讲清任务范围和边界

建议输入：

```text
/team-intake
目标：新增移动端报销申请页与提交流程
范围：页面结构、表单交互、授权路径、多尺寸适配、测试计划
不做：后端流程引擎改造
约束：必须覆盖弱网、拒绝态、加载态、真机范围和容器差异
```

讲解重点：

- 终端范围和异常态必须在 intake 就说清楚
- 不然 plan 和 handoff 都会失焦

### Step 3. 用 `/team-plan` 讲如何拆交付任务

建议输入：

```text
/team-plan
基于当前 intake 结果，拆页面结构、终端适配、权限路径、弱网验证、QA 回归和 handoff 节点。
输出必须指出哪些风险先进入 /tdd，哪些内容适合通过 /multi-frontend 并行分析。
```

讲解重点：

- 不能只拆前端开发动作
- QA 验证范围和 handoff 节点必须提前进入计划

### Step 4. 用 `/tdd` 讲“先锁终端与异常态标准”

建议输入：

```text
/tdd
基于当前 /team-plan 结果，先锁机型范围、容器范围、弱网场景、权限拒绝态、加载态、异常态和成功标准。
```

讲解重点：

- `/tdd` 在这里锁的是多终端交付标准
- 这样可以避免后面只剩 UI 表面讨论

### Step 5. 用 `/multi-frontend` 讲并行识别风险

建议输入：

```text
/multi-frontend
基于当前 intake 或 tdd 结果，从交互体验、终端适配、QA 风险三个视角并行拆解，并整理成可直接进入 /handoff 的内容。
```

讲解重点：

- 交互、适配、QA 三个视角适合并行，不必串行等待
- 最终结果要落到 handoff，而不是停留在并行分析里

### Step 6. 用 `/team-execute`、`/handoff`、`/team-review` 收尾

建议讲法：

```text
执行阶段重点是把真机范围、弱网结果、权限拒绝行为和剩余风险写清楚；
handoff 要让 QA 能直接接住；
review 再决定还有没有阻塞上线的终端风险。
```

## 5. 建议演示顺序

1. 先讲终端边界、弱网、权限三类风险
2. 再展示 `/team-intake` 与 `/team-plan`
3. 然后讲 `/tdd`
4. 再讲 `/multi-frontend`
5. 最后讲 `/team-execute`、`/handoff` 和 `/team-review`

## 6. 演示后建议发给观众的材料

- [mobile-miniapp-demo-execution-log.md](mobile-miniapp-demo-execution-log.md)
- [mobile-miniapp-delivery-walkthrough.md](mobile-miniapp-delivery-walkthrough.md)
- [../../examples/mobile-miniapp-CLAUDE.md](../../examples/mobile-miniapp-CLAUDE.md)
