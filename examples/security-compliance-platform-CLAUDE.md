# Example Security Compliance Platform CLAUDE.md

适用于安全基线仓库、合规审计仓库、身份与权限治理仓库、漏洞与基线门禁仓库或安全平台治理项目。

这类项目的重点不是业务页面，而是安全控制面、合规证据、权限边界、审计记录和放行策略是否稳定可追溯。

## 适用信号

- 需求经常涉及 SAST、依赖审查、密钥扫描、权限治理、审计留痕、例外管理或合规基线
- 成功标准常常是风险分层清晰、证据完备、例外可追踪，而不是单个功能上线
- review 和 release 需要显式承接安全阻塞项与接受风险

## 相对通用版的主要差异

### 1. 命令流更强调验证、审计与收口

- 建议链路：`/team-intake` -> `/team-plan` -> `/tdd` -> `/team-execute` -> `/verify` -> `/team-review` -> `/team-release`
- 如果仓库本身还维护安全规则、runbook 和入口，可在收口前补 `/harness-audit`

### 2. 项目约束更偏风险分层与证据链

- 必须区分阻塞项、可接受例外和观察项
- 必须说明权限边界、审计留痕和回退方案
- 安全门禁结果必须回写到 review / release，而不是只停在工具输出

### 3. 角色链路更偏架构、QA 与发布治理

- 默认保留：`tech-lead`、`architect`、`qa-engineer`、`devops-engineer`
- 若涉及应用改造，再按需引入 `backend-engineer`

## 一份更适合安全 / 合规平台的精简成品

````md
# Security Compliance Platform Working Agreement

## 项目定位

- 类型：安全基线 / 合规审计仓库
- 重点：风险分层、权限治理、证据留存、审计记录、发布放行

## 默认角色

- `tech-lead`
- `architect`
- `qa-engineer`
- `devops-engineer`

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/team-execute`
5. `/verify`
6. `/team-review`
7. `/team-release`

## 项目约束

- 必须区分阻塞项、可接受例外和观察项
- 必须说明权限边界、审计记录与回退方式
- review / release 必须承接安全门禁结论与接受风险

## 常用提示模板

```text
/team-intake
目标：补齐安全基线与合规审计仓库的门禁、证据和放行规则
范围：安全扫描、权限基线、例外管理、release 说明、测试计划
不做：无关业务功能改造
约束：必须区分阻塞风险、可接受例外、观察项和最终放行条件
```

```text
/verify
请基于当前安全改动，汇总门禁结果、权限风险、例外项、证据留存和可直接进入 /team-review 或 /team-release 的结论。
```
````
