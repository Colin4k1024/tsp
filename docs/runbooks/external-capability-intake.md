# External Capability Intake

本手册用于搜罗、评估和分层引入开源 skill 与工程实践，避免“看到一个仓库就直接接进 canonical source”。

如果你已经完成 intake，想继续推进到 approval 和 enablement，继续看 [external-capability-approval-and-enablement-workflow.md](external-capability-approval-and-enablement-workflow.md)。

## 使用原则

- 不把外部仓库整包搬进 canonical source。
- 只允许“本地化改写适配”，不做 wholesale import。
- `AGPL` / 强 copyleft 来源默认只允许 `reference-only-runbook`，不直接拷文本或代码进正式层。
- `skills/` 只承接公司专属领域能力；开源通用工程能力默认去 `skills/` 或 `docs/runbooks/`。
- 目录站、聚合站、awesome list 只能作为 discovery feed，不能直接当 canonical import source。

## Intake 卡片

后续所有外部 skill / 工程实践都先登记这张卡片，再决定是否进入正式层：

```yaml
source_name:
source_url:
license:
trust_tier:
maintenance_signal:
portability:
overlap_with_existing:
import_mode:
target_layer:
target_name:
why_now:
status:
```

### 字段定义

- `trust_tier`: `A-official` / `B-proven-community` / `C-discovery-only`
- `portability`: `codex+claude` / `claude-first` / `practice-only`
- `import_mode`: `adapt-into-local-skill` / `reference-only-runbook` / `reject`
- `target_layer`: `shared` / `ecc` / `company` / `runbook` / `toolkit` / `rules`
- `status`: `candidate` / `approved` / `backlog` / `rejected`

## 当前候选台账

