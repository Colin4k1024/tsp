---
version: "2.3.0"
status: draft
created: 2026-03-28
updated: 2026-04-18
owner: 工程团队
doc_tier: entry
last_verified: 2026-04-18
source_of_truth:
  - ../../README.md
  - ../../AGENTS.md
  - ./team-skills-usage.md
---

# 新项目接入指南

本文面向准备把 Team Skills Platform 正式接入一个新项目的团队。目标不是只跑通单条命令，而是让项目从第一天开始就具备统一的角色边界、命令流和交付门禁。

本文默认你已经完成安装。如果还没有安装，请先完成 [claude-quick-start.md](claude-quick-start.md) 或 [codex-quick-start.md](codex-quick-start.md)。

如果你已经安装完成，想直接按任务类型看怎么用 Claude 或 Codex，也可以先看 [claude-usage-scenarios.md](claude-usage-scenarios.md) 和 [codex-usage-scenarios.md](codex-usage-scenarios.md)。

如果你的项目主要由一个人独立推进，但仍然希望保留完整治理闭环，继续看 [solo-delivery-mode.md](solo-delivery-mode.md) 和 [solo-delivery-one-page.md](solo-delivery-one-page.md)。

## 1. 什么时候需要这份文档

下面几种场景都适合按本文接入：

- 你要在一个新仓库里长期使用 Claude 或 Codex
- 你希望团队任务按 `tech-lead` 编排 + 专业角色协作方式执行
- 你希望一人开发时也能保留需求、验证、发布和上线后收口
- 你希望把前端质量门禁、handoff 契约和 specialist 使用边界提前固化
- 你需要判断 custom overlay 是否应该进入某个项目

如果你只是先试一次命令，优先看 [claude-quick-start.md](claude-quick-start.md) 或 [codex-quick-start.md](codex-quick-start.md)。

## 2. 接入前准备

在安装前先明确四类事实：

1. 技术栈：例如 Next.js、Spring Boot、Python 服务
2. 主要交付物：页面、API、流程、数据迁移、发布脚本
3. 默认参与角色：哪些角色会长期参与这个项目
4. 额外约束：是否涉及审批流、权限中心、公司领域扩展
5. 是否需要 brownfield 结构扫描：是否启用 Graphify 作为可选知识图谱能力

这一阶段不要急着把所有 skills 都装上。平台的原则是按项目选择，而不是全量堆叠。

## 3. 安装平台

### 3.1 Claude

```bash
node scripts/build-platform-artifacts.js
CLAUDE_HOME_DIR="$HOME/.claude" ./scripts/install-claude.sh
```

### 3.2 Codex

```bash
node scripts/build-platform-artifacts.js
CODEX_HOME_DIR="$HOME/.codex" AGENTS_HOME_DIR="$HOME/.agents" ./scripts/install-codex.sh
```

### 3.3 安装校验

至少检查以下事实：

- Claude 安装后存在 `~/.claude/commands/team-help.md`
- Codex 安装后存在 `$CODEX_HOME_DIR/plugins/team-skills-platform/commands/team-help.md`
- 两端都能访问 `examples/` 下的样例文件

安装或命令不可用时，优先看 [troubleshooting.md](troubleshooting.md)。

### 3.4 初始化 docs/memory

首次把平台接入项目时，不要等到 session hook 第一次运行后再补 memory 文件。建议在安装校验完成后立即创建并纳入版本管理：

- `docs/memory/project-context.md`
- `docs/memory/decisions.md`
- `docs/memory/lessons-learned.md`

这三份文件即使先只有占位内容也可以。目的不是提前写完，而是确保：

- session-start 能读取到项目上下文
- 后续 `/team-plan`、`/team-release`、`/team-closeout` 有稳定落点
- 新会话不会因为 `docs/memory/` 缺失而失去项目感知

如果项目准备采用 brownfield 接入，建议同时准备一版初始 `docs/memory/project-context.md`，至少写明当前技术栈、已有模块、当前任务和主要风险。

如果你准备立刻跑第一条正式主链任务，建议同时执行一次 `npm run artifact:persist -- ensure-task --date {YYYY-MM-DD} --slug {slug} --state intake`，提前把 `docs/artifacts/{YYYY-MM-DD}-{slug}/` 建好，避免后续 `/team-intake` 和 `/team-plan` 还要补建任务目录。

