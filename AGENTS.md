# Team Skills Platform

## AGENTS.md — 团队操作手册入口

> 本文件是当前仓库的团队协作入口。所有 AI Agent、Tech Lead、产品、研发、测试与运维角色在开始工作前，先阅读本文件，确认角色边界、命令面、交接规则和文档入口。

---

## 平台概述

本仓库承载的是一套 **公司级角色化 Team Skills 平台**，不是业务应用本身。

| 属性 | 值 |
|------|----|
| 工作模型 | `Tech Lead` 编排 + 专业角色协作 |
| 角色数量 | 8 |
| 分发目标 | Codex + Claude |
| Canonical Source | `roles/`、`skills/`、`rules/`、`templates/` |
| 生成产物 | `skills/roles/`、`agents/roles/`、`agents/specialists/`、`commands/`、插件清单 |
| 前端治理 | React/Next 优先 + UI/UX 设计知识库 + 强制质量门禁 |
| Harness Layer | ECC 风格 specialists + commands + rules packs + runtime hooks |

---

## 角色矩阵

| 角色 | 主责输出 | 标准交接对象 |
|------|----------|--------------|
| `tech-lead` | 任务拆解、仲裁结论、最终收口 | 全角色 |
| `product-manager` | PRD、用户故事、验收标准 | `tech-lead`、`architect`、`project-manager` |
| `project-manager` | 排期、依赖、风险、里程碑 | `tech-lead` |
| `architect` | ADR、系统边界、接口/数据契约 | 前后端、QA、`tech-lead` |
| `frontend-engineer` | 前端实现说明、代码变更、自测结果 | `qa-engineer`、`tech-lead` |
| `backend-engineer` | 后端实现说明、代码变更、自测结果 | `qa-engineer`、`devops-engineer`、`tech-lead` |
| `qa-engineer` | 测试计划、回归结果、放行建议 | `tech-lead`、`devops-engineer` |
| `devops-engineer` | 发布方案、环境变更、回滚与监控 | `tech-lead`、`architect` |

---

## 命令面

| 命令 | 用途 | 默认主责 |
|------|------|----------|
| `/team-help` | 根据当前阶段、artifacts 与阻塞项推荐下一步主链命令 | `tech-lead` |
| `/team-intake` | 接收需求并锁定目标、范围、约束 | `tech-lead` |
| `/team-plan` | 拆解任务、角色分工、依赖与里程碑 | `tech-lead` |
| `/handoff` | 在角色间做结构化交接 | `tech-lead` |
| `/team-execute` | 驱动研发角色在边界内实施 | `frontend-engineer` / `backend-engineer` |
| `/team-review` | 做方案、质量、测试和放行评审 | `qa-engineer` |
| `/team-release` | 做发布准备、上线检查与回滚保障 | `devops-engineer` |
| `/team-closeout` | 在观察窗口结束后做最终收口与 backlog 回写 | `tech-lead` |
| `/plan` | specialist 规划入口 | `planner` |
| `/tdd` | specialist 测试先行入口 | `tdd-guide` |
| `/code-review` | specialist 代码评审入口 | `code-reviewer` |
| `/build-fix` | specialist 构建修复入口 | `build-error-resolver` |
| `/verify` | 验证循环入口 | `loop-operator` |
| `/pua` | 高能动性与高压闭环模式入口 | `planner` |
| `/multi-frontend` | 前端多代理编排 | `planner` |
| `/multi-backend` | 后端多代理编排 | `planner` |
| `/harness-audit` | 平台能力面审计与改进建议 | `harness-optimizer` |
| `/agent-dev` | 交互式 AI Agent 开发 Workshop | `agent-builder` |
| `/quick` | 小范围快速执行（跳过完整 /team-* 链路） | 当前角色 |
| `/pause` | 暂停当前会话并生成恢复快照 | 当前角色 |
| `/resume` | 从暂停快照恢复会话继续执行 | 当前角色 |
| `/model-route` | 按任务复杂度与预算建议模型档位 | 当前角色 |
| `/evolve` | 演进生命周期管理（instinct/gene） | 当前角色 |
| `/learn` | 从会话提炼可复用模式并沉淀 | 当前角色 |

