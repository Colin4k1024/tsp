# Team Command Output Contracts

本文定义 `/team-*` 主链命令的标准输出结构，解决“知道要产出什么，但不知道按什么格式交付”的问题。若任务未命中对应场景，可明确写 `未启用`、`不适用` 或省略该区块，但不要留空模糊描述。

## 使用规则

- `/team-*` 的标准输出是主链事实源，后续 handoff、评审和放行都以这里的结构为准。
- 命中了 private enterprise overlay，或使用了配套私有 runbook / overlay 时，必须把领域扩展结果回落到这里定义的字段，不允许只留在局部过程文件。
- 若字段依赖后续确认，应显式标记 `待确认`、给出责任角色和下一步动作。

## 工作阶段约定

主链使用以下阶段顺序：

1. `intake`
2. `requirement-challenge`
3. `design-swarm`
4. `design-review`
5. `handoff-ready`
6. `execute`
7. `review`
8. `release`
9. `closeout`

阶段切换规则：

- `intake` 产出 PRD 和初始风险，不直接进入实现。
- `requirement-challenge` 必须产出至少 3 个核心假设质疑结论。
- `design-swarm` 必须有按任务类型动态组装的参与角色。
- `design-review` 必须有 Design Review Board 结论。
- `handoff-ready` 必须有可执行 handoff，且下游质疑已开始或已记录。
- `execute` 只能在 `handoff-ready` 之后开始。
- `review`、`release` 和 `closeout` 必须消费前序阶段的证据，不得倒挂。
- `release` 必须留下发布结果、观察窗口和 residual risk，才能进入 `closeout`。
- `closeout` 负责结束观察窗口、确认最终验收状态，并把遗留项回写为 backlog 或后续动作。

## /team-intake

完整示例见 [team-intake-example.md](team-intake-example.md)。

### 上游质疑记录（Upstream Challenge Log）

tech-lead 收到需求背景后，必须对业务目标和范围提出质疑：

| 字段 | 说明 |
|------|------|
| `质疑内容` | 对上游输入提出的具体问题 |
| `质疑目标` | 上游的哪个产出被质疑（需求文档、业务目标、优先级等） |
| `结论` | 接受原方案 / 要求上游修改 / 升级给更高决策者 |
| `处理说明` | 修改内容或升级结果的简述 |

### 阶段元数据

`/team-intake` 还应显式记录：

| 字段 | 说明 |
|------|------|
| `当前阶段` | 固定为 `intake` |
| `目标阶段` | 目标通常为 `requirement-challenge` |
| `就绪状态` | 是否允许进入 challenge |
| `阻塞项` | 进入 challenge 前必须补齐的缺口 |

### 企业治理待确认项

建议至少包含以下字段：

| 字段 | 说明 |
|------|------|
| `是否企业内部应用` | 是 / 否 / 待确认 |
| `应用等级` | 已确认值，或注明待谁确认 |
| `技术架构等级` | 已确认值，或注明待谁确认 |
| `数据 / 合规风险` | 已知风险、未知点、责任人 |
| `集团组件 / 平台约束` | 是否命中集团 SDK、流程引擎、权限中心等约束 |

### 领域技能包启用建议

建议至少包含以下字段：

| 字段 | 说明 |
|------|------|
| `候选领域能力` | private enterprise overlay、runbook、overlay 或 toolkit 名称列表 |
| `触发原因` | 哪个业务线索或技术线索触发 |
| `启用方式` | 默认启用 / 进入 plan 后确认 / 暂不启用 |
| `下一步责任角色` | 谁在 `/team-plan` 里锁定最终装配结果 |

## /team-plan

完整示例见 [team-plan-example.md](team-plan-example.md)。

### 上游质疑记录（Upstream Challenge Log）

各角色在 `/team-plan` 阶段收到上游输入后，必须留下质疑记录：

