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

# Claude 快速上手

本文面向第一次把 Team Skills Platform 安装到 Claude 的使用者，目标是在 5 到 10 分钟内跑通第一个可工作的主链示例，并知道新增的 specialist 与 runtime 能力该从哪里开始体验。

## 1. 安装

```bash
node scripts/build-platform-artifacts.js
CLAUDE_HOME_DIR="$HOME/.claude" ./scripts/install-claude.sh
```

安装脚本会做两件事：

- 把完整插件目录复制到 `~/.claude/plugins/team-skills-platform/`
- 把 `skills/`、`agents/`、`commands/`、`rules/`、`templates/`、`examples/` 等同步到 `~/.claude/` 下的对应目录

## 2. 校验安装是否成功

至少确认以下文件存在：

- `~/.claude/commands/team-help.md`
- `~/.claude/agents/roles/tech-lead.md`
- `~/.claude/examples/project-CLAUDE.md`
- `~/.claude/marketplace.json`

如果这些文件不存在，优先回查：

- 是否先执行了构建脚本
- `CLAUDE_HOME_DIR` 是否指向了预期目录
- 是否误把历史导入源当成正式安装入口

如果还没有定位到问题，继续看 [troubleshooting.md](troubleshooting.md)。

### 2.1 可选能力检查：Graphify / GitNexus

如果你准备在 brownfield 项目中启用代码图谱能力，安装后可以先做预检查：

```bash
npm run graphify:doctor
npm run gitnexus:doctor
```

预检查仅验证环境，不会自动安装依赖。Graphify 适合轻量结构证据，GitNexus 适合 MCP 查询、impact 和 detect_changes；若失败，按 [troubleshooting.md](troubleshooting.md) 的对应章节处理。

## 3. 长期使用建议：准备项目级 CLAUDE.md

如果你只是先试一条命令，这一步可以放到第一次试跑之后再做；如果你准备把平台长期接入某个项目，这一步应尽快完成。

用户级 `CLAUDE.md` 适合放默认偏好，项目级 `CLAUDE.md` 适合放技术栈、命令流和门禁要求。建议从以下样例开始：

- 通用项目样例：[../../examples/project-CLAUDE.md](../../examples/project-CLAUDE.md)
- Next.js SaaS 样例：[../../examples/saas-nextjs-CLAUDE.md](../../examples/saas-nextjs-CLAUDE.md)
- Spring Boot 服务样例：[../../examples/springboot-service-CLAUDE.md](../../examples/springboot-service-CLAUDE.md)
- 流程型企业项目样例：[../../examples/workflow-enterprise-CLAUDE.md](../../examples/workflow-enterprise-CLAUDE.md)
- 平台治理仓库样例：[../../examples/platform-governance-CLAUDE.md](../../examples/platform-governance-CLAUDE.md)
- 数据看板项目样例：[../../examples/data-analytics-dashboard-CLAUDE.md](../../examples/data-analytics-dashboard-CLAUDE.md)
- GitHub Actions / 供应链治理仓库样例：[../../examples/github-actions-supply-chain-CLAUDE.md](../../examples/github-actions-supply-chain-CLAUDE.md)
- AI / Eval 平台样例：[../../examples/ai-eval-platform-CLAUDE.md](../../examples/ai-eval-platform-CLAUDE.md)
- 移动端 / 小程序项目样例：[../../examples/mobile-miniapp-CLAUDE.md](../../examples/mobile-miniapp-CLAUDE.md)
- IaC / Kubernetes 平台仓库样例：[../../examples/iac-kubernetes-platform-CLAUDE.md](../../examples/iac-kubernetes-platform-CLAUDE.md)
- 插件 / 扩展仓库样例：[../../examples/plugin-extension-platform-CLAUDE.md](../../examples/plugin-extension-platform-CLAUDE.md)
- 数据 / ML pipeline 仓库样例：[../../examples/data-ml-pipeline-CLAUDE.md](../../examples/data-ml-pipeline-CLAUDE.md)
- 安全 / 合规平台仓库样例：[../../examples/security-compliance-platform-CLAUDE.md](../../examples/security-compliance-platform-CLAUDE.md)
- 内部开发者平台样例：[../../examples/internal-developer-platform-CLAUDE.md](../../examples/internal-developer-platform-CLAUDE.md)
- 数据可观测性 / 质量平台样例：[../../examples/data-observability-quality-CLAUDE.md](../../examples/data-observability-quality-CLAUDE.md)

如果你想按 vertical 场景成熟度决定先看模板还是先看 demo，先看 [../presentation/vertical-scenario-route-map.md](../presentation/vertical-scenario-route-map.md)。
如果你想按表格确认每个 vertical 已补齐哪些材料，再看 [vertical-scenario-capability-matrix.md](vertical-scenario-capability-matrix.md)。

## 4. 第一个最小闭环

第一次不要一口气跑完整条链路，先用一个最小闭环确认平台工作正常。

主链入口统一从 `/team-help` 开始。真正进入正式任务后，PRD、delivery-plan、execute-log、handoff 等内容都要按命令说明通过 `npm run artifact:persist -- ...` 回写到项目仓库，而不是只停留在对话里。

### 4.1 新功能示例