命令说明见：

- [commands/team-help.md](commands/team-help.md)
- [commands/team-intake.md](commands/team-intake.md)
- [commands/team-plan.md](commands/team-plan.md)
- [commands/handoff.md](commands/handoff.md)
- [commands/team-execute.md](commands/team-execute.md)
- [commands/team-review.md](commands/team-review.md)
- [commands/team-release.md](commands/team-release.md)
- [commands/team-closeout.md](commands/team-closeout.md)
- [commands/plan.md](commands/plan.md)
- [commands/code-review.md](commands/code-review.md)
- [commands/build-fix.md](commands/build-fix.md)
- [commands/verify.md](commands/verify.md)
- [commands/pua.md](commands/pua.md)
- [commands/multi-frontend.md](commands/multi-frontend.md)
- [commands/multi-backend.md](commands/multi-backend.md)
- [commands/agent-dev.md](commands/agent-dev.md)
- [commands/quick.md](commands/quick.md)
- [commands/pause.md](commands/pause.md)
- [commands/resume.md](commands/resume.md)
- [commands/model-route.md](commands/model-route.md)
- [commands/evolve.md](commands/evolve.md)
- [commands/learn.md](commands/learn.md)

---

## 规则与模板

### 工作规则

- [team-operating-model.md](rules/team-operating-model.md)
- [handoff-contract.md](rules/handoff-contract.md)
- [artifact-standards.md](rules/artifact-standards.md)
- [escalation-policy.md](rules/escalation-policy.md)
- [frontend-engineering-standards.md](rules/frontend-engineering-standards.md)
- [frontend-ui-ux-standards.md](rules/frontend-ui-ux-standards.md)
- [frontend-quality-gates.md](rules/frontend-quality-gates.md)
- [frontend-design-knowledge-base.md](rules/frontend-design-knowledge-base.md)
- [handoff-governance.md](docs/runbooks/handoff-governance.md)
- [README.md](rules/README.md)

### 标准模板

- [api-contract.md](templates/api-contract.md)
- [design-system-brief.md](templates/design-system-brief.md)
- [ui-implementation-plan.md](templates/ui-implementation-plan.md)
- [ui-review-checklist.md](templates/ui-review-checklist.md)
- [release-plan.md](templates/release-plan.md)
- [deployment-context.md](templates/deployment-context.md)
- [launch-acceptance.md](templates/launch-acceptance.md)
- [closeout-summary.md](templates/closeout-summary.md)
- [backlog-snapshot.md](templates/backlog-snapshot.md)

PRD、Delivery Plan、ADR、Test Plan、Incident Brief，以及上线 / 收口类 artifact 的最小字段要求已并入 [artifact-standards.md](rules/artifact-standards.md)。

### 前端能力包

- 共享 Skill：[frontend-engineering](skills/frontend-engineering/SKILL.md)、[frontend-ui-ux-system](skills/frontend-ui-ux-system/SKILL.md)
- 专题手册：[frontend-governance.md](docs/runbooks/frontend-governance.md)
- 默认要求：涉及前端变更时，`tech-lead`、`frontend-engineer`、`qa-engineer` 必须按前端规则和门禁工作。

### 文档架构能力包

- 共享 Skill：[doc-architecture](skills/doc-architecture/SKILL.md)
- 整合手册：[doc-architecture-integration.md](docs/runbooks/doc-architecture-integration.md)
- 快速开始：[doc-architecture-quick-start.md](docs/runbooks/doc-architecture-quick-start.md)
- 默认要求：涉及架构文档补齐或演进时，优先映射到 `docs/artifacts/`、`docs/adr/`、`docs/memory/`，不新增并行主目录。

### 社区扩展层（Custom Overlay）

- 额外 skills、rules、runbook 可通过自定义 overlay 叠加，不包含在公开仓主体中
- 扩展入口：[custom-overlay.md](docs/runbooks/custom-overlay.md)
- 开源能力搜罗入口：[external-capability-intake.md](docs/runbooks/external-capability-intake.md)

### ECC Harness Layer

