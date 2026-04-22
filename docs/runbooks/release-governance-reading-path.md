---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 发布治理阅读路径

本文把发布相关 runbook 串成一条阅读路径，帮助团队按问题类型进入正确文档，而不是在多个发布手册里来回找。

## 1. 日常版本发布

先看这些：

- [devops-engineer-daily-operations.md](devops-engineer-daily-operations.md)
- [team-release-example.md](team-release-example.md)
- [canary-staging-release-walkthrough.md](canary-staging-release-walkthrough.md)
- [pre-release-checklist.md](pre-release-checklist.md)
- [canary-decision-matrix.md](canary-decision-matrix.md)

## 2. 紧急修复与事故响应

先看这些：

- [hotfix-emergency-release-walkthrough.md](hotfix-emergency-release-walkthrough.md)
- [production-incident-response-walkthrough.md](production-incident-response-walkthrough.md)
- [release-rollback-recovery-walkthrough.md](release-rollback-recovery-walkthrough.md)
- [incident-severity-triage-tree.md](incident-severity-triage-tree.md)
- [post-rollback-verification-checklist.md](post-rollback-verification-checklist.md)

## 3. GitLab 或公司扩展参与发布

先看这些：

- [gitlab-manual-pipeline-release.md](gitlab-manual-pipeline-release.md)
- [gitlab-release-integration-playbook.md](gitlab-release-integration-playbook.md)
- 
- 
- [custom-overlay.md](custom-overlay.md)

## 4. 需要附加可观测性

先看这些：

- [langfuse-coding-trace.md](langfuse-coding-trace.md)
- [langfuse-and-observability-integration-guide.md](langfuse-and-observability-integration-guide.md)
- 

## 5. 不知道先看哪篇时

- 正常发布：从 [team-release-example.md](team-release-example.md) 开始
- 需要灰度：看 [canary-staging-release-walkthrough.md](canary-staging-release-walkthrough.md)
- 事故或回滚：看 [production-incident-response-walkthrough.md](production-incident-response-walkthrough.md)
- 涉及 GitLab 或 Langfuse：先看对应 runbook，再回到 `/team-release`
