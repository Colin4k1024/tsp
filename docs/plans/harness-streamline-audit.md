# Coding Agent Harness 精简审计报告

> 生成日期: 2026-08-07
> 目标: 精简 TSP 项目，聚焦 coding agent harness 核心能力

---

## 当前规模

| 类别 | 数量 | 问题 |
|------|------|------|
| Skills | 167 | 大量非编码领域技能混入 |
| Commands | 88 | 语言专属命令可合并 |
| Rules | 87 | 14 个子目录，语言包冗余 |
| Hooks | 42 脚本 + 30 注册 | 部分 hook 未使用或重复 |
| Agents | 24 (10 role + 14 specialist) | 部分 specialist 可合并 |
| Docs | 204 | demo 脚本和安全门禁文档过多 |
| Scripts | 170 | 安装目标过多 (14 个平台) |
| Install Targets | 14 | 应聚焦 3-4 个核心平台 |

---

## Skills 精简方案

### 保留: 核心编码能力 (约 50 个)

**编码模式与标准 (12)**
- python-patterns, golang-patterns, rust-patterns, kotlin-patterns, coding-standards
- backend-patterns, frontend-patterns, api-design, database-migrations
- docker-patterns, deployment-patterns, postgres-patterns

**测试 (8)**
- python-testing, golang-testing, rust-testing, kotlin-testing
- tdd-workflow, e2e-testing, ai-regression-testing, eval-harness

**架构与代码理解 (6)**
- codebase-architecture-investigation, hexagonal-architecture
- codegraph, graphify, gitnexus, agent-patterns-catalog

**Agent 工程 (8)**
- agent-harness-construction, agentic-engineering, ai-first-engineering
- context-engineering, context-lifecycle, strategic-compact
- evolution-core, continuous-learning-v2

**工作流与编排 (8)**
- team-builder, blueprint, quick-execution, subagent-driven-development
- wave-execution, parallel-execution, git-workflow, git-worktree-isolation

**代码质量 (6)**
- security-review, security-scan, karpathy-guidelines
- rtk-token-optimization, cost-aware-llm-pipeline, coding-standards

**工具集成 (4)**
- claude-api, mcp-server-patterns, configure-ecc, workspace-surface-audit

### 保留: PUA 系列 (合并为 3 个)
- pua (核心)
- pua-p9 (技术负责人模式)
- pua-loop (自动迭代)
- **删除**: pua-mama, pua-p7, pua-p10, pua-pro, pua-yes (合并入 pua 核心)

### 删除: 非编码领域技能 (约 40 个)

**供应链/物流/制造** → 删除
- carrier-relationship-management, customs-trade-compliance
- energy-procurement, inventory-demand-planning
- logistics-exception-management, production-scheduling
- quality-nonconformance, returns-reverse-logistics

**商业/营销/社交** → 删除
- brand-voice, connections-optimizer, content-engine, crosspost
- lead-intelligence, investor-materials, investor-outreach
- market-research, sales, customer-billing-ops

**文档/内容创作** → 删除
- article-writing, research-paper-writing, visa-doc-translate
- data-scraper-agent, google-workspace-ops

**移动端/特定平台** → 删除
- android-clean-architecture, compose-multiplatform-patterns
- foundation-models-on-device, liquid-glass-design
- swift-actor-persistence, swift-concurrency-6-2
- swift-protocol-di-testing, swiftui-patterns

**Web 框架** → 合并或删除
- django-patterns, django-security, django-tdd, django-verification → 合并为 1 个
- laravel-patterns, laravel-security, laravel-tdd, laravel-verification, laravel-plugin-discovery → 合并为 1 个
- springboot-patterns, springboot-security, springboot-tdd, springboot-verification → 合并为 1 个
- goframe-v2 → 删除 (与 golang-patterns 重复)

**其他可删除**
- nanoclaw-repl, dmux-workflows, remotion-video-creation
- fal-ai-media, videodb, video-editing, manim-video, html-to-video-pipeline
- ui-demo, ui-ux-promax, open-design, frontend-slides
- plankton-code-quality, langfuse-coding-trace
- benchmark, browser-qa, browser-smoke-testing
- clickhouse-io, mysql-query, maven-qa

### 保留但降级为可选 (约 15 个)
- brainstorming, discuss-phase, session-continuity
- prompt-optimizer, token-budget-advisor
- search-first, deep-research, exa-search
- claude-devfleet, goal-convergence, ralphinho-rfc-pipeline
- rework-loop, loop-heartbeat, continuous-agent-loop
- regex-vs-llm-structured-text, content-hash-cache-pattern