- specialist agents：位于 `agents/specialists/`，用于规划、review、build-fix、文档和多代理编排（已合入 ECC 全量 specialist agent 集）
- 精选技能：位于 `skills/`（统一平铺目录），总计 200+ skills，当前可按三类理解：
	- 调试与验证：浏览器 smoke、pairwise、testcontainers、systematic debugging、eval-harness、语言与数据库专项能力
	- 编排与效率：parallel-execution、wave-execution、strategic-compact、cost-aware-llm-pipeline、harness-audit、subagent-driven-development
	- 学习与记忆：error-experience-library、continuous-learning、session-continuity
	- 经验进化：evolution-core（基因模型与存储）、evolution-network（跨 Agent 基因共享）、Replay-First 执行器、Governor 安全控制
	- 增强工作流（融合 superpowers / gstack / GSD）：discuss-phase（设计讨论）、quick-execution（小范围快速执行）、brainstorming（头脑风暴）、multi-perspective-review（多视角评审）、cross-model-review（跨模型第二意见）、model-profiles（模型路由配置）、quality-gates-taxonomy（门禁分类标准）
	- 上下文工程与隔离：context-engineering（四层文档 PROJECT/REQUIREMENTS/ROADMAP/STATE + token 预算）、git-worktree-isolation（一任务一 worktree 隔离 + 结构化收口决策）、workflow-forensics（工作流事后调查 + 失败模式识别）
- 上下文文档模板：位于 `templates/context-docs/`，包含 PROJECT.md、REQUIREMENTS.md、ROADMAP.md、STATE.md 四个模板
- Node.js 安装工具链：`node scripts/install-apply.js --profile <name> --target <claude|codex|cursor|opencode|copilot|windsurf|augment> [--overlay <id>]...` 支持 10 个安装目标、6 个公开 profile；自定义能力可通过 overlay 叠加
- 工程实践手册：[git-pr-workflow.md](docs/runbooks/git-pr-workflow.md)、[ai-pr-review-automation.md](docs/runbooks/ai-pr-review-automation.md)、[reviewdog-pr-gates.md](docs/runbooks/reviewdog-pr-gates.md)、[api-breaking-change-gates.md](docs/runbooks/api-breaking-change-gates.md)、[api-lint-gates.md](docs/runbooks/api-lint-gates.md)、[dependency-review-gates.md](docs/runbooks/dependency-review-gates.md)、[dependency-update-automation.md](docs/runbooks/dependency-update-automation.md)、[codeql-pr-security-gates.md](docs/runbooks/codeql-pr-security-gates.md)、[secret-scanning-gates.md](docs/runbooks/secret-scanning-gates.md)、[actionlint-workflow-gates.md](docs/runbooks/actionlint-workflow-gates.md)、[github-token-permissions-baseline.md](docs/runbooks/github-token-permissions-baseline.md)、[zizmor-workflow-audits.md](docs/runbooks/zizmor-workflow-audits.md)、[checkov-iac-gates.md](docs/runbooks/checkov-iac-gates.md)、[kyverno-policy-gates.md](docs/runbooks/kyverno-policy-gates.md)、[trivy-security-gates.md](docs/runbooks/trivy-security-gates.md)、[kubeconform-schema-gates.md](docs/runbooks/kubeconform-schema-gates.md)、[conftest-policy-gates.md](docs/runbooks/conftest-policy-gates.md)、[helm-unittest-playbook.md](docs/runbooks/helm-unittest-playbook.md)、[kubectl-server-dry-run-gates.md](docs/runbooks/kubectl-server-dry-run-gates.md)、[scorecard-supply-chain-gates.md](docs/runbooks/scorecard-supply-chain-gates.md)、[runner-egress-hardening.md](docs/runbooks/runner-egress-hardening.md)、[sbom-generation-gates.md](docs/runbooks/sbom-generation-gates.md)、[artifact-attestation-gates.md](docs/runbooks/artifact-attestation-gates.md)、[cosign-signing-gates.md](docs/runbooks/cosign-signing-gates.md)、[slsa-verification-gates.md](docs/runbooks/slsa-verification-gates.md)、[slsa-generator-patterns.md](docs/runbooks/slsa-generator-patterns.md)、[in-toto-attestation-framework.md](docs/runbooks/in-toto-attestation-framework.md)、[policy-controller-gates.md](docs/runbooks/policy-controller-gates.md)、[witness-policy-gates.md](docs/runbooks/witness-policy-gates.md)、[contract-testing-playbook.md](docs/runbooks/contract-testing-playbook.md)、[release-notes-automation.md](docs/runbooks/release-notes-automation.md)
- 可选代码图谱能力：`skills/graphify/` + [graphify-knowledge-graph-usage.md](docs/runbooks/graphify-knowledge-graph-usage.md) 用于轻量 brownfield 结构扫描；`skills/gitnexus/` + [gitnexus-code-intelligence-usage.md](docs/runbooks/gitnexus-code-intelligence-usage.md) 用于受控 MCP 查询、impact、detect_changes 与多仓图谱证据。
- 能力边界：Graphify / GitNexus 都只作为可选分析能力，不替代 `/team-*` 主链；禁止在本仓库执行会改写现有 AGENTS/hooks/MCP 契约的自动 setup 类命令。
- 分层规则：位于 `rules/common/` 与语言规则目录
- rtk token optimization：CLI 代理透明重写 Bash 命令，降低 60-90% token 消耗（`hooks/rtk-rewrite.sh`），详见 [rtk-token-optimization-usage.md](docs/runbooks/rtk-token-optimization-usage.md)
- 运行时能力与 hooks：见 [ecc-harness-usage.md](docs/runbooks/ecc-harness-usage.md)、[runtime-capabilities-overview.md](docs/runbooks/runtime-capabilities-overview.md)、[error-experience-usage.md](docs/runbooks/error-experience-usage.md)、[parallel-execution-usage.md](docs/runbooks/parallel-execution-usage.md)、[evolution-usage.md](docs/runbooks/evolution-usage.md)