### 3.5 readiness_status 迁移

如果项目是在旧版本规则下接入，先检查已有 handoff 文档是否仍使用旧值 `readiness_status: ready`。

新规则下需要按目标阶段迁移：

- `execute`：`handoff-ready`
- `review`：`ready-for-review`
- `release`：`release-ready`
- `closeout`：`accepted`

建议在第一次运行 `npm run workflow:readiness` 前完成这一步，否则旧 handoff 会直接触发 gate 失败。

### 3.6 可选代码图谱能力（Graphify + GitNexus）

Graphify 和 GitNexus 在接入阶段用于补齐 brownfield 结构认知，不替代 `/team-*` 主链。Graphify 偏轻量结构扫描，GitNexus 偏 MCP 查询、impact、detect_changes 和多仓证据：

```bash
npm run graphify:doctor
npm run gitnexus:doctor
```

推荐在以下场景启用：

- 老项目接入，模块边界和依赖关系不清晰
- `/team-plan` 之前需要结构化证据来收口 challenge/design/readiness
- `/team-execute` 或 `/team-review` 需要明确影响范围与路径
- 跨模块或跨仓改动需要 GitNexus 的 impact / detect_changes 证据

分发策略：

- `knowledge-graph` 模块默认在 `research` 和 `full` profile 中
- 不在 `team` / `enterprise` 默认集中自动开启

治理边界：

- 禁止在本仓库执行 `graphify codex install` / `graphify claude install`
- 禁止自动执行 `gitnexus setup` 或不带 `--skip-agents-md` 的 GitNexus 索引命令
- 图谱结论需要回落到 handoff 或 artifacts，不形成并行责任链

详细操作见 [graphify-knowledge-graph-usage.md](graphify-knowledge-graph-usage.md) 与 [gitnexus-code-intelligence-usage.md](gitnexus-code-intelligence-usage.md)。

## 4. 选择项目级样例

建议不要从空白 `CLAUDE.md` 开始，而是先选一个最接近的样例再改：

- 示例选择索引：[../../examples/INDEX.md](../../examples/INDEX.md)
- 通用项目完整成品：[../../examples/project-CLAUDE.md](../../examples/project-CLAUDE.md)
- 通用项目设计说明：[project-claude-design-rationale.md](project-claude-design-rationale.md)
- 前端主导项目：[../../examples/saas-nextjs-CLAUDE.md](../../examples/saas-nextjs-CLAUDE.md)
- 后端主导项目：[../../examples/springboot-service-CLAUDE.md](../../examples/springboot-service-CLAUDE.md)
- 流程型企业项目：[../../examples/workflow-enterprise-CLAUDE.md](../../examples/workflow-enterprise-CLAUDE.md)
- 平台治理仓库：[../../examples/platform-governance-CLAUDE.md](../../examples/platform-governance-CLAUDE.md)
- 数据看板项目：[../../examples/data-analytics-dashboard-CLAUDE.md](../../examples/data-analytics-dashboard-CLAUDE.md)
- GitHub Actions / 供应链治理仓库：[../../examples/github-actions-supply-chain-CLAUDE.md](../../examples/github-actions-supply-chain-CLAUDE.md)
- AI / Eval 平台：[../../examples/ai-eval-platform-CLAUDE.md](../../examples/ai-eval-platform-CLAUDE.md)
- 移动端 / 小程序项目：[../../examples/mobile-miniapp-CLAUDE.md](../../examples/mobile-miniapp-CLAUDE.md)
- IaC / Kubernetes 平台仓库：[../../examples/iac-kubernetes-platform-CLAUDE.md](../../examples/iac-kubernetes-platform-CLAUDE.md)
- 插件 / 扩展仓库：[../../examples/plugin-extension-platform-CLAUDE.md](../../examples/plugin-extension-platform-CLAUDE.md)
- 数据 / ML pipeline 仓库：[../../examples/data-ml-pipeline-CLAUDE.md](../../examples/data-ml-pipeline-CLAUDE.md)
- 安全 / 合规平台仓库：[../../examples/security-compliance-platform-CLAUDE.md](../../examples/security-compliance-platform-CLAUDE.md)
- 内部开发者平台：[../../examples/internal-developer-platform-CLAUDE.md](../../examples/internal-developer-platform-CLAUDE.md)
- 数据可观测性 / 质量平台：[../../examples/data-observability-quality-CLAUDE.md](../../examples/data-observability-quality-CLAUDE.md)

