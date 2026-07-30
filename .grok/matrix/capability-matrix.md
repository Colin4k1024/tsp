---
name: grok-capability-matrix
scope: grokbuild
updated: 2026-07-29
last_verified: 2026-07-29
---

# Grok × TSP Capability Matrix

## 组件统计

| 类型 | 数量 | 来源 |
|------|------|------|
| Skills | 212 | `skills/` |
| Commands | 87 | `commands/` |
| Agents (role) | 8 | `agents/roles/` |
| Agents (specialist) | 27 | `agents/specialists/` |
| Hooks | 43 | `hooks/` |
| Rules | 88 | `rules/` |
| Roles | 8 | `roles/` |

## 能力分类

### Native（原生支持，无需修改）

| 组件 | 数量 | 说明 |
|------|------|------|
| Skills (SKILL.md) | 212 | Grok 原生支持 skills 机制 |
| Commands | 87 | Grok 会转换成可调用 skills |

### Adapted（需要适配层）

| 组件 | 数量 | 适配内容 |
|------|------|----------|
| Role Agents | 8 | 需生成 Grok YAML frontmatter |
| Specialist Agents | 27 | 需生成 Grok YAML frontmatter |
| Rules/Profiles | ~88 | 转为按需加载的 governance skill |
| Hooks (snake_case) | 17 | 需 camelCase 事件桥接 |
| Hooks (env dependent) | 19 | 需消除 `~/.claude` 直接依赖 |

### Deferred（延后处理）

| 组件 | 说明 |
|------|------|
| 13 个无脚本 hook | 仅配置声明，延后 |
| 7 个低风险 hook | 非阻断类，可后续启用 |
| Roles YAML | 转为 governance skill 上下文 |

### Unsupported（不支持）

| 组件 | 说明 |
|------|------|
| Claude 环境变量依赖 | 需重写或抽象 |
| `~/.claude` 直接读写 | 需路径抽象层 |

## Hook 兼容性详情

### Grok 事件协议（PascalCase，与 Claude Code 一致）
- `PreToolUse` → TSP `PreToolUse`（无需映射）
- `PostToolUse` → TSP `PostToolUse`（无需映射）
- `SessionStart` → TSP `SessionStart`（无需映射）
- `Stop` → TSP `Stop`（无需映射）
- 详见 Grok Build 官方文档

### 需要适配的 Hook 脚本（只读 snake_case）

```
hooks/check-approval-mode.sh
hooks/context-budget.sh
hooks/enforce-pr-description.sh
hooks/git-operation-gate.sh
hooks/hard-block-auto-approve.sh
hooks/hook-control.sh
hooks/naming-check.sh
hooks/no-any.sh
hooks/observe.sh
hooks/pre-commit-quality.sh
hooks/review-reminder.sh
hooks/rtk-rewrite.sh
hooks/session-guard.sh
hooks/tool-gate.sh
hooks/unauthorized-tools.sh
hooks/validate-changelog.sh
hooks/worktree-lifecycle.sh
```

## 依赖 `~/.claude` 的文件

```
scripts/lib/install-apply.js
scripts/lib/overlay-merge.js
hooks/*.sh (19 个)
.claude/settings.local.json
```

## 版本基线

| 组件 | 版本 |
|------|------|
| TSP | 2.5.5 |
| Node.js | >=18 |
| Grok | 待锁定 commit |

## 待确认项

1. 是否必须无 Node.js 依赖？
2. 是否要求首期覆盖全部 hooks？
3. Grok commit SHA 锁定时机？
