# Solo Delivery Gap Plan

**Date:** 2026-04-03  
**Scope:** Team Skills Platform 在“一人从需求到上线”场景下的能力缺口补齐计划  
**Goal:** 在不破坏现有团队协作主链的前提下，补齐单人开发模式所需的最小闭环，让单个开发者也能从需求澄清、方案设计、实现、验证、发布到上线后收口完整执行。

## 1. 背景

当前平台更偏向“多角色协作治理框架”：

- 工作模型默认是 `Tech Lead` 编排 + 专业角色协作
- 主链围绕 `intake -> plan -> execute -> review -> release`
- handoff、challenge、design-review、release 观察窗口等能力都已经存在

这套设计适合团队协作，但对一人开发存在两个问题：

1. 流程完整，但过于角色化，缺少单人压缩模式
2. 发布后收口、环境清单、上线验收、backlog 承接等单兵高风险环节还没有正式产物

所以本计划不是重写主链，而是补一层 **solo delivery mode**。

## 2. 目标状态

完成后，平台应支持两种明确模式：

### A. Team Mode

维持现状：

- 多角色协作
- challenge / design-swarm / review / release 全量门禁
- handoff 为正式状态切换凭证

### B. Solo Mode

新增单人压缩闭环：

1. `intake`
2. `plan`
3. `execute`
4. `verify`
5. `release`
6. `closeout`

要求：

- 允许一人承担多个角色职责
- 不要求伪造多人 handoff
- 但不能省略关键治理事实：
  - 验收标准
  - 风险判断
  - 发布准备
  - 回滚路径
  - 观察窗口
  - 上线后收口

## 3. 主要缺口

### Gap 1: 缺少 Solo Mode 正式运行模式

当前没有官方的单人模式说明、命令路由和压缩规则。

结果：

- 一人开发只能硬套多人流程
- 容易出现“要么流程过重，要么直接跳步骤”

### Gap 2: 主链止于 Release，缺少正式 Closeout 阶段

当前 `release` 后没有单独的：

- 最终验收声明
- 观察窗口结束判定
- 遗留项回填
- 上线后经验沉淀

结果：

- 上线后确认容易只停留在对话里
- 二期项、残余风险、复盘结论没有统一出口

### Gap 3: 缺少 Deployment / Ops Context 标准产物

当前 release 要求“环境、回滚、观察窗口”，但没有正式 artifact 承载：

- 环境变量来源
- 配置项
- 部署入口
- 密钥来源
- feature flag
- 灰度 / 回滚路径
- 监控面板

结果：

- 单人发布时最容易漏真实运行依赖
- 接手人或未来自己也难以恢复现场

### Gap 4: 缺少 Launch Acceptance / UAT Signoff 产物

当前 PRD 有验收标准，QA 有测试放行，但没有正式的“业务可上线确认”文件。

结果：

- QA 放行和业务可用性判断混在一起
- 单人开发时更容易默认“测试过了就等于可上线”

### Gap 5: 缺少正式的 Backlog / Roadmap 持久化面

backlog 拆解已从独立 shared skill 收敛回主链，但没有等价 artifact 接住：

- 发布后遗留项
- 二期需求
- 技术债
- 延后处理项

结果：

- 单人长期推进多个版本时，优先级会重新散落回对话

## 4. 设计原则

本计划遵循以下原则：

1. 不破坏现有 Team Mode 主链
2. Solo Mode 是压缩，不是降级
3. 只压缩角色数量，不压缩关键治理事实
4. 所有新增结论都必须落盘为 artifact
5. 单人模式必须比团队模式更易执行，而不是复制一套更复杂文档

## 5. 计划新增内容

### 5.1 新增运行模式说明

新增：

- `docs/runbooks/solo-delivery-mode.md`

内容应包括：

- 适用场景
- 与 Team Mode 的差异
- 允许压缩的步骤
- 不允许省略的检查项
- 单人角色映射方式
- 推荐最短主链

### 5.2 新增 Closeout 阶段

新增：

- `commands/team-closeout.md`
- `docs/runbooks/team-closeout-example.md`

定义用途：

- 发布后观察窗口结束判定
- 最终验收声明
- backlog 回填
- lessons learned 收口

建议输出：

- `closeout-summary.md`
- 最终状态更新
- 遗留项清单
- 下一步建议

### 5.3 新增 Deployment / Ops Context 产物

新增模板：

- `templates/deployment-context.md`

新增标准：

- 在 `rules/artifact-standards.md`
- 在 `docs/runbooks/artifact-persistence.md`

