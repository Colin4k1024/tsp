---
version: "2.3.0"
status: draft
created: 2026-03-29
updated: 2026-04-18
owner: 工程团队
---

# Runtime 能力总览

本文解释 Team Skills Platform 里那些“不是你手动输入的命令，但会改变会话行为”的后台能力。当前公开契约已经收口到 JavaScript runtime：以 `hooks/hooks.json` 为配置入口，以 `scripts/hooks/*.js` 为执行入口，不再使用已删除的 Python hook 文件名。

## 1. 这份文档回答什么

- 当前 runtime 的真实入口在哪里
- `/team-help`、`artifact:persist` 和后台 hooks 是什么关系
- Claude 安装后哪些 JS hooks 会真正影响会话
- 长会话、memory、audit、budget 和 governance 信号如何落盘

## 2. 当前运行时分层

### 2.1 配置入口

- `hooks/hooks.json`：Claude hooks 的唯一声明式配置入口
- `scripts/install-platform.js`：legacy Claude 安装时负责复制 `scripts/hooks/`、清理旧 `.py` 引用，并把当前 JS hooks 合并到 `settings.json`

### 2.2 执行入口

- `scripts/hooks/session-start-bootstrap.js`：SessionStart bootstrap
- `scripts/hooks/session-start.js`：加载 `docs/memory/project-context.md`、session summary 等上下文
- `scripts/hooks/pre-compact.js`：PreCompact 前的高价值状态整理
- `scripts/hooks/suggest-compact.js`：在真实上下文使用率超过 70/85/95% 时提示人工 compact
- `scripts/hooks/session-end.js`：Stop 阶段持久化 session 摘要
- `scripts/hooks/session-end-marker.js`：SessionEnd 生命周期标记
- `scripts/hooks/cost-tracker.js`：记录 token / cost 指标
- `scripts/hooks/governance-capture.js`：采集治理与审批相关信号
- `scripts/hooks/mcp-health-check.js`：MCP 健康检查
- `scripts/hooks/quality-gate.js`：编辑后质量门禁

### 2.3 状态与存储

- `scripts/lib/state-store/`：runtime 状态存储入口
- `docs/memory/project-context.md`：主链共享项目上下文
- `docs/memory/decisions.md`、`docs/memory/lessons-learned.md`：轻量项目记忆
- `docs/memory/sessions/`：session continuity 落点
- `~/.claude/metrics/costs.jsonl`：cost tracker 输出
- `~/.claude/memory/audit/`：本地 audit 查询输入

## 3. 关键能力说明

### 3.1 Session memory

- 触发点：`session-start-bootstrap.js`、`session-start.js`、`session-end.js`
- 作用：会话开始时恢复项目上下文、最近摘要和待办；Stop 阶段把本轮摘要写回 session continuity 文件
- 用户侧影响：重新进入任务时，更容易保持 `/team-plan`、`/team-execute`、`/team-review` 的连续性

### 3.2 Governance capture

- 触发点：`governance-capture.js`
- 作用：检测 secrets、approval-required 操作、敏感路径写入等治理信号
- 用户侧影响：在高风险 Bash / Edit / Write 行为上留痕，可为后续 review 或 release 说明补证据

### 3.3 Cost awareness

- 触发点：`cost-tracker.js`
- 作用：记录 token、模型与成本估算，辅助长会话预算判断
- 用户侧影响：可以用 `node scripts/query-audit-logs.js --summary-only` 或直接查看 `~/.claude/metrics/costs.jsonl` 了解会话成本

### 3.4 Compact readiness

- 触发点：`suggest-compact.js`、`pre-compact.js`
- 作用：在进入 compact 前整理状态，在高上下文压力下基于 `context_window` 给出压缩提示
- 用户侧影响：长任务中更容易知道什么时候该手动 compact，而不是在主链中段突然失去上下文

### 3.5 MCP health

- 触发点：`mcp-health-check.js`
- 作用：在 MCP 调用前后记录健康状态，降低“工具看起来可用但实际已失效”的误判

### 3.6 Quality after edits

- 触发点：`quality-gate.js` 以及 Stop 阶段的格式化 / typecheck hook
- 作用：在 Edit / Write 后补做最小质量闸口，避免把明显坏状态直接带到 `/handoff` 或 `/team-review`

## 4. 一条典型 runtime 流水线

1. SessionStart：`session-start-bootstrap.js` 调度 `session-start.js`
2. 读取 `docs/memory/project-context.md` 与 session continuity 文件
3. 用户通过 `/team-help` 判断当前该进入哪条主链命令
4. `/team-intake`、`/team-plan`、`/team-execute` 等命令通过 `artifact:persist` 把正式输出落到 `docs/artifacts/`
5. PreToolUse / PostToolUse 期间，`governance-capture.js`、`mcp-health-check.js`、质量与观察类 hooks 持续提供后台信号
6. 长会话中，`suggest-compact.js` 根据真实上下文压力给出 compact 提示，`pre-compact.js` 在真正 compact 前整理关键状态
7. Stop：`session-end.js`、`cost-tracker.js` 等 JS hooks 在响应结束后持久化摘要与指标
8. SessionEnd：`session-end-marker.js` 记录生命周期收尾

## 5. 和 `/team-*` 主链是什么关系

- `/team-help` 是唯一公开入口：负责根据 artifacts、handoff 和当前阶段决定下一步
- `artifact:persist` 是主链输出的唯一落盘通道：负责把 PRD、delivery-plan、execute-log、handoff、release/closeout artifact 写入仓库
- runtime hooks 不是第二套 workflow：它们只负责补上下文、记忆、治理和质量信号，不替代 `/team-*`

## 6. 当前推荐查看路径

- 想先看公开命令与能力映射：看 [command-and-capability-matrix.md](command-and-capability-matrix.md)
- 想先看接入与落盘动作：看 [team-skills-usage.md](team-skills-usage.md) 和 [project-onboarding.md](project-onboarding.md)
- 想先体验 Claude：看 [claude-quick-start.md](claude-quick-start.md)
- 想先理解 ECC 增强层与主链如何配合：看 [ecc-harness-usage.md](ecc-harness-usage.md)

## 7. 常见误解

- 误解一：runtime 还是 Python hooks。当前 active surface 已切到 `scripts/hooks/*.js`
- 误解二：`/team-help` 只是说明文案。它现在是公开主链唯一入口
- 误解三：memory 只靠 hook 自动生成。正式任务产出仍必须通过 `artifact:persist` 写入 `docs/artifacts/`、`docs/adr/` 和 `docs/memory/`
