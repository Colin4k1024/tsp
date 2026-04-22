---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Specialist 命令工作簿

本文回答三个问题：何时用 specialist、用完之后怎么收口、什么时候不该用 specialist。若你先想看全局映射，配合阅读 [command-and-capability-matrix.md](command-and-capability-matrix.md)。

## 1. 常用 specialist 命令

| 命令 | 何时用 | 最小输入模板 | 常见回落位置 |
|------|--------|--------------|--------------|
| `/plan` | 任务复杂、阶段不清、依赖多 | 目标、约束、依赖、风险 | `/team-plan`、`/handoff` |
| `/tdd` | 想先测后码、缩短返工 | 功能目标、现有缺口、边界行为 | `/team-execute`、`/handoff` |
| `/code-review` | 代码已改完，要查回归/质量/风险 | 目标、改动摘要、关注点 | `/handoff`、`/team-review` |
| `/build-fix` | 构建、lint、校验失败 | 失败现象、日志、预期产物 | `/team-execute`、`/handoff` |
| `/verify` | 关键路径或放行前证据不足 | 当前结论、要验证的关键路径 | `/team-review`、`/team-release` |
| `/multi-frontend` | 前端要从实现、UI/UX、QA 多视角并行分析 | intake 结果、关键断点、设计约束 | `/handoff`、`/team-plan` |
| `/multi-backend` | 后端要从接口、权限、测试策略多视角并行分析 | intake / plan 结果、服务边界 | `/handoff`、`/team-plan` |
| `/harness-audit` | 想审视平台本身的 agent/skill/hook/rule/doc 覆盖面 | 当前平台现状、关注维度 | 平台治理、文档补齐、后续收敛计划 |

## 2. 何时用

- 需要专项拆解：`/plan`
- 想先定义测试和成功标准：`/tdd`
- 需要前端多视角：`/multi-frontend`
- 需要后端多视角：`/multi-backend`
- 需要实现质量审查：`/code-review`
- 需要构建修复：`/build-fix`
- 需要补最终验证：`/verify`
- 想知道平台能力面哪里还薄：`/harness-audit`

## 3. 何时不用

- 目标和范围还没锁定
- 主链还没确定由谁收口
- 你只是在用 specialist 替代思考和交接

## 4. 回落规则

所有 specialist 输出都应回到：

- `/handoff`
- `/team-execute`
- `/team-review`

最常用的回落提示：

```text
请把上面的专项结论整理为可直接进入 /handoff 的格式。
```

## 5. 和主链的关系

- specialist 用于缩短专项分析路径
- 主链负责最终责任和交付收口

## 6. 常见组合

- 新功能：`/team-plan` + `/plan`
- 新功能想走测试先行：`/team-plan` + `/tdd`
- 前端改造：`/team-plan` + `/multi-frontend`
- 后端改造：`/team-plan` + `/multi-backend`
- 代码改完：`/code-review`
- 构建失败：`/build-fix`
- 放行前补证据：`/verify`
- 平台自检：`/harness-audit` -> 文档 / 命令 / skills 收口计划

## 7. 不要什么时候用 `/harness-audit`

- 不要把它当业务需求的 `/team-review`
- 不要用它替代 `/verify` 的关键路径验证
- 不要用它替代真实实现或 QA 放行

它更适合做平台治理、能力面自检和“下一轮该补什么”的排序。

## 8. 常见错误

- specialist 跑得很多，handoff 却为空
- 只把结论当建议，不转成结构化交付物
- 把 specialist 当成主链角色替代
