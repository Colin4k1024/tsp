---
version: "2.3.0"
status: draft
created: 2026-03-27
updated: 2026-04-18
owner: 工程团队
doc_tier: entry
last_verified: 2026-04-18
source_of_truth:
  - ../../README.md
  - ../../AGENTS.md
  - ./command-and-capability-matrix.md
---

# Team Skills 使用手册

本文说明新的开源角色化 Team Skills Platform 如何使用、如何安装，以及角色之间如何协作。若你先想搞清楚“当前到底有哪些命令、skills 和 runtime 能力”，先看 [command-and-capability-matrix.md](command-and-capability-matrix.md) 和 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

主链命令的输出字段定义见 [team-command-output-contracts.md](team-command-output-contracts.md)，本轮文档核对台账见 [document-execution-audit.md](document-execution-audit.md)，本轮批量优化完成情况见 [batch-optimization-completion-checklist.md](batch-optimization-completion-checklist.md)。

## 1. 平台组成

### 1.1 Canonical Source

- `roles/*/role.yaml`：角色唯一事实源
- `skills/`：当前正式技能目录。共享能力和 ECC 增强统一平铺到这里；自定义扩展通过 custom overlay 提供
- `rules/`：工作规则
- `templates/`：交付模板与生成模板

### 1.2 Generated Artifacts

- `skills/roles/`：角色型 skills
- `agents/roles/`：角色 agent prompt
- `agents/specialists/`：ECC 风格 specialist agents
- `commands/`：团队命令面 + ECC 快捷命令
- `.codex-plugin/plugin.json`
- `.claude-plugin/plugin.json`
- `marketplace.json`
- `.agents/plugins/marketplace.json`

## 2. 角色入口

| 角色 | 入口方式 | 推荐场景 |
|------|----------|----------|
| `tech-lead` | role skill + agent | 需求 intake、任务分派、冲突仲裁 |
| `product-manager` | role skill + agent | 需求澄清、PRD、验收标准 |
| `project-manager` | role skill + agent | 排期、依赖、风险推进 |
| `architect` | role skill + agent | 方案决策、接口与数据契约 |
| `frontend-engineer` | role skill + agent | 页面、交互、状态、前端自测 |
| `backend-engineer` | role skill + agent | 接口、服务、数据、后端自测 |
| `qa-engineer` | role skill + agent | 测试计划、回归、放行建议 |
| `devops-engineer` | role skill + agent | 发布、监控、回滚、运行保障 |

## 3. 默认命令流

1. `/team-help`
2. `/team-intake`
3. `/team-plan`
4. `/handoff`
5. `/team-execute`
6. `/team-review`
7. `/team-release`
8. `/team-closeout`

实际执行时，`/team-help` 是唯一公开入口；`/team-plan` 内部必须先完成 `Requirement Challenge Session`、`design-review` 与 implementation-readiness；`/team-execute` 只能消费 readiness proof；`/team-closeout` 只能消费已经完成观察窗口的 release 结果。

主链 artifact 不允许只停留在对话里。`/team-intake` 到 `/team-closeout` 的正式输出都应通过 `npm run artifact:persist -- ...` 落到 `docs/artifacts/`、`docs/adr/` 和 `docs/memory/`。

如果项目采用 `solo mode`，推荐最短链路为 `/team-intake -> /team-plan -> /team-execute -> /team-review -> /team-release -> /team-closeout`。详见 [solo-delivery-mode.md](solo-delivery-mode.md) 和 [solo-delivery-one-page.md](solo-delivery-one-page.md)。

## 3.1 specialist 与平台体检命令