如果你不是只想选模板，而是想按“现在哪些 vertical 已经有完整 demo 闭环”来决定 onboarding 讲法，先看 [../presentation/vertical-scenario-route-map.md](../presentation/vertical-scenario-route-map.md)。
如果你想先确认某个 vertical 的模板、starter、walkthrough、demo script 和 execution log 是否都已补齐，再看 [vertical-scenario-capability-matrix.md](vertical-scenario-capability-matrix.md)。

项目级 `CLAUDE.md` 至少要写清楚四件事：

- 真实技术栈和架构边界
- 默认角色链路
- 默认命令流
- 必须执行的质量门禁

如果团队里第一次正式使用这套平台，建议先看 [project-claude-design-rationale.md](project-claude-design-rationale.md)。它会解释每一段存在的目的，以及哪些内容应该按项目事实替换，哪些结构应尽量保留。

## 5. 装配角色、skills 和命令

### 5.1 先选 Team Mode 还是 Solo Mode

项目接入时先做一个判断：你要治理的是“多人协作”，还是“单人压缩闭环”。

| 模式 | 适用情况 | 核心特点 |
|------|----------|----------|
| Team Mode | 多角色长期协作、跨团队依赖明显 | 结构化 handoff、多角色并行、正式角色边界 |
| Solo Mode | 主要由一个人独立推进，但仍需完整治理 | 压缩角色，不取消 gate，必须包含 release 后 closeout |

solo mode 不是“简化为只写代码”。  
它压缩的是角色数量，不压缩这些关键事实：

- 目标和范围
- 方案与风险
- 验证与放行判断
- 发布与回滚路径
- 观察窗口
- 上线后 closeout

如果你已经确认要走 solo mode，建议把 [solo-delivery-mode.md](solo-delivery-mode.md) 和 [solo-delivery-one-page.md](solo-delivery-one-page.md) 一起纳入项目入口文档。

### 5.2 最小角色集

大多数项目至少需要：

- `tech-lead`
- `qa-engineer`
- 一个或多个研发角色

推荐按场景选择：

- 纯前端项目：`tech-lead`、`frontend-engineer`、`qa-engineer`
- 后端服务项目：`tech-lead`、`architect`、`backend-engineer`、`qa-engineer`
- 发布敏感项目：再加入 `devops-engineer`

Solo Mode 下不要求真的拆成多人，但建议至少保留四个判断视角：

- `tech-lead`：目标、边界、优先级、风险
- `engineer`：实现、验证、交付边界
- `qa`：放行与风险接受
- `devops`：发布、回滚、观察窗口

### 5.3 skills 选择原则

- `skills/` 适合作为默认能力底座
- `skills/` 适合补专项能力，如 review、调试、测试设计与容器化验证
- `skills/` 只在项目确实依赖公司域能力时启用

不要把 custom overlay 当成默认装配。它应该只在 intake 或 plan 阶段被显式确认。

推荐的判定节奏：

- intake：先识别是否存在 custom overlay 依赖
- plan：再确认是否正式启用，以及由哪个角色负责承接
- execute 以后：若已启用，必须把执行记录回落到主链输出和 handoff

### 5.4 enterprise overlay 判定清单

在第一次项目接入时，建议直接按下表判断是否需要把 custom overlay 纳入长期上下文：

| 线索 | 典型关键词 | intake 阶段动作 | plan 阶段动作 |
|------|------------|-----------------|---------------|
| 私有流程/权限/组织能力 | 审批流、部门隔离、统一组织数据、内部平台约束 | 记为 `overlay 候选项` | 决定是否必须安装 `enterprise` overlay |
| 私有发布或观测流程 | 内部灰度、私有追踪、专属发布手册 | 先记触发条件 | 决定是否仅在 release 或专项场景启用 overlay |
| 私有设计/业务建模资料 | 企业样式 profile、业务设计 toolkit、内部脚手架 | 记为 `overlay 候选项` | 决定是否作为正式依赖承接 |

