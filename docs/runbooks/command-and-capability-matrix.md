---
version: "2.3.0"
status: draft
created: 2026-03-29
updated: 2026-04-18
owner: 工程团队
doc_tier: entry
last_verified: 2026-04-18
source_of_truth:
  - ../../README.md
  - ../../AGENTS.md
  - ../../commands/
---

# 命令与能力矩阵

本文只回答一个问题：当前平台到底有哪些公开命令、ECC 增强能力和 runtime 能力，以及它们通常怎么组合。BMAD 在这里继续作为方法来源，不再暴露成第二套 `/bmad-*` 工作流。

## 0. 文档生命周期字段

| 字段 | 当前值 | 说明 |
|------|--------|------|
| `status` | `draft` | 文档成熟度；未标记 `active` 前默认按草案迭代 |
| `doc_tier` | `entry` | 入口层文档；与 README / AGENTS 一起维护公开口径 |
| `last_verified` | `2026-04-17` | 最近一次人工验证日期（命令面与入口一致性） |
| `source_of_truth` | `README.md`、`AGENTS.md`、`commands/` | 命令定义与公开口径的权威来源 |

## 1. 公开命令总表

| 类型 | 命令 | 作用 | 典型输出回落位置 |
|------|------|------|------------------|
| 主链入口 | `/team-help` | 根据当前阶段、artifacts、handoff 与阻塞项推荐下一条主链命令 | `/team-intake`、`/team-plan`、`/team-execute`、`/team-closeout` |
| 主链 | `/team-intake` | 锁目标、范围、约束、角色和候选扩展 | `/team-plan` |
| 主链 | `/team-plan` | 完成 challenge / design 收口、形成 implementation-readiness | `/team-execute`、`/handoff` |
| 主链 | `/handoff` | 结构化交接与 readiness proof 收口 | `/team-review`、`/team-release` |
| 主链 | `/team-execute` | 消费 readiness proof 执行实现、自测与执行记录 | `/handoff` |
| 主链 | `/team-review` | 质量结论、阻塞、放行建议 | `/team-release` |
| 主链 | `/team-release` | 发布方案、观察窗口、回滚与责任链 | `/team-closeout` |
| 主链 | `/team-closeout` | 最终验收、观察窗口收口、backlog 回写 | 任务关闭 / follow-up |
| specialist | `/plan` | 深度规划、阶段拆解 | `/team-plan`、`/handoff` |
| specialist | `/tdd` | 测试先行、red-green-refactor 路径 | `/team-execute`、`/handoff` |
| specialist | `/code-review` | 实现风险、回归与质量审查 | `/handoff`、`/team-review` |
| specialist | `/build-fix` | 构建与校验失败定位、修复 | `/team-execute`、`/handoff` |
| specialist | `/verify` | 关键路径验证、放行前证据 | `/team-review`、`/team-release` |
| specialist | `/multi-frontend` | 前端并行分析：实现 / UIUX / QA | `/handoff`、`/team-plan` |
| specialist | `/multi-backend` | 后端并行分析：接口 / 权限 / 测试 | `/handoff`、`/team-plan` |
| 快捷执行 | `/quick` | 小范围低风险任务的快速闭环 | `/handoff`、`/team-review` |
| 快捷执行 | `/pause` | 暂停当前会话并生成恢复快照 | `/resume` |
| 快捷执行 | `/resume` | 从最近暂停状态恢复会话继续执行 | `/team-*` 主链或 `/quick` |
| 进阶能力 | `/pua` | 高能动性与高压闭环推进 | `/team-execute`、`/team-release` |
| 进阶能力 | `/model-route` | 按任务复杂度和预算建议模型档位 | 当前任务上下文 |
| 进阶能力 | `/evolve` | 管理 instinct/gene 演进生命周期 | `docs/memory/`、演进资产 |
| 进阶能力 | `/learn` | 从会话提炼复用模式并沉淀 | 本地 skills 资产 |
| 进阶能力 | `/agent-dev` | 交互式 Agent 开发 Workshop | `skills/`、`agents/`、`commands/` |
| 平台体检 | `/harness-audit` | 审视平台覆盖度、hook 有效性、文档质量和集成深度 | 平台治理、文档补齐、下一轮收敛 |

## 2. 主链最小闭环

1. 先用 `/team-help` 判断入口，不直接猜下一条命令
2. 正式主链输出统一通过 `npm run artifact:persist -- ...` 落到 `docs/artifacts/`
3. `/team-plan` 负责收口 challenge、design review 和 implementation-readiness
4. `/team-execute` 只消费已具备 readiness proof 的 story-sized execution unit
5. 发布后仍需 `/team-closeout` 收完观察窗口
6. `/team-help` 到 `/team-release` 默认带上 `karpathy-guidelines` 这层行为护栏；它用于暴露假设、收敛 scope、保持改动外科化，但不是新的阻塞门槛

## 3. ECC 能力分组

### 3.1 调试与验证