---

## Commands 精简方案

### 合并: 语言专属命令 (12 → 3)

**当前**: cpp-build, cpp-review, cpp-test, go-build, go-review, go-test, kotlin-build, kotlin-review, kotlin-test, rust-build, rust-review, rust-test

**合并为**:
- `/build <lang>` - 统一构建命令
- `/review <lang>` - 统一审查命令
- `/test <lang>` - 统一测试命令

### 合并: PRP 系列 (5 → 2)

**当前**: prp-commit, prp-implement, prp-plan, prp-pr, prp-prd

**合并为**:
- `/prp plan` - PRD + 计划
- `/prp exec` - 实现 + 提交 + PR

### 合并: Multi-* 系列 (5 → 1)

**当前**: multi-backend, multi-execute, multi-frontend, multi-plan, multi-workflow

**合并为**:
- `/multi <subcommand>` - 统一多代理编排

### 合并: Session 管理 (6 → 2)

**当前**: checkpoint, pause, resume, resume-session, save-session, sessions

**合并为**:
- `/session save|resume|list` - 统一会话管理

### 合并: Loop 系列 (3 → 1)

**当前**: loop-start, loop-status, santa-loop

**合并为**:
- `/loop start|status|stop` - 统一循环管理

### 合并: Instinct 系列 (3 → 1)

**当前**: instinct-export, instinct-import, instinct-status

**合并为**:
- `/instinct export|import|status`

### 删除: 低价值命令
- aside, claw, dashboard, devfleet, gan-build, gan-design, gradle-build
- graph-impact, graph-visualize, heartbeat, learn-eval
- orchestrate, pm2, projects, prune, promote
- refactor-clean, replay, rules-distill
- setup-pm, skill-create, skill-health, trigger-pipeline, triage
- update-codemaps, update-docs

### 保留: 核心命令 (约 25 个)
- team-help, team-intake, team-plan, team-execute, team-review, team-release, team-closeout
- handoff, plan, tdd, code-review, build-fix, verify, quick, pua
- harness-audit, learn, evolve, model-route, quality-gate
- build, review, test (合并后)
- prp, multi, session, loop, instinct (合并后)

---

## Rules 精简方案

### 当前: 14 个子目录, 87 个文件

**保留**:
- `rules/common/` - 核心通用规则 (保留全部 11 个)
- `rules/typescript/` - 主力语言 (保留)
- `rules/python/` - 主力语言 (保留)
- `rules/golang/` - 主力语言 (保留)
- `rules/rust/` - 主力语言 (保留)
- 平台规则 (8 个顶层文件) - 保留

**合并为通用模板**:
- `rules/java/`, `rules/kotlin/` → 合并为 `rules/jvm/`
- `rules/cpp/`, `rules/csharp/` → 合并为 `rules/compiled/`
- `rules/perl/`, `rules/php/` → 合并为 `rules/scripting/`
- `rules/swift/` → 删除 (移动端技能已删除)
- `rules/zh/` → 保留 (中文用户需要)

**删除**:
- `rules/swift/` 整个目录

---

## Hooks 精简方案

### 当前: 42 个 hook 脚本, 30 个注册

**保留: 核心 hook (15 个)**
- `pre-bash-block-no-verify.js` - 安全基线
- `rtk-rewrite.sh` - token 优化
- `harness-statusline.js` - 状态栏
- `harness-prompt-guard.js` - 注入防护
- `session-start.js` / `session-end.js` - 会话生命周期
- `pre-compact.js` / `suggest-compact.js` - 上下文管理
- `cost-tracker.js` - 成本追踪
- `quality-gate.js` - 质量门禁
- `post-edit-format.js` / `post-edit-typecheck.js` - 代码格式化
- `check-console-log.js` - 代码质量
- `config-protection.js` - 配置保护
- `mcp-health-check.js` - MCP 健康检查

