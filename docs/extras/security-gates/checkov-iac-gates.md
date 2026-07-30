# Checkov IaC 门禁手册

本手册承接 `bridgecrewio/checkov` 的工程实践，用于把基础设施即代码的误配置检查前置到 PR、评审和发布准备阶段。它补的是“IaC 配置是否违反已知安全与合规检查”这一层，不替代运行时漏洞扫描、依赖变更审查或团队自定义策略评审。

## 用途 / 定位

Checkov 的核心价值，是在构建期对 IaC、云配置和相关模板做静态检查，尽早发现不安全默认值、暴露面、权限过宽和结构性误配置。官方资料显示，它支持 Terraform、Terraform Plan、Terraform JSON、CloudFormation、Kubernetes、Helm、Kustomize、Dockerfile、Serverless、Ansible、Bicep、ARM、OpenTofu，以及部分 CI/CD 工作流文件；同时支持属性型和图关系型自定义策略，也能输出 CLI、JSON、JUnit XML、SARIF 和 Markdown 结果。

在本仓库里，建议把它视为“IaC 安全基线门禁”，而不是万能安全扫描器。

## 适用场景

- 变更涉及 Terraform、Kubernetes、Helm、CloudFormation、ARM、Bicep、OpenTofu 或其他结构化基础设施配置。
- 团队希望在 PR 级别提前发现云资源的高风险属性，例如公开暴露、弱默认值、过宽权限、未加密配置或危险网络入口。
- 团队希望将一部分已知的 IaC 安全检查固定为可重复执行的门禁，而不是完全依赖人工 review。
- 需要把检查结果以 SARIF、JUnit XML 或 Markdown 的形式回落到 CI、代码扫描或评审流程。
- 团队需要复用 Checkov 的内置检查，或者基于其属性 / 图策略能力做局部扩展。

## 不适用场景

- 主要问题是容器镜像漏洞、文件系统漏洞或仓库 secret 泄漏，这类场景应优先看 `trivy-security-gates`。
- 主要问题是依赖新增、依赖漏洞、许可证变化或 lockfile 差异，这类场景应优先看 `dependency-review-gates`。
- 主要诉求是把团队自己的结构化配置规则写成 Rego policy 并做统一预检，这类场景应优先看 `conftest-policy-gates`。
- 变更只是应用业务逻辑，而不是 IaC 或模板配置。
- 团队没有准备好维护规则基线、误报处理和例外流程，却希望一步到位把所有检查都设成强阻塞。

## 推荐落地方式

1. 先限定扫描面，不要一上来把所有支持的 framework 全部打开。
   - PR 阶段优先扫当前仓库真实使用的 IaC 类型
   - 只对高信号检查先设门禁
2. 先把“发现”和“阻塞”分开。
   - 先输出结果、建立基线、确认误报
   - 再逐步把高风险检查升级为 fail gate
3. 优先使用 Checkov 的内置检查覆盖通用云配置风险，再决定是否补充自定义属性策略或 graph 策略。
4. 如果团队已经有自己的策略语言和例外治理模型，把 Checkov 放在“预检”层，不要让它承载所有组织规则。
5. 输出格式按用途选型：
   - 人工 review 优先 CLI 或 Markdown
   - CI 归档和自动化处理优先 JSON
   - GitHub code scanning 优先 SARIF
   - 需要测试系统消费时可用 JUnit XML
6. 结果必须回写到 `/team-review` 或 `/team-release`，不要只停在流水线日志里。

## 与其他门禁的边界

- `trivy-security-gates` 负责镜像、文件系统、secret 和 IaC 相关的漏洞或 misconfiguration 扫描结果，偏“制品与运行前资产安全”。
- `conftest-policy-gates` 负责用 Rego 表达团队自己的配置策略，偏“组织规则与 policy-as-code 预检”。
- `dependency-review-gates` 负责依赖清单、lockfile、许可证变化和已知依赖风险，偏“依赖变更审查”。
- `checkov-iac-gates` 负责 IaC / 模板层的安全与合规检查，偏“云配置基线与结构性误配置”。

