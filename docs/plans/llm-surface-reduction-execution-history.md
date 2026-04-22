# LLM Surface Reduction Execution History

本文只记录执行历史，不再重复审计结论。
> 历史命令说明：文中出现的 `python3 scripts/build_platform_artifacts.py` 与 `python3 scripts/validate_library.py` 为当时执行命名；当前等价命令分别为 `node scripts/build-platform-artifacts.js` 与 `node scripts/validate-library.js`。

审计结论看 [llm-surface-reduction-audit.md](llm-surface-reduction-audit.md)，执行清单看 [llm-surface-reduction-execution-checklist.md](llm-surface-reduction-execution-checklist.md)。

## 1. 最终结果

- 2026-03-29 已完成第一阶段执行。
- 2026-03-29 已完成第二阶段的第一批执行。
- 2026-03-29 已完成第二阶段的第二批执行。
- 2026-03-29 已完成第二阶段的第三批与尾批执行。
- 2026-03-29 已完成第三阶段模板减法执行。
- 2026-03-29 已完成第四阶段剩余边界项收敛执行。

## 2. 各阶段摘要

### 2.1 第一阶段：先减命名噪音

已完成：

- 删除 `skills/search-first`
- 删除 `skills/requirements-analysis`
- 删除 `skills/feature-backlog`
- 删除 `skills/incident-response`
- 删除 `/eval`
- 删除 `/sessions`
- 收敛 `/orchestrate`、`/multi-workflow`、`/multi-execute`
- 收敛 `/multi-plan` 到 `/plan`

### 2.2 第二阶段：合并薄 skill 和薄命令

已完成：

- 合并 `skills/solution-design`
- 合并 `skills/release-readiness`
- 合并 `skills/coding-standards`
- 合并 `skills/verification-loop`
- 合并 `skills/frontend-patterns`
- 合并 `skills/backend-patterns`
- 合并 `skills/api-design`
- 合并 `skills/deployment-patterns`
- 合并 `skills/tdd-workflow`
- 合并 `skills/security-review`
- 合并 `/test-coverage` 到 `/tdd`
- 将 `/update-docs` 下沉为 specialist 能力

### 2.3 第三阶段：模板减法

已完成：

- 删除 `templates/prd.md`
- 删除 `templates/delivery-plan.md`
- 删除 `templates/test-plan.md`
- 删除 `templates/incident-brief.md`
- 删除 `templates/adr.md`
- 将最小字段与治理要求回写到 `rules/artifact-standards.md` 与相关 runbook

### 2.4 第四阶段：边界项收敛

已完成：

- 删除 `skills/test-strategy`
- 将测试口径收敛回 `qa-engineer`、`artifact-standards.md` 与测试相关 runbook

## 3. 实际删除清单

### 3.1 Shared skills

- `requirements-analysis`
- `feature-backlog`
- `incident-response`
- `release-readiness`
- `solution-design`
- `test-strategy`

### 3.2 ECC skills

- `search-first`
- `verification-loop`
- `coding-standards`
- `frontend-patterns`
- `backend-patterns`
- `security-review`
- `api-design`
- `deployment-patterns`
- `tdd-workflow`

### 3.3 公开命令

- `/eval`
- `/sessions`
- `/multi-plan`
- `/multi-execute`
- `/multi-workflow`
- `/orchestrate`
- `/test-coverage`
- `/update-docs`

### 3.4 模板

- `templates/prd.md`
- `templates/delivery-plan.md`
- `templates/test-plan.md`
- `templates/incident-brief.md`
- `templates/adr.md`

## 4. 执行闭环

每一批执行后都已完成以下动作：

- 清理角色、生成器、README、runbook、examples 和 usage scenarios 中的引用
- 运行历史命令 `python3 scripts/build_platform_artifacts.py`（当前等价：`node scripts/build-platform-artifacts.js`）
- 运行历史命令 `python3 scripts/validate_library.py`（当前等价：`node scripts/validate-library.js`）

最新校验结果：

- Roles: 8
- Shared skills: 3
- ECC skills: 9
- Company skills: 8
- Specialist agents: 27
- Generated artifacts: 69
