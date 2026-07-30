# Kubeconform Schema 门禁手册

本手册承接 `yannh/kubeconform` 的工程实践，用于把 Kubernetes manifest 的 schema 级校验接入 PR、评审和发布前预检。它补的是“这个 YAML / JSON 是否符合对应 Kubernetes OpenAPI / JSON Schema 结构”的验证层，不替代策略引擎、漏洞扫描、镜像治理或集群 admission 强制。

## 用途/定位

Kubeconform 是一个面向 Kubernetes manifests 的快速结构校验器，重点验证资源对象是否满足官方 OpenAPI 所表达的字段、类型和结构约束。它适合放在最前面的门禁层，用来尽早拦截明显的字段拼写错误、类型错误、资源结构不合法，以及 CRD 相关的 schema 不匹配问题。

它的定位不是“安全审计器”，也不是“策略判定器”，而是“先把 manifest 形状校正好”的基础质量门禁。更具体地说，它适合回答的是：

- 这个资源对象能不能被 Kubernetes schema 识别
- 这个字段类型和层级结构对不对
- 这个 CRD / 自定义资源的 schema 是否能被当前校验链路覆盖

## 适用场景

- 仓库中存在 Kubernetes YAML、Helm 渲染产物、kustomize 输出或其他最终会落到集群的 manifest。
- 团队希望在提交和评审阶段尽早发现字段拼写、类型、层级、必填项和对象结构错误。
- 团队需要对多版本 Kubernetes 兼容性做基础校验，并希望显式指定目标版本或 schema 源。
- 团队使用 CRD 或自定义资源，希望把可获得的 schema 纳入统一校验，而不是等到集群里才发现对象不可用。
- 团队需要一个高吞吐、低噪音的前置校验层，作为后续策略和安全门禁的输入净化步骤。

## 不适用场景

- 期望 Kubeconform 替代 `conftest-policy-gates` 的 Rego 策略判断。
- 期望 Kubeconform 替代 `trivy-security-gates` 的漏洞、secret、misconfiguration 和镜像层扫描。
- 期望 Kubeconform 替代 `policy-controller-gates` 在 Kubernetes admission 层的强制执行。
- 期望它判断资源是否符合团队的权限模型、网络策略、镜像来源、SBOM、签名或 provenance 要求。
- 期望它覆盖 Kubernetes 控制器的所有 server-side 校验，因为 OpenAPI schema 本身覆盖不到全部运行时语义。
- 仓库里根本没有 Kubernetes manifests，却为了“流程完整”硬塞一个 schema validator。

## 推荐落地方式

1. 把 Kubeconform 放在 manifest 生成链路的最前面，先做结构校验，再交给后续策略和安全检查。
2. 先固定校验范围：
   - 原始 Kubernetes YAML
   - Helm 渲染后的最终清单
   - kustomize 输出
   - 明确纳入的 CRD 和自定义资源
3. 先把目标 Kubernetes 版本、schema 来源和 CRD 覆盖范围定下来，再决定是否启用更严格的模式。
4. 将门禁分层，避免职责重叠：
   - `helm-unittest-playbook` 负责 Helm chart 模板、values 组合和 snapshot 层的本地渲染断言
   - `kubeconform-schema-gates` 负责 manifest 的 OpenAPI / JSON Schema 结构校验
   - `kubectl-server-dry-run-gates` 负责把 manifests 送到 API server 做不落盘预检，确认 server-side 接受性
   - `conftest-policy-gates` 负责结构化配置上的 policy-as-code 规则
   - `trivy-security-gates` 负责镜像、文件系统和 IaC 的漏洞与安全风险扫描
   - `policy-controller-gates` 负责在集群 admission 层强制执行已确认的策略
5. 对 CRD 场景，优先保证 schema 来源可追溯、版本明确、覆盖稳定，再考虑扩大到更多自定义类型。
6. 如果团队需要更接近集群实际行为的确认，应把 Kubeconform 视为前置静态校验，而不是最终可运行性证明。