| 命令 | 作用 | 典型回落位置 |
|------|------|--------------|
| `/plan` | 深度规划与拆阶段 | `/handoff`、`/team-plan` |
| `/tdd` | 先测后码的 red-green-refactor 路径 | `/team-execute`、`/handoff` |
| `/code-review` | 实现质量、回归与风险审查 | `/handoff`、`/team-review` |
| `/build-fix` | 构建失败定位与修复 | `/team-execute`、`/handoff` |
| `/verify` | 验证回环、关键路径确认 | `/team-review`、`/team-release` |
| `/multi-frontend` | 前端多视角并行分析 | `/handoff`、`/team-plan` |
| `/multi-backend` | 后端多视角并行分析 | `/handoff`、`/team-plan` |
| `/harness-audit` | 平台能力面评分、缺口与优先级建议 | 平台治理、文档补齐、命令/skill 收敛 |

## 4. 共享能力

| Shared Skill | 作用 |
|--------------|------|
| `api-contract` | 固化接口、错误码和兼容性 |
| `frontend-engineering` | 统一 React/Next 优先的前端工程规范与交付质量 |
| `frontend-ui-ux-system` | 统一产品视觉方向、设计 token、交互与体验门禁 |
| `doc-architecture` | 将 discovery / modeling / consistency audit 输出映射到 artifacts/adr/memory |

其中方案设计、目标澄清、backlog 拆解、事故协同、发布准备度和测试口径对齐都不再单独暴露成 shared skill，而是分别收敛到角色主链、模板、QA 手册和专题 runbook 中。

文档架构能力的执行细则见 [doc-architecture-integration.md](doc-architecture-integration.md)。
第一次实际使用可直接按 [doc-architecture-quick-start.md](doc-architecture-quick-start.md) 跑最小闭环。

## 5. 企业扩展层

- 公开仓的 `skills/` 只承载公开能力，不再内置企业内部 skills。
- 企业扩展改由私有 `enterprise` overlay 提供，公开仓只保留安装位与兼容入口。
- 启用策略由 `/team-intake` 和 `/team-plan` 决定，不默认把私有领域扩展施加到所有任务上。
- 公开安装与分发约定见 [custom-overlay.md](custom-overlay.md)。
- 任何需要企业内部 runbook、toolkit、examples 或脚本的场景，都应在私有 overlay 环境中完成。

## 5.1 代码图谱能力（CodeGraph + Graphify + GitNexus）

- CodeGraph 作为默认内置 MCP-backed 代码智能能力接入，定位是 brownfield 符号搜索、调用链、impact 和 focused context。
- Graphify 作为轻量结构证据能力接入，定位是 brownfield 结构扫描、架构问答和依赖路径证据补充。
- GitNexus 作为受控可选代码智能能力接入，定位是 MCP 查询、impact、detect_changes、多仓分析和更深代码图谱证据。
- 推荐组合：`/team-help -> /update-codemaps -> npm run codegraph:doctor -> codegraph init -i -> 图谱查询 -> /team-plan`；需要轻量结构证据时补 Graphify，需要跨模块或多仓影响面时补 GitNexus。
- 输出必须在 handoff 或 artifacts 中引用关键结论，不创建平行责任链。
- TSP 只通过 target-scoped wrapper 调用 CodeGraph installer，不使用 `--target=auto`，也不在安装时运行 `codegraph init -i`。
- 详细操作见 [codegraph-code-intelligence-usage.md](codegraph-code-intelligence-usage.md)、[graphify-knowledge-graph-usage.md](graphify-knowledge-graph-usage.md) 与 [gitnexus-code-intelligence-usage.md](gitnexus-code-intelligence-usage.md)。

## 6. ECC Harness Layer

### 5.1 specialist agents

- `agents/specialists/` 提供 27 个规划、review、build-fix、文档和编排专项代理
- specialist 结论不直接形成最终交付，必须回落到 role handoff 或 `/team-*`

### 5.2 ECC commands

- 快捷命令包括 `/plan`、`/tdd`、`/code-review`、`/build-fix`、`/verify`、`/multi-frontend`、`/multi-backend`
- 它们用于 specialist 编排，不替代团队主链

### 5.3 ECC skills 与 rules

- `skills/`：精选工程技能入口，建议按三类理解：

