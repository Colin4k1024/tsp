# Team Operating Model

## 默认协作模式

- 默认由 `tech-lead` 统一 intake、拆解、分派、收口。
- 角色按“主责输出 + 分层交接”工作，不鼓励单角色包办整条链路。
- 共享能力放在 `skills/`，工程执行增强放在 `skills/`，稳定的公司领域扩展放在 `skills/`；更像 profile、toolkit、脚本入口的能力放在 `docs/runbooks/`、`docs/toolkits/` 与 `scripts/`，角色只负责“身份 + 决策边界 + 交接责任”。
- 涉及前端改动时，默认启用 `frontend-engineering` 与 `frontend-ui-ux-system` 两层共享能力，不把视觉和体验问题留到实现末期。

## 默认链路

1. `product-manager` 澄清需求并产出 PRD。
2. `tech-lead` 组织 `Requirement Challenge Session`，把核心假设、范围和风险先质疑清楚。
3. `project-manager` 与 `architect`、`frontend-engineer`、`backend-engineer` 进入动态分组讨论，形成可对齐的设计输入。
4. `architect` 输出方案、接口与数据契约，`tech-lead` 主持 `Design Review Board` 收口。
5. `tech-lead` 通过 `/handoff` 将任务标记为 `handoff-ready` 后，`frontend-engineer` / `backend-engineer` 才能进入实现。
6. `qa-engineer` 回归验证并给出放行建议。
7. `devops-engineer` 执行发布、监控与回滚保障。
8. `tech-lead` 决策冲突、确认放行并总结交付结果。

## 工作原则

- 每次交接都要说明输入依据、结论、风险、待确认项、当前阶段和下一跳角色。
- 角色不替上游补需求，不替下游默认接受风险。
- 遇到范围、优先级、依赖和时效冲突，回到 `tech-lead` 仲裁。
- 未完成 `Requirement Challenge Session`、`Design Review Board` 或 `/handoff` 的任务，不得推进到 `/team-execute`。
- 前端需求必须在 `/team-intake` 或 `/team-plan` 锁定产品类型、目标端、设计约束、响应式基线和 A11y/性能门禁。
- 企业内部应用必须在 intake 或 plan 阶段锁定应用等级、关键数据风险、技术架构等级和是否存在集团组件/平台约束。
- 公司领域 skill 的 canonical source 是 `skills/`；新增能力直接在此目录创建，profile / toolkit / 脚本入口落在 `docs/runbooks/`、`docs/toolkits/` 或 `scripts/`。
- 新增开源 skill / 工程实践时，必须先在 `docs/runbooks/external-capability-intake.md` 完成来源、许可证、可移植性、重叠分析和落位决策，再进入 canonical source。
