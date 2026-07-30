---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 首次完整主链演练

本文是一份可以直接照着走的首次完整主链 walkthrough，适合新项目接入后做第一次实战演练。目标不是覆盖所有分支场景，而是让团队跑通一次从 `/team-intake` 到 `/team-review` 的完整链路，并理解每一步应该产出什么。

本文只覆盖 `/team-*` 主链和 `/handoff` 命令，不展开 specialist 的使用。specialist 的定位和使用边界见 [team-skills-usage.md](team-skills-usage.md)。

如果当前项目是 brownfield 且结构边界不清晰，建议在正式进入 `/team-plan` 前先做一次 Graphify 预检查与结构扫描（见 [graphify-knowledge-graph-usage.md](graphify-knowledge-graph-usage.md)）。

## 1. 演练目标

本次演练使用一个中等复杂度、边界清晰的任务：

- 任务：为订单运营控制台新增审批记录查询页与配套查询接口
- 前端范围：列表页、筛选表单、空态和错误态
- 后端范围：查询接口、权限校验、分页与筛选参数
- 不包含：审批流定义改造、历史数据回填、发布脚本重构

这个任务适合第一次演练，因为它同时覆盖：

- 前后端协作
- handoff 交接
- review 收口
- 是否启用 custom overlay 的判断

## 2. 演练前准备

在开始前确认三件事：

1. 已完成安装，可参考 [claude-quick-start.md](claude-quick-start.md) 或 [codex-quick-start.md](codex-quick-start.md)
2. 项目级约束已经存在，可参考 [project-onboarding.md](project-onboarding.md)
3. 团队知道 `/team-*` 输出要遵守 [team-command-output-contracts.md](team-command-output-contracts.md)

可选第 4 项（brownfield 推荐）：

4. 已执行 `npm run graphify:doctor`，并确认是否需要在 plan 阶段引入图谱证据

术语说明：

- `/handoff` 命令`：用于生成或汇总结构化交接结果
- `handoff 交接文档`：指 `/handoff` 命令产出的结构化交接内容
- `custom overlay 候选项`：在 intake 阶段被识别，但尚未正式启用的公司领域能力

## 3. 第一步：/team-intake

### 3.1 输入示例

```text
/team-intake
目标：为订单运营控制台新增审批记录查询页与配套接口
范围：前端列表页、筛选表单、后端查询接口、测试计划
不做：审批流程定义改造、历史数据回填、发布脚本重构
约束：前端必须附带 ui-review-checklist；后端必须说明接口兼容性；需要判断是否启用 私有流程或权限集成
输出：参与角色、主要风险、是否建议启用 custom overlay、下一步建议
```

### 3.2 期望输出重点

`/team-intake` 不应该直接开始实现，而应该先锁定：

- 参与角色：至少包含 `tech-lead`、`architect`、`frontend-engineer`、`backend-engineer`、`qa-engineer`
- 企业治理待确认项：是否企业内部应用、数据或合规风险、是否命中集团组件约束
- 领域技能包启用建议：私有流程、权限集成 是候选还是未启用
- 主要风险：前后端筛选参数一致性、权限口径、空态和错误态是否一致
- 下一步命令：进入 `/team-plan`

这一阶段只需要识别 `custom overlay 候选项`，不要在 intake 阶段仓促下最终启用决定。

一个简化判断可以这样写：

```text
overlay 候选项：
- 私有流程引擎：候选，原因是任务涉及审批记录
- 私有权限中心：候选，原因是接口涉及权限过滤
下一步：由 tech-lead 和 architect 在 /team-plan 中确认是否正式启用
```

### 3.3 合格结果长什么样

合格的 intake 至少要回答这三个问题：

1. 这次任务到底做什么，不做什么
2. 谁会参与，谁负责收口
3. 有哪些领域扩展需要在 plan 阶段继续确认

如果 intake 结果直接开始拆接口字段或写代码，说明这一步跑偏了。

## 4. 第二步：/team-plan

### 4.1 输入示例

```text
/team-plan
基于当前 intake 结果，拆解 architect、frontend-engineer、backend-engineer、qa-engineer 的任务。
要求给出依赖关系、技能装配清单、每次 handoff 的最小交付物，并明确 custom overlay 是否启用。
```

### 4.2 期望输出重点

`/team-plan` 的结果至少应包含：

- 任务拆解：前端页面、后端接口、测试计划、评审与放行
- 依赖关系：接口契约先于页面联调，筛选字段定义先于 QA 编写用例
- 技能装配清单：`shared`、`ecc`、`company` 三层是否启用
- handoff 交付物：架构说明、实现结果、自测证据、QA 关注点
- 是否启用 custom overlay：如果只是审批记录查询，一般应结论为 `enterprise: 未启用` 或 `候选已识别但本次不启用`

本步骤标准输出建议对照 [team-command-output-contracts.md](team-command-output-contracts.md) 中 `/team-plan` 的 `技能装配清单`。

### 4.3 一个合理的拆解示意

```text
- architect：确认查询接口契约、分页参数、权限边界
- frontend-engineer：实现列表页、筛选表单、空态/错误态并完成 ui-review-checklist
- backend-engineer：实现查询接口、权限校验、分页与筛选参数映射，补单测和集成测试
- qa-engineer：准备功能、权限、边界和回归测试用例
```

如果 plan 没有明确 handoff 交付物，后面几步通常会开始丢信息。

## 5. 第三步：/team-execute

### 5.1 输入示例

```text
/team-execute
按当前 plan 执行 frontend-engineer 与 backend-engineer 的实现和自测。
输出每个角色的代码变更摘要、自测结果、待确认事项，以及需要进入 handoff 的信息。
```

### 5.2 期望输出重点

这里的目标不是一口气给出最终放行结论，而是沉淀可交接的执行结果：

- frontend-engineer：页面和交互实现完成，附带响应式、自测截图或 checklist 结论
- backend-engineer：接口、权限和测试完成，附带兼容性说明和测试结果
- 领域扩展执行记录：若实际启用了 custom overlay，必须按 [team-command-output-contracts.md](team-command-output-contracts.md) 回落记录
- 待确认事项：例如筛选项默认值、空态文案、权限口径边界

本步骤标准输出建议对照 [team-command-output-contracts.md](team-command-output-contracts.md) 中 `/team-execute` 的 `领域扩展执行记录`。

### 5.3 常见错误

- 把 execute 写成一句“已完成开发”
- 只给代码 diff，不给自测证据
- 已经使用了 custom overlay，却没有记录 `能力名`、`输入来源`、`执行结果`

## 6. 第四步：/handoff

### 6.1 输入示例

```text
/handoff
把 frontend-engineer 和 backend-engineer 的执行结果汇总成交接文档。
必须包含代码变更摘要、自测范围、剩余风险、QA 关注点，以及需要继续确认的事项。
```

### 6.2 期望输出重点

handoff 的作用是把 execute 结果从“各自完成了什么”整理成“下一角色能直接接住什么”。建议至少包含：

- 代码变更摘要
- 自测范围与证据
- 剩余风险
- QA 关注点
- 若命中 custom overlay，则附带技能装配清单或领域扩展执行记录

这里说的 `handoff 交接文档`，指的是 `/handoff` 命令整理出的结构化结果。它通常承载在本次对话输出、任务记录或评审上下文中，不要求额外创建独立文件，但必须保留结构化字段。

### 6.3 一个简化的 handoff 示例

```text
代码变更摘要：
- 前端新增审批记录查询页，支持订单号、审批状态、创建时间筛选
- 后端新增审批记录查询接口，支持分页、状态过滤和权限校验

