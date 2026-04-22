# /update-codemaps

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

扫描代码结构并生成 token-lean codemaps，适合作为 brownfield 项目的现状快照与主链前置上下文。

## 主责角色

- `doc-updater`

## 期望输入

- 代码仓结构
- 现有模块、入口、依赖与数据层信息
- 是否允许覆盖已有 codemap

## 标准输出

- docs/CODEMAPS/ 下的结构化 codemap
- .reports/codemap-diff.txt 差异摘要
- 可供 `/team-help` / `/team-plan` 消费的 brownfield context

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 先识别仓库类型、源码目录、入口文件和主要依赖边界。
2. 为 architecture/backend/frontend/data/dependencies 生成 token-lean 文档，不写实现细节噪音。
3. 若已有 codemap，先比较变更比例；超过阈值时要求人工确认再覆盖。
4. 把结果作为 brownfield context snapshot 的辅助输入，回落到 `delivery-plan.md` / `arch-design.md`，不要形成平行事实源。