简单说，Checkov 不是依赖审查器，也不是镜像漏洞扫描器；如果团队要表达的是“这类配置应该怎么写”，优先考虑 Conftest。如果团队要回答的是“这次依赖改动带来了什么”，优先考虑 Dependency Review。如果团队要回答的是“镜像、文件系统或 secret 有没有问题”，优先考虑 Trivy。

## 最小门禁模型

- `target layer`：Terraform、Kubernetes、Helm、CloudFormation、ARM、Bicep、OpenTofu 或其他 IaC 输入
- `scan layer`：Checkov 内置检查、属性策略、图策略和输出格式化
- `triage layer`：误报确认、例外说明、存量问题与本次变更区分
- `decision layer`：`qa-engineer`、`devops-engineer`、`tech-lead` 决定是否阻塞合并或发布

先把“扫描出什么”与“这次是否要拦”拆开，团队更容易持续使用。

## 重点检查项

- 是否存在公开暴露、过宽入站规则或默认不安全的网络入口
- 是否存在过度授权的 IAM、角色、服务账户或访问策略
- 是否存在未加密、弱默认值或资源级保护缺失
- 是否存在高风险的容器、工作负载或模板配置，例如特权运行、危险挂载或不安全的安全上下文
- 是否存在基础设施之间的危险关系，例如不应直接连通的资源路径
- 是否把高风险 IaC 改动写成“看起来只是格式调整”的提交，导致 review 失焦

## 反模式

- 把 Checkov 当成通用漏洞扫描器，顺手替代 Trivy、Dependency Review 或人工 review。
- 一开始就全量启用所有框架和所有规则，结果误报过多，团队很快弃用。
- 只有失败结果，没有基线、例外和责任人，最后没人知道该改哪条配置。
- 把自定义规则全堆进一个工具里，既不区分组织策略，也不区分 IaC 基线与发布门禁。
- 只看扫描通过与否，不看输出类型是否方便回落到 PR、review 或 release 记录。

## 输出回落

- PR 阶段：把新增高风险检查、误报判断和建议修复写入 review 摘要。
- 评审阶段：在 `/team-review` 中说明哪些问题来自 Checkov，哪些已经人工接受或需要阻塞。
- 发布阶段：若关键 IaC 风险未关闭，必须回写到 `/team-release` 的风险、放行结论或后续观察项。
- 自动化阶段：如果要给 GitHub code scanning、测试报告或机器消费使用，优先分别输出 SARIF、JUnit XML 或 JSON，避免把所有信息挤进单一日志。

## 许可证与使用边界

- `bridgecrewio/checkov` 仓库与官方容器包标注为 Apache-2.0。
- 如果要接入 Prisma Cloud 或其他平台能力，应另外确认账号、API、数据流和合规边界。
- 本手册只建议把 Checkov 用作 IaC 预检与门禁参考，不建议把它扩展成团队唯一的安全真相来源。

## 参考来源

- [bridgecrewio/checkov](https://github.com/bridgecrewio/checkov)
- [Checkov 官方站点](https://www.checkov.io/)
- [Reviewing Scan Results](https://www.checkov.io/2.Basics/Reviewing%20Scan%20Results.html)
- [Hard and soft fail](https://www.checkov.io/2.Basics/Hard%20and%20soft%20fail.html)
- [Suppressing and Skipping Policies](https://www.checkov.io/2.Basics/Suppressing%20and%20Skipping%20Policies.html)
- [SARIF 输出](https://www.checkov.io/8.Outputs/SARIF.html)
- [JUnit XML 输出](https://www.checkov.io/8.Outputs/JUnit%20XML.html)
- [Checkov GitHub Action](https://github.com/bridgecrewio/checkov-action)
- [trivy-security-gates.md](trivy-security-gates.md)
- [conftest-policy-gates.md](conftest-policy-gates.md)
- [dependency-review-gates.md](dependency-review-gates.md)
