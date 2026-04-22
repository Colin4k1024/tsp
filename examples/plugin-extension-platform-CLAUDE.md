# Example Plugin Extension Platform CLAUDE.md

适用于 VS Code 扩展仓库、CLI 插件仓库、Agent 插件仓库、编辑器扩展仓库或工具链扩展平台。

这类项目的重点不是业务 CRUD，而是宿主集成点、命令入口、配置面、发布包、兼容性和用户安装路径是否稳定可维护。

## 适用信号

- 仓库主要产出 extension、plugin、command、contribution、activation、marketplace 包或安装脚本
- 需求经常是新增命令、扩展点、配置项、安装流程、兼容矩阵或插件发布
- 最终输出常常是插件行为、宿主集成、发布包与文档入口，而不是独立业务服务

## 相对通用版的主要差异

### 1. 命令流更强调集成点与安装路径

- 建议链路：`/team-intake` -> `/team-plan` -> `/tdd` -> `/team-execute` -> `/verify` -> `/team-review`
- 如果仓库本身还维护 commands / examples / docs 生态，可在收口前补 `/harness-audit`

### 2. 项目约束更偏宿主边界与发布兼容性

- 必须说明 extension / plugin 的宿主边界、命令面、配置面和安装升级路径
- 改动命令、配置或入口时，文档、示例和发布说明要同步更新
- 如果兼容矩阵复杂，必须明确最低支持版本与降级行为

### 3. 角色链路更偏架构、前端 / 工具链与 QA

- 默认保留：`tech-lead`、`architect`、`qa-engineer`
- 如果界面和交互较重，引入 `frontend-engineer`
- 如果打包、发布、安装脚本复杂，引入 `devops-engineer`

## 一份更适合插件 / 扩展仓库的精简成品

````md
# Plugin Extension Platform Working Agreement

## 项目定位

- 类型：插件 / 扩展 / 工具链仓库
- 重点：宿主集成点、命令面、配置面、安装路径、发布兼容性

## 默认角色

- `tech-lead`
- `architect`
- `qa-engineer`
- 需要时引入 `frontend-engineer` 或 `devops-engineer`

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/team-execute`
5. `/verify`
6. `/team-review`

## 项目约束

- 命令、配置或扩展点改动必须同步更新文档、示例和安装说明
- 必须说明宿主版本、兼容矩阵和升级 / 回退路径
- verify 需要覆盖关键集成点、配置变更和安装路径

## 常用提示模板

```text
/team-intake
目标：为插件仓库新增命令入口并补齐安装、配置与兼容性说明
范围：命令、配置项、集成点、安装文档、测试计划
不做：无关业务服务改造
约束：必须说明宿主版本边界、升级路径、禁用态和失败回退行为
```

```text
/verify
请基于当前插件改动，汇总命令入口、配置项、安装路径和兼容性验证结果，并整理成可直接进入 /team-review 的结论。
```
````

如果项目更偏平台治理或多入口命令仓库，也可补看 [platform-governance-CLAUDE.md](platform-governance-CLAUDE.md)。