| 类别 | 技能 | 适用场景 |
|------|------|----------|
| 调试与验证（结构认知） | `graphify`、`gitnexus` | brownfield 结构扫描、依赖路径分析、架构问答、MCP 查询、impact / detect_changes 证据补齐 |
| 调试与验证 | `browser-smoke-testing`、`pairwise-test-design`、`testcontainers-integration-testing`、`systematic-debugging`、`java-unit-test`、`maven-qa`、`mysql-query`、`eval-harness` | 浏览器回归、组合压缩、集成验证、系统化排障、语言/数据库专项、EDD |
| 编排与效率 | `parallel-execution`、`strategic-compact`、`cost-aware-llm-pipeline`、`harness-audit` | 并行执行、长会话整理、成本控制、平台能力自检 |
| 学习与记忆 | `error-experience-library`、`continuous-learning` | 错误模式沉淀、instinct 学习与演进 |

- 如果你想知道每个命令通常搭配哪些 skill，直接看 [command-and-capability-matrix.md](command-and-capability-matrix.md)
- `rules/common/`：通用工程规则
- `rules/typescript/`、`rules/java/`、`rules/python/`、`rules/golang/`：语言专项规则
- 配套工程实践手册：[git-pr-workflow.md](git-pr-workflow.md)、[ai-pr-review-automation.md](ai-pr-review-automation.md)、[reviewdog-pr-gates.md](reviewdog-pr-gates.md)、[api-breaking-change-gates.md](api-breaking-change-gates.md)、[api-lint-gates.md](api-lint-gates.md)、[dependency-review-gates.md](dependency-review-gates.md)、[dependency-update-automation.md](dependency-update-automation.md)、[codeql-pr-security-gates.md](codeql-pr-security-gates.md)、[secret-scanning-gates.md](secret-scanning-gates.md)、[actionlint-workflow-gates.md](actionlint-workflow-gates.md)、[github-token-permissions-baseline.md](github-token-permissions-baseline.md)、[zizmor-workflow-audits.md](zizmor-workflow-audits.md)、[checkov-iac-gates.md](checkov-iac-gates.md)、[kyverno-policy-gates.md](kyverno-policy-gates.md)、[trivy-security-gates.md](trivy-security-gates.md)、[kubeconform-schema-gates.md](kubeconform-schema-gates.md)、[conftest-policy-gates.md](conftest-policy-gates.md)、[helm-unittest-playbook.md](helm-unittest-playbook.md)、[kubectl-server-dry-run-gates.md](kubectl-server-dry-run-gates.md)、[scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)、[runner-egress-hardening.md](runner-egress-hardening.md)、[sbom-generation-gates.md](sbom-generation-gates.md)、[artifact-attestation-gates.md](artifact-attestation-gates.md)、[cosign-signing-gates.md](cosign-signing-gates.md)、[slsa-verification-gates.md](slsa-verification-gates.md)、[slsa-generator-patterns.md](slsa-generator-patterns.md)、[in-toto-attestation-framework.md](in-toto-attestation-framework.md)、[policy-controller-gates.md](policy-controller-gates.md)、[witness-policy-gates.md](witness-policy-gates.md)、[contract-testing-playbook.md](contract-testing-playbook.md)、[release-notes-automation.md](release-notes-automation.md)
- 详细使用见 [ecc-harness-usage.md](ecc-harness-usage.md)、[error-experience-usage.md](error-experience-usage.md)、[parallel-execution-usage.md](parallel-execution-usage.md)

### 5.4 runtime hooks 与 memory

- hooks 配置位于 `hooks/hooks.json`
- 当前公开 runtime 入口位于 `scripts/hooks/`，至少包括：
  - 会话持久化：`session-start-bootstrap.js`、`session-start.js`、`session-end.js`、`session-end-marker.js`
  - 上下文整理：`pre-compact.js`、`suggest-compact.js`
  - 观察与治理：`governance-capture.js`、`mcp-health-check.js`
  - 质量与成本：`quality-gate.js`、`cost-tracker.js`
