# Example Spring Boot Service CLAUDE.md

适用于 Java / Spring Boot / JPA 服务项目。

这份文件不再重复通用模板的全部章节，而是告诉你：如果你已经看过 [project-CLAUDE.md](project-CLAUDE.md)，在后端主导项目里应该做哪些收缩和替换。

如果你的项目同时有较重的前端交付，先看 [INDEX.md](INDEX.md) 再决定是否应改用通用版。

## 适用信号

- 接口、领域逻辑、数据库和发布安全是主要交付物
- 前端不是默认主战场，更多是外部消费方或另一个仓库
- 项目更关注兼容性、迁移脚本、测试覆盖和发布风险，而不是页面和视觉门禁

## 相对通用版的主要差异

### 1. 角色链路更偏后端与架构

- 默认保留：`tech-lead`、`architect`、`backend-engineer`、`qa-engineer`
- 按需引入：`devops-engineer`
- 一般不把 `frontend-engineer` 作为默认参与角色，除非同仓库还承担控制台交付

### 2. 技能装配更偏接口、数据和发布

- 保留通用底座：由 `architect` / `tech-lead` 直接承担方案决策
- 接口契约、兼容性和错误处理由 `architect` / `backend-engineer` 直接承担
- 发布风险、回滚和监控由 `/team-release` 与发布治理 runbook 承接
- custom overlay 默认不安装，只在 intake 或 plan 明确命中团队专属流程、权限或领域能力时再叠加；具体安装约定看 [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md)

### 3. 命令流更强调后端拆解与评审

- 主链仍然保留：`/team-intake` -> `/team-plan` -> `/team-execute` -> `/handoff` -> `/team-review`
- 中间更强调 `/multi-backend` 和 `/code-review`
- 如果项目确实存在上线窗口、回滚和监控要求，应把 `/team-release` 加回默认链路

### 4. 项目约束更偏兼容性与迁移安全

- 改接口必须说明兼容性和错误处理
- 改数据库必须说明迁移和回滚策略
- 自测必须覆盖单测、集成测试和关键边界态
- 构建失败优先使用 `/build-fix`，但最终修复结论回到主链
- 涉及团队专属能力时，在 intake 或 plan 阶段显式声明是否需要叠加 custom overlay

### 5. 默认交付物也要后端化

- intake：目标、范围外事项、接口或数据风险、overlay 候选项
- plan：接口契约、数据层改造、测试策略、发布风险
- execute：代码变更、单测/集测结果、迁移脚本、已知限制
- handoff：接口摘要、测试结论、回滚说明、QA 关注点

## 一份更适合后端项目的精简成品

````md
# Spring Boot Service Delivery Rules

## 项目定位

- 类型：后端业务服务
- 技术栈：Java、Spring Boot、JPA、MySQL
- 重点：接口契约、领域边界、数据变更、发布安全

## 默认角色

- `tech-lead`
- `architect`
- `backend-engineer`
- `qa-engineer`
- 涉及上线窗口时引入 `devops-engineer`

## 默认技能装配

- `api-contract`

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/multi-backend`
4. `/team-execute`
5. `/code-review`
6. `/handoff`
7. `/team-review`

## 项目约束

- 改接口必须说明兼容性和错误处理
- 改数据库必须说明迁移和回滚策略
- 自测必须覆盖单测、集成测试和关键边界态
- 构建失败优先使用 `/build-fix`，但最终修复结论回到主链
- custom overlay 默认不安装，只在 intake 或 plan 明确命中团队专属流程或领域能力时再叠加；具体场景先看 [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md)

## 常用提示模板

```text
/team-intake
目标：新增订单审批状态流转 API
范围：接口、权限校验、测试计划
不做：前端页面
约束：评估是否需要叠加 custom overlay
```

```text
/multi-backend
基于 intake 结果拆解接口设计、数据层改造、测试策略和发布风险。
请明确哪些输出应进入 architect/back-end/qa 的 handoff。
```
````

如果仓库同时承载前端管理台，建议改用 [project-CLAUDE.md](project-CLAUDE.md) 或在此基础上补充前端角色、前端技能和 UI 质量门禁说明。

如果项目长期涉及团队专属流程、权限或发布扩展，建议把 custom overlay 的使用约束并回项目模板，而不是继续写零散注释。