自测范围：
- 前端已验证桌面端、iPad 和移动端布局
- 后端已完成单测和集成测试

剩余风险：
- 审批状态枚举与历史数据兼容性待 QA 联调确认

QA 关注点：
- 无结果空态
- 无权限访问
- 极端分页参数
```

## 7. 第五步：/team-review

### 7.1 输入示例

```text
/team-review
基于当前 handoff 结果，输出测试结论、阻塞项、是否建议放行，以及残余风险。
```

### 7.2 期望输出重点

`/team-review` 至少应收口这些内容：

- 测试范围：功能、权限、边界、回归
- 结果：通过、有条件通过或不通过
- 阻塞项：是否存在必须返工的问题
- 放行建议：是否可以进入 `/team-release`
- 若启用了领域扩展：附带领域扩展约束核对结果

本步骤标准输出建议对照 [team-command-output-contracts.md](team-command-output-contracts.md) 中 `/team-review` 的 `领域扩展约束核对结果`。

### 7.3 合格结束态

一次成功的首次演练，结束时应该能回答：

1. 团队是否真的跑通了主链
2. handoff 是否足够支撑 QA 接手
3. custom overlay 是否被正确判断并回落记录
4. 哪一步最容易丢失结构化输出

## 8. 演练完成后的复盘

第一次完整演练结束后，建议团队马上补一个短复盘：

- 哪一步最顺
- 哪一步最容易跑偏
- 哪些字段最容易漏
- 哪些内容应该写进项目级 `CLAUDE.md`

如果复盘发现每次都漏同一类内容，比如前端证据、数据库回滚说明或 custom overlay 判断，可以把这类要求提升到项目级工作约定中。

## 9. 下一步怎么做

完成这份 walkthrough 后，通常有两种自然延伸：

1. 把当前项目的真实任务替换进本文里的示例输入
2. 再补一个专项 walkthrough，例如前端缺陷修复或后端接口改造

如果你还没有项目级工作约定，回到 [project-onboarding.md](project-onboarding.md) 和 [../../examples/project-CLAUDE.md](../../examples/project-CLAUDE.md) 继续完善项目入口。
