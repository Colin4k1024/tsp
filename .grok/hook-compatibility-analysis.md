---
name: grok-hook-compatibility-analysis
scope: grokbuild
updated: 2026-07-29
last_verified: 2026-07-29
---

# Grok Hook 兼容性分析

## Grok 支持的 Hook 事件

根据 Grok Build 官方文档，Grok 使用与 Claude Code 完全一致的事件名：

| Grok 事件 | 触发时机 | 用途 |
|-----------|----------|------|
| `SessionStart` | 会话开始 | 注入上下文 |
| `SessionEnd` | 会话结束 | 保存状态 |
| `UserPromptSubmit` | 用户提交 prompt | 初始化会话 |
| `PreToolUse` | 工具即将运行（唯一阻断事件） | 安全检查、命令拦截 |
| `PostToolUse` | 工具完成 | 日志、观察 |
| `PostToolUseFailure` | 工具失败 | 错误处理 |
| `PermissionDenied` | 权限系统拒绝工具调用 | 拒绝处理 |
| `Stop` | 一个 turn 结束 | 会话总结、持久化 |
| `StopFailure` | turn 以 API 错误结束 | 错误处理 |
| `Notification` | Agent 发送通知 | 通知处理 |
| `SubagentStart` | 子 agent 启动 | 子 agent 管理 |
| `SubagentStop` | 子 agent 完成 | 子 agent 管理 |
| `PreCompact` | 对话压缩前 | 状态保存 |
| `PostCompact` | 对话压缩后 | 状态恢复 |

## TSP Hook 事件

Grok 使用与 Claude Code 完全一致的事件名，无需映射：

| TSP 事件 | 数量 | Grok 事件 |
|----------|------|-----------|
| `PreToolUse` | 17 | `PreToolUse` |
| `PostToolUse` | 12 | `PostToolUse` |
| `PostToolUseFailure` | 3 | `PostToolUseFailure` |
| `SessionStart` | 4 | `SessionStart` |
| `SessionEnd` | 2 | `SessionEnd` |
| `Stop` | 3 | `Stop` |
| `PreCompact` | 2 | `PreCompact` |

## 兼容性矩阵

### ✅ 完全兼容（可直接使用）

| TSP Hook | Grok 事件 | 说明 |
|----------|-----------|------|
| `session-start-bootstrap.js` | `SessionStart` | 会话启动时注入上下文 |
| `session-guard.js` | `SessionStart` | 会话保护检查 |
| `observe.sh` | `PostToolUse` | 工具使用观察 |
| `cost-tracker.js` | `PostToolUse` | 成本跟踪 |
| `memory-persistence/*.js` | `Stop` | 记忆持久化 |
| `strategic-compact/*.js` | `Stop` | 策略性压缩 |

### ⚠️ 部分兼容（需要适配）

| TSP Hook | Grok 事件 | 适配内容 |
|----------|-----------|----------|
| `pre-bash-block-no-verify.js` | `PreToolUse` | 输入格式转换 |
| `git-operation-gate.sh` | `PreToolUse` | 环境变量映射 |
| `naming-check.sh` | `PreToolUse` | 工具名转换 |
| `no-any.sh` | `PreToolUse` | TypeScript 特定 |
| `review-reminder.sh` | `PreToolUse` | 提示类 hook |
| `rtk-rewrite.sh` | `PostToolUse` | 命令重写 |
| `session-start-bootstrap.js` | `SessionStart` | 上下文注入 |

### ❌ 不兼容（需要重写）

| TSP Hook | 原因 | 替代方案 |
|----------|------|----------|
| `harness-context-monitor.js` | 依赖 Claude 特定 API | 使用 Grok `PreToolUse` |
| `harness-prompt-guard.js` | 依赖 Claude 特定 API | 使用 Grok `UserPromptSubmit` |
| `harness-statusline.js` | 依赖 Claude UI | 不适用 |
| `pre-compact.js` | 需适配 Grok 格式 | 使用 `PreCompact` |

