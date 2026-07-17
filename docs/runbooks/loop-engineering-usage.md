---
version: "2.5.5"
status: active
created: 2026-06-30
updated: 2026-07-17
owner: 工程团队
doc_tier: runbook
last_verified: 2026-07-17
source_of_truth:
  - ../../commands/loop-start.md
  - ../../commands/loop-status.md
  - ../../commands/goal.md
  - ../../commands/heartbeat.md
  - ../../commands/triage.md
  - ../../commands/dashboard.md
  - ../../schemas/loop-spec.schema.json
  - ../../manifests/install-modules.json
  - ../../scripts/lib/loop-state-store.js
  - ../../scripts/lib/loop-spec.js
  - ../../scripts/lib/completion-oracle.js
  - ../../scripts/lib/heartbeat-scheduler.js
  - ../../scripts/hooks/session-start-goal-resume.js
---

# Loop Engineering 用户使用指南

Loop Engineering 用于把“反复发生、可以机器验证”的工程任务，组织成一个
有状态、有预算、有停止条件的执行闭环。它不是新的团队角色，也不是第 9 个
`loopengineer` agent；它是 TSP 的一组命令、skills、状态存储和运行时能力。

最短理解是：

```text
Heartbeat 发现问题
    ↓
Goal 让 Maker 修复
    ↓
Checker 执行硬门禁
    ├─ 全部通过 → Converged
    └─ 未通过 → 下一轮；预算耗尽则进入 Triage
```

当前 `loop-engineering` 模块稳定性为 `beta`。状态存储、loop spec、硬门禁、
goal/triage 运行时已经落地；周期调度和独立 checker 的具体执行方式仍取决于
目标平台是否提供对应的 automation、定时唤醒和模型隔离能力。

## 1. 什么时候应该使用

只有下面四项全部满足，才应该启动 loop：

| 准入条件 | 必须提供的证据 |
| ---------- | ---------------- |
| 任务会重复 | 每周或更高频发生，或者是一批结构相同的工作 |
| 可以自动验证 | 至少有一条 test、build、lint、schema 或 security 命令能用退出码判定成败 |
| 预算有上限 | 明确最大迭代次数、最长运行时间和最高成本 |
| 权限足够且受限 | Maker 只拥有完成任务所需的写权限，Checker 默认只读 |

推荐场景：

- CI 失败分类和可验证修复
- lint、类型检查或测试健康度巡检
- 文档新鲜度、schema、依赖或安全扫描
- 可以通过固定命令验收的批量维护任务

不推荐场景：

- 需求、产品方向或架构方案还没有收敛
- 涉及认证、支付、生产发布等高风险人工决策
- “把代码变好”“持续优化体验”这类没有客观停止条件的目标
- 只执行一次、写一个普通脚本就能完成的任务

任一准入条件不满足时，改用 `/quick`、`/verify`、`/team-execute` 或一次性脚本。
正式团队交付仍由 `/team-*` 主链治理，Loop Engineering 不替代 PRD、handoff、
review 和 release artifact。

## 2. 安装与确认能力

`team` 和 `full` profile 已包含 `loop-engineering`；`minimal` 默认不包含。仓库内安装示例：

```bash
# 先预览计划
node scripts/install-plan.js --profile team --target codex

# 安装 team profile
node scripts/install-apply.js --profile team --target codex

# 只安装 Loop Engineering 及其依赖
node scripts/install-plan.js --modules loop-engineering --target codex
node scripts/install-apply.js --modules loop-engineering --target codex

# 安装后检查
node scripts/install-apply.js doctor --target codex
```

把 `codex` 替换为 `claude` 或 `opencode` 即可生成对应目标的安装计划。
先看 plan 输出中的 `Selected modules`、`Skipped modules` 和 warnings；某个目标
不支持调度时，仍可使用 `/heartbeat run` 做单次扫描。

## 3. 第一次使用：先跑一个 CI triage loop

### 3.1 建立安全基线

启动前确认：

1. 当前测试和基础 gate 的初始状态已经记录。
2. 修改落在独立 branch 或 worktree，不直接写受保护的 `main`。
3. Maker 与 Checker 是不同角色或不同 agent；Checker 没有写权限。
4. gate 命令可以在当前仓库独立运行，并用非零退出码表示失败。
5. 没有把密钥、生产写权限或自动合并权限交给 loop。

### 3.2 创建 `.tsp/loop.yaml`

从仓库模板 [`.tsp/loop.example.yaml`](../../.tsp/loop.example.yaml) 复制并按项目修改：

```yaml
loop:
  id: ci-triage
  description: 持续发现并修复可机器验证的 CI 问题
  cadence: 30m
  skill: loop-ci-triage
  stateFile: .tsp/loops/state/ci-triage.md
  gates:
    - name: library-validation
      command: node scripts/validate-library.js
      description: 校验平台目录、引用和生成产物
    - name: tests
      command: npm test
      description: 运行仓库测试
  maker:
    role: backend-engineer
    writeAccess: true
  checker:
    role: qa-engineer
    writeAccess: false
  budget:
    maxIterations: 10
    maxDuration: 2h
    maxDollars: 5
  escalation:
    onBudgetExhausted: triage
    onSecurityFinding: human
```

