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

# OpenCode Quick Start — Team Skills Platform

> 参考对象：需要在 OpenCode 中使用 Team Skills Platform 的工程师。

## 1. 安装

```bash
node scripts/build-platform-artifacts.js
node scripts/install-apply.js --profile team --target opencode

# 遗留脚本仍可用于指定自定义路径
OPENCODE_CONFIG_DIR=/path/to/opencode ./scripts/install-opencode.sh
```

## 2. 安装后目录结构

```text
~/.config/opencode/
├── plugins/team-skills-platform/
│   ├── .opencode-plugin/
│   ├── skills/                     # 当前正式技能目录（统一平铺）
│   ├── commands/
│   ├── rules/
│   ├── agents/
│   │   ├── roles/
│   │   └── specialists/
│   ├── hooks/
│   ├── contexts/
│   ├── examples/
│   └── mcp-configs/
└── AGENTS.md                       # 自动合并的角色 / 命令入口
```

OpenCode 公开表面只保留当前 `skills/` 目录和 JS runtime 入口，不再把旧三层 skill 目录或 Python hook 文件名当成现行结构。

### 2.1 代码图谱能力检查：CodeGraph / Graphify / GitNexus

如果你准备在 brownfield 项目中启用代码图谱能力，安装后可以先做预检查：

```bash
npm run codegraph:doctor
npm run graphify:doctor
npm run gitnexus:doctor
```

CodeGraph 是默认内置的 MCP-backed 符号、调用链和影响面能力；Graphify 适合轻量结构证据，GitNexus 适合更深 MCP 查询、impact 和 detect_changes。CodeGraph 的 TSP 安装 wrapper 使用官方 standalone installer 且不会使用 `--target=auto`；OpenCode 当前不做侵入式自动 hook，目标项目需要索引时运行 `codegraph init -i`。

## 3. AGENTS.md 会写入什么

安装脚本会在 `~/.config/opencode/AGENTS.md` 自动写入 Team Skills Platform 区块，至少包括：

- 角色引用路径
- `/team-help` 在内的核心主链命令速查表
- 插件根路径说明

## 4. 在 OpenCode 中怎么用

- 公开入口统一从 `/team-help` 开始
- 正式任务产出要通过 `npm run artifact:persist -- ...` 回写到项目仓库
- specialist 结论仍需回落到 `/handoff` 或 `/team-*`

### 4.1 通过 AGENTS.md 激活角色

```text
请以 Tech Lead 角色帮我拆解这个需求，参考 AGENTS.md 中的角色定义。
```

### 4.2 直接引用命令定义

```text
先执行 /team-help，判断当前该进入 intake、plan，还是先补 readiness 证据。
```

```text
执行 /team-plan 流程，定义见：
~/.config/opencode/plugins/team-skills-platform/commands/team-plan.md
```

### 4.3 引用 Skill

```text
读取并应用以下 skill：
~/.config/opencode/plugins/team-skills-platform/skills/systematic-debugging/SKILL.md
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
node scripts/install-apply.js --profile team --target opencode
```

## 7. 相关文档

- [AGENTS.md](../../AGENTS.md) — 平台总览
- [claude-quick-start.md](claude-quick-start.md) — Claude 快速上手
- [team-skills-usage.md](team-skills-usage.md) — 完整使用手册