| 字段 | 说明 |
|------|------|
| `角色` | 提出质疑的角色 |
| `质疑内容` | 对上游输入提出的具体问题 |
| `质疑目标` | 上游的哪个产出被质疑（PRD、技术方案、排期等） |
| `结论` | 接受 / 修改 / 升级 |
| `处理说明` | 简述 |

需求挑战会（Requirement Challenge Session）的质疑记录也归入此表。

### 动态分组讨论

`/team-plan` 必须输出动态分组结果：

| 字段 | 说明 |
|------|------|
| `参与角色` | 本次实际参与挑战与设计讨论的角色列表 |
| `触发原因` | 为什么这些角色被拉入 |
| `必须质疑的假设` | 每个角色至少要挑战的核心假设 |
| `收口结论` | tech-lead 对讨论结果的冻结决定 |
| `设计阶段切分` | 哪些内容进入 `design-swarm`，哪些内容进入 `design-review` |

### Implementation Readiness

`/team-plan` 在进入 `handoff-ready` 之前，应显式记录 execute 准入结果：

| 字段 | 说明 |
|------|------|
| `目标阶段` | 固定为 `execute` |
| `校验命令` | 推荐记录 `npm run workflow:readiness -- --phase execute --task-dir ...` 或等价校验方式 |
| `校验结论` | 通过 / 不通过 |
| `readiness proof` | challenge、design-review、handoff、artifact 完整性的证据摘要 |
| `阻塞项` | 未满足 execute pre-flight gate 的缺口 |
| `下一步责任角色` | 由谁补齐阻塞项 |

### Brownfield Context Snapshot

当任务基于既有项目推进时，`/team-plan` 应至少补齐：

| 字段 | 说明 |
|------|------|
| `现有模块` | 当前系统的主要模块、目录或服务边界 |
| `外部依赖` | 已接入的第三方系统、消息、数据库或平台能力 |
| `历史约束` | 需要兼容的旧协议、旧数据、运行时限制 |
| `缺失文档` | 当前最影响推进的文档空白 |
| `改造边界` | 本次明确要改和不改的区域 |

### Story Slice Plan

进入 `/team-execute` 前，`/team-plan` 应把工作切成可独立验收的 story-sized execution units：

| 字段 | 说明 |
|------|------|
| `slice 名称` | 该执行单元的名字 |
| `目标` | 本 slice 解决什么问题 |
| `验收标准` | 可验证完成条件 |
| `依赖` | 必须先满足的前置条件 |
| `owner` | 当前主责角色 |
| `handoff 终点` | 本 slice 完成后交给谁 |

### 技能装配清单

建议按三层输出：

| 层级 | 技能 | 启用方式 | 触发原因 | 主责角色 |
|------|------|----------|----------|----------|
| `shared` | 如 `api-contract` | 默认 / 按场景 | 需求、方案、测试、发布等共性能力 | 角色名 |
| `ecc` | 如 `maven-qa` | 默认 / 按场景 | 深度工程执行或验证 | 角色名 |
| `enterprise` | 如 `enterprise overlay` | 按场景 | 私有企业领域约束 | 角色名 |

要求：

- 若未启用 private enterprise overlay，也要显式说明 `enterprise: 未启用`；若只启用配套私有 runbook / overlay，也要单独写明。
- private enterprise overlay 或配套领域资料一旦启用，后续 `/team-execute`、`/team-review`、`/team-release` 必须承接对应记录。

### 文档架构映射字段（启用 `doc-architecture` 时建议填写）

| 字段 | 说明 |
|------|------|
| `Project Profile Card` | 项目名、技术栈、架构风格、部署平台、API 风格 |
| `Service Catalog` | 服务名、域类型、数据存储、通信模式 |
| `Communication Matrix` | source -> target -> protocol -> contract |
| `NFR Summary` | 可用性、延迟、吞吐、安全、观测等目标与度量 |
| `Artifact Mapping` | 上述内容分别回落到哪些 artifact 文件 |

## /team-execute

完整示例见 [team-execute-example.md](team-execute-example.md)。

### 上游质疑记录（Upstream Challenge Log）

