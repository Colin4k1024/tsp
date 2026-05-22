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
  - ./project-onboarding.md
---

# 安装与使用排障

本文用于排查 Team Skills Platform 在安装、加载和首次使用过程中的高频问题。建议先按症状定位，再看对应章节，而不是从头读到尾。

## 1. 最常见的症状

- 安装脚本执行成功，但看不到 `/team-help`
- 运行 `node scripts/build-platform-artifacts.js` 或 `node scripts/validate-library.js` 失败
- Claude 或 Codex 找不到角色 agent / specialist
- 项目级 `CLAUDE.md` 不知道哪些字段是必须的
- 使用了 custom overlay，但 review 阶段无法说明启用原因和执行记录
- `npm run codegraph:doctor` 失败（standalone binary、curl/PowerShell 或 target wrapper 问题）
- `npm run graphify:doctor` 失败（Python 版本或 Graphify CLI 缺失）
- `npm run gitnexus:doctor` 失败（Node 版本、npm/npx 或许可证确认问题）

## 2. 安装脚本相关问题

### 2.1 构建脚本失败

先检查：

1. 是否在仓库根目录执行脚本
2. `node` 是否可用
3. 是否先修改了 canonical source，再执行构建

推荐命令：

```bash
node scripts/build-platform-artifacts.js
node scripts/validate-library.js
node scripts/validate-doc-freshness.js
```

如果失败，优先看报错是否属于：

- Node.js 版本或环境问题
- 文档链接失效
- 生成产物与源文件不一致

### 2.2 安装目录不对

Claude 检查点：

- `~/.claude/commands/team-help.md`
- `~/.claude/agents/roles/tech-lead.md`
- `~/.claude/examples/project-CLAUDE.md`

Codex 检查点：

- `$CODEX_HOME_DIR/plugins/team-skills-platform/commands/team-help.md`
- `$CODEX_HOME_DIR/plugins/team-skills-platform/agents/roles/tech-lead.md`
- `$AGENTS_HOME_DIR/plugins/marketplace.json`

如果路径不对，检查是否错误覆盖了：

- `CLAUDE_HOME_DIR`
- `CODEX_HOME_DIR`
- `AGENTS_HOME_DIR`

## 3. 命令或 agent 不可用

### 3.1 看不到 `/team-help`

按顺序检查：

1. 安装目录是否有命令文件
2. 是否先执行了构建脚本
3. 是否安装到了你当前实际使用的 Claude / Codex 目录

如果命令文件存在但仍不可用，先重新安装一次平台，再验证目录落点。

### 3.2 看不到角色 agent 或 specialist

检查：

- Claude：`~/.claude/agents/roles/` 和 `~/.claude/agents/specialists/`
- Codex：`$CODEX_HOME_DIR/plugins/team-skills-platform/agents/roles/` 和 `.../specialists/`

如果目录存在但上下文中没体现，优先回到 quick start 文档确认你是否仍在正确的使用路径上。

## 4. 项目级 CLAUDE 配置问题

### 4.1 最小必填项

项目级 `CLAUDE.md` 至少应包含：

- 项目背景
- 默认角色链路
- 默认命令流
- 项目约束

如果缺少这些内容，模型很难稳定地遵守边界和门禁。

### 4.2 选哪个示例

优先看 [../../examples/INDEX.md](../../examples/INDEX.md)。

快速规则：

- 全栈混合项目：从 [../../examples/project-CLAUDE.md](../../examples/project-CLAUDE.md) 开始
- 前端主导项目：从 [../../examples/saas-nextjs-CLAUDE.md](../../examples/saas-nextjs-CLAUDE.md) 开始
- 后端主导项目：从 [../../examples/springboot-service-CLAUDE.md](../../examples/springboot-service-CLAUDE.md) 开始
- 流程型企业项目：从 [../../examples/workflow-enterprise-CLAUDE.md](../../examples/workflow-enterprise-CLAUDE.md) 开始
- 平台治理仓库：从 [../../examples/platform-governance-CLAUDE.md](../../examples/platform-governance-CLAUDE.md) 开始
- 数据看板项目：从 [../../examples/data-analytics-dashboard-CLAUDE.md](../../examples/data-analytics-dashboard-CLAUDE.md) 开始
- 不理解每一段作用：先看 [project-claude-design-rationale.md](project-claude-design-rationale.md)

## 5. 主链输出质量问题

### 5.1 execute 结果不够结构化

常见错误：

- 只写“已完成开发”
- 没有自测结果
- 没有剩余风险

建议对照 [team-command-output-contracts.md](team-command-output-contracts.md) 和 [first-team-workflow-walkthrough.md](first-team-workflow-walkthrough.md) 补齐结构。

### 5.2 handoff 不知道写什么

`/handoff` 的目标不是重复 diff，而是交代：

- 改了什么
- 验证了什么
- 还有什么风险
- 下一角色应该关注什么

如果启用了 custom overlay，还要附带装配或执行记录。

