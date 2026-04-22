# Example Data Analytics Dashboard CLAUDE.md

适用于 BI 看板、运营分析台、数据驾驶舱、报表中心或数据查询控制台。

这类项目通常同时具备前端展示、后端查询、权限边界和性能约束，但又不一定像审批流那样长期命中 custom overlay。

## 适用信号

- 主要交付是图表、筛选器、表格、导出、看板布局和查询接口
- 项目对空态、慢查询、权限过滤、指标口径一致性非常敏感
- 前后端都重要，但发布复杂度通常低于大型业务平台

## 相对通用版的主要差异

### 1. 前后端角色都重要，但前端证据更突出

- 默认保留：`tech-lead`、`frontend-engineer`、`backend-engineer`、`qa-engineer`
- 指标口径或数据模型复杂时引入 `architect`

### 2. 命令流更适合“前端拆解 + 后端验证”组合

- 主链建议：`/team-intake` -> `/team-plan` -> `/multi-frontend` -> `/team-execute` -> `/handoff` -> `/team-review`
- 若查询接口或聚合逻辑复杂，可在 plan 后补 `/multi-backend`
- 若筛选逻辑、指标口径或边界态容易返工，优先补 `/tdd`

### 3. 项目约束更偏口径、一致性和性能

- 指标定义必须写清来源、聚合口径和刷新频率
- 页面必须覆盖空态、异常态、无权限态和慢加载态
- 查询接口必须说明分页、排序、过滤和超时策略
- 如果涉及导出或敏感数据，必须补齐脱敏与权限边界说明

## 一份更适合数据看板项目的精简成品

````md
# Data Analytics Dashboard Working Agreement

## 项目定位

- 类型：数据看板 / 运营分析台
- 技术栈：Next.js 或 React、TypeScript、后端查询服务、MySQL / ClickHouse / Elasticsearch
- 重点：指标口径、查询性能、图表体验、权限边界

## 默认角色

- `tech-lead`
- `frontend-engineer`
- `backend-engineer`
- `qa-engineer`
- 口径复杂时引入 `architect`

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/multi-frontend`
5. `/team-execute`
6. `/handoff`
7. `/team-review`

## 项目约束

- 指标名称、来源、聚合口径、筛选条件必须写清
- 页面必须覆盖空态、异常态、无权限态和慢加载态
- 查询接口必须说明分页、排序、过滤、超时和导出限制
- 涉及敏感数据导出时必须说明字段脱敏和权限边界

## 常用提示模板

```text
/team-intake
目标：新增销售分析看板与指标查询接口
范围：图表布局、筛选器、查询接口、导出能力、测试计划
不做：底层数仓重构、历史指标回填
约束：必须写清指标口径、空态/异常态、导出权限和查询性能要求
```

```text
/multi-frontend
基于 intake 结果，从图表体验、交互拆解、QA 风险三个视角输出计划。
必须指出空态、异常态、无权限态和慢加载态如何进入最终 handoff。
```
````

如果你的数据项目更接近传统 SaaS 前端，而不是强查询、强指标口径场景，可以直接回到 [saas-nextjs-CLAUDE.md](saas-nextjs-CLAUDE.md)。
