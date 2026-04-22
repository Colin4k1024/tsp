---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 数据与 ML Pipeline 演示执行记录

本文记录一条数据 / ML pipeline 演示路径，重点展示团队如何把任务编排、数据质量、异常样本、回填边界和 release 收口整理成正式治理链路。

## 1. 场景定义

### 背景

- 仓库当前维护批处理任务、特征计算和结果汇总
- 团队准备新增一个特征计算任务，并同步补齐质量验证和回填说明
- 希望避免“任务能跑，但质量和下游影响说不清”的交付状态

### 演示目标

- 让观众理解任务结果、数据质量和回填影响不是一个结论
- 让观众看到 `/tdd` 如何前置锁定数据标准
- 让观众看到 `/verify` 如何把异常样本和下游影响正式回写到 review / release

## 2. 阶段 1：/team-intake

### 输入

```text
/team-intake
目标：为数据流水线新增特征计算任务并补齐质量与回填验证
范围：任务编排、转换逻辑、质量校验、结果汇总、测试计划
不做：分析台 UI 改造
约束：必须说明数据口径、批处理窗口、失败重试、回填范围和下游影响
```

### 产出

| 字段 | 内容 |
|------|------|
| 任务类型 | 数据 / pipeline 治理 |
| 主体对象 | 任务编排、质量校验、回填说明、release 观察 |
| 主要风险 | 数据口径不清、异常样本失控、下游影响不明 |
| 收口要求 | review / release 必须承接任务结果与回填结论 |

## 3. 阶段 2：/team-plan

### 拆解结果

| 模块 | 动作 | 收口位置 |
|------|------|----------|
| 任务层 | 调整编排与依赖 | pipeline |
| 口径层 | 说明转换边界与成功阈值 | docs / verify |
| 质量层 | 汇总异常样本与重试结果 | verify / review |
| 回填层 | 说明回填范围与下游影响 | release |

### 关键判断

- 任务运行成功不等于数据质量达标
- 回填边界和下游影响必须进入正式结论，而不是附带说明

## 4. 阶段 3：/tdd

### 定义的完成标准

```text
1. 数据口径、成功阈值和窗口边界清晰
2. 异常样本、失败重试和回填范围可解释
3. verify 能汇总任务结果、质量和下游影响
4. review / release 能承接正式结论
5. 仓库校验通过
```

## 5. 阶段 4：/team-execute

### 执行批次

#### 批次 A：任务与转换

- 调整任务编排
- 调整转换逻辑

#### 批次 B：质量与异常样本

- 补质量校验
- 汇总异常样本与重试结果

#### 批次 C：回填与发布收口

- 说明回填边界
- 说明下游影响和发布观察项

## 6. 阶段 5：/verify

### Verify 结果

| 检查项 | 判断 |
|--------|------|
| 任务结果 | 已确认 |
| 数据质量 | 已确认 |
| 异常样本 | 已确认 |
| 回填影响 | 已确认 |
| Release 收口 | 已确认 |

## 7. 阶段 6：/team-review 与 /team-release

### Review 结论

- 当前变更已经从“任务完成”升级为“结果可解释、可追溯”
- 例外项与待观察项已形成正式记录

### Release 结论

- 发布记录说明了任务窗口、回填边界和下游影响
- 一旦异常，可快速决定回退任务、暂停回填或阻断下游消费

## 8. 校验结果

### 文档静态检查

- 本轮新增 walkthrough、demo script 与 execution log 无错误

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

- [data-ml-pipeline-demo-script.md](data-ml-pipeline-demo-script.md)
- [data-ml-pipeline-walkthrough.md](data-ml-pipeline-walkthrough.md)
- [../../examples/data-ml-pipeline-CLAUDE.md](../../examples/data-ml-pipeline-CLAUDE.md)
