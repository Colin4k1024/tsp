---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 本轮批量优化完成情况清单

本文用于快速回答一个问题：这轮批量优化到底已经完成了什么。

如果你想看减法判断依据，继续看 [../plans/llm-surface-reduction-audit.md](../plans/llm-surface-reduction-audit.md)。如果你想看逐阶段执行历史，继续看 [../plans/llm-surface-reduction-execution-history.md](../plans/llm-surface-reduction-execution-history.md)。

## 1. 文档入口收敛

### 1.1 已完成

- [README.md](../../README.md) 已补齐 Claude、Codex、custom overlay 场景和输出模板入口。
- [team-skills-usage.md](team-skills-usage.md) 已补齐 overlay、runbook、toolkit 的最短入口与阅读顺序。
-  已补齐正式 custom overlay、runbook、toolkit 的分层说明和回落规则。
- [custom-overlay.md](custom-overlay.md) 已从“company + runbook”扩展为“company + runbook + toolkit”的最短判断路径。
- [batch-optimization-completion-checklist.md](batch-optimization-completion-checklist.md) 当前文档已作为本轮收口入口。

### 1.2 当前结果

- 用户现在可以从总入口直接判断一个能力应该进入 company、runbook 还是 toolkit。
- custom overlay 场景不再只覆盖 私有流程、权限集成、GitLab、Langfuse，也明确覆盖 biz-service-designer 这类设计态 toolkit。

## 2. Examples 层补齐

### 2.1 Claude / Codex 场景示例

- 已新增 [../../examples/claude-scenario-playbook.md](../../examples/claude-scenario-playbook.md)。
- 已新增 [../../examples/codex-scenario-playbook.md](../../examples/codex-scenario-playbook.md)。
- 已补齐 [../../examples/claude-conversation-script.md](../../examples/claude-conversation-script.md) 与 [../../examples/codex-conversation-script.md](../../examples/codex-conversation-script.md) 的 company 跳转入口。
- 已补齐 [../../examples/role-conversation-scripts.md](../../examples/role-conversation-scripts.md) 的 QA、DevOps、Architect 场景补入口。

### 2.2 Company / Toolkit 专项示例

- 已新增 [../../examples/enterprise-overlay-scenario-playbook.md](../../examples/enterprise-overlay-scenario-playbook.md)，覆盖私有流程、权限集成、GitLab、Langfuse、biz-service-designer 的起手句。
- 已新增 [../../examples/enterprise-overlay-output-playbook.md](../../examples/enterprise-overlay-output-playbook.md)，覆盖 `/handoff`、`/team-review`、`/team-release` 与 toolkit 结果回落。
- 已更新 [../../examples/INDEX.md](../../examples/INDEX.md)，补齐 overlay / runbook / toolkit 路径与学习顺序。

### 2.3 Biz Service Designer 完整示例

- 已新增 [biz-service-designer-end-to-end-conversation-example.md](biz-service-designer-end-to-end-conversation-example.md)。
- 已补齐 [biz-service-designer-toolkit.md](biz-service-designer-toolkit.md) 到完整对话样例的入口。

### 2.4 当前结果

- examples 层已形成四层结构：项目模板、线性会话脚本、场景 playbook、company/toolkit 专项示例。
- company 与 toolkit 场景不再散落在多个模板说明里，而是有统一入口和统一回落方式。

## 3. LLM Surface Reduction 收敛

### 3.1 已完成的收敛结果

- Shared skills 已收敛到 3 个：`api-contract`、`frontend-engineering`、`frontend-ui-ux-system`。
- ECC skills 已收敛到 9 个高价值工具链入口，其中新增 `error-experience-library` 与 `parallel-execution` 两个运行时增强能力。
- 公开命令已收敛到主链与少数 specialist 高识别度入口。
- 通用模板已收敛，字段要求回写到规则和 runbook。

### 3.2 已拆分的计划文档

- [../plans/llm-surface-reduction-audit.md](../plans/llm-surface-reduction-audit.md)：只保留结论与判定原则。
- [../plans/llm-surface-reduction-execution-checklist.md](../plans/llm-surface-reduction-execution-checklist.md)：只保留可执行清单。
- [../plans/llm-surface-reduction-execution-history.md](../plans/llm-surface-reduction-execution-history.md)：只保留执行历史。

### 3.3 当前结果

- 减法主线已经完成，不再建议继续大规模删减。
- 后续更适合做入口收敛、示例补齐和新增对象的前置审查。

## 4. 当前平台状态

最新校验后的状态如下：

- Roles: 8
- Shared skills: 3
- ECC skills: 9
- Private overlay skills: not shipped in public repo
- Specialist agents: 27
- Generated artifacts: 69

## 5. 运行时与演示能力补齐

### 5.1 已补齐的运行时说明

- 已把 `scripts/hooks/session_start.py`、`session_end.py`、`pre_compact.py`、`suggest_compact.py` 回接到 [ecc-harness-usage.md](ecc-harness-usage.md) 与 [team-skills-usage.md](team-skills-usage.md) 的正式入口。
- 已把 [error-experience-usage.md](error-experience-usage.md) 与 [parallel-execution-usage.md](parallel-execution-usage.md) 纳入总导航，避免新能力只存在于文件树里。

### 5.2 已补齐的演示与汇报材料入口

- 已把 [demo-scenario.md](demo-scenario.md) 与 [demo-execution-log.md](demo-execution-log.md) 纳入阅读入口，方便团队直接演示完整主链。
- 已补齐 [../presentation/README.md](../presentation/README.md)，统一说明 PPTX 成品与生成脚本用途。

## 6. 后续建议

如果要继续做优化，优先顺序建议如下：

1. 继续清理剩余 runbook 入口页，把新增 examples 与 toolkit 示例补齐到更多阅读路径。
2. 新增对象时先按 [../plans/llm-surface-reduction-audit.md](../plans/llm-surface-reduction-audit.md) 的原则判断，避免重新引入薄包装层。
3. 若后续 overlay 层再增加 profile、toolkit 或脚本型能力，优先复用当前 overlay / runbook / toolkit 三分法，而不是重新造一层 skill。