---

## 目录导航

```text
harness-public/
├── roles/                 # 角色唯一事实源
├── skills/                # 全部技能（共享 + ECC + 领域 + 框架）统一平铺
├── skills/roles/          # 生成产物：角色型 skills
├── agents/roles/          # 生成产物：角色 agent prompt
├── agents/specialists/    # ECC 风格 specialist agents
├── commands/              # 团队命令 + ECC 快捷命令
├── rules/                 # 平台规则 + common/language packs
├── hooks/                 # hooks 配置入口
├── contexts/              # 动态上下文模板
├── examples/              # CLAUDE 配置样例
├── mcp-configs/           # MCP 配置模板
├── manifests/             # Node.js 安装清单（profiles / modules / components）
├── templates/             # 标准模板与生成模板
├── scripts/               # JS 主导的 build / validate / install / runtime
├── docs/runbooks/         # 使用与操作手册
└── docs/plans/            # 迁移与演进计划
```

---

## Agent 工作约定

1. 修改角色能力前，先改 `roles/*/role.yaml` 或 `skills/` 的源文件，不要手改生成产物。
2. 修改 `roles/`、`templates/system/`、命令定义后，必须执行 `node scripts/build-platform-artifacts.js`。
3. 提交前必须执行 `node scripts/validate-library.js` 与 `node scripts/validate-doc-freshness.js`。
4. 角色交接必须遵循 [handoff-contract.md](rules/handoff-contract.md)。
5. 如果需求、优先级、质量或发布时间窗冲突，升级给 `tech-lead`，不要各自隐式拍板。
6. 涉及前端任务时，必须补齐 UI 范围、设计约束、响应式和 A11y/性能门禁，不允许把体验问题留到最后收尾。
7. 使用 specialist commands 时，结论必须回落到 role handoff 或 `/team-*`，不要形成平行责任链。
8. 新增公司领域 skill 直接在 `skills/` 下创建，遵循 `SKILL.md` + `agents/openai.yaml` 结构；不再设暂存区。
9. 新增开源 skill / 工程实践前，先更新 [external-capability-intake.md](docs/runbooks/external-capability-intake.md)，完成来源、许可证、分层去向和状态判定。
10. `/team-*` 命令产出（PRD、Delivery Plan、Arch Design、Execute Log、Handoff 记录、Test Plan、Release Plan、ADR）必须按 [artifact-persistence.md](docs/runbooks/artifact-persistence.md) 约定写入消费方项目仓库的 `docs/artifacts/`、`docs/adr/` 和 `docs/memory/`，不允许只在对话中输出。
11. 每条命令触发哪个 agent、agent 之间如何传递，见 [sub-agent-invocation-map.md](docs/runbooks/sub-agent-invocation-map.md)。
12. 所有 agent（role + specialist）统一遵循 [agent-governance.md](docs/runbooks/agent-governance.md) 中的管控策略，单个 agent 文件里的局部约束以本文件为准。

