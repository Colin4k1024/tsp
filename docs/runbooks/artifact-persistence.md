# Artifact Persistence Convention

## 用途

定义 `/team-*` 命令产出物的持久化存储规则，确保 PRD、Delivery Plan、架构设计、执行日志、Deployment Context、Launch Acceptance、Release Plan、Closeout Summary、Handoff 记录、ADR 以及系统记忆可被审计和回溯。

---

## 目录结构（消费方项目仓库）

```text
docs/
  artifacts/
    INDEX.md                                 # 所有任务的汇总索引（追加更新）
    {YYYY-MM-DD}-{slug}/
      prd.md                                 # /team-intake 产出
      delivery-plan.md                       # /team-plan 产出
      arch-design.md                         # /team-plan，architect 角色产出（必填）
      api-contract.md                        # architect / backend-engineer 产出（可选）
      execute-log.md                         # /team-execute 产出（必填）
      test-plan.md                           # /team-review 产出
      launch-acceptance.md                   # /team-review 产出（上线准入结论）
      deployment-context.md                  # /team-release 产出（环境/配置/回滚真相源）
      release-plan.md                        # /team-release 产出
      closeout-summary.md                    # /team-closeout 产出
      handoffs/
        {NNN}-{from-role}-to-{to-role}.md    # /handoff 产出，NNN 序号自增
  adr/
    ADR-001-{title}.md                       # ADR（全局序号，独立于任务目录）
    ADR-002-{title}.md
  memory/                                    # 系统记忆（跨任务持久化，不属于单个任务）
    project-context.md                       # 项目级上下文快照（覆盖更新）
    backlog.md                               # 跨任务 backlog 真相源（持续更新）
    decisions.md                             # 轻量决策日志（追加）
    lessons-learned.md                       # 经验沉淀（追加）
    sessions/
      {YYYY-MM-DD}-{NNN}-{slug}.md           # 每次命令链路的会话摘要（NNN 序号自增）
```

> 如果上述目录不存在，agent 在写入前先创建。

---

## Slug 生成规则

1. 取需求标题或任务名称。
2. 转为小写，中文转拼音首字母或保留核心英文语义词。
3. 空格和特殊字符替换为 `-`，连续 `-` 合并。
4. 截断至 30 字符以内。
5. 示例：`用户登录流程改造` -> `user-login-flow`；`Payment Retry Logic` -> `payment-retry-logic`。

---

## Frontmatter 规范

每个 artifact 文件开头必须包含：

```markdown
---
artifact: prd | delivery-plan | arch-design | api-contract | execute-log | test-plan | launch-acceptance | deployment-context | release-plan | closeout-summary | backlog-snapshot | handoff | adr | project-context | decision | lesson | session-summary
task: {slug}
date: {YYYY-MM-DD}
role: {产出角色，如 tech-lead / architect / qa-engineer / devops-engineer}
status: draft | approved
---
```

---

## ADR 编号规则

1. 扫描 `docs/adr/` 目录，找出现有文件中最大的三位序号。
2. 新 ADR 编号 = 最大值 + 1，左补零至三位。
3. 若目录为空，从 `ADR-001` 开始。
4. 文件命名：`ADR-{NNN}-{slug}.md`，slug 规则同上。

---

## INDEX.md 格式

### 初始化（首次创建）

```markdown
# Artifacts Index

| 日期 | 任务 | PRD | Delivery Plan | Arch Design | Test Plan | Launch Acceptance | Deployment Context | Release Plan | Closeout | ADR | 状态 |
|------|------|-----|---------------|-------------|-----------|-------------------|--------------------|--------------|----------|-----|------|
```

### 追加新任务行

每次 `/team-intake` 创建新任务时追加一行：

```text
| {YYYY-MM-DD} | {slug} | prd.md 链接 | - | - | - | - | - | - | - | - | intake |
```

实际写入时将占位符替换为真实日期、slug，并生成相对路径链接。

后续各阶段完成后，更新对应列为链接，并将状态列更新为 `plan` / `execute` / `review` / `accepted` / `released` / `closed`。

---

## Handoff 序号规则