## 详细兼容性分析

### 1. PreToolUse

**TSP PreToolUse Hooks (17个):**

```json
{
  "pre:bash:block-no-verify": "阻止 git hook-bypass 标志",
  "pre:bash:auto-tmux-dev": "自动启动 tmux 开发服务器",
  "pre:bash:tmux-reminder": "tmux 提醒",
  "pre:bash:git-push-reminder": "git push 提醒",
  "pre:bash:git-commit-reminder": "git commit 提醒",
  "pre:bash:no-any": "TypeScript no-any 检查",
  "pre:bash:naming-check": "命名规范检查",
  "pre:bash:review-reminder": "代码审查提醒",
  "pre:bash:unauthorized-tools": "未授权工具检查",
  "pre:bash:hook-control": "Hook 控制",
  "pre:bash:session-guard": "会话保护",
  "pre:bash:git-operation-gate": "Git 操作门禁",
  "pre:bash:tool-gate": "工具门禁",
  "pre:bash:context-budget": "上下文预算",
  "pre:bash:enforce-pr-description": "PR 描述强制",
  "pre:bash:validate-changelog": "变更日志验证",
  "pre:bash:worktree-lifecycle": "Worktree 生命周期"
}
```

**Grok PreToolUse 输入格式（官方规范）:**
```json
{
  "hookEventName": "PreToolUse",
  "sessionId": "...",
  "cwd": "...",
  "workspaceRoot": "...",
  "toolName": "Bash",
  "toolInput": { "command": "..." }
}
```

**适配要求:**
- 事件名一致，无需映射
- 工具名由 Grok 自动映射（无需手动转换）
- 使用 camelCase 字段名（`sessionId`, `toolName`, `toolInput`）

### 2. PostToolUse

**TSP PostToolUse Hooks (12个):**

```json
{
  "post:bash:observation": "工具使用观察",
  "post:bash:cost-tracker": "成本跟踪",
  "post:bash:memory-persistence": "记忆持久化",
  "post:bash:rtk-rewrite": "RTK 命令重写",
  "post:bash:session-data": "会话数据保存",
  "post:bash:git-nexus": "Git Nexus 集成",
  "post:bash:codegraph": "CodeGraph 集成",
  "post:bash:graphify": "Graphify 集成",
  "post:bash:langfuse-trace": "Langfuse 追踪",
  "post:bash:harness-audit": "Harness 审计",
  "post:bash:workflow-state": "工作流状态",
  "post:bash:artifact-persist": "产物持久化"
}
```

**Grok PostToolUse 输入格式（官方规范）:**
```json
{
  "hookEventName": "PostToolUse",
  "sessionId": "...",
  "cwd": "...",
  "workspaceRoot": "...",
  "toolName": "Bash",
  "toolInput": { "command": "..." }
}
```

**适配要求:**
- 事件名一致，无需映射
- 使用 camelCase 字段名

### 3. SessionStart

**TSP SessionStart Hooks (4个):**

```json
{
  "session-start-bootstrap": "会话启动引导",
  "session-guard": "会话保护",
  "context-budget": "上下文预算",
  "memory-recall": "记忆召回"
}
```

**Grok SessionStart 输入格式（官方规范）:**
```json
{
  "hookEventName": "SessionStart",
  "sessionId": "...",
  "cwd": "...",
  "workspaceRoot": "..."
}
```

**适配要求:**
- 使用 camelCase 字段名

### 4. Stop

**TSP Stop Hooks (3个):**

```json
{
  "stop:memory-persistence": "记忆持久化",
  "stop:session-summary": "会话总结",
  "stop:strategic-compact": "策略性压缩"
}
```

**Grok Stop 输入格式（官方规范）:**
```json
{
  "hookEventName": "Stop",
  "sessionId": "...",
  "cwd": "...",
  "workspaceRoot": "..."
}
```

