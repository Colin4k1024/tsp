# Example AI Eval Platform CLAUDE.md

适用于 AI 应用平台、模型评测平台、提示词工程平台、Agent 编排平台或 Eval 驱动开发仓库。

这类项目的核心不是单个业务 CRUD，而是任务定义、评测闭环、pass@k、数据集、运行成本和结果可解释性。

## 适用信号

- 需求经常涉及 prompt、agent、eval、benchmark、grader、dataset 或 pass@k
- 成功标准不是单纯“功能能跑”，而是“结果达标且可回归验证”
- runtime 成本、上下文预算和长会话稳定性会影响项目设计

## 相对通用版的主要差异

### 1. `/tdd` 与 `eval-harness` 会更高频

- `/tdd` 用来先锁评测口径、成功标准和回归边界
- `eval-harness` 用来承接 EDD、pass@k 和基线回归
- `/verify` 负责收最终验证证据

### 2. 命令流更强调“先定义评测，再实现”

- 建议链路：`/team-intake` -> `/team-plan` -> `/tdd` -> `/team-execute` -> `/verify` -> `/team-review`
- 若平台本身是 agent / skill 仓库，可再补 `/harness-audit`

### 3. 项目约束更偏结果质量和成本

- 必须写清 grader 口径、数据集范围、评测样本和成功阈值
- 必须说明哪些能力依赖 runtime 预算、cost tracking 或 compact
- prompt、agent 或 eval 调整后必须保留回归结论，而不是只展示单次运行结果

## 一份更适合 AI / Eval 平台的精简成品

````md
# AI Eval Platform Working Agreement

## 项目定位

- 类型：AI 应用 / 评测平台 / Agent 编排平台
- 重点：任务定义、评测闭环、pass@k、成本控制、回归验证

## 默认角色

- `tech-lead`
- `architect`
- `backend-engineer`
- `qa-engineer`
- 若涉及界面与运营台，再引入 `frontend-engineer`

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/team-execute`
5. `/verify`
6. `/team-review`

## 项目约束

- 先定义 grader、样本范围、成功阈值，再开始实现
- Prompt、agent 或 eval 变更后必须保留回归结论
- 必须说明哪些能力依赖成本预算、上下文压缩或 runtime 机制

## 常用提示模板

```text
/team-intake
目标：为问答 Agent 新增评测闭环与回归基线
范围：eval case、grader、执行脚本、结果汇总、测试计划
不做：业务 UI 重构
约束：必须明确 pass@k、grader 口径、样本范围和成本边界
```

```text
/tdd
基于当前需求，先定义 grader、样本范围、成功阈值和回归边界。
如果适合 eval-driven development，也请说明哪些环节应搭配 eval-harness。
```
````

继续阅读：看 [../docs/runbooks/command-and-capability-matrix.md](../docs/runbooks/command-and-capability-matrix.md) 和 [../docs/runbooks/ecc-harness-usage.md](../docs/runbooks/ecc-harness-usage.md)。
