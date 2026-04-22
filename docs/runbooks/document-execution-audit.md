# Document Execution Audit

本文记录本轮“整体文档落地性核对”的问题台账，按 `P0 / P1 / P2` 标记风险级别，并说明当前处理状态与残余风险。

## P0

| 问题 | 影响 | 处理状态 |
|------|------|----------|
| 主链文档已引入 `领域技能包启用建议`、`技能装配清单`、`领域扩展执行记录` 等输出项，但没有统一输出合同 | 上下游知道要产出什么，却不知道按什么结构交付 | 已通过 [team-command-output-contracts.md](team-command-output-contracts.md) 补齐 |
| `handoff-contract.md` 未承接 private enterprise overlay 场景输出 | `/team-*` 与 handoff 之间断链，结果无法稳定回落 | 已补齐 conditional 字段要求 |
| 多数 `skills/` 含占位变量或“按需读取”，但缺少变量解析与输出回落说明 | 实施者会卡在“变量怎么定、结果写到哪里” | 本轮为已挂载的 private enterprise overlay 补齐任务输入合同 |

## P1

| 问题 | 影响 | 处理状态 |
|------|------|----------|
| 入口文档、规则、runbook 对三层技能结构虽基本一致，但缺少主链输出合同入口 | 平台理解成本高，实施者不容易找到执行基线 | 已在入口和使用手册中增加 runbook 引用 |
| `enterprise-overlay-integration.md` 说明了技能定位，但对“默认挂载 / 可选启用 / 结果回落”不够细 | private enterprise overlay 接入方式理解不完整 | 本轮补充默认挂载、输出回落和合同引用 |
| 架构设计主链、发布治理 runbook、`frontend-engineering` 和语言 / 后端规则已部分接入 private enterprise overlay 场景，但没有完全说明与主链输出的关系 | 角色知道要看 role skill 或 runbook，不知道如何把结果回写主链 | 本轮补充相关回落说明 |

## P2

| 问题 | 影响 | 处理状态 |
|------|------|----------|
| private enterprise overlay 仍保留内部脚手架和过程文档约定，如 `process.md`、`qa-pending.md` | 对非组织内部脚手架项目可读性一般，但不阻塞本平台落地 | 保留，已补充变量来源和主链回落规则 |
| 历史企业扩展导入区仍包含未正式接入的能力 | 容易误认为可直接安装 | 已在文档中强调其仅是历史导入区 |

## 残余风险

- `skills/` 中部分技能依然强依赖组织内部脚手架、私有权限中心 或集团内部 SDK；这属于领域限制，不属于文档缺口。
- 若后续继续接入新的原始 skill，必须重复执行本轮核对流程，不能只复制文件。
- 本轮只精修已挂载、已纳入正式层的 skills；原始导入区未接入项不在深度精修范围内。
