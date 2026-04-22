# GitHub Token 权限基线手册

本手册承接 `GitHubSecurityLab/actions-permissions` 的工程实践，用于把 GitHub Actions 中 `GITHUB_TOKEN` 的真实使用情况转成最小权限建议，并把这些建议回落到 PR 评审、workflow 调整和治理记录里。它补的是“这个 workflow 运行时到底用了哪些 token 权限、哪些权限可以收窄”这一层，不替代 `scorecard-supply-chain-gates`、`zizmor-workflow-audits`、`runner-egress-hardening`、`actionlint` 或人工 review。

## 用途 / 定位

- 这个 runbook 面向 GitHub Actions 的 token 权限收敛，核心对象是 `GITHUB_TOKEN`、workflow/job 级 `permissions` 配置和默认工作流权限。
- 它基于真实 workflow run 的活动来给出最小权限建议，适合用来验证“理论上可能需要”和“实际运行中确实需要”之间的差异。
- 它不是仓库级供应链总审计，也不是 workflow 语法审计，更不是 runner 网络出口控制。

## 适用场景

- 仓库已经大量使用 GitHub Actions，但 `permissions` 仍然依赖默认值，或者长期保持过宽的 `write` 权限。
- 团队想把“最小权限”从经验判断升级成可观察、可回放、可 triage 的证据链。
- 某些 workflow 只有在部分分支、条件分支、skip 条件或少数 job 下才会触发，单次检查很难完整覆盖权限需求。
- 团队希望在收紧 `GITHUB_TOKEN` 前先做一轮观察，避免直接改配置导致 workflow 失效。

## 不适用场景

- 仓库没有使用 GitHub Actions，或者 token 权限主要由外部系统控制，与当前仓库的 workflow 无关。
- 你要查的是 YAML 结构、表达式注入、危险 `uses:`、secret 泄露或 shell 误用，而不是 token 权限本身。
- 你要管的是 runner 的出站网络、DNS、镜像仓库访问或外部 API 连接，而不是 GitHub token scope。
- 团队已经有稳定、明确且经过验证的 `permissions` 基线，只需要做一次性文档归档。

## 推荐落地方式

1. 先把 `actions-permissions` 当成“观察和建议层”，不要一开始就把它当硬阻塞门禁。
2. 对关键 workflow 的每个 job 先观察真实运行，再汇总最小权限建议；官方仓库说明里明确提到，`Monitor` 会根据实际检测到的 workflow 活动给出建议，而 `Advisor` 可以汇总多次运行结果。
3. 优先覆盖构建、发布、制品上传、PR 处理、标签/分支管理和其他会直接碰仓库状态的 job。
4. 收敛顺序建议是：
   - 先明确 workflow 或 job 的默认权限来源
   - 再补上显式 `permissions`
   - 再按 job 细化到只保留实际需要的 scope
   - 最后移除临时观察用的 `Monitor`
5. 将结果与现有链路分层：
   - `scorecard-supply-chain-gates` 负责仓库级供应链基线、token 默认策略、action pinning 和治理面
   - `zizmor-workflow-audits` 负责 workflow 安全审计细节，例如危险表达式、`uses:` 风险和可疑结构
   - `runner-egress-hardening` 负责 runner 运行时出站访问控制与监测
   - 本手册负责把“实际用了什么权限”转成可执行的最小权限建议
6. 若建议权限与现有 workflow 行为冲突，先做人工 triage，不要直接把所有建议都自动升级为阻塞项。

## 最小门禁模型

- `observation layer`：在 job 运行中记录 `GITHUB_TOKEN` 实际触发到的仓库操作。
- `recommendation layer`：把单次或多次运行的观察结果聚合为最小权限建议。
- `permission layer`：将建议固化到 workflow/job 级 `permissions`，并与默认权限策略对齐。
- `decision layer`：`code-review`、`team-review`、`tech-lead` 和必要的安全角色决定是否接受、例外放行或继续收敛。

重点不是“工具说应该给多少”，而是“当前 workflow 证据链是否足以支撑这个最小权限配置”。

## 重点检查项

- 默认工作流权限是否过宽，是否应该从 `write` 收敛到 `read` 或更细粒度的 job 级配置。
- workflow 或 action 是否在未显式传参的情况下仍会通过 `github.token` 访问 `GITHUB_TOKEN`。
- 是否存在只在少数分支、条件分支、skip 分支或部分 job 中才出现的权限需求，导致单次观察不完整。
- 是否把 `issues: write`、`pull-requests: write`、`contents: write`、`packages: write` 等权限保留成了习惯性默认值。
- 是否需要 GitHub Actions 提交 approving PR review；官方 REST 能力本身就把这项能力单独暴露出来，说明它应当被视为单独的治理项，而不是顺手打开。
- 观察结论是否和最终 workflow 配置一致，避免“工具建议已经收敛，但 YAML 里仍然是宽权限”。

## 反模式

- 只跑一次 Monitor 就立刻定版，忽略了条件分支、跳过 job 和不同触发路径。
- 把 Advisor 的汇总结果当成绝对真理，不做人工 triage。
- 看到某个 job 需要高权限，就把整个 workflow 统一放大到同等权限。
- 只改仓库默认权限，不补 job 级 `permissions`，最后让默认值继续漂移。
- 把这个工具拿去替代 `scorecard`、`zizmor` 或 `runner-egress-hardening`，结果把不同层的问题混在一起处理。
- 只把建议留在 action 产物里，没有回写到 review、治理记录或 workflow 文件。

## 输出回落

- PR 阶段：把 Monitor/Advisor 的结论、最终 permissions 变更和仍需例外说明的 scope 写入 review 摘要。
- 评审阶段：在 `/team-review` 中明确当前 workflow 的最小权限基线、临时放宽原因和后续收敛计划。
- 发布阶段：若某个发布 job 仍需要较高权限，必须说明它对应的仓库操作范围和回退边界。
- 治理阶段：把长期存在的权限例外、默认值调整和 workflow 重构计划沉淀到 ADR 或 runbook。

## 许可证与使用边界

- `GitHubSecurityLab/actions-permissions` 在官方仓库中标注为 MIT license，且当前仓库主页明确把它定位为 `Monitor` 和 `Advisor` 两个 GitHub token permissions action。
- 官方仓库同时标注为 `PUBLIC BETA`，因此接入前要接受它可能带来的误报、覆盖缺口和维护成本。
- GitHub 官方文档说明，`GITHUB_TOKEN` 具有仓库范围限制，workflow 可以通过 `permissions` 精确控制 `read`、`write` 或 `none`，而且默认工作流权限与是否允许 Actions 提交 approving PR review 都是可单独治理的设置。
- 使用前要确认你对目标仓库拥有足够的 GitHub Actions 配置权限，因为相关 REST API 本身就区分组织级和仓库级管理权限。

## 参考来源

- [GitHubSecurityLab/actions-permissions](https://github.com/GitHubSecurityLab/actions-permissions)
- [GitHub Docs: GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token)
- [GitHub Docs: Use GITHUB_TOKEN in workflows](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/controlling-permissions-for-github_token)
- [GitHub Docs: Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [GitHub Docs: REST API endpoints for GitHub Actions permissions](https://docs.github.com/en/rest/actions/permissions)
- [scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)
- [zizmor-workflow-audits.md](zizmor-workflow-audits.md)
- [runner-egress-hardening.md](runner-egress-hardening.md)
