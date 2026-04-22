---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# AI Eval 平台演示执行记录

本文记录一条 AI / Eval 平台演示路径，重点展示团队如何把 grader、样本、阈值、回归验证和 review 收口连成闭环，避免把评测任务退化成一次性跑脚本。

## 1. 场景定义

### 背景

- 团队准备为问答 Agent 建立更稳定的评测与回归链路
- 当前可以零散跑样本，但没有统一 grader、阈值和 pass@k 口径
- 需要把评测结果升级成团队可协作、可复盘、可继续维护的能力

### 演示目标

- 让观众理解为什么 AI 任务要“先定义 grader，再调实现”
- 让观众理解 `/tdd` 在这里锁的是评测完成标准
- 让观众理解 `/verify` 用来确认回归是否真正达标

## 2. 阶段 1：/team-intake

### 输入

```text
/team-intake
目标：为问答 Agent 建立可持续的评测闭环与回归基线
范围：eval case、grader、执行脚本、结果汇总、测试计划
不做：业务页面重构
约束：必须定义样本范围、pass@k、grader 规则、成本边界和阻塞阈值
```

### 产出

| 字段 | 内容 |
|------|------|
| 任务类型 | 结果质量治理 / Eval 平台建设 |
| 主体对象 | grader、样本、执行链路、verify、review |
| 主要风险 | grader 不稳定、样本偏差、成本过高、结果不可复现 |
| 收口要求 | verify 要给出可进入后续迭代的正式判断 |

## 3. 阶段 2：/team-plan

### 拆解结果

| 模块 | 动作 | 收口位置 |
|------|------|----------|
| 样本层 | 分类整理样本、标注场景与代表性 | eval 数据集 |
| 评分层 | 定义 grader、阈值、pass@k | evaluator / docs |
| 执行层 | 跑批、汇总、生成结果输出 | script / pipeline |
| 验证层 | 复跑关键样本并生成判断 | `/verify` |
| 协作层 | 把结论回写到 review | `/team-review` |

### 关键判断

- 真正的“完成”不是某次运行成功，而是评测标准稳定
- 需要明确哪些失败是阻塞，哪些只是观察项

## 4. 阶段 3：/tdd

### 定义的完成标准

```text
1. grader 规则与样本范围有清晰说明
2. pass@k 或等价指标有达标阈值
3. verify 能复跑关键样本并确认结果
4. review 结论能明确说明当前是否可作为回归基线
5. 成本与预算边界有记录
```

### 价值说明

- 先锁评测标准，避免团队围绕一次性结果争论
- 把成本边界前置，防止回归体系不可持续

## 5. 阶段 4：/team-execute

### 执行批次

#### 批次 A：样本与 grader

- 建立场景样本集
- 编写或调整 grader
- 标记阻塞样本与观察样本

#### 批次 B：执行与汇总

- 跑评测链路
- 汇总 pass@k、失败样本与异常原因
- 记录成本与运行异常

#### 批次 C：文档与测试计划

- 更新 test plan
- 补结果汇总说明
- 给 verify 和 review 准备正式输入

## 6. 阶段 5：/verify

### Verify 结果

| 检查项 | 判断 |
|--------|------|
| 关键样本复跑 | 已完成 |
| pass@k 阈值 | 已核对 |
| grader 一致性 | 已确认 |
| 成本边界 | 已记录 |
| 回归基线 | 可继续维护 |

## 7. 阶段 6：/team-review

### Review 结论

- 当前评测链路已经从“单次实验”升级为“可协作回归机制”
- 后续改 prompt、改工具或改模型时，都应回到这条基线验证

## 8. 校验结果

### 文档静态检查

- 本轮新增 walkthrough 与 execution log 无错误

### 仓库校验

```text
Validation passed.
- Roles: 8
- Shared skills: 3
- ECC skills: 9
- Private overlay skills: not shipped in public repo
- Specialist agents: 27
- Generated artifacts: 70
```

## 9. 推荐搭配材料

- [ai-eval-platform-walkthrough.md](ai-eval-platform-walkthrough.md)
- [../../examples/ai-eval-platform-CLAUDE.md](../../examples/ai-eval-platform-CLAUDE.md)
- [../../examples/vertical-project-conversation-scripts.md](../../examples/vertical-project-conversation-scripts.md)
- [ecc-harness-usage.md](ecc-harness-usage.md)
- [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
