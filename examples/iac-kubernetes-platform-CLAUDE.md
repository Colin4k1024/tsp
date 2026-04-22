# Example IaC Kubernetes Platform CLAUDE.md

适用于 Kubernetes 平台仓库、Helm Chart 仓库、GitOps / Policy 仓库、集群配置治理仓库或 IaC 安全门禁仓库。

这类项目的重点不是业务页面或接口，而是 chart、manifest、policy、schema、dry-run、镜像与集群发布基线是否稳定可验证。

## 适用信号

- 仓库主要变更集中在 Helm Chart、Kubernetes YAML、Policy、环境配置或发布基线
- 需求经常涉及 checkov、kubeconform、conftest、kyverno、helm unittest、kubectl server-side dry-run
- 最终输出常常是 chart / manifest 变更、策略结果、环境风险评估和 release 说明，而不是业务功能上线

## 相对通用版的主要差异

### 1. 命令流更强调结构校验、策略门禁和发布收口

- 建议链路：`/team-intake` -> `/team-plan` -> `/tdd` -> `/team-execute` -> `/verify` -> `/team-review` -> `/team-release`
- 如果仓库同时承担平台规范维护，可在收口前补 `/harness-audit`
- `/build-fix` 适合处理模板渲染、schema、policy 或 CI 失败

### 2. 项目约束更偏 chart / manifest / policy 分层

- 必须区分 chart 渲染问题、schema 问题、policy 问题和 server-side 接收问题
- 所有 IaC 变更都要说明影响环境、失败路径和回滚方式
- 验证结果必须回写到 review / release，而不是只停在 CI 输出

### 3. 角色链路更偏架构、QA 与发布治理

- 默认保留：`tech-lead`、`architect`、`qa-engineer`、`devops-engineer`
- 若仓库同时生成服务配置或平台工具，再按需引入 `backend-engineer`

## 一份更适合 IaC / Kubernetes 平台仓库的精简成品

````md
# IaC Kubernetes Platform Working Agreement

## 项目定位

- 类型：IaC / Kubernetes 平台治理仓库
- 重点：Chart、Manifest、Policy、Schema、Release 与回滚基线

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

- IaC 变更必须区分 chart、schema、policy 和 server-side 四层验证
- 必须说明环境范围、失败路径、回滚方式和发布窗口
- review 和 release 必须记录关键门禁结果与剩余风险

## 常用提示模板

```text
/team-intake
目标：补齐 Kubernetes 平台仓库的 chart、schema、policy 和发布门禁
范围：Helm Chart、manifest、policy、验证脚本、release 说明
不做：业务服务逻辑改造
约束：必须区分 helm unittest、kubeconform、conftest/kyverno 和 server-side dry-run 的边界
```

```text
/verify
请基于当前 IaC 变更，汇总 chart 渲染、schema、policy、server-side 预检结果，并整理成可直接进入 /team-review 或 /team-release 的结论。
```
````

继续阅读：看 [../docs/runbooks/helm-unittest-playbook.md](../docs/runbooks/helm-unittest-playbook.md)、[../docs/runbooks/kubeconform-schema-gates.md](../docs/runbooks/kubeconform-schema-gates.md)、[../docs/runbooks/conftest-policy-gates.md](../docs/runbooks/conftest-policy-gates.md)、[../docs/runbooks/kubectl-server-dry-run-gates.md](../docs/runbooks/kubectl-server-dry-run-gates.md)。
