---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 安全与合规平台演示执行记录

本文记录一条安全 / 合规平台演示路径，重点展示团队如何把门禁、例外、审计证据和放行条件整理成正式治理链路。

## 1. 场景定义

- 背景：仓库已具备多种安全门禁，但缺少统一的分层结论与放行规则
- 目标：把安全结论从“工具输出”升级成“可 review、可 release、可审计”的治理结果

## 2. 关键阶段

- `/team-intake`：锁定门禁范围、权限边界和放行条件
- `/team-plan`：拆风险分层、例外管理和 release 记录
- `/tdd`：先定义阻塞项、例外项、观察项
- `/verify`：汇总门禁结果与审计证据
- `/team-review`、`/team-release`：形成正式放行结论

## 3. 校验结果

```text
Validation passed.
- Roles: 8
- Shared skills: 3
- ECC skills: 9
- Private overlay skills: not shipped in public repo
- Specialist agents: 27
- Generated artifacts: 70
```
