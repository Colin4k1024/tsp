# Reviewdog PR 门禁手册

本手册承接 `reviewdog/reviewdog` 与 `reviewdog/action-eslint` 的工程实践，用于把现有 lint / test / static check 结果安全地暴露到 PR 上。它是 review 自动化的补充手册，不替代本地验证和 `/team-review`。

## 适用场景

- 仓库已经有稳定的 lint、静态检查或测试命令，希望把结果自动贴到 PR。
- 团队希望在 GitHub PR 中直接看到代码级问题，而不是只看 CI 日志。
- 需要逐步建设 PR gate，但不想一上来就把所有检查都做成阻塞项。

## 前置条件

- 已有可重复执行的本地检查命令，例如 `eslint`、`ruff`、`golangci-lint`、`mvn test` 等。
- 团队已经接受这些检查的规则质量，至少不存在大量历史噪音。
- 已明确本次 gate 是 `warning-first` 还是 `blocking`。

## 推荐落地方式

1. 先把本地检查命令稳定下来，reviewdog 只负责“转译和呈现结果”，不负责定义规则。
2. 第一阶段只接 1-2 个高信号检查，例如 ESLint、Ruff、格式化或一个稳定的单测集合。
3. 先用非阻塞模式观察噪音水平，再决定是否升级为阻塞 gate。
4. 对同一类问题只保留一个权威来源，避免同一错误在 CI summary、PR comment、inline comment 里重复轰炸。
5. 将 gate 的阻塞策略同步到 `/team-review` 和发布准备说明里，避免“CI 阻塞了但团队不知道这是正式门槛”。

## 最小门禁模型

- `source of truth`：项目原生检查命令
- `annotation layer`：reviewdog 将输出映射到 PR check 或 inline review
- `decision layer`：`/team-review` 与 `tech-lead` 判断问题是否阻塞

先把这三层分清，再决定是否扩大自动化范围。

## 反模式

- 还没有稳定规则，就急着把 reviewdog 接成阻塞门禁。
- 把低价值、纯风格或高噪音问题全部推到 PR inline comment。
- 本地与 CI 的命令不一致，导致开发者无法复现 PR 报错。
- 用 reviewdog 替代 code review，本该由 reviewer 判断的设计和行为问题却只看机器结果。

## 输出回落

- PR 阶段：把启用的 gate、阻塞策略和主要发现写入 PR 描述或 review 结论。
- 团队协作：在 `/team-review` 中说明哪些问题来自自动门禁，哪些仍需人工判断。
- 发布前：若某项 gate 属于正式放行门槛，回写到 `/team-release` 的发布检查结果。

## 参考来源

- [reviewdog/reviewdog](https://github.com/reviewdog/reviewdog)
- [reviewdog/action-eslint](https://github.com/reviewdog/action-eslint)
