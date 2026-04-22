# Kyverno Policy 门禁手册

本手册基于 `kyverno/kyverno` 的官方文档与仓库信息整理，用于说明 Kyverno 在 Kubernetes admission、background scan、policy report 和 image verification 场景里的落地边界。它补的是“把 Kubernetes 策略在集群内执行，并把结果回流到治理链”这一层，不替代通用配置策略扫描、漏洞扫描或独立的供应链强制组件。

## 用途 / 定位

Kyverno 是 Kubernetes 原生的 policy engine。官方文档说明它以 dynamic admission controller 方式工作，同时配套 background scans 和 policy reports；它既能做 `validate` / `mutate` / `generate`，也能做镜像签名与 attestation 校验。对于当前仓库来说，Kyverno 更适合被定位为“集群内的策略执行层 + 策略回报层”，而不是通用扫描器。

## 适用场景

- 需要对 Kubernetes 资源做 admission 级拦截或审计，例如标签、镜像引用、工作负载约束、命名约束、namespace 约束。
- 需要先用 `Audit` 观察策略影响，再逐步切到 `Enforce`。
- 需要对现有资源做 background scan，评估新策略对存量 workload 的影响。
- 需要在集群里对镜像签名、attestation 或 digest 约束做原生校验。
- 需要把策略执行结果沉淀为 Policy Report，便于治理、排障和回溯。

## 不适用场景

- 只想扫漏洞、secret、IaC misconfiguration，且没有明确的 Kubernetes 策略执行需求。
- 只想对任意结构化配置做离线 policy-as-code 预检，不打算进入 Kubernetes admission 或 background 体系。
- 团队已经明确选择 `sigstore/policy-controller` 作为镜像签名与 attestation 的 admission 强制层，不希望重复维护一套 Kyverno 镜像策略。
- 期望 Kyverno 替代人工发布判断、依赖审查或制品安全扫描。

## 推荐落地方式

1. 先把 Kyverno 的职责收窄到 Kubernetes 资源治理，不要一开始就把所有平台规则都塞进同一组 policy。
2. 先从 `validate` 策略开始，配合 `Audit` 和 background scan 观察影响，再决定哪些规则升到 `Enforce`。
3. 对镜像治理，优先使用 Kyverno 官方支持的 `verifyImages` 或 `ImageValidatingPolicy` 能力来做签名、attestation、digest 约束，而不是把镜像安全问题拆成多个互相重复的规则源。
4. 在 CI / 预检阶段，可以用 Kyverno CLI 对资源清单做离线应用和 policy report 生成；在集群内则由 admission controller 和 reports controller 负责持续执行与回报。
5. 在当前仓库的分工里，建议这样分层：
   - `conftest-policy-gates` 负责 Kubernetes 之外的结构化配置 policy-as-code 预检
   - `kyverno-policy-gates` 负责 Kubernetes admission、background scan、policy report 和 image verification
   - `policy-controller-gates` 负责以 policy-controller 方式做 admission 层的镜像签名 / attestation 强制
   - `trivy-security-gates` 负责漏洞、secret 和 IaC 安全扫描
6. 如果同一类规则已经在 `conftest` 或 `policy-controller` 中被明确拥有，就不要再用 Kyverno 重复实现一套相同语义的门禁，避免三套策略漂移。

## 最小门禁模型

- `policy layer`：Kyverno `Policy` / `ClusterPolicy`，或新一代 `ValidatingPolicy` / `ImageValidatingPolicy`
- `evaluation layer`：admission control、background scan、Kyverno CLI policy apply / policy report
- `report layer`：PolicyReport / ClusterPolicyReport，外加 Kubernetes events
- `decision layer`：`qa-engineer`、`devops-engineer`、`tech-lead` 决定是否进入 `Audit`、是否升级到 `Enforce`、是否接受例外

最小可用模型不是“装了 Kyverno”，而是至少要同时具备策略定义、评估路径、报告回流和例外治理四件事。

## 重点检查项

- 策略类型是否选对：资源校验优先 `validate`，资源变更才考虑 `mutate` / `generate`，镜像校验才考虑 `verifyImages` 或 `ImageValidatingPolicy`
- `failureAction` 是否明确，`Audit` 与 `Enforce` 是否按阶段推进
- `background` 是否和策略用途一致；需要存量扫描时保持开启，不需要时显式关闭
- `match` / `exclude` 范围是否过宽，是否会误伤系统 namespace 或平台组件
- 镜像约束是否以 digest、签名或 attestation 为依据，而不是只靠 tag 字符串
- Policy Report 是否被用于当前状态观察，而不是误当成历史审计账本
- 例外机制是否通过 Kyverno 官方支持的 policy exception 能力或明确的治理流程管理，而不是临时改 policy 绕过去

## 反模式

- 把 Kyverno 当成通用漏洞扫描器，结果只看到了策略结果，没有建立真正的安全证据链。
- 先上全局 `Enforce`，再回头补例外和可视化，导致大量正常工作负载被拦。
- 在 `conftest`、`policy-controller`、Kyverno 三套体系里重复表达同一条规则，却没有统一 owner。
- 只看 admission 结果，不看 background scan 和 policy report，导致存量违规一直被忽略。
- 用 Kyverno 做轻量的结构化配置 lint，却不打算把它接入 Kubernetes 策略生命周期。

## 输出回落

- 评审阶段：把 Kyverno 命中的策略、影响范围、例外判断写回 `/team-review`。
- 发布阶段：若策略将阻塞部署或已触发 `Enforce` 拒绝，必须写回 `/team-release` 的风险、放行结论或后续观察项。
- 平台治理：将长期稳定的 policy、命中样例和例外流程沉淀到平台治理文档或策略仓库，而不是只留在集群事件里。

## 许可证与使用边界

- `kyverno/kyverno` 采用 Apache-2.0。
- Kyverno 适合用来做 Kubernetes 原生策略治理、background scan 和 image verification，但不应被当作通用漏洞扫描器或任意配置的唯一门禁。
- 如果团队已经选择 `sigstore/policy-controller` 作为镜像签名与 attestation 的最终 admission 强制层，Kyverno 的同类能力应避免重复建设，除非已经明确分层并有独立 owner。
- 若团队需要对 Kubernetes 之外的 JSON / YAML / 结构化配置做 policy-as-code 预检，应优先走 `conftest-policy-gates` 的边界，而不是把非 Kubernetes 规则硬塞进 Kyverno。

## 参考来源

- [kyverno/kyverno](https://github.com/kyverno/kyverno)
- [How Kyverno Works](https://kyverno.io/docs/introduction/how-kyverno-works/)
- [Applying Policies](https://kyverno.io/docs/applying-policies/)
- [Kyverno CLI](https://kyverno.io/docs/subprojects/kyverno-cli/)
- [Policy Types](https://kyverno.io/docs/policy-types/)
- [ValidatingPolicy](https://kyverno.io/docs/policy-types/validating-policy/)
- [ImageValidatingPolicy](https://kyverno.io/docs/policy-types/image-validating-policy/)
- [Verify Images Rules](https://kyverno.io/docs/policy-types/cluster-policy/verify-images/)
- [Policy Reports](https://kyverno.io/docs/policy-reports/)
- [conftest-policy-gates.md](conftest-policy-gates.md)
- [policy-controller-gates.md](policy-controller-gates.md)
- [trivy-security-gates.md](trivy-security-gates.md)