| 能力 | 作用 | 常搭命令 |
|------|------|----------|
| `doc-architecture` | 文档发现、建模、一致性审计并映射到 artifacts | `/team-intake`、`/team-plan`、`/team-review` |
| `graphify` | 可选知识图谱能力，用于 brownfield 结构扫描、依赖路径分析与架构问答证据 | `/team-help`、`/team-plan`、`/team-execute` |
| `gitnexus` | 受控可选代码智能能力，用于 MCP 查询、impact、detect_changes、多仓图谱证据 | `/team-help`、`/team-plan`、`/team-execute`、`/team-review` |
| `karpathy-guidelines` | 主流程默认行为护栏：先暴露假设、优先简单方案、限定改动边界、先锁成功标准 | `/team-help`、`/team-intake`、`/team-plan`、`/team-execute`、`/team-review`、`/team-release` |
| `browser-smoke-testing` | 浏览器主路径与 smoke 证据 | `/team-execute`、`/verify`、`/team-release` |
| `pairwise-test-design` | 组合爆炸压缩 | `/team-plan`、`/team-review` |
| `testcontainers-integration-testing` | 容器化集成验证 | `/team-execute`、`/verify` |
| `systematic-debugging` | 根因定位而不是表面修错 | `/build-fix`、`/team-execute` |
| `java-unit-test` | Java 单测与验证 | `/tdd`、`/team-execute` |
| `maven-qa` | Java/Maven 质量门禁 | `/team-review`、`/verify` |
| `eval-harness` | eval-driven development、pass@k 与回归基线 | `/tdd`、`/verify` |

### 3.2 编排与效率

| 能力 | 作用 | 常搭命令 |
|------|------|----------|
| `parallel-execution` | worktree / 并行实例 / 级联任务 | `/multi-frontend`、`/multi-backend` |
| `strategic-compact` | 长会话压缩与上下文重组 | 长会话中的 specialist 与主链 |
| `cost-aware-llm-pipeline` | 模型选择、成本控制、上下文预算 | 长会话、复杂任务规划 |
| `harness-audit` | 平台能力评分与改进优先级 | `/harness-audit` |

### 3.3 学习与记忆

| 能力 | 作用 | 常搭命令 |
|------|------|----------|
| `error-experience-library` | 错误模式沉淀、历史方案检索 | `/build-fix`、`/team-execute` |
| `continuous-learning` | 项目级 / 全局级模式演进 | 长期使用、平台演进 |

## 4. runtime 能力总览

| 类别 | 当前入口 | 作用 |
|------|----------|------|
| session memory | `scripts/hooks/session-start-bootstrap.js`、`scripts/hooks/session-start.js`、`scripts/hooks/session-end.js` | 会话摘要、待办与上下文连续性 |
| governance capture | `scripts/hooks/governance-capture.js` | secret / approval / policy 信号采集 |
| cost awareness | `scripts/hooks/cost-tracker.js` | token 与成本记录 |
| compact readiness | `scripts/hooks/suggest-compact.js`、`scripts/hooks/pre-compact.js` | 长会话整理与 compact 提示 |
| MCP health | `scripts/hooks/mcp-health-check.js` | MCP 健康检测与失败信号 |
| edit quality | `scripts/hooks/quality-gate.js` + Stop hooks | 编辑后最小质量闸口 |

完整说明见 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

## 5. 安装与落盘关联

- Claude legacy install 现在会复制 `scripts/hooks/*.js`，并在 `settings.json` 中清理旧 `.py` hook 引用
- Codex / Claude 安装都以当前平铺的 `skills/` 为正式能力目录，不再把旧三层目录当成现行结构
- 用户面任务产出统一通过 `artifact:persist` 落盘，不依赖“只在对话里说过”

## 6. 推荐组合

### 6.1 新功能

1. `/team-help`
2. `/team-intake`
3. `/team-plan`
4. 需要测试先行时补 `/tdd`
5. `/team-execute`
6. `/handoff`
7. `/team-review`
8. `/team-release`
9. `/team-closeout`

### 6.2 小修复

1. `/team-help`
2. `/quick` 或 `/team-intake`
3. `/code-review` 或 `/build-fix`
4. `/handoff`
5. `/team-review`

### 6.3 平台治理

1. `/team-help`
2. `/team-plan`
3. `/harness-audit`
4. 对照 README、quick start、usage runbooks 和 install/runtime 测试补齐入口

### 6.4 Brownfield 结构扫描（可选）

1. `/team-help`
2. `/update-codemaps` 生成轻量现状快照
3. 默认 MCP-backed 符号、调用链和影响面证据执行 `npm run codegraph:doctor`；轻量结构证据执行 `npm run graphify:doctor`；深影响面或多仓证据执行 `npm run gitnexus:doctor`
4. CodeGraph 执行 `search/context/callers/callees/impact`，Graphify 执行 `build/query/path/explain`，或 GitNexus 执行受控索引后查询 `impact/detect_changes/context`
5. `/team-plan` 消费图谱证据收口 challenge/design/readiness
6. `/team-execute` 与 `/team-review` 持续引用图谱证据，不创建并行责任链

## 7. 下一步看什么

- 想看 quick start：看 [claude-quick-start.md](claude-quick-start.md) 和 [codex-quick-start.md](codex-quick-start.md)
- 想看接入流程：看 [project-onboarding.md](project-onboarding.md)
- 想看完整使用手册：看 [team-skills-usage.md](team-skills-usage.md)
- 想看后台机制：看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)
