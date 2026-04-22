---
version: "0.1.0"
status: draft
created: 2026-04-01
updated: 2026-04-01
owner: 工程团队
---

# Doc Architecture Quick Start

## 目标

在现有 `/team-*` 主链中使用 `doc-architecture` 完成一条最小文档输出链路，不新增额外命令。

## 适用场景

- 补齐架构文档
- 新系统方案设计
- 服务拆分与契约梳理
- 已有文档的演进更新

## 最小使用步骤

### 1. 运行 `/team-intake`

输入至少包含：

- 需求背景
- 项目目标
- 技术栈
- 架构风格
- 部署方式
- API 风格
- 关键约束

推荐提示：

```text
/team-intake
目标：补齐订单中心的架构文档
范围：服务拆分、接口契约、测试与发布文档
技术栈：Java Spring Boot + MySQL + Redis
架构风格：微服务
部署方式：Kubernetes
API 风格：REST
约束：需要统一回落到 docs/artifacts、docs/adr、docs/memory
```

### 2. 运行 `/team-plan`

重点补齐：

- Project Profile Card
- Service Catalog
- Communication Matrix
- NFR Summary
- Artifact Mapping

推荐提示：

```text
/team-plan
基于上一步 intake 结果：
1. 补齐 Project Profile Card
2. 拆出 Service Catalog 和 Communication Matrix
3. 给出 NFR Summary
4. 明确这些内容分别写入哪些 artifact 文件
```

### 3. 进入 `/team-execute`

要求实现角色回写：

- 执行偏差
- 接口或事件漂移
- 决策记录

### 4. 进入 `/team-review`

要求 QA 核对：

- 服务名一致性
- API 覆盖一致性
- 事件覆盖一致性
- 鉴权一致性
- 索引与落盘一致性

### 5. 进入 `/team-release`

要求发布侧补齐：

- 发布步骤
- 验证与监控
- 回滚方案
- 文档追溯状态

## 预期产物

- `docs/artifacts/{date}-{slug}/prd.md`
- `docs/artifacts/{date}-{slug}/delivery-plan.md`
- `docs/artifacts/{date}-{slug}/arch-design.md`
- `docs/artifacts/{date}-{slug}/api-contract.md`（按需）
- `docs/artifacts/{date}-{slug}/execute-log.md`
- `docs/artifacts/{date}-{slug}/test-plan.md`
- `docs/artifacts/{date}-{slug}/release-plan.md`
- `docs/adr/ADR-{NNN}-{slug}.md`（按需）
- `docs/memory/decisions.md`
- `docs/memory/lessons-learned.md`
- `docs/memory/sessions/{date}-{NNN}-{slug}.md`

## 推荐搭配文档

- [doc-architecture-integration.md](doc-architecture-integration.md)
- [team-command-output-contracts.md](team-command-output-contracts.md)
- [artifact-persistence.md](artifact-persistence.md)
- [team-skills-usage.md](team-skills-usage.md)

## 成功标准

1. 主链命令中能明确看到 `doc-architecture` 的使用提示。
2. 产物全部写入 artifacts/adr/memory。
3. `node scripts/validate-library.js` 通过。