1. 扫描 `docs/artifacts/{slug}/handoffs/` 目录，找出现有文件最大的三位序号。
2. 新文件序号 = 最大值 + 1，左补零至三位。
3. 若目录为空，从 `001` 开始。
4. 文件命名：`{NNN}-{from-role}-to-{to-role}.md`。

---

## 架构设计文档（arch-design.md）规范

由 `architect` 角色在 `/team-plan` 阶段产出，至少包含：

- **系统边界**：外部依赖、集成点、边界内外划分。
- **组件拆分**：主要模块 / 服务及其职责。
- **关键数据流**：核心路径的数据流转，可用 Mermaid 图。
- **接口约定**：主要 API 入口、协议、认证方式。
- **技术选型**：关键语言、框架、中间件选择及原因。
- **风险与约束**：已知技术风险和上线前必须解决的约束。

---

## 执行日志（execute-log.md）规范

由研发角色在 `/team-execute` 阶段产出，记录实际执行过程：

- **计划 vs 实际**：原计划完成哪些，实际完成哪些，偏差原因。
- **关键决定**：实施过程中做出的技术决定。
- **阻塞与解决**：遇到的阻塞、根因和最终解决方式。
- **影响面**：涉及的模块、接口、数据库、配置。
- **未完成项**：因范围或时间调整而延后的内容。

---

## 上线验收（launch-acceptance.md）规范

由 `qa-engineer` 主责，在 `/team-review` 阶段产出，用于记录“是否允许上线”的正式结论：

- **验收范围**：本次实际验收的业务、技术和非功能边界。
- **验收证据**：关联 `test-plan.md`、关键测试结果、关键环境和 artifact。
- **已满足项**：已经满足的功能、数据、回滚、监控与运维要求。
- **接受风险**：当前未满足但接受上线的风险、原因与缓解措施。
- **阻塞项**：仍然阻塞上线的问题与 owner。
- **上线结论**：允许上线 / 有条件允许上线 / 不允许上线。

---

## 部署上下文（deployment-context.md）规范

由 `devops-engineer` 主责，在 `/team-release` 阶段产出，作为上线所需环境与操作上下文的真相源：

- **环境清单**：环境用途、访问入口、部署目标。
- **部署入口**：主入口、手工入口、回退入口、前置条件。
- **配置与密钥**：环境变量、配置项、密钥来源、轮换与访问方式。
- **运行保障**：feature flag、灰度控制、监控、告警、值守与观察窗口。
- **回滚与恢复**：触发条件、回滚路径、验证回滚成功的方法。

---

## 收口总结（closeout-summary.md）规范

由 `tech-lead` / `devops-engineer` 在 `/team-closeout` 阶段产出，用于记录发布后观察结果、最终状态判断和 backlog 回填情况：

- **发布后观察结果**：实际发布时间、指标变化、告警或事故、用户反馈。
- **目标达成情况**：原目标、实际结果、未达成部分、偏差原因。
- **当前状态判断**：正式收口 / 部分收口 / 暂不收口，以及残余风险。
- **遗留项**：需要补丁、后续任务或再次发布的事项。
- **知识沉淀**：lessons learned、后续 owner、回看时间。
- **Backlog 回填**：必须明确是否已同步到 `docs/memory/backlog.md`。

---

## 系统记忆（docs/memory/）规范

系统记忆是跨任务、跨会话的持久化知识，不属于单个任务目录。

### project-context.md

- **覆盖更新**：每次 `/team-plan`、`/team-release` 或 `/team-closeout` 后刷新。
- 内容：项目名称、tech stack、当前活跃任务 slug、当前阶段、关键依赖、团队角色、上次发布版本、未解决风险、下一步建议。

### delivery-plan.md 补充约定

- 若任务属于既有项目改造，`delivery-plan.md` 应包含 `Brownfield Context Snapshot` 章节。
- 若任务需要进入 `/team-execute`，`delivery-plan.md` 应包含 `Story Slice Plan` 章节，用于表达可独立验收的执行单元。

### backlog.md

- **持续更新**：作为跨任务 backlog / roadmap 的真相源。
- 推荐按 [../../templates/backlog-snapshot.md](../../templates/backlog-snapshot.md) 结构维护。
- 至少承接四类信息：当前版本未完成项、发布后遗留项、技术债、下一阶段候选。
- 每次 `/team-closeout` 后，如出现遗留项或下一阶段候选，必须更新。

