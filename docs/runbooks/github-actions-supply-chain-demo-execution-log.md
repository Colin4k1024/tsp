---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# GitHub Actions 与供应链治理演示执行记录

本文记录一条以 GitHub Actions、权限治理与供应链证据链为核心的演示路径，重点展示团队如何把 workflow 门禁、发布证据和 release 收口串成一条可审计链路。

## 1. 场景定义

### 背景

- 仓库已经通过 GitHub Actions 承担构建与发布
- 但 workflow 权限、scorecard、SBOM、attestation、签名和 SLSA 还没有形成统一治理口径
- 团队希望把“安全门禁”从零散脚本升级为主链可解释、可复盘的治理任务

### 演示目标

- 让观众理解 workflow lint、权限收敛和供应链证据不是一回事
- 让观众看到 `/tdd` 如何前置定义治理完成标准
- 让观众看到 `/harness-audit` 如何检查文档、runbook 和 release 出口是否同步

## 2. 阶段 1：/team-intake

### 输入

```text
/team-intake
目标：补齐 GitHub Actions 发布链路的供应链门禁与证据记录
范围：workflow、permissions、scorecard、SBOM、attestation、签名、release 检查项
不做：业务服务逻辑改造
约束：必须说明 workflow lint、token 权限、provenance、artifact attestation 的边界
```

### 产出

| 字段 | 内容 |
|------|------|
| 任务类型 | 平台治理 / 供应链治理 |
| 主体对象 | workflow、permissions、artifact 证据链、release 手册 |
| 主要风险 | 权限过宽、证据链缺失、workflow 改动不可追溯 |
| 收口要求 | review 与 release 必须能承接供应链证据 |

## 3. 阶段 2：/team-plan

### 拆解结果

| 模块 | 动作 | 收口位置 |
|------|------|----------|
| Workflow 结构 | 调整 job、step、触发条件和复用关系 | workflow 文件 |
| 权限治理 | 收敛 `permissions`、减少默认写权限 | workflow 文件 + review |
| 供应链门禁 | 接入 actionlint、scorecard、SBOM、attestation、签名 | CI / release |
| 文档与 runbook | 更新治理入口和证据说明 | runbook / release 文档 |
| 最终验证 | 逐项检查门禁、证据与发布收口 | `/team-review`、`/team-release` |

### 关键判断

- `actionlint` 解决的是 workflow 结构与语法质量
- `scorecard` 和 token 权限基线解决的是仓库治理与权限风险
- `SBOM`、`attestation`、签名与 `SLSA` 解决的是发布证据链问题

## 4. 阶段 3：/tdd

### 定义的完成标准

```text
1. workflow lint 与权限基线通过
2. release 阶段能产出 SBOM、attestation 或等价证明
3. review 结论能明确记录 workflow 风险与例外
4. release 记录能落地 artifact、digest、签名或 provenance 信息
5. 仓库校验通过
```

### 价值说明

- 把治理任务的“完成”从主观感觉变成显式标准
- 避免只改 workflow 文件，不改 release 与 review 记录

## 5. 阶段 4：/team-execute

### 执行批次

#### 批次 A：workflow 基线

- 清理 workflow 结构问题
- 拆分过宽的 job 权限
- 接入 lint 与基础门禁

#### 批次 B：供应链证据

- 生成 SBOM
- 接入 attestation / provenance
- 补签名或 digest 记录

#### 批次 C：治理出口

- 更新 release 检查项
- 更新 review 结论模板
- 补 runbook 导航和落地说明

## 6. 阶段 5：/harness-audit

### 体检前缺口

- workflow 已改，但治理文档没有同步
- release 手册还没显式承接 attestation 和签名信息
- 观众容易把所有供应链门禁混成同一个概念

### 体检后收敛结果

| 维度 | 收敛动作 | 状态 |
|------|----------|------|
| Workflow 质量 | lint 与结构治理已明确 | 已补齐 |
| 权限治理 | token 权限边界有记录 | 已补齐 |
| 证据链 | SBOM、attestation、签名进入 release 说明 | 已补齐 |
| 导航入口 | 相关 runbook 与 walkthrough 已串起来 | 已补齐 |

## 7. 阶段 6：/team-review 与 /team-release

### Review 结论

- 风险分层已明确：workflow、权限、证据链分别检查
- 例外项必须进入 review，而不是留在口头说明

### Release 结论

- 发布记录必须包含 artifact、digest、SBOM、attestation 或签名信息
- 一旦 workflow 异常，回退步骤应绑定上一版本的 workflow / release 配置

## 8. 校验结果

### 文档静态检查

- 本轮新增 walkthrough 与 execution log 无错误

### 仓库校验

```text
Validation passed.
- Roles: 8
- Shared skills: 3
- ECC skills: 9
- Private overlay skills: not shipped in public repo
- Specialist agents: 27
- Generated artifacts: 70
```

## 9. 推荐搭配材料

- [github-actions-supply-chain-walkthrough.md](github-actions-supply-chain-walkthrough.md)
- [../../examples/github-actions-supply-chain-CLAUDE.md](../../examples/github-actions-supply-chain-CLAUDE.md)
- [../../examples/vertical-project-conversation-scripts.md](../../examples/vertical-project-conversation-scripts.md)
- [actionlint-workflow-gates.md](actionlint-workflow-gates.md)
- [scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)
