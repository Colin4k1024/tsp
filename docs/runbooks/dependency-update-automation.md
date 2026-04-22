# Dependency Update 自动化手册

本手册承接 `renovatebot/renovate` 的工程实践，用于规范依赖升级自动化的接入方式。它补的是“如何持续发现、批量整理、分层 triage 和安全落回 PR / 发布链”这一层，不替代人工验证、`dependency-review-gates`、`codeql-pr-security-gates` 或正式发布放行判断。

## 适用场景

- 仓库依赖数量较多，手工跟进安全补丁、次版本升级和锁文件漂移成本很高。
- 团队希望把依赖升级从“偶尔集中处理”变成“持续小步前进”。
- 需要把依赖更新按风险分组、按优先级批量处理，并让 PR review 更容易 triage。
- 希望把依赖升级和测试、发布门禁联动起来，而不是只自动改版本号。

## 不适用场景

- 仓库依赖很少，手工升级已经足够轻量。
- 团队还没有稳定的测试、回归和发布检查，却想把所有依赖更新都自动合并。
- 依赖变更会直接影响数据库迁移、API 契约或运行时协议，但团队没有明确的验证链。
- 期望这份手册替代人工判断、`dependency-review-gates` 或上线放行责任。

## 推荐落地方式

1. 先把依赖更新分层，不要把所有升级都当成同一类风险：
   - patch / security update：优先自动提 PR
   - minor update：批量合并，但保留 triage
   - major update：默认单独 PR 或单独批次
2. 第一阶段只接少量影响面明确的目录或 package manager，不要一开始全仓库铺开。
3. 采用“批量发现 + 批量 triage + 分组合并”的节奏：
   - 先收集可升级项
   - 再按风险、语言、目录或 owner 分组
   - 最后只合并已通过验证的批次
4. 将依赖更新与现有链路分层：
   - `dependency-review-gates` 负责新增依赖、许可证和已知漏洞检查
   - QA 角色、`pairwise-test-design` 和相关测试规则负责回归范围判断
   - `devops-engineer` / `/team-release` 负责放行判断
   - `dependency-update-automation` 负责持续发现、批量整理和 PR 组织
5. 对高风险依赖，先保持分支 PR 或草稿 PR，再决定是否自动合并。
6. 结果必须回写到 `/team-review`、`/team-release` 或 handoff，不让升级结论只停在机器人评论里。

## 最小门禁模型

- `discovery layer`：自动发现可升级依赖、版本差异和安全更新
- `batching layer`：按语言、目录、风险或 owner 把升级项分批
- `triage layer`：判断哪些升级是低风险可自动合并，哪些需要人工确认
- `verification layer`：对应测试、lint、依赖审查和发布前检查
- `decision layer`：`qa-engineer`、`backend-engineer`、`devops-engineer`、`tech-lead` 决定是否合并或阻塞

重点不是“自动开很多 PR”，而是让 PR 数量、风险和验证成本都可控。

## 重点检查项

- 依赖更新是否有明确的分组策略，而不是把 patch、minor、major 混成一锅
- 自动生成的 PR 是否包含版本说明、风险提示和需要补测的范围
- 是否区分安全更新、常规升级和破坏性升级的处理路径
- 更新后是否能复用现有测试与回归链，而不是每次都临时加命令
- 是否存在频繁 rebase、冲突重提或重复噪音，导致团队忽略自动化结果
- 自动合并条件是否过宽，容易把高风险升级悄悄放掉

## 反模式

- 一上来就全仓库自动升级，还默认自动合并。
- 把所有依赖升级都当成同一优先级，导致高风险升级被批量吞掉。
- 自动化只负责改版本号，却不补验证建议和 triage 责任。
- PR 太碎、太多、太乱，最后团队把依赖机器人当噪音源。
- 只看版本号是否已更新，不看 API 兼容性、许可证变化和锁文件行为。

## 输出回落

- PR 阶段：把批量升级列表、风险分组和建议验证命令写入 PR 描述或 review 结论。
- 团队协作：在 `/team-review` 中说明哪些依赖升级已经验证，哪些仍需人工 triage。
- 发布阶段：若某批升级影响放行判断，回写到 `/team-release` 的检查结果或观察项。

## 许可证与使用边界

- `renovatebot/renovate` 采用 AGPL-3.0。
- 由于其许可证边界较强，当前平台继续保持 `reference-only-runbook` 定位，只吸收方法论、分组策略和 triage 做法，不直接把上游实现并入正式 skill 层。
- 启用前应确认仓库的 package manager、分支保护、自动合并策略和 PR 处理容量。
- 如果团队当前还没有稳定测试和依赖审查链，先只启用发现与提 PR，不要直接启用自动合并。

## 参考来源

- [renovatebot/renovate](https://github.com/renovatebot/renovate)
- [dependency-review-gates.md](dependency-review-gates.md)
- [qa-engineer-daily-operations.md](qa-engineer-daily-operations.md)
- [release-plan.md](../../templates/release-plan.md)
