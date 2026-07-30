# Witness 证据策略门禁手册

本手册承接 `in-toto/witness` 的工程实践，用于把证据采集、证据封装与策略评估组织成一条可执行的供应链治理链。它补的是“如何基于真实执行证据做更高级的政策判断”这一层，不替代 SBOM、签名、provenance attestation、SLSA verification 或集群侧的 policy controller。

## 适用场景

- 团队已经有签名、attestation 和基础验证链，想进一步把“证据是否足够、证据是否可信、证据是否符合策略”做成可执行门禁。
- 需要把构建、发布、部署或执行过程中的 evidence 收集起来，再基于这些 evidence 做 policy 判断。
- 想把“某次运行到底发生了什么”沉淀成可追溯、可回放、可审计的证据链，而不只是单一的签名结果。
- 需要更精细地把供应链治理从“文件级验证”推进到“证据驱动的策略评估”。

## 不适用场景

- 当前还没有稳定的签名、attestation 或 verification 链，却先引入 witness 风格的证据策略门禁。
- 团队还没有明确哪些证据要采集、谁来维护 policy、证据失败后怎么 triage。
- 期望 witness 替代 SBOM、签名、attestation 或 SLSA verification 的基础门禁职责。
- 团队只想要一个简单的发布检查清单，而不是证据驱动的策略框架。

## 推荐落地方式

1. 先把 witness 看成“证据和策略的编排层”，不要一开始就把它升级成全集群硬门禁。
2. 第一阶段先固定三件事：
   - 哪些执行阶段需要采集 evidence
   - 这些 evidence 以什么形式归档和回链
   - 哪些 policy 依赖这些 evidence 做判断
3. 将 witness 与现有链路分层：
   - `cosign-signing-gates` 负责签名与验签
   - `artifact-attestation-gates` 负责 provenance attestation
   - `slsa-verification-gates` 负责独立验证 attestation 是否匹配目标产物
   - `policy-controller-gates` 负责在集群 admission 层强制执行已确认的策略
   - witness 负责把 evidence 收集、归档、解释并喂给更上层的 policy decision
4. 建议先从少量高价值流程试点，比如构建链、发布链或关键部署链，不要一开始就覆盖全部工作负载。
5. 结果必须回写到 `/team-release`、审计记录或治理文档中，不让 evidence 只停在运行时日志里。

## 最小门禁模型

- `evidence layer`：构建、测试、发布或部署过程中采集到的 evidence
- `policy layer`：基于 evidence 进行的策略规则和判断条件
- `evaluation layer`：witness 对 evidence 与 policy 的匹配与评估
- `decision layer`：`devops-engineer`、`tech-lead` 决定“证据不足”是否阻塞发布或部署

重点不是“收集了一堆日志”，而是这些 evidence 是否能支撑可重复的 policy decision。

## 重点检查项

- evidence 是否来自真实执行链，而不是手工拼接或事后补写
- policy 是否明确描述了“需要哪些证据、缺什么算失败、如何例外”
- evidence 与产物、commit、workflow、digest 或环境上下文是否能稳定关联
- 证据失败时是否有清晰的 triage、回退和例外处理
- 不同环境或不同阶段的 policy 是否能持续维护，而不是一次配置后长期漂移

## 反模式

- 只收集 evidence，却没有明确 policy，最后变成一堆无法消费的日志。
- policy 写得过于宽泛，任何结果都能解释成“通过”，失去门禁意义。
- evidence 只存在于临时目录或终端输出里，没有回链到 release 记录或治理文档。
- 在没有前置签名、attestation 或 verification 链的情况下，直接把 witness 当成最终阻塞点。
- 证据失败后没人负责 triage，最后团队把 policy gate 当成噪音源。

## 输出回落

- 构建阶段：记录关键执行步骤产生的 evidence、归档位置和可回放方式。
- 发布阶段：把 witness 评估结果、失败摘要或例外结论写入 `/team-release` 的检查结果或放行结论。
- 审计阶段：若后续要追溯某次发布或部署，必须能从 release 记录定位到对应 evidence，再反查到 policy 决策。

## 许可证与使用边界

- `in-toto/witness` 采用 Apache-2.0。
- 启用前应确认 evidence 采集范围、policy 维护责任、运行环境和团队是否有能力长期维护规则。
- 如果团队当前还处在“先补 SBOM / 签名 / attestation / verification”的阶段，witness 应该先作为参考型治理层，而不是立刻成为强阻塞门禁。

## 参考来源

- [in-toto/witness](https://github.com/in-toto/witness)
- [cosign-signing-gates.md](cosign-signing-gates.md)
- [artifact-attestation-gates.md](artifact-attestation-gates.md)
- [slsa-verification-gates.md](slsa-verification-gates.md)
- [policy-controller-gates.md](policy-controller-gates.md)
