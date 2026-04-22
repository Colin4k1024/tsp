# Scorecard 供应链基线门禁手册

本手册承接 `ossf/scorecard-action` 的工程实践，用于把仓库级供应链基线检查接入安全 review、workflow 评审和发布治理。它补的是“仓库和交付链本身是否健康”的证据，不替代依赖、代码、镜像或 IaC 扫描。

## 适用场景

- 变更涉及 `.github/workflows/`、GitHub Actions 权限、release automation、签名流程或第三方 action 引入。
- 团队希望把分支保护、token 权限、action pinning、发布流程和基本供应链卫生前置成明确检查项。
- 仓库已经有依赖、代码或镜像扫描，但还缺“仓库级供应链基线”视角。

## 不适用场景

- 仓库没有 GitHub Actions、没有发布工作流，也不依赖 GitHub 原生仓库治理能力。
- 团队还没有能力处理基础治理项，却期望靠一个分数替代具体整改。
- 只想把 Scorecard 当徽章或数字展示，而不是把它转成可执行的 triage 结论。

## 推荐落地方式

1. 先把 Scorecard 当“基线审计”，不要直接把总分当门禁。
2. 第一阶段优先关注高信号检查项：
   - `Token-Permissions`
   - `Pinned-Dependencies`
   - `Branch-Protection`
   - `Dangerous-Workflow`
   - `Binary-Artifacts`
3. 将 Scorecard 与现有安全链分层：
   - `dependency-review-gates` 负责依赖漏洞与许可证变化
   - `codeql-pr-security-gates` 负责代码级语义问题
   - `actionlint-workflow-gates` 负责 workflow 语法、结构和常见 shell 误用
   - `github-token-permissions-baseline` 负责把 workflow 真实运行收敛成 job 级最小权限建议
   - `zizmor-workflow-audits` 负责 workflow 安全面的细粒度审计
   - `trivy-security-gates` 负责镜像、文件系统和 IaC 风险
   - Scorecard 负责仓库、workflow 和供应链基线
   - `runner-egress-hardening` 负责 GitHub Actions runner 运行时的出站访问控制与监测
4. 若仓库是私有仓库或使用结果发布功能，先确认 GitHub 环境和权限要求，不要默认 public repo 的默认做法可直接照搬。
5. 结果必须回写到 `/code-review`、`/team-review` 或架构/安全治理结论中，不让供应链基线结果只停在 action 页面里。

## 最小门禁模型

- `repo layer`：仓库策略、workflow 配置、依赖 pinning、发布与签名流程
- `score layer`：Scorecard 检查项与结果
- `triage layer`：确认哪些是当前变更新增问题、哪些是存量治理债务
- `decision layer`：安全评审角色、`code-reviewer`、`tech-lead` 决定是否阻塞或进入治理 backlog

重点不是追总分，而是让关键检查项变成稳定约束。

## 重点检查项

- GitHub token 是否最小权限，是否存在过宽 `contents: write`、`packages: write` 等权限
- 第三方 action 是否 pin 到 commit SHA，而不是只用浮动 tag
- 分支保护、必需 review、关键 CI 是否真正启用
- workflow 是否存在危险触发方式、脚本注入或不受控的外部输入
- 发布流程是否绕过签名、审计或 artifact provenance 要求

## 反模式

- 只盯总分涨跌，不分析具体是哪一个检查项失分。
- 发现 workflow / token 风险后，只记在 action 日志里，没有回到 review 或治理计划。
- 仓库已经大量使用第三方 action，却不做 pinning 和权限收敛。
- 把存量治理债务和本次变更新增风险混在一起，导致所有 PR 都被历史问题拖死。

## 输出回落

- PR 阶段：把高优先级 Scorecard 检查项和 triage 结论写入 review 摘要。
- 团队协作：在 `/team-review` 中说明哪些问题属于仓库级供应链基线、哪些需要后续治理而不是阻塞当前功能。
- 治理阶段：若 workflow、发布权限或分支保护存在结构性风险，应沉淀到 ADR、治理待办或发布整改计划。

## 许可证与使用边界

- `ossf/scorecard-action` 本身采用 Apache-2.0。
- 公开仓库与私有仓库的启用条件、结果发布和权限要求不同，接入前要先核对仓库类型与 GitHub 能力边界。

## 参考来源

- [ossf/scorecard-action](https://github.com/ossf/scorecard-action)
- [dependency-review-gates.md](dependency-review-gates.md)
- [codeql-pr-security-gates.md](codeql-pr-security-gates.md)
- [actionlint-workflow-gates.md](actionlint-workflow-gates.md)
- [github-token-permissions-baseline.md](github-token-permissions-baseline.md)
- [zizmor-workflow-audits.md](zizmor-workflow-audits.md)
- [trivy-security-gates.md](trivy-security-gates.md)
- [runner-egress-hardening.md](runner-egress-hardening.md)
