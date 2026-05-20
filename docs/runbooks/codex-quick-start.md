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

# Codex 快速上手

本文面向第一次把 Team Skills Platform 安装到 Codex 的使用者，重点说明插件目录、验证方式，以及如何在 Codex 中跑通主链、specialist 组合与新增的平台审计能力。

## 1. 安装

```bash
node scripts/build-platform-artifacts.js
AGENTS_HOME_DIR="$HOME/.agents" node scripts/install-apply.js --profile team --target codex
```

安装完成后会：

- 把完整插件复制到 `$HOME/.codex/plugins/team-skills-platform/`
- 把 commands / skills / agents 暴露到 `$HOME/.codex` 的原生入口
- 在 `$HOME/.codex/config.toml` 注册 `team-skills-platform`
- 把 marketplace 合并到 `$AGENTS_HOME_DIR/plugins/marketplace.json`

## 2. 校验安装是否成功

至少确认以下路径存在：

- `$HOME/.codex/plugins/team-skills-platform/commands/team-help.md`
- `$HOME/.codex/plugins/team-skills-platform/agents/roles/tech-lead.md`
- `$HOME/.codex/plugins/team-skills-platform/examples/project-CLAUDE.md`
- `$HOME/.codex/config.toml` 中含有 `[plugins."team-skills-platform"]`
- `$AGENTS_HOME_DIR/plugins/marketplace.json` 中含有 `team-skills-platform`

如果命令或 agent 不可用，先检查：

- `HOME` 和 `AGENTS_HOME_DIR` 是否指向了正确目录
- 是否重新运行了构建脚本
- 是否误以为 Codex 只需要 `marketplace.json` 而不需要插件目录

如果还没有定位到问题，继续看 [troubleshooting.md](troubleshooting.md)。

### 2.1 代码图谱能力检查：CodeGraph / Graphify / GitNexus

如果你准备在 brownfield 项目中启用代码图谱能力，安装后可以先做预检查：

```bash
npm run codegraph:doctor
npm run graphify:doctor
npm run gitnexus:doctor
```

CodeGraph 是默认内置的 MCP-backed 符号、调用链和影响面能力；Graphify 适合轻量结构证据，GitNexus 适合更深 MCP 查询、impact 和 detect_changes。CodeGraph 的 TSP 安装 wrapper 不会使用 `--target=auto`，也不会运行 `codegraph init -i`；目标项目需要索引时再手动初始化。

## 3. 在 Codex 中的推荐使用方式

Codex 更适合把“主链 + specialist”连起来连续执行，所以建议按下面的节奏工作：

1. 先用 `/team-help` 判断当前应该进入 intake、plan，还是先补 brownfield / memory / readiness 证据
2. 用 `/team-intake` 锁定目标、范围和约束
3. 用 `/team-plan` 拆角色责任与 handoff 交付物
4. 用 `/multi-frontend`、`/multi-backend`、`/plan` 做专项分析
5. 用 `/handoff` 把专项结论收回主链
6. 用 `/team-review` 或 `/team-release` 收口

如果你准备长期接入某个项目，建议先选一个项目级样例再改，而不是从空白文件开始：

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

正式进入任务后，PRD、delivery-plan、execute-log、handoff 等产出都要按命令说明通过 `npm run artifact:persist -- ...` 回写到项目仓库，而不是只留在对话里。

## 4. 第一个最小闭环

### 4.1 前端任务示例

```text
/team-help
目标：判断当前任务入口
现状：是否已有 brownfield 文档、project-context、handoff 证据
输出：推荐下一条主链命令和缺失前置条件
```

随后进入：

```text
/team-intake
目标：修复控制台首页在 iPad 横屏下的布局溢出
范围：页面布局、响应式回归、UI 验证清单
不做：接口与数据结构改造
约束：必须遵守 frontend-quality-gates
```

随后进入专项拆解：

```text
/multi-frontend
基于当前 intake 结果，从实现、UI/UX、QA 风险三个视角拆解工作。
要求指出哪些结论必须进入最终 handoff。
```

### 4.2 后端任务示例

