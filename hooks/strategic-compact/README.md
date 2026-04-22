# Strategic Compact

本目录为上下文压缩建议和长会话整理提供支持。

## 当前状态

✅ **已实现** - 通过 `scripts/hooks/pre_compact.py` 和 `scripts/hooks/suggest_compact.py` 提供完整功能。

## 实现细节

### pre_compact.py

**触发时机**: 上下文压缩前自动调用

**功能**:
- 分析所有上下文元素
- 按重要性分类：
  - `keep`: 高价值内容（决策、结论、pending items、验证结果）
  - `summarize`: 中等价值内容（长输出、对话历史）
  - `discard`: 低价值内容（工具结果、搜索结果、重复信息）
- 生成摘要指令

**优先级规则**:
- 总是保留的类型：`decision`, `conclusion`, `pending_item`, `task_output`, `verification_result`, `error_fix`
- 总是丢弃的类型：`tool_result`, `search_result`, `exploration_trace`（超过 500 字符时）
- 其他根据上下文大小决定

### suggest_compact.py

**触发时机**: 上下文使用超过 70% 时自动调用

**功能**:
- 计算上下文使用率
- 评估紧迫度：`low` (< 70%) | `medium` (70-85%) | `high` (85-95%) | `critical` (> 95%)
- 估算可节省的 token
- 提供具体压缩建议：
  - 压缩早期对话历史
  - 丢弃工具结果
  - 重组 specialist 输出
- 生成重组计划（4 阶段）

## 压缩策略

### Phase 1: 保存决策到内存
提取所有决策，保存到 `~/.claude/memory/error_experience/decisions/`

### Phase 2: 保存待办到摘要
提取 pending items 和 next hints，保存到 session summary

### Phase 3: 压缩对话
保留系统提示和最近 20 轮对话，压缩中间部分

### Phase 4: 精简工具输出
将长工具输出替换为摘要：`[File X read, Y lines]`

## 触发阈值

| 使用率 | 紧迫度 | 建议操作 |
|--------|--------|---------|
| < 70% | low | 无需操作 |
| 70-85% | medium | 建议压缩，可选择性执行 |
| 85-95% | high | 强烈建议压缩 |
| > 95% | critical | 必须立即压缩 |

## 扩展计划

- [x] 长会话压缩建议 ✅
- [x] 阶段性摘要沉淀 ✅
- [x] specialist 结果回收与再组织 ✅
- [ ] 按领域定制压缩策略（待定）
- [ ] 压缩质量评估（待定）
