# SLSA Verification 门禁手册

本手册承接 `slsa-framework/slsa-verifier` 的工程实践，用于把 provenance / attestation 的独立验证接入发布链、审计链和供应链治理。它补的是“这些证明文件是否真的可信、是否匹配目标产物”的验证环节，不替代 SBOM、签名、漏洞扫描或人工放行判断。

## 适用场景

- 团队已经开始生成 provenance attestation，希望在发布前或审计时独立验证它。
- 需要确认某个 artifact、image 或 release asset 的 attestation 是否与目标产物、来源仓库和构建链匹配。
- 团队希望把“有 attestation”升级成“attestation 已被验证”。

## 不适用场景

- 当前还没有稳定的 attestation 产出，却先引入验证工具。
- 团队还没有明确验证对象、验证策略或失败处置方式。
- 期望只靠 SLSA verifier 替代签名验证、SBOM 归档或漏洞扫描。

## 推荐落地方式

1. 先把验证范围锁定到最关键的正式制品，不要一开始覆盖所有历史产物。
2. 第一阶段先固定三件事：
   - 哪些产物必须做 provenance 验证
   - 验证输入来自哪里
   - 验证失败时谁决定阻塞或降级处理
3. 将验证与现有链路分层：
   - `artifact-attestation-gates` 负责生成 provenance attestation
   - `slsa-generator-patterns` 负责 GitHub Actions 侧的 provenance 生成模式与 workflow 约束
   - `in-toto-attestation-framework` 负责 attestation 的 predicate、schema 和 evidence model 设计
   - `cosign-signing-gates` 负责签名与验签链路
   - SLSA verification 负责独立验证 provenance / attestation 是否匹配目标产物
   - `devops-engineer`、`tech-lead` 负责最终放行判断
4. 若团队后续要做 policy enforcement，先把验证规则和失败处置跑顺，再考虑强制化策略。
5. 结果必须回写到 `/team-release`、审计记录或外部交付说明中，不让验证结果只停在命令输出里。

## 最小门禁模型

- `subject layer`：待发布的 artifact、image 或 release asset
- `evidence layer`：attestation、digest、来源仓库与 workflow 信息
- `verification layer`：验证规则、验证结果与失败原因
- `decision layer`：`devops-engineer`、`tech-lead` 决定“验证失败”是否阻塞发布

重点不是“有一份证明文件”，而是证明文件已经被独立验证且匹配目标产物。

## 重点检查项

- 验证对象是否与实际要发布的 artifact、镜像 digest 或 release asset 一一对应
- 验证输入是否来自可信来源，而不是手工拼接的本地文件
- provenance / attestation 是否和目标仓库、workflow、commit 或 digest 匹配
- 验证失败时是否有清晰的 triage 和阻塞策略
- 团队是否把验证结果回写到发布记录，而不是只保留终端日志

## 反模式

- 已生成 attestation，但从未做独立验证。
- 验证时不校验目标产物，只验证“文件格式大致正确”。
- 验证失败后没有回到 release 记录，后续没人知道为什么被放行或拦截。
- 还没稳定产出 provenance，就先把验证失败设成硬阻塞。

## 输出回落

- 构建阶段：记录哪些产物做了独立 provenance 验证，以及验证输入来源。
- 发布阶段：把验证结果、失败摘要或例外结论写入 `/team-release` 的检查结果或放行结论。
- 审计阶段：若需要追溯某次发布，必须能同时定位到 attestation 本身和验证结果。

## 许可证与使用边界

- `slsa-framework/slsa-verifier` 采用 Apache-2.0。
- 启用前应确认 attestation 来源、目标产物类型、runner 环境和团队可接受的验证策略。

## 参考来源

- [slsa-framework/slsa-verifier](https://github.com/slsa-framework/slsa-verifier)
- [artifact-attestation-gates.md](artifact-attestation-gates.md)
- [slsa-generator-patterns.md](slsa-generator-patterns.md)
- [in-toto-attestation-framework.md](in-toto-attestation-framework.md)
- [cosign-signing-gates.md](cosign-signing-gates.md)
