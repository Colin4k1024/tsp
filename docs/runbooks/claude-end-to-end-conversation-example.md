---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Claude 完整对话样例

本文给出一份偏 Claude 使用方式的成品对话样例。重点不是模拟真实模型逐字输出，而是演示用户通常该怎么说，平台输出至少应长什么样，以及怎样把结果继续推进到下一步。

## 1. 场景

- 任务：新增订单审批状态查询接口
- 范围：接口、权限校验、测试计划
- 不做：前端页面
- 约束：判断 私有流程与权限集成 是否启用

## 2. 第一步：用户发起 intake

用户可直接这样说：

```text
请按 Team Skills Platform 工作模型处理当前任务。
先以 tech-lead 视角执行 /team-intake，输出目标、范围外事项、参与角色、主要风险和下一步建议。

任务背景：
- 目标：新增订单审批状态查询接口
- 范围：接口、权限校验、测试计划
- 不做：前端页面
- 约束：判断 私有流程与权限集成 是否启用
```

期望得到的结果应至少像这样：

```text
目标
- 新增订单审批状态查询接口，支持权限校验和测试计划落地

范围外事项
- 不包含前端页面和发布脚本改造

参与角色
- tech-lead
- architect
- backend-engineer
- qa-engineer

主要风险
- 审批状态字段口径是否与历史接口一致
- 权限过滤口径是否需要接入 私有权限中心

领域技能包启用建议
- 私有流程引擎：候选，原因是任务涉及审批状态语义
- 私有权限中心：候选，原因是任务涉及权限过滤

下一步建议
- 进入 /team-plan，由 architect 和 backend-engineer 明确接口契约与技能装配清单
```

## 3. 第二步：用户继续要 plan

用户可以直接跟一句：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出角色职责、依赖、handoff 节点、风险和技能装配清单。
如果 private enterprise overlay 不启用，也请明确写出未启用原因。
```

期望结果至少包含：

```text
角色职责
- architect：确认接口契约、权限边界、兼容性约束
- backend-engineer：实现接口、权限校验、测试
- qa-engineer：准备功能、权限和边界测试

依赖
- architect 先确认返回字段和权限边界
- backend-engineer 再实现并补自测

技能装配清单
- shared：启用
- ecc：按需启用 `/verify` 对应的验证收口能力
- enterprise：未启用
- 原因：本次未进入流程运行态或 私有权限中心 正式集成，仅保留候选判断

handoff 节点
- architect -> backend-engineer：接口契约和权限边界
- backend-engineer -> qa-engineer：实现结果、自测证据、风险说明
```

## 4. 第三步：用户要求专项分析并回主链

如果用户想先做一次风险分析，可以这样说：

```text
基于当前任务先调用 /code-review 做专项风险分析。
分析完成后，不要停在专项结论，请把结果整理成可直接进入 /handoff 的格式。
```

期望结果应像这样收口：

```text
风险
- 权限过滤口径若与旧接口不一致，可能导致审批记录数量异常

建议动作
- 在 execute 前固定返回字段和权限边界
- 自测覆盖无权限、非法参数、空结果三类场景

下一角色关注点
- backend-engineer 需要在 handoff 中写清兼容性说明
- qa-engineer 需要重点验证旧调用方兼容性
```

## 5. 第四步：用户要求 execute

```text
/team-execute
按当前 plan 执行 backend-engineer 的实现和自测。
输出代码变更摘要、自测结果、待确认事项，以及需要进入 handoff 的信息。
```

期望结果至少包含：

```text
实现结果
- 新增订单审批状态查询接口
- 增加权限校验和异常返回

自测结论
- 正常查询、无权限、非法参数已验证

待确认事项
- 历史客户端是否依赖旧字段顺序

领域扩展执行记录
- enterprise：未启用
- 原因：未进入 私有流程 / 权限集成 正式集成
```

## 6. 第五步：用户要求 handoff

```text
/handoff
请把当前阶段结论整理成结构化交接，供 QA 继续处理。
```

期望得到：

```text
已完成
- 接口实现完成
- 权限校验与异常处理完成

验证结果
- 已完成后端自测

风险
- 兼容旧客户端字段顺序仍需 QA 确认

下一角色动作清单
- QA 验证权限边界、空结果和旧客户端兼容性
```

## 7. 第六步：用户要求 review

```text
/team-review
基于当前 handoff 结果，输出测试结论、阻塞项、放行建议和残余风险。
```

期望得到：

```text
评审结论
- 结论：有条件通过

阻塞项
- 无

残余风险
- 旧客户端字段顺序兼容性需上线前再确认一次

放行建议
- 可进入 /team-release，发布前补一次兼容性 smoke
```

## 8. 这份样例说明了什么

- Claude 的最佳使用方式，不是只发一个命令，而是附上目标、范围、不做和约束
- specialist 可以插入，但必须要求“整理成可进入 /handoff 的格式”
- overlay 候选项可以在 intake 提到，但不必强行在 plan 中启用

如果你想要更短的复制模板，继续看 [claude-conversation-prompt-recipes.md](claude-conversation-prompt-recipes.md)；如果你想看完整主链说明，继续看 [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md)。
