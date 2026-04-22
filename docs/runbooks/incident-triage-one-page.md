---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 事故分诊一页速查

本文面向线上异常、灰度问题、回滚判断这类必须快速分诊的场景。

## 1. 什么时候用这页

- 灰度后出现错误率、时延或关键业务异常
- 不确定应该先回滚、先止血还是先继续观察
- 需要让 QA、DevOps、Tech Lead 快速形成统一动作

## 2. 最短起手方式

```text
/team-review
当前灰度期间出现异常，请按事故处理视角输出：问题等级、阻塞结论、建议动作、是否进入回滚、下一角色责任链。
```

## 3. 最短判断顺序

1. 先判断是否影响核心业务和用户面
2. 再判断是否需要立即止血或回滚
3. 再决定是继续观察、进入 incident runbook，还是重新 review

## 4. 最短结论模板

```text
评审结论
- 结论：暂缓放量
- 影响：审批回调时延升高，已影响部分用户

建议动作
- 立即停止扩量
- DevOps 准备回滚路径
- QA 补关键路径复验
- Tech Lead 判断是否升级为正式事故处理
```

## 5. 谁该先做什么

- QA：确认影响范围和复现条件
- DevOps：准备止血和回滚动作
- Tech Lead：做优先级和升级判断
- 研发：定位根因并给出修复或回滚建议

## 6. 快速参考顺序

1. [incident-severity-triage-tree.md](incident-severity-triage-tree.md)
2. [production-incident-response-walkthrough.md](production-incident-response-walkthrough.md)
3. [release-rollback-recovery-walkthrough.md](release-rollback-recovery-walkthrough.md)

## 7. 常见错误

- 还没判断影响等级，就开始讨论技术细节
- 已经满足回滚条件，却继续拖着观察
- 问题已经进入事故处理，但主链结论还停留在普通 review

如果你要看发布前后的完整上下文，继续看 [release-closure-one-page.md](release-closure-one-page.md) 和 [release-governance-reading-path.md](release-governance-reading-path.md)。
