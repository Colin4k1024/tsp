# Vertical Project Conversation Scripts

这份脚本集面向多类更垂直的项目：GitHub Actions / 供应链治理仓库、AI / Eval 平台、移动端 / 小程序项目，以及 IaC、插件、数据、合规、内部平台与数据质量场景。

它和 [project-type-starter-playbook.md](project-type-starter-playbook.md) 的区别是：那份文件给你第一句话，这份文件给你一小段可连续发出的对话脚本。

## 场景 1：GitHub Actions / 供应链治理仓库

### Claude 连续脚本

```text
请按 Team Skills Platform 工作模型处理当前 CI/CD 与供应链治理任务。
先执行 /team-intake，重点锁定 workflow 变更范围、权限边界、attestation / SBOM / 签名要求和最终收口方式。

任务背景：
- 目标：重构 GitHub Actions 发布链路并补齐供应链门禁
- 范围：workflow、permissions、attestation、SBOM、签名、review 说明
- 不做：业务服务代码改造
- 约束：必须区分 actionlint、scorecard、token 权限、SLSA 和 artifact attestation 的边界
```

```text
基于当前 intake 结果继续执行 /team-plan。
请拆 workflow 结构调整、权限治理、发布证据链和校验收口动作，并指出哪些完成标准应先进入 /tdd。
```

```text
/harness-audit
请从命令覆盖、runbook 同步、workflow 治理入口、发布证据链和最终校验五个方向审视当前平台或仓库。
输出立即修补项、下一轮收敛项和建议回写位置。
```

### Codex 连续脚本

```text
/team-intake
目标：重构 GitHub Actions 发布链路并补齐供应链门禁
范围：workflow、permissions、attestation、SBOM、签名、review 说明
不做：业务服务代码改造
约束：区分 actionlint、scorecard、token 权限、SLSA 和 artifact attestation 的边界
```

```text
/team-plan
基于当前 intake 结果，拆 workflow 结构调整、权限治理、发布证据链和校验收口动作。
指出哪些事项应先进入 /tdd，哪些缺口最终应通过 /harness-audit 验证。
```

```text
/team-review
基于当前治理结论，整理 workflow 风险、供应链阻塞项、可接受例外和发布前检查建议。
```

## 场景 2：AI / Eval 平台

### Claude 连续脚本

```text
请按 Team Skills Platform 工作模型处理当前 AI / Eval 平台任务。
先执行 /team-intake，重点锁定 eval 目标、grader 口径、样本范围、pass@k 和成本边界。

任务背景：
- 目标：为问答 Agent 新增评测闭环与回归基线
- 范围：eval case、grader、执行脚本、结果汇总、测试计划
- 不做：业务 UI 重构
- 约束：必须明确 pass@k、grader 口径、样本范围和成本边界
```

```text
/tdd
基于当前需求，先定义 grader、样本范围、成功阈值和回归边界。
如果适合 eval-driven development，也请说明哪些环节应搭配 eval-harness。
```

```text
/verify
请基于当前实现与评测结果，输出回归结论、关键风险、是否达到当前 pass@k 基线，以及还缺哪些验证证据。
```

### Codex 连续脚本

```text
/team-intake
目标：为问答 Agent 新增评测闭环与回归基线
范围：eval case、grader、执行脚本、结果汇总、测试计划
不做：业务 UI 重构
约束：明确 pass@k、grader 口径、样本范围和成本边界
```

```text
/team-plan
基于 intake 结果，拆 grader 定义、样本准备、实现动作、验证动作和结果回写路径。
```

```text
/tdd
先锁定 grader、样本范围、成功阈值和回归边界，并整理成可直接进入 /team-execute 的动作清单。
```

## 场景 3：移动端 / 小程序项目

### Claude 连续脚本