前后端工程师在收到架构方案与设计规范后，必须留下质疑记录：

| 字段 | 说明 |
|------|------|
| `角色` | 提出质疑的角色（frontend-engineer / backend-engineer） |
| `质疑内容` | 对上游方案的具体质疑 |
| `质疑目标` | 架构方案 / 接口契约 / UI Design Spec / 数据模型 |
| `结论` | 接受 / 修改 / 升级 |
| `处理说明` | 简述 |

### 执行前置元数据

`/team-execute` 还应显式记录：

| 字段 | 说明 |
|------|------|
| `当前阶段` | 固定为 `execute` |
| `目标阶段` | 固定为 `review` 或下游 handoff |
| `handoff-ready` | 是否已经满足执行前提 |
| `story slice` | 当前本轮执行的是哪个独立切片 |
| `阻塞项` | 缺失的 handoff / challenge / review 证据 |

### 领域扩展执行记录

启用 private enterprise overlay 或配套领域资料时填写，建议至少包含：

| 字段 | 说明 |
|------|------|
| `能力名` | 本次实际使用的 private enterprise overlay、runbook、overlay 或 toolkit |
| `任务变量` | 本次解析出的关键变量，如 `ClassName`、`methodName`、`processType`、`PROJECT_ID` |
| `输入来源` | 需求、代码搜索、配置、接口契约、运行命令等 |
| `已读取资料` | 读过哪些 references / assets / 配置 |
| `执行结果` | 做了什么、得到什么结论 |
| `回落位置` | 结果已归并到实现说明 / 自测结果 / 风险中的哪一项 |

## /team-review

完整示例见 [team-review-example.md](team-review-example.md)。

### 上游质疑记录（Upstream Challenge Log）

QA 工程师在收到前后端交付物后，必须留下质疑记录：

| 字段 | 说明 |
|------|------|
| `质疑内容` | 对上游自测充分性、验收标准可测性的具体质疑 |
| `质疑目标` | PRD 验收标准 / 前后端自测报告 / 代码变更范围 |
| `结论` | 接受 / 要求补充自测 / 升级 |
| `处理说明` | 简述 |

### 阶段证据

`/team-review` 应至少核对以下阶段证据：

- 前序 `handoff-ready` 是否成立
- `execute` 是否保留自测与影响面
- 下游是否已留下质疑记录

### 领域扩展约束核对结果

启用 private enterprise overlay 或配套领域资料时填写，建议至少包含：

| 字段 | 说明 |
|------|------|
| `能力名` | 被核对的 private enterprise overlay、runbook、overlay 或 toolkit |
| `关键约束` | 本 skill 要求遵守的关键规则 |
| `证据` | 代码、配置、测试、日志、截图、文档等 |
| `状态` | 通过 / 有条件通过 / 不通过 |
| `残余风险` | 未覆盖项与后续动作 |

### 文档一致性审计（启用 `doc-architecture` 时建议填写）

| 字段 | 说明 |
|------|------|
| `服务名一致性` | `arch-design.md`、`api-contract.md`、实现代码之间是否一致 |
| `API 覆盖一致性` | 领域接口是否均在契约中有可追溯定义 |
| `事件覆盖一致性` | 领域事件与实现中的发布/订阅关系是否一致 |
| `鉴权一致性` | 权限声明与真实控制点是否一致 |
| `索引与落盘一致性` | INDEX、artifact 文件、memory 记录是否完整 |

## /team-release

完整示例见 [team-release-example.md](team-release-example.md)。

### 上游质疑记录（Upstream Challenge Log）

DevOps 工程师在收到发布方案与测试放行结论后，必须留下质疑记录：

| 字段 | 说明 |
|------|------|
| `质疑内容` | 对回滚可行性、监控覆盖、环境一致性的具体质疑 |
| `质疑目标` | 发布方案 / 测试放行结论 / 环境配置 |
| `结论` | 接受 / 要求补充 / 升级 |
| `处理说明` | 简述 |

### 发布阶段元数据

