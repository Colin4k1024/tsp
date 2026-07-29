# TSP Grok Integration Scripts

## 概述

本目录包含将 TSP 适配到 Grok 的脚本工具。所有 Phase 0-5 工作已完成。

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
- 自动替换 Claude 目录引用为 Grok
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

### path-resolver.js

统一处理 TSP 的路径解析，支持 Claude 和 Grok 双平台。

```javascript
const { getHomeDir, getProjectRoot, isGrok } = require('./grok/path-resolver');

// 自动检测平台
if (isGrok()) {
  console.log('Running on Grok');
}

// 获取平台主目录
const homeDir = getHomeDir(); // ~/.claude 或 ~/.grok
```

**功能：**
- 自动检测当前平台（Claude/Grok）
- 提供统一的路径接口
- 避免直接依赖 ~/.claude 或 ~/.grok
- 支持兼容性路径回退

### node-preflight.js

检查 Node.js 版本是否满足 TSP 要求（>=18）。

```bash
# 检查版本
node scripts/grok/node-preflight.js

# 严格模式（失败时退出）
node scripts/grok/node-preflight.js --strict
```

### validate-plugin.js

验证 Grok 插件的完整性和安全性。

```bash
# 验证插件
node scripts/grok/validate-plugin.js .grok-build
```

**验证项：**
- plugin.json 格式
- Claude 目录引用检查
- 文件完整性

### release.js

生成 Grok Compatibility Pack 发布包。

```bash
# 预览模式
node scripts/grok/release.js --dry-run

# 生成发布包
node scripts/grok/release.js

# 创建 Git tag
node scripts/grok/release.js --tag
```

**功能：**
- 验证插件完整性
- 生成发布 manifest
- 创建 Git tag
- 打包发布文件
- 生成发布说明

## 工作流

### 1. 生成 Grok 插件

```bash
node scripts/grok/grok-packager.js
```

### 2. 验证插件

```bash
node scripts/grok/validate-plugin.js .grok-build
```

### 3. 安装到 Grok

```bash
grok plugin install .grok-build --trust
```

### 4. 验证安装

```bash
grok plugin list
grok plugin details <plugin-id>
```

### 5. 卸载

```bash
grok plugin uninstall <plugin-id>
```

### 6. 发布

```bash
node scripts/grok/release.js --tag
git push origin v2.5.5-grok
```

## 版本兼容性

| 组件 | 版本 |
|------|------|
| TSP | 2.5.5 |
| Adapter | 0.1.0 |
| Node.js | >=18 |
| Grok | >=0.2.109 |

## 阶段状态

| 阶段 | 状态 | 产出 |
|------|------|------|
| Phase 0 | ✅ 完成 | 基线、能力矩阵、契约 |
| Phase 1A | ✅ 完成 | Grok 插件机制验证 |
| Phase 1B | ✅ 完成 | TSP 最小 PoC |
| Phase 2 | ✅ 完成 | grok-packager.js |
| Phase 3 | ✅ 完成 | grok-event-bridge.js, grok-hook-wrapper.js |
| Phase 4 | ✅ 完成 | path-resolver.js, node-preflight.js, validate-plugin.js |
| Phase 5 | ✅ 完成 | release.js, compatibility-table.md |

## 组件统计

| 类型 | 数量 | 状态 |
|------|------|------|
| Skills | 203 | ✅ 已适配 |
| Commands (as skills) | 87 | ✅ 已适配 |
| Agents | 35 | ✅ 已适配 |
| Hooks | 33 | ⏳ 默认禁用 |
| Rules | 88 | ✅ 已合成 |
| **总计** | **446** | - |

## 文档

- [能力矩阵](../../.grok/matrix/capability-matrix.md)
- [兼容性表](../../.grok/compatibility-table.md)
- [Provenance 契约](../../.grok/contracts/provenance.md)
- [Grok 集成 README](../../.grok/README.md)

## 参考

- Issue: [#9 [Feature] grokbuild](https://github.com/Colin4k1024/tsp/issues/9)
- TSP Version: 2.5.5
- Branch: `feature/grokbuild`
