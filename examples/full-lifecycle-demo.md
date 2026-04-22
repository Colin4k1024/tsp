# 完整交付生命周期演示脚本

> 适用对象：要向团队、管理层或客户演示 Team Skills Platform 如何把“从需求到最终上线”串成一条完整流水线的人。  
> 当前版本已对齐新版主链：`/team-intake -> /team-plan -> /team-execute -> /handoff -> /team-review -> /team-release -> /team-closeout`。

## 1. 演示目标

这份脚本不是单纯展示“命令能跑”，而是展示平台如何解决 4 个实际问题：

1. 需求进入后不会立刻跳到实现
2. 方案阶段必须先 challenge，再 design review
3. 上线前会留下测试放行、部署上下文和发布方案
4. 发布不是结束，观察窗口后的 `/team-closeout` 才是正式收口

## 2. 演示建议时长

- 压缩版：12-15 分钟
- 标准版：20-25 分钟
- 深度版：30 分钟以上

如果时间有限，优先演示这 5 个节点：

- `/team-intake`
- `/team-plan`
- `/team-review`
- `/team-release`
- `/team-closeout`

## 3. 推荐演示场景

继续沿用审批与协作项目语境，场景设为：

**审批与交付协同系统**

这个场景适合演示的原因：

- 同时包含产品需求、流程审批、权限、前后端、通知、归档
- 很容易展示 private enterprise overlay、shared skills 和主链命令的配合
- 既有业务验收，也有发布和观察窗口

## 4. 演示前准备

正式演示前，建议先准备好这些内容：

- 已安装好当前平台
- 已生成最新产物
- 打开项目仓库根目录
- 预先准备一份需求文档
- 预先准备一个空的 `docs/artifacts/` 区域，便于现场展示文件落盘

建议现场先执行：

```bash
node scripts/build-platform-artifacts.js
node scripts/validate-library.js
```

## 5. 演示总览

本次演示按下面 9 段走：

1. 原始需求输入
2. `/team-intake`
3. `/team-plan`
4. `/team-execute` 后端
5. `/handoff`
6. `/team-execute` 前端
7. `/team-review`
8. `/team-release`
9. `/team-closeout`

建议开场就先给观众看这条链路，让他们知道今天不是“演示一个命令”，而是“演示一条可治理的流水线”。

## 6. 原始需求输入

### 6.1 可以直接展示的需求摘要

```text
需求名称：审批与交付协同系统

目标：
1. 替代邮件 + Excel 的跨团队审批与交付协作方式
2. 覆盖申请、审批、任务、通知、归档全流程
3. 支持申请人、审批人、协作人、运营和管理员等多类角色

约束：
1. 可能存在私有流程、权限和内部系统集成
2. 技术栈：Spring Boot + MySQL + Redis + React + TypeScript
3. 员工数据涉及合规与审计
```

### 6.2 主持人串词

可以这样说：

> 现在我们不是从“开发怎么写”开始，而是从一份真实需求开始。接下来每一步都不是口头讨论，而是会形成结构化输出，并最终落盘成项目级 artifact。

## 7. 阶段一：/team-intake

### 7.1 演示目标

让观众看到平台不会一上来就拆任务，而是先锁定：

- 目标
- 范围
- 不做项
- 风险
- 参与角色
- 是否命中企业扩展能力

### 7.2 建议输入脚本

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

### 7.3 屏幕上要强调的看点

- 有明确的 `In Scope / Out of Scope`
- 有 `待确认项`
- 有 `风险`
- 有 `候选技能装配`
- 不会直接开始排期或开发

### 7.4 现场要展示的落盘文件

- `docs/artifacts/{date}-{slug}/prd.md`
- `docs/artifacts/INDEX.md`

### 7.5 主持人串词

> Intake 的价值不是“写个摘要”，而是防止错误的需求直接进入 plan。这里已经开始建立事实源，后面所有角色都消费同一套输入。

## 8. 阶段二：/team-plan

### 8.1 演示目标

展示新版主链最重要的变化：

- 先 challenge
- 再动态分组讨论
- 再 design review
- 最后才进入 `handoff-ready`

### 8.2 建议输入脚本

```text
基于当前 intake 结果执行 /team-plan。

要求：
1. 先完成 Requirement Challenge Session
2. 明确动态讨论分组和各角色质疑点
3. 输出 delivery plan、风险、依赖、阶段负责人
4. 明确什么时候才算 handoff-ready
5. 若需要，补充架构设计与 API contract 的落盘位置
```

