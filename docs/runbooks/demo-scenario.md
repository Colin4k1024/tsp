# 示例需求：用户积分等级系统

> 本文档用于演示 Team Skills Platform 的完整流程，所有 8 个角色都将参与。

## 业务背景

公司希望上线一个「用户积分等级系统」，用于激励用户活跃度和付费行为。

## 需求概述

- 用户每次消费、签到、完成任务获得积分
- 积分可兑换优惠券、会员权益
- 积分等级（L1-L5）解锁不同权益
- 后台管理系统可配置积分规则、查询用户积分

## 涉及系统

- 用户中心（已有微服务）
- 订单系统（已有微服务）
- 营销系统（已有微服务）
- **新开发：积分服务**

## 技术约束

- 微服务架构，使用 Spring Boot + MySQL
- 需要与现有用户中心、订单系统对接
- 前端使用 React + TypeScript
- 需要 API 契约测试
- 需要 SLSA Level 2 供应链安全

## 交付要求

- 4 周内完成
- 需要前端和后端
- 需要完整的测试覆盖

---

## 第一性原理分析（示例）

在开始之前，Tech Lead 需要追问：

**Evidence（证据）**：
- 业务方提供了什么数据支持这个需求？（用户活跃度下降 15%）
- 有没有竞品分析？（某平台积分系统带来 20% 活跃度提升）

**Reasoning（推理）**：
- 为什么用积分而不是直接降价？（保持利润空间）
- 为什么不做成订阅制？（降低用户决策门槛）

**Implications（影响）**：
- 如果积分系统崩了，最坏影响？（用户无法兑换，客诉激增）
- 有没有灰度发布方案？（先对 5% 用户开放）

---

## 角色参与计划

| 阶段 | 主导角色 | 参与角色 |
|------|---------|---------|
| Intake | tech-lead | product-manager |
| Plan | tech-lead | architect, project-manager, product-manager |
| Handoff | tech-lead | 所有角色 |
| Execute | frontend-engineer, backend-engineer | architect, qa-engineer |
| Review | qa-engineer | tech-lead, architect, devops-engineer |
| Release | devops-engineer | tech-lead, qa-engineer |

---

## 执行记录

### Step 1: /team-intake

**由 Tech Lead 主导，Product Manager 参与**

输入：
- 业务背景：用户活跃度下降，需要激励手段
- 核心需求：积分获取、兑换、等级权益
- 交付时间：4 周

输出：
- 锁定的目标、范围、成功标准
- 关键约束和风险识别

### Step 2: /team-plan

**由 Tech Lead 主导，Architect、Project Manager 参与**

输入：
- PRD 和验收标准
- 技术约束

输出：
- 任务分解和角色分工
- 里程碑和依赖关系
- ADR（架构决策记录）

### Step 3: /handoff

**角色间交接**

- architect → frontend-engineer + backend-engineer
- backend-engineer → qa-engineer
- frontend-engineer → qa-engineer
- qa-engineer → devops-engineer

### Step 4: /team-execute

**由 Frontend Engineer 和 Backend Engineer 实现**

- 后端：积分服务开发、API 接口、数据模型
- 前端：积分页面、等级展示、兑换入口
- 自测和代码提交

### Step 5: /team-review

**由 QA Engineer 主导**

- 测试计划执行
- 回归验证
- 质量评估和放行建议

### Step 6: /team-release

**由 DevOps Engineer 主导**

- 发布前检查
- 环境变更
- 回滚保障
