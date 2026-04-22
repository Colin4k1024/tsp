# /team-release

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

用于组织发布准备、上线验证、监控与回滚保障，并在前端发布时覆盖 UI smoke、性能和回滚可见性。

## 主责角色

- `devops-engineer`

## 期望输入

- 测试放行结论
- 发布窗口
- 环境与回滚要求
- 发布负责人 / 值守人与观察窗口
- launch acceptance 结论
- 企业治理上下文
- 若涉及前端则附 smoke 范围和关键监控项

## 标准输出

- 发布方案
- 部署上下文
- 上线检查结果
- 放行结论与后续观察项
- 回滚与监控动作
- 企业内控补充信息
- 前端发布验证记录
- 可选领域扩展执行记录

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 汇总发布范围、质量状态和环境前置条件。
2. 默认沿用 `karpathy-guidelines` 复核发布输入：确认 release notes、rollout 范围、观察项与回滚前提仍然对应已约定的最小变更和成功标准，没有在发布阶段悄悄扩 scope。
3. 记录发布责任链、执行步骤、暂停点 / Go-No-Go 判断点，以及观察窗口。
4. 若包含前端变更，补充关键页面 smoke、静态资源发布风险、性能基线和回滚触发条件，必要时使用 `browser-smoke-testing` 留下真实浏览器验证证据。
5. 若发布范围包含 GitHub Actions workflow、reusable workflow 或 release automation 变更，参考 `docs/runbooks/actionlint-workflow-gates.md` 与 `docs/runbooks/zizmor-workflow-audits.md` 汇总 workflow lint、安全审计与 triage 结论。
6. 若发布范围包含 GitHub Actions workflow 的 `permissions`、默认 workflow 权限或 `GITHUB_TOKEN` scope 收敛，参考 `docs/runbooks/github-token-permissions-baseline.md` 汇总最小权限建议、例外和回退边界。
7. 若发布范围包含 Terraform、CloudFormation、Bicep、ARM、OpenTofu、Helm、Kubernetes 或其他 IaC / 模板基线检查，参考 `docs/runbooks/checkov-iac-gates.md` 汇总 IaC 安全与合规预检结论。
8. 若发布范围包含 Kubernetes manifests、Helm 渲染结果、kustomize 输出或 CRD schema 覆盖，参考 `docs/runbooks/kubeconform-schema-gates.md` 汇总 schema 校验、版本边界和覆盖缺口。
9. 若发布范围包含 Helm chart 模板、values 组合、subchart 或 snapshot 回归，参考 `docs/runbooks/helm-unittest-playbook.md` 汇总 chart 层单测、snapshot 漂移和覆盖缺口。
10. 若发布需要把 manifests 送到目标 API server 做不落盘预检，参考 `docs/runbooks/kubectl-server-dry-run-gates.md` 汇总 server-side validation、field conflict 和接收性结论。
11. 若发布涉及容器镜像、Dockerfile、Helm、Kubernetes、Terraform 或仓库文件系统扫描，参考 `docs/runbooks/trivy-security-gates.md` 汇总镜像 / 文件系统 / IaC 扫描结果，并回写到放行结论或观察项。
12. 若发布涉及 Helm、Kubernetes、Terraform、YAML、JSON 或其他结构化配置策略，参考 `docs/runbooks/conftest-policy-gates.md` 汇总 policy-as-code 预检、例外条件和阻塞结论。
13. 若发布依赖 Kubernetes admission、background scan、policy reports 或 image verification 结果，参考 `docs/runbooks/kyverno-policy-gates.md` 汇总 `Audit/Enforce` 状态、policy 命中和例外边界。
14. 若发布链主要运行在 GitHub Actions，且需要收敛 runner 的外部访问面或跟踪异常出站连接，参考 `docs/runbooks/runner-egress-hardening.md` 汇总 allowlist、异常访问和 triage 责任。
15. 若发布包含二进制、容器镜像、压缩包或其他正式制品，参考 `docs/runbooks/sbom-generation-gates.md` 汇总 SBOM 生成范围、归档位置和版本追溯关系。
16. 若发布需要为正式制品补 provenance 证明，参考 `docs/runbooks/artifact-attestation-gates.md` 汇总 attestation 的生成范围、归档位置和与产物的对应关系。
17. 若发布链需要在 GitHub Actions 中整理更通用的 provenance 生成模式，参考 `docs/runbooks/slsa-generator-patterns.md` 汇总 workflow 约束、subject 绑定关系和归档方式。
18. 若发布需要统一 attestation 的 predicate、schema 和 evidence model，参考 `docs/runbooks/in-toto-attestation-framework.md` 汇总证据结构、版本边界和与发布记录的映射方式。
19. 若发布需要为正式制品或镜像补签名与验签链路，参考 `docs/runbooks/cosign-signing-gates.md` 汇总签名范围、验签入口和发布记录回链。
20. 若发布需要独立验证 provenance / attestation，参考 `docs/runbooks/slsa-verification-gates.md` 汇总验证输入、验证结果和失败处置策略。
21. 若集群侧需要在 admission 层强制执行签名、attestation 或验证策略，参考 `docs/runbooks/policy-controller-gates.md` 汇总策略范围、拒绝原因、例外流程和回退路径。
22. 若发布链需要基于执行证据做更高阶的策略评估，参考 `docs/runbooks/witness-policy-gates.md` 汇总 evidence 来源、policy 规则、评估结果和例外处理。
23. 若为企业内部应用，在发布方案中补齐应用等级、技术架构等级、资源隔离、关键组件偏离和资产入口。
24. 若发布链命中 GitLab 手动流水线补充手册，可附加其执行记录，但不替代默认发布方案与验证步骤。
25. 执行发布前后检查并记录结果，形成最终放行结论。
26. 向 `tech-lead` 回报发布状态、放行结论和后续观察项。
27. 【落盘 — 必须执行，不可跳过】
① 确认任务 slug。
② 执行 `npm run artifact:persist -- ensure-artifact --date {YYYY-MM-DD} --slug {slug} --artifact deployment-context --role devops-engineer --status draft --state released` 创建 `deployment-context.md`。
③ 执行 `npm run artifact:persist -- ensure-artifact --date {YYYY-MM-DD} --slug {slug} --artifact release-plan --role devops-engineer --status draft --state released` 创建 `release-plan.md`。
④ 立即在两个文件中补全环境、配置、密钥来源、部署入口、回滚入口、发布信息、执行步骤、验证与监控、放行结论。
⑤ 执行 `npm run artifact:persist -- write-project-context --project-name {project_name} --current-task {YYYY-MM-DD}-{slug} --phase released --tech-stack "{tech_stack_item}" --dependency "{dependency_item}" --risk "{risk_item}" --next-step "{next_step_item}"` 刷新 `docs/memory/project-context.md`。
⑥ 若发布中有值得跨任务沉淀的经验教训，执行 `npm run artifact:persist -- append-memory --date {YYYY-MM-DD} --memory-type lessons --title {lesson_title} --content "{lesson_markdown}"` 追加到 `docs/memory/lessons-learned.md`。
⑦ 完成后逐条输出确认：`已创建 deployment-context.md / release-plan.md`，`已刷新 project-context.md`。