### 8.3 现场要展示的看点

- `Requirement Challenge Session`
- `Dynamic Discussion Group`
- `Design Review Board`
- `handoff-ready` 不是默认 true
- 计划里明确角色责任和依赖

### 8.4 现场要展示的落盘文件

- `docs/artifacts/{date}-{slug}/delivery-plan.md`
- `docs/artifacts/{date}-{slug}/arch-design.md`
- 必要时的 `docs/adr/ADR-xxx-*.md`
- `docs/memory/project-context.md`

### 8.5 主持人串词

> 旧式流程最常见的问题是需求没分析透就开始 plan。这里的演示重点，是让大家看到 plan 不是第一反应，而是 challenge 和设计收口之后的冻结结果。

## 9. 阶段三：/team-execute（后端）

### 9.1 演示目标

展示实现不是“自由开工”，而是消费已经准备好的方案、契约和 handoff。

### 9.2 建议输入脚本

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

### 9.3 现场要展示的看点

- 是否检查了 `handoff-ready`
- 是否有明确的“不做项”
- 是否留下 `execute-log`
- 是否把阻塞问题写出来，而不是藏在对话里

### 9.4 现场要展示的落盘文件

- `docs/artifacts/{date}-{slug}/execute-log.md`
- 必要时追加 `docs/memory/decisions.md`

## 10. 阶段四：/handoff

### 10.1 演示目标

让观众看到 handoff 不是“顺嘴说一下”，而是正式的阶段切换凭证。

### 10.2 建议输入脚本

```text
请基于当前后端实现结果执行 /handoff。

要求：
1. 说明已完成事实
2. 说明未完成项和风险
3. 说明下一跳角色要做什么
4. 标明当前阶段、目标阶段与 readiness
```

### 10.3 现场要展示的看点

- handoff 有固定结构
- 有 `当前阶段 -> 目标阶段`
- 下游可以直接消费，不需要重新猜背景

### 10.4 现场要展示的落盘文件

- `docs/artifacts/{date}-{slug}/handoffs/001-tech-lead-to-backend-engineer.md`

## 11. 阶段五：/team-execute（前端）

### 11.1 演示目标

展示前端同样处在主链里，而且会消费前面的设计、契约和 handoff，而不是单独飞。

### 11.2 建议输入脚本

```text
继续执行 /team-execute，本轮只做前端部分：
1. 离职申请表单
2. 交接任务看板
3. HR 汇总视图

要求：
1. 说明 UI 范围和边界态
2. 说明复用了哪些组件或设计约束
3. 输出自测结果与 QA 关注点
```

### 11.3 现场要展示的看点

- UI 不是最后才想
- QA 关注点在 execute 阶段就提前写出来
- 前后端都通过主链回到同一套 artifact

## 12. 阶段六：/team-review

### 12.1 演示目标

把“测试通过”和“允许上线”拆开，这是新版主链非常适合拿来演示的点。

### 12.2 建议输入脚本

```text
请执行 /team-review。

要求：
1. 基于前后端交付物做测试与风险评审
2. 给出阻塞项和放行建议
3. 单独输出 launch acceptance 结论
4. 明确是 Go、Conditional Go 还是 No-Go
```

### 12.3 现场要展示的看点

- `test-plan.md`：测试范围、矩阵、风险
- `launch-acceptance.md`：上线准入结论
- 这两个文件职责不同

### 12.4 现场要展示的落盘文件

- `docs/artifacts/{date}-{slug}/test-plan.md`
- `docs/artifacts/{date}-{slug}/launch-acceptance.md`

### 12.5 主持人串词

> 很多团队的问题不是不会测，而是“测试结论”和“上线决定”混在一起。这里故意把它拆开，演示平台如何强制留下准入结论。

## 13. 阶段七：/team-release

### 13.1 演示目标

展示 release 不是一句“可以发了”，而是明确：

- 怎么发
- 怎么回滚
- 看什么
- 谁值守

### 13.2 建议输入脚本

```text
请执行 /team-release。

要求：
1. 基于 launch acceptance 结论组织发布
2. 输出 deployment context 与 release plan
3. 明确观察窗口、关键指标和值守责任
4. 给出回滚条件与回滚入口
```

### 13.3 现场要展示的看点

- `deployment-context.md`
- `release-plan.md`
- 观察窗口是 release 阶段定义的，不是事后补写的