决策规则：

- intake 只负责识别候选项，不仓促做最终结论
- plan 必须明确写出 `启用`、`不启用` 或 `本次不启用`
- execute / review 若已启用，必须把记录回落到主链输出

### 5.5 命令流建议

推荐把以下主链写进项目级 `CLAUDE.md`：

1. `/team-help`
2. `/team-intake`
3. `/team-plan`
4. `/team-execute`
5. `/handoff`
6. `/team-review`
7. `/team-release`
8. `/team-closeout`

其中 `/team-help` 负责在入口阶段做路由：

- 新项目第一次进入仓库时，判断应该先走 intake 还是先补 brownfield 现状
- 中途接手任务时，判断当前缺少的是 readiness proof、Story Slice Plan，还是 memory / codemap 补齐
- 不确定下一步时，避免直接跳到 `/team-execute` 或 `/team-review`

补充约定：

- `Story Slice Plan` 只针对 `/team-execute` 主链，用于把实现切成可独立验收的执行单元。
- 如果任务足够小、风险足够低，直接走 `/quick`，不要把所有简单任务都提升到完整 execute gate。
- 正式进入主链后，PRD、delivery-plan、execute-log、handoff、release/closeout artifact 都应通过 `artifact:persist` 写回仓库。

如果项目采用 solo mode，推荐把主链写成下面这个最小路径：

1. `help`
2. `intake`
3. `plan`
4. `execute`
5. `review`
6. `release`
7. `closeout`

这里的 `closeout` 表示发布后的观察窗口收口阶段。当前平台已经提供 `/team-closeout`，项目级运行说明里应直接把它写成正式阶段。可以直接参考 [team-closeout-example.md](team-closeout-example.md)。

专项命令只在需要时补充：

- `/plan`
- `/tdd`
- `/code-review`
- `/build-fix`
- `/verify`
- `/multi-frontend`
- `/multi-backend`
- `/harness-audit`

建议新增两条说明，避免后续项目成员误解：

- `/harness-audit` 用于平台自检，不替代业务任务的 `/team-review` 或 `/team-release`
- memory、observe、budget、compact、instinct 这类能力属于 runtime 自动生效机制，不是每次都要手动执行的命令

## 6. 第一次在项目里跑完整主链

新项目接入后，建议立刻选一个真实但可控的任务跑一次完整主链，不要只停留在安装成功。

如果你希望按一份现成剧本完整演练一次，直接看 [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md)。

如果你更关心具体任务类型，可以继续看这些共享演练：

- [bug-fix-complete-walkthrough.md](bug-fix-complete-walkthrough.md)
- [code-review-collaboration-walkthrough.md](code-review-collaboration-walkthrough.md)
- [multi-service-backend-integration-walkthrough.md](multi-service-backend-integration-walkthrough.md)
- [hotfix-emergency-release-walkthrough.md](hotfix-emergency-release-walkthrough.md)

如果项目发布链比较重，继续看这些速查与治理入口：

- [release-governance-reading-path.md](release-governance-reading-path.md)
- [pre-release-checklist.md](pre-release-checklist.md)
- 
- 

### 6.1 推荐的首个任务类型

- 新增一个小功能但边界清晰
- 修复一个已知缺陷并保留验证证据
- 做一次小范围接口改造并补齐测试
- 做一次平台能力同步补齐，并用 `/harness-audit` 验证文档与入口是否一致

避免把首次接入任务选成跨多个系统的大改造，否则你很难分辨问题来自平台配置还是业务本身。

### 6.2 推荐演练顺序

如果你想按一份现成剧本完整走一遍，不必在本文重复拼装，直接按 [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md) 执行。

```text
/team-help
目标：判断当前任务入口
现状：是否已有 brownfield 文档、project-context、handoff 证据
输出：推荐下一条主链命令和缺失前置条件
```

```text
/team-intake
目标：
范围：
不做：
约束：
输出：参与角色、风险、下一步建议
```

