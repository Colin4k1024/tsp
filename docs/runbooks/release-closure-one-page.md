---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 发布收口一页速查

本文面向已经有实现、自测和 QA 结论，准备进入发布收口的场景。

## 1. 什么时候用这页

- 需要快速形成 `/team-release` 输入
- 需要把观察窗口、回滚条件和责任链说清楚
- 需要判断 GitLab 或 Langfuse 是否只按 runbook 补充

## 2. 最短起手方式

```text
/team-release
基于当前测试放行结果，整理发布方案、观察窗口、回滚条件、责任链，并判断是否需要 GitLab 手动流水线或 Langfuse 追踪。
```

## 3. release 输出至少包含什么

- 发布范围
- 放行结论
- 观察窗口与核心指标
- 回滚条件与步骤
- 责任链
- private enterprise overlay 或 runbook 执行记录

## 4. 最短回写示例

```text
放行结论与后续观察项
- 结论：有条件放行
- 观察项：错误率、慢请求、关键业务成功率

回滚与监控动作
- 回滚条件：错误率超过阈值或关键业务失败率上升
- 回滚步骤：关闭入口开关，回滚配置和服务版本

可选领域扩展执行记录
- enterprise：未启用
- runbook：gitlab-manual-pipeline-release、langfuse-coding-trace
- 说明：仅作为本次发布补充动作
```

## 5. 最短检查顺序

1. 先过 [pre-release-checklist.md](pre-release-checklist.md)
2. 灰度时看 [canary-decision-matrix.md](canary-decision-matrix.md)
3. 若出事故，看 [incident-severity-triage-tree.md](incident-severity-triage-tree.md)
4. 若已回滚，看 [post-rollback-verification-checklist.md](post-rollback-verification-checklist.md)

## 6. 常见错误

- 只写发布步骤，不写回滚条件
- GitLab、Langfuse 实际用到了，但 release 里没有回写
- QA 结论还没形成，就匆忙进入 release

如果你要看完整链路，继续看 [team-release-example.md](team-release-example.md)、[canary-staging-release-walkthrough.md](canary-staging-release-walkthrough.md) 和 [release-governance-reading-path.md](release-governance-reading-path.md)。
