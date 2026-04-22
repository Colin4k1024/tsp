---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
doc_tier: historical
last_verified: 2026-04-17
source_of_truth:
  - ./command-and-capability-matrix.md
  - ./runtime-capabilities-overview.md
---

# 平台能力升级演示剧本

> 历史快照（非现行操作手册）：本页用于保留当时演示叙事，不作为当前安装或校验命令的权威来源。
> 本页出现的 `validate_library.py` 属于历史命名；当前等价命令是 `node scripts/validate-library.js`。

本文是一份可直接照着讲的演示脚本，专门用于展示本轮新增的 `/tdd`、`/harness-audit`，以及 memory、observe、budget、compact、instinct 等 runtime 能力。

如果你需要先看命令和能力总表，配合阅读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。如果你需要看后台机制定义，配合阅读 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

## 1. 演示目标

- 说明平台现在不只有主链，还有测试先行和平台体检入口
- 说明 runtime 能力是后台自动生效，不是手工命令
- 说明文档、示例、角色手册和 quick start 已同步到新能力面

## 2. 适用对象

- 新接入项目团队
- 需要做平台介绍的 Tech Lead
- 需要做阶段汇报的工程负责人
- 需要解释 ECC Harness Layer 的讲解人

## 3. 演示时长建议

- 5 分钟：只讲命令面变化
- 10 分钟：讲命令面 + runtime
- 15 分钟：完整走一遍“发现缺口 -> 测试先行 -> 文档补齐 -> 平台体检”的闭环

## 4. 演示脚本

### Step 1. 用 1 分钟讲清平台当前新增了什么

建议讲法：

```text
这次平台不是只新增了几个 runbook，而是扩展了三层能力：
第一层是公开命令，新增了 /tdd 和 /harness-audit；
第二层是 ECC skills，新增了 eval-harness、continuous-learning、cost-aware-llm-pipeline、strategic-compact 等能力；
第三层是 runtime 机制，包括 memory persistence、observation、instinct learning、context budget 与 compact/archive。
```

配套材料：

- [command-and-capability-matrix.md](command-and-capability-matrix.md)
- [runtime-capabilities-overview.md](runtime-capabilities-overview.md)

### Step 2. 用 `/team-intake` 讲清当前平台治理任务是什么

建议输入：

```text
/team-intake
目标：审视近期新增命令、skills、hooks 与文档入口是否同步
范围：README、quick start、usage scenarios、examples、角色手册
不做：修改历史快照文档、重构平台代码
约束：需要保留旧的业务演示，同时补一套面向新增能力的 demo 材料
```

讲解重点：

- 这不是业务需求，而是平台治理任务
- 需要区分 evergreen 文档和历史快照文档
- 从一开始就说明“不做什么”，避免演示中被带偏

### Step 3. 用 `/team-plan` 说明这类平台治理任务如何拆解

建议输入：

```text
/team-plan
基于当前 intake 结果，拆出文档刷新、示例补齐、角色手册同步、演示材料补齐和最终校验的动作清单。
输出必须包含：依赖、收口节点、哪些事项适合进入 /tdd，哪些事项适合最终进入 /harness-audit。
```

讲解重点：

- 新增能力同步不是“一次性改 README”
- 要分入口文档、次级模板、角色手册、demo 材料四层推进

### Step 4. 用 `/tdd` 讲“测试先行”不只用于代码，也能用于平台文档收敛

建议输入：

```text
/tdd
基于当前 /team-plan 结果，先定义这轮平台能力同步的完成标准。
至少覆盖：
1. quick start 明确出现 /tdd 与 /harness-audit
2. specialist 与角色手册能解释何时用这两个入口
3. 演示材料能独立说明 runtime 是后台机制，不是显式命令
4. 历史命令 `validate_library.py`（当前等价 `node scripts/validate-library.js`）最终通过
```

讲解重点：

- `/tdd` 的核心不是只能写测试代码，而是先把“什么算完成”说清楚
- 对平台文档治理来说，它能减少返工和漏项
- 如果需要更强的验证闭环，可以搭配 `eval-harness`

### Step 5. 用 `/team-execute` 讲实际收敛动作

建议讲法：

```text
执行阶段不再只是改一两个文件，而是分批补入口、补角色手册、补示例、补 demo。
每一批都先说明目标，再批量修改，再局部检查，最后统一校验。
```

可展示的材料：

- [claude-quick-start.md](claude-quick-start.md)
- [codex-quick-start.md](codex-quick-start.md)
- [specialist-commands-playbook.md](specialist-commands-playbook.md)
- [tech-lead-daily-operations.md](tech-lead-daily-operations.md)

### Step 6. 用 `/harness-audit` 讲平台体检为什么是新增关键入口

建议输入：

```text
/harness-audit
请从命令覆盖、skills 完整度、hooks 有效性、文档同步、集成深度五个方向审视当前平台。
输出必须区分：
1. 需要立即补齐的问题
2. 可下一轮处理的问题
3. 仅记录观察的问题
```

讲解重点：

- `/harness-audit` 面向平台自身，不替代业务任务的 review 或 release
- 它适合在仓库刚新增命令、skills、hooks、安装入口或大量 runbook 后使用
- 它的价值是把零散缺口收敛成统一治理动作

### Step 7. 单独用 2 分钟说明 runtime 是怎样工作的

建议讲法：

```text
这轮新增的 runtime 能力不是你每次都要手动执行的命令。
它们包括会话摘要回存、行为观察、成本记录、预算预警、上下文压缩和 instinct 学习。
它们在后台帮助长会话保持稳定，但不会替代主链和 specialist 的显式决策入口。
```

建议配套展示：

- [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
- [ecc-harness-usage.md](ecc-harness-usage.md)

### Step 8. 用校验结果收尾

建议讲法：

```text
文档和演示补齐后，最终仍要回到平台校验脚本。
只要历史命令 `validate_library.py`（当前等价 `node scripts/validate-library.js`）通过，就说明角色、skills、agents 和生成产物基线没有被破坏。
```

## 5. 建议演示顺序

1. 先展示 [command-and-capability-matrix.md](command-and-capability-matrix.md)
2. 再展示 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
3. 然后讲 `/team-intake` 和 `/team-plan`
4. 再讲 `/tdd`
5. 再讲 `/team-execute`
6. 最后讲 `/harness-audit` 和校验结果

## 6. 观众常见问题

- `/tdd` 是不是只适合代码开发：不是，它适合先定义完成标准的场景
- `/harness-audit` 能不能替代 `/team-review`：不能，它面向平台治理，不面向业务放行
- runtime 能力是不是要手动触发：不是，runtime 是后台机制
- 为什么还保留旧 demo：因为旧 demo 解释业务主链，新 demo 解释能力升级

## 7. 演示后建议发给观众的材料

- [command-and-capability-matrix.md](command-and-capability-matrix.md)
- [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
- [platform-capability-demo-execution-log.md](platform-capability-demo-execution-log.md)
