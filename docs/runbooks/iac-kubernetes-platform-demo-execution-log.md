---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# IaC 与 Kubernetes 平台演示执行记录

本文记录一条 IaC / Kubernetes 平台演示路径，重点展示团队如何把 chart、schema、policy、server-side 预检和发布收口串成可解释的治理链路。

## 1. 场景定义

### 背景

- 仓库当前主要维护 Helm Chart、manifest、policy 与环境发布配置
- 过去门禁零散存在，但缺少统一的分层说明和 release 收口
- 团队希望把 IaC 变更从“能跑”升级成“可验证、可回滚、可复盘”

### 演示目标

- 让观众理解四层验证边界
- 让观众看到 `/tdd` 如何前置定义完成标准
- 让观众看到 `/verify` 如何把零散结果汇总成正式结论

## 2. 阶段 1：/team-intake

### 输入

```text
/team-intake
目标：补齐 Kubernetes 平台仓库的 chart、schema、policy 和发布门禁
范围：Helm Chart、manifest、policy、验证脚本、release 说明
不做：业务服务逻辑改造
约束：必须区分 helm unittest、kubeconform、conftest/kyverno 和 server-side dry-run 的边界
```

### 产出

| 字段 | 内容 |
|------|------|
| 任务类型 | IaC / 平台治理 |
| 主体对象 | chart、manifest、policy、release 基线 |
| 主要风险 | 环境范围不清、验证层混淆、回滚路径缺失 |
| 收口要求 | review 与 release 必须承接分层验证结论 |

## 3. 阶段 2：/team-plan

### 拆解结果

| 模块 | 动作 | 收口位置 |
|------|------|----------|
| Chart 层 | 调整模板与 values | chart |
| Schema 层 | 校验渲染后 manifest 结构 | CI / verify |
| Policy 层 | 校验组织级规则 | CI / review |
| Server-side | 做 API server 预检 | verify / release |
| 发布层 | 记录环境范围与回滚方式 | release |

### 关键判断

- `helm-unittest` 解决 chart 渲染意图
- `kubeconform` 解决 manifest schema
- `conftest/kyverno` 解决 policy
- `kubectl --dry-run=server` 解决接收性预检

## 4. 阶段 3：/tdd

### 定义的完成标准

```text
1. chart、schema、policy、server-side 四层验证边界明确
2. verify 能汇总四层结果
3. review 结论能记录阻塞项与例外
4. release 记录能说明环境范围与回滚方式
5. 仓库校验通过
```

## 5. 阶段 4：/team-execute

### 执行批次

#### 批次 A：chart 与 values

- 调整模板逻辑
- 补 chart 单测或快照

#### 批次 B：schema 与 policy

- 补 schema 校验
- 补 policy 校验与例外说明

#### 批次 C：server-side 与发布

- 补 server-side 预检
- 更新 release 与回滚记录

## 6. 阶段 5：/verify

### Verify 结果

| 检查项 | 判断 |
|--------|------|
| Chart 渲染 | 已确认 |
| Schema 校验 | 已确认 |
| Policy 校验 | 已确认 |
| Server-side 预检 | 已确认 |
| 发布收口 | 已确认 |

## 7. 阶段 6：/team-review 与 /team-release

### Review 结论

- 当前阻塞项已按分层验证归类
- 例外项有明确解释，不再混入统一结论

### Release 结论

- 发布记录明确环境范围、依赖条件和回滚方式
- 一旦异常，可快速定位是 chart、policy 还是发布预检问题

## 8. 校验结果

### 文档静态检查

- 本轮新增 walkthrough、demo script 与 execution log 无错误

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

- [iac-kubernetes-platform-demo-script.md](iac-kubernetes-platform-demo-script.md)
- [iac-kubernetes-platform-walkthrough.md](iac-kubernetes-platform-walkthrough.md)
- [../../examples/iac-kubernetes-platform-CLAUDE.md](../../examples/iac-kubernetes-platform-CLAUDE.md)