- Claude legacy 安装脚本现在会复制这些 JS hooks，并清理旧 `.py` hook 注册
- 默认写入 `docs/memory/`、`docs/memory/sessions/`、`~/.claude/memory/audit/` 与 `~/.claude/metrics/` 等本地目录
- 如果你要理解这些能力如何配合 specialist 与主链，先看 [ecc-harness-usage.md](ecc-harness-usage.md)；如果你想单独看后台机制，继续看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)

## 7. 前端能力包

### 6.1 适用场景

- 页面、组件、样式、导航、表单、图表或前端静态资源发生变更
- `tech-lead` 在 intake 或 plan 阶段已确认存在 UI 交付物

### 6.2 默认使用方式

1. `tech-lead` 在 `/team-intake` 和 `/team-plan` 锁定产品类型、目标端、设计约束、响应式基线、A11y/性能门禁。
2. `frontend-engineer` 优先使用 `frontend-engineering` 确定组件结构、状态流和工程边界。
3. 若目标项目明确采用自定义前端样式 profile，再按需阅读 [frontend-enterprise-style-profile.md](frontend-enterprise-style-profile.md) 与对应 toolkit。
4. `frontend-engineer`、`qa-engineer`、`tech-lead` 在涉及体验决策和评审时使用 `frontend-ui-ux-system`。
5. 进入 QA 前，前端任务必须补齐 [ui-review-checklist.md](../../templates/ui-review-checklist.md)。

### 6.3 相关规则与模板

- 规则：[frontend-engineering-standards.md](../../rules/frontend-engineering-standards.md)、[frontend-ui-ux-standards.md](../../rules/frontend-ui-ux-standards.md)、[frontend-quality-gates.md](../../rules/frontend-quality-gates.md)
- 模板：[design-system-brief.md](../../templates/design-system-brief.md)、[ui-implementation-plan.md](../../templates/ui-implementation-plan.md)、[ui-review-checklist.md](../../templates/ui-review-checklist.md)
- 专题手册：[frontend-governance.md](frontend-governance.md)

## 8. 安装方式

### 7.1 推荐安装方式

```bash
node scripts/build-platform-artifacts.js
node scripts/install-apply.js --profile team --target claude
node scripts/install-apply.js --profile full --target codex
```

推荐优先使用 `install-apply.js`。它会按 profile 选择安装模块，并与当前 JS runtime、平铺 `skills/` 目录和生成产物保持一致。

### 7.2 Legacy shell wrappers

```bash
node scripts/build-platform-artifacts.js
CODEX_HOME_DIR="$HOME/.codex" AGENTS_HOME_DIR="$HOME/.agents" ./scripts/install-codex.sh
CLAUDE_HOME_DIR="$HOME/.claude" ./scripts/install-claude.sh
```

legacy shell wrappers 仍可用，但底层已统一转到 `scripts/install-platform.js` 的当前 JS 安装链路。

### 7.3 安装后会发生什么

- Codex：把插件同步到 `$CODEX_HOME_DIR/plugins/team-skills-platform`，并把 marketplace 合并到 `$AGENTS_HOME_DIR/plugins/marketplace.json`
- Claude：同步平铺 `skills/`、`agents/`、`commands/`、`rules/`、`templates/`，并注册当前 JS hooks 到 `settings.json`
- 两端都把 `/team-help` 作为公开主链入口；正式任务输出仍需通过 `artifact:persist` 回写到项目仓库

### 7.4 安装校验

首次安装后，建议先确认文件是否落到预期位置：

- Claude：`~/.claude/commands/team-intake.md`、`~/.claude/agents/roles/tech-lead.md`、`~/.claude/examples/project-CLAUDE.md`
- Codex：`$CODEX_HOME_DIR/plugins/team-skills-platform/commands/team-intake.md`、`$CODEX_HOME_DIR/plugins/team-skills-platform/agents/roles/tech-lead.md`
- Codex marketplace：`$AGENTS_HOME_DIR/plugins/marketplace.json` 中存在 `team-skills-platform`

