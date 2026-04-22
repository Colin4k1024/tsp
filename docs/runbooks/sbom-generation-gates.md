# SBOM 生成与发布门禁手册

本手册承接 `anchore/sbom-action` 的工程实践，用于把构建产物、容器镜像和发布制品的 SBOM 生成、归档与发布追溯接入交付链。它补的是“我们到底交付了什么”的可追溯证据，不替代漏洞扫描、代码 review 或发布放行判断。

## 适用场景

- 仓库会构建二进制、容器镜像、压缩包或其他可发布产物。
- 团队希望把产物依赖清单从“构建时临时知道”变成可归档、可追溯、可对外或对内复查的交付物。
- 发布链已经开始关注镜像扫描、依赖门禁或供应链治理，希望再补齐 SBOM 这一层证据。

## 不适用场景

- 当前仓库没有稳定产物，只有纯脚本或一次性实验代码，却为了追热点强行接 SBOM。
- 团队还没有明确“SBOM 产出后放在哪里、谁消费、如何验证”的责任链。
- 期望只靠 SBOM 文件就回答漏洞、许可证或 provenance 的全部问题。

## 推荐落地方式

1. 先从最关键的发布产物开始，不要一开始把所有中间产物都做成 SBOM。
2. 第一阶段优先固定三件事：
   - 生成时机：构建后、发布前
   - 产物范围：二进制、容器镜像或压缩包
   - 存放位置：workflow artifact、release asset 或制品仓库
3. 将 SBOM 与现有链路分层：
   - `dependency-review-gates` 负责依赖变更与许可证风险
   - `trivy-security-gates` 负责漏洞、misconfiguration 和 secret 扫描
   - `scorecard-supply-chain-gates` 负责仓库级供应链基线
   - SBOM 负责交付产物的成分清单与后续追溯
4. 若团队后续要接 attestation、签名或 provenance，先把 SBOM 生成稳定下来，再扩展到证明链。
5. 结果必须回写到 `/team-release`、发布记录或制品说明中，不让 SBOM 只停在 CI artifact 目录里。

## 最小门禁模型

- `subject layer`：需要发布或归档的制品
- `inventory layer`：SBOM 内容、格式和生成时间点
- `publication layer`：SBOM 如何随产物一起归档、上传或发布
- `decision layer`：`devops-engineer`、`tech-lead` 决定是否把“缺失 SBOM”视为阻塞项

重点不是“生成过一次”，而是让交付物和 SBOM 始终能对应上。

## 重点检查项

- 是否为真正要交付的产物生成了 SBOM，而不是只对源码目录做一次泛扫
- SBOM 是否和产物版本、镜像 digest 或 release 记录正确关联
- 团队是否统一了格式和存储策略，例如 SPDX、CycloneDX、artifact 或 release asset
- 重新构建或重发版时，SBOM 是否会同步更新，而不是长期沿用旧文件
- SBOM 是否能被后续漏洞扫描、归档审计或第三方追溯流程消费

## 反模式

- 生成了 SBOM，但没人知道文件在哪、对应哪个版本或哪个镜像 digest。
- 只在源码层生成一次 SBOM，却不覆盖真正发布出去的产物。
- 把 SBOM 当漏洞扫描报告使用，忽略它本质上是“成分清单”。
- 发布链已经依赖镜像和二进制，却没有把 SBOM 和版本记录一起保存。

## 输出回落

- 构建阶段：在构建记录中注明哪些产物生成了 SBOM、生成格式和存放位置。
- 发布阶段：把 SBOM 链接、文件名或 artifact 位置写入 `/team-release` 的发布方案、检查结果或放行结论。
- 审计阶段：若团队需要事后追溯某个版本的成分清单，必须能从 release 记录直接定位到对应 SBOM。

## 许可证与使用边界

- `anchore/sbom-action` 采用 Apache-2.0。
- 如果后续要把 SBOM 发布到对外仓库、镜像 registry 或和 attestation 绑定，需要再单独核对产物可见性、格式规范与合规要求。

## 参考来源

- [anchore/sbom-action](https://github.com/anchore/sbom-action)
- [trivy-security-gates.md](trivy-security-gates.md)
- [scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)
