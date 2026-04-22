# Dependency Review 门禁手册

本手册承接 `actions/dependency-review-action` 的工程实践，用于把依赖升级、新增包、漏洞和许可证变化前置到 PR 级别检查。它是安全 review 和发布准备的补充，不替代人工安全判断或运行时验证。

## 适用场景

- PR 涉及 `pom.xml`、`package.json`、`go.mod`、`Cargo.toml`、lockfile 或 CI 依赖版本调整。
- 团队希望在合并前知道“引入了什么新依赖、是否带来已知漏洞、许可证是否变化”。
- 需要把依赖升级从“代码 review 顺手看看”升级为明确的检查项。

## 不适用场景

- 仓库没有稳定的依赖清单或 lockfile，无法判断真实变更面。
- 团队还没有定义哪些漏洞级别、许可证类型或来源策略会阻塞合并。
- 期望只靠依赖扫描结果替代代码级安全 review。

## 推荐落地方式

1. 先明确阻塞策略：哪些漏洞等级、哪些许可证变化、哪些来源风险必须拦截。
2. 第一阶段优先检查：
   - 新增直接依赖
   - 高危漏洞
   - 明显的许可证变化
3. 将依赖门禁与安全评审角色、`/code-review`、`/team-review` 的人工判断分层：
   - 依赖门禁负责发现清单和风险信号
   - 安全 review 负责判断风险是否成立、是否可接受
4. 若团队希望把依赖升级从“偶尔集中处理”转成“持续发现 + 分批 triage”，参考 [dependency-update-automation.md](dependency-update-automation.md) 设计分组、自动提 PR 和验证节奏。
5. 若仓库同时启用了 AI PR review 或 reviewdog，避免重复轰炸：依赖风险结论只保留一个权威展示位。
6. 结果必须写回 PR 描述、review 结论或发布检查项，不能只停在 action 日志中。

## 最小门禁模型

- `change layer`：依赖清单和 lockfile diff
- `scan layer`：新增依赖、漏洞、许可证和来源风险检查
- `decision layer`：安全评审角色、`code-review`、`tech-lead` 决定是否阻塞

先把“发现”和“决策”分开，避免把扫描器当成最终审批者。

## 重点检查项

- 是否新增了直接依赖或关键传递依赖
- 是否引入高危 / 严重漏洞
- 是否出现许可证从宽松到受限的变化
- manifest 与 lockfile 是否一致更新
- 开发依赖是否意外进入运行时依赖面

## 反模式

- 只看“有几个警告”，不分析哪些会真正影响本仓库。
- 升级依赖却不更新 lockfile，导致本地和 CI 解析结果不一致。
- 让 dependency gate 替代人工安全 review，以为“没报警就一定安全”。
- 明明是依赖来源或许可证问题，却只在发布时才第一次发现。

## 输出回落

- PR 阶段：把新增依赖、高风险漏洞、许可证变化写入 PR 描述或 review 结论。
- 评审阶段：在 `/team-review` 中说明哪些问题来自依赖门禁，哪些经人工判断后仍需阻塞。
- 发布阶段：若依赖风险被有条件接受，必须回写到 `/team-release` 的风险、放行结论或观察项。

## 参考来源

- [actions/dependency-review-action](https://github.com/actions/dependency-review-action)
- [dependency-update-automation.md](dependency-update-automation.md)