```text
/team-help
目标：判断当前任务入口
现状：是否已有 brownfield 文档、project-context、handoff 证据
输出：推荐下一条主链命令和缺失前置条件
```

拿到入口建议后继续：

```text
/team-intake
目标：为订单服务新增审批 API
范围：接口、权限校验、测试计划
不做：前端页面、发布脚本重构
约束：必须评估是否启用 私有流程与权限集成
输出：参与角色、风险、下一步命令建议
```

拿到 intake 结果后继续：

```text
/team-plan
基于上一步结果拆解 architect、backend-engineer、qa-engineer 的任务。
要求给出依赖关系、custom overlay 是否启用、每次 handoff 的最小交付物。
```

### 4.2 前端问题修复示例

```text
/team-help
目标：判断当前任务入口
现状：是否已有 brownfield 文档、project-context、handoff 证据
输出：推荐下一条主链命令和缺失前置条件
```

再进入需求锁边界：

```text
/team-intake
目标：修复订阅页在 iPad 下的布局溢出
范围：页面布局、响应式验证、UI 自测证据
不做：接口改造
约束：必须附带 ui-review-checklist
```

如果问题足够小，可以走短链路：`/code-review` -> `/handoff` -> `/team-review`，但不要跳过验证证据。

## 5. 安装后另外三条最短体验路径

### 5.1 想体验测试先行

```text
/team-plan
基于当前需求结果拆解实现任务，并给出可进入 /tdd 的最小上下文。
```

```text
/tdd
目标：新增订单审批记录查询能力
现有缺口：还没有测试和契约验证路径
成功标准：先给出 red-green-refactor 步骤，并整理成可直接进入 /team-execute 的动作清单
```

### 5.2 想体验平台能力自检

```text
/harness-audit
目标：检查当前平台的命令、skills、hooks、rules、文档和集成深度。
输出：Overall Score、Dimension Scores、Top Actions、Recommendations。
```

适合在你刚补了一批命令、skills 或文档之后，快速看还有哪些入口没同步。

### 5.3 想先理解后台运行时增强

如果你不想马上跑命令，而是先想知道 memory、observe、cost、budget、compact、instinct 这些新增能力怎么影响会话行为，直接看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md) 和 [ecc-harness-usage.md](ecc-harness-usage.md)。

## 6. 什么时候用 specialist

Claude 里建议把 specialist 当成“专项分析器”，不是最终裁决者。

- 用 `/plan` 做深度规划
- 用 `/tdd` 做测试先行
- 用 `/code-review` 做风险审查
- 用 `/build-fix` 处理构建故障
- 用 `/verify` 做验证回环
- 用 `/harness-audit` 做平台能力体检

这些输出都要回到 `/handoff` 或 `/team-*`。如果不回收，平台就会退化成多个平行结论，失去 `tech-lead` 编排的价值。

## 7. 常用对话模板

如果你只想快速复制命令骨架，不想先读完整示例，先看 [team-commands-quick-prompts.md](team-commands-quick-prompts.md)；如果你想看更贴近日常对话的整句提示，直接看 [claude-conversation-prompt-recipes.md](claude-conversation-prompt-recipes.md)；如果你想看最短的两条上手路径，再看 [first-team-command-60-seconds.md](first-team-command-60-seconds.md)。

如果你想直接看一份从 intake 到 review 的成品对话，继续看 [claude-end-to-end-conversation-example.md](claude-end-to-end-conversation-example.md)。

### 6.1 进入主链

```text
请按 Team Skills Platform 工作模型处理当前任务。
先以 tech-lead 视角执行 /team-intake，输出目标、范围外事项、风险和建议参与角色。
```

### 6.2 进入专项分析

```text
基于当前 intake 结果，调用 /code-review 或 /plan 做专项分析。
请把结论整理成可直接进入 /handoff 的格式。
```

### 6.3 明确是否需要 custom overlay

```text
如果任务依赖私有流程、权限、发布或设计资产，请先判断是否需要启用 enterprise overlay。
如果不需要，也请明确说明原因。
```

## 8. 常见误区

- 不要把 specialist 的结论直接当最终决定
- 不要默认所有任务都需要 custom overlay
- 不要在用户级 `CLAUDE.md` 里堆满项目专属约束
- 不要只给代码 diff，不补 handoff 和验证证据

下一步建议：

- 想按任务场景继续展开：看 [claude-usage-scenarios.md](claude-usage-scenarios.md)
- 想先看所有命令和能力怎么映射：看 [command-and-capability-matrix.md](command-and-capability-matrix.md)
- 想单独看 runtime hooks 与后台机制：看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
- 想直接复制 Claude 的常用说法：看 [claude-conversation-prompt-recipes.md](claude-conversation-prompt-recipes.md)
- 想直接看 Claude 的完整对话示例：看 [claude-end-to-end-conversation-example.md](claude-end-to-end-conversation-example.md)
- 想把平台正式接入项目：看 [project-onboarding.md](project-onboarding.md)
- 想直接走一遍完整主链：看 [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md)
- 想查完整命令和输出规范：看 [team-skills-usage.md](team-skills-usage.md)

完整说明见 [team-skills-usage.md](team-skills-usage.md)。