**删除: 未使用或冗余 (约 20 个)**
- `auto-tmux-dev.js` - 特定工作流
- `check-hook-enabled.js` - 元 hook
- `codegraph-auto-init.js` - 可合并入 session-start
- `desktop-notify.js` - 非核心
- `doc-file-warning.js` - 低价值
- `evaluate-session.js` - 可合并入 session-end
- `governance-capture.js` - 过度治理
- `insaits-security-wrapper.js` - 特定集成
- `post-bash-build-complete.js` - 低价值
- `post-bash-command-log.js` - 审计过度
- `post-bash-pr-created.js` - 特定场景
- `post-edit-accumulator.js` - 可合并
- `post-edit-console-warn.js` - 与 check-console-log 重复
- `pre-agent-model-router.js` - 可合并入 session-start
- `pre-bash-commit-quality.js` - 与 quality-gate 重复
- `pre-bash-dev-server-block.js` - 特定场景
- `pre-bash-git-push-reminder.js` - 低价值
- `pre-bash-tmux-reminder.js` - 特定工作流
- `pre-write-doc-warn.js` - 低价值
- `pua-*` 系列 (4 个) - 合并入核心 pua hook
- `run-with-flags.js` - 元 hook
- `session-end-marker.js` - 与 session-end 重复
- `session-start-bootstrap.js` / `session-start-goal-resume.js` - 合并入 session-start
- `stop-format-typecheck.js` / `stop-hook-bootstrap.js` - 合并入 session-end

---

## Agents 精简方案

### Roles: 10 → 8

**删除**:
- `graph-engineer` - 非核心角色
- `loop-engineer` - 非核心角色

**保留**:
- tech-lead, product-manager, project-manager
- architect, frontend-engineer, backend-engineer
- qa-engineer, devops-engineer

### Specialists: 14 → 8

**删除**:
- `architect.md` - 与 role 重复
- `chief-of-staff` - 非编码角色
- `database-reviewer` - 合并入 code-reviewer
- `docs-lookup` - 非核心
- `e2e-runner` - 合并入 tdd-guide
- `refactor-cleaner` - 非核心
- `harness-optimizer` - 非核心

**保留**:
- build-error-resolver, code-reviewer, doc-updater
- loop-operator, planner, security-reviewer, tdd-guide

---

## Install Targets 精简方案

### 当前: 14 个平台

**保留: 核心平台 (4)**
- claude (主要)
- codex (次要)
- opencode (次要)
- cursor (次要)

**降级为社区维护 (4)**
- cangming, copilot, windsurf, codebuddy

**删除 (6)**
- antigravity, augment, codewhale, gemini, grok

---

## Docs 精简方案

### 当前: 204 个 markdown 文件

**删除: demo 脚本 (约 40 个)**
- `docs/extras/security-gates/` (18 个) → 移至独立仓库或删除
- `docs/examples/demos/` (27 个) → 保留 5 个核心 demo

**合并: runbooks (107 → 约 40)**
- 删除所有 `*-demo-execution-log.md` 和 `*-demo-script.md`
- 合并相似 runbook (如多个 quick-start)

**保留**:
- `docs/guides/` - 核心指南
- `docs/runbooks/` 中的核心 runbook
- `docs/examples/team-workflows/` - 团队工作流示例
- `docs/plans/` - 计划文档

---

## Scripts 精简方案

### 删除: 过时脚本
- `test-cangming-install.js`, `test-opencode-install.js` - 特定平台测试
- `trigger-gitlab-pipeline.js` - 特定 CI
- `langfuse-trace.js` - 特定集成

### 合并: lib/ 子目录
- `lib/install-targets/` (14 个) → 保留 4 个核心平台
- `lib/skill-evolution/`, `lib/skill-improvement/` → 合并为 `lib/evolution/`
- `lib/session-adapters/` → 合并入 `lib/session/`

---

## 预期效果

| 类别 | 当前 | 精简后 | 减少 |
|------|------|--------|------|
| Skills | 167 | ~55 | -67% |
| Commands | 88 | ~25 | -72% |
| Rules | 87 | ~50 | -43% |
| Hooks | 42 | ~15 | -64% |
| Agents | 24 | ~16 | -33% |
| Docs | 204 | ~80 | -61% |
| Scripts | 170 | ~100 | -41% |
| Install Targets | 14 | 4 | -71% |

**总体精简: ~60% 的文件可删除或合并**

---

## 执行优先级

1. **P0 - 立即执行**: 删除非编码领域 skills (供应链/物流/制造/营销)
2. **P1 - 高优先级**: 合并语言专属 commands 和 rules
3. **P2 - 中优先级**: 精简 hooks 和 docs
4. **P3 - 低优先级**: 合并 scripts 和 install targets

---

## 风险评估

- **向后兼容**: 删除的 skills/commands 可能被用户自定义配置引用
- **文档完整性**: 删除 docs 需要更新所有交叉引用
- **测试覆盖**: 删除后需要重新运行验证
- **安装脚本**: 需要同步更新 install-modules.json 和 install-profiles.json
