# Artifact Attestation 门禁手册

本手册承接 `actions/attest-build-provenance` 的工程实践，用于把构建产物 provenance attestation 接入发布链、审计链和供应链治理。它补的是“这个产物是如何构建出来的”证明，不替代 SBOM、漏洞扫描或人工放行判断。

## 适用场景

- 仓库会发布二进制、容器镜像、压缩包或其他正式制品。
- 团队已经开始关注 SBOM、依赖门禁或供应链基线，希望进一步证明产物来源和构建链。
- 需要让发布记录能回答“这个 artifact 是由哪次 workflow、哪份源码、哪套 runner 构建出来的”。

## 不适用场景

- 当前还没有稳定发布制品，却为了追求概念完整性强行加 provenance。
- 团队还没有明确 attestation 生成后存放在哪里、谁来验证、何时检查。
- 期望只靠 provenance attestation 回答漏洞、许可证或业务风险问题。

## 推荐落地方式

1. 先把 attestation 看成发布证明链，不要一开始就把它和所有安全门禁混成一个阻塞开关。
2. 第一阶段先固定三件事：
   - 哪些正式制品需要 provenance
   - attestation 与产物如何关联
   - 发布记录在哪里能找到 attestation
3. 将 attestation 与现有链路分层：
   - `sbom-generation-gates` 负责成分清单
   - `trivy-security-gates` 负责漏洞与 misconfiguration
   - `scorecard-supply-chain-gates` 负责仓库与 workflow 基线
   - `slsa-generator-patterns` 负责 GitHub Actions 侧更通用的 provenance 生成模式与 workflow 约束
   - `in-toto-attestation-framework` 负责 predicate、schema 和 evidence model 设计
   - attestation 负责构建来源与生成证明
4. 若团队后续要接签名或对外验证，先把 attestation 生成和归档链跑稳，再补验证链。
5. 结果必须回写到 `/team-release`、发布记录或制品元数据中，不让 attestation 只停在 workflow summary 里。

## 最小门禁模型

- `subject layer`：要发布的 artifact 或镜像
- `provenance layer`：attestation 的 subject、digest、构建来源与 workflow 信息
- `publication layer`：attestation 的存放位置与可检索方式
- `decision layer`：`devops-engineer`、`tech-lead` 决定“缺失 attestation”是否阻塞发布

重点不是“能生成一份 attestation”，而是发布后还能稳定找到并验证它。

## 重点检查项

- attestation 是否和实际发布出去的 artifact、镜像 digest 或 release asset 一一对应
- 产物重新构建、补发或回滚时，attestation 是否同步更新
- workflow 是否记录了足够的 provenance 信息，而不是只有一个孤立文件
- 团队是否定义了 attestation 的存放位置、命名规则和发布记录回链方式
- 后续若要对外验证，当前格式和存储方式是否能平滑扩展

## 反模式

- 生成了 attestation，但没人知道和哪个产物、哪个版本对应。
- 有 SBOM 没 provenance，或有 provenance 没 SBOM，导致追溯链断层。
- 只把 attestation 当“发布多一个文件”，没有放回 release 记录和审计链。
- 还没跑通归档和验证链，就先把“缺失 attestation”设置成强阻塞项。

## 输出回落

- 构建阶段：记录哪些产物生成了 provenance attestation、文件或 URL 在哪里。
- 发布阶段：把 attestation 链接、artifact 名称或摘要写入 `/team-release` 的发布方案、检查结果或放行结论。
- 审计阶段：若需要追溯某次发布，必须能从 release 记录定位到对应 attestation，并反查到构建来源。

## 许可证与使用边界

- `actions/attest-build-provenance` 本身是 MIT。
- 启用前应确认仓库类型、GitHub runner 版本、产物发布位置和组织级 attestations 能力边界。

## 参考来源

- [actions/attest-build-provenance](https://github.com/actions/attest-build-provenance)
- [sbom-generation-gates.md](sbom-generation-gates.md)
- [scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)
- [slsa-generator-patterns.md](slsa-generator-patterns.md)
- [in-toto-attestation-framework.md](in-toto-attestation-framework.md)
