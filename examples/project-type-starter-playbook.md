# Project Type Starter Playbook

这份示例集只回答一个问题：如果你已经知道项目类型，Claude 或 Codex 的第一段话应该怎么发。

它和项目级 `CLAUDE.md` 模板的区别是：模板负责长期约定，这份 playbook 负责第一次起手。

## 快速选择

| 项目类型 | Claude 起手 | Codex 起手 | 何时用 |
|----------|-------------|------------|--------|
| 流程型企业项目 | `/team-intake` -> `/team-plan` | `/team-intake` -> `/team-plan` -> `/tdd` | 长期命中私有流程、权限或观测扩展 |
| 平台治理仓库 | `/team-intake` -> `/team-plan` -> `/harness-audit` | `/team-intake` -> `/team-plan` -> `/tdd` -> `/harness-audit` | 仓库主要产出命令、skills、rules、docs、hooks |
| 数据看板项目 | `/team-intake` -> `/team-plan` -> `/multi-frontend` | `/team-intake` -> `/team-plan` -> `/multi-frontend` | 指标口径、图表交互、查询性能和导出边界是重点 |
| GitHub Actions / 供应链治理仓库 | `/team-intake` -> `/team-plan` | `/team-intake` -> `/team-plan` -> `/harness-audit` | 重点是 workflow、permissions、attestation、SBOM、签名 |
| AI / Eval 平台 | `/team-intake` -> `/tdd` | `/team-intake` -> `/team-plan` -> `/tdd` | 重点是 grader、pass@k、评测闭环和成本边界 |
| 移动端 / 小程序项目 | `/team-intake` -> `/tdd` -> `/multi-frontend` | `/team-intake` -> `/team-plan` -> `/multi-frontend` | 重点是多终端、弱网、权限和交互反馈 |
| IaC / Kubernetes 平台仓库 | `/team-intake` -> `/team-plan` -> `/verify` | `/team-intake` -> `/team-plan` -> `/tdd` -> `/verify` | 重点是 chart、schema、policy、dry-run 与 release 基线 |
| 插件 / 扩展仓库 | `/team-intake` -> `/team-plan` -> `/verify` | `/team-intake` -> `/team-plan` -> `/tdd` -> `/verify` | 重点是宿主集成点、命令面、配置面和安装兼容性 |
| 数据 / ML pipeline 仓库 | `/team-intake` -> `/team-plan` -> `/verify` | `/team-intake` -> `/team-plan` -> `/tdd` -> `/verify` | 重点是数据口径、批处理窗口、质量校验和回填风险 |
| 安全 / 合规平台仓库 | `/team-intake` -> `/team-plan` -> `/verify` | `/team-intake` -> `/team-plan` -> `/tdd` -> `/verify` | 重点是门禁分层、权限边界、审计证据和放行规则 |
| 内部开发者平台 | `/team-intake` -> `/team-plan` -> `/handoff` | `/team-intake` -> `/team-plan` -> `/tdd` -> `/handoff` | 重点是开发者入口、模板行为、失败兜底和发布前提 |
| 数据可观测性 / 质量平台 | `/team-intake` -> `/team-plan` -> `/verify` | `/team-intake` -> `/team-plan` -> `/tdd` -> `/verify` | 重点是规则口径、异常阈值、告警路径和修复闭环 |

## 场景 1：流程型企业项目

### Claude 起手

```text
请按 Team Skills Platform 工作模型处理当前流程型企业项目需求。
先执行 /team-intake，重点锁定目标、范围、风险、参与角色，以及是否需要启用 custom overlay。

任务背景：
- 目标：新增请假审批流程的发起、待办查询和节点审批能力
- 范围：流程接口、权限校验、测试计划、发布观察要求
- 不做：流程模型重设计、历史实例迁移
- 约束：需要区分 overlay 正式启用项与仅按兼容 runbook 使用的能力
```

