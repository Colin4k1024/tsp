# TSP Grok Integration Scripts

## 概述

本目录包含将 TSP 适配到 Grok 的脚本工具。

## 脚本列表

### grok-packager.js

生成 Grok 兼容的插件包。

```bash
# 预览模式
node scripts/grok/grok-packager.js --dry-run

# 生成插件
node scripts/grok/grok-packager.js

# 指定输出目录
node scripts/grok/grok-packager.js --output ./my-grok-plugin
```

**功能：**
- 收集 TSP skills (203)、commands (87)、agents (35)
- 添加 provenance 元数据
- 生成 .grok-plugin/plugin.json manifest
- 输出到 .grok-build/ 目录

### grok-event-bridge.js

将 Claude hooks 事件转换为 Grok 兼容格式。

```bash
# 转换 hooks.json
node scripts/grok/grok-event-bridge.js convert

# 转换单个输入
node scripts/grok/grok-event-bridge.js translate-input '{"tool_name":"Bash"}'
```

**功能：**
- 事件映射：pre_tool_use → preToolUse
- 工具名转换：Bash → bash
- 环境变量映射：CLAUDE_HOME → GROK_HOME
- 处理嵌套 hooks 结构

### grok-hook-wrapper.js

包装 TSP hooks 以在 Grok 中运行。

```bash
# 执行 hook
node scripts/grok/grok-hook-wrapper.js hooks/pre-bash-block-no-verify.js '{"tool_name":"Bash","tool_input":{"command":"git commit"}}'
```

**功能：**
- 处理环境变量差异
- 转换输入格式
- 统一错误处理
- 支持 fail-open 和 fail-closed 策略

## 工作流

### 1. 生成 Grok 插件

```bash
node scripts/grok/grok-packager.js
```

### 2. 安装到 Grok

```bash
grok plugin install .grok-build --trust
```

### 3. 验证安装

```bash
grok plugin list
grok plugin details <plugin-id>
```

### 4. 卸载

```bash
grok plugin uninstall <plugin-id>
```

## 版本兼容性

| 组件 | 版本 |
|------|------|
| TSP | 2.5.5 |
| Node.js | >=18 |
| Grok | >=0.2.109 |

## 待完成

- [ ] Phase 3: Hook 分级迁移（observe-only → blocking）
- [ ] Phase 4: 状态与运行时清理
- [ ] Phase 5: 发布与硬化
