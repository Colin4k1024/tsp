# OpenCode 快速开始指南

本指南帮助您快速上手在 OpenCode 中使用 Team Skills Platform (TSP)。

## 前置条件

1. 已安装 OpenCode（https://opencode.ai）
2. 已安装 Node.js 18+
3. 已克隆 TSP 仓库

## 安装步骤

### 1. 构建平台 artifacts

```bash
cd /path/to/tsp
node scripts/build-platform-artifacts.js
```

### 2. 安装 OpenCode 配置

```bash
# 安装完整配置（推荐）
node scripts/install-apply.js --profile full --target opencode

# 或使用 npm 脚本
npm run install:opencode
```

### 3. 验证安装

```bash
# 检查 AGENTS.md 是否生成
ls -la ~/.config/opencode/AGENTS.md

# 检查 opencode.json 配置
cat ~/.config/opencode/opencode.json

# 检查 agents 目录
ls ~/.config/opencode/agents/

# 检查 commands 目录
ls ~/.config/opencode/command/
```

## 配置说明

### opencode.json 配置文件

安装完成后，`~/.config/opencode/opencode.json` 包含以下配置：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["./AGENTS.md"],
  "plugin": ["team-skills-platform"],
  "permission": {
    "edit": "allow",
    "bash": "allow"
  }
}
```

- **instructions**: 指向 AGENTS.md 文件，包含所有规则和配置
- **plugin**: 启用 TSP 插件
- **permission**: 设置工具权限（允许编辑和 bash 命令）

### AGENTS.md 文件

`~/.config/opencode/AGENTS.md` 是主配置文件，包含：

1. **插件路径**：所有 TSP 组件的路径信息
2. **规则索引**：所有规则文件的引用路径
3. **角色索引**：所有可用角色的列表
4. **命令索引**：所有团队命令的说明
5. **技能索引**：所有可用技能的列表

## 基本使用

### 1. 启动 OpenCode

在项目目录中启动 OpenCode：

```bash
cd /path/to/your/project
opencode
```

### 2. 查看可用角色

AGENTS.md 中包含所有角色的索引，您可以直接引用：

- `@tech-lead` - Tech Lead（技术负责人）
- `@product-manager` - Product Manager（产品经理）
- `@architect` - Architect（架构师）
- `@frontend-engineer` - Frontend Engineer（前端开发）
- `@backend-engineer` - Backend Engineer（后端开发）
- `@qa-engineer` - QA Engineer（测试工程师）
- `@devops-engineer` - DevOps Engineer（运维工程师）

### 3. 执行团队命令

TSP 提供了以下核心团队命令：

- `/team-help` - 根据当前阶段、artifacts 与阻塞项推荐下一步主链命令
- `/team-intake` - 接收需求并锁定目标、范围、约束
- `/team-plan` - 拆解任务、角色分工、依赖与里程碑
- `/team-execute` - 驱动研发角色在边界内实施
- `/team-review` - 做方案、质量、测试和放行评审
- `/team-release` - 做发布准备、上线检查与回滚保障
- `/team-closeout` - 在观察窗口结束后做最终收口与 backlog 回写
- `/handoff` - 在角色间做结构化交接

团队命令产出的 PRD、计划、执行记录、评审和发布材料必须通过 `artifact:persist` 落盘到消费方项目的 `docs/artifacts/`、`docs/adr/` 或 `docs/memory/`，不要只停留在对话里。

### 4. 加载技能

使用 `skill` 工具加载 SKILL.md 文件：

```
skill frontend-engineering
skill backend-patterns
skill security-review
```

### 5. 引用规则

使用 `@path` 语法引用规则文件：

```
@rules/common/coding-style.md
@rules/typescript/testing.md
@rules/python/security.md
```

## 高级功能

### 1. 自定义 Agent

您可以在 `~/.config/opencode/agents/` 目录中创建自定义 Agent：

```markdown
---
description: "My Custom Agent"
mode: "build"
tools: ["edit", "write", "bash"]
---

# My Custom Agent

这是我的自定义 Agent 的系统提示词。
```

### 2. 自定义命令

在 `~/.config/opencode/command/` 目录中创建自定义命令：

```markdown
# My Custom Command

这是我的自定义命令的说明。

## 用法

/my-custom-command [arguments]
```

### 3. 配置 MCP 服务器

在 `opencode.json` 中配置 MCP 服务器：

```json
{
  "mcp": {
    "my-server": {
      "type": "local",
      "command": ["node", "my-mcp-server.js"],
      "enabled": true
    }
  }
}
```

### 4. 配置权限

在 `opencode.json` 中配置工具权限：

```json
{
  "permission": {
    "edit": "ask",
    "bash": "ask",
    "write": "allow"
  }
}
```

## 故障排除

### 1. AGENTS.md 未加载

检查 `opencode.json` 中的 `instructions` 配置是否正确：

```json
{
  "instructions": ["./AGENTS.md"]
}
```

### 2. Agent 无法识别

确保 Agent 文件位于 `~/.config/opencode/agents/` 目录，并且包含正确的 YAML front matter。

### 3. 命令无法执行

确保命令文件位于 `~/.config/opencode/command/` 目录，并且文件名以 `.md` 结尾。

### 4. 技能无法加载

确保技能目录位于 `~/.config/opencode/plugins/team-skills-platform/skills/`，并且包含 `SKILL.md` 文件。

## 更新 TSP

当 TSP 更新时，重新运行安装脚本：

```bash
cd /path/to/tsp
git pull
node scripts/build-platform-artifacts.js
npm run install:opencode
```

## 卸载

删除 OpenCode 配置目录：

```bash
rm -rf ~/.config/opencode
```

## 相关资源

- [OpenCode 官方文档](https://opencode.ai/docs/zh-cn)
- [TSP 项目主页](https://github.com/colin4k1024/tsp)
- [TSP 角色定义](../../roles/)
- [TSP 技能列表](../../skills/)
- [TSP 命令列表](../../commands/)

## 支持

如有问题，请：

1. 查看 [故障排除文档](./troubleshooting.md)
2. 提交 [GitHub Issue](https://github.com/colin4k1024/tsp/issues)
3. 查看 [社区讨论](https://github.com/colin4k1024/tsp/discussions)
