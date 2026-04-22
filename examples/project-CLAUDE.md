# Example Project CLAUDE.md

下面是一份完整的项目级 `CLAUDE.md` 成品示范，适合中后台平台、运营控制台和多角色协作项目直接参考。

````md
# Delivery Console AI Working Agreement

本项目默认采用 Team Skills Platform 工作模式。

## 项目背景

- 产品类型：企业内部交付与运营控制台
- 技术栈：Next.js、TypeScript、Spring Boot、MySQL、Redis
- 架构边界：前端负责控制台页面与交互，后端负责订单、审批和审计接口，数据库变更必须附带迁移和回滚说明
- 外部依赖：统一登录、对象存储、消息通知服务
- 关键文档：`docs/`、ADR、接口契约、测试计划、发布说明

## 默认角色链路

- `tech-lead`：负责 intake、plan、handoff、最终收口
- `product-manager`：负责需求澄清、验收标准和范围外事项确认
- `architect`：负责接口、数据边界和关键方案决策
- `frontend-engineer`：负责页面、表单、交互和前端自测
- `backend-engineer`：负责接口、领域逻辑、数据变更和后端自测
- `qa-engineer`：负责测试计划、回归和放行建议
- `devops-engineer`：负责发布、回滚和监控

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/team-execute`
4. `/handoff`
5. `/team-review`
6. `/team-release`

## specialist 使用规则

- 方案复杂或涉及跨端拆解时可用 `/plan`、`/multi-frontend`、`/multi-backend`
- 代码进入联调前优先跑 `/code-review`
- 构建失败或 CI 异常时优先跑 `/build-fix`
- 需要补最终验证结论时使用 `/verify`
- 所有 specialist 输出都必须回落到 `/handoff` 或 `/team-*`

## 项目约束

- 修改 `roles/`、命令定义或 `templates/system/` 后，运行 `node scripts/build-platform-artifacts.js`
- 提交前运行 `node scripts/validate-library.js`
- 前端任务必须附带响应式、A11y、性能验证和 `ui-review-checklist`
- 接口或数据库变更必须写清兼容性、迁移步骤和回滚方案
- 任何 specialist 结论都不能绕过 `tech-lead` 直接成为最终决定
- 若涉及 custom overlay，必须在 intake 或 plan 阶段显式说明是正式启用、仅保留候选，还是只参考兼容说明

## 默认技能装配

- 共享能力：`api-contract`
- 前端任务：`frontend-engineering`、`frontend-ui-ux-system`
- 专项入口：验证走 `/verify`，安全评审走 `/code-review` 或对应 specialist，发布治理直接走 `/team-release` 与发布 runbook
- custom overlay：默认关闭，仅在任务明确依赖私有流程、权限、发布或观测能力时再启用；兼容入口见 `examples/enterprise-overlay-scenario-playbook.md` 和 `examples/enterprise-overlay-output-playbook.md`

## 默认交付物

- intake 结果：目标、范围外事项、风险、参与角色
- plan 结果：任务拆解、依赖关系、handoff 清单
- execute 结果：代码变更、自测结果、待确认项
- review 结果：测试结论、阻塞项、是否建议放行
- release 结果：上线步骤、回滚方案、监控点

## 首次调用模板

```text
/team-intake
目标：为订单运营控制台新增审批记录查询页与配套接口
范围：前端列表页、筛选表单、后端查询接口、测试计划
不做：审批流程定义改造、历史数据回填
约束：前端必须附带 ui-review-checklist，后端必须说明接口兼容性
输出：参与角色、主要风险、是否需要启用 custom overlay、下一步建议
```

```text
/team-plan
基于当前 intake 结果拆解 product-manager、architect、frontend-engineer、backend-engineer、qa-engineer 的任务。
要求给出依赖关系、每次 handoff 的最小交付物，以及哪些内容必须进入最终 release 说明。
```

```text
/handoff
把 frontend-engineer 和 backend-engineer 的执行结果汇总成交接文档。
必须包含代码变更摘要、自测范围、剩余风险、QA 关注点。
```
````

这个成品示范适合直接照着改名词和约束。保留它的结构，比从零拼装一个项目级 `CLAUDE.md` 更稳妥。

如果你的项目经常命中私有流程系统、权限中心、内部发布流水线或专属观测能力，先补看 `examples/enterprise-overlay-scenario-playbook.md` 和 `examples/enterprise-overlay-output-playbook.md`，再把相关约束并回这份项目模板。

如果你在通用版、前端版和后端版之间犹豫，先看 [INDEX.md](INDEX.md)。