`/team-release` 应显式记录：

| 字段 | 说明 |
|------|------|
| `当前阶段` | 固定为 `release` |
| `目标阶段` | 固定为 `closeout` |
| `release-ready` | 是否允许进入发布 |
| `阻塞项` | 监控、回滚、环境或证据缺口 |

### 可选领域扩展执行记录

只在发布链实际调用 private enterprise overlay时填写，建议至少包含：

| 字段 | 说明 |
|------|------|
| `扩展能力` | 如 GitLab 手动流水线补充手册 |
| `触发条件` | 为什么本次发布要用它 |
| `执行摘要` | 运行了什么、返回了什么 |
| `发布影响` | 是否影响放行、回滚、观察窗口 |
| `补充动作` | 失败时的人工兜底或后续跟进 |

## /team-closeout

`/team-closeout` 用于在发布与观察窗口结束后做最终收口：确认是否达到最终验收、哪些风险被正式接受、哪些事项回流 backlog，以及项目状态是否可以切为 `closed`。

### 上游质疑记录（Upstream Challenge Log）

Tech Lead 在收到发布结果、观察窗口证据与最终业务确认后，必须留下质疑记录：

| 字段 | 说明 |
|------|------|
| `质疑内容` | 对最终验收、观察窗口充分性、遗留项处理方式的具体质疑 |
| `质疑目标` | 发布结果 / 观察窗口记录 / launch acceptance / backlog 决议 |
| `结论` | 接受 / 要求补充 / 升级 |
| `处理说明` | 简述 |

### Closeout 阶段元数据

`/team-closeout` 应显式记录：

| 字段 | 说明 |
|------|------|
| `当前阶段` | 固定为 `closeout` |
| `目标阶段` | 固定为 `closed` |
| `closeout-ready` | 是否满足收口前提（发布完成、观察窗口结束、验收状态明确） |
| `阻塞项` | 阻止任务正式关闭的证据缺口、事故、未决审批或高风险遗留 |

### 最终收口结论

建议至少包含以下字段：

| 字段 | 说明 |
|------|------|
| `最终验收状态` | 通过 / 有条件通过 / 不通过 |
| `观察窗口结论` | 已结束 / 延长中 / 回滚中，并说明依据 |
| `残余风险处置` | 接受 / 转移 / 延后处理 / 重新打开主链 |
| `backlog 回写` | 新增的遗留项、责任人、目标版本或触发条件 |
| `任务关闭结论` | `closed` / `re-open` / `follow-up-required` |

### 持久化要求

`/team-closeout` 建议至少落盘以下事实：

- `closeout-summary.md`：最终验收、观察窗口、残余风险、遗留项和 lessons learned。
- `docs/artifacts/INDEX.md`：将任务状态更新为 `closed`、`re-open` 或 `follow-up-required`，若已有 closeout 列则补齐文件链接。
- `docs/memory/project-context.md`：刷新当前项目状态、最近上线结果和后续跟进点。
- `docs/memory/lessons-learned.md`：追加可复用的发布/协作经验。

## 与 Handoff 的关系

完整交接示例见 [team-handoff-example.md](team-handoff-example.md)。

- `/team-plan` 之后的 handoff 若命中了 private enterprise overlay 或配套领域资料，必须附带 `技能装配清单`。
- `/team-plan` 之后的 handoff 还应标明是否已达到 `handoff-ready`，以及是否完成 `Design Review Board` 收口。
- 所有进入下一阶段的 handoff 都应写明 `readiness proof` 与 `accepted_by`，并与目标阶段的 gate 结论保持一致。
- `/team-execute` 之后的 handoff 若使用了 private enterprise overlay 或配套领域资料，必须附带 `领域扩展执行记录`。
- `/team-review`、`/team-release` 与 `/team-closeout` 的 handoff 若命中了 private enterprise overlay 或配套领域资料，必须附带 `领域扩展约束核对结果`、`可选领域扩展执行记录` 或最终收口所消费的领域证据。
