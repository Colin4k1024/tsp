# Conftest Policy 门禁手册

本手册承接 `open-policy-agent/conftest` 的工程实践，用于把 policy-as-code 预检接入 PR、评审和发布准备。它补的是“在合并或发布前，先用 Rego 策略检查 structured config 是否满足团队规则”这一层，不替代 `trivy-security-gates`、`policy-controller-gates`、`dependency-review-gates` 或人工评审。

## 适用场景

- 变更涉及 Kubernetes YAML、Helm values、Terraform、JSON、YAML、Docker Compose 或其他结构化配置。
- 团队希望把“配置是否符合团队规则”从人工 review 中抽出来，变成可重复执行的 policy check。
- 需要在 PR 或发布前提前拦住高风险配置，例如不安全的资源限制、镜像来源、权限、暴露端口或命名规范问题。
- 团队希望把配置规则集中成 Rego policy，而不是把同类检查散落在多个脚本、lint 工具或 review checklist 里。

## 不适用场景

- 只想扫描漏洞、secret 或镜像内容，却没有明确的配置策略要表达。
- 团队还没有准备好维护 Rego policy、测试样例和例外流程。
- 期望 Conftest 替代 `trivy-security-gates` 对镜像、文件系统和 IaC 漏洞 / misconfiguration 的检查。
- 期望 Conftest 替代 `policy-controller-gates` 在 Kubernetes admission 层的强制执行。
- 变更只是代码逻辑，而不是结构化配置或策略输入。

## 推荐落地方式

1. 先从单一配置域开始，不要一上来就把所有文件类型和所有规则都放进同一套 policy。
2. 第一阶段优先覆盖高价值、低歧义的规则：
   - Kubernetes 资源的安全默认值
   - Helm / values 的环境约束
   - Terraform 的命名、标签、权限或暴露面规则
   - JSON / YAML 配置里的结构性约束
3. 将 Conftest 与现有链路分层：
   - `kubeconform-schema-gates` 负责 Kubernetes manifest 的 schema 级结构校验
   - `checkov-iac-gates` 负责 IaC 安全与合规基线、内置规则和图关系检查
   - `trivy-security-gates` 负责漏洞、secret 和 IaC 扫描结果
   - `conftest-policy-gates` 负责配置结构、团队规则和 policy-as-code 预检
   - `kyverno-policy-gates` 负责 Kubernetes 集群内的 admission、background scan 和 policy report 执行
   - `policy-controller-gates` 负责在集群 admission 层把确认过的策略强制执行
4. 先在 PR 级或 pre-merge 阶段跑 policy check，再决定是否把某些规则升级成发布门禁。
5. 结果必须回写到 `/team-review`、`/team-release` 或对应配置仓库，不要只停在命令输出里。

## 最小门禁模型

- `target layer`：Kubernetes、Terraform、Helm、YAML、JSON 或其他结构化配置
- `policy layer`：Rego policy、规则集和例外条件
- `evaluation layer`：Conftest 对输入配置执行 policy 计算
- `decision layer`：`qa-engineer`、`devops-engineer`、`tech-lead` 决定是否阻塞合并或发布

重点不是“跑过一个 policy checker”，而是团队是否能稳定回答“这条配置违反了哪条规则、为什么、是否允许例外”。

## 重点检查项

- 是否覆盖了团队真正关心的配置类型，而不是只做样例级别的演示
- Rego 规则是否足够明确，避免把模糊判断写成难以维护的 policy
- policy 是否和 Kubernetes / Terraform / Helm 的实际使用方式对齐
- 是否把规则和例外分开管理，避免 policy 越堆越多后无人维护
- 是否存在大量误报或重复规则，导致团队把 Conftest 当成噪音源
- 对于高风险配置，失败结果是否能回写到 review 或 release 结论，而不是只留在本地输出

## 反模式

- 只把 Conftest 当成“还能跑的另一个 lint 工具”，没有明确 policy owner。
- 规则写得过于宽泛，最后任何配置都能解释成通过。
- policy 只在 CI 里执行，团队却没有样例、基线和 triage 责任。
- 把它当成漏洞扫描器，忽略它本质上是配置策略测试工具。
- 既有 `trivy-security-gates` 又有 `policy-controller-gates`，却没有说明 Conftest 在 PR 级和发布前的定位。

## 输出回落

- PR 阶段：把 policy 命中、例外判断和修改建议写入 review 摘要。
- 评审阶段：在 `/team-review` 中说明哪些配置问题来自 Conftest，哪些已经人工确认或需要阻塞。
- 发布阶段：若配置违反关键策略，必须回写到 `/team-release` 的风险、放行结论或后续观察项。
- 治理阶段：把长期稳定的 policy、基线和例外沉淀到配置仓库或治理文档中。

## 许可证与使用边界

- `open-policy-agent/conftest` 采用 Apache-2.0。
- 引入前应确认团队是否具备维护 Rego policy、样例输入和例外流程的能力。
- 若团队已经需要在集群内强制执行策略，应把 `conftest-policy-gates` 视为 PR / 发布前预检，而不是 admission 层的最终门禁。

## 参考来源

- [open-policy-agent/conftest](https://github.com/open-policy-agent/conftest)
- [kubeconform-schema-gates.md](kubeconform-schema-gates.md)
- [checkov-iac-gates.md](checkov-iac-gates.md)
- [trivy-security-gates.md](trivy-security-gates.md)
- [kyverno-policy-gates.md](kyverno-policy-gates.md)
- [policy-controller-gates.md](policy-controller-gates.md)