---
1. 不要假设我清楚自己想要什么。动机或目标不清晰时，停下来讨论。
2. 目标清晰但路径不是最短的，直接告诉我并建议更好的办法。
3. 遇到问题追根因，不打补丁。每个决策都要能回答"为什么"。
4. 输出说重点，砍掉一切不改变决策的信息。
## 思维原则

### 第一性原理

所有 Agent 在思考和决策时，必须遵循第一性原理：

- **从最基本的真理出发**：不默认继承历史方案，从「为什么需要这样做」的根本问题开始
- **分解到不可再分**：将复杂问题分解到最基本的前提，逐层向上构建
- **挑战既有假设**：不因为「一直都是这样」就接受，追问「为什么必须如此」
- **反向推导验证**：基于「如果不这么做，最坏的结果是什么」验证决策

### 苏格拉底式三问

每个关键决策必须能回答以下三个问题：

| 问题 | 含义 | 在决策中的应用 |
|------|------|--------------|
| **Evidence（证据）** | 这个结论有什么数据/事实支持？ | 不基于直觉或惯例做决策 |
| **Reasoning（推理）** | 我是如何从证据得出结论的？ | 确保推理过程合理且可追溯 |
| **Implications（影响）** | 这个结论会导致什么后果？ | 考虑最坏情况并准备回退方案 |

各角色的具体第一性原理思考方式和苏格拉底式三问，见 `roles/<role-id>/role.yaml` 中的 `first_principles` 和 `socratic_questions` 字段。

---

## 快速开始

```bash
# 安装 Node.js 依赖（首次）
npm install

# 生成平台产物（角色 agents/skills/commands）
node scripts/build-platform-artifacts.js

# 校验平台
node scripts/validate-library.js
node scripts/validate-doc-freshness.js

# Graphify 可选能力前置检查（仅检查，不自动安装）
npm run graphify:doctor

# GitNexus 可选能力前置检查（仅检查，不自动安装）
npm run gitnexus:doctor

# ─── Node.js 主导安装（推荐）───────────────────────────────
# 安装 team 配置文件（公开角色工作流 + 核心技能）到 Claude
node scripts/install-apply.js --profile team --target claude

# 安装 full 配置文件（ECC 全量）到其他平台
node scripts/install-apply.js --profile full --target codex
node scripts/install-apply.js --profile full --target cursor
node scripts/install-apply.js --profile full --target opencode

# 预览安装计划（不执行）
node scripts/install-plan.js --profile team --target claude

# ─── Python 遗留脚本（仍可用）────────────────────────────
CODEX_HOME_DIR=/tmp/codex AGENTS_HOME_DIR=/tmp/agents ./scripts/install-codex.sh
CLAUDE_HOME_DIR=/tmp/claude ./scripts/install-claude.sh
CURSOR_HOME_DIR=/tmp/cursor ./scripts/install-cursor.sh
OPENCODE_CONFIG_DIR=/tmp/opencode ./scripts/install-opencode.sh
```