### 5.3 不知道怎么开口才能拿到结构化输出

如果你发现模型总是只给松散建议，而不是主链可用结果，优先看：

- [claude-conversation-prompt-recipes.md](claude-conversation-prompt-recipes.md)
- [codex-parallel-prompt-recipes.md](codex-parallel-prompt-recipes.md)
- [team-commands-quick-prompts.md](team-commands-quick-prompts.md)

## 6. Enterprise Overlay 决策问题

### 6.1 什么时候启用

按这个节奏判断：

- intake：识别候选项
- plan：确认启用或不启用
- execute / review：若已启用，记录执行与核对结果

### 6.2 常见误区

- 看到审批或权限字样就立刻默认启用 custom overlay
- intake 没记录候选项，plan 阶段只能凭记忆判断
- execute 实际用了 custom overlay，但 review 阶段没有证据可回溯

详细判定清单见 [project-onboarding.md](project-onboarding.md)。

如果你卡在“候选项怎么写”或“plan 怎么表达未启用”，直接看 。

如果你已经进入 review 或 release，但不知道 overlay、runbook、toolkit 的执行记录怎么回写，继续看 。

### 6.3 发布治理不知道从哪看起

如果问题发生在发布、灰度、事故或回滚阶段，优先按下面顺序进入：

1. [release-governance-reading-path.md](release-governance-reading-path.md)
2. [pre-release-checklist.md](pre-release-checklist.md)
3. [incident-severity-triage-tree.md](incident-severity-triage-tree.md)
4. [post-rollback-verification-checklist.md](post-rollback-verification-checklist.md)

## 7. 遇到问题时推荐的回退路径

如果你不知道问题属于哪类，按下面顺序排：

1. 先确认构建和校验脚本能通过
2. 再确认安装目录和命令文件是否存在
3. 再确认项目级 `CLAUDE.md` 是否完整
4. 再确认你当前是在 quick start、onboarding 还是 walkthrough 的正确阶段

如果问题仍无法定位，建议把当前症状、执行命令和失败点整理成一个最小问题描述，再回到对应 runbook 定位。

## 8. CodeGraph 预检查失败

如果你看到下面任一报错：

- 当前平台不支持 CodeGraph standalone installer
- macOS / Linux 缺少 `curl`，或 Windows PowerShell 不可用
- CodeGraph CLI/bin 不可用
- 当前 TSP target 不是 `claude` / `codex` / `cursor` / `opencode`

优先按这个顺序处理：

1. 按官方方式安装 standalone CodeGraph：`curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh`
2. 离线或受限环境设置 `CODEGRAPH_INSTALL_BIN=/path/to/codegraph`
3. 重新执行 `npm run codegraph:doctor`
4. 若 target 不受上游 installer 支持，接受 wrapper 跳过并手动配置需要的 agent

说明：

- TSP 通过 `scripts/install-codegraph.js` 优先复用已有 binary，缺失时调用上游官方 standalone installer
- TSP 不使用上游 `--target=auto`
- Claude `SessionStart` 可在新项目静默运行 `codegraph init -i`；Codex/OpenCode 需要按说明或手动运行
- 不要提交 `.codegraph/` 数据库
- CodeGraph 详细用法见 [codegraph-code-intelligence-usage.md](codegraph-code-intelligence-usage.md)

## 9. Graphify 预检查失败

如果你看到下面任一报错：

- Python 版本低于 `3.10`
- `graphify` 命令不存在

优先按这个顺序处理：

1. 安装或切换到 Python `3.10+`
2. 在对应环境安装 `graphify`
3. 重新执行 `npm run graphify:doctor`
4. 用 `graphify --help` 验证 CLI 已可用

说明：

- 仓库只提供 preflight 检查，不会自动安装 Python 或 Graphify
- 不要在本仓库执行 `graphify codex install` / `graphify claude install` 改写现有 AGENTS/hooks 契约
- Graphify 详细用法见 [graphify-knowledge-graph-usage.md](graphify-knowledge-graph-usage.md)

## 10. GitNexus 预检查失败

如果你看到下面任一报错：

- Node 版本低于 `20`
- `npm` 或 `npx` 不可用
- npm registry 元数据读取失败

优先按这个顺序处理：

1. 在目标项目环境切换到 Node `20+`
2. 确认 `npm --version` 与 `npx --version` 可正常执行
3. 重新执行 `npm run gitnexus:doctor`
4. 若 registry 临时不可用，手动核对 GitNexus 上游许可证和 engine 后再决定是否启用

说明：

- 仓库只提供 preflight 检查，不会自动安装 GitNexus
- 不要自动执行 `gitnexus setup` 改写全局 MCP/editor 配置
- 在 TSP 管理仓库执行索引时，使用 `npx --yes gitnexus@latest analyze --skip-agents-md`
- GitNexus 详细用法见 [gitnexus-code-intelligence-usage.md](gitnexus-code-intelligence-usage.md)
