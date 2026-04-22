# Error Experience Library 使用指南

## 概述

Error Experience Library（错误经验库）是一个持续学习的机制，用于：
- 沉淀错误根因和解决方案
- 避免重复踩坑
- 加速问题排查

## 数据存储

```
~/.claude/memory/error_experience/
├── patterns/          # 错误模式库
│   ├── build_error_*.json
│   ├── runtime_error_*.json
│   └── ...
└── decisions/         # 决策快照
    └── decision_*.json
```

## 使用场景

### 场景 1：遇到错误时查询

```
用户：npm run build 失败了，报错 Cannot find module 'lodash'
Agent：
1. 调用 search_error_patterns(query="Cannot find module")
2. 返回匹配的已知模式，按成功率排序
3. 如果有高成功率匹配，直接提供解决方案
4. 如果没有匹配，记录新问题并在解决后沉淀
```

### 场景 2：解决错误后记录

```
用户：修复了上述错误（需要安装 lodash）
Agent：
1. 调用 save_error_pattern() 记录：
   {
     "error_type": "module_not_found",
     "error_message_snippet": "Cannot find module",
     "root_cause": "missing dependency in package.json",
     "solution": "npm install lodash",
     "language": "typescript",
     "framework": "node",
     "tags": ["dependency", "npm"]
   }
2. 返回保存确认
```

### 场景 3：验证后反馈

```
Agent：尝试了解决方案，成功！
Agent 调用 record_pattern_feedback(pattern_id="xxx", success=true)
→ success_count +1

Agent：尝试了解决方案，失败了
Agent 调用 record_pattern_feedback(pattern_id="xxx", success=false)
→ failure_count +1
```

## 命令行工具

### 查询错误模式

```bash
python3 -c "
from scripts.lib.memory_store import search_error_patterns
patterns = search_error_patterns('Cannot find module')
for p in patterns:
    print(f'[{p.success_count - p.failure_count:+d}] {p.error_type}: {p.root_cause}')
"
```

### 查看所有模式

```bash
ls ~/.claude/memory/error_experience/patterns/
```

### 查看模式详情

```bash
cat ~/.claude/memory/error_experience/patterns/<pattern_id>.json
```

## 与其他模块的配合

### 与 build-error-resolver 配合

`build-error-resolver` 解决错误后，应自动调用 `save_error_pattern()`。

### 与 systematic-debugging 配合

`s Systematic-debugging` 定位根因后，应自动调用 `save_error_pattern()`。

### 与验证循环配合

验证成功后，应自动记录反馈到经验库。

## 最佳实践

1. **具体性**：错误信息片段要具体，便于匹配
2. **根因分析**：不要只写"代码有 bug"，要分析具体原因
3. **可操作性**：解决方案要具体，包含实际命令或代码改动
4. **及时反馈**：验证后立即提供反馈，更新成功率
5. **标签准确**：标签要准确完整，便于按领域检索

## 持续优化机制

- 成功率 = success_count / (success_count + failure_count)
- 按 (success_count - failure_count) 排序，优先推荐高置信度模式
- failure_count 高的模式会被标记为警示
