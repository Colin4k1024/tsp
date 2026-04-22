# Cosign 签名与验证门禁手册

本手册承接 `sigstore/cosign-installer` 的工程实践，用于把 artifact / image signing 与验证接入发布链和外部交付证明链。它补的是“这个制品是否被正式签名、能否被验证”的证据，不替代 SBOM、provenance attestation 或漏洞扫描。

## 适用场景

- 仓库会发布容器镜像、二进制、压缩包或其他需要对外交付的正式制品。
- 团队已经开始生成 SBOM、attestation，希望再补齐签名和验签这一层。
- 需要让发布记录能回答“这个产物是否由受控身份签名，消费方如何验证”。

## 不适用场景

- 当前还没有稳定发布制品，却为了“供应链完整”强行加签名。
- 团队还没有明确签名身份、密钥来源、验证入口和失败处置方式。
- 期望只靠签名就替代 provenance、SBOM、漏洞扫描或人工放行判断。

## 推荐落地方式

1. 先把签名范围锁定到最关键的正式制品，不要一开始给所有中间产物都加签。
2. 第一阶段先固定三件事：
   - 哪些 artifact / image 需要签名
   - 签名后如何存放和回链
   - 谁在发布或消费时负责验签
3. 将签名与现有链路分层：
   - `sbom-generation-gates` 负责成分清单
   - `artifact-attestation-gates` 负责 provenance 证明
   - Cosign 负责 artifact / image 的签名与验证
   - `devops-engineer`、`tech-lead` 负责最终放行判断
4. 若团队后续要做对外验证或策略控制，先把签名和验签流程跑顺，再考虑更强的 policy gate。
5. 结果必须回写到 `/team-release`、制品说明或外部交付文档中，不让签名结果只停在 workflow 日志里。

## 最小门禁模型

- `subject layer`：要发布的 artifact、image 或 release asset
- `sign layer`：签名动作、签名身份和生成结果
- `verify layer`：验签方式、验证责任和失败处理
- `decision layer`：`devops-engineer`、`tech-lead` 决定“缺失签名或验签失败”是否阻塞发布

重点不是“跑过一个签名命令”，而是消费方能稳定验证并信任它。

## 重点检查项

- 签名对象是否与实际发布出去的 artifact、镜像 digest 或 release asset 一一对应
- 团队是否定义了签名身份、签名时机和验签入口
- 重新构建、补发或回滚时，签名是否同步更新
- 发布记录里是否能定位到签名结果与验签方式
- 签名失败、验签失败或签名缺失时，发布链是否有明确处置策略

## 反模式

- 生成了签名，但没人知道消费方怎么验证。
- 有 attestation 没签名，或有签名没 provenance，导致证明链断层。
- 只在 CI 里签名一次，却不把签名结果回写到发布记录。
- 还没跑通签名与验签流程，就直接把“签名失败”设成硬阻塞，导致团队无法消化。

## 输出回落

- 构建阶段：记录哪些制品完成签名、签名结果在哪里、验签入口是什么。
- 发布阶段：把签名与验签摘要写入 `/team-release` 的发布方案、检查结果或放行结论。
- 外部交付：若需要对外提供验证说明，必须能从 release 记录直接定位签名结果和验签方式。

## 许可证与使用边界

- `sigstore/cosign-installer` 本身采用 Apache-2.0。
- 启用前应确认签名身份方案、runner 环境、镜像 registry / artifact 仓库能力，以及是否需要额外的组织级策略支持。

## 参考来源

- [sigstore/cosign-installer](https://github.com/sigstore/cosign-installer)
- [artifact-attestation-gates.md](artifact-attestation-gates.md)
- [sbom-generation-gates.md](sbom-generation-gates.md)