字段含义：

| 字段 | 作用 |
| ------ | ------ |
| `id` | loop 的稳定标识，用于状态和 heartbeat 关联 |
| `cadence` | `30m`、`2h`、`1d` 等扫描周期 |
| `skill` | 项目专属执行说明；描述 Maker 能改什么、如何改 |
| `stateFile` | 给人阅读的 done / next / blockers / stop conditions 状态 |
| `gates` | 至少一条硬门禁；没有 gate 的 spec 无效 |
| `maker` / `checker` | 执行者和验收者的职责、写权限边界 |
| `budget` | 任一维度耗尽都应停止继续尝试并升级处理 |
| `escalation` | 预算耗尽或安全发现后的处理方式 |

需要单独验证 YAML 时，可执行：

```bash
node -e \
  "require('./scripts/lib/loop-spec').loadLoopSpecFile('.tsp/loop.yaml');
  console.log('loop spec ok')"
```

### 3.3 固定项目级状态目录

为了避免不同 target 或不同会话读到不同状态，项目内使用时建议显式设置：

```bash
export TSP_LOOP_STATE_DIR="$PWD/.tsp/loops"
```

运行态 JSON/JSONL 通常应加入 `.gitignore`；需要团队共享的人工状态摘要可以
单独提交 `state/{loopId}.md`。不要提交可能包含扫描输出、路径、漏洞细节或其他
敏感信息的 runtime 文件。

### 3.4 手工跑通，再开启周期调度

先初始化和验证：

```text
/loop-start sequential --mode safe --spec .tsp/loop.yaml
/heartbeat run
/loop-status
```

`/heartbeat run` 是单次运行，不是无副作用的 dry-run：失败项可能创建 goal 或
写入 triage inbox。确认分类、gate 和预算符合预期后，再执行：

```text
/heartbeat start --interval 30m
/heartbeat status
```

首个 loop 推荐使用 `sequential + safe`。`continuous-pr`、`rfc-dag`、`infinite`
和 `fast` 属于进阶模式；即使选择 `infinite`，也不能移除迭代、时长和成本上限。

## 4. 日常命令怎么用

| 命令 | 用户目的 | 典型结果 |
| ------ | ---------- | ---------- |
| `/loop-start` | 做四项准入检查，验证 spec，初始化状态 | loop 被拒绝或进入可运行状态 |
| `/heartbeat run` | 立即做一次发现扫描 | pass、自动 goal 或 triage item |
| `/heartbeat start` | 注册周期扫描 | target-specific 定时任务 |
| `/goal "..."` | 对一个有明确停止条件的目标持续迭代 | converged 或 escalated |
| `/goal status` | 看轮次、预算和最近 checker 结论 | 当前进度与 next hint |
| `/goal pause` / `resume` | 暂停或跨会话恢复 | 状态保留，不从头开始 |
| `/triage` | 查看需要人工判断的发现 | 待处理项列表 |
| `/triage act <id> goal` | 把人工确认的问题转为自动修复目标 | 新 goal |
| `/loop-status` | 查看单个 loop 的整体健康状态 | continue / pause / stop 建议 |
| `/dashboard` | 汇总 goals、heartbeat、triage、waves 和 rework | 全局运行视图 |

### 4.1 直接创建 goal

英文目标中的 `test`、`lint`、`coverage`、`build` 可以触发内置停止条件推断：

```text
/goal "make all tests pass" --budget-iterations 8 --budget-dollars 3
```

中文目标或自定义 gate 不应依赖关键词推断，必须显式提供条件：

```text
/goal "修复文档新鲜度问题" --condition "node scripts/validate-doc-freshness.js"
```

不要只写 `/goal "优化项目"`。没有可执行停止条件时，运行时会退回“需要人工验证”的失败条件，loop 不会可靠收敛。

### 4.2 处理 triage

```text
/triage list --severity high
/triage act triage-lq4x8 goal
/triage act triage-lq4x8 defer
/triage act triage-lq4x8 dismiss
/triage stats
```

以下问题默认应进入 triage，而不是自动修复：

- 安全漏洞是否接受风险
- 依赖是否升级到 breaking version
- 是否修改架构、权限或数据契约
- 预算耗尽、Checker 不确定或连续失败

## 5. 一次完整闭环会发生什么

1. Heartbeat 读取 `.tsp/loop.yaml`，把 `gates` 转成 discovery scans。
2. gate 通过时静默记录；失败时按策略创建 goal 或 triage item。
3. Goal 的 Maker 只完成一轮受限修改。
4. 独立、只读的 Checker 重新执行全部停止条件，返回通过/失败原因和 `nextHint`。
5. 全部条件通过后，goal 标记为 `converged`。
6. 任一预算耗尽或连续失败后，goal 标记为 `escalated`，交给 `/triage`。
7. 用户审查 diff、gate 证据和风险后，才能决定是否进入 `/handoff`、`/team-review` 或提交发布。