```text
/team-help
目标：判断当前任务入口
现状：是否已有 brownfield 文档、project-context、handoff 证据
输出：推荐下一条主链命令和缺失前置条件
```

随后进入：

```text
/team-intake
目标：新增订单审批状态流转接口
范围：接口、权限校验、测试计划
不做：前端页面
约束：需要判断 私有流程与权限集成 是否启用
```

再继续：

```text
/team-plan
基于 intake 结果，拆解 architect、backend-engineer、qa-engineer 的职责，给出依赖和风险。
```

## 5. 安装后另外三条最短体验路径

### 5.1 想体验并行 + 测试先行

```text
/team-plan
基于当前需求拆解实现任务，并给出适合进入 /tdd 的最小上下文。
```

```text
/tdd
目标：新增订单审批状态流转接口
现有缺口：还没有测试先行路径和回归边界
成功标准：给出 red-green-refactor 步骤，并整理成可直接回到 /team-execute 的动作清单
```

### 5.2 想体验平台能力自检

```text
/harness-audit
目标：检查当前平台的命令、skills、hooks、rules、文档和集成深度。
输出：Overall Score、Dimension Scores、Top Actions、Recommendations。
```

适合在新增命令、skills、hooks 或大量 runbook 后，快速看入口是否失联。

### 5.3 想先理解 runtime 机制

直接看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。如果你更关心这些机制怎样影响 specialist 与主链，再补看 [ecc-harness-usage.md](ecc-harness-usage.md)。

## 6. Codex 与 Claude 的差异

- Claude 更适合通过用户级和项目级 `CLAUDE.md` 固化长期偏好
- Codex 更适合围绕插件目录连续调用命令和 agent 资产
- 两者都遵守同一套角色边界、handoff 契约和前端质量门禁
- 两者中 specialist 都不是最终责任主体，最终结论都要回到主链

## 7. 何时切到 specialist

如果你只想快速复制命令骨架，不想先读完整示例，先看 [team-commands-quick-prompts.md](team-commands-quick-prompts.md)；如果你想看 Codex 里怎么表达并行与收口，直接看 [codex-parallel-prompt-recipes.md](codex-parallel-prompt-recipes.md)；如果你想看最短的两条上手路径，再看 [first-team-command-60-seconds.md](first-team-command-60-seconds.md)。

如果你想直接看一份从 intake 到 multi-agent 再到 review 的成品对话，继续看 [codex-end-to-end-conversation-example.md](codex-end-to-end-conversation-example.md)。

下列场景适合在 Codex 中插入 specialist：

- 任务拆解复杂，用 `/plan` 或 `/multi-*`
- 想先建立测试回路，用 `/tdd`
- 代码已经改完，用 `/code-review`
- 构建报错，用 `/build-fix`
- 要补最终验证证据，用 `/verify`
- 平台入口和配置刚大改过，用 `/harness-audit`

每次 specialist 输出后，建议追加一句：

```text
请把上面的专项结论整理为可直接进入 /handoff 或 /team-review 的内容。
```

## 8. 常见误区

- 不要把 Codex 当成只执行某一个 specialist 的单点工具
- 不要跳过 `/handoff`，否则多角色输出难以收口
- 不要默认每个任务都要走完整长链路，小任务可以走短链路，但验证不能省

下一步建议：

- 想按任务场景继续展开：看 [codex-usage-scenarios.md](codex-usage-scenarios.md)
- 想先看所有命令和能力怎么映射：看 [command-and-capability-matrix.md](command-and-capability-matrix.md)
- 想单独看 runtime hooks 与后台机制：看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
- 想直接复制 Codex 的并行编排说法：看 [codex-parallel-prompt-recipes.md](codex-parallel-prompt-recipes.md)
- 想直接看 Codex 的完整对话示例：看 [codex-end-to-end-conversation-example.md](codex-end-to-end-conversation-example.md)
- 想把平台正式接入项目：看 [project-onboarding.md](project-onboarding.md)
- 想直接走一遍完整主链：看 [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md)
- 想查完整命令和输出规范：看 [team-skills-usage.md](team-skills-usage.md)

完整说明见 [team-skills-usage.md](team-skills-usage.md)。
