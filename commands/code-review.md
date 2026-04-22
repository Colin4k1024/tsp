# /code-review

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

触发通用或语言专项 reviewer，对代码质量、设计风险和回归风险做结构化评审。

## 主责角色

- `code-reviewer`

## 期望输入

- 变更说明
- diff 或实现摘要
- 测试与风险信息

## 标准输出

- 评审结论
- 阻塞问题
- 语言或安全专项建议

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 优先检查行为回归、设计问题、缺测和安全风险。
2. 若仓库启用了 AI PR review 试点，可参考 `docs/runbooks/ai-pr-review-automation.md` 把 AI 摘要和风险提示作为辅助输入，但不能替代人工结论。
3. 若 diff 涉及依赖清单、lockfile 或构建插件版本，参考 `docs/runbooks/dependency-review-gates.md` 检查新增依赖、漏洞和许可证变化。
4. 若当前 PR 主要是依赖升级批次或自动化更新结果，参考 `docs/runbooks/dependency-update-automation.md` 判断分组是否合理、验证范围是否足够以及是否适合自动合并。
5. 若仓库启用了 GitHub CodeQL / code scanning，参考 `docs/runbooks/codeql-pr-security-gates.md` 读取语义安全扫描结果与 triage 结论。
6. 若 diff 涉及配置文件、示例、脚本、测试数据、文档或疑似凭据暴露，参考 `docs/runbooks/secret-scanning-gates.md` 检查新增命中、baseline 变化和泄漏处置要求。
7. 若 diff 涉及 `.github/workflows/`、reusable workflow、composite action 或 workflow 表达式 / shell 片段，参考 `docs/runbooks/actionlint-workflow-gates.md` 检查 workflow 语法、结构、上下文引用和 shell 误用。
8. 若 diff 涉及 GitHub Actions workflow 的 `permissions`、默认 workflow 权限或 `GITHUB_TOKEN` scope 收敛，参考 `docs/runbooks/github-token-permissions-baseline.md` 检查最小权限建议、例外和最终 YAML 配置是否一致。
9. 若 diff 涉及 GitHub Actions workflow 的权限、第三方 action、secret 暴露、危险表达式或 release automation 安全面，参考 `docs/runbooks/zizmor-workflow-audits.md` 读取 workflow 安全审计结果与 triage 结论。
10. 若 diff 涉及 Terraform、CloudFormation、Bicep、ARM、OpenTofu、Helm、Kubernetes 或其他 IaC / 模板基线检查，且仓库启用了 Checkov，参考 `docs/runbooks/checkov-iac-gates.md` 读取 IaC 安全与合规预检结果、例外和 triage 结论。
11. 若 diff 涉及 Kubernetes manifests、Helm 渲染结果、kustomize 输出或 CRD schema 覆盖，且仓库启用了 schema 校验，参考 `docs/runbooks/kubeconform-schema-gates.md` 读取 schema 校验结果、覆盖缺口和版本边界。
12. 若 diff 涉及 Helm chart 模板、values 组合、subchart 或 snapshot 断言，参考 `docs/runbooks/helm-unittest-playbook.md` 检查 chart 层单测、snapshot 更新和覆盖范围是否合理。
13. 若 diff 涉及 `kubectl apply --server-side`、`--dry-run=server`、field manager 或 manifests 的 API server 接受性预检，参考 `docs/runbooks/kubectl-server-dry-run-gates.md` 读取 server-side validation、field conflict 和 RBAC 结论。
14. 若 diff 涉及 Dockerfile、容器镜像、Helm、Kubernetes、Terraform 或仓库文件系统扫描，且仓库启用了 Trivy，参考 `docs/runbooks/trivy-security-gates.md` 读取镜像 / 文件系统 / IaC 扫描结果与 triage 结论。
15. 若 diff 涉及 Helm、Kubernetes、Terraform、YAML、JSON 或其他结构化配置策略，且仓库启用了 policy-as-code 预检，参考 `docs/runbooks/conftest-policy-gates.md` 读取 policy 命中、例外和阻塞边界。
16. 若 diff 涉及 Kyverno policy、background scan、policy reports、image verification 或 Kubernetes 原生策略治理，参考 `docs/runbooks/kyverno-policy-gates.md` 读取策略范围、`Audit/Enforce` 状态和例外处理结论。
17. 若 diff 涉及 GitHub Actions workflow、token 权限、第三方 action pinning、分支保护或 release automation，且仓库启用了 OSSF Scorecard，参考 `docs/runbooks/scorecard-supply-chain-gates.md` 读取仓库级供应链基线结果与 triage 结论。
18. 若 diff 涉及 GitHub Actions runner 的外部访问面、网络放行列表或 workflow 运行时收敛策略，参考 `docs/runbooks/runner-egress-hardening.md` 核对 egress allowlist、异常连接和例外处理边界。
19. 若 diff 涉及 attestation predicate、schema、evidence model 或供应链 policy 规则，参考 `docs/runbooks/in-toto-attestation-framework.md` 与 `docs/runbooks/witness-policy-gates.md` 核对证据结构与策略边界。
20. 必要时联动 language reviewer 或 security reviewer。
21. 将结论回交给 `/team-review` 或对应实现角色。
