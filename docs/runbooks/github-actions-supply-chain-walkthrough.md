---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# GitHub Actions 与供应链治理演练

本文演示一个以 GitHub Actions、权限治理和供应链门禁为核心的仓库，如何从治理目标拆解到 workflow 调整、证据链回写和发布收口。

## 1. 场景

- 仓库当前使用 GitHub Actions 承担构建、测试、发布
- 团队准备补齐 actionlint、scorecard、token 权限、SBOM、attestation 和签名链路
- 目标不是改业务代码，而是把 workflow 与供应链基线治理成可审计状态

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/team-execute`
5. `/harness-audit`
6. `/team-review`
7. `/team-release`

## 3. 第一步：/team-intake

### 输入示例

```text
/team-intake
目标：重构 GitHub Actions 发布链路并补齐供应链门禁
范围：workflow、permissions、attestation、SBOM、签名、review 说明
不做：业务服务代码改造
约束：必须区分 actionlint、scorecard、token 权限、SLSA 和 artifact attestation 的边界
```

### 期望输出重点

- 识别这是平台治理 / 供应链治理任务，而不是业务功能任务
- 明确参与角色至少包括 `tech-lead`、`architect`、`qa-engineer`、`devops-engineer`
- 风险应聚焦 workflow 误配、权限过宽、证据链缺失和发布不可追溯

## 4. 第二步：/team-plan

### 需要拆清的动作

- workflow 结构调整
- token 权限收敛
- actionlint / scorecard / zizmor 等门禁的分层接入
- SBOM、attestation、签名、SLSA 的发布证据链回写
- handoff、review 和 release 中的治理记录位置

### 合格输出应该回答

1. 哪些 workflow 调整是结构问题
2. 哪些是权限问题
3. 哪些是供应链证据问题
4. 最终如何进入 `/team-review` 和 `/team-release`

## 5. 第三步：/tdd

在这类仓库里，`/tdd` 重点不是业务测试，而是先锁完成标准：

- workflow lint、权限治理和 attestation 的边界是否说清
- 哪些证据必须进入 review 结果
- 哪些证据必须进入 release 记录
- validate / build / release 链路是否有清晰回退路径

## 6. 第四步：/team-execute

执行阶段通常包含：

- 调整 workflow YAML
- 收紧 job 级 `permissions`
- 接入 actionlint、scorecard、token 权限基线、SLSA 或 attestation
- 更新 runbook、review 说明和 release 检查项

本阶段输出至少应包含：

- workflow 变更摘要
- 影响范围
- 校验结果
- 剩余风险和例外项

## 7. 第五步：/harness-audit

这里的 audit 重点不是业务功能，而是平台入口和治理链是否同步：

- 新增 workflow 治理要求是否进入 runbook
- review/release 是否已经能承接供应链证据
- examples、quick start 或 usage 文档是否需要补入口

## 8. 第六步：/team-review 与 /team-release

### Review 阶段要回答

- 当前有哪些阻塞的 workflow 或权限风险
- 哪些例外可以暂时接受
- 哪些供应链门禁已形成证据链

### Release 阶段要回答

- 哪些 artifact 会生成 SBOM / attestation / 签名
- 哪些 workflow、runner、commit 和 digest 需要被记录
- 出现发布异常时如何快速回退到上一套 workflow / 发布配置

## 9. 常见错误

- 把 actionlint、scorecard、permissions、SLSA 混成同一层结论
- 只改 workflow，不回写 review 或 release 结论
- 生成了 attestation 或 SBOM，但没有放到可追溯位置

建议配合阅读：[actionlint-workflow-gates.md](actionlint-workflow-gates.md)、[scorecard-supply-chain-gates.md](scorecard-supply-chain-gates.md)、[github-token-permissions-baseline.md](github-token-permissions-baseline.md)、[artifact-attestation-gates.md](artifact-attestation-gates.md)、[slsa-generator-patterns.md](slsa-generator-patterns.md)