### 13.4 现场要展示的落盘文件

- `docs/artifacts/{date}-{slug}/deployment-context.md`
- `docs/artifacts/{date}-{slug}/release-plan.md`

## 14. 阶段八：/team-closeout

### 14.1 演示目标

这是昨天新主链里最值得重点展示的新增阶段。

要让观众清楚看到：

- 发布完成 != 任务完成
- 观察窗口结束后才进入 closeout
- closeout 会回写 backlog 和最终状态

### 14.2 建议输入脚本

```text
请基于发布结果和观察窗口数据执行 /team-closeout。

要求：
1. 判断观察窗口是否可以结束
2. 给出最终验收状态
3. 说明残余风险如何处置
4. 把遗留项回写 backlog
5. 明确任务状态是 closed、follow-up-required 还是 re-open
```

### 14.3 现场要展示的看点

- `closeout-summary.md`
- `docs/memory/backlog.md` 或 backlog 回写结果
- `docs/memory/lessons-learned.md`
- `docs/memory/sessions/*.md`

### 14.4 现场要展示的落盘文件

- `docs/artifacts/{date}-{slug}/closeout-summary.md`
- `docs/memory/backlog.md`
- `docs/memory/lessons-learned.md`
- `docs/memory/sessions/{date}-{nnn}-{slug}.md`

### 14.5 主持人串词

> 这一步是新版平台和旧式“做到 release 就结束”的最大差别。现在我们不仅知道系统发上去了，还知道它有没有稳定、风险有没有被正式接受、哪些事进入了下一轮 backlog。

## 15. 演示时推荐展示的 artifact 清单

如果你只想开一个文件树给观众看，建议按这个顺序展开：

1. `docs/artifacts/{date}-{slug}/prd.md`
2. `docs/artifacts/{date}-{slug}/delivery-plan.md`
3. `docs/artifacts/{date}-{slug}/arch-design.md`
4. `docs/artifacts/{date}-{slug}/execute-log.md`
5. `docs/artifacts/{date}-{slug}/test-plan.md`
6. `docs/artifacts/{date}-{slug}/launch-acceptance.md`
7. `docs/artifacts/{date}-{slug}/deployment-context.md`
8. `docs/artifacts/{date}-{slug}/release-plan.md`
9. `docs/artifacts/{date}-{slug}/closeout-summary.md`

这样观众会很直观地看到：每个阶段都有落盘，不是只有聊天记录。

## 16. 压缩版讲法

如果只有 10 分钟，建议这样讲：

1. 先展示总链路
2. 重点演示 `/team-intake`
3. 快速展示 `/team-plan` 里的 challenge / design review
4. 快速展示 `/team-review` 里的 `launch-acceptance.md`
5. 快速展示 `/team-release` 里的 `deployment-context.md`
6. 最后重点展示 `/team-closeout`

一句话收尾：

> 这套平台不是把一个任务拆得更复杂，而是把原来散落在聊天、脑子和临场决定里的关键事实，变成一条可治理、可演示、可交接的交付流水线。

## 17. Solo Mode 怎么讲

如果观众会追问“一人开发是不是也要这么重”，可以补这一段：

- `team mode`：多人分工，强调 handoff
- `solo mode`：单人承接，但保留同样的 gate
- 在 `solo mode` 下，最重要的不是减少命令，而是不丢掉：
  - review
  - release
  - closeout

可直接引用：

- [solo-delivery-mode.md](../docs/runbooks/solo-delivery-mode.md)
- [solo-delivery-one-page.md](../docs/runbooks/solo-delivery-one-page.md)

## 18. 关联入口

- 总体使用说明：[../docs/runbooks/team-skills-usage.md](../docs/runbooks/team-skills-usage.md)
- 主链字段规范：[../docs/runbooks/team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)
- 持久化规则：[../docs/runbooks/artifact-persistence.md](../docs/runbooks/artifact-persistence.md)
- 发布示例：[../docs/runbooks/team-release-example.md](../docs/runbooks/team-release-example.md)
- 收口示例：[../docs/runbooks/team-closeout-example.md](../docs/runbooks/team-closeout-example.md)

## 19. 这份演示脚本最适合的使用方式

- 对内做平台宣讲
- 对新项目做 onboarding 演示
- 对管理层演示“为什么主链不是做到 release 就结束”
- 对一人开发者演示“solo mode 也能保留治理”
