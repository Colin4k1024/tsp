---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# AI Eval 平台演练

本文演示一个 AI / Eval 平台任务如何从目标澄清、grader 定义、评测闭环、实现到回归验证完整跑通。重点是“先定义评测，再实现”，而不是直接调整 prompt 或 agent。

## 1. 场景

- 团队要为问答 Agent 新增评测闭环与回归基线
- 当前已有基础能力，但缺少 grader、样本范围和 pass@k 口径
- 需要把评测结果稳定回收到 review，而不是只看单次运行表现

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/team-execute`
5. `/verify`
6. `/team-review`

## 3. 第一步：/team-intake

### 输入示例

```text
/team-intake
目标：为问答 Agent 新增评测闭环与回归基线
范围：eval case、grader、执行脚本、结果汇总、测试计划
不做：业务 UI 重构
约束：必须明确 pass@k、grader 口径、样本范围和成本边界
```

### 期望输出重点

- 明确这是结果质量治理任务，而不是普通业务开发
- 锁定成功标准要包含 grader、样本、阈值和回归方式
- 风险重点应是评测口径不稳定、样本偏差、成本失控和结果不可复现

## 4. 第二步：/team-plan

### 应拆解的模块

- grader 定义
- 样本准备与分类
- 执行链路与输出格式
- 回归验证方式
- 结果如何回写到 review / release 或治理记录

### 常见正确拆法

- `architect`：定义评测结构、grader 和指标边界
- `backend-engineer`：实现执行脚本、数据汇总或任务接口
- `qa-engineer`：定义回归口径、样本覆盖和验证结论

## 5. 第三步：/tdd

这一阶段是整条链的关键，至少要先锁：

- grader 定义
- 样本范围与代表性
- 成功阈值
- pass@k 或等价指标
- 哪些结果算阻塞，哪些只是观察项

如果适合 EDD，应显式说明哪些部分要搭配 `eval-harness`。

## 6. 第四步：/team-execute

执行阶段通常包括：

- 实现或调整 grader
- 准备样本和执行脚本
- 跑初始评测并生成结果
- 记录成本、预算和异常样本

输出至少应包含：

- 评测链路变更摘要
- 样本与 grader 摘要
- 当前结果是否达到基线
- 剩余风险与疑似失真点

## 7. 第五步：/verify

Verify 阶段要回答：

- 当前结果是否达到既定阈值
- 哪些样本失败且具有代表性
- pass@k 是否达标
- 哪些结论能作为正式回归基线

## 8. 第六步：/team-review

Review 阶段不是复述运行结果，而是收口：

- 当前评测链路是否足够稳定
- 是否允许进入下一轮功能或发布阶段
- 还缺哪些样本、grader 或成本控制证据

## 9. 常见错误

- 没有先定义 grader 就直接改 prompt 或 agent
- 只看一次运行结果，不保留回归基线
- 把成本问题留到最后，导致评测不可持续

建议配合阅读：[command-and-capability-matrix.md](command-and-capability-matrix.md)、[ecc-harness-usage.md](ecc-harness-usage.md)、[runtime-capabilities-overview.md](runtime-capabilities-overview.md)
