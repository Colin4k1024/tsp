# Policy Controller 策略强制门禁手册

本手册承接 `sigstore/policy-controller` 的工程实践，用于把 Kubernetes admission 层的策略强制执行接入供应链治理链。它补的是“在集群里真正拦住不符合策略的镜像和工作负载”这一层，不替代 SBOM、签名、provenance attestation、SLSA verification 或漏洞扫描。

## 适用场景

- 团队已经有 `cosign`、provenance attestation 或 SLSA verification，想把“建议验证”推进到“集群 admission 强制执行”。
- 需要在 Kubernetes 集群内按 namespace 或工作负载范围强制要求镜像签名、attestation 或其他可验证的供应链元数据。
- 仓库的镜像来源复杂，单靠 CI / release 流程不足以保证运行中的 workload 没有被替换或绕过治理。

## 不适用场景

- 当前还没有稳定的签名、attestation 或验证链，却先上 admission 强制，导致拦截全靠猜。
- 团队还没有明确哪些 namespace、workload 或镜像类型需要受策略约束。
- 期望 policy controller 替代 CI 侧的 SBOM、签名、验证和人工放行流程。

## 推荐落地方式

1. 先把策略范围收窄到少数关键 namespace，不要一开始全集群拦截。
2. 第一阶段先固定三件事：
   - 哪些 workload 或 namespace 受策略约束
   - 策略依据是什么，例如签名、attestation 或仓库来源
   - 拒绝时如何回退、告警和 triage
3. 将 policy controller 与现有链路分层：
   - `sbom-generation-gates` 负责成分清单
   - `artifact-attestation-gates` 负责 provenance 证明
   - `cosign-signing-gates` 负责签名与验签
   - `slsa-verification-gates` 负责独立验证 provenance / attestation
   - `kyverno-policy-gates` 负责更通用的 Kubernetes admission、background scan 和 policy report 治理
   - policy controller 负责在 admission 层强制执行这些可验证策略
4. 建议先从“观察模式”或“单 namespace 强制”开始，再逐步扩大范围。
5. 结果必须回写到 `/team-release`、集群治理记录或运行手册，不让策略结果只停在 webhook 日志里。

## 最小门禁模型

- `policy layer`：定义哪些 namespace、workload、镜像或来源受约束
- `evidence layer`：签名、attestation、验证结果和镜像来源
- `admission layer`：Kubernetes webhook 在创建或更新时执行拦截
- `decision layer`：`devops-engineer`、`tech-lead` 决定是否把拒绝结果视为阻塞或降级

重点不是“装了一个 webhook”，而是让集群真正按供应链证据执行策略。

## 重点检查项

- 策略是否按 namespace 或工作负载边界配置，而不是一刀切全局生效
- 策略依据是否和镜像签名、attestation 或验证结果稳定关联
- 镜像 tag 是否会在 admission 时被解析成 digest，避免“通过时和运行时不是同一个镜像”
- 策略失败时是否有明确的告警、triage 和例外流程
- 多 key、多个 policy 或不同环境之间的配置是否能持续维护

## 反模式

- 没有前置验证链，却先上 admission 强制，把所有问题都变成发布阻塞。
- 策略配置只写在集群里，发布记录和治理文档里没有回链。
- 把 policy controller 当成安全扫描器，忽略它本质上是执行层拦截器。
- 上线后只有“拒绝了什么”，没有“为什么拒绝、谁来处理、何时放宽”的闭环。

## 输出回落

- 发布阶段：把受影响的 namespace、策略范围和验证结果写入 `/team-release` 的检查结果或放行结论。
- 集群治理：把 policy 变更、例外项和告警处理记录沉淀到治理文档或 runbook。
- 审计阶段：若某次 workload 被拦截，必须能追溯到对应的签名、attestation 或验证证据。

## 许可证与使用边界

- `sigstore/policy-controller` 采用 Apache-2.0。
- 启用前应确认 Kubernetes 版本、Webhook 部署方式、镜像仓库可访问性和团队是否有足够的治理人力。
- 参考仓库的支持说明，`policy-controller` 近版本面向 Kubernetes 1.27 到 1.29 更稳定，旧版本需单独验证。

## 参考来源

- [sigstore/policy-controller](https://github.com/sigstore/policy-controller)
- [cosign-signing-gates.md](cosign-signing-gates.md)
- [artifact-attestation-gates.md](artifact-attestation-gates.md)
- [slsa-verification-gates.md](slsa-verification-gates.md)
