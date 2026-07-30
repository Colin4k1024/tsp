# Zizmor Workflow 审计手册

本手册承接 `zizmor` 的工程实践，用于把 GitHub Actions workflow 的安全审计接入 PR、默认分支与治理流程。它补的是“workflow 里是否存在明显的安全审计问题、以及这些问题如何落回 review 与发布链”这一层，不替代 `actionlint`、`scorecard-supply-chain-gates`、`runner-egress-hardening`、`secret-scanning-gates` 或人工安全 review。

## 适用场景

- 变更涉及 `.github/workflows/`、reusable workflow、workflow call、composite action 或 job 级脚本。
- 团队希望尽早发现 unpinned `uses:`、危险表达式、`env` 写入、secret 暴露、过宽权限和可疑 workflow 结构。
- 仓库已经有 workflow 语法 lint，但还缺“安全视角”的审计。
- 需要把 GitHub Actions 的潜在攻击面前置到 PR 或默认分支审查，而不是等到发布阶段才发现。

## 不适用场景

- 仓库没有 GitHub Actions，或者 workflow 主要是第三方托管、与当前仓库治理边界无关。
- 团队还没有建立基本的 workflow review、token 权限收敛和 secret 管理，却期待单靠审计工具解决问题。
- 期望 `zizmor` 替代 `actionlint` 做 YAML / 语法 / shell 检查。
- 期望 `zizmor` 替代 `scorecard` 做仓库级供应链基线审计。

## 推荐落地方式

1. 先把 `zizmor` 看成 workflow 安全审计层，不要一开始就把它当成全集仓库门禁。
2. 第一阶段优先审计高风险 workflow：
   - 构建与发布 workflow
   - 访问密钥、签名、attestation 或制品仓库的 workflow
   - 使用第三方 action、reusable workflow 或复杂表达式的 workflow
3. 审计范围先收窄到 `.github/workflows/` 与关键 workflow 片段，再逐步扩展到 reusable workflow、composite action 或远程引用。
4. 将 `zizmor` 与现有链路分层：
   - `actionlint` 负责 workflow 语法、结构和常见 shell 失误
   - `scorecard-supply-chain-gates` 负责仓库级供应链基线、权限和 action pinning 的宏观审计
   - `github-token-permissions-baseline` 负责基于真实 workflow run 收敛 `GITHUB_TOKEN` 最小权限
   - `zizmor-workflow-audits` 负责 GitHub Actions workflow 的安全审计细节
   - 安全评审角色 / `code-review` 负责判断这些审计结果是否真实、是否阻塞
5. 对高风险问题，先维持人工 triage 或草稿结论，不要把所有命中都自动变成阻塞项。
6. 结果必须回写到 `/code-review`、`/team-review` 或治理记录，不让审计结果只停在工具输出里。

## 最小门禁模型

- `workflow layer`：被审计的 workflow、job、step、reusable workflow
- `audit layer`：`zizmor` 发现的风险候选，例如 unpinned uses、危险表达式、权限异常、secret 暴露
- `triage layer`：人工确认哪些是实质风险、哪些是误报或可接受设计
- `decision layer`：安全评审角色、`tech-lead`、`devops-engineer` 决定是否阻塞或进入治理待办

重点不是“发现了多少条”，而是这些发现是否对应真实攻击面。

## 重点检查项

- `uses:` 是否固定到可审计的版本或 commit，而不是浮动引用
- 表达式是否把不可信输入直接拼到 shell、路径、命令或权限边界里
- `env`、`GITHUB_ENV`、`GITHUB_OUTPUT`、`secrets`、`vars` 是否被不当写入或外泄
- workflow 权限是否过宽，是否存在不必要的 `write` 能力
- 远程引用、reusable workflow、第三方 action 是否引入了意外的执行面
- 审计结果是否能和 PR、review 结论、发布记录互相对应

## 反模式

- 把 `zizmor` 当成 `actionlint` 的替代品，只看安全，不看语法和结构。
- 把 `zizmor` 当成 `scorecard` 的替代品，只看 workflow，而不看仓库级治理基线。
- 发现高风险命中后只修一处，不回头检查同类 workflow 是否也存在同样模式。
- 审计结果无人 triage，最后团队把命中当噪音源。
- 只在默认分支跑审计，PR 阶段完全不看，导致问题晚到发布时才暴露。

## 输出回落

- PR 阶段：把高风险命中、误报判断和 triage 结论写入 review 摘要。
- 评审阶段：在 `/team-review` 中明确哪些 workflow 风险已经确认，哪些仍需人工处理。
- 发布阶段：若 workflow 风险仍未收敛，必须回写到 `/team-release` 的风险、放行结论或后续观察项。
- 治理阶段：把长期存在的 workflow 风险、例外和整改计划沉淀到 runbook 或 ADR。

## 许可证与使用边界

- `zizmor` 采用 MIT License。
- 启用前应确认 GitHub Actions 使用方式、审计范围、误报 triage 责任人和 workflow 维护节奏。
- 如果团队当前还没有稳定的 workflow 语法 lint 与供应链基线审计，`zizmor` 应该先作为补充审计层，而不是唯一门禁。

## 参考来源

- [zizmorcore/zizmor](https://github.com/zizmorcore/zizmor)
- [zizmor-action](https://github.com/marketplace/actions/zizmor-action)
- [actionlint](https://github.com/marketplace/actions/actionlint)
- [scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)
- [github-token-permissions-baseline.md](github-token-permissions-baseline.md)