然后继续：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出 architect、backend-engineer、qa-engineer、devops-engineer 的职责、依赖和 handoff 节点。
如果流程和权限边界返工成本高，再整理一版可直接进入 /tdd 的最小上下文。
```

### Codex 起手

```text
/team-intake
目标：新增请假审批流程的发起、待办查询和节点审批能力
范围：流程接口、权限校验、测试计划、发布观察要求
不做：流程模型重设计、历史实例迁移
约束：判断 custom overlay 与私有观测能力是否需要启用
```

```text
/team-plan
基于 intake 结果，拆 architect、backend-engineer、qa-engineer、devops-engineer 的职责、依赖和 handoff 节点。
明确哪些能力是 overlay 正式装配，哪些只按兼容 runbook 使用。
```

```text
/tdd
基于当前 /team-plan 结果，先锁流程状态约束、节点操作边界、权限异常路径和完成标准。
输出 red-green-refactor 路径，并整理成可直接进入 /team-execute 的动作清单。
```

继续阅读：看 [workflow-enterprise-CLAUDE.md](workflow-enterprise-CLAUDE.md) 和 [enterprise-overlay-scenario-playbook.md](enterprise-overlay-scenario-playbook.md)。

## 场景 2：平台治理仓库

### Claude 起手

```text
请按 Team Skills Platform 工作模型处理当前平台治理任务。
先执行 /team-intake，重点说明近期新增命令、skills、hooks、runtime 与文档入口是否同步。

任务背景：
- 目标：重审平台新增能力，并补齐文档、示例、演示材料和角色手册
- 范围：README、quick start、runbooks、examples、presentation、校验链路
- 不做：业务功能开发
- 约束：保留历史快照文档，不把历史记录改写成 evergreen 说明
```

然后继续：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出入口文档、次级模板、角色手册、演示材料和最终校验的动作清单，并指出哪些完成标准应先进入 /tdd，哪些缺口更适合最终用 /harness-audit 收口。
```

### Codex 起手

```text
/team-intake
目标：重审近期新增命令、skills、hooks、runtime 与文档入口是否同步
范围：README、quick start、runbooks、examples、presentation、校验链路
不做：业务功能开发
约束：保留历史快照文档，不把历史记录改写成 evergreen 说明
```

```text
/team-plan
基于当前 intake 结果，拆解文档刷新、示例补齐、角色手册同步、演示材料补齐和最终校验的动作清单。
指出哪些事项应先进入 /tdd，哪些事项最终应通过 /harness-audit 验证。
```

```text
/harness-audit
请从命令覆盖、skills 完整度、hooks 有效性、文档同步和集成深度五个方向审视当前平台。
输出必须区分：立即修补、下一轮收敛、仅记录观察。
```

继续阅读：看 [platform-governance-CLAUDE.md](platform-governance-CLAUDE.md) 和 [../docs/runbooks/platform-capability-demo-script.md](../docs/runbooks/platform-capability-demo-script.md)。

## 场景 3：数据看板项目

### Claude 起手

```text
请按 Team Skills Platform 工作模型处理当前数据看板需求。
先执行 /team-intake，重点锁定指标口径、页面范围、查询性能、导出边界和验证要求。

任务背景：
- 目标：新增销售分析看板与指标查询接口
- 范围：图表布局、筛选器、查询接口、导出能力、测试计划
- 不做：底层数仓重构、历史指标回填
- 约束：必须写清指标口径、空态/异常态、导出权限和查询性能要求
```

