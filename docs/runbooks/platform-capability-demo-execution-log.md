---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
doc_tier: historical
last_verified: 2026-04-17
source_of_truth:
  - ./platform-capability-demo-script.md
  - ./command-and-capability-matrix.md
---

# 平台能力升级演示执行记录

> 历史快照（非现行操作手册）：本页保留当次演示执行轨迹，不作为当前命令与流程的权威定义。
> 本页出现的 `validate_library.py` 属于历史命名；当前等价命令是 `node scripts/validate-library.js`。

本文记录一条面向“平台能力升级同步”的演示链路，不替代旧的业务场景 demo。它的目标是展示新增命令、角色手册同步、示例补齐和 runtime 说明如何形成闭环。

## 1. 场景定义

### 背景

- 仓库最近新增了一批 specialist 命令、ECC skills、hooks 和 runtime 组件
- 旧的业务演示仍可用，但无法解释本轮新增的 `/tdd`、`/harness-audit` 与 runtime 机制
- 需要补一套更适合团队同步和平台汇报的演示材料

### 演示目标

- 让观众理解当前命令面已经扩展
- 让观众理解 runtime 是后台机制而不是显式命令
- 让观众看到文档同步不是单点修改，而是成套收敛

## 2. 阶段 1：/team-intake

### 输入

```text
/team-intake
目标：重审平台新增命令、skills、hooks 和文档入口，并补齐使用文档、示例和演示材料
范围：README、quick start、usage scenarios、examples、角色手册、demo 脚本、demo 执行记录
不做：修改历史快照文档、调整平台生成逻辑
约束：旧的业务 demo 需要保留，新增演示材料必须可单独复用
```

### 产出

| 字段 | 内容 |
|------|------|
| 任务类型 | 平台治理与文档同步 |
| 主体对象 | 命令入口、ECC skills、runtime 说明、角色手册、示例材料 |
| 风险 | 文档面已扩散到多层入口，容易出现只改总表不改高频页 |
| 收口要求 | 保留历史文档，新能力另建 evergreen 演示材料 |

## 3. 阶段 2：/team-plan

### 拆解结果

| 模块 | 动作 | 收口位置 |
|------|------|----------|
| 总入口 | README、CLAUDE、AGENTS、usage docs 对齐新命令面 | evergreen 文档 |
| 次级入口 | quick start、prompt recipes、workflow essentials 对齐 | 快速上手与模板 |
| 角色手册 | 各角色日常操作文档补 `/tdd`、`/harness-audit`、矩阵入口 | 角色层 |
| 演示材料 | 补平台能力升级剧本与执行记录 | demo 层 |
| 最终验证 | 逐批无错 + 历史命令 `validate_library.py`（当前等价 `node scripts/validate-library.js`）通过 | 校验层 |

### 识别出的关键判断

- 适合进入 `/tdd` 的不是“业务逻辑”，而是“平台同步完成标准”
- 适合进入 `/harness-audit` 的不是单个文档，而是整个平台入口一致性

## 4. 阶段 3：/tdd

### 定义的完成标准

```text
1. quick start 与 usage scenarios 显式出现 /tdd 和 /harness-audit
2. specialist 手册能解释这两个入口的适用边界
3. 角色日常手册能解释何时使用测试先行和平台体检
4. demo 材料能独立说明 runtime 是后台机制
5. 仓库校验通过
```

### 价值说明

- 把“文档更新”变成“有验证口径的收敛任务”
- 避免只更新少数入口，导致团队使用路径不一致

## 5. 阶段 4：/team-execute

### 执行批次

#### 批次 A：入口文档与 quick start

- 更新 README、CLAUDE、AGENTS
- 更新 Claude/Codex quick start 与 usage scenarios
- 新增 [command-and-capability-matrix.md](command-and-capability-matrix.md)
- 新增 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)

#### 批次 B：模板、手册与 onboarding

- 更新 prompt recipes、workflow essentials、onboarding
- 更新 specialist playbook 和 quick prompts
- 更新首个命令 60 秒引导

#### 批次 C：角色日常手册

- Tech Lead 明确何时用 `/tdd`、`/harness-audit`
- Product / Project Manager 明确何时前置可测标准
- Architect / Frontend / Backend / QA 明确测试先行如何介入
- DevOps 明确平台入口变化后何时做平台体检

#### 批次 D：演示材料

- 新增 [platform-capability-demo-script.md](platform-capability-demo-script.md)
- 新增本文，作为平台能力升级的执行记录

## 6. 阶段 5：/harness-audit

### 体检前观察到的缺口

- 新命令已经存在，但模板与角色手册未同步
- runtime 机制存在，但缺少独立讲解页和演示话术
- 旧 demo 仍然偏业务流程，无法单独解释本轮能力升级

### 体检后的收敛结果

| 维度 | 收敛动作 | 状态 |
|------|----------|------|
| 命令覆盖 | `/tdd`、`/harness-audit` 已进入 quick start、playbook、角色手册 | 已补齐 |
| skills 完整度 | `eval-harness`、`continuous-learning`、`cost-aware-llm-pipeline`、`strategic-compact` 已进入矩阵与说明 | 已补齐 |
| hooks 与 runtime | memory、observe、budget、compact、instinct 已有独立总览页 | 已补齐 |
| 文档同步 | 主入口、次级入口、角色层、demo 层形成闭环 | 已补齐 |
| 演示可复用性 | 旧业务 demo 保留，新增平台升级 demo 单独存在 | 已补齐 |

## 7. runtime 说明在本次演示中的位置

本次演示没有把 runtime 当作“要执行的步骤”，而是把它作为讲解层：

- memory persistence：解释会话摘要、决策和待办如何回存
- observation：解释系统怎样观察工具调用模式
- cost awareness：解释复杂任务为何要关注预算与成本
- compact/archive：解释长会话如何防止上下文失控
- instinct learning：解释持续学习为何属于平台增强能力

## 8. 校验结果

### 文档静态检查

- 本轮新增与修改的 demo/role/onboarding 文档无错误

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

## 9. 演示结论

### 结论 1

本轮平台升级不只是“新增几个文件”，而是公开命令、ECC skills、runtime 和文档入口四层同步扩展。

### 结论 2

`/tdd` 和 `/harness-audit` 已经从“存在于仓库里”提升为“存在于用户路径里”。

### 结论 3

runtime 能力已有单独说明和 demo 话术，不再需要依赖听众从 hooks 目录自行推断。

## 10. 推荐搭配材料

- [platform-capability-demo-script.md](platform-capability-demo-script.md)
- [command-and-capability-matrix.md](command-and-capability-matrix.md)
- [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
- [demo-execution-log.md](demo-execution-log.md)
