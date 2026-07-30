---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# IaC 与 Kubernetes 平台演练

本文演示一个以 Helm Chart、Kubernetes manifest、policy 和发布门禁为核心的仓库，如何从环境边界澄清、验证分层到 review / release 收口完整跑通。

## 1. 场景

- 仓库当前主要维护 Helm Chart、Kubernetes YAML、Policy 和发布配置
- 团队准备补齐 chart 渲染、schema 校验、policy 校验和 server-side dry-run 四层验证
- 目标不是改业务服务代码，而是把 IaC 变更治理成可分层解释、可发布、可回滚的状态

## 2. 推荐链路

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/team-execute`
5. `/verify`
6. `/team-review`
7. `/team-release`

## 3. 第一步：/team-intake

### 输入示例

```text
/team-intake
目标：补齐 Kubernetes 平台仓库的 chart、schema、policy 和发布门禁
范围：Helm Chart、manifest、policy、验证脚本、release 说明
不做：业务服务逻辑改造
约束：必须区分 helm unittest、kubeconform、conftest/kyverno 和 server-side dry-run 的边界
```

### 期望输出重点

- 识别这是 IaC / 平台治理任务，而不是普通后端需求
- 明确参与角色至少包括 `tech-lead`、`architect`、`qa-engineer`、`devops-engineer`
- 风险应聚焦环境范围不清、验证层次混淆、回滚路径缺失和发布窗口不明确

## 4. 第二步：/team-plan

### 需要拆清的动作

- chart 模板改动与 values 影响范围
- schema 校验与 manifest 结构验证
- policy 校验与组织级规则约束
- server-side dry-run 与 release 前预检
- review、release 和回滚记录位置

### 合格输出应该回答

1. 哪些问题属于 chart 层
2. 哪些属于 schema 层
3. 哪些属于 policy 层
4. 哪些属于 API server 接收层
5. 最终如何进入 `/team-review` 和 `/team-release`

## 5. 第三步：/tdd

在这类仓库里，`/tdd` 重点不是业务单测，而是先锁验证分层和完成标准：

- chart、schema、policy、server-side 四层边界是否说清
- 哪些验证结果必须进入 review
- 哪些结果必须进入 release 与回滚说明
- 失败时如何判断是模板问题、结构问题还是策略问题

## 6. 第四步：/team-execute

执行阶段通常包含：

- 调整 Helm Chart 或 manifest
- 补 Helm unittest、schema 校验与 policy 门禁
- 补 server-side dry-run 或等价发布前预检
- 更新 release 说明、回滚说明和 review 摘要

本阶段输出至少应包含：

- 变更摘要
- 影响环境
- 分层校验结果
- 剩余风险和例外项

## 7. 第五步：/verify

Verify 阶段要回答：

- chart 渲染是否符合预期
- manifest 是否通过 schema 校验
- policy 是否还有阻塞项
- server-side 预检是否通过
- 哪些风险仍需 release 阶段继续观察

## 8. 第六步：/team-review 与 /team-release

### Review 阶段要回答

- 当前阻塞项来自哪一层验证
- 哪些例外被暂时接受
- 哪些变更会影响环境或回滚复杂度

### Release 阶段要回答

- 哪些环境将被影响
- 回滚是回 chart、回 values 还是回 policy
- 发布窗口、依赖条件和失败时的退回路径是什么

## 9. 常见错误

- 把 Helm unittest、kubeconform、policy 和 dry-run 混成一个结论
- 只看 CI 通过，不记录环境范围和回滚方式
- 没把验证结果回写到 review / release

建议配合阅读：[helm-unittest-playbook.md](helm-unittest-playbook.md)、[kubeconform-schema-gates.md](kubeconform-schema-gates.md)、[conftest-policy-gates.md](conftest-policy-gates.md)、[kubectl-server-dry-run-gates.md](kubectl-server-dry-run-gates.md)
