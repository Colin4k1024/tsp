---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Consumer-Driven Contract 与 Mock 对齐指南

本文聚焦 consumer-driven contract testing 和 Mock 的协同关系，解决“Mock 能跑、Pact 也能过，但真实接口仍然错位”的问题。

## 1. 核心原则

- Mock 负责提早开发与局部验证
- Contract 负责 consumer/provider 的行为约定
- 真实联调负责确认运行时细节没有偏离

## 2. 对齐节奏

- consumer 先声明真正依赖的行为
- Mock 只表达当前 consumer 需要的最小集合
- provider verification 结果要回写 contract 和 handoff
- 真实接口联调后，清理不再成立的 Mock 假设

## 3. 需要同步的内容

- 字段是否必填
- 错误码和错误语义
- 分页、排序、权限、幂等行为
- 版本策略和兼容边界

## 4. 常见错误

- 用 Mock 固化 provider 的实现细节
- Contract 变了，但 consumer Mock 没变
- provider verification 失败后没有明确归因

## 5. 建议落点

- 契约更新回写到 [../../templates/api-contract.md](../../templates/api-contract.md)
- 联调结果回写到 handoff 与 `/team-review`
- 发布前把高风险契约差异写入 `/team-release`

与这些文档配合阅读：[contract-testing-playbook.md](contract-testing-playbook.md)、[api-design-evolution-walkthrough.md](api-design-evolution-walkthrough.md)
