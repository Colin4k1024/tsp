# TSP Harness Plugin

> DeepSeek Harness Cordis 插件，将 TSP (Team Skills Platform) 的 skills、commands、specialists、rules 能力注册为 DSH 工具和系统提示词。

## 快速开始

### 在 DSH Desktop 中加载

将 `cordis.yml` 指向 `./index.js`（CommonJS，无需编译）：

```yaml
# cordis.yml
- name: '@deepseek-ai/dsh-system-prompt'
- name: '@deepseek-ai/dsh-tools'
- name: './index.js'
  config:
    projectRoot: '/path/to/tsp'
    enableTools: true
    enablePrompt: true
    maxPromptRules: 20
```

`index.js` 是自包含的单文件，所有扫描和工具逻辑内联其中，不依赖 TypeScript 编译或 tsx loader。

### 独立验证

```bash
# 验证插件能否正常加载
node -e "const p = require('./dsh-plugin/index.js'); console.log(p.name, p.inject)"

# 模拟 apply，查看会注册哪些内容
node -e "
  const p = require('./dsh-plugin/index.js');
  p.apply({
    tools: { register: t => console.log('  tool:', t.name) },
    systemPrompt: { section: s => console.log('  section:', s.id) },
    on: () => {},
  }, { projectRoot: './' });
"
```

## 注册的工具

| 工具名 | 参数 | 说明 |
|--------|------|------|
| `tsp_search_skills` | `query?` | 按关键词搜索 TSP skills |
| `tsp_get_skill` | `name` | 获取指定 skill 的完整内容 |
| `tsp_list_commands` | 无 | 列出所有 TSP slash 命令 |
| `tsp_get_command` | `name` | 获取指定命令的完整定义 |
| `tsp_search_rules` | `query?` | 按关键词搜索 TSP 规则 |
| `tsp_get_specialist` | `name` | 获取 specialist agent 的完整 prompt |

## 系统提示词注入

| Section ID | 来源 | Priority |
|-----------|------|----------|
| `tsp-agents-md` | `AGENTS.md` | 40 |
| `tsp-specialists` | `agents/specialists/*.md` | 50 |
| `tsp-rules` | `rules/**/*.md` | 60 |

## 配置

```yaml
- name: './index.js'
  config:
    projectRoot: '/path/to/tsp'   # 或使用 TSP_PROJECT_ROOT 环境变量
    enableTools: true               # 注册 DSH 工具
    enablePrompt: true              # 注入系统提示词
    enableSpecialists: true         # 注入 specialist agents
    enableRules: true               # 注入规则
    maxPromptRules: 20              # 提示词中最多注入的规则数 (0 = 全部)
```

## 容错设计

`index.js` 在没有 `@deepseek-ai/dsh-tools` 和 `@deepseek-ai/schemastery` 包的环境中也能加载：
- `defineTool` 不可用时，工具以纯对象形式注册
- `Schema` 不可用时，Config 退化为带默认值的普通对象
- 所有 `ctx.tools.register()` 和 `ctx.systemPrompt.section()` 调用都有 try/catch

## 文件结构

```
dsh-plugin/
├── index.js        # 自包含 Cordis 插件 (CommonJS)
├── cordis.yml      # 组合配置
├── package.json    # npm 包元数据
└── README.md       # 本文档
```

## 架构图

```
┌──────────────────────────────────────────────────────────────┐
│  DSH Runtime (Cordis Host Process)                           │
│                                                              │
│  ┌────────────────┐  ┌────────────────────┐                  │
│  │ ctx.tools      │  │ ctx.systemPrompt   │                  │
│  │ (register)     │  │ (section)          │                  │
│  └───────┬────────┘  └─────────┬──────────┘                  │
│          │                      │                             │
│          ▼                      ▼                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           tsp-harness (index.js)                        │ │
│  │  inject: ['tools', 'systemPrompt']                       │ │
│  │                                                           │ │
│  │  Tools:                          Prompt sections:        │ │
│  │  - tsp_search_skills              - AGENTS.md context     │ │
│  │  - tsp_get_skill                  - Specialist agents     │ │
│  │  - tsp_list_commands              - Rules (grouped)       │ │
│  │  - tsp_get_command                                         │ │
│  │  - tsp_search_rules                Event listener:        │ │
│  │  - tsp_get_specialist             - tools/result          │ │
│  └──────────────────────────┬───────────────────────────────┘ │
│                             │ scan at load time               │
│  ┌──────────────────────────▼───────────────────────────────┐ │
│  │                 TSP Project on Disk                       │ │
│  │  skills/  commands/  agents/  rules/  AGENTS.md          │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```