**适配要求:**
- 使用 camelCase 字段名
- 注意：`Stop`（turn 结束）与 `SessionEnd`（会话结束）是独立事件

## 推荐迁移策略

### Phase 1: 观察类 Hook（低风险）

**目标:** 先迁移只读、不阻断的 hook

| Hook | Grok 事件 | 风险 | 优先级 |
|------|-----------|------|--------|
| `observe.sh` | `PostToolUse` | 低 | P0 |
| `cost-tracker.js` | `PostToolUse` | 低 | P0 |
| `memory-persistence/*.js` | `Stop` | 低 | P0 |
| `session-start-bootstrap.js` | `SessionStart` | 低 | P0 |

### Phase 2: 提示类 Hook（中风险）

**目标:** 迁移提示、提醒类 hook

| Hook | Grok 事件 | 风险 | 优先级 |
|------|-----------|------|--------|
| `review-reminder.sh` | `PreToolUse` | 中 | P1 |
| `tmux-reminder` | `PreToolUse` | 中 | P1 |
| `git-push-reminder` | `PreToolUse` | 中 | P1 |
| `git-commit-reminder` | `PreToolUse` | 中 | P1 |

### Phase 3: 阻断类 Hook（高风险）

**目标:** 迁移阻断、门禁类 hook

| Hook | Grok 事件 | 风险 | 优先级 |
|------|-----------|------|--------|
| `pre-bash-block-no-verify.js` | `PreToolUse` | 高 | P2 |
| `git-operation-gate.sh` | `PreToolUse` | 高 | P2 |
| `unauthorized-tools.sh` | `PreToolUse` | 高 | P2 |
| `session-guard.js` | `SessionStart` | 高 | P2 |

## 实现建议

### 1. 创建 Grok Hook 适配器

```javascript
// scripts/grok/grok-hook-adapter.js

// Grok 使用与 Claude Code 完全一致的事件名，无需映射
function adaptHookForGrok(tspHook, grokEvent) {
  return {
    matcher: tspHook.matcher,
    hooks: tspHook.hooks.map(h => ({
      type: 'command',
      command: adaptCommand(h.command),
      timeout: h.timeout || 30,
    })),
  };
}

function adaptCommand(command) {
  // 替换环境变量
  return command
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, '${GROK_PLUGIN_ROOT}')
    .replace(/\$\{CLAUDE_HOME\}/g, '${GROK_HOME}');
}
```

### 2. 创建 Grok hooks.json

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "node ${GROK_PLUGIN_ROOT}/hooks/session-start-bootstrap.js",
          "timeout": 60
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [{
          "type": "command",
          "command": "node ${GROK_PLUGIN_ROOT}/hooks/observe.sh",
          "timeout": 30
        }]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "node ${GROK_PLUGIN_ROOT}/hooks/memory-persistence/stop.sh",
          "timeout": 60
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "node ${GROK_PLUGIN_ROOT}/hooks/pre-bash-block-no-verify.js",
          "timeout": 5
        }]
      }
    ]
  }
}
```

## 兼容性总结

| 类别 | 数量 | 兼容性 | 迁移难度 |
|------|------|--------|----------|
| 观察类 | 8 | ✅ 完全兼容 | 低 |
| 提示类 | 6 | ⚠️ 部分兼容 | 中 |
| 阻断类 | 10 | ⚠️ 需要适配 | 高 |
| 会话类 | 4 | ✅ 完全兼容 | 低 |
| **总计** | **28** | - | - |

## 下一步

1. **Phase 3.1:** 迁移观察类 hook（observe, cost-tracker, memory-persistence）
2. **Phase 3.2:** 迁移提示类 hook（review-reminder, tmux-reminder）
3. **Phase 3.3:** 迁移阻断类 hook（block-no-verify, git-operation-gate）
4. **Phase 3.4:** 测试和验证所有 hook
5. **Phase 3.5:** 创建 Grok hooks.json 配置

---

Last updated: 2026-07-29
