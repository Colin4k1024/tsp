# Team Skills Platform

## CLAUDE.md — 团队操作手册入口

> 本文件与 `AGENTS.md` 保持同义，用于 Claude / 多 Agent 平台读取团队规则、角色入口和操作方式。

---

## 一句话说明

这是一个 **公司级角色化 Team Skills 平台**：

- 默认由 `tech-lead` 编排；
- 通过 8 个专业角色协作完成需求、方案、研发、测试与发布；
- 通过脚本自动生成 `skills/roles/`、`agents/`、`commands/` 和插件清单；
- 内置 React/Next 优先的前端工程规范与 UI/UX 治理能力；
- 内置 ECC 风格的 specialist agents、commands、rules packs、runtime hooks；
- 同时支持 Codex 与 Claude 两种消费方式。

---

## 角色清单

| 角色 ID | 角色说明 |
|---------|----------|
| `tech-lead` | 统一 intake、拆解、分派、冲突决策与交付收口 |
| `product-manager` | 需求、PRD、用户故事、验收标准 |
| `project-manager` | 排期、依赖、里程碑、风险推进 |
| `architect` | ADR、边界、接口与数据契约 |
| `frontend-engineer` | 前端实现与自测 |
| `backend-engineer` | 后端实现与自测 |
| `qa-engineer` | 测试计划、回归验证、放行建议 |
| `devops-engineer` | 发布、监控、回滚与运行保障 |

---

## 团队命令

- `/team-intake`
- `/team-plan`
- `/handoff`
- `/team-execute`
- `/team-review`
- `/team-release`

## Specialist 命令

- `/plan`
- `/tdd`
- `/code-review`
- `/build-fix`
- `/verify`
- `/pua`
- `/multi-frontend`
- `/multi-backend`
- `/harness-audit`
- `/agent-dev`
- `/quick`
- `/pause`
- `/resume`

详细定义见 `commands/` 目录。

---

## ECC Harness Layer

- specialist agents 位于 `agents/specialists/`（已合入 ECC 全量 specialist agent 集）
- ECC 精选技能位于 `skills/`，150+ 平铺技能目录位于 `skills/`，总计 200+ skills
- 公司领域扩展技能位于 `skills/`（canonical source）
- Node.js 安装工具链：`node scripts/install-apply.js --profile <name> --target <platform>`，支持 10 个安装目标（claude/cursor/antigravity/codex/gemini/opencode/codebuddy/copilot/windsurf/augment）、`team`、`enterprise`、`full` 等 profile
- common / language rules 位于 `rules/common/` 与各语言子目录（kotlin/rust/swift/cpp/csharp/php/perl/zh 等）
- hooks、contexts、examples、mcp-configs 提供可扩展运行时入口

其中运行时增强能力当前至少包括：

- memory persistence：会话摘要、待办与决策回存
- observation：工具调用观察与模式提取
- context management：budget、compact、archive 与 trigger-based 重组
- cost awareness：会话成本记录与任务复杂度分级
- instinct learning：项目级 / 全局级持续学习
- evolution：经验基因（Gene）沉淀、Replay-First 复用、跨 Agent 共享（详见 [evolution-usage.md](docs/runbooks/evolution-usage.md)）
- rtk token optimization：CLI 代理透明重写 Bash 命令，降低 60-90% token 消耗（`hooks/rtk-rewrite.sh`，详见 [rtk-token-optimization-usage.md](docs/runbooks/rtk-token-optimization-usage.md)）
- enhanced workflows（融合 superpowers / gstack / GSD）：
  - discuss-phase：设计讨论（Forcing Questions + 假设分析）
  - quick-execution：小范围快速执行（跳过完整 /team-* 链路）
  - brainstorming：苏格拉底式头脑风暴（多视角对比 + 分层呈现）
  - wave-execution：基于依赖图的波次并行执行
  - subagent-driven-development：子代理驱动开发工作流
  - session-continuity：会话暂停/恢复（STATE.md 快照）
  - multi-perspective-review：多视角评审（用户/工程/安全/运维）
  - cross-model-review：跨模型第二意见（可选增强层）
  - model-profiles：任务类型自动识别 + 模型路由
  - quality-gates-taxonomy：四类门禁分类标准
- context engineering & isolation（Phase 4）：
  - context-engineering：四层文档（PROJECT/REQUIREMENTS/ROADMAP/STATE）+ token 预算控制
  - git-worktree-isolation：一任务一 worktree 隔离 + merge/PR/keep/discard 结构化收口
  - workflow-forensics：工作流事后调查 + 失败模式识别 + 诊断报告
  - context-docs templates：`templates/context-docs/` 四模板（PROJECT/REQUIREMENTS/ROADMAP/STATE）

---

## 前端能力包

- `frontend-engineering`：前端工程规范、组件模式、可访问性与性能基线
- `frontend-ui-ux-system`：产品类型、设计 token、交互、响应式与 UI 质量门禁
- 相关规则见 `rules/frontend-*.md`
- 相关模板见 `templates/design-system-brief.md`、`templates/ui-implementation-plan.md`、`templates/ui-review-checklist.md`

## 文档架构能力包

