---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# IaC 与 Kubernetes 平台演示剧本

本文是一份可直接照着讲的演示脚本，面向 Helm Chart、Kubernetes manifest、policy、schema 校验和发布前预检场景。

## 1. 演示目标

- 说明 chart、schema、policy、server-side dry-run 是四层不同验证问题
- 说明 `/tdd` 如何前置定义分层验证完成标准
- 说明 `/verify` 如何把零散门禁结果收敛成 review / release 可用结论

## 2. 适用对象

- 需要介绍 IaC 治理能力的 Tech Lead
- 需要做发布门禁说明的 DevOps / QA
- 需要解释 Helm / Kubernetes 分层验证边界的讲解人

## 3. 演示时长建议

- 5 分钟：讲四层验证边界
- 10 分钟：再讲 `/tdd` 与 `/verify`
- 15 分钟：完整走一遍 intake -> plan -> tdd -> execute -> verify -> review/release

## 4. 演示脚本

### Step 1. 先用 1 分钟讲清 IaC 任务在治理什么

建议讲法：

```text
IaC 平台仓库要治理的不是一条命令，而是四层验证：
第一层是 chart 渲染意图；
第二层是 manifest schema；
第三层是 policy 约束；
第四层是 API server 接收性预检。
```

配套材料：

- [helm-unittest-playbook.md](helm-unittest-playbook.md)
- [kubeconform-schema-gates.md](kubeconform-schema-gates.md)
- [conftest-policy-gates.md](conftest-policy-gates.md)
- [kubectl-server-dry-run-gates.md](kubectl-server-dry-run-gates.md)

### Step 2. 用 `/team-intake` 讲清目标和边界

建议输入：

```text
/team-intake
目标：补齐 Kubernetes 平台仓库的 chart、schema、policy 和发布门禁
范围：Helm Chart、manifest、policy、验证脚本、release 说明
不做：业务服务逻辑改造
约束：必须区分 helm unittest、kubeconform、conftest/kyverno 和 server-side dry-run 的边界
```

讲解重点：

- 这是 IaC 平台治理任务，不是普通后端任务
- 一开始就要把四层验证拆开，否则结论会失真

### Step 3. 用 `/team-plan` 说明如何拆分层验证任务

建议输入：

```text
/team-plan
基于当前 intake 结果，拆 chart 变更、schema 校验、policy 校验、server-side 预检和 release 收口动作。
输出必须指出哪些完成标准应先进入 /tdd，哪些证据最终应由 /verify 汇总。
```

### Step 4. 用 `/tdd` 讲“先锁验证分层标准”

建议输入：

```text
/tdd
基于当前 /team-plan 结果，先定义本轮 IaC 变更的完成标准。
至少覆盖：
1. chart 渲染意图有验证
2. manifest schema 校验通过
3. policy 结果可解释
4. server-side 预检结果能进入 release 结论
```

### Step 5. 用 `/team-execute` 讲实际收敛动作

建议讲法：

```text
执行阶段通常会先调 chart 和 values，再补 schema 与 policy 门禁，最后补 server-side 预检和 release 说明。
```

### Step 6. 用 `/verify` 收口

建议输入：

```text
/verify
请基于当前 IaC 变更，输出 chart 渲染、schema、policy、server-side 预检结果、环境风险和可直接进入 /team-review 或 /team-release 的结论。
```

### Step 7. 用 review 与 release 收尾

建议讲法：

```text
最终交付不是“CI 通过了”，而是 review 能解释阻塞项，release 能解释环境范围、回滚路径和剩余风险。
```

## 5. 建议演示顺序

1. 先讲 chart / schema / policy / dry-run 四层边界
2. 再展示 `/team-intake` 与 `/team-plan`
3. 然后讲 `/tdd`
4. 再讲 `/team-execute`
5. 最后讲 `/verify`、`/team-review` 和 `/team-release`

## 6. 演示后建议发给观众的材料

- [iac-kubernetes-platform-demo-execution-log.md](iac-kubernetes-platform-demo-execution-log.md)
- [iac-kubernetes-platform-walkthrough.md](iac-kubernetes-platform-walkthrough.md)
- [../../examples/iac-kubernetes-platform-CLAUDE.md](../../examples/iac-kubernetes-platform-CLAUDE.md)
