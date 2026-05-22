---
version: "0.1.0"
status: active
created: 2026-05-20
updated: 2026-05-22
owner: 工程团队
doc_tier: runbook
last_verified: 2026-05-22
source_of_truth:
  - ../../skills/codegraph/SKILL.md
  - ../../README.md
  - ../../AGENTS.md
  - https://github.com/colbymchenry/codegraph
---

# CodeGraph 代码智能能力使用手册

## 1. 定位

CodeGraph 在 TSP 中是 **默认内置 MCP-backed 代码图谱能力**。它适合 brownfield 项目的符号搜索、调用链、影响面、文件结构和 focused context 查询。

它不替代 `/team-*` 主链，也不替代 `/update-codemaps` 的轻量现状快照。CodeGraph 用于当前 agent 可直接消费的本地图谱查询；Graphify 偏轻量结构证据；GitNexus 偏更深 MCP 查询、diff impact、多仓和执行流证据。

## 2. 前置检查

先跑：

```bash
npm run codegraph:doctor
```

检查项：

- 当前平台支持官方 standalone installer（macOS / Linux / Windows）
- macOS / Linux 可用 `curl`，Windows 可用 PowerShell
- CodeGraph standalone CLI/bin 可用
- 当前 `TSP_INSTALL_TARGET` 是否能映射到上游支持的 `claude` / `codex` / `cursor` / `opencode`

## 3. 安装边界

TSP 通过 `scripts/install-codegraph.js` 优先复用已有 `codegraph` binary；如果缺失，则调用上游官方 standalone installer：

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh

# Windows PowerShell
irm https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.ps1 | iex
```

随后将当前 TSP target 映射成上游 target：

```bash
codegraph install --target=<claude|codex|cursor|opencode> --location=global --yes
```

明确边界：

- 不使用上游 `--target=auto`
- Claude `SessionStart` hook 会在新项目缺少 `.codegraph/codegraph.db` 时静默执行 `codegraph init -i <projectRoot>`
- Codex / OpenCode 不做侵入式自动 hook，只依赖全局 MCP 配置、说明和 doctor 诊断
- 可用 `TSP_CODEGRAPH_AUTO_INIT=0` 关闭 Claude 自动初始化
- 不把 `.codegraph/` 数据库提交到 TSP 或消费方项目
- unsupported target 只输出跳过说明，不阻断 TSP 安装

## 4. 推荐工作流

```text
/team-help -> /update-codemaps -> npm run codegraph:doctor -> Claude 自动初始化或 codegraph init -i -> MCP 查询 -> /team-plan 或 /team-review
```

非 Claude 或自动初始化关闭时，在目标项目根目录初始化索引：

```bash
codegraph init -i
codegraph status
```

常用查询入口：

```bash
codegraph query <symbol>
codegraph context "<task>"
codegraph affected --stdin
codegraph files --format tree
```

## 5. 与主链结合方式

### 5.1 `/team-plan` 前的 brownfield 扫描

- 用 `/update-codemaps` 先生成轻量现状快照
- 用 CodeGraph 查询关键 symbol、entrypoint、handler 和影响面
- 将发现写入 Brownfield Context Snapshot、challenge/design/readiness 证据

### 5.2 `/team-execute` 阶段的影响面确认

- 对 story slice 的关键 symbol/API/handler 做 callers、callees、impact 查询
- 对准备提交的 diff 使用 `codegraph affected` 辅助定位回归测试
- 将结果写入执行日志或 handoff

### 5.3 `/team-review` 阶段的证据落盘

评审结论至少记录：

- 本次分析目标
- 使用的 MCP tool 或 CLI 命令
- 关键影响面
- 风险等级或剩余疑点
- 对回归测试、发布或回滚的影响

## 6. Artifact / Handoff 摘要格式

```markdown
## CodeGraph Evidence

- Goal: [本次要确认的问题]
- Entry: [MCP tool 或 CLI 命令]
- Findings: [关键调用链、依赖、影响面]
- Decision impact: [改变了哪个计划、测试或发布判断]
- Follow-up: [仍需验证或暂缓的事项]
```

## 7. 与 Graphify / GitNexus 的分工

| 能力 | 默认用途 |
|------|----------|
| CodeGraph | 默认内置 MCP-backed 符号搜索、调用链、impact 和 focused context |
| Graphify | 轻量结构扫描、依赖路径、架构问答证据 |
| GitNexus | 深 MCP 查询、symbol impact、detect_changes、多仓和执行流证据 |