然后继续：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出 frontend-engineer、backend-engineer、qa-engineer 的职责、依赖和 handoff 节点。
如果图表交互和查询边界返工成本高，再整理一版可直接进入 /tdd 的最小上下文。
```

### Codex 起手

```text
/team-intake
目标：新增销售分析看板与指标查询接口
范围：图表布局、筛选器、查询接口、导出能力、测试计划
不做：底层数仓重构、历史指标回填
约束：写清指标口径、空态/异常态、导出权限和查询性能要求
```

```text
/team-plan
基于 intake 结果，拆 frontend-engineer、backend-engineer、qa-engineer 的职责、依赖和 handoff 节点。
明确哪些口径、性能和导出边界要在实现前先锁定。
```

```text
/multi-frontend
基于当前 intake 或 plan，把图表体验、交互拆解、QA 风险三个视角并行分析。
必须指出空态、异常态、无权限态和慢加载态如何进入最终 handoff。
```

继续阅读：看 [data-analytics-dashboard-CLAUDE.md](data-analytics-dashboard-CLAUDE.md)。如果查询或聚合逻辑明显更重，再补看 [springboot-service-CLAUDE.md](springboot-service-CLAUDE.md)。

## 场景 4：IaC / Kubernetes 平台仓库

### Claude 起手

```text
请按 Team Skills Platform 工作模型处理当前 IaC / Kubernetes 平台任务。
先执行 /team-intake，重点锁定 chart、schema、policy、server-side dry-run 和 release 基线。

任务背景：
- 目标：补齐 Kubernetes 平台仓库的 chart、schema、policy 和发布门禁
- 范围：Helm Chart、manifest、policy、验证脚本、release 说明
- 不做：业务服务逻辑改造
- 约束：必须区分 helm unittest、kubeconform、conftest/kyverno 和 server-side dry-run 的边界
```

然后继续：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出 chart 变更、schema 校验、policy 校验、server-side 预检和 release 收口动作，并指出哪些完成标准应先进入 /tdd，哪些证据应最终进入 /verify。
```

### Codex 起手

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

继续阅读：看 [iac-kubernetes-platform-CLAUDE.md](iac-kubernetes-platform-CLAUDE.md)。

## 场景 5：插件 / 扩展仓库

### Claude 起手

```text
请按 Team Skills Platform 工作模型处理当前插件 / 扩展仓库任务。
先执行 /team-intake，重点锁定宿主集成点、命令面、配置面、安装路径和兼容矩阵。

任务背景：
- 目标：为插件仓库新增命令入口并补齐安装、配置与兼容性说明
- 范围：命令、配置项、集成点、安装文档、测试计划
- 不做：无关业务服务改造
- 约束：必须说明宿主版本边界、升级路径、禁用态和失败回退行为
```

然后继续：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出命令入口、配置项、宿主集成、安装路径、兼容矩阵和验证收口动作，并指出哪些完成标准应先进入 /tdd，哪些证据应最终进入 /verify。
```

### Codex 起手

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

继续阅读：看 [plugin-extension-platform-CLAUDE.md](plugin-extension-platform-CLAUDE.md)。

## 场景 6：数据 / ML pipeline 仓库

### Claude 起手

```text
请按 Team Skills Platform 工作模型处理当前数据 / ML pipeline 任务。
先执行 /team-intake，重点锁定数据口径、批处理窗口、失败重试、回填范围和下游影响。

任务背景：
- 目标：为数据流水线新增特征计算任务并补齐质量与回填验证
- 范围：任务编排、转换逻辑、质量校验、结果汇总、测试计划
- 不做：分析台 UI 改造
- 约束：必须说明数据口径、批处理窗口、失败重试、回填范围和下游影响
```

然后继续：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出任务编排、数据质量、异常样本、回填影响和 release 收口动作，并指出哪些完成标准应先进入 /tdd，哪些证据应最终进入 /verify。
```

### Codex 起手

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

继续阅读：看 [data-ml-pipeline-CLAUDE.md](data-ml-pipeline-CLAUDE.md)。

## 场景 7：安全 / 合规平台仓库

### Claude 起手

