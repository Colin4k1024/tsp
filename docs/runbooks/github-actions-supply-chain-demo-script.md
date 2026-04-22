---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# GitHub Actions 与供应链治理演示剧本

本文是一份可直接照着讲的演示脚本，面向 GitHub Actions、权限治理、SBOM、attestation、签名和 release 证据链场景。

## 1. 演示目标

- 说明 workflow lint、权限治理、供应链证据链是三层不同问题
- 说明 `/tdd` 如何前置定义治理完成标准
- 说明 `/harness-audit` 如何检查 runbook、review 和 release 出口是否同步

## 2. 适用对象

- 需要介绍 CI/CD 治理能力的 Tech Lead
- 需要做 workflow 安全与供应链汇报的 DevOps / QA
- 需要向团队解释 release 证据链的讲解人

## 3. 演示时长建议

- 5 分钟：讲 workflow、permissions、证据链三层边界
- 10 分钟：再讲 `/tdd` 与 `/harness-audit` 的作用
- 15 分钟：完整走一遍 intake -> plan -> tdd -> execute -> audit -> review/release

## 4. 演示脚本

### Step 1. 先用 1 分钟讲清这类任务到底在治理什么

建议讲法：

```text
这类仓库要治理的不是一件事，而是三件事：
第一是 workflow 结构和 lint 质量；
第二是 token 权限和仓库治理边界；
第三是 SBOM、attestation、签名和 provenance 组成的发布证据链。
```

配套材料：

- [actionlint-workflow-gates.md](actionlint-workflow-gates.md)
- [github-token-permissions-baseline.md](github-token-permissions-baseline.md)
- [artifact-attestation-gates.md](artifact-attestation-gates.md)

### Step 2. 用 `/team-intake` 讲清治理目标和边界

建议输入：

```text
/team-intake
目标：补齐 GitHub Actions 发布链路的供应链门禁与证据记录
范围：workflow、permissions、scorecard、SBOM、attestation、签名、release 检查项
不做：业务服务逻辑改造
约束：必须说明 workflow lint、token 权限、provenance、artifact attestation 的边界
```

讲解重点：

- 这是平台治理任务，不是业务需求开发
- 一开始就要分清结构问题、权限问题和证据链问题

### Step 3. 用 `/team-plan` 说明如何拆治理任务

建议输入：

```text
/team-plan
基于当前 intake 结果，拆 workflow 调整、权限收敛、供应链证据生成、review 收口和 release 记录动作。
输出必须指出哪些完成标准应先进入 /tdd，哪些文档缺口最终应通过 /harness-audit 检查。
```

讲解重点：

- 不能只改 workflow 文件
- release 和 review 文档必须同步承接新的治理结果

### Step 4. 用 `/tdd` 讲“先定义治理完成标准”

建议输入：

```text
/tdd
基于当前 /team-plan 结果，先定义本轮供应链治理的完成标准。
至少覆盖：
1. workflow lint 与权限基线通过
2. release 阶段有 SBOM、attestation 或等价证明
3. review 结论记录风险、例外与阻塞项
4. release 记录包含 artifact、digest、签名或 provenance 信息
```

讲解重点：

- `/tdd` 在这里锁的是治理标准，不是业务测试代码
- 这样可以避免“改完了但说不清到底完成了什么”

### Step 5. 用 `/team-execute` 讲实际收敛动作

建议讲法：

```text
执行阶段通常会先调 workflow 和 permissions，再接入 SBOM、attestation、签名，最后补 review / release 的治理出口。
```

可展示材料：

- [scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)
- [sbom-generation-gates.md](sbom-generation-gates.md)
- [slsa-generator-patterns.md](slsa-generator-patterns.md)

### Step 6. 用 `/harness-audit` 讲平台体检的价值

建议输入：

```text
/harness-audit
请从 workflow 治理覆盖、权限边界、release 证据链、runbook 同步和最终校验五个方向审视当前仓库。
输出立即修补项、下一轮收敛项和建议回写位置。
```

讲解重点：

- audit 不是重复 review，而是检查治理出口是否形成闭环
- 特别适合 workflow 和 runbook 同时变动的场景

### Step 7. 用 review 与 release 收尾

建议讲法：

```text
最终交付不是“workflow 能跑了”，而是 review 能解释风险，release 能解释证据链。
```

## 5. 建议演示顺序

1. 先展示 workflow / permissions / evidence 三层边界
2. 再展示 `/team-intake` 与 `/team-plan`
3. 然后讲 `/tdd`
4. 再讲 `/team-execute`
5. 最后讲 `/harness-audit`、`/team-review` 和 `/team-release`

## 6. 演示后建议发给观众的材料

- [github-actions-supply-chain-demo-execution-log.md](github-actions-supply-chain-demo-execution-log.md)
- [github-actions-supply-chain-walkthrough.md](github-actions-supply-chain-walkthrough.md)
- [../../examples/github-actions-supply-chain-CLAUDE.md](../../examples/github-actions-supply-chain-CLAUDE.md)
