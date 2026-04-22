# /team-review

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

用于评审方案、实现、测试结果和交付质量，并在前端变更时强制检查视觉、交互、无障碍和性能。

## 主责角色

- `qa-engineer`

## 期望输入

- 实施说明
- 测试结果
- 风险和待确认项
- 若涉及前端则附 UI 评审清单和自测证据

## 标准输出

- 评审结论
- 阻塞项
- 放行建议
- 上线验收结论
- 前端质量门禁检查结果
- 领域扩展约束核对结果

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 检查交付物是否满足角色对应的质量门禁。
2. 默认用 `karpathy-guidelines` 复核本轮交付是否保持最小范围、每处改动都能追溯到用户请求，并且成功标准与实际验证证据一致。
3. 若启用 `doc-architecture`，按 `docs/runbooks/team-command-output-contracts.md` 的文档一致性审计字段核对服务名、API、事件、鉴权和索引完整性。
4. 若任务启用了 private enterprise overlay 或配套私有 runbook / overlay，核对相关约束是否被正确执行，但不要把私有领域检查扩散成所有任务的默认门槛。
5. 若存在明确的 consumer/provider 边界，参考 `docs/runbooks/contract-testing-playbook.md` 核对契约验证是否覆盖关键交互与失败路径。
6. 若测试矩阵存在组合爆炸，优先用 `pairwise-test-design` 收敛覆盖策略，并说明哪些高风险场景需要额外定向补测。
7. 若交付物涉及 GitHub Actions workflow、reusable workflow 或 composite action，参考 `docs/runbooks/actionlint-workflow-gates.md` 与 `docs/runbooks/zizmor-workflow-audits.md` 核对 workflow lint、安全审计与 triage 结论。
8. 若交付物涉及 GitHub Actions workflow 的 `permissions`、默认 workflow 权限或 `GITHUB_TOKEN` scope 收敛，参考 `docs/runbooks/github-token-permissions-baseline.md` 核对最小权限建议、例外和回退边界。
9. 若交付物涉及 Terraform、CloudFormation、Bicep、ARM、OpenTofu、Helm、Kubernetes 或其他 IaC / 模板基线检查，参考 `docs/runbooks/checkov-iac-gates.md` 核对 IaC 安全与合规预检结论。
10. 若交付物涉及 Kubernetes manifests、Helm 渲染结果、kustomize 输出或 CRD schema 覆盖，参考 `docs/runbooks/kubeconform-schema-gates.md` 核对 schema 校验、版本边界和覆盖缺口。
11. 若交付物涉及 Helm chart 模板、values 组合、subchart 或 snapshot 回归，参考 `docs/runbooks/helm-unittest-playbook.md` 核对 chart 层单测、snapshot 漂移和覆盖缺口。
12. 若交付物需要把 manifests 送到目标 API server 做不落盘预检，参考 `docs/runbooks/kubectl-server-dry-run-gates.md` 核对 server-side validation、field conflict 和接收性结论。
13. 若交付物涉及 Helm、Kubernetes、Terraform、YAML、JSON 或其他结构化配置策略，参考 `docs/runbooks/conftest-policy-gates.md` 核对 policy-as-code 预检、例外和阻塞条件。
14. 若交付物涉及 Kubernetes admission、background scan、policy reports 或 image verification，参考 `docs/runbooks/kyverno-policy-gates.md` 核对 `Audit/Enforce` 状态、policy 命中和例外处理。
15. 若变更涉及前端，必须验证视觉一致性、交互完整性、边界态、无障碍和前端性能。
16. 若前端主路径或发布前验证需要真实浏览器证据，补用 `browser-smoke-testing`。
17. 区分阻塞问题和非阻塞风险。
18. 必要时把冲突升级给 `tech-lead`。
19. 【落盘 — 必须执行，不可跳过】
① 确认任务 slug。
② 执行 `npm run artifact:persist -- ensure-artifact --date {YYYY-MM-DD} --slug {slug} --artifact test-plan --role qa-engineer --status draft --state review` 创建 `test-plan.md`。
③ 执行 `npm run artifact:persist -- ensure-artifact --date {YYYY-MM-DD} --slug {slug} --artifact launch-acceptance --role qa-engineer --status draft --state accepted` 创建 `launch-acceptance.md`。
④ 立即在这两个文件中补全测试范围、风险、Go / No-Go 检查项、已接受风险和最终上线结论。
⑤ 若评审中有值得跨任务沉淀的经验教训，执行 `npm run artifact:persist -- append-memory --date {YYYY-MM-DD} --memory-type lessons --title {lesson_title} --content "{lesson_markdown}"` 追加到 `docs/memory/lessons-learned.md`。
⑥ 完成后输出确认：`已创建 test-plan.md / launch-acceptance.md`。

## Claude 子 Agent 调用

> 以下调用需要 `runSubagent` 工具。满足触发条件时，在当前对话中发起。

### 并行调用（parallel）

**触发条件**：有代码变更需要评审时

| 子 Agent | agentName | 职责范围 |
|-----------|-----------|----------|
| code-reviewer | `code-reviewer` | 行为回归、设计问题、缺测路径、结构风险 |
| security-reviewer | `security-reviewer` | 鉴权、注入、敏感数据、依赖漏洞 |

**Prompt 模板**（调用时将 `{task_context}` 替换为当前任务背景，`{role_name}` 替换为对应角色名，`{scope}` 替换为职责范围）：

> 你是 Team Skills Platform 中的 {role_name}。基于以下变更内容，产出 {scope} 方面的评审结论：
>
> {task_context}
>
> 要求：区分阻塞问题和非阻塞风险，给出明确建议。

**汇总**：所有子 Agent 完成后，由 `qa-engineer` 将结果合并落盘到 test-plan.md。
