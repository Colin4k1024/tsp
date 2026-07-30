# SLSA Generator 模式手册

本手册承接 `slsa-framework/slsa-github-generator` 的工程实践，用于把 GitHub Actions 侧的 provenance 生成模式纳入供应链治理链。它补的是“如何把构建来源、工作流和产物绑定成可追溯证据”这一层，不替代 `artifact-attestation-gates`、`slsa-verification-gates`、`cosign-signing-gates` 或人工放行判断。

## 适用场景

- 仓库的正式构建和发布已经主要运行在 GitHub Actions 上。
- 团队希望为 release artifact、镜像或构建产物生成 provenance / attestation，并让后续验证有稳定输入。
- 需要把 workflow、runner、commit、subject digest 和发布产物串成一条可审计的证据链。
- 希望先补“生成模式”和“证据结构”，再决定是否上更强的验证或策略强制。

## 不适用场景

- 当前还没有稳定的 GitHub Actions 构建链，却为了形式完整性强行引入 provenance 生成。
- 团队还没定好产物命名、归档位置或 release 记录结构。
- 期望这个手册替代 SBOM、签名、验证或集群侧强制策略。
- 仓库主要不在 GitHub Actions 上构建，或者生成链条无法稳定拿到 subject 和 workflow 信息。

## 推荐落地方式

1. 先把 provenance 生成限定在少数正式制品，不要一开始覆盖所有 job。
2. 第一阶段先固定三件事：
   - 哪些产物需要生成 provenance
   - provenance 依赖哪些 workflow 元数据
   - 生成结果存放在哪里、谁来回链
3. 将生成模式与现有链路分层：
   - `sbom-generation-gates` 负责成分清单
   - `artifact-attestation-gates` 负责构建来源证明
   - `slsa-generator-patterns` 负责 GitHub Actions 侧的生成模式与 workflow 约束
   - `slsa-verification-gates` 负责独立验证 provenance / attestation
4. 先从“单 workflow、单产物、单发布路径”开始，再逐步扩展到多 job 或多制品。
5. 结果必须回写到 `/team-release`、发布记录或制品元数据中，不让 provenance 只停在 Actions 运行日志里。

## 最小门禁模型

- `source layer`：源码仓库、commit、tag 或 release 触发点
- `workflow layer`：GitHub Actions workflow、job、runner、permissions
- `provenance layer`：subject、digest、构建输入和生成结果
- `decision layer`：`devops-engineer`、`tech-lead` 判断生成结果是否满足发布要求

重点不是“装了一个 action”，而是生成出来的证据能稳定对应到实际发布产物。

## 重点检查项

- workflow 是否明确生成对象，而不是把 provenance 当成附带副作用
- subject、digest 和 release artifact 是否一一对应
- workflow permissions、runner 选择和产物上传路径是否稳定可审计
- 生成结果是否有固定命名、归档位置和 release 回链方式
- 后续验证链是否能直接消费当前生成格式，而不是再做一次临时转换

## 反模式

- 只在某个 job 里“顺手生成” provenance，却没定义它对应哪个正式产物。
- workflow 里没有固定 subject 或 digest，导致每次生成出来的证据都不稳定。
- 生成结果只保存在 Actions summary，没有进入发布记录或审计链。
- 还没跑通归档和验证链，就先把 provenance 生成当成最终门禁。

## 输出回落

- 构建阶段：记录哪些正式制品生成了 provenance、workflow 信息和 subject 绑定关系。
- 发布阶段：把 provenance 文件、URL 或摘要写入 `/team-release` 的检查结果、发布方案或放行结论。
- 审计阶段：若需要追溯某次发布，必须能从 release 记录定位到 provenance，并反查到对应 workflow 和 commit。

## 许可证与使用边界

- `slsa-framework/slsa-github-generator` 采用 Apache-2.0。
- 启用前应确认仓库主要构建平台、GitHub Actions 权限、产物发布位置和团队是否能维护 provenance 归档。

## 参考来源

- [slsa-framework/slsa-github-generator](https://github.com/slsa-framework/slsa-github-generator)
- [artifact-attestation-gates.md](artifact-attestation-gates.md)
- [slsa-verification-gates.md](slsa-verification-gates.md)