```text
请按 Team Skills Platform 工作模型处理当前移动端 / 小程序任务。
先执行 /team-intake，重点锁定终端范围、弱网、权限路径、多尺寸适配和验证要求。

任务背景：
- 目标：新增移动端报销申请页与提交流程
- 范围：页面布局、表单交互、终端权限、测试计划
- 不做：后端流程改造
- 约束：必须说明多尺寸适配、弱网、授权路径、拒绝态和加载反馈
```

```text
/tdd
基于当前需求，先锁机型范围、弱网场景、权限拒绝态、空态/异常态和成功标准。
```

```text
/multi-frontend
基于当前 intake 或 tdd 结果，从交互体验、终端适配、QA 风险三个视角并行拆解，并整理成可直接进入 /handoff 的内容。
```

### Codex 连续脚本

```text
/team-intake
目标：新增移动端报销申请页与提交流程
范围：页面布局、表单交互、终端权限、测试计划
不做：后端流程改造
约束：说明多尺寸适配、弱网、授权路径、拒绝态和加载反馈
```

```text
/team-plan
基于 intake 结果，拆解前端实现、终端适配、QA 回归和 handoff 节点。
```

```text
/multi-frontend
基于当前结论，从交互体验、终端适配、QA 风险三个视角并行分析，并整理为正式 /handoff。
```

## 建议阅读路径

- 先看对应项目模板：`github-actions-supply-chain-CLAUDE.md`、`ai-eval-platform-CLAUDE.md`、`mobile-miniapp-CLAUDE.md`
- 再看 [project-type-starter-playbook.md](project-type-starter-playbook.md)
- 如果要按角色补局部收口，再看 [role-conversation-scripts.md](role-conversation-scripts.md)

## 场景 4：IaC / Kubernetes 平台仓库

### Claude 连续脚本

```text
请按 Team Skills Platform 工作模型处理当前 IaC / Kubernetes 平台任务。
先执行 /team-intake，重点锁定 chart、schema、policy、server-side dry-run 和 release 基线。

任务背景：
- 目标：补齐 Kubernetes 平台仓库的 chart、schema、policy 和发布门禁
- 范围：Helm Chart、manifest、policy、验证脚本、release 说明
- 不做：业务服务逻辑改造
- 约束：必须区分 helm unittest、kubeconform、conftest/kyverno 和 server-side dry-run 的边界
```

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出 chart 变更、schema 校验、policy 校验、server-side 预检和 release 收口动作，并指出哪些完成标准应先进入 /tdd。
```

```text
/verify
请基于当前 IaC 变更，输出 chart 渲染、schema、policy、server-side 预检结果、环境风险和可直接进入 /team-review 或 /team-release 的结论。
```

### Codex 连续脚本

```text
/team-intake
目标：补齐 Kubernetes 平台仓库的 chart、schema、policy 和发布门禁
范围：Helm Chart、manifest、policy、验证脚本、release 说明
不做：业务服务逻辑改造
约束：区分 helm unittest、kubeconform、conftest/kyverno 和 server-side dry-run 的边界
```

```text
/team-plan
基于 intake 结果，拆解 chart 变更、schema 校验、policy 校验、server-side 预检和 release 收口动作。
```

```text
/verify
请汇总 chart 渲染、schema、policy 与 server-side 预检结果，并整理成可直接进入 /team-review 或 /team-release 的结论。
```

## 场景 5：插件 / 扩展仓库

### Claude 连续脚本

```text
请按 Team Skills Platform 工作模型处理当前插件 / 扩展仓库任务。
先执行 /team-intake，重点锁定宿主集成点、命令面、配置面、安装路径和兼容矩阵。

任务背景：
- 目标：为插件仓库新增命令入口并补齐安装、配置与兼容性说明
- 范围：命令、配置项、集成点、安装文档、测试计划
- 不做：无关业务服务改造
- 约束：必须说明宿主版本边界、升级路径、禁用态和失败回退行为
```

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出命令入口、配置项、宿主集成、安装路径、兼容矩阵和验证收口动作，并指出哪些完成标准应先进入 /tdd。
```