Maker 不能给自己的修改签字。若目标平台无法提供独立 Checker 或只读权限隔离，
不要把 loop 当作无人值守的完成证明；应退回 `/verify` 或人工 review。

## 6. 状态、跨会话恢复与上下文压缩

Loop 状态按以下优先级解析：

1. `TSP_LOOP_STATE_DIR`
2. 显式传入的项目状态目录，通常为 `.tsp/loops/`
3. target 默认目录，例如 `~/.claude/loops/`、`~/.codex/loops/`、`~/.config/opencode/loops/`

主要文件：

| 路径 | 内容 |
| ------ | ------ |
| `goals/{goalId}.json` | objective、停止条件、预算、轮次、checker 历史 |
| `triage/inbox.jsonl` | 等待人工判断的 heartbeat 和 goal 发现 |
| `heartbeat/last-run.json` | 最近一次扫描结果 |
| `state/{loopId}.md` | 面向人的 done / next / blockers / stop conditions |

Claude 安装会通过 SessionStart hook 提示上一会话遗留的 active/paused goals，
并可用 `/goal resume` 恢复。旧的 `~/.claude/goals`、
`~/.claude/triage/inbox.jsonl` 和 `.claude/heartbeat.yaml` 在迁移期仍可读。

长会话的自动 context compaction 与 goal 状态是两层机制：compaction 负责压缩
对话上下文，磁盘上的 goal/triage/heartbeat 状态负责恢复事实。不要把
“上下文还在”当成“loop 状态已持久化”，也不要依赖对话记忆替代状态文件。

## 7. 安全边界

- 首版不允许 loop 自动合并或直接推送受保护分支。
- loop 不能自行扩大工具、目录、网络或凭据权限。
- scheduled run 中不自动安装社区 skill 或未知依赖。
- gate 命令会在本地执行，必须像审查脚本一样审查 `.tsp/loop.yaml`。
- 安全发现默认交给人；不得让修复者自行降低安全 gate。
- cost 字段是预算契约，不等于所有 target 都能精确计费；目标平台无法提供可靠成本数据时，应使用更保守的迭代和时长上限。
- 定时器、终端或应用关闭后是否继续运行由 target 决定；需要离线持续运行时，应使用受控的 CI/GitHub Actions 调度器。

## 8. 常见问题

### `/loop-start` 提示 spec 无效

先检查 `.tsp/loop.yaml` 是否包含非空 `gates`，以及
`budget.maxIterations`、`maxDuration`、`maxDollars` 是否全部存在。`cadence`
只接受 `Nm`、`Nh`、`Nd`，`maxDuration` 只接受 `Nm`、`Nh`。

### `/heartbeat run` 返回 `no_scans`

确认当前工作目录正确，并至少存在一份有效配置：`.tsp/loop.yaml`、
`.tsp/heartbeat.yaml` 或旧版 `.claude/heartbeat.yaml`。优先修复
`.tsp/loop.yaml`，不要同时维护三份真相源。

### 中文 goal 一直要求人工验证

内置推断主要识别英文 `test`、`lint`、`coverage`、`build` 关键词。中文目标请通过 `--condition "..."` 明确 gate。

### 新会话没有提示恢复 goal

先执行 `/goal list` 确认状态文件存在，再确认 `TSP_LOOP_STATE_DIR` 在新会话中
保持一致。Claude 还需检查 `session-start-goal-resume.js` hook 是否已经安装；
其他 target 可以直接执行 `/goal resume <goalId>`。

### `/heartbeat start` 没有持续运行

先用 `/heartbeat run` 验证 runtime，再检查目标平台是否支持定时任务或唤醒。
暂不支持原生调度时，保留同一份 `.tsp/loop.yaml`，改由外部受控 scheduler
调用单次扫描。

### loop 反复修改同一文件但不收敛

立即暂停并检查三件事：gate 是否真的覆盖目标、Checker 是否与 Maker 隔离、
目标是否包含了需要人工判断的内容。预算耗尽或连续失败应进入 triage，
而不是提高预算继续碰运气。

## 9. 推荐上线顺序

1. 先选 CI triage 这类低风险、高可验证场景。
2. 手工执行一次 gate，记录基线。
3. 用 `/heartbeat run` 连续验证几次分类结果。
4. 再启用短周期调度，但保留人工 review 和禁止 auto-merge。
5. 观察 accepted change rate、人工介入次数、返工轮次和单次有效变更成本。
6. 如果有效变更率长期低于 50%，停止调度并重新设计 goal、skill 或 gate。

Loop Engineering 的价值不在“让 agent 永远运行”，而在“让重复工作只在证据通过时结束，并在不确定时及时交还给人”。
