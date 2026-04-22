# Trivy 安全门禁手册

本手册承接 `aquasecurity/trivy-action` 的工程实践，用于把容器镜像、仓库文件系统和 IaC 配置扫描接入 PR、评审与发布流程。它补的是“制品与基础设施面”的安全证据，不替代依赖门禁、代码级语义扫描或人工安全判断。

## 适用场景

- 变更涉及 `Dockerfile`、容器镜像构建、基础镜像升级或运行时包层变化。
- 仓库包含 Helm、Kubernetes YAML、Terraform、Docker Compose 或其他 IaC 配置。
- 团队希望在 PR 或发布前提前发现镜像漏洞、错误配置、明文 secret 或高风险暴露面。

## 不适用场景

- 仓库既没有镜像产物，也没有基础设施配置，却为了“看起来更安全”强行加扫描。
- 团队还没定义哪些漏洞级别、misconfiguration 类型或 secret 命中会阻塞。
- 期望只靠 Trivy 结果替代人工发布评审、依赖 review 或代码级安全 review。

## 推荐落地方式

1. 先明确扫描目标，不要一上来全开：
   - PR 阶段优先扫文件系统和 IaC
   - 发布前优先扫容器镜像
2. 第一阶段只把高信号问题拉进门禁：
   - `HIGH` / `CRITICAL` 漏洞
   - 高风险 misconfiguration
   - 明显的 secret 泄漏
3. 将 Trivy 与现有安全链分层：
   - `dependency-review-gates` 负责依赖漏洞和许可证变化
   - `codeql-pr-security-gates` 负责代码级语义问题
   - `checkov-iac-gates` 负责 IaC 安全与合规基线、内置规则和图关系检查
   - `kubeconform-schema-gates` 负责 Kubernetes manifest 的 schema 级结构校验
   - Trivy 负责镜像、文件系统和 IaC 层风险
   - `conftest-policy-gates` 负责结构化配置的 policy-as-code 预检与团队规则约束
   - 安全评审角色、`devops-engineer`、`tech-lead` 负责最终阻塞与放行判断
4. 对镜像扫描要区分“基础镜像遗留问题”和“本次变更新增风险”，避免每次发布都被老问题淹没。
5. 结果必须回写到 `/team-review` 或 `/team-release`，不要只停在 action 日志或安全面板里。

## 最小门禁模型

- `target layer`：文件系统、IaC 或容器镜像
- `scan layer`：漏洞、misconfiguration 和 secret 检查
- `triage layer`：确认哪些是当前变更新增、哪些是存量问题或误报
- `decision layer`：安全评审角色、`devops-engineer`、`tech-lead` 决定是否阻塞

先把“扫描到了什么”和“这次是否该拦”分开，团队更容易持续使用。

## 重点检查项

- 容器镜像中的高危 / 严重漏洞，以及基础镜像是否长期滞后
- `Dockerfile`、Helm、Kubernetes、Terraform 等配置里的高风险暴露面
- 仓库或镜像层里误提交的 token、密钥和凭证
- 运行时包是否意外带入不必要的系统组件或调试工具
- 基础设施配置是否把高权限、公开暴露或弱默认配置带进生产链

## 反模式

- 还没定义阻塞策略，就把所有 Trivy 命中直接当失败。
- 文件系统、镜像、IaC 一次全扫，但没人区分哪类结果该由谁处理。
- 只记录“有多少漏洞”，不区分存量问题和本次变更新增问题。
- 发布链已经依赖镜像或 IaC，却只做代码 review，不看制品和部署层风险。

## 输出回落

- PR 阶段：把新增高风险漏洞、误报判断和 misconfiguration 结论写入 review 摘要。
- 团队协作：在 `/team-review` 中明确哪些风险来自 Trivy、哪些已被人工接受或降级处理。
- 发布阶段：若镜像或 IaC 仍存在未关闭的高风险问题，必须回写到 `/team-release` 的风险、放行结论或后续观察项。

## 许可证与使用边界

- `aquasecurity/trivy-action` 本身是 MIT。
- 若团队要进一步自建镜像仓库扫描、数据库镜像缓存或离线更新链路，应单独确认制品来源、网络策略和合规要求。

## 参考来源

- [aquasecurity/trivy-action](https://github.com/aquasecurity/trivy-action)
- [dependency-review-gates.md](dependency-review-gates.md)
- [codeql-pr-security-gates.md](codeql-pr-security-gates.md)
- [checkov-iac-gates.md](checkov-iac-gates.md)
- [kubeconform-schema-gates.md](kubeconform-schema-gates.md)
- [conftest-policy-gates.md](conftest-policy-gates.md)