```text
请按 Team Skills Platform 工作模型处理当前安全 / 合规平台任务。
先执行 /team-intake，重点锁定安全门禁范围、权限边界、例外管理和最终放行条件。

任务背景：
- 目标：补齐安全基线与合规审计仓库的门禁、证据和放行规则
- 范围：安全扫描、权限基线、例外管理、release 说明、测试计划
- 不做：无关业务功能改造
- 约束：必须区分阻塞风险、可接受例外、观察项和最终放行条件
```

然后继续：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出安全门禁、权限边界、例外管理、审计证据和 release 收口动作，并指出哪些完成标准应先进入 /tdd，哪些证据应最终进入 /verify。
```

### Codex 起手

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
/verify
请汇总门禁结果、权限风险、例外项、审计证据和可直接进入 /team-review 或 /team-release 的结论。
```

继续阅读：看 [security-compliance-platform-CLAUDE.md](security-compliance-platform-CLAUDE.md)。

## 场景 8：内部开发者平台

### Claude 起手

```text
请按 Team Skills Platform 工作模型处理当前内部开发者平台任务。
先执行 /team-intake，重点锁定开发者入口、模板行为、失败兜底和发布前提。

任务背景：
- 目标：为内部开发者平台新增自助交付入口并补齐模板、验证和发布说明
- 范围：门户入口、平台 API、模板行为、测试计划、release 说明
- 不做：无关业务系统改造
- 约束：必须说明失败兜底、人工介入路径、权限边界和发布前提
```

然后继续：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出门户入口、平台 API、模板行为、失败兜底、人工介入和 handoff 收口动作，并指出哪些完成标准应先进入 /tdd。
```

### Codex 起手

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
/handoff
请把当前平台实现与验证结果整理成可直接交给 QA、DevOps 或下一角色的结构化内容，明确入口行为、失败兜底、已验证范围和剩余风险。
```

继续阅读：看 [internal-developer-platform-CLAUDE.md](internal-developer-platform-CLAUDE.md)。

## 场景 9：数据可观测性 / 质量平台

### Claude 起手

```text
请按 Team Skills Platform 工作模型处理当前数据可观测性 / 质量平台任务。
先执行 /team-intake，重点锁定规则口径、异常阈值、告警路径和处置责任。

任务背景：
- 目标：为数据可观测性平台新增质量规则并补齐告警与修复闭环
- 范围：规则定义、异常检测、告警通道、结果汇总、测试计划
- 不做：无关分析台 UI 改造
- 约束：必须说明规则口径、误报/漏报风险、告警责任和处置路径
```

然后继续：

```text
基于当前 intake 结果继续执行 /team-plan。
请拆出规则定义、异常检测、告警路径、误报/漏报验证和 review 收口动作，并指出哪些完成标准应先进入 /tdd，哪些证据应最终进入 /verify。
```

### Codex 起手

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
/verify
请汇总异常检测结果、误报/漏报、告警有效性和可直接进入 /team-review 的结论。
```

继续阅读：看 [data-observability-quality-CLAUDE.md](data-observability-quality-CLAUDE.md)。

## 使用建议

- 先选项目类型，再决定是否要把这些起手句并回项目级 `CLAUDE.md`
- 如果你还没确定项目类型，先回到 [INDEX.md](INDEX.md)
- 如果你要按命令而不是按项目类型找示例，回到 [claude-scenario-playbook.md](claude-scenario-playbook.md) 和 [codex-scenario-playbook.md](codex-scenario-playbook.md)
- 如果你已经要连续发几段脚本，而不是只发第一句话，再看 [vertical-project-conversation-scripts.md](vertical-project-conversation-scripts.md)
- 如果你想按材料成熟度决定先讲 demo 还是先接入模板，再看 [../docs/presentation/vertical-scenario-route-map.md](../docs/presentation/vertical-scenario-route-map.md)
- 如果你想按表格确认某个 vertical 现在是否已补齐 walkthrough、demo script 和 execution log，再看 [../docs/runbooks/vertical-scenario-capability-matrix.md](../docs/runbooks/vertical-scenario-capability-matrix.md)
