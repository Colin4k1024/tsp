---
name: grok-provenance-contract
scope: grokbuild
updated: 2026-07-29
last_verified: 2026-07-29
---

# Provenance Contract

## 命名规范

### Agents
- Role agents: `tsp-role-{name}` (e.g., `tsp-role-tech-lead`)
- Specialist agents: `tsp-specialist-{name}` (e.g., `tsp-specialist-code-reviewer`)

### Skills
- 原生 skills: 保持现有 namespace
- Commands 转 skills: `tsp-command-{name}` (e.g., `tsp-command-team-plan`)

### Hooks
- 格式: `tsp-hook-{name}`
- 事件映射: snake_case → camelCase

## 生成物契约

每个生成文件必须包含:

```yaml
---
tsp_source: "skills/frontend-engineering/SKILL.md"
tsp_version: "2.5.5"
adapter_version: "0.1.0"
generated_at: "2026-07-29T00:00:00Z"
---
```

## 字段说明

| 字段 | 含义 |
|------|------|
| `tsp_source` | TSP 原始文件相对路径 |
| `tsp_version` | 生成时的 TSP 版本 |
| `adapter_version` | grok-packager 版本 |
| `generated_at` | 生成时间 (ISO 8601) |

## CI 门禁

- 生成物必须 byte-stable（相同输入 → 相同输出）
- CI 检查生成物是否与 TSP 源同步
- 漂移检测失败时阻断发布
