---
version: "0.1.0"
status: active
created: 2026-05-05
updated: 2026-05-05
owner: 工程团队
doc_tier: runbook
last_verified: 2026-05-05
source_of_truth:
  - ../../skills/gitnexus/SKILL.md
  - ../../README.md
  - ../../AGENTS.md
  - https://github.com/abhigyanpatwari/GitNexus
---

# GitNexus 代码智能能力使用手册

## 1. 定位

GitNexus 在 TSP 中是 **受控可选代码智能能力**。它适合 brownfield 存量系统的 MCP 查询、影响面分析、`detect_changes`、多仓分析和更深代码图谱证据。

它不替代 `/team-*` 主链，也不替代 `/update-codemaps` 的轻量现状快照。Graphify 继续用于轻量结构证据；GitNexus 用于需要 MCP tool、symbol impact、git diff impact 或多仓上下文的场景。

## 2. 前置检查

先跑：

```bash
npm run gitnexus:doctor
```

检查项：

- Node 版本 `>= 20`
- `npm` / `npx` 可用
- npm 上游包元数据可读取时，展示 GitNexus 版本、许可证与 engine 要求

如果 npm registry 临时不可用，脚本只给 warning，不会自动安装任何依赖。

## 3. 许可证与边界

截至本手册核对日期，GitNexus npm 元数据显示许可证为 `PolyForm-Noncommercial-1.0.0`，Node engine 为 `>=20.0.0`。TSP 本身仍保持 MIT 许可证和 Node `>=18` 基线，因此只做 reference/runbook/thin-skill 集成。

明确边界：

- 不把 GitNexus 加入 TSP `dependencies`
- 不默认安装 GitNexus
- 不自动运行 `gitnexus setup`
- 不复制 GitNexus 源码、hooks、skills 或生成产物
- 商业使用前由用户自行确认上游授权

## 4. 推荐命令

> 下面是 TSP 的安全推荐入口，具体参数以上游 `gitnexus --help` 为准。

```bash
# 在目标项目根目录建立或刷新索引，同时保留现有 AGENTS.md / CLAUDE.md 契约
npx --yes gitnexus@latest analyze --skip-agents-md

# 查看当前项目索引状态
npx --yes gitnexus@latest status

# 查看已索引仓库
npx --yes gitnexus@latest list

# 启动 MCP stdio server，供手动配置使用
npx --yes gitnexus@latest mcp
```

如果要配置 Codex MCP，优先手动写入项目级或用户级配置，避免自动改写未知编辑器配置：

```toml
[mcp_servers.gitnexus]
command = "npx"
args = ["--yes", "gitnexus@latest", "mcp"]
```

## 5. 与主链结合方式

### 5.1 `/team-plan` 前的 brownfield 深分析

推荐路径：

1. `/team-help` 判断当前阶段
2. `/update-codemaps` 生成轻量现状快照
3. 需要跨模块影响面或 MCP 证据时，执行 GitNexus 索引与查询
4. `/team-plan` 消费 GitNexus 发现，完成 Brownfield Context Snapshot、challenge/design/readiness 收口

### 5.2 `/team-execute` 阶段的影响面确认

- 对 story slice 的关键 symbol、API 或 handler 做 impact/context 查询
- 对准备提交的 diff 做 detect_changes 类分析
- 将结果写入执行日志或 handoff，避免“代码已改但影响未知”

### 5.3 `/team-review` 阶段的证据落盘

评审结论至少记录：

- 本次分析目标
- 使用的 GitNexus 入口（MCP tool/resource 或 CLI 命令）
- 关键影响面
- 风险等级或剩余疑点
- 对回归测试、发布或回滚的影响

## 6. Artifact / Handoff 摘要格式

建议在 `docs/artifacts/{date}-{slug}/delivery-plan.md`、`arch-design.md`、handoff 或 review 记录中使用这个最小格式：

```markdown
## GitNexus Evidence

- Goal: [本次要确认的问题]
- Entry: [MCP tool/resource 或 CLI 命令]
- Findings: [关键调用链、依赖、影响面]
- Decision impact: [改变了哪个计划、测试或发布判断]
- Follow-up: [仍需验证或暂缓的事项]
```

## 7. 禁用项

- 不自动运行 `gitnexus setup`
- 不运行会覆盖 TSP 管理入口文档的索引命令
- 不把 `.gitnexus/` 数据库当作 TSP artifact 提交
- 不用 GitNexus 结论绕过 `/team-plan`、`/team-review` 或验证门禁

## 8. 与 Graphify 的分工

| 能力 | 默认用途 |
|------|----------|
| Graphify | 轻量结构扫描、依赖路径、架构问答证据 |
| GitNexus | MCP 查询、symbol impact、detect_changes、多仓和执行流证据 |

默认先保留 `/update-codemaps` 作为 brownfield 快照入口；图谱工具只在问题需要更强结构证据时启用。
