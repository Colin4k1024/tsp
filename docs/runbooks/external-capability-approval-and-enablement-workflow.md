---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 开源能力评估到启用的完整流程

本文说明一个外部能力如何从 `candidate` 进入 `approved`，再落到 `ecc`、`runbook` 或其他正式层，而不是只停留在 intake 台账里。

## 1. 流程阶段

1. intake：登记来源、许可证、适配层级和原因
2. approval：判断是否值得引入
3. enablement：本地化改写、链接 runbook、补校验
4. rollout：接入命令流或文档索引

## 2. approval 时必须确认什么

- 许可证是否允许当前使用方式
- 是否和现有能力重叠
- 是要做 skill、runbook 还是 toolkit
- 谁负责后续维护

## 3. enablement 时必须完成什么

- 本地化而不是整包搬运
- 明确目标层级和目标名称
- 更新文档入口和校验链路

## 4. 常见错误

- 台账里标记 `approved` 之后长期不落地
- 能力已接入，但没有文档入口和维护责任人
- 没判断 portability 就直接进入正式层

与这些文档配合阅读：[external-capability-intake.md](external-capability-intake.md)、
