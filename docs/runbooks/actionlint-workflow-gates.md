# Actionlint 工作流门禁手册

本手册承接 `rhysd/actionlint` 的工程实践，用于把 GitHub Actions workflow 的语法、结构和常见 shell 误用前置到 PR 和发布治理链。它补的是“workflow 文件本身是否写对、写稳、写得可维护”这一层，不替代 `scorecard-supply-chain-gates`、`code-review`、安全评审角色或人工发布判断。

## 适用场景

- 仓库大量依赖 `.github/workflows/` 执行构建、测试、发布或自动化治理。
- 团队希望在合并前提前发现 workflow 语法错误、key 拼写错误、上下文引用错误、`needs` 依赖错误或 runner label 问题。
- 需要把 `run:` 中的 shell 脚本错误、未定义输出、错误的 inputs / outputs 绑定和 reusable workflow 调用问题前置处理。
- 仓库已经有仓库级供应链基线，但还缺 workflow 文件级的静态 lint 入口。
- 需要把 workflow lint 结果和 code review、发布判断联动起来，而不是只在 CI 里跑一遍就算结束。

## 不适用场景

- 仓库没有 GitHub Actions workflow，或 workflow 并不是主要交付路径。
- 团队还没有明确 workflow 变更的 review 责任人，却想把 lint 结果直接当最终审批。
- 期望 actionlint 替代 `scorecard-supply-chain-gates`、`secret-scanning-gates`、`runner-egress-hardening` 或运行时验证。
- 只想检查“能不能跑”，而不愿意处理语法、上下文、依赖关系和 shell 细节问题。

## 推荐落地方式

1. 先把 actionlint 看成 workflow 的静态门禁，不要一开始就把所有警告都设成阻塞项。
2. 第一阶段优先检查最容易出错的内容：
   - workflow syntax
   - `jobs` / `steps` / `needs` 依赖关系
   - `${{ }}` 表达式的上下文和类型
   - `run:` 中的 shell 语法和脚本错误
3. 将 actionlint 与现有链路分层：
   - `scorecard-supply-chain-gates` 负责仓库级 workflow、token 权限和 action pinning 的基线
   - `secret-scanning-gates` 负责硬编码凭据和误提交 secret
   - `runner-egress-hardening` 负责 runner 运行时网络访问控制
   - `actionlint-workflow-gates` 负责 workflow 文件本身的语法、结构和常见 shell 问题
4. 若团队已经启用了 reviewdog 或 PR 门禁自动化，尽量让 actionlint 结果进入统一的 review 摘要，而不是在多个地方重复报错。
5. 结果必须回写到 `/code-review`、`/team-review` 或 workflow 变更说明中，不让 lint 结果只停在 CI 日志里。

## 最小门禁模型

- `target layer`：`.github/workflows/`、reusable workflow、action metadata 和相关脚本片段
- `syntax layer`：workflow YAML 结构、键名、事件触发、job / step 结构
- `expression layer`：`${{ }}` 中的上下文、类型和引用关系
- `shell layer`：`run:` 中的 shellcheck / pyflakes / 脚本可执行性问题
- `decision layer`：`code-reviewer`、安全评审角色、`tech-lead` 决定哪些 lint 告警会阻塞合并或发布

重点不是“有没有报错”，而是这些报错是否指向真实的 workflow 结构或执行风险。

## 重点检查项

- 事件触发是否写成了正确的 key，例如 `branches`、`paths`、`types`、`workflows`
- `jobs`、`steps`、`needs`、`if`、`with`、`outputs` 的引用是否和实际结构一致
- `${{ }}` 里的上下文是否在当前位置可用，是否存在类型不匹配
- `run:` 中是否有明显的 shell 拼写错误、缩进错误或未定义变量
- reusable workflow 的 inputs / outputs / secrets 是否被正确声明和消费
- runner label、矩阵、glob、cron 等容易漂移的 workflow 细节是否正确

## 反模式

- 只看 workflow 能不能触发，不看 YAML 结构是否真正正确。
- 让 lint 结果长期堆积在 CI 日志里，却没有人 triage。
- 把所有 actionlint 告警都当成硬阻塞，最后团队直接忽略整套门禁。
- 只 lint 新增片段，不检查 reusable workflow 和 local action 的调用边界。
- 把 actionlint 当成供应链安全替代品，忽略它本质上是 workflow 静态检查器。

## 输出回落

- PR 阶段：把 workflow 语法错误、上下文错误和 shell 风险写入 review 摘要或 PR 描述。
- 评审阶段：在 `/code-review` 或 `/team-review` 中明确哪些 lint 问题已经修复，哪些仍需跟进。
- 发布阶段：若 workflow 风险会影响构建或发布，必须回写到 `/team-release` 的检查结果或观察项。

## 许可证与使用边界

- `rhysd/actionlint` 采用 MIT 许可证。
- 启用前应确认仓库主要使用的 workflow 复杂度、runner 类型、shell 类型和 triage 责任人。
- 对大量历史 workflow 或 legacy shell 片段，建议先用非阻塞模式观察一轮，再逐步收紧门禁。

## 参考来源

- [rhysd/actionlint](https://github.com/rhysd/actionlint)
- [scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)
- [secret-scanning-gates.md](secret-scanning-gates.md)
- [runner-egress-hardening.md](runner-egress-hardening.md)
