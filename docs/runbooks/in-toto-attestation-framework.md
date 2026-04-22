# In-Toto Attestation 设计参考手册

本手册承接 `in-toto/attestation` 的工程实践，用于帮助团队设计 attestation 的 predicate、schema 和 evidence model。它补的是“我们要证明什么、证据长什么样、证据如何串成链”这一层，不替代 `artifact-attestation-gates`、`slsa-verification-gates`、`cosign-signing-gates` 或 `policy-controller-gates`。

## 适用场景

- 团队已经开始做构建证明、签名或 provenance 管理，但还没有统一的 attestation 结构设计。
- 需要把 build、test、scan、sign、approval 这些事件串成可检索、可验证、可归档的证据链。
- 希望为不同产物定义可演进的 predicate，而不是把所有信息都塞进一个不可维护的大 JSON。
- 需要跨团队对齐“哪些事实进入 attestation，哪些事实留在 release note、runbook 或审计记录里”。

## 不适用场景

- 当前还没有任何稳定的发布制品或构建链，却先讨论 attestation schema。
- 团队只是想找一个“能生成 attestation 的工具”，而不是设计自己的证据模型。
- 需要解决漏洞扫描、许可证审查、签名验证或集群强制策略时，把 attestation 当成万能入口。
- 团队没有人愿意维护 predicate 版本、schema 迁移和验证规则。

## 推荐落地方式

1. 先回答“我们到底要证明什么”，再决定 predicate 的字段，而不是反过来先抄一个 schema。
2. 第一阶段只设计少量高价值 predicate：
   - `build`：源码、workflow、runner、digest、输出产物
   - `test`：测试范围、环境、结果摘要、失败边界
   - `scan`：扫描对象、规则集、结论、例外项
   - `sign`：签名对象、签名主体、时间与版本
   - `approval`：谁批准、批准范围、批准前提
3. 采用分层模型组织 attestation：
   - `subject layer`：被证明的 artifact、镜像、release asset 或 bundle
   - `predicate layer`：关于 subject 的事实，按事件类型拆分
   - `evidence layer`：签名、证书、时间戳、来源 URI、digest
   - `policy layer`：哪些 predicate 是必需的，哪些可以选配
4. 设计 schema 时优先考虑版本化和可演进性：
   - 字段名稳定，新增字段向后兼容
   - predicate type 有明确命名空间
   - schema 版本和验证规则能一起升级
5. 将 attestation 与现有链路分层：
   - `artifact-attestation-gates` 负责构建产物 provenance
   - `slsa-verification-gates` 负责独立验证
   - `cosign-signing-gates` 负责签名与验签
   - `policy-controller-gates` 负责在 admission 层把证据转成强制策略
6. 结果必须回写到 `/team-release`、审计记录或制品元数据，不让 attestation 只停在某个仓库对象里。

## 最小门禁模型

- `subject layer`：被证明的产物或对象。
- `predicate layer`：build/test/scan/sign/approval 等事实，按事件类型分开。
- `evidence layer`：证据来源、签名、时间戳、digest 与可追溯链接。
- `verification layer`：如何校验 predicate 与 subject 是否匹配。
- `decision layer`：`architect`、`devops-engineer`、`tech-lead` 决定证据是否足以放行。

重点不是“有一份 JSON”，而是这份 JSON 是否能稳定回答三个问题：

- 这是什么对象。
- 这个对象经历了什么。
- 这些事实是谁提供、谁验证、谁批准的。

## 重点检查项

- predicate 是否按事件类型拆分，而不是把所有事实写进一个超大结构。
- schema 是否有明确版本号、兼容策略和字段语义说明。
- evidence 是否记录了 subject digest、来源 URI 和生成时间，避免“证据和对象对不上”。
- 设计是否区分事实、判断和审批，避免把所有人类意见都塞进同一层。
- 证据链是否能和 `artifact-attestation-gates`、`slsa-verification-gates`、`cosign-signing-gates` 互相引用。
- 是否清楚哪些字段属于 attestation，哪些字段应留在 release note、runbook 或审计记录。

## 反模式

- 先选工具，再倒推 schema，最后 attestation 变成工具输出的副作用。
- 把 build、test、scan、approval 的所有细节都堆在一份 predicate 里，后续无法演进。
- 只有 attestation，没有 subject digest 或来源链接，导致证据无法复查。
- schema 变更时没有版本策略，旧证据无法验证，新证据又和旧链路不兼容。
- 把 attestation 当成“安全结论本身”，忽略了它只是证据承载层。

## 输出回落

- 设计阶段：把 predicate 类型、字段含义、版本号和证据来源写入设计文档或 API contract。
- 构建阶段：把生成的 attestation 与 artifact digest、workflow、build id 或 release asset 关联起来。
- 发布阶段：把 attestation 的定位方式、关键证据和验证结果写入 `/team-release`。
- 审计阶段：若需要追溯某次发布，必须能从 release 记录定位到对应 attestation，并反查到 subject 和 predicate。

## 许可证与使用边界

- `in-toto/attestation` 采用 Apache-2.0。
- 引入前应确认团队是否具备维护 predicate schema、版本迁移和验证规则的能力。
- 如果只是想做“能记录构建来源”，优先走 `artifact-attestation-gates`；如果要做“验证是否可信”，优先走 `slsa-verification-gates`。

## 参考来源

- [in-toto/attestation](https://github.com/in-toto/attestation)
- [artifact-attestation-gates.md](artifact-attestation-gates.md)
- [slsa-verification-gates.md](slsa-verification-gates.md)
- [cosign-signing-gates.md](cosign-signing-gates.md)
- [policy-controller-gates.md](policy-controller-gates.md)