更多说明见 [docs/runbooks/team-skills-usage.md](docs/runbooks/team-skills-usage.md)、[docs/runbooks/ecc-harness-usage.md](docs/runbooks/ecc-harness-usage.md)、[docs/runbooks/custom-overlay.md](docs/runbooks/custom-overlay.md)、[docs/runbooks/external-capability-intake.md](docs/runbooks/external-capability-intake.md)、[docs/runbooks/git-pr-workflow.md](docs/runbooks/git-pr-workflow.md)、[docs/runbooks/ai-pr-review-automation.md](docs/runbooks/ai-pr-review-automation.md)、[docs/runbooks/reviewdog-pr-gates.md](docs/runbooks/reviewdog-pr-gates.md)、[docs/runbooks/api-breaking-change-gates.md](docs/runbooks/api-breaking-change-gates.md)、[docs/runbooks/api-lint-gates.md](docs/runbooks/api-lint-gates.md)、[docs/runbooks/dependency-review-gates.md](docs/runbooks/dependency-review-gates.md)、[docs/runbooks/dependency-update-automation.md](docs/runbooks/dependency-update-automation.md)、[docs/runbooks/codeql-pr-security-gates.md](docs/runbooks/codeql-pr-security-gates.md)、[docs/runbooks/secret-scanning-gates.md](docs/runbooks/secret-scanning-gates.md)、[docs/runbooks/actionlint-workflow-gates.md](docs/runbooks/actionlint-workflow-gates.md)、[docs/runbooks/github-token-permissions-baseline.md](docs/runbooks/github-token-permissions-baseline.md)、[docs/runbooks/zizmor-workflow-audits.md](docs/runbooks/zizmor-workflow-audits.md)、[docs/runbooks/checkov-iac-gates.md](docs/runbooks/checkov-iac-gates.md)、[docs/runbooks/kyverno-policy-gates.md](docs/runbooks/kyverno-policy-gates.md)、[docs/runbooks/trivy-security-gates.md](docs/runbooks/trivy-security-gates.md)、[docs/runbooks/kubeconform-schema-gates.md](docs/runbooks/kubeconform-schema-gates.md)、[docs/runbooks/conftest-policy-gates.md](docs/runbooks/conftest-policy-gates.md)、[docs/runbooks/helm-unittest-playbook.md](docs/runbooks/helm-unittest-playbook.md)、[docs/runbooks/kubectl-server-dry-run-gates.md](docs/runbooks/kubectl-server-dry-run-gates.md)、[docs/runbooks/scorecard-supply-chain-gates.md](docs/runbooks/scorecard-supply-chain-gates.md)、[docs/runbooks/runner-egress-hardening.md](docs/runbooks/runner-egress-hardening.md)、[docs/runbooks/sbom-generation-gates.md](docs/runbooks/sbom-generation-gates.md)、[docs/runbooks/artifact-attestation-gates.md](docs/runbooks/artifact-attestation-gates.md)、[docs/runbooks/cosign-signing-gates.md](docs/runbooks/cosign-signing-gates.md)、[docs/runbooks/slsa-verification-gates.md](docs/runbooks/slsa-verification-gates.md)、[docs/runbooks/slsa-generator-patterns.md](docs/runbooks/slsa-generator-patterns.md)、[docs/runbooks/in-toto-attestation-framework.md](docs/runbooks/in-toto-attestation-framework.md)、[docs/runbooks/policy-controller-gates.md](docs/runbooks/policy-controller-gates.md)、[docs/runbooks/witness-policy-gates.md](docs/runbooks/witness-policy-gates.md)、[docs/runbooks/contract-testing-playbook.md](docs/runbooks/contract-testing-playbook.md) 和 [docs/runbooks/release-notes-automation.md](docs/runbooks/release-notes-automation.md)。

主链输出字段定义见 [docs/runbooks/team-command-output-contracts.md](docs/runbooks/team-command-output-contracts.md)，本轮文档核对台账见 [docs/runbooks/document-execution-audit.md](docs/runbooks/document-execution-audit.md)。


<claude-mem-context>
# Memory Context

# [harness-public] recent context, 2026-05-07 9:45am GMT+8

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 46 obs (10,442t read) | 684,793t work | 98% savings

