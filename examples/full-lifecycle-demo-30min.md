# 完整交付生命周期演示脚本（30 分钟深度版）

> 适用对象：要完整展示 Team Skills Platform 新版主链的人。  
> 重点展示：为什么平台不是“多几个命令”，而是把需求分析、设计收口、上线准入和上线后收口变成一条真正可治理的流水线。

## 1. 演示定位

这份版本适合：

- 对内做平台能力宣讲
- 对新项目做 onboarding
- 对管理层演示“为什么 release 不是结束”
- 对团队解释新版 `solo mode` 和 `team mode` 的共同门禁

它和 [full-lifecycle-demo.md](full-lifecycle-demo.md) 的区别是：

- 那份更像通用主脚本
- 这份是带时间切片、讲解重点、切屏顺序和问答预案的深度版

## 2. 30 分钟议程

| 时间段 | 环节 | 目标 |
|--------|------|------|
| 0-3 分钟 | 开场与问题定义 | 先让观众知道平台解决什么问题 |
| 3-7 分钟 | `/team-intake` | 展示不会直接跳到实现 |
| 7-12 分钟 | `/team-plan` | 展示 challenge、动态分组、design review |
| 12-17 分钟 | `/team-execute` + `/handoff` | 展示实现如何消费方案与交接 |
| 17-21 分钟 | `/team-review` | 展示测试事实和上线准入分离 |
| 21-25 分钟 | `/team-release` | 展示 deployment context、release plan、观察窗口 |
| 25-28 分钟 | `/team-closeout` | 展示最终验收、遗留项、backlog 回写 |
| 28-30 分钟 | 总结与问答 | 回答 team mode / solo mode / 成本问题 |

## 3. 开场怎么讲

### 3.1 开场目标

开场不要先讲命令，要先讲旧问题：

- 需求没分析完就开始 plan
- 方案没收口就开始 execute
- 测试通过和允许上线混在一起
- 发布后没有正式收口

### 3.2 建议开场串词

> 今天这 30 分钟我不演示“几个命令怎么跑”，而是演示一条完整流水线。  
> 这条流水线解决的是：从需求进入，到方案冻结，到实现，到评审，到上线，到上线后的最终收口，怎么形成同一套事实源。

### 3.3 第一屏建议展示

先展示这条主链：

```text
/team-intake
-> /team-plan
-> /team-execute
-> /handoff
-> /team-review
-> /team-release
-> /team-closeout
```

然后强调两句话：

- `release` 不是结束
- `closeout` 才是正式收口

## 4. 场景设定

本次演示继续使用企业项目语境：

**审批与交付协同系统**

### 4.1 为什么选这个场景

- 有需求复杂度，但不抽象
- 同时包含产品、流程、权限、前后端、通知、归档
- 很适合演示 custom overlay、shared skills、主链命令和 artifact 落盘

### 4.2 现场展示的需求摘要

```text
需求名称：员工离职交接管理系统

目标：
1. 替代邮件 + Excel 的离职交接方式
2. 覆盖申请、审批、交接、通知、归档全流程
3. 支持员工、接班人、主管、HR、IT、财务六类角色

约束：
1. 企业内部系统，需要接 SSO、审批流、数据权限
2. 技术栈：Spring Boot + MySQL + Redis + React + TypeScript
3. 员工数据涉及合规与审计
```

## 5. 环节一：/team-intake（3-7 分钟）

### 5.1 这一段要证明什么

证明平台不会直接进入开发，而是先锁定：

- 做什么
- 不做什么
- 风险是什么
- 需要哪些角色
- 哪些问题必须进入 challenge

### 5.2 建议输入脚本

```text
请按 Team Skills Platform 工作模型处理当前任务。
先执行 /team-intake，基于下面需求锁定目标、范围、约束、参与角色和主要风险。

任务背景：
[粘贴需求摘要]

特别关注：
1. 是否属于企业内部应用
2. 是否需要启用审批流、数据权限、企业 SDK
3. 前后端和 QA、DevOps 是否都要进入主链
4. 哪些问题必须进入 requirement challenge
```

### 5.3 屏幕上重点看什么

- 有 `In Scope / Out of Scope`
- 有 `待确认项`
- 有 `参与角色`
- 有 `候选技能装配`
- 有风险，而不是“先做再说”

### 5.4 要展示的文件

- `docs/artifacts/{date}-{slug}/prd.md`
- `docs/artifacts/INDEX.md`

### 5.5 主持人说明词

> Intake 阶段的关键价值，是把“模糊需求”变成“可进入下一阶段的结构化输入”。  
> 这一步如果没做扎实，后面的 plan 和 execute 本质上都是在赌。

### 5.6 可选展开点

如果观众对企业项目感兴趣，可以多讲 1 分钟：

- 为什么这里会识别 custom overlay
- 为什么数据合规和权限问题要在 intake 就出现

## 6. 环节二：/team-plan（7-12 分钟）

