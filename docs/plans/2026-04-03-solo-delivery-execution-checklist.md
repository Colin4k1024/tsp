# Solo Delivery Execution Checklist

**Date:** 2026-04-03  
**Parent Plan:** [2026-04-03-solo-delivery-gap-plan.md](../../docs/plans/2026-04-03-solo-delivery-gap-plan.md)  
**Goal:** 将 solo delivery gap plan 拆成可逐项执行、逐项验收的任务清单。  
**Rule:** 本文只定义执行任务，不代表本轮已实现。

## Wave 1: 定义模式与阶段

### Task 1.1 新增 Solo Mode 总说明

**目标**

新增单人开发模式的正式 runbook。

**要新增**

- `docs/runbooks/solo-delivery-mode.md`

**内容要求**

- 适用场景
- 与 team mode 的差异
- 允许压缩的步骤
- 不允许省略的治理事实
- 单人角色映射
- 推荐命令流

**完成标准**

- 文档存在
- 能明确回答“单人开发时哪些 handoff 可以压缩，哪些不能省”
- 在文档里明确 `solo mode != 跳过 review/release`

### Task 1.2 为主链补 Closeout 阶段定义

**目标**

在平台规范中正式引入发布后收口阶段。

**要修改**

- `docs/runbooks/team-command-output-contracts.md`

**内容要求**

- 在阶段顺序里补 `closeout`
- 写清 `review / release / closeout` 边界
- 增加 closeout 阶段元数据与标准输出定义

**完成标准**

- 阶段定义中存在 `closeout`
- 文档能明确说明 release 后还要做什么

### Task 1.3 更新总入口中的双模式叙事

**目标**

让总入口不再只默认团队协作模式。

**要修改**

- `AGENTS.md`
- `docs/runbooks/team-skills-usage.md`

**内容要求**

- 明确平台支持 `team mode` 与 `solo mode`
- 给出 solo mode 推荐命令链
- 说明何时该用 solo，何时该用 team

**完成标准**

- 总入口里能直接找到 solo mode
- 新读者无需翻多份文档也知道单人怎么用

## Wave 2: 补标准产物

### Task 2.1 新增 Deployment Context 模板

**目标**

把环境、配置、密钥来源、部署入口、回滚入口正式落盘。

**要新增**

- `templates/deployment-context.md`

**内容要求**

- 环境列表
- 部署入口
- 环境变量 / 配置项
- 密钥来源
- feature flag / 灰度开关
- 回滚入口
- 监控 / 告警入口
- 值守与观察窗口

**完成标准**

- 模板存在
- 单人发布时能靠这个文件恢复完整运行上下文

### Task 2.2 新增 Launch Acceptance 模板

**目标**

把“测试通过”和“可上线”拆成两个不同结论。

**要新增**

- `templates/launch-acceptance.md`

**内容要求**

- 验收范围
- 已满足项
- 不满足但接受的风险
- 阻塞项
- 是否允许上线
- 确认人 / 确认方式

**完成标准**

- 模板存在
- 能用于 solo 自我 signoff，也能用于团队 signoff

### Task 2.3 新增 Closeout Summary 模板

**目标**

把发布后观察窗口结束、最终状态确认、遗留项回填规范化。

**要新增**

- `templates/closeout-summary.md`

**内容要求**

- 发布后观察结果
- 是否正式收口
- 残余风险
- 遗留项
- lessons learned
- 下一步建议

**完成标准**

- 模板存在
- closeout 不再只能靠 release plan 尾部附带说明

### Task 2.4 定义 Backlog 持久化真相源

**目标**

恢复 backlog / roadmap 的持久化承载。

**要新增二选一**

- `docs/memory/backlog.md` 规范
- 或 `templates/backlog-snapshot.md`

**内容要求**

- 当前版本未完成项
- 发布后遗留项
- 技术债
- 二期候选
- 优先级
- 触发条件

**完成标准**

- backlog 不再只存在于 release 后的口头结论

## Wave 3: 补命令与持久化规范

### Task 3.1 新增 `/team-closeout` 命令

**目标**

把 closeout 阶段变成正式命令，而不是口头约定。

**要新增**

- `commands/team-closeout.md`

**内容要求**

- 用途
- 期望输入
- 标准输出
- 默认流程
- 落盘要求

**完成标准**

- 命令文件存在
- 能单独承接 release 之后的收口动作

### Task 3.2 更新 Artifact Standards

**目标**