```text
/team-plan
基于 intake 结果，拆角色职责、handoff 交付物、依赖和风险。
如果涉及 custom overlay，请明确说明是否启用。
如果是 brownfield 项目，请补齐 Brownfield Context Snapshot 和 Story Slice Plan。
```

```text
/tdd
基于当前 /team-plan 结果，先锁定测试、边界行为、完成标准和实现顺序。
如果不适合测试先行，也请明确说明原因。
```

```text
/team-execute
按已确认的角色边界执行实现或自测。
输出代码变更、验证结果和待交接事项。
```

```text
/handoff
把执行结果整理成结构化交接，供下一角色或主链继续处理。
```

```text
/team-review
基于交付物做测试、质量和放行评估。
```

如果项目采用 solo mode，建议把 `/team-release` 后的观察窗口和 `/team-closeout` 也一起演练：

```text
/team-release
发布步骤：
回滚步骤：
观察窗口：
关键指标：
```

```text
/team-closeout
观察窗口结论：
最终验收：
遗留项：
lessons learned：
```

这里要特别区分两件事：

- `release`：说明你已经发布，并定义了怎么观察
- `closeout`：说明观察窗口已经结束，并给出了最终状态

如果你是在接入或治理平台本身，而不是处理业务需求，再补一条：

```text
/harness-audit
审视新增命令、skills、hooks、文档和例子是否同步。
输出优先级、缺口分类和建议修补动作。
```

## 7. 前端项目的额外要求

如果项目存在页面、组件或交互交付，还需要在项目级 `CLAUDE.md` 里补充：

- 响应式基线
- A11y 基线
- 性能验证要求
- `ui-review-checklist` 的使用要求

推荐参考：[frontend-governance.md](frontend-governance.md) 和 [../../templates/ui-review-checklist.md](../../templates/ui-review-checklist.md)

## 8. custom overlay 的接入规则

只有满足以下条件之一，才建议把 `skills/` 纳入项目默认上下文：

- 项目长期依赖 私有流程引擎 流程引擎
- 项目长期依赖 私有权限中心 权限中心
- 项目本身就是公司域能力的二次封装或平台集成层

如果只是单次任务偶尔涉及，保持按任务显式启用更稳妥。

这里的关键不是“一开始就启用”，而是确保 intake 能识别候选项，plan 能做出明确决策。

如果你希望直接对照主链输出怎么写，可继续看 。

如果你还希望直接复制 Claude 或 Codex 的说法，而不是自己组织提示，可继续看 [claude-conversation-prompt-recipes.md](claude-conversation-prompt-recipes.md) 和 [codex-parallel-prompt-recipes.md](codex-parallel-prompt-recipes.md)。

## 9. 提交前检查清单

项目完成接入后，至少做一次以下检查：

1. 项目级 `CLAUDE.md` 已选定样例并改成真实项目事实
2. 主链命令流已写清楚（若采用 solo mode，也已包含 `/team-closeout`）
3. 质量门禁已写清楚
4. 首次主链任务已经实跑过一遍
5. specialist 的使用边界已经在项目说明中写明
6. 运行 `node scripts/validate-library.js` 成功

## 10. 常见错误

- 只安装插件，不写项目级 `CLAUDE.md`
- 一开始就把所有角色、所有 skills 都设为默认
- 把 specialist 当成最终责任人
- 前端项目没有写响应式、A11y、性能门禁
- 涉及 custom overlay，却没有在 intake 或 plan 阶段明确说明
- 发布后没有 closeout，就直接把任务标记完成

如果你需要的是分技术栈或分项目类型的项目级模板，直接从 [../../examples/project-CLAUDE.md](../../examples/project-CLAUDE.md)、[../../examples/saas-nextjs-CLAUDE.md](../../examples/saas-nextjs-CLAUDE.md)、[../../examples/springboot-service-CLAUDE.md](../../examples/springboot-service-CLAUDE.md)、[../../examples/workflow-enterprise-CLAUDE.md](../../examples/workflow-enterprise-CLAUDE.md)、[../../examples/platform-governance-CLAUDE.md](../../examples/platform-governance-CLAUDE.md)、[../../examples/data-analytics-dashboard-CLAUDE.md](../../examples/data-analytics-dashboard-CLAUDE.md) 开始。
