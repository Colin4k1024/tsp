---
version: "0.1.0"
status: draft
created: 2026-03-27
updated: 2026-03-27
owner: 工程团队
doc_tier: historical
last_verified: 2026-04-17
source_of_truth:
  - ../../CHANGELOG.md
  - ../../README.md
---

# Team Skills 平台迁移方案

> 历史快照（非现行操作手册）：本页用于归档迁移期设计，不作为当前构建/校验命令的权威来源。

## 1. 迁移目标

- 从旧的三段式流程技能迁移到“`Tech Lead` 编排 + 专业角色协作”的团队模型。
- 统一 Codex / Claude 的角色入口、命令面、规则和模板。
- 保留历史能力用于追溯，但不再作为活跃入口暴露。

## 2. 能力重组

| 历史能力类型 | 新归属 |
|-------------|--------|
| 文档与方案编排 | `product-manager` + `architect` + `tech-lead` |
| backlog / 计划拆解 | `product-manager` + `project-manager` + `tech-lead` |
| 实施闭环 | `frontend-engineer` / `backend-engineer` / `qa-engineer` / `devops-engineer` + `tech-lead` |

## 3. 迁移步骤

1. 建立 canonical source：`roles/`、`skills/`、`rules/`、`templates/`
2. 建立生成脚本：历史命名 `build_platform_artifacts.py`（当前等价：`node scripts/build-platform-artifacts.js`）
3. 生成角色 skills、agent prompt、commands、插件清单
4. 更新入口文档：`README.md`、`AGENTS.md`、`CLAUDE.md`
5. 清理历史业务细节内容，只保留平台资产，并把不再适合作为正式 skill 的资料降级到 runbook / toolkit / profile
6. 增加 validate / install 脚本并执行回归校验

## 4. 切换规则

- 新需求一律从 `tech-lead` 或明确的角色入口开始。
- 仓库只保留平台资产，不保留历史业务代码与业务文档内容。
- 活跃安装索引只面向新的 Team Skills 平台。
- 设计态资料、脚本型资料和公司样式资料优先以 runbook / toolkit / profile 方式承接，不再默认包装成正式 private enterprise overlay。

## 5. 验收标准

- 8 个角色都具备 `role.yaml + role skill + agent prompt`
- `commands/` 中存在 6 个标准命令
- 历史命名 `scripts/validate_library.py` 通过（当前等价：`node scripts/validate-library.js`）
- Codex / Claude 安装脚本能把产物同步到目标目录
- 新入口文档不再把旧模型当作活跃推荐路径
