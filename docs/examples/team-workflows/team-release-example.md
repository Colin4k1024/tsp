---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Team Release 完整示例

本文对标 [team-command-output-contracts.md](team-command-output-contracts.md) 和 [../../commands/team-release.md](../../commands/team-release.md)，给出发布方案和放行结论的完整示例。

## 1. 场景

- 导出能力已开发完成并通过 QA
- 本次准备灰度发布
- 需要明确观察窗口、回滚条件和责任链

## 2. 输入示例

```text
/team-release
基于当前测试放行结果，整理导出能力的灰度发布方案、回滚条件和观察项。
```

## 3. 完整输出示例

```text
发布方案
- 范围：审批列表导出能力、权限判断调整、前端导出按钮
- 方式：先 staging 验证，再 10% 灰度，观察 30 分钟后决定是否全量

上线检查结果
- 测试放行：通过
- 环境检查：通过
- 前端 smoke：关键页面可访问，导出按钮状态正常

放行结论与后续观察项
- 结论：有条件放行
- 观察项：导出成功率、接口错误率、前端点击后反馈时延

回滚与监控动作
- 回滚条件：错误率超过阈值，或导出结果字段异常
- 回滚步骤：关闭导出入口开关，回滚后端权限配置
- 责任人：devops-engineer、backend-engineer

企业内控补充信息
- 是否企业内部应用：是
- 数据风险：导出字段已按当前权限规则控制

可选领域扩展执行记录
- 扩展能力：GitLab 手动流水线补充手册
- 触发条件：本次灰度需人工观察窗口
- 执行摘要：按发布 runbook 执行 staging 与灰度步骤
```

## 4. 常见错误

- 只写发布步骤，不写回滚和观察项
- 放行结论没有条件说明
- custom overlay 或 runbook 扩展记录没有回落到 release 输出

发布前、中、后的快速参考可继续看：[pre-release-checklist.md](pre-release-checklist.md)、[canary-decision-matrix.md](canary-decision-matrix.md)、[post-rollback-verification-checklist.md](post-rollback-verification-checklist.md)