字段至少包括：

- 环境清单
- 配置项 / 环境变量
- 密钥来源
- 部署入口命令
- feature flag / 灰度开关
- 回滚入口
- 监控面板 / 告警入口
- 观察窗口责任

### 5.4 新增 Launch Acceptance 产物

新增模板：

- `templates/launch-acceptance.md`

新增说明：

- `docs/runbooks/launch-acceptance-guide.md`

用途：

- 把“测试通过”和“可以上线”分开
- 支持单人开发时做自我 signoff
- 支持团队模式下 product / tech-lead / devops 联合确认

字段建议：

- 验收范围
- 已满足项
- 未满足但接受的风险
- 阻塞项
- 是否允许上线
- 谁确认

### 5.5 新增 Backlog / Roadmap 持久化

新增：

- `docs/memory/backlog.md` 规范
- 或 `templates/backlog-snapshot.md`

建议最低结构：

- 当前版本未完成项
- 发布后遗留项
- 技术债
- 二期候选
- 优先级
- 触发条件

### 5.6 新增 Solo One-Page 快速入口

新增：

- `docs/runbooks/solo-delivery-one-page.md`

内容应是一页式最短闭环：

- 先做什么
- 每一步要产出什么
- 什么时候进入 release
- 什么时候必须 closeout

## 6. 需要修改的现有规范

### Canonical Sources

- `rules/artifact-standards.md`
- `templates/`
- `commands/`
- `docs/runbooks/`

### 输出契约

需要更新：

- `docs/runbooks/team-command-output-contracts.md`

新增内容：

- `closeout` 阶段定义
- solo mode 的阶段压缩规则
- `launch acceptance`
- `deployment context`

### 持久化规范

需要更新：

- `docs/runbooks/artifact-persistence.md`

新增文件类型：

- `deployment-context.md`
- `launch-acceptance.md`
- `closeout-summary.md`
- `backlog.md` 或等价承载

### 项目接入

需要更新：

- `docs/runbooks/project-onboarding.md`
- `docs/runbooks/team-skills-usage.md`
- `AGENTS.md`

新增内容：

- 项目是否采用 `team mode` / `solo mode`
- 单人项目推荐最小角色组合
- solo 模式默认命令链

## 7. 推荐执行顺序

### Wave 1: 定义模式与阶段

1. 新增 `solo-delivery-mode.md`
2. 为主链补 `closeout` 概念
3. 更新 `team-command-output-contracts.md`

### Wave 2: 补产物与模板

4. 新增 `deployment-context.md`
5. 新增 `launch-acceptance.md`
6. 新增 `closeout-summary.md` 或等价输出规范
7. 新增 backlog 持久化规范

### Wave 3: 补命令与示例

8. 新增 `team-closeout.md`
9. 新增 `team-closeout-example.md`
10. 新增 `solo-delivery-one-page.md`

### Wave 4: 补 onboarding 与入口

11. 更新 `project-onboarding.md`
12. 更新 `team-skills-usage.md`
13. 更新 `AGENTS.md`

## 8. 非目标

本计划不做以下事情：

- 不重写现有多角色主链
- 不移除 challenge / review / release 门禁
- 不把 solo mode 做成“无治理的快捷模式”
- 不在本阶段实现自动化执行，仅先定义正式规范

## 9. 风险与控制

### 风险 1: Solo Mode 变成“跳步骤模式”

控制：

- 明确只压缩角色，不压缩关键交付物
- release / closeout 仍要求正式产物

### 风险 2: 新增文档太多，反而更重

控制：

- 一页式入口优先
- 长文档只做规则依据
- 示例必须比规则更易照抄

### 风险 3: Closeout 与 Review / Release 边界混乱

控制：

- review 负责“能否放行”
- release 负责“如何上线”
- closeout 负责“上线后是否收口完成”

## 10. 验收标准

计划完成后，应满足：

1. 仓库里有正式的 `solo mode` 说明
2. 主链定义包含 `closeout` 或等价发布后收口阶段
3. 有正式的 deployment context artifact
4. 有正式的 launch acceptance artifact
5. 有 backlog / roadmap 的持久化真相源
6. onboarding 文档能明确告诉单人开发者如何从需求走到上线后收口

## 11. 一句话方案

把当前“团队协作框架”补成“团队模式 + 单人模式”的双轨平台，并给单人开发新增：

- solo mode
- closeout 阶段
- deployment context
- launch acceptance
- backlog 持久化

这样它才能真正覆盖“一人从需求到最终上线”的完整闭环。

