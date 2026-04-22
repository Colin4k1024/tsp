# Evolution System Usage Guide

> 让 Agent 复用其他 Agent 的验证过经验，而不是每次从零开始。

## 概述

Evolution 系统受 [Oris](https://github.com/Colin4k1024/Oris) 框架启发，为 harness-engineering 平台提供 **经验基因（Gene）** 的创建、验证、衰退、共享能力。核心思路是：成功解决过的问题方案应该被沉淀为可复用的"基因"，在未来遇到相似信号时优先尝试已验证方案（Replay-First），而不是每次都走完整 LLM 推理。

## 快速开始

### 1. 启用 Evolution

在环境变量中设置：

```bash
export ECC_ENABLE_EVOLUTION=1
```

或在 `hooks/hooks.json` 中将 `pre:evolution:replay-first` 和 `post:evolution:solidify` 的 enabled flag 设为 true。

### 2. 迁移现有经验

将已有的 error-experience-library 模式和 continuous-learning instinct 导入到 evolution store：

```bash
# 预览迁移（不写入）
python3 scripts/evolution/migrate.py

# 执行迁移
python3 scripts/evolution/migrate.py --apply --verbose
```

### 3. 查看 Evolution 状态

```bash
# 查看 store 统计
python3 -c "
from scripts.evolution.store import EvolutionStore
import json
store = EvolutionStore()
print(json.dumps({
    'genes': len(store._genes),
    'capsules': len(store._capsules),
    'events': sum(1 for _ in open(store._events_path) if _.strip()),
}, indent=2))
"
```

## 核心概念

### Gene（经验基因）

| 字段 | 说明 |
|------|------|
| `gene_id` | 唯一标识 |
| `signals` | 触发条件列表（错误模式、命令模式等） |
| `strategy` | 解决方案（描述 + 步骤 + 约束） |
| `confidence` | 置信度 0.10 – 0.95 |
| `state` | `candidate` → `promoted` → `archived`（或 `quarantined` → `revoked`） |
| `tags` | 分类标签（语言、框架、工具） |
| `env_fingerprint` | 环境特征（生态系统、框架） |

### Confidence 模型

- 初始值：0.40
- 每次成功复用：+0.05
- 每次失败：-0.10
- 上限：0.95，下限：0.10
- 提升到 `promoted`：≥ 0.60 且至少 3 次成功
- 连续 3 次失败：`quarantined`
- 降到 0.15 以下：`revoked`

### Replay-First 流程

```
Tool Call
  ↓
PreToolUse Hook → extract_signal()
  ↓
query_genes(signal, env) → ranked candidates
  ↓
confidence ≥ threshold? → Replay verified strategy
  ↓ (no match)
Normal LLM execution
  ↓
PostToolUse Hook → solidify outcome → create/reinforce gene
```

## 文件布局

| 路径 | 说明 |
|------|------|
| `~/.claude/evolution/events.jsonl` | 追加式事件日志（真相源） |
| `~/.claude/evolution/genes.json` | 基因投影缓存 |
| `~/.claude/evolution/capsules.json` | 胶囊投影缓存 |
| `~/.claude/evolution/governor.json` | Governor 配置 |
| `~/.claude/evolution/network/` | 网络共享目录 |

## Governor 安全控制

Governor 防止 evolution 系统失控：

| 限制 | 默认值 | 说明 |
|------|--------|------|
| `max_replays_per_session` | 20 | 单会话最大 replay 次数 |
| `max_solidify_per_session` | 10 | 单会话最大 solidify 次数 |
| `max_gene_creates_per_session` | 5 | 单会话最大基因创建数 |
| `max_consecutive_failures` | 3 | 连续失败次数触发隔离 |
| `gene_replay_cooldown_seconds` | 60 | 同一基因重试冷却时间 |

配置覆盖顺序：默认值 → `~/.claude/evolution/governor.json` → 环境变量 `EVOLUTION_GOVERNOR_*`。

## 网络共享

启用跨 Agent 基因共享：

```bash
export EVOLUTION_NETWORK_ENABLED=1

# 导出 promoted 基因
python3 scripts/evolution/network.py share --verbose

# 导入其他 agent 的基因
python3 scripts/evolution/network.py pull --verbose

# 查看网络状态
python3 scripts/evolution/network.py status
```

网络接收的基因初始 confidence 为 0.30，需要本地成功执行 1 次才提升为正常候选。导出前自动脱敏路径和用户名。

## 命令速查

| 命令 | 说明 |
|------|------|
| `/evolve` | 分析 instinct 并建议演进 |
| `/evolve migrate` | 迁移 error patterns + instincts |
| `/evolve status` | 显示 evolution store 统计 |
| `/evolve share` | 导出 promoted 基因 |
| `/evolve pull` | 导入外部基因 |
| `/replay` | 查看 replay 状态和近期匹配 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `ECC_ENABLE_EVOLUTION` | 未设置 | 设为 `1` 启用 evolution hooks |
| `EVOLUTION_DISABLED` | 未设置 | 设为 `1` 禁用 evolution |
| `EVOLUTION_MIN_CONFIDENCE` | `0.40` | replay 最低置信度 |
| `EVOLUTION_MAX_CANDIDATES` | `3` | replay 最大候选数 |
| `EVOLUTION_NETWORK_ENABLED` | 未设置 | 设为 `1` 启用网络共享 |

## 与现有系统的关系

| 现有系统 | 关系 |
|---------|------|
| error-experience-library | 可通过 `migrate.py` 导入为基因 |
| continuous-learning (instincts) | 可通过 `migrate.py` 导入为基因 |
| hooks 系统 | PreToolUse/PostToolUse hook 驱动 |
| session persistence | session-end 可触发 solidify |

Evolution 是对现有经验系统的增强，不替代它们。migrate 是可选操作，未迁移的 pattern/instinct 仍然独立工作。
