# CodeQL PR 安全门禁手册

本手册承接 `github/codeql-action` 的工程实践，用于把语义安全扫描接入 PR 与 code scanning 流程。它是安全 review 的补充证据来源，不替代人工威胁建模、依赖门禁或运行时验证。

## 适用场景

- 仓库托管在 GitHub，且具备使用 CodeQL 的前置条件。
- 团队希望在 PR 或默认分支上提前发现代码级安全问题，而不是只靠人工 review。
- 需要把安全扫描结果沉淀成可追踪、可分级、可回写的门禁输入。

## 不适用场景

- 仓库不在 GitHub，或当前环境不满足 CodeQL 使用条件。
- 团队尚未建立基本的安全 review 责任链，却指望扫描器代替人工判断。
- 期望把 CodeQL 结果当成唯一安全结论，而忽略鉴权设计、依赖风险和运行时暴露面。

## 推荐落地方式

1. 先确认使用边界：仓库托管方式、GitHub Advanced Security 条件、支持语言和扫描触发时机。
2. 第一阶段先启用默认查询集，观察噪音、误报和 triage 成本，不要一开始就堆大量自定义查询。
3. 将 CodeQL 与现有安全链分层：
   - `dependency-review-gates` 负责依赖和许可证风险
   - CodeQL 负责代码级语义问题
   - 安全评审角色 / reviewer 负责最终风险判断与阻塞决策
4. 若要把扫描结果用于 PR 门禁，先定义哪些严重级别或问题类型会阻塞，哪些只做观察。
5. 结果必须回写到 `/code-review`、`/team-review` 或发布前检查，不让 code scanning 结果只停留在 GitHub 安全面板里。

## 最小门禁模型

- `scan layer`：CodeQL 在 PR 或默认分支上执行语义分析
- `triage layer`：确认哪些结果是真问题、哪些是误报或暂不处理
- `decision layer`：安全评审角色、`code-reviewer`、`tech-lead` 决定是否阻塞

工具负责发现候选问题，团队负责做业务语义判断。

## 重点检查项

- 用户输入到 SQL、模板、文件、命令或反序列化边界的危险流向
- 鉴权、授权、敏感数据处理和错误暴露相关问题
- 语言与框架特定的常见安全陷阱
- 代码结构层面人工 review 不易稳定发现的语义漏洞

## 反模式

- 还没定义 triage 规则，就把所有 CodeQL 告警直接当阻塞项。
- 只看告警数量，不分析哪些会真正影响当前仓库的风险面。
- 让 CodeQL 替代人工安全 review，以为“没报警就绝对安全”。
- 扫描结果长期无人处理，最后大家默认忽略整套安全门禁。

## 输出回落

- PR 阶段：把高优先级扫描结果和 triage 结论写入 review 结论或风险摘要。
- 团队协作：在 `/team-review` 中明确哪些问题来自 CodeQL、哪些已经人工确认或降级处理。
- 发布阶段：若仍有未关闭的高风险扫描结果，必须回写到 `/team-release` 的放行结论或观察项。

## 许可证与使用边界

- `github/codeql-action` 本身是 MIT，但底层 CodeQL CLI 另有 GitHub 使用条件。
- 深度接入前必须确认仓库托管方式、组织能力和 GitHub 安全产品边界，不要默认所有仓库都能直接启用。

## 参考来源

- [github/codeql-action](https://github.com/github/codeql-action)
- [dependency-review-gates.md](dependency-review-gates.md)