如果安装位置不对，优先检查：

- 是否先运行了 `node scripts/build-platform-artifacts.js`
- 是否通过 `CODEX_HOME_DIR`、`AGENTS_HOME_DIR`、`CLAUDE_HOME_DIR` 覆盖了默认目录
- 是否误把历史导入源当成正式安装入口

### 7.5 新项目接入

如果你的目标不是体验单条命令，而是把平台正式接入一个新仓库，建议直接阅读 [project-onboarding.md](project-onboarding.md)。这份文档覆盖项目级 `CLAUDE.md` 准备、角色和 skills 装配、第一条主链任务、以及提交前校验。

如果你已经明确项目属于某个 vertical，也可以直接从 [../../examples/INDEX.md](../../examples/INDEX.md) 选择模板；如果你想先确认该 vertical 的 starter、walkthrough、demo script 和 execution log 是否都已补齐，再看 [vertical-scenario-capability-matrix.md](vertical-scenario-capability-matrix.md)。

## 9. 首次调用示例

### 9.1 Claude 中的最小闭环

建议先在目标项目根目录准备一份项目级 `CLAUDE.md`，可以从 [../../examples/project-CLAUDE.md](../../examples/project-CLAUDE.md) 或专项样例复制。

第一次对话建议只做一个最小闭环：

1. 用 `tech-lead` 视角运行 `/team-intake`
2. 用 `tech-lead` 视角运行 `/team-plan`
3. 若任务很小，直接转 `/code-review` 或 `/team-execute`
4. 需要交接时运行 `/handoff`

示例输入：

```text
/team-intake
目标：为 Spring Boot 订单服务新增审批 API
范围：接口、权限校验、测试计划
不做：前端页面、运维发布脚本改造
约束：必须评估 私有流程与权限集成 是否需要启用
输出：参与角色、初始风险、下一步计划
```

后续继续：

```text
/team-plan
基于上一步 intake 结果，拆解 architect、backend-engineer、qa-engineer 的任务。
要求给出依赖关系、是否启用 custom overlay、每个 handoff 的最小交付物。
```

### 9.2 Codex 中的最小闭环

Codex 安装的是完整插件目录，因此更适合在一个仓库里连续执行主链和 specialist 组合。

推荐顺序：

1. 先用 `/team-intake` 锁定目标和约束
2. 再用 `/plan` 或 `/multi-frontend`、`/multi-backend` 做专项拆解
3. 用 `/handoff` 把专项结论回收到主链
4. 最后进入 `/team-review` 或 `/team-release`

示例输入：

```text
/team-intake
目标：修复 Next.js 控制台首页在 iPad 下的布局溢出
范围：页面布局、视觉回归、响应式验证
约束：必须遵守 frontend-quality-gates，并附上 ui-review-checklist
```

专项示例：

```text
/multi-frontend
基于当前 intake 结果，分别从实现、UI/UX、QA 风险三个视角拆解工作。
要求指出哪些结论必须进入最终 handoff，哪些只作为参考建议。
```

## 10. 何时用主链，何时用 specialist

- `/team-*` 适合负责最终决策、角色分派、交付收口
- `/plan`、`/code-review`、`/build-fix`、`/multi-*` 适合产出专项分析
- specialist 结论不是最终交付，必须回落到 `/handoff` 或对应主责角色
- 简单 bug fix 可以走短链路，但仍然要保留 handoff 和验证证据

## 11. 维护方式

1. 先改 `roles/`、`skills/`、`skills/`、`skills/`、`rules/` 或 `templates/`。
2. 新增开源 skill / 工程实践前，先登记 [external-capability-intake.md](external-capability-intake.md)。
3. 运行 `node scripts/build-platform-artifacts.js`。
4. 运行 `node scripts/validate-library.js`。
5. 再执行安装或提交。

