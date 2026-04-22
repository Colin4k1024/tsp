# Example GitHub Actions Supply Chain CLAUDE.md

适用于 GitHub Actions 为主的 CI/CD、供应链治理、发布自动化和 workflow 安全仓库。

这类仓库的重点不是业务页面或接口，而是 workflow、token 权限、artifact、attestation、签名、发布与审计链路是否稳定可控。

## 适用信号

- 仓库大量依赖 `.github/workflows/` 完成构建、测试、发布或安全检查
- 需求经常是 actionlint、scorecard、token 权限、attestation、签名或 runner 治理
- 最终输出常常是 workflow 变更、门禁策略、审计记录和发布基线，而不是业务接口

## 相对通用版的主要差异

### 1. 角色链路更偏平台治理与发布

- 默认保留：`tech-lead`、`architect`、`qa-engineer`、`devops-engineer`
- 若需要排期治理，再引入 `project-manager`
- 一般不把 `frontend-engineer`、`backend-engineer` 作为默认主力角色，除非仓库同时承载业务服务代码

### 2. 命令流更强调 `/harness-audit` 与发布治理

- 建议链路：`/team-intake` -> `/team-plan` -> `/tdd` -> `/team-execute` -> `/harness-audit` -> `/team-review` -> `/team-release`
- 若重点是 workflow 语法或安全问题，可中间插 `/code-review` 或 `/build-fix`
- `/harness-audit` 适合在大量 workflow / runbook / 门禁入口调整后统一收敛缺口

### 3. 项目约束更偏 workflow 与证据链

- workflow 变更必须说明触发条件、权限边界、失败路径和回滚方式
- 所有供应链门禁结论要回写到 review、release 或治理记录，不只停在 CI 产物
- 重点 runbook 包括 actionlint、scorecard、github token permissions、zizmor、attestation、SLSA、SBOM

## 一份更适合 workflow / 供应链治理仓库的精简成品

````md
# GitHub Actions Supply Chain Working Agreement

## 项目定位

- 类型：CI/CD 与供应链治理仓库
- 重点：workflow 结构、token 权限、artifact 证明、发布安全、审计记录

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
5. `/harness-audit`
6. `/team-review`
7. `/team-release`

## 项目约束

- workflow 改动必须说明触发条件、权限边界、失败路径和回滚方式
- token 权限收敛、attestation、SBOM、签名和 provenance 结论必须进入 review 或 release
- workflow 静态检查、安全审计和供应链基线需要分层说明，不能混成一个结论

## 常用提示模板

```text
/team-intake
目标：重构 GitHub Actions 发布链路并补齐供应链门禁
范围：workflow、permissions、attestation、SBOM、签名、review 说明
不做：业务服务代码改造
约束：必须区分 actionlint、scorecard、token 权限、SLSA 和 artifact attestation 的边界
```

```text
/team-plan
基于当前 intake 结果，拆 workflow 结构调整、权限治理、发布证据链和校验收口动作。
要求指出哪些完成标准应先进入 /tdd，哪些缺口最终应通过 /harness-audit 验证。
```
````

继续阅读：看 [../docs/runbooks/actionlint-workflow-gates.md](../docs/runbooks/actionlint-workflow-gates.md)、[../docs/runbooks/scorecard-supply-chain-gates.md](../docs/runbooks/scorecard-supply-chain-gates.md)、[../docs/runbooks/github-token-permissions-baseline.md](../docs/runbooks/github-token-permissions-baseline.md)。
