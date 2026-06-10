---
version: "0.1.0"
status: active
created: 2026-04-17
updated: 2026-06-10
owner: 工程团队
doc_tier: runbook
last_verified: 2026-06-10
source_of_truth:
  - ../../skills/graphify/SKILL.md
  - ../../README.md
  - ../../AGENTS.md
---

# Graphify 知识图谱能力使用手册

## 1. 定位

Graphify 在本仓库的定位是 **可选知识图谱能力**，用于补齐 brownfield 结构认知、架构问答和依赖影响分析。  
它不会替代当前 workflow-engine，也不会改变 `/team-*` 主链职责。

## 2. 前置检查

先跑：

```bash
npm run graphify:doctor
```

检查项：

- Python 版本 `>= 3.10`
- `graphify` CLI 可用（对应 Python 包 `graphifyy`）

如果失败，按脚本提示在你的本地环境修复。仓库不自动安装 Python 或 `graphifyy`。

## 3. 推荐命令（以上游 CLI 帮助为准）

> 下面是仓库推荐入口，具体参数以 `graphify --help` 为准。

```bash
# 1) 构建图谱（统一输出目录）
graphify build ... --out graphify-out

# 2) 图谱查询（模块/符号/关系）
graphify query ...

# 3) 依赖路径分析（from -> to）
graphify path ...

# 4) 解释输出（可读化摘要）
graphify explain ...
```

## 4. 与主链结合方式

### 4.1 `/team-plan` 前的 brownfield 扫描

推荐路径：

1. `/team-help` 判定阶段
2. Graphify 构建图谱 + 关键 query/path
3. `/team-plan` 消费结构证据，完成 challenge/design/readiness 收口

### 4.2 `/team-execute` 阶段的影响面分析

- 对每个 story slice 变更点做 path/explain，确认上下游影响
- 结果写入执行日志和 handoff，避免“修改完成但影响未知”

### 4.3 `/team-review` 阶段的证据落盘

- 将图谱结论回写 `docs/artifacts/`、`docs/adr/`、`docs/memory/`
- 评审时引用“命令 -> 结果 -> 决策影响”三段证据链

## 5. 输出约定

- 统一目录：`graphify-out/`
- 最小内容：
  - 分析目标
  - 关键命令与结果摘要
  - 对主链决策的影响

## 6. 明确禁用项

- 不在本仓库执行：
  - `graphify codex install`
  - `graphify claude install`
- 原因：避免改写现有 `AGENTS.md` / hooks 契约，破坏当前治理链路。