## 最小门禁模型

- `input layer`：Kubernetes manifests、Helm 渲染结果、kustomize 输出或 CRD 相关清单
- `schema layer`：Kubernetes OpenAPI / JSON Schema、指定版本 schema、CRD 衍生 schema
- `validation layer`：Kubeconform 对对象字段、类型、结构和资源定义做静态验证
- `decision layer`：`qa-engineer`、`devops-engineer`、`tech-lead` 根据结果判断是否阻塞合并或发布

这个门禁的关键不是“跑了一个校验器”，而是团队能否稳定回答“这个 manifest 为什么不合法、是 schema 不足还是文件本身有问题、是否需要升级到后续门禁继续判断”。

## 重点检查项

- manifest 是否与目标 Kubernetes 版本匹配，而不是拿过旧或过新的 schema 盲测
- 对象字段名、类型、数组 / map 结构是否和 schema 一致
- 必填字段、枚举约束和资源层级是否正确
- CRD 或自定义资源是否有明确可追溯的 schema 来源，避免“默认 schema 不认识就算通过或算失败”这种不稳定行为
- 是否需要更严格的模式来捕获额外字段、重复键或隐式拼写错误
- 是否存在大量被忽略的 kind / GVK，导致门禁看似通过，实际没有覆盖关键资源
- 是否已经把 OpenAPI 能验证的结构问题和需要后续策略校验的问题分开，避免职责混杂

## 反模式

- 把 Kubeconform 当成 Kubernetes 安全基线工具，拿它去管权限、漏洞、签名或镜像来源。
- 只接默认 schema，却没有明确 CRD 覆盖策略，导致自定义资源要么被误判、要么根本没被覆盖。
- 把所有 schema 不匹配都当成“集群会自动处理”，不回到 manifest 生成阶段修正。
- 同时启用 `conftest-policy-gates`、`trivy-security-gates`、`policy-controller-gates`，却没有说明各自检查层，最后同一类问题在多个工具里重复或遗漏。
- 只看通过率，不看哪些资源被跳过、哪些版本不匹配、哪些 schema 来源不可信。

## 输出回落

- PR 阶段：把 schema 不匹配、字段类型错误、CRD 覆盖缺口和修复建议写入 review 摘要。
- 评审阶段：在 `/team-review` 中明确哪些问题是 manifest 结构错误，哪些需要交给后续 policy 或安全门禁继续判断。
- 发布阶段：若关键 manifests 仍存在 schema 级错误，必须回写到 `/team-release` 的风险项、阻塞项或修复待办中。
- 治理阶段：把目标 Kubernetes 版本、schema 源、CRD 覆盖策略和例外规则沉淀到团队 runbook 或发布规范中。

## 许可证与使用边界

- `yannh/kubeconform` 采用 Apache-2.0。
- Kubeconform 只验证 Kubernetes 官方 OpenAPI / JSON Schema 能表达的结构约束，不覆盖所有 server-side 语义校验。
- 官方文档明确指出，Kubernetes controllers 还会做额外的 server-side validation，这部分需要其他工具或 `kubectl --dry-run=server` 之类的机制补足。
- 对自定义资源而言，校验质量取决于 schema 源和 CRD 转换质量，不能把“schema 可用”误当成“运行时一定可用”。

## 参考来源

- [yannh/kubeconform](https://github.com/yannh/kubeconform)
- [yannh/kubernetes-json-schema](https://github.com/yannh/kubernetes-json-schema)
- [helm-unittest-playbook.md](helm-unittest-playbook.md)
- [kubectl-server-dry-run-gates.md](kubectl-server-dry-run-gates.md)
- [conftest-policy-gates.md](conftest-policy-gates.md)
- [trivy-security-gates.md](trivy-security-gates.md)
- [policy-controller-gates.md](policy-controller-gates.md)