| source_name | source_url | license | trust_tier | maintenance_signal | portability | overlap_with_existing | import_mode | target_layer | target_name | why_now | status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `anthropics/skills:webapp-testing` | [anthropics/skills](https://github.com/anthropics/skills) | `Apache-2.0 / verify target folder before adaptation` | `A-official` | `65.8k` stars；2025-11 仍有 `webapp-testing` 相关 PR 活跃 | `codex+claude` | 已有 `frontend-engineering`、前端门禁，但没有独立浏览器 smoke / webapp 测试 skill | `adapt-into-local-skill` | `ecc` | `browser-smoke-testing` | 补齐前端与发布链之间的浏览器验证空位 | `approved` |
| `alchaincyf/huashu-design` | [alchaincyf/huashu-design](https://github.com/alchaincyf/huashu-design) | `Custom / personal use free；企业商用与工具链集成需上游授权` | `B-proven-community` | `4.4k+` stars；2026-04 仍活跃更新；包含独立 `SKILL.md`、演示与导出工具链 | `practice-only` | 已有 `frontend-ui-ux-system`、`ui-ux-promax` 与前端门禁，但没有专门面向高保真 HTML 原型、HTML-first deck、时间轴动画与设计评审的外部设计 skill 接入说明 | `reference-only-runbook` | `runbook` | `huashu-design-integration` | 在不复制上游内容的前提下，为 TSP 补齐外部设计 skill 接入路径、README 说明与致谢归档；待获得授权后再决定是否升级为本地化适配候选 | `approved` |
| `Colin4k1024/andrej-karpathy-skills` | [Colin4k1024/andrej-karpathy-skills](https://github.com/Colin4k1024/andrej-karpathy-skills/tree/main) | `MIT` | `B-proven-community` | 轻量仓库，当前核心内容稳定；包含 `CLAUDE.md` 与 `karpathy-guidelines` skill 形态 | `codex+claude` | 已有 `coding-standards`、`tdd-workflow`、`verification-loop`，但缺少一层专门约束“先暴露假设、避免过度设计、限定改动边界、先定义成功标准”的行为护栏 | `adapt-into-local-skill` | `ecc` | `karpathy-guidelines` | 补齐实现前的行为约束层，让现有质量与验证技能前面多一道“别猜、别做重、别多改、先定义成功”的轻量护栏 | `approved` |
| `tanweai/pua` | [tanweai/pua](https://github.com/tanweai/pua) | `MIT` | `B-proven-community` | `16k+` stars；2026-04 仍持续更新；多平台技能分发和 Claude hooks 已成型 | `claude-first` | 已有 `systematic-debugging`、`verification-loop`、`loop-operator`，但没有统一的高能动性、高压闭环与失败升级协议 | `adapt-into-local-skill` | `ecc` | `pua` | 补齐“别放弃、别甩锅、别空口完成”的行为层能力，并与现有验证/调试能力互补 | `approved` |
| `obra/superpowers:systematic-debugging` | [obra/superpowers](https://github.com/obra/superpowers) | `MIT` | `B-proven-community` | `20.2k` stars；含 Codex 实验支持说明；技能库覆盖调试与验证 | `codex+claude` | 已有 `/verify`，但缺少根因定位流程 | `adapt-into-local-skill` | `ecc` | `systematic-debugging` | 补强“排查根因”而不只是“反复验证” | `approved` |
| `obra/superpowers:verification-before-completion` | [obra/superpowers](https://github.com/obra/superpowers) | `MIT` | `B-proven-community` | 同上，作为调试/验证配套技能活跃维护 | `codex+claude` | 与现有 `/verify` 高度重叠 | `reference-only-runbook` | `runbook` | `verification-playbook` | 更适合作为 `/verify` 与验证 runbook 的增强项，而不是新入口 | `backlog` |
| `obra/superpowers:using-git-worktrees + finishing-a-development-branch` | [obra/superpowers](https://github.com/obra/superpowers) | `MIT` | `B-proven-community` | 技能库包含完整开发分支收口与 worktree 流程 | `codex+claude` | 已有 `rules/common/git-workflow.md`，但缺少可直接执行的 PR / branch runbook | `reference-only-runbook` | `runbook` | `git-pr-workflow` | 补齐 GitHub / PR / branch 收口工作流 | `approved` |
| `omkamal/pypict-claude-skill` | [omkamal/pypict-claude-skill](https://github.com/omkamal/pypict-claude-skill) | `MIT` | `B-proven-community` | 有 `CHANGELOG`、`QUICKSTART`、Releases；聚焦单一问题 | `codex+claude` | 已有 QA 测试口径与回写规则，但没有组合测试 / pairwise 设计 skill | `adapt-into-local-skill` | `ecc` | `pairwise-test-design` | 精准补齐测试设计缺口，且可移植性高 | `approved` |
| `qodo-ai/pr-agent` | [qodo-ai/pr-agent](https://github.com/qodo-ai/pr-agent) | `AGPL-3.0` | `B-proven-community` | `9.8k` stars；2025-11 仍有 release 与 GitHub Action 更新 | `practice-only` | 已有 `/code-review` 与 review specialist，但没有 PR 自动化 playbook | `reference-only-runbook` | `runbook` | `ai-pr-review-automation` | 可沉淀为 PR 自动 review 方案，但许可证不适合直接本地化成 skill | `approved` |
| `reviewdog/reviewdog` | [reviewdog/reviewdog](https://github.com/reviewdog/reviewdog) | `MIT` | `B-proven-community` | `8.9k` stars；2026-01 仍有更新；支持多 CI / 多 reporter | `practice-only` | 已有 lint / review 规则，但没有 PR 注释与检查门禁自动化手册 | `reference-only-runbook` | `runbook` | `reviewdog-pr-gates` | 适合沉淀成 PR gate 与 inline review 实践 | `approved` |
| `reviewdog/action-eslint` | [reviewdog/action-eslint](https://github.com/reviewdog/action-eslint) | `MIT` | `B-proven-community` | 2026-01 更新；GitHub Marketplace Action；用例清晰 | `practice-only` | 与前端质量门禁互补，但当前没有 GitHub PR review gate 样例 | `reference-only-runbook` | `runbook` | `reviewdog-pr-gates` | 作为 reviewdog 的具体 GitHub Actions 落地示例 | `approved` |
| `semantic-release/release-notes-generator` | [semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator) | `MIT` | `B-proven-community` | 2026-01 更新；发布说明生成插件稳定 | `practice-only` | 已有发布治理 runbook，但没有发布说明自动化方法 | `reference-only-runbook` | `runbook` | `release-notes-automation` | 用于补齐 changelog / release notes 自动化 | `approved` |
| `semantic-release/semantic-release` | [semantic-release/semantic-release](https://github.com/semantic-release/semantic-release) | `MIT` | `B-proven-community` | `23k` stars；2026-01 仍持续更新 | `practice-only` | 与发布治理 runbook 互补，但当前缺少正式 release automation baseline | `reference-only-runbook` | `runbook` | `release-notes-automation` | 提供完整 release automation 参考面 | `approved` |
| `OpenAPITools/openapi-diff` | [OpenAPITools/openapi-diff](https://github.com/OpenAPITools/openapi-diff) | `Apache-2.0` | `B-proven-community` | `1.1k` stars；22 releases；`2.1.7` latest `2026-01-26` | `codex+claude` | 已有 `api-contract` 与接口设计 runbook，但没有 OpenAPI breaking change gate | `reference-only-runbook` | `runbook` | `api-breaking-change-gates` | 补齐 API 向后兼容性校验与发布前 breaking change 检查 | `approved` |
| `stoplightio/spectral` | [stoplightio/spectral](https://github.com/stoplightio/spectral) | `Apache-2.0` | `B-proven-community` | `3.1k` stars；107 releases；`v6.15.0` latest `2025-04-22` | `codex+claude` | 已有接口设计 runbook 与 `api-contract`，但没有 API lint / ruleset gate | `reference-only-runbook` | `runbook` | `api-lint-gates` | 补齐 OpenAPI / AsyncAPI 风格与规范门禁 | `approved` |
| `testcontainers/testcontainers-java` | [testcontainers/testcontainers-java](https://github.com/testcontainers/testcontainers-java) | `MIT` | `B-proven-community` | `8.6k` stars；91 releases；`2.0.4` latest `2026-03-19` | `codex+claude` | 已有 `maven-qa`、`java-unit-test`，但没有容器化集成测试工作流 | `adapt-into-local-skill` | `ecc` | `testcontainers-integration-testing` | 补齐 Java 服务对数据库、中间件和浏览器依赖的可重复集成验证 | `approved` |
| `actions/dependency-review-action` | [actions/dependency-review-action](https://github.com/actions/dependency-review-action) | `MIT` | `A-official` | `799` stars；56 releases；`4.9.0` latest `2026-03-03` | `practice-only` | 已有 security / review 规则，但没有依赖变更与许可证门禁手册 | `reference-only-runbook` | `runbook` | `dependency-review-gates` | 补齐 PR 级依赖漏洞与许可证变化检查 | `approved` |
| `github/codeql-action` | [github/codeql-action](https://github.com/github/codeql-action) | `MIT / CodeQL CLI 附加使用条件` | `A-official` | `1.5k` stars；`v4.31.10` latest `2026-01-12` | `practice-only` | 已有安全评审与 review 规则，但没有 PR 级静态安全扫描接入手册 | `reference-only-runbook` | `runbook` | `codeql-pr-security-gates` | 可补齐 GitHub 原生代码扫描与安全查询门禁 | `approved` |
| `aquasecurity/trivy-action` | [aquasecurity/trivy-action](https://github.com/aquasecurity/trivy-action) | `MIT` | `B-proven-community` | `1.4k` stars；`v0.33.1` latest `2025-09-03` | `practice-only` | 已有 dependency review 与 CodeQL，但没有镜像 / 文件系统 / IaC 扫描接入手册 | `reference-only-runbook` | `runbook` | `trivy-security-gates` | 可补齐容器镜像、文件系统和 IaC 的漏洞扫描与门禁实践 | `approved` |
| `ossf/scorecard-action` | [ossf/scorecard-action](https://github.com/ossf/scorecard-action) | `Apache-2.0` | `B-proven-community` | `348` stars；`v2.4.3` latest `2025-09-30` | `practice-only` | 已有依赖、代码和制品扫描入口，但没有仓库级供应链基线手册 | `reference-only-runbook` | `runbook` | `scorecard-supply-chain-gates` | 可补齐仓库级供应链基线、发布流程与 token 使用面的审计实践 | `approved` |
| `anchore/sbom-action` | [anchore/sbom-action](https://github.com/anchore/sbom-action) | `Apache-2.0` | `B-proven-community` | `209` stars；`v0.20.9` latest `2025-10-23` | `practice-only` | 已有 dependency review 与镜像扫描，但没有 SBOM 生成与发布实践手册 | `reference-only-runbook` | `runbook` | `sbom-generation-gates` | 可补齐构建产物与镜像的 SBOM 生成、归档与发布链追溯 | `approved` |
| `actions/attest-build-provenance` | [actions/attest-build-provenance](https://github.com/actions/attest-build-provenance) | `MIT` | `A-official` | `847` stars；`v3.0.0` latest `2025-08-28` | `practice-only` | 已有 SBOM 和供应链基线入口，但没有 provenance attestation 手册 | `reference-only-runbook` | `runbook` | `artifact-attestation-gates` | 可补齐构建产物 provenance 与发布证明链实践 | `approved` |
| `sigstore/cosign-installer` | [sigstore/cosign-installer](https://github.com/sigstore/cosign-installer) | `Apache-2.0` | `B-proven-community` | `175` stars；`v4.0.0` latest `2025-10-16` | `practice-only` | 已有 SBOM 与 provenance 入口，但没有签名与验证手册 | `reference-only-runbook` | `runbook` | `cosign-signing-gates` | 可补齐 artifact / image signing 与验证链实践 | `approved` |
| `slsa-framework/slsa-verifier` | [slsa-framework/slsa-verifier](https://github.com/slsa-framework/slsa-verifier) | `Apache-2.0` | `B-proven-community` | `394` stars；`v2.7.1` latest `2025-07-18` | `practice-only` | 已有 attestation 与签名入口，但没有统一的 provenance 验证手册 | `reference-only-runbook` | `runbook` | `slsa-verification-gates` | 可补齐 provenance / attestation 的独立验证实践 | `approved` |
| `sigstore/policy-controller` | [sigstore/policy-controller](https://github.com/sigstore/policy-controller) | `Apache-2.0` | `B-proven-community` | `1k+` stars；`v0.13.1` latest `2025-09-17` | `practice-only` | 已有签名与验证入口，但没有集群侧策略强制手册 | `reference-only-runbook` | `runbook` | `policy-controller-gates` | 可补齐 Kubernetes / admission 层的签名与验证策略执行实践 | `approved` |
| `pact-foundation/pact-jvm` | [pact-foundation/pact-jvm](https://github.com/pact-foundation/pact-jvm) | `Apache-2.0` | `B-proven-community` | `1.1k` stars；331 releases；`4.7.0-beta.4` latest `2026-02-18` | `codex+claude` | 已有 `api-contract`，但没有 consumer/provider contract testing 工作流 | `reference-only-runbook` | `runbook` | `contract-testing-playbook` | 可补齐跨服务 consumer/provider 契约验证，但接入成本高于普通 API lint / diff gate | `approved` |
| `slsa-framework/slsa-github-generator` | [slsa-framework/slsa-github-generator](https://github.com/slsa-framework/slsa-github-generator) | `Apache-2.0` | `B-proven-community` | `169` stars；`v2.1.0` latest `2026-02-24`；2025-10 仍有更新 | `practice-only` | 已有 GitHub 官方 attestation，但没有更广的 SLSA provenance 生成模式手册 | `reference-only-runbook` | `runbook` | `slsa-generator-patterns` | 可补齐 GitHub Actions 侧更通用的 provenance 生成设计模式 | `approved` |
| `in-toto/attestation` | [in-toto/attestation](https://github.com/in-toto/attestation) | `Apache-2.0` | `B-proven-community` | `317` stars；`v1.1.2` latest `2025-06-14`；2025-11 仍有更新 | `practice-only` | 已有 attestation 生成与验证手册，但缺少 attestation predicate / schema 设计参考 | `reference-only-runbook` | `runbook` | `in-toto-attestation-framework` | 可补齐 attestation schema、predicate 和证据模型的设计参考 | `approved` |
| `in-toto/witness` | [in-toto/witness](https://github.com/in-toto/witness) | `Apache-2.0` | `B-proven-community` | `503` stars；`v0.10.1` latest `2025-10-15`；2025-11 仍有更新 | `practice-only` | 已有 attestation / signing / verification，但没有 policy-engine 视角的高级治理手册 | `reference-only-runbook` | `runbook` | `witness-policy-gates` | 可补齐基于证据和策略引擎的更高级供应链治理实践 | `approved` |
| `renovatebot/renovate` | [renovatebot/renovate](https://github.com/renovatebot/renovate) | `AGPL-3.0` | `B-proven-community` | `20.5k` stars；`42.76.4` latest `2026-01-10`；持续高频发布 | `practice-only` | 已有依赖门禁，但缺少持续升级发现、批量 triage 和自动化分组手册 | `reference-only-runbook` | `runbook` | `dependency-update-automation` | 可补齐依赖升级自动化与分批治理实践，但许可证不适合直接本地化成 skill | `approved` |
| `gitleaks/gitleaks` | [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) | `MIT` | `B-proven-community` | `24k` stars；`v8.30.0` latest `2025-11-26`；规则持续更新 | `practice-only` | 已有依赖、代码、镜像与供应链门禁，但没有 secret scanning 手册 | `reference-only-runbook` | `runbook` | `secret-scanning-gates` | 可补齐 PR / 仓库级硬编码凭据发现、baseline 管理与泄漏处置实践 | `approved` |
| `step-security/harden-runner` | [step-security/harden-runner](https://github.com/step-security/harden-runner) | `Apache-2.0` | `B-proven-community` | `v2.14.0` latest `2025-12-09`；持续维护 GitHub Actions runtime hardening | `practice-only` | 已有仓库级供应链基线，但没有 runner 运行时 egress hardening 手册 | `reference-only-runbook` | `runbook` | `runner-egress-hardening` | 可补齐 GitHub Actions runner 的出站访问控制、实时监测与异常 triage 实践 | `approved` |
| `rhysd/actionlint` | [rhysd/actionlint](https://github.com/rhysd/actionlint) | `MIT` | `B-proven-community` | `v1.7.8` latest `2025-10-11`；持续跟进 GitHub Actions 语法、runner label 与 popular actions 数据 | `practice-only` | 已有仓库级供应链基线，但没有 workflow 语法、结构与 shell 误用门禁手册 | `reference-only-runbook` | `runbook` | `actionlint-workflow-gates` | 可补齐 GitHub Actions workflow 文件级静态 lint 与结构化 triage 实践 | `approved` |
| `zizmorcore/zizmor` | [zizmorcore/zizmor](https://github.com/zizmorcore/zizmor) | `MIT` | `B-proven-community` | `3.3k` stars；2025-11 仍保持活跃更新；配套 `zizmor-action` 持续维护 | `practice-only` | 已有 Scorecard 和 runner hardening，但没有 workflow 安全审计手册 | `reference-only-runbook` | `runbook` | `zizmor-workflow-audits` | 可补齐 GitHub Actions workflow 的安全审计、triage 和 review 回写实践 | `approved` |
| `open-policy-agent/conftest` | [open-policy-agent/conftest](https://github.com/open-policy-agent/conftest) | `Apache-2.0` | `B-proven-community` | `3.1k` stars；92 releases；`v0.66.0` latest `2025-12-22` | `practice-only` | 已有 Trivy 和 policy-controller，但没有 PR / 发布前的 policy-as-code 预检手册 | `reference-only-runbook` | `runbook` | `conftest-policy-gates` | 可补齐 Helm / Kubernetes / Terraform / YAML / JSON 的配置策略预检实践 | `approved` |
| `bridgecrewio/checkov` | [bridgecrewio/checkov](https://github.com/bridgecrewio/checkov) | `Apache-2.0` | `B-proven-community` | `2026-03` 仍持续发布；框架覆盖 Terraform、Kubernetes、Helm、CloudFormation、Dockerfile 等 IaC 目标 | `practice-only` | 已有 Trivy 和 Conftest，但没有 IaC 安全与合规基线门禁手册 | `reference-only-runbook` | `runbook` | `checkov-iac-gates` | 可补齐 Terraform / Kubernetes / Helm / CloudFormation 等 IaC 的误配置与合规预检实践 | `approved` |
| `yannh/kubeconform` | [yannh/kubeconform](https://github.com/yannh/kubeconform) | `Apache-2.0` | `B-proven-community` | `2026-02` 仍持续发布；配套 `kubernetes-json-schema` 仓库持续维护 | `practice-only` | 已有 Conftest 和 policy-controller，但没有 Kubernetes manifest schema 校验手册 | `reference-only-runbook` | `runbook` | `kubeconform-schema-gates` | 可补齐 Kubernetes / Helm / kustomize 输出的 schema 级校验与 CRD 覆盖实践 | `approved` |
| `GitHubSecurityLab/actions-permissions` | [GitHubSecurityLab/actions-permissions](https://github.com/GitHubSecurityLab/actions-permissions) | `MIT` | `B-proven-community` | `PUBLIC BETA`；围绕 `Monitor` / `Advisor` 持续维护 GitHub token permissions 收敛实践 | `practice-only` | 已有 Scorecard、Zizmor 和 runner hardening，但没有基于真实运行的 token 最小权限手册 | `reference-only-runbook` | `runbook` | `github-token-permissions-baseline` | 可补齐 GitHub Actions `GITHUB_TOKEN` 最小权限建议、收敛与 triage 实践 | `approved` |
| `kyverno/kyverno` | [kyverno/kyverno](https://github.com/kyverno/kyverno) | `Apache-2.0` | `B-proven-community` | `2026-03` 官方文档与 releases 持续更新；覆盖 admission、background scan、policy reports、image verification | `practice-only` | 已有 Conftest、policy-controller，但没有 Kubernetes 原生 policy engine 手册 | `reference-only-runbook` | `runbook` | `kyverno-policy-gates` | 可补齐 Kubernetes 原生策略治理、background scan 与 policy report 实践 | `approved` |
| `helm-unittest/helm-unittest` | [helm-unittest/helm-unittest](https://github.com/helm-unittest/helm-unittest) | `MIT` | `B-proven-community` | `2026-03` 仓库和插件文档持续维护；聚焦 Helm chart 单元测试与 snapshot 回归 | `practice-only` | 已有 Kubeconform 和 Conftest，但没有 Helm chart 模板单测手册 | `reference-only-runbook` | `runbook` | `helm-unittest-playbook` | 可补齐 Helm chart 模板渲染断言、snapshot 回归与 values 组合测试实践 | `approved` |
| `Kubernetes Docs: kubectl server-side dry-run` | [kubectl apply](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_apply/) | `CC BY 4.0 docs / Kubernetes project materials` | `A-official` | `2026-03` 官方文档持续维护；server-side apply / dry-run=server 是长期稳定能力 | `practice-only` | 已有 Kubeconform、Conftest，但没有 API server 接受性预检手册 | `reference-only-runbook` | `runbook` | `kubectl-server-dry-run-gates` | 可补齐 manifest 渲染后、正式 apply 前的 API server 接受性与字段冲突预检实践 | `approved` |
| `safishamsi/graphify` | [safishamsi/graphify](https://github.com/safishamsi/graphify) | `MIT` | `B-proven-community` | `2026-04` 社区活跃；`v4` 文档包含架构、CLI 与 Python 依赖说明 | `codex+claude` | 已有 `/team-*` 主链与 workflow-engine，但缺少可复用的知识图谱结构分析能力 | `adapt-into-local-skill` | `runbook + skills` | `graphify-knowledge-graph` | 为 brownfield 认知、架构问答、依赖路径分析补结构化证据层 | `approved` |
| `skillcreatorai/Ai-Agent-Skills` | [skillcreatorai/Ai-Agent-Skills](https://github.com/skillcreatorai/Ai-Agent-Skills) | `MIT` | `C-discovery-only` | `443` stars；支持 Claude / Codex / Copilot / Gemini 等多代理安装 | `codex+claude` | 与本仓库的安装面相关，但更适合作为发现与对标来源 | `reject` | `runbook` | `discovery-feed-only` | 可继续发现候选 skill，不作为直接导入源 | `rejected` |
| `VoltAgent/awesome-claude-skills` | [VoltAgent/awesome-claude-skills](https://github.com/VoltAgent/awesome-claude-skills) | `MIT` | `C-discovery-only` | 聚合官方与社区技能，适合持续检索候选 | `practice-only` | 不提供稳定单项事实源 | `reject` | `runbook` | `discovery-feed-only` | 只保留为 awesome list 型发现源 | `rejected` |
| `letta-ai/skills` | [letta-ai/skills](https://github.com/letta-ai/skills) | `MIT` | `C-discovery-only` | 社区知识库型仓库；体量小但结构清晰；包含 `webapp-testing` 等条目 | `codex+claude` | 与本仓库的 skill 形态兼容，但当前信号更适合作为次级发现源 | `reject` | `runbook` | `discovery-feed-only` | 用来发现可评估主题，不直接当 canonical import source | `rejected` |

## 首批批准实施的 3 项

先锁定这 3 项做本地化试点，避免一次引入过多：

| target_name | target_layer | upstream | 为什么现在做 |
|---|---|---|---|
| `systematic-debugging` | `ecc` | `obra/superpowers` | 当前平台能验证，但缺少系统化根因定位流程 |
| `browser-smoke-testing` | `ecc` | `anthropics/skills:webapp-testing` | 当前平台有前端治理，没有独立浏览器 smoke skill |
| `pairwise-test-design` | `ecc` | `omkamal/pypict-claude-skill` | 当前平台有测试策略，没有组合测试设计入口 |

当前进展：

- `systematic-debugging` 已本地化落在 [skills/systematic-debugging/SKILL.md](../../skills/systematic-debugging/SKILL.md)。
- `browser-smoke-testing` 已本地化落在 [skills/browser-smoke-testing/SKILL.md](../../skills/browser-smoke-testing/SKILL.md)。
- `pairwise-test-design` 已本地化落在 [skills/pairwise-test-design/SKILL.md](../../skills/pairwise-test-design/SKILL.md)。
- `karpathy-guidelines` 已本地化落在 [skills/karpathy-guidelines/SKILL.md](../../skills/karpathy-guidelines/SKILL.md)，并作为 `workflow-quality` 的一部分进入安装基线；配套使用说明见 [karpathy-guidelines-usage.md](karpathy-guidelines-usage.md)。
- `git-pr-workflow` 已本地化落在 [docs/runbooks/git-pr-workflow.md](git-pr-workflow.md)。
- `ai-pr-review-automation` 已本地化落在 [docs/runbooks/ai-pr-review-automation.md](ai-pr-review-automation.md)。
- `reviewdog-pr-gates` 已本地化落在 [docs/runbooks/reviewdog-pr-gates.md](reviewdog-pr-gates.md)。
- `release-notes-automation` 已本地化落在 [docs/runbooks/release-notes-automation.md](release-notes-automation.md)。
- `api-breaking-change-gates` 已本地化落在 [docs/runbooks/api-breaking-change-gates.md](api-breaking-change-gates.md)。
- `api-lint-gates` 已本地化落在 [docs/runbooks/api-lint-gates.md](api-lint-gates.md)。
- `testcontainers-integration-testing` 已本地化落在 [skills/testcontainers-integration-testing/SKILL.md](../../skills/testcontainers-integration-testing/SKILL.md)。
- `dependency-review-gates` 已本地化落在 [docs/runbooks/dependency-review-gates.md](dependency-review-gates.md)。
- `codeql-pr-security-gates` 已本地化落在 [docs/runbooks/codeql-pr-security-gates.md](codeql-pr-security-gates.md)。
- `trivy-security-gates` 已本地化落在 [docs/runbooks/trivy-security-gates.md](trivy-security-gates.md)。
- `scorecard-supply-chain-gates` 已本地化落在 [docs/runbooks/scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)。
- `sbom-generation-gates` 已本地化落在 [docs/runbooks/sbom-generation-gates.md](sbom-generation-gates.md)。
- `artifact-attestation-gates` 已本地化落在 [docs/runbooks/artifact-attestation-gates.md](artifact-attestation-gates.md)。
- `cosign-signing-gates` 已本地化落在 [docs/runbooks/cosign-signing-gates.md](cosign-signing-gates.md)。
- `slsa-verification-gates` 已本地化落在 [docs/runbooks/slsa-verification-gates.md](slsa-verification-gates.md)。
- `policy-controller-gates` 已本地化落在 [docs/runbooks/policy-controller-gates.md](policy-controller-gates.md)。
- `contract-testing-playbook` 已本地化落在 [docs/runbooks/contract-testing-playbook.md](contract-testing-playbook.md)。
- `verification-before-completion` 的主要做法已吸收到 `/verify`、`loop-operator` 与相关验证 runbook。
- `pua` 已本地化为 [skills/pua/SKILL.md](../../skills/pua/SKILL.md) 及其 7 个模式 skill，并补上 `/pua` 命令入口、`~/.claude/pua/` 状态持久化（`config.json` / `state.json` / `builder-journal.md`）以及 `pre:compact:pua`、`post:pua:success-reset`、`post:pua:failure-escalation`、`stop:pua:journal` 的运行时 hooks 映射；显式降级项为不支持 `UserPromptSubmit` 即时拦截。
- `slsa-generator-patterns` 已本地化落在 [docs/runbooks/slsa-generator-patterns.md](slsa-generator-patterns.md)。
- `in-toto-attestation-framework` 已本地化落在 [docs/runbooks/in-toto-attestation-framework.md](in-toto-attestation-framework.md)。
- `witness-policy-gates` 已本地化落在 [docs/runbooks/witness-policy-gates.md](witness-policy-gates.md)。
- `dependency-update-automation` 已本地化落在 [docs/runbooks/dependency-update-automation.md](dependency-update-automation.md)。
- `secret-scanning-gates` 已本地化落在 [docs/runbooks/secret-scanning-gates.md](secret-scanning-gates.md)。
- `runner-egress-hardening` 已本地化落在 [docs/runbooks/runner-egress-hardening.md](runner-egress-hardening.md)。
- `actionlint-workflow-gates` 已本地化落在 [docs/runbooks/actionlint-workflow-gates.md](actionlint-workflow-gates.md)。
- `zizmor-workflow-audits` 已本地化落在 [docs/runbooks/zizmor-workflow-audits.md](zizmor-workflow-audits.md)。
- `conftest-policy-gates` 已本地化落在 [docs/runbooks/conftest-policy-gates.md](conftest-policy-gates.md)。
- `checkov-iac-gates` 已本地化落在 [docs/runbooks/checkov-iac-gates.md](checkov-iac-gates.md)。
- `kubeconform-schema-gates` 已本地化落在 [docs/runbooks/kubeconform-schema-gates.md](kubeconform-schema-gates.md)。
- `github-token-permissions-baseline` 已本地化落在 [docs/runbooks/github-token-permissions-baseline.md](github-token-permissions-baseline.md)。
- `kyverno-policy-gates` 已本地化落在 [docs/runbooks/kyverno-policy-gates.md](kyverno-policy-gates.md)。
- `helm-unittest-playbook` 已本地化落在 [docs/runbooks/helm-unittest-playbook.md](helm-unittest-playbook.md)。
- `kubectl-server-dry-run-gates` 已本地化落在 [docs/runbooks/kubectl-server-dry-run-gates.md](kubectl-server-dry-run-gates.md)。
- `graphify-knowledge-graph` 已本地化落在 [skills/graphify/SKILL.md](../../skills/graphify/SKILL.md) 与 [docs/runbooks/graphify-knowledge-graph-usage.md](graphify-knowledge-graph-usage.md)。
- `huashu-design-integration` 当前仅以 docs-only 方式落地：主入口说明与致谢位于 [README.md](../../README.md)，不进入 `skills/`、install profile 或 npm 内置分发面；若后续获得上游授权，再重新走 intake / approval 决定是否升级为本地化适配。

## 下一批待补充候选

这一批 3 项已经完成，本轮先不预设新的默认候选；后续若继续搜罗，再按本台账 intake 合同补录。

## 下一轮实施默认边界

下一轮若实施以上 `approved` 项，默认遵循这些边界：

- 只吸收方法论、流程和结构，不直接复制外部仓库整体目录。
- 先落 `skills/` 本地化版本，再决定是否补 `rules/`、`runbooks/` 或 specialist 文案。
- 不改 `roles/*/role.yaml` 和 `/team-*` 命令，除非本地化 skill 已成型并通过校验。
- 若上游后续许可证、维护状态或内容方向变化，重新走本台账更新状态。
