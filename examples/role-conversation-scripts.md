# Example Role Conversation Scripts

这份脚本把几类高频角色对话收成可直接复制的短脚本，适合已经跑过主链，但想快速调用某个角色做局部收口的场景。

## QA 放行

```text
/team-review
请以 qa-engineer 视角基于当前 handoff、自测结果和风险说明，输出测试结论、阻塞项、放行建议和残余风险。
如果存在 custom overlay 或自定义发布扩展要求，也请说明是否需要额外验证证据。
```

如果任务已经明确命中自定义 overlay 扩展约束，先补看 [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md)。

## DevOps 发布

```text
/team-release
请以 devops-engineer 视角基于当前测试放行结果，整理发布方案、观察窗口、回滚条件、责任链，并判断是否需要私有发布或观测扩展。
如果这些能力只是私有 runbook 补充，而不是正式 overlay 依赖，也请明确写出。
```

如果当前发布就是自定义灰度或观察窗口场景，先看 [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md)。

## Tech Lead 收口

```text
请以 tech-lead 视角基于当前 intake、plan、specialist、handoff、review 和 release 结果做最终收口。
输出必须包含：已确认结论、未决问题、阻塞风险、非阻塞风险、下一步动作。
如果 specialist 结论还没有完全回收到主链，也请指出缺口。
```

## Product Manager 澄清

```text
请以 product-manager 视角整理当前需求。
输出：业务目标、核心用户场景、In Scope、Out of Scope、验收标准、待确认事项。
最后补一段：这些内容怎样进入 /team-intake。
```

## Project Manager 推进

```text
请以 project-manager 视角拆当前任务。
输出：里程碑、关键依赖、角色协作顺序、风险、升级条件。
如果存在并行开发，请说明哪些 handoff 必须提前约定。
```

## Architect 方案

```text
请以 architect 视角处理当前任务。
输出：系统边界、接口契约、数据约束、主要技术风险、是否需要 custom overlay。
如果需要 custom overlay，请区分候选项和正式启用项。
```

如果需要判断私有 overlay 与公开 runbook 的边界，先看 [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md)。

继续阅读：

- [../docs/runbooks/role-prompt-recipes.md](../docs/runbooks/role-prompt-recipes.md)
- [../docs/runbooks/qa-review-conversation-example.md](../docs/runbooks/qa-review-conversation-example.md)
- [../docs/runbooks/devops-release-conversation-example.md](../docs/runbooks/devops-release-conversation-example.md)
- [../docs/runbooks/tech-lead-closure-conversation-example.md](../docs/runbooks/tech-lead-closure-conversation-example.md)
- [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md)
