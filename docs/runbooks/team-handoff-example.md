---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Team Handoff 完整示例

本文对标 [../../commands/handoff.md](../../commands/handoff.md) 和 [handoff-filling-guide-with-examples.md](handoff-filling-guide-with-examples.md)，给出结构化交接的完整示例。

## 1. 场景

- 后端已完成导出接口
- 需要把结论交给前端、QA 和 tech-lead

## 2. 输入示例

```text
/handoff
请把当前导出接口实现结果整理成结构化交接，供前端联调和 QA 验证。
```

## 3. 完整输出示例

```text
结构化交接摘要
- 已完成：导出接口实现、权限判断接入、错误码定义
- 未完成：大数据量导出压测
- 输入依据：接口契约 v1、权限策略记录、后端自测结果

下一跳角色动作清单
- frontend-engineer：接入真实接口，验证按钮状态与错误提示
- qa-engineer：验证 3 组权限场景和导出字段完整性
- tech-lead：确认压测是否必须在本次上线前完成

可追溯的设计和质量证据
- 接口地址：/api/approval/export
- 成功条件：返回文件流，文件字段与列表筛选条件一致
- 已知风险：超过 1 万条记录时尚未压测
- company / 领域扩展记录：权限判断依赖 私有权限中心 规则映射，执行记录已回落到 /team-execute 输出
```

## 4. 常见错误

- 没有区分已完成和未完成
- 下一跳没有明确动作
- 已知风险没有落进交接摘要
