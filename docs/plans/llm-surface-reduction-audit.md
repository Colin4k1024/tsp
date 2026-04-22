# LLM Surface Reduction Audit

本文只保留减法审计结论，不再承载逐阶段执行台账。

执行清单看 [llm-surface-reduction-execution-checklist.md](llm-surface-reduction-execution-checklist.md)，逐阶段历史看 [llm-surface-reduction-execution-history.md](llm-surface-reduction-execution-history.md)。

## 1. 审计结论

截至 2026-03-29，这一轮 LLM surface reduction 已达到目标：

- 删除了主要在重复现代 LLM 通用能力的 shared skills、ecc skills、公开命令和通用模板。
- 保住了平台主链、企业专属能力、具体工具链能力和前端治理锚点。
- 生成链、README、runbook、examples 与角色说明均已完成同步收敛。

当前建议从“继续删减”切换为“维持收敛状态”，后续只在新增对象明显属于通用包装层时再做新一轮审计。

## 2. 判定原则

一个对象适合做减法，通常同时满足以下三条中的两条以上：

1. 本体内容很薄，主要是在重述已有 rule、runbook 或 template。
2. 不承载企业专属知识、具体工具链边界或严格回写约束。
3. 删除后，现代 LLM 在没有专门 skill 或命令包装的情况下仍能稳定产出相近结果。

一个对象不适合删，通常是因为满足以下任意一条：

1. 承载企业专属能力，例如 私有流程、权限集成、组织内部领域扩展。
2. 承载具体工具链或验证方法，例如 `maven-qa`、`mysql-query`、`browser-smoke-testing`。
3. 是平台主链、前端治理或发布门禁中的显式锚点，被大范围引用。

## 3. 当前保留项

### 3.1 Shared skills

- `api-contract`
- `frontend-engineering`
- `frontend-ui-ux-system`

原因：这三项仍然直接承载 API 契约、前端工程和 UI/UX 治理约束，不是通用包装层。

### 3.2 ECC skills

- `browser-smoke-testing`
- `java-unit-test`
- `maven-qa`
- `mysql-query`
- `pairwise-test-design`
- `systematic-debugging`
- `testcontainers-integration-testing`

原因：都带有明确工具链、执行边界或方法论，不适合并回通用描述。

### 3.3 Company skills

- `skills/*` 全部保留

原因：这是仓库最明确的非通用知识层，正是现代通用 LLM 不具备、因此应该保留的部分。

### 3.4 公开命令

- `/team-intake`
- `/team-plan`
- `/team-execute`
- `/handoff`
- `/team-review`
- `/team-release`
- `/plan`
- `/code-review`
- `/build-fix`
- `/verify`
- `/multi-frontend`
- `/multi-backend`

原因：这是当前平台最稳定的主链与 specialist 入口，收缩后已具备足够识别度。

### 3.5 模板

- `templates/api-contract.md`
- `templates/design-system-brief.md`
- `templates/release-plan.md`
- `templates/ui-implementation-plan.md`
- `templates/ui-review-checklist.md`

原因：这些模板仍然带有显著的平台门禁、发布结构或 UI 质量要求。

## 4. 已完成的减法结果

### 4.1 已删除 shared skills

- `requirements-analysis`
- `feature-backlog`
- `incident-response`
- `release-readiness`
- `solution-design`
- `test-strategy`

### 4.2 已删除 ecc skills

- `search-first`
- `verification-loop`
- `coding-standards`
- `frontend-patterns`
- `backend-patterns`
- `security-review`
- `api-design`
- `deployment-patterns`
- `tdd-workflow`

### 4.3 已删除公开命令

- `/eval`
- `/sessions`
- `/multi-plan`
- `/multi-execute`
- `/multi-workflow`
- `/orchestrate`
- `/test-coverage`
- `/update-docs`

### 4.4 已删除通用模板

- `templates/prd.md`
- `templates/delivery-plan.md`
- `templates/test-plan.md`
- `templates/incident-brief.md`
- `templates/adr.md`

## 5. 当前状态

最新一轮校验后的平台状态如下：

- Roles: 8
- Shared skills: 3
- ECC skills: 9
- Company skills: 8
- Specialist agents: 27
- Generated artifacts: 69

这组数字说明：减法已经完成，但主链、企业扩展和工具链能力仍保持完整。

## 6. 后续策略

当前不建议继续做大规模删减。更合理的后续动作是：

1. 维持收敛结果，不再恢复已删除的薄包装对象。
2. 新增对象时先用本审计中的判定原则过一遍，再决定是否真的需要独立 skill、命令或模板。
3. 文档侧优先做入口收敛和示例补齐，而不是继续扩大命名面。
