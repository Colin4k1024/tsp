---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 数据与 ML Pipeline 演练

本文演示一个以数据口径、任务编排、质量校验、回填影响和结果追溯为核心的数据 / ML pipeline 仓库，如何从边界澄清到验证收口完整跑通。

## 1. 场景

- 仓库当前主要维护数据处理任务、特征计算、批处理窗口和结果汇总
- 团队准备新增一个特征计算任务，并同步补齐质量验证、回填边界和下游影响说明
- 目标不是改分析台页面，而是把 pipeline 变更治理成可验证、可回溯、可发布的状态

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/team-execute`
5. `/verify`
6. `/team-review`
7. `/team-release`

## 3. 第一步：/team-intake

### 输入示例

```text
/team-intake
目标：为数据流水线新增特征计算任务并补齐质量与回填验证
范围：任务编排、转换逻辑、质量校验、结果汇总、测试计划
不做：分析台 UI 改造
约束：必须说明数据口径、批处理窗口、失败重试、回填范围和下游影响
```

### 期望输出重点

- 识别这是数据 / pipeline 治理任务，而不是普通后端需求
- 明确参与角色至少包括 `tech-lead`、`architect`、`backend-engineer`、`qa-engineer`
- 风险应聚焦数据口径不清、回填影响不明、异常样本失控和下游依赖未评估

## 4. 第二步：/team-plan

### 需要拆清的动作

- 任务编排和依赖调整
- 数据口径与转换边界说明
- 质量校验、异常样本与重试策略
- 回填范围、批处理窗口与下游影响
- review、release 中需要记录的结果摘要

### 合格输出应该回答

1. 哪些改动影响任务编排
2. 哪些影响数据口径和质量判断
3. 哪些影响回填和下游结果
4. 哪些证据需要 verify 最终确认

## 5. 第三步：/tdd

在这类仓库里，`/tdd` 重点是先锁数据与任务完成标准：

- 数据口径和成功阈值是否明确
- 异常样本、失败重试和回填范围是否明确
- 哪些结果必须进入 review 或 release
- 哪些成本或窗口限制需要被记录

## 6. 第四步：/team-execute

执行阶段通常包含：

- 调整任务编排与转换逻辑
- 补质量校验、异常样本和结果汇总
- 记录批处理窗口、重试结果和回填影响
- 更新 review / release 摘要和测试计划

本阶段输出至少应包含：

- pipeline 变更摘要
- 数据质量与异常样本摘要
- 回填和下游影响摘要
- 剩余风险和例外项

## 7. 第五步：/verify

Verify 阶段要回答：

- 任务是否按预期运行
- 数据质量是否达标
- 异常样本和失败重试是否可解释
- 回填范围和下游影响是否被确认
- 是否满足 release 或继续迭代的条件

## 8. 第六步：/team-review 与 /team-release

### Review 阶段要回答

- 当前是否还存在阻塞变更的质量或口径问题
- 哪些回填或下游影响可以暂时接受
- 哪些风险必须进入发布观察

### Release 阶段要回答

- 任务何时上线
- 批处理窗口和回填窗口如何安排
- 若结果异常，如何回退任务或暂停下游消费

## 9. 常见错误

- 只看任务运行成功，不看数据质量和异常样本
- 没说明回填范围和下游影响
- verify 没有形成正式结论，只留下运行日志

建议配合阅读：[command-and-capability-matrix.md](command-and-capability-matrix.md)、[backend-engineer-daily-operations.md](backend-engineer-daily-operations.md)、[qa-engineer-daily-operations.md](qa-engineer-daily-operations.md)
