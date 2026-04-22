# Codex Scenario Playbook

这份示例集聚焦 Codex 端最常见的组合：主链起手、并行分析、收口回 handoff，再进入 review 或 release。

## 快速选择

| 任务 | 推荐起手 | 何时用 |
|------|----------|--------|
| 前端并行修复 | `/team-intake` -> `/multi-frontend` | 页面改动同时命中实现、UI/UX、QA 风险 |
| 后端并行拆解 | `/team-intake` -> `/team-plan` -> `/multi-backend` | 接口、权限、测试策略要并行分析 |
| 测试先行开发 | `/team-plan` -> `/tdd` | 先把测试和成功标准锁定，再进入实现 |
| 构建失败归因 | `/build-fix` -> `/verify` | 先定位失败，再补验证证据 |
| 发布收口 | `/team-release` | 已有 review 结论，准备上线或回滚判断 |
| 多 agent 结果收口 | `/handoff` | specialist 或 `/multi-*` 已给出多份结论 |
| 平台能力自检 | `/harness-audit` | 新增了命令、skills、hooks 或文档后，想快速看哪里未同步 |
| custom overlay 专项 | 看 [enterprise-overlay-scenario-playbook.md](enterprise-overlay-scenario-playbook.md) | 需要直接复制私有流程、权限、发布或观测扩展场景 |

## 场景 1：前端并行修复

```text
/team-intake
目标：修复控制台首页在 iPad 横屏下的布局溢出
范围：页面布局、响应式回归、UI 验证清单
不做：接口与数据结构改造
约束：必须遵守 frontend-quality-gates
```

然后继续：

```text
/multi-frontend
基于当前 intake 结果，从实现、UI/UX、QA 风险三个视角拆解工作。
要求指出哪些结论必须进入最终 handoff。
```

## 场景 2：后端并行拆解

```text
/team-intake
目标：新增订单审批状态流转接口
范围：接口、权限校验、测试计划
不做：前端页面
约束：需要判断是否依赖 custom overlay
```

再继续：

```text
/team-plan
基于 intake 结果，拆解 architect、backend-engineer、qa-engineer 的职责，给出依赖和风险。
```

```text
/multi-backend
基于当前 intake 或 plan，把接口实现、权限边界、测试策略三部分并行分析。
如果命中私有流程或权限系统，请明确说明是正式启用 overlay，还是仅保留为候选项。
最终请整理出可直接回写 /team-plan 的结果。
```

## 场景 3：构建失败归因

```text
/build-fix
当前 CI 构建失败。
请先定位失败归因、给出最小修复路径和验证命令。
如果修复路径还不明确，再说明是否需要补 /verify 或 /code-review。
```

然后补一句：

```text
请把上面的结论整理成可直接回到 /team-execute 的动作清单，包含修复项、验证项和剩余风险。
```

## 场景 4：测试先行开发

```text
/team-plan
基于当前需求拆解实现任务，并给出适合进入 /tdd 的最小上下文。
```

```text
/tdd
目标：新增订单审批状态流转接口
现有缺口：还没有测试先行路径和回归边界
成功标准：给出 red-green-refactor 步骤，并整理成可直接回到 /team-execute 的动作清单
```

## 场景 5：平台能力自检

```text
/harness-audit
目标：检查当前平台的命令、skills、hooks、rules、文档和集成深度。
输出：Overall Score、Dimension Scores、Top Actions、Recommendations。
请再补一段：哪些结论需要回到 README、quick start、examples 或 team-skills-usage。
```

## 场景 6：发布收口

```text
/team-release
基于当前测试放行结果，整理发布方案、观察窗口、回滚条件和责任链。
如果需要 GitLab 手动流水线、Langfuse 追踪或其他 release runbook 补充，请明确写出触发条件和回写方式。
```

## 场景 7：多 agent 结果收口

```text
请把上面的多 agent 结论整理成一次正式 /handoff。
不要重复每个 agent 的原话，只保留：
- 已确认结论
- 未决问题
- 风险与依赖
- 下一角色动作清单
```

## 使用建议

- Codex 里不要一上来就并行，先用 intake 锁定目标和范围。
- 并行后的第一动作永远是收口到 handoff。
- 如果你想知道 `/tdd`、`/harness-audit` 背后分别搭哪些能力，先看 [../docs/runbooks/command-and-capability-matrix.md](../docs/runbooks/command-and-capability-matrix.md)。
- 如果你想看更细的并行表达，回看 [../docs/runbooks/codex-parallel-prompt-recipes.md](../docs/runbooks/codex-parallel-prompt-recipes.md)。
- 如果你想看完整成品对话，继续看 [../docs/runbooks/codex-end-to-end-conversation-example.md](../docs/runbooks/codex-end-to-end-conversation-example.md)。
