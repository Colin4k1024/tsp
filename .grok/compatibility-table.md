---
name: grok-compatibility-table
scope: grokbuild
updated: 2026-07-29
last_verified: 2026-07-29
---

# TSP × Grok Compatibility Table

## 版本兼容性

| TSP Version | Adapter Version | Grok Version | Node.js | 状态 |
|-------------|-----------------|--------------|---------|------|
| 2.5.5 | 0.1.0 | >=0.2.109 | >=18 | ✅ 当前版本 |

## 组件兼容性

### Skills

| 类型 | 数量 | 兼容性 | 备注 |
|------|------|--------|------|
| SKILL.md | 203 | ✅ 完全兼容 | 直接复用 |
| Commands (as skills) | 87 | ✅ 完全兼容 | 转换为 namespaced skills |
| **总计** | **290** | - | - |

### Agents

| 类型 | 数量 | 兼容性 | 备注 |
|------|------|--------|------|
| Role Agents | 8 | ✅ 完全兼容 | 添加 Grok YAML frontmatter |
| Specialist Agents | 27 | ✅ 完全兼容 | 添加 Grok YAML frontmatter |
| **总计** | **35** | - | - |

### Hooks

| 类型 | 数量 | 兼容性 | 备注 |
|------|------|--------|------|
| Observe-only | 7 | ⏳ 延后 | Phase 3.1 |
| PostToolUse | 12 | ⏳ 延后 | Phase 3.2 |
| PreToolUse (blocking) | 8 | ⏳ 延后 | Phase 3.3 |
| Stop/Security | 6 | ⏳ 延后 | Phase 3.4 |
| **总计** | **33** | - | 默认禁用 |

### Rules/Profiles

| 类型 | 数量 | 兼容性 | 备注 |
|------|------|--------|------|
| Rules | 88 | ✅ 完全兼容 | 合成为 governance skill |
| Roles | 8 | ✅ 完全兼容 | 转为 agent 上下文 |
| **总计** | **96** | - | - |

## 平台差异

| 特性 | Claude | Grok | 差异处理 |
|------|--------|------|----------|
| 事件格式 | PascalCase | PascalCase | 一致，无需转换 |
| 工具名 | Bash/Read/Write | 自动映射 | Grok 内部处理 |
| 环境变量 | CLAUDE_PLUGIN_ROOT | GROK_PLUGIN_ROOT | path-resolver.js |
| 会话 ID | CLAUDE_SESSION_ID | GROK_SESSION_ID | 直接使用 |
| 工作区根目录 | - | GROK_WORKSPACE_ROOT | 直接使用 |
| 插件目录 | ~/.claude/plugins | ~/.grok/installed-plugins | 自动映射 |
| Hook 协议 | hooks.json | hooks.json | 格式兼容 |

## 功能支持矩阵

| 功能 | Claude | Grok | 备注 |
|------|--------|------|------|
| Skills | ✅ | ✅ | 完全支持 |
| Commands | ✅ | ✅ | 转换为 skills |
| Agents | ✅ | ✅ | 添加 frontmatter |
| Hooks | ✅ | ⏳ | Phase 3 |
| MCP | ✅ | ❌ | 不支持 |
| LSP | ✅ | ❌ | 不支持 |
| Memory | ✅ | ✅ | 跨会话记忆 |
| Worktree | ✅ | ✅ | Git worktree 隔离 |

## 已知限制

1. **Hooks 未启用**：Phase 3 尚未完成，所有 hooks 默认禁用
2. **环境变量依赖**：部分 hooks 依赖 Claude 特定环境变量
3. **MCP/LSP 不支持**：Grok 不支持 MCP 和 LSP 协议
4. **启动时间**：插件加载可能增加 <10% 启动时间
5. **Token 预算**：需要手动控制 rules 注入量

## 测试覆盖

| 测试类型 | 覆盖率 | 状态 |
|----------|--------|------|
| 单元测试 | 80%+ | ✅ 通过 |
| 集成测试 | 70%+ | ✅ 通过 |
| E2E 测试 | 50%+ | ⏳ 待完善 |
| 回归测试 | 60%+ | ⏳ 待完善 |

## 升级路径

### 从 Claude 迁移

1. 安装 Grok：`brew install grok` 或从官网下载
2. 安装 TSP 插件：`grok plugin install <path> --trust`
3. 验证安装：`grok plugin list`
4. 开始使用：所有 skills 和 commands 自动可用

### 版本升级

1. 更新 TSP：`git pull`
2. 重新生成：`node scripts/grok/grok-packager.js`
3. 更新插件：`grok plugin update tsp`

### 回滚

1. 卸载当前版本：`grok plugin uninstall tsp`
2. 安装旧版本：`grok plugin install <old-version-path> --trust`

## 性能基准

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 启动时间增量 | <10% | ~5% | ✅ 达标 |
| Token 增量 | <20% | ~15% | ✅ 达标 |
| 内存占用 | <50MB | ~30MB | ✅ 达标 |
| 安装时间 | <30s | ~15s | ✅ 达标 |

## 支持平台

| 平台 | 支持状态 | 备注 |
|------|----------|------|
| macOS (ARM) | ✅ 完全支持 | 主要开发平台 |
| macOS (Intel) | ✅ 完全支持 | |
| Linux (x64) | ✅ 完全支持 | |
| Linux (ARM) | ⏳ 实验性 | 未充分测试 |
| Windows | ⏳ 实验性 | 需要 WSL |

---

Last updated: 2026-07-29
