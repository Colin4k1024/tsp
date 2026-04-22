---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# QA Engineer 日常操作手册

本文面向 QA 工程师，说明测试计划、验证执行和放行建议在 Team Skills Platform 下应如何进入主链。

如果你想先看当前 specialist 与验证类能力的映射，先读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。

## 1. 你的默认职责

- 根据需求和 handoff 制定测试范围
- 执行功能、回归、边界和异常验证
- 给出放行建议与风险分级
- 把遗留问题和观察建议交给 tech-lead 或 devops-engineer

## 2. 开始验证前必须确认什么

- 目标与范围外事项是否清楚
- 研发 handoff 是否包含自测证据
- 哪些风险必须阻塞放行
- 是否存在 custom overlay 相关验证要求

## 3. 测试执行的固定检查

- 主路径是否可用
- 错误态、空态和权限边界是否覆盖
- 回归范围是否明确
- 前端任务是否含响应式和 A11y 证据
- 后端任务是否含兼容性与回滚说明

## 4. 进入 release 前应交付什么

- 测试结论摘要
- 阻塞项与非阻塞项
- 已知风险与建议观察项
- 放行建议或拒绝理由

如果需要结构化测试计划，直接按 [artifact-standards.md](../../rules/artifact-standards.md) 中的 Test Plan 最小字段组织：测试范围、测试矩阵、风险、放行建议。
若存在多参数、多角色、多配置或多终端组合，优先结合 `pairwise-test-design` 压缩测试矩阵；若关键验证依赖真实外部依赖，再结合 `testcontainers-integration-testing` 规划集成测试。

## 5. 常用命令组合

- `/team-plan`：确认测试范围和角色依赖
- `/tdd`：在研发早期提前锁测试范围和成功标准
- `/team-execute`：读取研发侧自测与交付物
- `/verify`：补充关键验证回环
- `/handoff`：把测试结论交给 tech-lead 或 devops-engineer
- `/team-review`：形成统一质量结论

## 6. 常见错误

- 只验证 happy path
- 没有把阻塞项和建议项分开
- 没有在早期介入 `/tdd`，导致测试口径只能在交付后被动补齐
- 发现问题后没有结构化回收到 handoff

可结合这些演练一起看：[bug-fix-complete-walkthrough.md](bug-fix-complete-walkthrough.md)、[code-review-collaboration-walkthrough.md](code-review-collaboration-walkthrough.md)、[role-prompt-recipes.md](role-prompt-recipes.md)、[qa-review-conversation-example.md](qa-review-conversation-example.md)
