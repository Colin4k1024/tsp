---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# DevOps 发布对话样例

本文给出一份偏 DevOps 视角的成品对话样例，重点展示发布方案、观察窗口、回滚条件和企业扩展执行记录应该如何进入 `/team-release`。

## 1. 场景

- 任务：审批记录查询能力已通过 QA
- 当前输入：QA 放行建议、研发 handoff、发布窗口已确认
- 目标：形成正式发布方案

## 2. 用户怎么说

```text
/team-release
请以 devops-engineer 视角基于当前测试放行结果，整理发布方案、观察窗口、回滚条件、责任链，并判断是否需要 GitLab 手动流水线或 Langfuse 追踪。
如果这些能力只是 runbook 补充，而不是正式 custom overlay，也请明确写出。
```

## 3. 期望结果长什么样

```text
发布方案
- 范围：审批记录查询接口、列表页、权限过滤逻辑
- 方式：先 staging smoke，再 10% 灰度，观察 30 分钟后决定是否全量

上线检查结果
- QA 放行：通过
- 环境检查：通过
- 回滚路径：已确认

放行结论与后续观察项
- 结论：有条件放行
- 观察项：错误率、慢请求、审批查询成功率

回滚与监控动作
- 回滚条件：错误率超过阈值，或关键业务成功率明显下降
- 回滚步骤：关闭入口开关，回滚服务版本与配置
- 责任人：devops-engineer、backend-engineer

可选领域扩展执行记录
- enterprise：未启用
- runbook：gitlab-manual-pipeline-release、langfuse-coding-trace
- 说明：本次仅作为发布补充动作，不构成项目长期默认装配
```

## 4. 不合格结果通常长什么样

```text
今晚发布，先上线看看，有问题再回滚。
```

这类结果的问题是：

- 没写观察窗口
- 没写回滚条件
- 没写责任链
- 实际用了 GitLab / Langfuse，却没回写

## 5. DevOps 在对话里最容易漏什么

- 发布前检查是否完成
- 回滚动作是否可执行
- 观察窗口与核心指标
- GitLab、Langfuse 是否只是当前 runbook 补充

## 6. 继续推进时怎么说

如果发布阶段出现异常，下一句通常是：

```text
当前灰度期间出现异常，请按事故处理视角重新输出 /team-review 结论，并说明是否立即进入回滚。
```

如果发布完成，需要保留后续记录，下一句通常是：

```text
请把本次发布观察结果和可选领域扩展执行记录整理成一次 /handoff，供 tech-lead 收口。
```

与这些文档配合阅读：[devops-engineer-daily-operations.md](devops-engineer-daily-operations.md)、[team-release-example.md](team-release-example.md)、
