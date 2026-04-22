---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 数据可观测性与质量平台演示执行记录

本文记录一条数据可观测性 / 质量平台演示路径，重点展示团队如何把规则口径、异常检测、告警有效性和修复责任整理成正式 review 结论。

## 1. 场景定义

- 背景：仓库已维护质量规则与告警链路，但缺少误报 / 漏报和责任路径的正式收口
- 目标：把质量平台从“规则可运行”升级成“告警可解释、可行动、可 review”的状态

## 2. 关键阶段

- `/team-intake`：锁规则口径、误报 / 漏报和责任路径
- `/team-plan`：拆规则、告警和 review 收口
- `/tdd`：先定义异常阈值、处置责任和验证标准
- `/verify`：汇总异常结果和告警有效性
- `/team-review`：形成正式优化与推广建议

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
