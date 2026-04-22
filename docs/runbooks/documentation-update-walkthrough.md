---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 文档更新协作演练

本文演示代码变更之后，如何判断哪些文档需要同步、由谁补齐、如何验证文档没有脱离事实。

## 1. 场景

- 新增命令、规则或示例后，需要同步 runbook 和 example
- 目标是避免文档入口存在但内容过时

## 2. 推荐链路

1. `/team-execute`
2. 触发 `doc-updater` / `docs-lookup` specialist 做文档影响判断
3. `/handoff`
4. `/team-review`

## 3. 关键输出

- 哪些文档受影响
- 哪些链接或示例已同步
- 哪些文档仍待后续补充

## 4. 常见错误

- 代码改了，README 和 runbook 没更新
- 只更新一个入口，其他入口继续失联
- 文档补了，但没有校验链接

与这些文档配合阅读：[specialist-commands-playbook.md](specialist-commands-playbook.md)、[troubleshooting.md](troubleshooting.md)