让新增产物进入正式标准清单。

**要修改**

- `rules/artifact-standards.md`

**内容要求**

- 新增 `Deployment Context`
- 新增 `Launch Acceptance`
- 新增 `Closeout Summary`
- 新增 backlog 真相源说明

**完成标准**

- 新产物出现在标准交付物表格中
- 每个产物都有主责角色和存储路径

### Task 3.3 更新 Artifact Persistence

**目标**

把新增产物接入主链持久化规则。

**要修改**

- `docs/runbooks/artifact-persistence.md`

**内容要求**

- 新增文件类型和目录结构
- 明确 `/team-closeout` 写入职责
- backlog 持久化位置明确

**完成标准**

- 持久化规范覆盖新产物
- closeout 后应该写什么文件是明确的

## Wave 4: 补 onboarding 与示例

### Task 4.1 更新 Project Onboarding

**目标**

让新项目接入时就能选择 solo / team。

**要修改**

- `docs/runbooks/project-onboarding.md`

**内容要求**

- 增加“模式选择”章节
- 明确单人项目推荐最小角色组合
- 增加 solo mode 推荐命令流

**完成标准**

- 新项目接入时可以正式声明采用 solo mode

### Task 4.2 新增 Solo One-Page 速查

**目标**

提供一页式单人开发最短闭环。

**要新增**

- `docs/runbooks/solo-delivery-one-page.md`

**内容要求**

- 从 intake 到 closeout 的最短链路
- 每一步最低必交付物
- 常见不要漏的点

**完成标准**

- 单人开发者不需要先读完整长文档才能开始

### Task 4.3 新增 Closeout 示例

**目标**

给出 closeout 的成品参考。

**要新增**

- `docs/runbooks/team-closeout-example.md`

**内容要求**

- 输入示例
- 输出示例
- 常见错误

**完成标准**

- closeout 阶段有可直接照抄的例子

## Wave 5: 生成链路与命令面接入

### Task 5.1 把 `/team-closeout` 接入生成链路

**目标**

让新命令进入 canonical source 与生成产物。

**要修改**

- `scripts/lib/team-skills-data.json`
- `scripts/lib/team-skills-platform.js`
- `scripts/team_skills_platform.py`
- 可能涉及 `templates/system/command.md.tmpl`

**完成标准**

- `node scripts/build-platform-artifacts.js` 后能生成 `commands/team-closeout.md`
- validate 不报缺失命令

### Task 5.2 更新命令矩阵与总文档

**目标**

让命令面正式显示 closeout。

**要修改**

- `AGENTS.md`
- `README.md`
- `docs/runbooks/team-skills-usage.md`
- `docs/runbooks/command-and-capability-matrix.md` 如存在对应表格

**完成标准**

- 命令矩阵能看到 `/team-closeout`
- solo mode 的推荐链路与 closeout 一致

## Wave 6: 验证与验收

### Task 6.1 文档一致性验证

**目标**

确保 solo mode、closeout、artifact 更新后没有口径冲突。

**要运行**

- `node scripts/build-platform-artifacts.js`
- `node scripts/validate-library.js`

**完成标准**

- build 通过
- validate 通过
- 新命令 / 新模板 / 新文档链接无断链

### Task 6.2 规则验收清单

**目标**

验证新模式真正覆盖一人开发主链。

**验收问题**

1. 一人开发者是否能知道什么时候用 solo mode？
2. 是否能从需求一路走到 closeout？
3. 是否有正式的环境与配置清单？
4. 是否有正式的上线验收结论？
5. 发布后遗留项是否有 backlog 真相源？

**完成标准**

- 以上 5 个问题都能在文档中直接找到答案

## 推荐执行顺序

1. Task 1.1
2. Task 1.2
3. Task 2.1
4. Task 2.2
5. Task 2.3
6. Task 2.4
7. Task 3.1
8. Task 3.2
9. Task 3.3
10. Task 4.1
11. Task 4.2
12. Task 4.3
13. Task 5.1
14. Task 5.2
15. Task 6.1
16. Task 6.2

## 最小可落地切片

如果想先做一个最小版本，建议先完成：

1. `solo-delivery-mode.md`
2. `team-closeout.md`
3. `deployment-context.md`
4. `launch-acceptance.md`
5. `artifact-standards.md` / `artifact-persistence.md` 更新

做到这一步，平台就已经从“团队协作主链”升级成“团队 + 单人双模式主链”的最小可用版本。

