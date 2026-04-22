# LLM Surface Reduction Execution Checklist

本文是面向执行的减法清单。目标不是继续分析，而是给出一份可以按阶段推进、逐项勾选的行动列表。
> 历史命令说明：文中勾选记录里的 `python3 scripts/build_platform_artifacts.py` 与 `python3 scripts/validate_library.py` 为当时执行命名；当前等价命令分别为 `node scripts/build-platform-artifacts.js` 与 `node scripts/validate-library.js`。

审计结论看 [llm-surface-reduction-audit.md](llm-surface-reduction-audit.md)，逐阶段历史看 [llm-surface-reduction-execution-history.md](llm-surface-reduction-execution-history.md)。

## 1. 执行目标

- 降低 `skills`、`commands`、`templates` 的表面积。
- 删除主要在重复现代 LLM 通用能力的包装层。
- 保留平台主链、企业专属能力、具体工具链能力和前端治理门禁。

## 2. 执行原则

1. 先删命名噪音，不碰主链。
2. 先删“薄包装”，后合并“弱独立价值”对象。
3. 每一阶段都必须先完成引用清理，再删实体目录或文件。
4. 每一阶段完成后都重新生成产物并跑校验。

## 3. 第一阶段：先做，风险最低

执行状态：已于 2026-03-29 完成。

### 3.1 删除或并入 `skills/search-first`

- [x] 已将“先查事实再下结论”的要求并回 specialist 生成源
- [x] 已更新 `scripts/team_skills_platform.py`
- [x] 已删除 `skills/search-first/`

### 3.2 删除或并入 `skills/requirements-analysis`

- [x] 已将需求澄清能力收敛回角色主链与示例文档
- [x] 已更新 `roles/tech-lead/role.yaml`
- [x] 已更新 `scripts/team_skills_platform.py`
- [x] 已更新相关 runbook、examples、README
- [x] 已删除 `skills/requirements-analysis/`

### 3.3 删除或并入 `skills/feature-backlog`

- [x] 已将 backlog / milestone 拆解收敛回角色主链与迁移文档
- [x] 已更新 `roles/tech-lead/role.yaml`
- [x] 已更新 `scripts/team_skills_platform.py`
- [x] 已更新相关 runbook、examples、README
- [x] 已删除 `skills/feature-backlog/`

### 3.4 删除或并入 `skills/incident-response`

- [x] 已将事故协作要求收敛回 runbook 和调试约束
- [x] 已更新 `scripts/team_skills_platform.py`
- [x] 已更新相关 runbook、README
- [x] 已删除 `skills/incident-response/`

### 3.5 删除 `/eval`

- [x] 已将公开评估入口收敛回 `/verify` 与现有评审链路
- [x] 已更新 `scripts/team_skills_platform.py`
- [x] 已更新相关 README / 生成产物
- [x] 已删除 `commands/eval.md`

### 3.6 删除 `/sessions`

- [x] 已将 `/sessions` 降级为内部流程，不再作为公开命令
- [x] 已更新 `scripts/team_skills_platform.py`
- [x] 已更新相关 README / 生成产物
- [x] 已删除 `commands/sessions.md`

### 3.7 合并 `/orchestrate`、`/multi-workflow`、`/multi-execute`

- [x] 已明确最终保留 `/plan`、`/multi-frontend`、`/multi-backend`
- [x] 已更新 `scripts/team_skills_platform.py`
- [x] 已更新相关 README / runbook / 生成产物
- [x] 已删除 `commands/multi-execute.md`、`commands/multi-workflow.md`、`commands/orchestrate.md`

### 3.8 合并 `/multi-plan` 到 `/plan`

- [x] 已把“并行规划”语义吸收到 `/plan`
- [x] 已更新 `scripts/team_skills_platform.py`
- [x] 已更新相关文档与生成产物
- [x] 已删除 `commands/multi-plan.md`

### 3.9 第一阶段收尾

- [x] 已运行历史命令 `python3 scripts/build_platform_artifacts.py`（当前等价：`node scripts/build-platform-artifacts.js`）
- [x] 已运行历史命令 `python3 scripts/validate_library.py`（当前等价：`node scripts/validate-library.js`）
- [x] 已更新 [docs/plans/llm-surface-reduction-audit.md](llm-surface-reduction-audit.md) 中第一阶段状态

## 4. 第二阶段：合并薄 skill 和薄命令

### 4.1 shared skills

- [x] 已合并 `skills/solution-design` 到 `architect` / `tech-lead`
- [x] 已合并 `skills/release-readiness` 到 `devops-engineer` / 发布治理 runbook

### 4.2 ecc skills

- [x] 已合并 `skills/coding-standards`
- [x] 已合并 `skills/verification-loop`
- [x] 已合并 `skills/frontend-patterns`
- [x] 已合并 `skills/backend-patterns`
- [x] 已合并 `skills/api-design`
- [x] 已合并 `skills/deployment-patterns`
- [x] 已合并 `skills/tdd-workflow`
- [x] 已合并 `skills/security-review`

