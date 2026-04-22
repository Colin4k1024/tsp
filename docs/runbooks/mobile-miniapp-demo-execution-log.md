---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 移动端与小程序交付演示执行记录

本文记录一条移动端 / 小程序需求演示路径，重点展示团队如何把终端边界、弱网、权限、交互反馈、多尺寸适配和 QA 验证组织成可交接的交付链路。

## 1. 场景定义

### 背景

- 项目主要运行在手机与企业移动容器中
- 需求是新增报销申请页与提交流程
- 团队既要交付页面，也要保证弱网、权限拒绝和终端差异不在上线前失控

### 演示目标

- 让观众理解移动端项目的风险不只在 UI，而在终端边界和异常态
- 让观众理解 `/multi-frontend` 如何帮助前置发现适配与体验风险
- 让观众理解 handoff 为什么必须写清终端验证范围

## 2. 阶段 1：/team-intake

### 输入

```text
/team-intake
目标：新增移动端报销申请页与提交流程
范围：页面结构、表单交互、授权路径、多尺寸适配、测试计划
不做：后端流程引擎改造
约束：必须覆盖弱网、拒绝态、加载态、真机范围和容器差异
```

### 产出

| 字段 | 内容 |
|------|------|
| 任务类型 | 移动端交付 / 多终端体验治理 |
| 主体对象 | 页面、权限、终端适配、handoff、QA 验证 |
| 主要风险 | 弱网失败、权限拒绝、容器差异、适配遗漏 |
| 收口要求 | QA 必须能基于 handoff 直接接住验证范围 |

## 3. 阶段 2：/team-plan

### 拆解结果

| 模块 | 动作 | 收口位置 |
|------|------|----------|
| 页面结构 | 布局、表单、反馈态 | frontend |
| 终端适配 | 多尺寸、容器差异、横竖屏 | frontend / QA |
| 权限路径 | 授权、拒绝、兜底逻辑 | frontend / handoff |
| 异常场景 | 弱网、加载失败、重试 | test plan |
| 最终验证 | 真机 / 模拟器 / 关键链路 | `/team-review` |

### 关键判断

- 移动端项目不能只写 happy path
- QA 需要在 handoff 中直接拿到机型范围、权限路径和异常态说明

## 4. 阶段 3：/tdd

### 定义的完成标准

```text
1. 机型与容器范围明确
2. 权限授权与拒绝态已定义
3. 弱网、加载态、异常态有验证口径
4. handoff 包含终端差异与已测范围
5. review 能判断是否还有阻塞上线的终端风险
```

### 价值说明

- 把移动端风险前置成显式测试标准
- 避免只在开发自测末尾才发现真机问题

## 5. 阶段 4：/multi-frontend 与 /team-execute

### 执行批次

#### 批次 A：交互与页面

- 建立表单流程与成功 / 失败反馈
- 统一加载态、空态和异常态

#### 批次 B：终端适配

- 检查多尺寸布局
- 补容器差异处理
- 验证授权路径

#### 批次 C：handoff 准备

- 汇总真机范围
- 汇总弱网验证结果
- 汇总剩余风险与待观察项

## 6. 阶段 5：/handoff 与 /team-review

### Handoff 结论

- QA 已拿到终端范围、授权路径、弱网结果和剩余风险
- 交接内容足以支撑直接回归，而不是重新摸索场景

### Review 结论

- 当前交付已覆盖核心终端与主要异常态
- 若仍有非阻塞适配问题，应清晰标记为下一轮优化项

## 7. 校验结果

### 文档静态检查

- 本轮新增 walkthrough 与 execution log 无错误

### 仓库校验

```text
Validation passed.
- Roles: 8
- Shared skills: 3
- ECC skills: 9
- Private overlay skills: not shipped in public repo
- Specialist agents: 27
- Generated artifacts: 70
```

## 8. 推荐搭配材料

- [mobile-miniapp-delivery-walkthrough.md](mobile-miniapp-delivery-walkthrough.md)
- [../../examples/mobile-miniapp-CLAUDE.md](../../examples/mobile-miniapp-CLAUDE.md)
- [../../examples/vertical-project-conversation-scripts.md](../../examples/vertical-project-conversation-scripts.md)
- [frontend-engineer-daily-operations.md](frontend-engineer-daily-operations.md)
- [qa-engineer-daily-operations.md](qa-engineer-daily-operations.md)
