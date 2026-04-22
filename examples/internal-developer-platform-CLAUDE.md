# Example Internal Developer Platform CLAUDE.md

适用于内部开发者平台、工程门户、服务目录、模板脚手架平台、交付自助平台或研发基础设施入口仓库。

这类项目的重点不是单点业务能力，而是开发者入口、一致性约束、自助体验、平台集成点和交付路径是否稳定可维护。

## 适用信号

- 需求经常涉及服务模板、环境自助、统一入口、平台 API、开发者体验或多系统编排
- 成功标准常常是流程缩短、入口统一、平台集成稳定和 handoff 清晰
- 仓库通常同时包含文档、命令、接口、门户或模板资产

## 相对通用版的主要差异

### 1. 命令流更强调平台流程与多角色协调

- 建议链路：`/team-intake` -> `/team-plan` -> `/tdd` -> `/team-execute` -> `/handoff` -> `/team-review` -> `/team-release`
- 如果仓库同时承担命令 / 文档 / 规则治理，可在关键阶段补 `/harness-audit`

### 2. 项目约束更偏入口一致性与体验收口

- 必须说明开发者入口、模板行为、失败兜底和人工介入路径
- 改动平台入口时，文档、模板和 release 说明必须同步
- handoff 需要对接开发者体验、运营支持和发布侧约束

### 3. 角色链路更偏平台架构与前后端协作

- 默认保留：`tech-lead`、`architect`、`frontend-engineer`、`backend-engineer`、`qa-engineer`
- 若发布与环境变更复杂，再引入 `devops-engineer`

## 一份更适合内部开发者平台的精简成品

````md
# Internal Developer Platform Working Agreement

## 项目定位

- 类型：内部开发者平台 / 工程门户
- 重点：开发者入口、模板链路、平台集成、自助体验、交付收口

## 默认角色

- `tech-lead`
- `architect`
- `frontend-engineer`
- `backend-engineer`
- `qa-engineer`

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/team-execute`
5. `/handoff`
6. `/team-review`
7. `/team-release`

## 项目约束

- 必须说明模板入口、失败兜底、人工介入和可观察性路径
- 平台入口、文档、模板和集成说明必须同步更新
- handoff 必须能让 QA 和 DevOps 直接接住验证范围与发布前提

## 常用提示模板

```text
/team-intake
目标：为内部开发者平台新增自助交付入口并补齐模板、验证和发布说明
范围：门户入口、平台 API、模板行为、测试计划、release 说明
不做：无关业务系统改造
约束：必须说明失败兜底、人工介入路径、权限边界和发布前提
```

```text
/handoff
请把当前平台实现与验证结果整理成可直接交给 QA、DevOps 或下一角色的结构化内容，明确入口行为、失败兜底、已验证范围和剩余风险。
```
````
