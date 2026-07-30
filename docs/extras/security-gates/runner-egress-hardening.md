# Runner Egress Hardening 手册

本手册承接 `step-security/harden-runner` 的工程实践，用于把 GitHub Actions runner 的出站网络控制、实时监测和告警纳入供应链治理链。它补的是“runner 在执行 workflow 时能访问什么、实际访问了什么、异常访问如何被发现”这一层，不替代 `scorecard-supply-chain-gates`、`artifact-attestation-gates`、`slsa-verification-gates`、`trivy-security-gates` 或人工发布判断。

## 适用场景

- 仓库大量依赖 GitHub Actions 执行构建、测试、打包或发布。
- 团队希望限制 runner 的出站访问面，减少被恶意 workflow、依赖投毒或意外脚本带出凭据的风险。
- 需要把 runner 的 runtime egress 行为纳入审计，并在异常访问、未知域名或可疑连接出现时及时发现。
- 仓库已经有仓库级供应链基线检查，但还缺“runner 运行时层”的硬化与监测。

## 不适用场景

- 仓库没有 GitHub Actions，或 runner 不在团队控制范围内。
- 团队还没有整理清楚 workflow 需要访问的外部域名、包仓库、镜像仓库和发布端点。
- 期望 runner egress hardening 替代 Scorecard、依赖门禁、代码扫描或制品证明链。
- 团队没有人负责维护 allowlist、例外流程和告警 triage。

## 推荐落地方式

1. 先把 runner egress hardening 看成“执行时防线”，不要一开始就把它设成全集仓库硬门禁。
2. 第一阶段先收窄到少量关键 workflow：
   - 构建与发布 workflow
   - 访问私有包仓库或制品仓库的 workflow
   - 处理敏感凭据、签名或 provenance 的 workflow
3. 先建立 egress 基线：
   - runner 必须访问哪些固定域名
   - 哪些第三方服务必须显式放行
   - 哪些连接应当被默认拒绝
4. 将 runner egress hardening 与现有链路分层：
   - `scorecard-supply-chain-gates` 负责仓库、workflow、token 权限和 action pinning 的静态基线
   - `dependency-review-gates` 负责依赖漏洞与许可证变化
   - `codeql-pr-security-gates` 负责代码级语义问题
   - `runner-egress-hardening` 负责 workflow 运行时的出站访问控制与监测
5. 先从“观察模式”或“少量 workflow 强化”开始，再逐步收紧 allowlist。
6. 结果必须回写到 `/team-review`、`/team-release` 或仓库治理记录，不让 runner 告警只停在 action 日志里。

## 最小门禁模型

- `workflow layer`：被硬化的 GitHub Actions workflow 与 job
- `egress layer`：允许或拒绝的出站域名、IP、协议和端点
- `monitoring layer`：runner 运行时捕获到的访问事件、命中规则和告警
- `decision layer`：安全评审角色、`devops-engineer`、`tech-lead` 决定异常 egress 是否阻塞发布或需要治理

重点不是“装了一个 runner wrapper”，而是 runner 的实际访问行为能够被解释、审计和回放。

## 重点检查项

- workflow 是否明确列出必须访问的外部服务，而不是默认放开全网
- allowlist 是否覆盖包仓库、镜像仓库、签名/证明服务和必要的 API 端点
- 是否能区分“预期访问”和“异常访问”，避免大量误报淹没告警
- secret、token 或构建凭据是否会在 runner 运行时被意外外带
- 当新 workflow 或新依赖加入时，allowlist 是否同步更新，而不是长期漂移

## 反模式

- 只把 hardening 当成一个装饰性 action，实际上没有真正限制 egress。
- allowlist 写得过宽，最后等于没有硬化。
- 发现异常连接后只看一次性告警，没有 triage、回退和例外处理。
- 把 runner egress hardening 当成 Scorecard 的替代品，而忽略它只是运行时防线。
- 只在生产发布 workflow 上启用，开发和测试 workflow 完全不管，导致基线不一致。

## 输出回落

- PR 阶段：把新增的外部访问面、allowlist 变化和异常 egress 结论写入 review 摘要。
- 团队协作：在 `/team-review` 中说明哪些访问是预期的，哪些是需要治理或阻塞的异常。
- 发布阶段：若 runner egress 出现高风险异常或 allowlist 未收敛，必须回写到 `/team-release` 的风险、放行结论或后续观察项。
- 治理阶段：把长期保留的例外、第三方端点和网络依赖沉淀到 runbook 或治理待办中。

## 许可证与使用边界

- `step-security/harden-runner` 采用 Apache-2.0。
- 启用前应确认 GitHub Actions 使用方式、runner 类型、网络出口控制能力和告警 triage 人力。
- 若团队尚未有 `scorecard-supply-chain-gates`、`dependency-review-gates` 等基础门禁，runner egress hardening 应先作为补充防线，而不是唯一安全控制。

## 参考来源

- [step-security/harden-runner](https://github.com/step-security/harden-runner)
- [scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)
- [dependency-review-gates.md](dependency-review-gates.md)
- [codeql-pr-security-gates.md](codeql-pr-security-gates.md)