```text
/verify
请基于当前插件改动，输出命令入口、配置项、安装路径和兼容性验证结果，并整理成可直接进入 /team-review 的结论。
```

### Codex 连续脚本

```text
/team-intake
目标：为插件仓库新增命令入口并补齐安装、配置与兼容性说明
范围：命令、配置项、集成点、安装文档、测试计划
不做：无关业务服务改造
约束：说明宿主版本边界、升级路径、禁用态和失败回退行为
```

```text
/team-plan
基于 intake 结果，拆解命令入口、配置项、宿主集成、安装路径、兼容矩阵和验证收口动作。
```

```text
/verify
请汇总命令入口、配置项、安装路径和兼容性验证结果，并整理成可直接进入 /team-review 的结论。
```

## 场景 6：数据 / ML pipeline 仓库

### Claude 连续脚本

```text
请按 Team Skills Platform 工作模型处理当前数据 / ML pipeline 任务。
先执行 /team-intake，重点锁定数据口径、批处理窗口、失败重试、回填范围和下游影响。

任务背景：
- 目标：为数据流水线新增特征计算任务并补齐质量与回填验证
- 范围：任务编排、转换逻辑、质量校验、结果汇总、测试计划
- 不做：分析台 UI 改造
- 约束：必须说明数据口径、批处理窗口、失败重试、回填范围和下游影响
```

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出任务编排、数据质量、异常样本、回填影响和 release 收口动作，并指出哪些完成标准应先进入 /tdd。
```

```text
/verify
请基于当前 pipeline 改动，输出任务结果、数据质量、异常样本、回填影响和成本窗口，并整理成可直接进入 /team-review 或 /team-release 的结论。
```

### Codex 连续脚本

```text
/team-intake
目标：为数据流水线新增特征计算任务并补齐质量与回填验证
范围：任务编排、转换逻辑、质量校验、结果汇总、测试计划
不做：分析台 UI 改造
约束：说明数据口径、批处理窗口、失败重试、回填范围和下游影响
```

```text
/team-plan
基于 intake 结果，拆解任务编排、数据质量、异常样本、回填影响和验证收口动作。
```

```text
/verify
请汇总任务结果、数据质量、异常样本、回填影响和成本窗口，并整理成可直接进入 /team-review 或 /team-release 的结论。
```

## 场景 7：安全 / 合规平台仓库

### Claude 连续脚本

```text
请按 Team Skills Platform 工作模型处理当前安全 / 合规平台任务。
先执行 /team-intake，重点锁定安全门禁范围、权限边界、例外管理和最终放行条件。

任务背景：
- 目标：补齐安全基线与合规审计仓库的门禁、证据和放行规则
- 范围：安全扫描、权限基线、例外管理、release 说明、测试计划
- 不做：无关业务功能改造
- 约束：必须区分阻塞风险、可接受例外、观察项和最终放行条件
```

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出安全门禁、权限边界、例外管理、审计证据和 release 收口动作，并指出哪些完成标准应先进入 /tdd。
```

```text
/verify
请基于当前安全改动，输出门禁结果、权限风险、例外项、审计证据和可直接进入 /team-review 或 /team-release 的结论。
```

### Codex 连续脚本

```text
/team-intake
目标：补齐安全基线与合规审计仓库的门禁、证据和放行规则
范围：安全扫描、权限基线、例外管理、release 说明、测试计划
不做：无关业务功能改造
约束：区分阻塞风险、可接受例外、观察项和最终放行条件
```

```text
/team-plan
基于 intake 结果，拆解安全门禁、权限边界、例外管理、审计证据和 release 收口动作。
```

```text
/team-review
基于当前治理结论，整理阻塞风险、可接受例外、观察项、审计证据和放行前检查建议。
```

## 场景 8：内部开发者平台

### Claude 连续脚本