- `doc-architecture`：将 discovery / modeling / consistency audit 能力并入 `/team-*` 主链
- 整合手册：`docs/runbooks/doc-architecture-integration.md`
- 快速开始：`docs/runbooks/doc-architecture-quick-start.md`
- 默认映射目标：`docs/artifacts/`、`docs/adr/`、`docs/memory/`

---

## 关键规则

1. 角色只对本角色主责范围负责，不替他人越权拍板。
2. 所有角色交接都遵循 `rules/handoff-contract.md`。
3. 需求冲突、方案冲突、质量争议、发布风险统一升级给 `tech-lead`。
4. 修改 `roles/` 或 `templates/system/` 后，必须重新运行平台生成脚本。
5. `/team-*` 命令产出（PRD、Delivery Plan、Arch Design、Execute Log、Handoff 记录、Test Plan、Release Plan、ADR）必须按 [artifact-persistence.md](docs/runbooks/artifact-persistence.md) 约定落文件到消费方仓库的 `docs/artifacts/`、`docs/adr/` 和 `docs/memory/`，不允许只停留在对话上下文中。
6. 每条命令触发哪个 agent、agent 之间如何传递，见 [sub-agent-invocation-map.md](docs/runbooks/sub-agent-invocation-map.md)。
7. 所有 agent（role + specialist）统一遵循 [agent-governance.md](docs/runbooks/agent-governance.md) 中的管控策略，单个 agent 文件里的局部约束以本文件为准。
8. 全量 Agent 交接路径、Handoff 矩阵与反向推理规则见 [handoff-governance.md](docs/runbooks/handoff-governance.md)。

---

## 思维原则

### 第一性原理

所有角色在思考和决策时，必须遵循第一性原理：

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

## 常用脚本

```bash
node scripts/build-platform-artifacts.js
node scripts/validate-library.js
# 安装到 Claude
node scripts/install-apply.js --profile team --target claude
# 安装到 Codex
node scripts/install-apply.js --profile full --target codex
# 安装到 Cursor
node scripts/install-apply.js --profile full --target cursor
# 安装到 OpenCode
node scripts/install-apply.js --profile full --target opencode
```

---


## 快速选择

| 你的情况 | 推荐入口 |
|---------|----------|
| 第一次安装并试跑 | [docs/runbooks/claude-quick-start.md](docs/runbooks/claude-quick-start.md) |
| 想按任务场景查 Claude 怎么用 | [docs/runbooks/claude-usage-scenarios.md](docs/runbooks/claude-usage-scenarios.md) |
| 想按任务场景查 Codex 怎么用 | [docs/runbooks/codex-usage-scenarios.md](docs/runbooks/codex-usage-scenarios.md) |
| 想在 Cursor 中上手 | [docs/runbooks/cursor-quick-start.md](docs/runbooks/cursor-quick-start.md) |
| 想在 OpenCode 中上手 | [docs/runbooks/opencode-quick-start.md](docs/runbooks/opencode-quick-start.md) |
| 想直接复制高频提示模板 | [docs/runbooks/claude-conversation-prompt-recipes.md](docs/runbooks/claude-conversation-prompt-recipes.md) |
| 想直接复制 Codex 并行表达 | [docs/runbooks/codex-parallel-prompt-recipes.md](docs/runbooks/codex-parallel-prompt-recipes.md) |
| 想按角色直接复制常用说法 | [docs/runbooks/role-prompt-recipes.md](docs/runbooks/role-prompt-recipes.md) |
| 想快速判断 company / runbook / toolkit | [docs/runbooks/enterprise-extension-quick-start.md](docs/runbooks/enterprise-extension-quick-start.md) |
| 想先看命令、skills 和 runtime 的总矩阵 | [docs/runbooks/command-and-capability-matrix.md](docs/runbooks/command-and-capability-matrix.md) |
| 想看 ECC 运行时能力与记忆/并行增强 | [docs/runbooks/ecc-harness-usage.md](docs/runbooks/ecc-harness-usage.md) |
| 想单独理解 runtime hooks 与后台机制 | [docs/runbooks/runtime-capabilities-overview.md](docs/runbooks/runtime-capabilities-overview.md) |
| 想知道哪个命令调用哪个子 agent | [docs/runbooks/sub-agent-invocation-map.md](docs/runbooks/sub-agent-invocation-map.md) |
| 想查看所有 agent 的统一管控策略 | [docs/runbooks/agent-governance.md](docs/runbooks/agent-governance.md) |
| 想看完整演示场景与执行记录 | [docs/runbooks/demo-execution-log.md](docs/runbooks/demo-execution-log.md) |
| 想看汇报材料与生成脚本 | [docs/presentation/README.md](docs/presentation/README.md) |
| 准备长期接入项目 | [docs/runbooks/project-onboarding.md](docs/runbooks/project-onboarding.md) |
| 想完整走一遍主链 | [docs/runbooks/first-team-workflow-walkthrough.md](docs/runbooks/first-team-workflow-walkthrough.md) |
| 安装或命令异常 | [docs/runbooks/troubleshooting.md](docs/runbooks/troubleshooting.md) |

更多规范、样例和进阶文档，统一从 [README.md](README.md) 的”文档入口”进入。

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, “is this worth building”, brainstorming → invoke office-hours
- Bugs, errors, “why is this broken”, 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
