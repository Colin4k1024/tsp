---
artifact: adr
task: doc-architecture-demo
date: 2026-04-01
role: architect
status: draft
---

# ADR-001: Doc Architecture Integration

## 决策信息
- 编号：ADR-001
- 标题：将文档架构能力集成到 team 主链
- 状态：Accepted
- 决策日期：2026-04-01
- Owner：architect

## 背景与约束
- 背景：原能力存在独立文档目录习惯，当前平台要求统一 artifact 持久化。
- 约束：不得新增并行主命令，不得破坏角色边界。

## 备选方案
- 方案 A：新增 team-doc-architect 命令。
- 方案 B：角色内嵌 shared skill + 现有命令契约增强。
- 结论：采用方案 B。

## 决策结果
- 采用 `doc-architecture` shared skill。
- 通过 artifact-standards 与输出契约扩展保证落盘一致性。
- 回退思路：若复杂度过高，先仅在 tech-lead/architect 启用。

## 后续动作
- 在后续任务中持续验证主链闭环。