```text
请按 Team Skills Platform 工作模型处理当前内部开发者平台任务。
先执行 /team-intake，重点锁定开发者入口、模板行为、失败兜底和发布前提。

任务背景：
- 目标：为内部开发者平台新增自助交付入口并补齐模板、验证和发布说明
- 范围：门户入口、平台 API、模板行为、测试计划、release 说明
- 不做：无关业务系统改造
- 约束：必须说明失败兜底、人工介入路径、权限边界和发布前提
```

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出门户入口、平台 API、模板行为、失败兜底、人工介入和 handoff 收口动作，并指出哪些完成标准应先进入 /tdd。
```

```text
/handoff
请把当前平台实现与验证结果整理成可直接交给 QA、DevOps 或下一角色的结构化内容，明确入口行为、失败兜底、已验证范围和剩余风险。
```

### Codex 连续脚本

```text
/team-intake
目标：为内部开发者平台新增自助交付入口并补齐模板、验证和发布说明
范围：门户入口、平台 API、模板行为、测试计划、release 说明
不做：无关业务系统改造
约束：说明失败兜底、人工介入路径、权限边界和发布前提
```

```text
/team-plan
基于 intake 结果，拆解门户入口、平台 API、模板行为、失败兜底、人工介入和 handoff 收口动作。
```

```text
/team-release
基于当前平台结论，整理入口上线前提、失败兜底、人工介入路径和发布建议。
```

## 场景 9：数据可观测性 / 质量平台

### Claude 连续脚本

```text
请按 Team Skills Platform 工作模型处理当前数据可观测性 / 质量平台任务。
先执行 /team-intake，重点锁定规则口径、异常阈值、告警路径和处置责任。

任务背景：
- 目标：为数据可观测性平台新增质量规则并补齐告警与修复闭环
- 范围：规则定义、异常检测、告警通道、结果汇总、测试计划
- 不做：无关分析台 UI 改造
- 约束：必须说明规则口径、误报/漏报风险、告警责任和处置路径
```

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出规则定义、异常检测、告警路径、误报/漏报验证和 review 收口动作，并指出哪些完成标准应先进入 /tdd。
```

```text
/verify
请基于当前质量规则改动，输出异常检测结果、误报/漏报、告警有效性和可直接进入 /team-review 的结论。
```

### Codex 连续脚本

```text
/team-intake
目标：为数据可观测性平台新增质量规则并补齐告警与修复闭环
范围：规则定义、异常检测、告警通道、结果汇总、测试计划
不做：无关分析台 UI 改造
约束：说明规则口径、误报/漏报风险、告警责任和处置路径
```

```text
/team-plan
基于 intake 结果，拆解规则定义、异常检测、告警路径、误报/漏报验证和 review 收口动作。
```

```text
/team-review
基于当前结论，整理规则有效性、误报/漏报、告警责任和推广建议。
```

## 更新后的建议阅读路径

- 先看对应项目模板：`github-actions-supply-chain-CLAUDE.md`、`ai-eval-platform-CLAUDE.md`、`mobile-miniapp-CLAUDE.md`、`iac-kubernetes-platform-CLAUDE.md`、`plugin-extension-platform-CLAUDE.md`、`data-ml-pipeline-CLAUDE.md`、`security-compliance-platform-CLAUDE.md`、`internal-developer-platform-CLAUDE.md`、`data-observability-quality-CLAUDE.md`
- 再看 [project-type-starter-playbook.md](project-type-starter-playbook.md)
- 如果要按材料成熟度和讲解目标选入口，再看 [../docs/presentation/vertical-scenario-route-map.md](../docs/presentation/vertical-scenario-route-map.md)
- 如果要按表格确认当前 vertical 已补齐哪些材料，再看 [../docs/runbooks/vertical-scenario-capability-matrix.md](../docs/runbooks/vertical-scenario-capability-matrix.md)
- 如果要按角色补局部收口，再看 [role-conversation-scripts.md](role-conversation-scripts.md)
