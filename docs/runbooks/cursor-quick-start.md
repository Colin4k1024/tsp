---
version: "2.3.0"
status: draft
created: 2026-03-28
updated: 2026-04-18
owner: 工程团队
doc_tier: entry
last_verified: 2026-04-18
source_of_truth:
  - ../../README.md
  - ../../AGENTS.md
  - ./team-skills-usage.md
---

# Cursor Quick Start — Team Skills Platform

> 参考对象：需要在 Cursor 编辑器中使用 Team Skills Platform 的工程师。

## 1. 安装

```bash
node scripts/build-platform-artifacts.js
./scripts/install-cursor.sh

# 指定自定义路径
CURSOR_HOME_DIR=/path/to/cursor ./scripts/install-cursor.sh
```

## 2. 安装后目录结构

```text
~/.cursor/
├── plugins/team-skills-platform/
│   ├── .cursor-plugin/
│   ├── skills/                     # 当前正式技能目录（统一平铺）
│   ├── commands/                   # 团队主链 + specialist 命令
│   ├── rules/
│   ├── agents/
│   │   ├── roles/
│   │   └── specialists/
│   ├── hooks/                      # 用户可见 hook 入口
│   ├── scripts/hooks/              # 当前 JS runtime hooks
│   ├── contexts/
│   ├── examples/
│   └── mcp-configs/
└── rules/                          # Cursor MDC 规则输出
```

Cursor 安装输出只保留当前 JS runtime 入口，不再把旧 Python hook 文件名当成现行能力。

### 2.1 可选能力检查：Graphify

如果你准备在 brownfield 项目中启用知识图谱能力，安装后可以先做预检查：

```bash
npm run graphify:doctor
```

预检查仅验证环境，不会自动安装依赖。若失败，按 [troubleshooting.md](troubleshooting.md) 的 Graphify 章节处理。

## 3. 在 Cursor 中怎么进入主链

- 公开入口统一从 `/team-help` 开始
- 正式任务产出要通过 `npm run artifact:persist -- ...` 回写到项目仓库
- specialist 结论仍需回落到 `/handoff` 或 `/team-*`

## 4. 在 Cursor 中使用

### 4.1 引用角色 Agent

```text
请以 Tech Lead 角色帮我拆解这个需求。
参考：~/.cursor/plugins/team-skills-platform/agents/roles/tech-lead.md
```

### 4.2 使用团队命令

```text
先执行 /team-help，判断当前是先 intake、plan，还是先补 brownfield / readiness 证据。
```

```text
执行 /team-plan 流程，定义见：
~/.cursor/plugins/team-skills-platform/commands/team-plan.md
```

### 4.3 引用 Skill

```text
读取 ~/.cursor/plugins/team-skills-platform/skills/systematic-debugging/SKILL.md 并帮我定位这个 bug。
```

## 5. 常用命令速查

| 命令 | 用途 |
|------|------|
| `/team-help` | 根据当前阶段、artifacts 与阻塞项推荐下一步 |
| `/team-intake` | 接收需求并锁定目标、范围、约束 |
| `/team-plan` | 收口 challenge / design / readiness，并拆解里程碑 |
| `/team-execute` | 消费 readiness proof 执行实现 |
| `/team-review` | 做方案、质量、测试和放行评审 |
| `/team-release` | 做发布准备、上线检查与回滚保障 |
| `/team-closeout` | 在观察窗口结束后做最终收口 |
| `/handoff` | 在角色间做结构化交接 |
| `/plan` | Planner specialist 规划入口 |
| `/code-review` | Code Reviewer specialist 入口 |
| `/tdd` | TDD 先行入口 |
| `/build-fix` | 构建错误修复入口 |

## 6. 重新安装 / 更新

```bash
node scripts/build-platform-artifacts.js
./scripts/install-cursor.sh
```

## 7. 相关文档

- [CLAUDE.md](../../CLAUDE.md) — 平台总览
- [claude-quick-start.md](claude-quick-start.md) — Claude 快速上手
- [opencode-quick-start.md](opencode-quick-start.md) — OpenCode 快速上手
- [team-skills-usage.md](team-skills-usage.md) — 完整使用手册
