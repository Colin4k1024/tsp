# /pause

## 用途

暂停当前工作会话，生成可恢复的状态快照，供后续 `/resume` 接续。

## 主责角色

- 当前执行角色

## 期望输入

- 可选：暂停原因

## 标准输出

- `docs/memory/sessions/{YYYY-MM-DD}-{NNN}-{slug}-state.md` 状态文件
- 暂停确认摘要

## 默认流程

1. 加载 `skills/session-continuity` 技能。
2. 收集当前工作上下文：
   - 当前 branch 和最近 commit
   - 修改中的文件列表
   - todo list 状态
   - 关键决策和阻塞项
3. 生成 STATE.md 状态文件，写入 `docs/memory/sessions/`。
4. 输出暂停确认摘要，告知恢复方式。
