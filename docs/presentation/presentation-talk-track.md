# Presentation Talk Track

这份讲稿用于把 Team Skills Platform 当前能力快速讲清楚，适合对团队、管理层或新接入项目做口头说明。它和 runbook 的区别是：runbook 偏操作，这份讲稿偏讲解顺序与口径。

如果你已经明确当前听众是谁，不一定要直接用这一份通用稿。管理层优先看 [executive-briefing-talk-track.md](executive-briefing-talk-track.md)，实施接入优先看 [implementation-onboarding-brief.md](implementation-onboarding-brief.md)，培训场景优先看 [workshop-facilitator-guide.md](workshop-facilitator-guide.md)。如果还没决定怎么选，先看 [audience-presentation-route-map.md](audience-presentation-route-map.md)。

## 1. 5 分钟版本

### 第 1 分钟：先讲平台是什么

建议讲法：

“这不是一个 prompts 仓库，也不是单个 Agent 的技能包，而是一套角色化研发团队协作平台。主链由 tech-lead 编排，8 个角色协作完成需求、方案、研发、测试和发布。”

### 第 2 分钟：讲现在新增了什么

建议讲法：

“这轮升级不是只加了几个文档，而是扩了四层能力。第一层是公开命令，新增了 /tdd 和 /harness-audit；第二层是 ECC skills，包括 eval-harness、continuous-learning、cost-aware-llm-pipeline、strategic-compact；第三层是可选知识图谱能力 Graphify，用于 brownfield 结构扫描和依赖路径证据；第四层是 runtime，包括 memory、observe、budget、compact、instinct 等后台机制。”

### 第 3 分钟：讲两个关键新入口

建议讲法：

“/tdd 用来先锁测试和成功标准，减少返工；/harness-audit 用来体检平台本身，找文档、命令、skills、hooks 的同步缺口。前者面向交付闭环，后者面向平台治理。”

### 第 4 分钟：讲 runtime 和显式命令的区别

建议讲法：

“runtime 不是要你每次手动执行的命令，而是在后台帮助长会话稳定运行的机制，比如会话记忆、行为观察、成本记录、上下文压缩和 instinct 学习。显式命令负责决策入口，runtime 负责增强执行环境。”

### 第 5 分钟：讲现在该看哪些材料

建议讲法：

“如果你要上手，就先看 quick start；如果你要讲平台，就看命令与能力矩阵、runtime 总览和新的平台能力演示剧本；如果你要做 brownfield 结构认知，先跑 Graphify preflight 再看 Graphify runbook；如果你要讲具体业务场景，现在已经有 9 条完整 vertical 闭环，可以从 route map 和 capability matrix 里直接选。”

## 2. 15 分钟版本

### 第一段：平台结构

- 讲 8 角色矩阵
- 讲主链 `/team-*`
- 讲 specialist 与 main chain 的关系

### 第二段：能力升级

- 讲 `/tdd`
- 讲 `/harness-audit`
- 讲新增 ECC skills
- 讲 runtime 与 hooks

### 第三段：材料与落地

- 讲 quick start、usage scenarios、role runbooks 已经同步
- 讲新 demo 材料如何使用
- 讲 route map 和 markdown matrix 如何帮助选择 9 条 vertical 闭环入口
- 讲 `node scripts/validate-library.js` 仍然通过，说明升级没有破坏基线

## 3. 演示时建议打开的材料

- `team-skills-platform-intro.pptx`（运行 generate_ppt.py 生成）
- `agent-capability-matrix.pptx`（运行 generate_capability_matrix.py 生成）
- [audience-presentation-route-map.md](audience-presentation-route-map.md)
- [../runbooks/command-and-capability-matrix.md](../runbooks/command-and-capability-matrix.md)
- [../runbooks/runtime-capabilities-overview.md](../runbooks/runtime-capabilities-overview.md)
- [../runbooks/platform-capability-demo-script.md](../runbooks/platform-capability-demo-script.md)
- [../runbooks/graphify-knowledge-graph-usage.md](../runbooks/graphify-knowledge-graph-usage.md)
- [vertical-scenario-route-map.md](vertical-scenario-route-map.md)
- [../runbooks/vertical-scenario-capability-matrix.md](../runbooks/vertical-scenario-capability-matrix.md)

## 4. 常见问答口径

- 问：/tdd 是不是只适合代码开发
  答：不是，它更本质的作用是先定义完成标准和验证口径。

- 问：/harness-audit 能不能替代 review
  答：不能，它针对平台治理，不针对业务放行。

- 问：runtime 能力是不是都要手动调用
  答：不是，runtime 是后台机制，显式命令才是入口。

- 问：Graphify 会不会替代 `/team-*` 主链
  答：不会，Graphify 只是可选证据层能力，结论必须回落到 `/team-plan`、`/team-execute`、`/team-review`。

- 问：为什么保留旧 demo 又新增新 demo
  答：旧 demo 讲业务主链，新 demo 讲平台能力升级，两者服务的目标不同。

## 5. 讲完后建议发出的链接

- [README.md](README.md)
- [audience-presentation-route-map.md](audience-presentation-route-map.md)
- [../runbooks/team-skills-usage.md](../runbooks/team-skills-usage.md)
- [../runbooks/platform-capability-demo-execution-log.md](../runbooks/platform-capability-demo-execution-log.md)
- [vertical-scenario-route-map.md](vertical-scenario-route-map.md)
- [../runbooks/vertical-scenario-capability-matrix.md](../runbooks/vertical-scenario-capability-matrix.md)
