# Custom Overlay 扩展机制

> 本文说明如何通过 custom overlay 为 TSP（Team Skills Platform）叠加团队专属的 skills、rules 和 runbook，而无需 fork 或修改主仓库。

---

## 什么是 Custom Overlay

Custom overlay 是一种非侵入式扩展机制：

- 你的团队或组织在**独立私有仓库**中维护自己的 skills、rules、runbook；
- 安装时通过 `--overlay <id>` 叠加到平台安装目标上；
- 主仓库（TSP）不感知 overlay 内容，overlay 不影响主仓库更新和升级。

---

## 典型使用场景

| 场景 | 说明 |
|------|------|
| 内部组件规范 | 将公司内部使用的框架、组件、中间件规范封装为 skill |
| 私有 runbook | 将上线流程、审批 SOP、合规检查表封装为 runbook |
| 团队约定 | 将 naming convention、分支策略等封装为 rule |
| 行业领域知识 | 将特定行业的背景知识封装为 context |

---

## Overlay 仓库结构

建议按如下结构组织 overlay 仓库：

```
my-org-overlay/
├── overlay.yaml          # overlay 元信息
├── skills/               # 团队专属 skills（同 TSP skills/ 结构）
│   └── my-internal-skill/
│       └── SKILL.md
├── rules/                # 团队专属 rules
│   └── my-internal-rule.md
├── contexts/             # 可选：团队专属 context 模板
└── docs/
    └── runbooks/         # 可选：团队专属 runbook
```

### overlay.yaml 示例

```yaml
id: my-org
name: My Org Internal Overlay
version: 1.0.0
description: 内部规范和领域知识扩展
source: git+https://github.com/my-org/tsp-overlay.git
```

---

## 安装方式

### 通过 Node.js 安装脚本叠加 overlay

```bash
# 先安装基础 profile，再叠加 overlay
node scripts/install-apply.js --profile team --target claude --overlay my-org

# 多个 overlay 可以叠加
node scripts/install-apply.js --profile full --target claude \
  --overlay my-org \
  --overlay my-team-specific

# 预览安装计划（不写入文件）
node scripts/install-plan.js --profile team --target claude --overlay my-org
```

### 通过 npx 安装

```bash
npx @colin4k1024/tsp --target claude --profile team --overlay my-org
```

---

## Overlay 与主仓库的关系

```
TSP 主仓库（公开）
  └── skills/        ← 通用 skills（195+）
  └── rules/         ← 通用规则
  └── commands/      ← 通用命令
       ↑ 叠加
My Org Overlay（私有）
  └── skills/        ← 团队专属 skills
  └── rules/         ← 团队专属规则
```

- 同名文件：overlay 优先级更高，会覆盖主仓库同名文件；
- 不同名文件：直接合并，两者共存；
- 主仓库升级不影响 overlay，overlay 独立维护版本。

---

## 注意事项

1. **overlay 中不要包含密钥或凭据**，即使是私有仓库，也应遵守 secret management 最佳实践；
2. overlay 仓库建议设置 access control，仅授权团队成员访问；
3. 建议在 overlay 的 `overlay.yaml` 中声明其兼容的 TSP 版本范围；
4. 如果 overlay 中的 skill 需要在 TSP 社区共享，可参考 [external-capability-intake.md](external-capability-intake.md) 流程提 PR 贡献到主仓库。

---

## 社区贡献

如果你的团队开发了通用性的 skills、rules 或 runbook，欢迎贡献到 TSP 主仓库：

- 参考贡献流程：[CONTRIBUTING.md](../../CONTRIBUTING.md)
- 社区 overlay 注册（可选）：在 [discussions](https://github.com/Colin4k1024/tsp/discussions) 分享你的 overlay
