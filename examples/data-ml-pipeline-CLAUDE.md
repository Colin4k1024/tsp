# Example Data ML Pipeline CLAUDE.md

适用于数据处理流水线、特征工程仓库、训练 / 推理 pipeline 仓库、批处理编排仓库或数据质量治理平台。

这类项目的重点不是单个页面，而是数据输入、转换链、质量校验、调度依赖、成本窗口和产物可追溯性。

## 适用信号

- 需求经常涉及数据抽取、清洗、特征、训练任务、推理任务、调度、回填或质量告警
- 成功标准常常是任务稳定、数据质量达标、成本可控和结果可追溯
- 项目通常同时关心批处理窗口、失败重跑、下游影响和 release 基线

## 相对通用版的主要差异

### 1. 命令流更强调验证闭环与结果回写

- 建议链路：`/team-intake` -> `/team-plan` -> `/tdd` -> `/team-execute` -> `/verify` -> `/team-review` -> `/team-release`
- 如果平台本身同时维护评测或调度能力，可按需补 `/harness-audit`

### 2. 项目约束更偏数据质量、批处理窗口和回填风险

- 必须说明输入源、转换边界、回填范围、失败重试和下游影响
- 验证不能只看任务完成，还要看数据质量、样本异常和成本窗口
- 产物、数据版本和关键结果必须可追溯

### 3. 角色链路更偏架构、后端 / 数据与 QA

- 默认保留：`tech-lead`、`architect`、`backend-engineer`、`qa-engineer`
- 若有运营台或配置台，再引入 `frontend-engineer`
- 若调度、环境和发布复杂，再引入 `devops-engineer`

## 一份更适合数据 / ML pipeline 仓库的精简成品

````md
# Data ML Pipeline Working Agreement

## 项目定位

- 类型：数据 / ML pipeline 仓库
- 重点：输入源、转换链、质量校验、调度依赖、成本窗口、结果追溯

## 默认角色

- `tech-lead`
- `architect`
- `backend-engineer`
- `qa-engineer`

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/team-execute`
5. `/verify`
6. `/team-review`
7. `/team-release`

## 项目约束

- 必须写清输入源、数据口径、失败重试、回填边界和下游影响
- 验证不仅检查任务完成，还要检查数据质量、异常样本和成本窗口
- review / release 需要记录数据版本、任务窗口和关键结果摘要

## 常用提示模板

```text
/team-intake
目标：为数据流水线新增特征计算任务并补齐质量与回填验证
范围：任务编排、转换逻辑、质量校验、结果汇总、测试计划
不做：分析台 UI 改造
约束：必须说明数据口径、批处理窗口、失败重试、回填范围和下游影响
```

```text
/verify
请基于当前 pipeline 改动，汇总任务结果、数据质量、异常样本、回填影响和成本窗口，并整理成可直接进入 /team-review 或 /team-release 的结论。
```
````

如果当前项目更偏评测和 agent 结果质量，而不是数据处理链，优先看 [ai-eval-platform-CLAUDE.md](ai-eval-platform-CLAUDE.md)。
