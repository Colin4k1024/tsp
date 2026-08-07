---
version: "2.5.6"
status: draft
created: 2026-08-07
updated: 2026-08-07
owner: 工程团队
doc_tier: entry
last_verified: 2026-08-07
source_of_truth:
  - ../../README.md
  - ../../AGENTS.md
  - ./team-skills-usage.md
---

# Grok Build Quick Start — Team Skills Platform

> 参考对象：需要在 Grok Build CLI 中使用 Team Skills Platform 的工程师。

## 1. 安装

```bash
node scripts/build-platform-artifacts.js
node scripts/install-apply.js --profile full --target grok
```

## 2. 安装后目录结构

```text
~/.grok/
├── plugins/team-skills-platform/
│   ├── .grok-plugin/
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
└── rules/                          # Grok 规则输出
```

### 2.1 代码图谱能力检查：CodeGraph / Graphify / GitNexus

如果你准备在 brownfield 项目中启用代码图谱能力，安装后可以先做预检查：

```bash
npm run codegraph:doctor
npm run graphify:doctor
npm run gitnexus:doctor
```

CodeGraph 是默认内置的 MCP-backed 符号、调用链和影响面能力；Graphify 适合轻量结构证据，GitNexus 适合更深 MCP 查询、impact 和 detect_changes。CodeGraph 的 TSP 安装 wrapper 使用官方 standalone installer 且不会使用 `--target=auto`；目标项目需要索引时运行 `codegraph init -i`。

## 3. 在 Grok Build 中怎么进入主链

- 公开入口统一从 `/team-help` 开始
- 正式任务产出要通过 `npm run artifact:persist -- ...` 回写到项目仓库
- specialist 结论仍需回落到 `/handoff` 或 `/team-*`

## 4. 在 Grok Build 中使用

### 4.1 引用角色 Agent

```text
请以 Tech Lead 角色帮我拆解这个需求。
参考：~/.grok/plugins/team-skills-platform/agents/roles/tech-lead.md
```

### 4.2 使用团队命令

```text
先执行 /team-help，判断当前是先 intake、plan，还是先补 brownfield / readiness 证据。
```

```text
执行 /team-plan 流程，定义见：
~/.grok/plugins/team-skills-platform/commands/team-plan.md
```

### 4.3 引用 Skill

```text
读取 ~/.grok/plugins/team-skills-platform/skills/systematic-debugging/SKILL.md 并帮我定位这个 bug。
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
node scripts/install-apply.js --profile full --target grok
```

## 7. 相关文档

- [CLAUDE.md](../../CLAUDE.md) — 平台总览
- [claude-quick-start.md](claude-quick-start.md) — Claude 快速上手
- [opencode-quick-start.md](opencode-quick-start.md) — OpenCode 快速上手
- [team-skills-usage.md](team-skills-usage.md) — 完整使用手册