## 12. 常见问题

### 12.1 为什么安装后看不到命令

优先检查安装目录里是否真的存在命令文件，例如 `~/.claude/commands/team-intake.md` 或 `$CODEX_HOME_DIR/plugins/team-skills-platform/commands/team-intake.md`。如果文件不存在，通常是构建未执行或安装目录覆盖错了。

### 12.2 为什么 specialist 给出的结论不能直接当最终结果

因为这个平台的工作模型是 `tech-lead` 编排 + 专业角色协作。specialist 用来缩短专项分析路径，但最终责任仍在主链角色，不在 specialist 本身。

### 12.3 custom overlay 什么时候启用

只有在 `/team-intake` 或 `/team-plan` 判断任务真的涉及 私有流程、权限集成 或其他公司域能力时才启用，默认不加载到所有任务。

### 12.4 新增的 memory / 并行能力从哪里看

- 错误经验库与错误模式沉淀：看 [error-experience-usage.md](error-experience-usage.md)
- 并行执行与 Git worktree 协作：看 [parallel-execution-usage.md](parallel-execution-usage.md)
- 命令、skills 与推荐组合：看 [command-and-capability-matrix.md](command-and-capability-matrix.md)
- runtime hooks、observe、cost、budget、instinct、compact：看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
- 想看一份完整演示：看 [demo-scenario.md](demo-scenario.md) 和 [demo-execution-log.md](demo-execution-log.md)
- 想看本轮新增能力的专用演示：看 [platform-capability-demo-script.md](platform-capability-demo-script.md) 和 [platform-capability-demo-execution-log.md](platform-capability-demo-execution-log.md)
- 想按垂直项目类型直接复用演示台账：看 [github-actions-supply-chain-demo-execution-log.md](github-actions-supply-chain-demo-execution-log.md)、[ai-eval-platform-demo-execution-log.md](ai-eval-platform-demo-execution-log.md) 和 [mobile-miniapp-demo-execution-log.md](mobile-miniapp-demo-execution-log.md)
- 想按垂直项目类型直接照着讲：看 [github-actions-supply-chain-demo-script.md](github-actions-supply-chain-demo-script.md)、[ai-eval-platform-demo-script.md](ai-eval-platform-demo-script.md) 和 [mobile-miniapp-demo-script.md](mobile-miniapp-demo-script.md)
- 想继续看更多 vertical 的完整 demo：看 [iac-kubernetes-platform-demo-script.md](iac-kubernetes-platform-demo-script.md)、[plugin-extension-platform-demo-script.md](plugin-extension-platform-demo-script.md)、[data-ml-pipeline-demo-script.md](data-ml-pipeline-demo-script.md) 以及对应的 execution log
- 想按表格查看所有 vertical 的材料覆盖：看 [vertical-scenario-capability-matrix.md](vertical-scenario-capability-matrix.md)
- 想对外介绍平台：看 [../presentation/README.md](../presentation/README.md)
- 想按管理层、实施接入或培训三类听众选 presentation 材料：看 [../presentation/audience-presentation-route-map.md](../presentation/audience-presentation-route-map.md)
- 想在 runbook 层直接拿一页或阅读路径：看 [executive-value-one-page.md](executive-value-one-page.md)、[implementation-onboarding-reading-path.md](implementation-onboarding-reading-path.md) 和 [team-training-reading-path.md](team-training-reading-path.md)

## 13. 回归要求

- 活跃入口中不再暴露历史流程模型。
- 交接必须遵循 `rules/handoff-contract.md`。
- 角色技能与 agent prompt 必须和 `roles/*/role.yaml` 保持一致。
- 前端任务必须满足 `rules/frontend-quality-gates.md`。
- specialist、ECC commands、custom overlay技能、rules packs、runtime hooks 必须可安装、可校验、可回落到主团队链路。
