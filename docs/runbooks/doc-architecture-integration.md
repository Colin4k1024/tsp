# Doc Architecture Integration

## 目标

将文档架构能力拆分到现有 `/team-*` 主链，在不新增并行主命令和并行主目录的前提下，持续产出可审计文档。

## 适用范围

- 需要补齐架构文档、服务拆分文档、接口契约文档的任务。
- 需要在实现与发布阶段保持文档-代码一致性的任务。

## 映射原则

1. 只使用 `docs/artifacts/`、`docs/adr/`、`docs/memory/` 作为落盘事实源。
2. 原 discovery/modeling/audit 结果必须映射到现有 artifact 文件，不新增平行交付目录。
3. 角色边界不变：tech-lead 负责 intake/plan 收口，architect 负责方案与契约，qa 负责一致性审计证据。

## 主链落点

### /team-intake

- 记录 Project Profile Card：项目目标、技术栈、架构风格、部署与 API 约束。
- 产出落点：`prd.md`。

### /team-plan

- 记录 Service Catalog、Communication Matrix、NFR Summary。
- 若为 brownfield，先记录 Brownfield Context Snapshot：现有模块、外部集成、主要技术债、缺失文档和改造边界；必要时先跑 `/update-codemaps` 再回填。
- 在进入 execute 前，将需求切成可独立验收的 Story Slice Plan，并把每个 slice 的 owner、依赖、验收标准与 handoff 终点写入 `delivery-plan.md`。
- 产出落点：`delivery-plan.md`、`arch-design.md`、`api-contract.md`（按需）。

### /team-execute

- 记录实现偏差、契约漂移、事件变更。
- 产出落点：`execute-log.md`、`docs/adr/`、`docs/memory/decisions.md`（按需）。

### /team-review

- 执行一致性审计：服务名、API、事件、鉴权、索引。
- 产出落点：`test-plan.md`，并给出阻塞与放行建议。

### /team-release

- 记录部署验证、监控与回滚，以及文档追溯状态。
- 产出落点：`release-plan.md`、`docs/memory/sessions/*.md`。

## 审计清单（最小版）

1. 服务名在架构文档、契约文档、实现代码中一致。
2. 核心 API 在契约文档中可追溯。
3. 关键事件在文档与实现中一一对应。
4. 鉴权说明与真实权限控制点一致。
5. INDEX 与各 artifact 文件链接完整可达。

## 推荐执行顺序

1. 先启用 `doc-architecture` shared skill。
2. 再在 role 装配中接入 tech-lead、architect、backend、frontend、qa、devops。
3. 最后运行构建与校验脚本，确认平台产物可生成。