### 6.1 这一段要证明什么

这是整场演示最核心的一段，要证明：

- `plan` 不是第一反应
- 先有 `Requirement Challenge Session`
- 再有动态分组讨论
- 再做 `Design Review`
- 最后才冻结成可执行计划

### 6.2 建议输入脚本

```text
基于当前 intake 结果执行 /team-plan。

要求：
1. 先完成 Requirement Challenge Session
2. 明确动态讨论分组和各角色质疑点
3. 输出 delivery plan、风险、依赖、阶段负责人
4. 明确什么时候才算 handoff-ready
5. 若需要，补充架构设计与 API contract 的落盘位置
```

### 6.3 屏幕上重点看什么

- `Requirement Challenge Session`
- `Dynamic Discussion Group`
- `Design Review Board`
- `handoff-ready`
- 风险、依赖、阶段负责人

### 6.4 这段怎么讲

建议主持人这样解释：

> 旧问题不是不会做 plan，而是太早做 plan。  
> 新主链的关键变化是：plan 之前必须先让不同角色挑战假设，确认我们没有在错误的问题上做高质量执行。

### 6.5 要展示的文件

- `docs/artifacts/{date}-{slug}/delivery-plan.md`
- `docs/artifacts/{date}-{slug}/arch-design.md`
- `docs/memory/project-context.md`
- 必要时 `docs/adr/ADR-xxx-*.md`

### 6.6 这段最值得停一下的点

建议现场停 30 秒，明确讲：

- 以前很多团队把 “开需求会” 当 challenge
- 但 challenge 不是开会本身，而是要留下结构化质疑和结论

## 7. 环节三：/team-execute + /handoff（12-17 分钟）

### 7.1 这一段要证明什么

证明 execute 不是自由开工，而是：

- 消费已冻结的方案
- 消费 handoff-ready 的输入
- 输出可被下游直接消费的实现事实

### 7.2 建议分两段讲

先讲后端 execute，再讲 handoff；前端 execute 可以用较短时间带过。

### 7.3 后端 execute 输入脚本

```text
按已确认的 delivery plan 和 arch design 执行 /team-execute。

本轮只做后端部分：
1. 离职申请接口
2. 交接任务生成
3. 数据权限接入边界

请输出：
- 实现范围
- 关键改动
- 自测结果
- 风险与未完成项
```

### 7.4 handoff 输入脚本

```text
请基于当前后端实现结果执行 /handoff。

要求：
1. 说明已完成事实
2. 说明未完成项和风险
3. 说明下一跳角色要做什么
4. 标明当前阶段、目标阶段与 readiness
```

### 7.5 屏幕上重点看什么

- `execute-log.md`
- handoff 的结构化内容
- `当前阶段 -> 目标阶段`
- readiness 不是口头说“差不多好了”

### 7.6 要展示的文件

- `docs/artifacts/{date}-{slug}/execute-log.md`
- `docs/artifacts/{date}-{slug}/handoffs/*.md`
- 必要时 `docs/memory/decisions.md`

### 7.7 这段怎么讲

> 这里的重点不是“AI 写了多少代码”，而是“实现结果有没有变成下游能消费的事实”。  
> 只有这样 QA 和 DevOps 才不会重新猜前面的上下文。

## 8. 环节四：/team-review（17-21 分钟）

### 8.1 这一段要证明什么

证明测试事实和上线准入必须分开。

### 8.2 建议输入脚本

```text
请执行 /team-review。

要求：
1. 基于前后端交付物做测试与风险评审
2. 给出阻塞项和放行建议
3. 单独输出 launch acceptance 结论
4. 明确是 Go、Conditional Go 还是 No-Go
```

### 8.3 屏幕上重点看什么

- `test-plan.md`
- `launch-acceptance.md`
- Go / Conditional Go / No-Go
- 已接受风险 vs 阻塞项

### 8.4 这段怎么讲

> 很多团队最大的问题不是不测，而是把“测到了什么”和“现在能不能发”混成一句话。  
> 平台把这两件事拆开，是为了让上线决策真正可追溯。

### 8.5 要展示的文件

- `docs/artifacts/{date}-{slug}/test-plan.md`
- `docs/artifacts/{date}-{slug}/launch-acceptance.md`

## 9. 环节五：/team-release（21-25 分钟）

### 9.1 这一段要证明什么

证明 release 阶段会正式沉淀：

- deployment context
- release plan
- 观察窗口
- 回滚入口
- 值守责任

### 9.2 建议输入脚本

```text
请执行 /team-release。

要求：
1. 基于 launch acceptance 结论组织发布
2. 输出 deployment context 与 release plan
3. 明确观察窗口、关键指标和值守责任
4. 给出回滚条件与回滚入口
```

### 9.3 屏幕上重点看什么

- `deployment-context.md`
- `release-plan.md`
- 观察窗口定义
- 回滚条件

### 9.4 要展示的文件

