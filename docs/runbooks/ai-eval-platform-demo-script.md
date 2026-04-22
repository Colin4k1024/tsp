---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# AI Eval 平台演示剧本

本文是一份可直接照着讲的演示脚本，面向 AI / Eval 平台、grader、样本范围、pass@k、回归验证和成本边界场景。

## 1. 演示目标

- 说明 AI 任务为什么要先定义 grader 和阈值，再调实现
- 说明 `/tdd` 在这里锁的是评测完成标准
- 说明 `/verify` 如何把一次运行结果升级成回归基线

## 2. 适用对象

- 需要介绍 Eval 平台建设思路的 Tech Lead
- 需要解释 grader、样本和验证闭环的讲解人
- 需要把评测结果回收到 review 的工程负责人

## 3. 演示时长建议

- 5 分钟：只讲 grader、样本、阈值三件事
- 10 分钟：再讲 `/tdd` 与 `/verify`
- 15 分钟：完整走一遍 intake -> plan -> tdd -> execute -> verify -> review

## 4. 演示脚本

### Step 1. 先用 1 分钟讲清 Eval 任务的核心不是“跑一下结果”

建议讲法：

```text
AI / Eval 平台最容易犯的错，是先改 prompt 或 agent，再回头补评测。
正确顺序是先定义 grader、样本和阈值，再决定实现怎么改。
```

配套材料：

- [ecc-harness-usage.md](ecc-harness-usage.md)
- [runtime-capabilities-overview.md](runtime-capabilities-overview.md)

### Step 2. 用 `/team-intake` 讲清任务边界

建议输入：

```text
/team-intake
目标：为问答 Agent 建立可持续的评测闭环与回归基线
范围：eval case、grader、执行脚本、结果汇总、测试计划
不做：业务页面重构
约束：必须定义样本范围、pass@k、grader 规则、成本边界和阻塞阈值
```

讲解重点：

- 这是结果质量治理，不是普通功能开发
- 成本边界要和质量边界一起定义

### Step 3. 用 `/team-plan` 讲清如何拆样本、grader 和验证

建议输入：

```text
/team-plan
基于当前 intake 结果，拆样本准备、grader 定义、执行链路、verify 验证和 review 收口动作。
输出必须指出哪些口径先进入 /tdd。
```

讲解重点：

- 样本、grader、执行、verify、review 是五个不同层次
- 不能把 verify 混成“再跑一次脚本”

### Step 4. 用 `/tdd` 讲“先锁评测标准”

建议输入：

```text
/tdd
基于当前 /team-plan 结果，先定义 grader、样本范围、pass@k 阈值、阻塞条件和成本边界。
如果适合 eval-driven development，也请说明哪些部分应搭配 eval-harness。
```

讲解重点：

- `/tdd` 在这里锁的是评测基线
- 这样后续讨论的是“是否达标”，不是“感觉怎么样”

### Step 5. 用 `/team-execute` 讲执行阶段做什么

建议讲法：

```text
执行阶段会调整 grader、整理样本、跑评测链路、汇总失败样本，并记录成本与异常点。
```

### Step 6. 用 `/verify` 讲回归基线如何成立

建议输入：

```text
/verify
请基于当前实现与评测结果，输出回归结论、关键风险、是否达到当前 pass@k 基线，以及还缺哪些验证证据。
```

讲解重点：

- verify 的目标是确认基线是否成立
- 没有 verify，结果就很容易停留在一次性实验

### Step 7. 用 `/team-review` 收尾

建议讲法：

```text
最终 review 不是复述一个分数，而是判断这套评测链是否足够稳定，可以承接下一轮优化与回归。
```

## 5. 建议演示顺序

1. 先讲 grader、样本、阈值
2. 再展示 `/team-intake` 与 `/team-plan`
3. 然后讲 `/tdd`
4. 再讲 `/team-execute`
5. 最后讲 `/verify` 与 `/team-review`

## 6. 演示后建议发给观众的材料

- [ai-eval-platform-demo-execution-log.md](ai-eval-platform-demo-execution-log.md)
- [ai-eval-platform-walkthrough.md](ai-eval-platform-walkthrough.md)
- [../../examples/ai-eval-platform-CLAUDE.md](../../examples/ai-eval-platform-CLAUDE.md)
