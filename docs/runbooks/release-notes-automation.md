# Release Notes 自动化手册

本手册承接 `semantic-release` 与 `release-notes-generator` 的工程实践，用于规范 changelog / release notes 自动生成的接入方式。它是发布说明自动化补充，不替代 `/team-release` 的责任链、放行结论和回滚方案。

## 适用场景

- 团队希望减少手工整理版本说明的成本。
- 仓库已经有较稳定的提交规范、PR 标题规范或版本发布节奏。
- 需要把版本说明、tag、发布记录和变更面更稳定地关联起来。

## 先判断采用层级

优先顺序建议如下：

1. `notes-only`
只自动生成 release notes / changelog，不自动发版。

2. `notes + tag`
在 notes 稳定后，再接自动打 tag 或创建 release 草稿。

3. `full semantic release`
只有当提交规范、分支策略、发版权限和回滚策略都成熟时，再考虑自动发版。

## 推荐落地方式

1. 先统一提交或 PR 标题策略，保证版本说明有稳定输入来源。
2. 第一阶段只生成草稿 release notes，让团队确认分组、噪音和遗漏。
3. 第二阶段再接 tag / GitHub Release 草稿，仍保留人工放行。
4. 只有在发布权限、版本规则和回滚链都稳定后，才考虑全自动 semantic release。
5. 对基础设施变更、手工数据库操作、灰度策略等“代码之外的发布动作”，继续在 [release-plan.md](../../templates/release-plan.md) 和 `/team-release` 中人工补充，不要指望 changelog 自动生成完整发布说明。

## 反模式

- 提交标题混乱，却直接上全自动 semantic release。
- 把版本说明自动化误当成发布流程自动化，忽略人工放行和回滚准备。
- 只记录代码提交，不记录配置、数据迁移、静态资源或手工操作影响。
- 生成的 notes 从未被人使用，却持续增加维护复杂度。

## 输出回落

- 日常发布：将自动生成的 notes 作为 `/team-release` 的补充输入，而不是替代发布方案。
- 对外发布：若创建了 tag / release 草稿，把链接和版本号回写到 handoff 或发布记录。
- 风险沟通：自动生成内容不足以说明风险时，仍由 `devops-engineer` 或 `tech-lead` 手工补充。

## 参考来源

- [semantic-release/semantic-release](https://github.com/semantic-release/semantic-release)
- [semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator)