### 4.3 commands

- [x] 已合并 `/multi-execute` 到最终保留的协调入口
- [x] 已合并 `/test-coverage` 到 `/tdd`
- [x] 已将 `/update-docs` 降级为 specialist 内部能力

### 4.4 第二阶段收尾

- [x] 运行历史命令 `python3 scripts/build_platform_artifacts.py`（当前等价：`node scripts/build-platform-artifacts.js`）
- [x] 运行历史命令 `python3 scripts/validate_library.py`（当前等价：`node scripts/validate-library.js`）
- [x] 更新 [docs/plans/llm-surface-reduction-audit.md](llm-surface-reduction-audit.md) 中第二阶段状态

## 5. 第三阶段：模板减法

### 5.1 优先评估删除

- [x] `templates/prd.md`
- [x] `templates/delivery-plan.md`
- [x] `templates/test-plan.md`
- [x] `templates/incident-brief.md`

### 5.2 暂缓项

- [x] `templates/adr.md` 已确认企业内控补充区可迁移，并回写到 `rules/artifact-standards.md`

### 5.3 替代动作

- [x] 将保留的字段要求回写到 `rules/artifact-standards.md`
- [x] 将高频模板示例内嵌到对应 runbook 中
- [x] 更新 README、AGENTS、CLAUDE、examples 和所有模板链接入口

### 5.4 第三阶段收尾

- [x] 运行历史命令 `python3 scripts/build_platform_artifacts.py`（当前等价：`node scripts/build-platform-artifacts.js`）
- [x] 运行历史命令 `python3 scripts/validate_library.py`（当前等价：`node scripts/validate-library.js`）
- [x] 更新 [docs/plans/llm-surface-reduction-audit.md](llm-surface-reduction-audit.md) 中第三阶段状态

## 5.5 第四阶段：剩余边界项收敛

- [x] 已评估 `skills/test-strategy`
- [x] 已将测试口径收敛回 `qa-engineer`、`artifact-standards.md` 和测试相关 runbook
- [x] 已更新 `scripts/team_skills_platform.py`、`roles/qa-engineer/role.yaml`、相关 examples 与 runbook
- [x] 运行历史命令 `python3 scripts/build_platform_artifacts.py`（当前等价：`node scripts/build-platform-artifacts.js`）
- [x] 运行历史命令 `python3 scripts/validate_library.py`（当前等价：`node scripts/validate-library.js`）
- [x] 更新 [docs/plans/llm-surface-reduction-audit.md](llm-surface-reduction-audit.md) 中最终状态

## 6. 当前明确不要动的项

### 6.1 skills（company 领域）

- [ ] 保留 `skills/*` 全部

### 6.2 高价值 ecc skills

- [ ] 保留 `browser-smoke-testing`
- [ ] 保留 `java-unit-test`
- [ ] 保留 `maven-qa`
- [ ] 保留 `mysql-query`
- [ ] 保留 `pairwise-test-design`
- [ ] 保留 `systematic-debugging`
- [ ] 保留 `testcontainers-integration-testing`

### 6.3 核心命令

- [ ] 保留 `/team-intake`
- [ ] 保留 `/team-plan`
- [ ] 保留 `/team-execute`
- [ ] 保留 `/handoff`
- [ ] 保留 `/team-review`
- [ ] 保留 `/team-release`
- [ ] 保留 `/plan`
- [ ] 保留 `/code-review`
- [ ] 保留 `/build-fix`
- [ ] 保留 `/verify`
- [ ] 保留 `/multi-frontend`
- [ ] 保留 `/multi-backend`

### 6.4 核心模板

- [ ] 保留 `templates/api-contract.md`
- [ ] 保留 `templates/ui-implementation-plan.md`
- [ ] 保留 `templates/ui-review-checklist.md`
- [ ] 保留 `templates/release-plan.md`
- [ ] 保留 `templates/design-system-brief.md`

## 7. 每一轮实际执行都要同步修改的地方

- [ ] `roles/*/role.yaml`
- [ ] `scripts/team_skills_platform.py`
- [ ] `README.md`
- [ ] `AGENTS.md`
- [ ] `CLAUDE.md`
- [ ] `docs/runbooks/team-skills-usage.md`
- [ ] 相关 `examples/*.md`
- [ ] 对应 usage-scenarios / reading path / 对话样例 / quick start 文档

## 8. 推荐起手批次

已完成的起手批次：

- [x] `search-first`
- [x] `requirements-analysis`
- [x] `feature-backlog`
- [x] `incident-response`
- [x] `/eval`
- [x] `/sessions`
- [x] `/multi-plan`
- [x] `/multi-execute`
- [x] `/multi-workflow`
- [x] `/orchestrate`

下一批建议进入文案收敛：继续清理安全与验证类 runbook 中残余的旧术语表述。