### Apr 27, 2026
947 9:29a 🟣 Global Project Progress Monitor Script Requested
948 9:34a 🟣 Global Multi-Project Progress Monitoring Script Requested
953 11:13a 🟣 Global Project Progress Script — scripts/project-progress.js
954 11:18a 🟣 Global Project Progress Monitoring Script Requested
959 1:21p ✅ Push harness-public to GitHub (Colin4k1024/tsp)
960 1:24p ✅ harness-public main branch successfully pushed to GitHub
961 1:25p 🔵 AGENTS.md has uncommitted local modifications after push
### May 7, 2026
2278 8:47a 🔵 harness-public git pull — 本地未提交修改存在，fast-forward 拉取进行中
2279 8:48a ✅ harness-public git pull 完成 — Already up to date
2280 8:51a 🔵 harness-public git pull blocked by local modifications
2281 " 🔵 harness-public 外部能力台账全量盘点 — 40+ 项已批准并大部分完成本地化落地
2282 8:52a 🔵 nexu-io/open-design — Claude Design 开源替代品纳入评估
2283 " 🔵 harness-public 安装配置系统架构 — 模块/组件/Profile 三层结构确认
2284 8:55a 🟣 Open Design 受控接入完成 — harness-public 新增设计工作台能力链路
2297 9:00a 🔵 harness-public 运行环境缺少 npm/pnpm/corepack — 仅有 Codex 捆绑 node
2298 " 🔵 platform-configs 模块路径 .cursor 在磁盘上不存在
2299 9:01a 🟣 design-prototyping 模块 manifest 引用完整性验证通过
2301 " ✅ skills/open-design/agents/openai.yaml 补齐 — validate-skill-structure 警告消除
2311 9:09a 🟣 harness-public 新增 install-open-design.js 安装脚本
2312 " ✅ install-modules.json 注册 open-design 模块的 externalInstall 配置
2313 9:10a 🟣 install-executor.js 新增 resolveExternalInstalls 支持外部安装步骤
2314 " 🟣 install/apply.js 实现 runExternalInstall 执行外部安装脚本
2315 " ✅ install-apply.js dry-run 输出新增 externalInstalls 预览
2316 " ✅ install-plan.js printPlan 新增 External install plan 输出段
2317 9:11a ✅ install/apply.js 调整外部安装执行顺序：先执行再写状态
2318 " 🔴 install-open-design.js 分离 corepack 和 pnpm 可用性检查
2319 " ✅ open-design-integration.md 更新文档反映 full profile 自动安装行为
2320 9:12a ✅ harness-public README.md 更新 Open Design 安装行为说明
2321 " ✅ external-capability-intake.md 更新 open-design 条目落位策略为 full-profile-sidecar-install
2322 " 🔵 install-open-design.js dry-run 验证通过 — 语法检查和逻辑流全绿
2323 9:13a 🔵 design-prototyping 模块在 codex target 下被 skipped，导致 externalInstalls 返回空数组
2324 " ✅ install-modules.json 移除 design-prototyping 对 framework-language 的依赖
2325 9:14a 🔴 design-prototyping externalInstall 在全部 6 个 target 下均正确触发
2336 9:25a 🔵 harness-public npm publish 环境缺少 npm 命令
2337 " 🔵 npm 存在于 /usr/local/bin 但未在 PATH 中
2338 9:27a 🔵 harness-public 发布前 10 个 tracked 文件有未提交变更
2339 9:28a ✅ harness-public @colin4k1024/tsp 版本号升级至 2.4.2
2342 9:29a 🔵 harness-public 库验证通过 — v2.4.2 内容快照
2343 " 🔵 harness-public v2.4.2 发布前验证状态 — 结构警告 177 条但不阻塞发布
2349 9:39a 🟣 @colin4k1024/tsp v2.4.2 release prepared with open-design integration
2350 9:41a 🔵 npm publish uses browser OAuth flow, not --otp flag, for @colin4k1024/tsp@2.4.2
2351 9:42a 🟣 @colin4k1024/tsp@2.4.2 successfully published to npmjs registry
2352 9:43a ✅ v2.4.2 release commit pushed to GitHub main branch
2353 " ✅ git tag v2.4.2 pushed to GitHub — tsp v2.4.2 release fully complete
2354 " 🔵 tsp v2.4.2 release state verified: tag on HEAD, only AGENTS.md dirty
2355 9:45a 🔵 harness-public GitHub 推送状态全量核查完成 — main 分支与 v2.4.2 tag 均已同步

Access 685k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>