### decisions.md

- **追加更新**：每次 `/team-execute` 或 `/team-review` 后，如有轻量决策则追加。
- 每条格式：

```text
## {YYYY-MM-DD} {决策标题}
- 背景：{一句话说明为什么要做这个决定}
- 决策：{做了什么}
- 影响：{影响哪些组件或流程}
- 关联任务：{slug}
```

### lessons-learned.md

- **追加更新**：每次 `/team-review`、`/team-release` 或 `/team-closeout` 后，如有经验教训则追加。
- 每条格式：

```text
## {YYYY-MM-DD} {教训标题}
- 场景：{什么情况下发生的}
- 问题：{出了什么问题或值得记录的点}
- 建议：{下次如何避免或复用}
- 关联任务：{slug}
```

### sessions/{YYYY-MM-DD}-{NNN}-{slug}.md

- **每次 `/team-closeout` 完成后**写入，代表一个完整交付链路的收口摘要。
- 也可在 `/team-review` 或 `/team-release` 后写入中间状态会话摘要。
- 内容：链路起止时间、完成的任务 slug、关键产出链接、遗留事项。

---

## 各命令写入职责

| 命令 | 写入文件 | 同时更新 |
|------|----------|----------|
| `/team-intake` | `docs/artifacts/{slug}/prd.md` | `docs/artifacts/INDEX.md`（新增任务行） |
| `/team-plan` | `docs/artifacts/{slug}/delivery-plan.md`、`arch-design.md` | `INDEX.md` Delivery Plan + Arch Design 列；若有 ADR 则写 `docs/adr/ADR-{NNN}.md`；刷新 `docs/memory/project-context.md` |
| `/team-execute` | `docs/artifacts/{slug}/execute-log.md` | 若有新 ADR 则写 `docs/adr/`；若有轻量决策则追加 `docs/memory/decisions.md` |
| `/team-review` | `docs/artifacts/{slug}/test-plan.md`、`launch-acceptance.md` | `INDEX.md` Test Plan + Launch Acceptance 列；若有经验教训则追加 `docs/memory/lessons-learned.md`；状态更新为 `review` 或 `accepted` |
| `/team-release` | `docs/artifacts/{slug}/deployment-context.md`、`release-plan.md` | `INDEX.md` Deployment Context + Release Plan 列和状态列；刷新 `docs/memory/project-context.md`；若有经验教训则追加 `docs/memory/lessons-learned.md` |
| `/team-closeout` | `docs/artifacts/{slug}/closeout-summary.md` | `INDEX.md` Closeout 列和状态列；刷新 `docs/memory/project-context.md`；按需更新 `docs/memory/backlog.md`、`docs/memory/lessons-learned.md`；写入 `docs/memory/sessions/` 会话摘要 |
| `/handoff` | `docs/artifacts/{slug}/handoffs/{NNN}-{from}-to-{to}.md` | 无需更新 INDEX.md |

---

## 注意事项

- **追加，不覆盖**：INDEX.md、decisions.md、lessons-learned.md 始终只追加，不删改已有行。
- **覆盖更新**：`project-context.md` 保持为当前最新状态的单一真相源。
- **slug 一致性**：同一个任务在所有命令中使用相同 slug，由 `/team-intake` 在首次运行时确定。
- **ADR 全局序号**：ADR 序号跨任务累计，不在单个任务目录内重新计数。
- **execute-log.md 必填**：不是可选摘要，团队依赖它追溯实施偏差和决定。
- **arch-design.md 必填**：`/team-plan` 阶段必须输出。
- **launch-acceptance.md 不是 test-plan 的替代品**：一个负责测试事实，一个负责上线准入结论。
- **deployment-context.md 不是 release-plan 的附录**：环境、配置、密钥和回滚入口必须可独立检索。
- **closeout-summary.md 不是 release-plan 尾注**：只有经过观察窗口并完成 backlog 回填，任务才算真正收口。
- **backlog.md 是跨任务真相源**：发布后遗留项、技术债和二期候选必须进入 `docs/memory/backlog.md`。
- **路径前缀**：所有路径均相对于消费方项目仓库根目录，不是 Team Skills Platform 本身。