- `docs/artifacts/{date}-{slug}/deployment-context.md`
- `docs/artifacts/{date}-{slug}/release-plan.md`

### 9.5 这段怎么讲

> 这里要强调：平台不是只会说“可以发了”。  
> 它会留下一个真正能被别人接手的发布上下文，告诉你怎么发、怎么回滚、发完看什么。

## 10. 环节六：/team-closeout（25-28 分钟）

### 10.1 这一段要证明什么

这是深度版一定要重点讲的一段：

- 发布完成不等于任务完成
- 观察窗口结束才进入 closeout
- closeout 会决定最终状态
- closeout 会把遗留项回写 backlog

### 10.2 建议输入脚本

```text
请基于发布结果和观察窗口数据执行 /team-closeout。

要求：
1. 判断观察窗口是否可以结束
2. 给出最终验收状态
3. 说明残余风险如何处置
4. 把遗留项回写 backlog
5. 明确任务状态是 closed、follow-up-required 还是 re-open
```

### 10.3 屏幕上重点看什么

- `closeout-summary.md`
- `docs/memory/backlog.md`
- `docs/memory/lessons-learned.md`
- `docs/memory/sessions/*.md`

### 10.4 要展示的文件

- `docs/artifacts/{date}-{slug}/closeout-summary.md`
- `docs/memory/backlog.md`
- `docs/memory/lessons-learned.md`
- `docs/memory/sessions/{date}-{nnn}-{slug}.md`

### 10.5 这段怎么讲

建议原话：

> 新版主链最大的变化不是增加了一个命令，而是增加了一个治理阶段。  
> 现在 release 之后不再靠口头说“没问题了”，而是通过 closeout 明确：观察窗口结束了吗、风险怎么处理、任务到底关不关闭。

## 11. 收尾总结（28-30 分钟）

### 11.1 建议总结结构

最后 2 分钟建议只讲 3 件事：

1. 平台把“需求、设计、实现、上线、收口”串成了同一条事实链
2. 每一步都有 artifact，而不是只有聊天记录
3. `closeout` 让平台从“做到上线”为止，升级到“做到正式收口”为止

### 11.2 建议总结串词

> 如果把今天的演示压缩成一句话，就是：  
> Team Skills Platform 不只是帮你把任务拆给不同角色，而是把原来分散在会话、脑子和临场判断里的关键事实，固化成一条可治理、可演示、可回溯的交付流水线。

## 12. 高概率问答预案

### Q1：这会不会太重？

回答建议：

> 对多人协作项目，这不是变重，而是把原来隐性的成本显性化。  
> 对一人开发项目，可以走 `solo mode`，压缩角色，但不丢 gate。

可引用：

- [solo-delivery-mode.md](../docs/runbooks/solo-delivery-mode.md)
- [solo-delivery-one-page.md](../docs/runbooks/solo-delivery-one-page.md)

### Q2：为什么 release 后还要 closeout？

回答建议：

> 因为“发出去了”和“稳定了、验收了、可以正式结案了”不是一回事。  
> 没有 closeout，遗留项、观察窗口和最终状态会重新掉回聊天记录里。

### Q3：这是不是只适合大项目？

回答建议：

> 不是。  
> 大项目强调多人协作；小项目可以走 solo mode。  
> 变化的是角色压缩，不是核心门禁消失。

## 13. 演示时建议打开的文件顺序

如果你想边讲边切文件，推荐这样切：

1. [full-lifecycle-demo.md](full-lifecycle-demo.md)
2. [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)
3. [artifact-persistence.md](../docs/runbooks/artifact-persistence.md)
4. `docs/artifacts/{date}-{slug}/prd.md`
5. `docs/artifacts/{date}-{slug}/delivery-plan.md`
6. `docs/artifacts/{date}-{slug}/test-plan.md`
7. `docs/artifacts/{date}-{slug}/launch-acceptance.md`
8. `docs/artifacts/{date}-{slug}/deployment-context.md`
9. `docs/artifacts/{date}-{slug}/release-plan.md`
10. `docs/artifacts/{date}-{slug}/closeout-summary.md`

## 14. 推荐搭配材料

- 总脚本：[full-lifecycle-demo.md](full-lifecycle-demo.md)
- 新项目接入：[../docs/runbooks/project-onboarding.md](../docs/runbooks/project-onboarding.md)
- 发布示例：[../docs/runbooks/team-release-example.md](../docs/runbooks/team-release-example.md)
- 收口示例：[../docs/runbooks/team-closeout-example.md](../docs/runbooks/team-closeout-example.md)

## 15. 一句话使用说明

如果你明天就要正式讲一场，建议做法是：

1. 用这份文件做主持人脚本
2. 用 [full-lifecycle-demo.md](full-lifecycle-demo.md) 做补充台词
3. 现场重点展示 `launch-acceptance.md`、`deployment-context.md` 和 `closeout-summary.md`
4. 最后用 `solo mode` 收尾，回答“小项目会不会太重”
