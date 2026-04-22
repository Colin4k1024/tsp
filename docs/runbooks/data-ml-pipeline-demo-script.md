---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 数据与 ML Pipeline 演示剧本

本文是一份可直接照着讲的演示脚本，面向数据口径、任务编排、质量校验、回填边界和下游影响场景。

## 1. 演示目标

- 说明 pipeline 任务为什么不能只看“任务跑完了”
- 说明 `/tdd` 如何前置锁定数据口径、回填和质量标准
- 说明 `/verify` 如何把任务结果、异常样本和下游影响收敛成正式结论

## 2. 适用对象

- 需要介绍数据 / pipeline 交付方式的 Tech Lead
- 需要解释数据口径与回填风险的后端 / 数据负责人
- 需要向团队说明 verify 为什么要看异常样本与窗口约束的讲解人

## 3. 演示时长建议

- 5 分钟：讲数据口径、窗口、回填三类风险
- 10 分钟：再讲 `/tdd` 与 `/verify`
- 15 分钟：完整走一遍 intake -> plan -> tdd -> execute -> verify -> review/release

## 4. 演示脚本

### Step 1. 先用 1 分钟讲清 pipeline 任务在治理什么

建议讲法：

```text
数据 / pipeline 仓库最容易被低估的，不是任务代码，而是数据口径、异常样本、回填窗口和下游影响。
如果这些不前置，任务即使跑完，也不代表可以安全上线。
```

### Step 2. 用 `/team-intake` 讲清任务边界

建议输入：

```text
/team-intake
目标：为数据流水线新增特征计算任务并补齐质量与回填验证
范围：任务编排、转换逻辑、质量校验、结果汇总、测试计划
不做：分析台 UI 改造
约束：必须说明数据口径、批处理窗口、失败重试、回填范围和下游影响
```

### Step 3. 用 `/team-plan` 说明如何拆分数据任务

建议输入：

```text
/team-plan
基于当前 intake 结果，拆任务编排、数据质量、异常样本、回填影响和 release 收口动作。
输出必须指出哪些完成标准应先进入 /tdd，哪些证据最终应由 /verify 汇总。
```

### Step 4. 用 `/tdd` 讲“先锁口径、质量和回填标准”

建议输入：

```text
/tdd
基于当前 /team-plan 结果，先定义数据口径、成功阈值、异常样本、失败重试、回填边界和下游影响的完成标准。
```

### Step 5. 用 `/team-execute` 讲实际收敛动作

建议讲法：

```text
执行阶段通常会先调任务编排和转换逻辑，再补质量校验与结果汇总，最后补回填和下游影响说明。
```

### Step 6. 用 `/verify` 收口

建议输入：

```text
/verify
请基于当前 pipeline 改动，输出任务结果、数据质量、异常样本、回填影响和成本窗口，并整理成可直接进入 /team-review 或 /team-release 的结论。
```

## 5. 建议演示顺序

1. 先讲数据口径、窗口、回填三类风险
2. 再展示 `/team-intake` 与 `/team-plan`
3. 然后讲 `/tdd`
4. 再讲 `/team-execute`
5. 最后讲 `/verify`、`/team-review` 和 `/team-release`

## 6. 演示后建议发给观众的材料

- [data-ml-pipeline-demo-execution-log.md](data-ml-pipeline-demo-execution-log.md)
- [data-ml-pipeline-walkthrough.md](data-ml-pipeline-walkthrough.md)
- [../../examples/data-ml-pipeline-CLAUDE.md](../../examples/data-ml-pipeline-CLAUDE.md)
