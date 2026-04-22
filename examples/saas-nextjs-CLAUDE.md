# Example SaaS Next.js CLAUDE.md

适用于 Next.js / React / Tailwind 的 SaaS 项目。

这份文件不再重复通用模板的全部章节，而是告诉你：如果你已经看过 [project-CLAUDE.md](project-CLAUDE.md)，在前端主导项目里应该做哪些收缩和替换。

如果你的项目不是以前端交付为主，先看 [INDEX.md](INDEX.md) 再决定是否应改用通用版或后端版。

## 适用信号

- 前端页面、交互和 UI/UX 是主要交付物
- 后端接口改动较少，更多时候只是消费现有 API
- 项目更关心响应式、可访问性、性能和视觉回归，而不是数据库迁移或复杂发布流程

## 相对通用版的主要差异

### 1. 角色链路收缩

- 默认保留：`tech-lead`、`frontend-engineer`、`qa-engineer`
- 按需引入：`backend-engineer`、`architect`
- 一般不把 `devops-engineer` 作为默认参与角色，除非项目真的存在发布窗口、监控或回滚要求

### 2. 技能装配更偏前端

- 保留通用底座：由 `architect` / `tech-lead` 直接承担方案决策
- 默认增加前端专项：`frontend-engineering`、`frontend-ui-ux-system`
- custom overlay 默认关闭，只在 intake 或 plan 明确命中私有流程、权限或内部平台依赖时再启用；如果后续真的涉及企业扩展场景，直接看 [enterprise-overlay-scenario-playbook.md](enterprise-overlay-scenario-playbook.md)

### 3. 命令流更强调前端专项拆解

- 主链仍然保留：`/team-intake` -> `/team-plan` -> `/team-execute` -> `/handoff` -> `/team-review`
- 但中间更强调插入 `/multi-frontend`
- `/team-release` 是否保留，由项目的真实发布复杂度决定，不是前端项目天然就不需要 release

### 4. 项目约束更偏 UI 质量门禁

- 页面变更必须说明断点策略、空态/异常态和键盘可达性
- 自测必须覆盖移动端、平板和桌面端
- 进入 QA 前必须补齐 `templates/ui-review-checklist.md`
- 代码评审前优先跑 `/code-review`，验证前优先跑 `/verify`

### 5. 默认交付物也要前端化

- intake：目标、页面范围、范围外事项、设计与性能约束
- plan：页面拆解、状态设计、QA 关注点、是否需要联动后端
- execute：代码变更、响应式验证结果、UI 检查清单、自测证据
- handoff：页面摘要、剩余视觉风险、QA 关注点

## 一份更适合前端项目的精简成品

````md
# SaaS Frontend Delivery Rules

## 项目定位

- 类型：SaaS Web 应用
- 技术栈：Next.js、React、TypeScript、Tailwind
- 目标：保证页面交付、交互一致性和前端质量门禁

## 默认角色

- `tech-lead`
- `frontend-engineer`
- `qa-engineer`
- 需要接口调整时再引入 `backend-engineer` 或 `architect`

## 默认技能装配

- `frontend-engineering`
- `frontend-ui-ux-system`

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/multi-frontend`
4. `/team-execute`
5. `/handoff`
6. `/team-review`

## 项目约束

- 所有页面变更都要说明断点策略、空态/异常态、键盘可达性
- 自测必须覆盖移动端、平板和桌面端
- 进入 QA 前必须补齐 `templates/ui-review-checklist.md`
- 代码评审前优先跑 `/code-review`，验证前优先跑 `/verify`
- custom overlay 默认关闭，只在 intake 或 plan 明确命中私有流程、权限或内部平台依赖时再启用；输出收口示例看 [enterprise-overlay-output-playbook.md](enterprise-overlay-output-playbook.md)

## 常用提示模板

```text
/team-intake
目标：新增订阅管理页
范围：页面布局、表单交互、空态和错误态
不做：计费后端改造
约束：必须满足响应式、A11y、Lighthouse 不退化
```

```text
/multi-frontend
基于 intake 结果，从 UI/UX、实现拆解、QA 风险三个视角输出计划。
必须指出哪些内容要进入最终 handoff。
```
````

如果你的任务经常涉及 API、数据库或审批流，建议改用 [project-CLAUDE.md](project-CLAUDE.md) 或 [springboot-service-CLAUDE.md](springboot-service-CLAUDE.md)。
