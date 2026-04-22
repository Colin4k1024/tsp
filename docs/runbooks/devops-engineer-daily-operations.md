---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# DevOps Engineer 日常操作手册

本文面向 DevOps 工程师，说明发布、回滚、环境变更和线上保障如何在主链中表达。

如果你想先看发布相关命令和验证能力怎么映射，先读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。如果你在排查 observation、cost、budget、compact 对长会话发布协同的影响，再看 [runtime-capabilities-overview.md](runtime-capabilities-overview.md)。

## 1. 你的默认职责

- 评估发布窗口、环境依赖和上线风险
- 确认回滚条件、监控指标和观察窗口
- 收口发布步骤与执行记录
- 在高风险场景下要求补齐验证或回滚准备

## 2. 开始准备发布前必须确认什么

- 当前变更是否具备可发布条件
- 是否存在数据库、配置或基础设施变更
- 回滚路径是否清楚
- 是否需要 GitLab 手动流水线或其他 company 能力

## 3. 发布前的固定检查

- 发布步骤是否可执行
- 环境变量和配置是否齐全
- 监控、告警和日志观察项是否明确
- 失败后是否可以安全回滚
- 依赖服务是否已经同步

## 4. 进入 release 阶段应交付什么

- 发布步骤与负责人
- 回滚条件和回滚步骤
- 观察窗口与核心指标
- 上线后需继续跟踪的问题

## 5. 常用命令组合

- `/team-plan`：提前识别发布和环境风险
- `/team-execute`：读取研发侧交付物和验证结果
- `/verify`：确认上线前关键路径
- `/handoff`：整理发布输入
- `/team-release`：形成正式上线方案
- `/harness-audit`：平台安装、命令入口或文档刚变更后，检查发布侧入口是否同步

## 6. 常见错误

- 只有上线步骤，没有回滚条件
- 环境变更没有进入 handoff
- 监控指标没有明确观察窗口
- 平台入口或发布 runbook 刚变更，却没有用 `/harness-audit` 检查安装和文档链路是否一致

可结合这些演练一起看：[release-governance-reading-path.md](release-governance-reading-path.md)、[pre-release-checklist.md](pre-release-checklist.md)、[enterprise-overlay-release-and-observability-output-examples.md](enterprise-overlay-release-and-observability-output-examples.md)、[enterprise-extension-quick-start.md](enterprise-extension-quick-start.md)、[devops-release-conversation-example.md](devops-release-conversation-example.md)、[hotfix-emergency-release-walkthrough.md](hotfix-emergency-release-walkthrough.md)、[multi-service-backend-integration-walkthrough.md](multi-service-backend-integration-walkthrough.md)
