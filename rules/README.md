# Rules Catalog

本目录承载两层规则：

- 平台专属规则：`team-operating-model.md`、`handoff-contract.md`、前端治理规则等
- ECC harness 规则包：`common/` 与语言分层规则目录
- 公司领域扩展技能通过 `skills/` 接入时，仍以本目录规则作为主链治理基线

## 使用方式

1. 默认团队协作先遵循平台专属规则和 `/team-*` 命令。
2. 当启用 specialist agents、ECC commands 或 `skills/` 时，再引入 `common/` 与语言规则包。
3. 当启用 `skills/` 时，先遵循平台专属规则，再按领域 skill 的附加约束执行。
4. 当引入开源 skill 或工程实践时，先按 [external-capability-intake.md](../docs/runbooks/external-capability-intake.md) 完成 intake，再决定是否进入 `skills/`、`skills/` 或 `docs/runbooks/`。
5. 若规则冲突，以平台专属交接与治理规则为准，由 `tech-lead` 仲裁。

## 规则分层

- `common/`：所有 specialist 和精选技能共用的工程规则
- `typescript/`：TypeScript / JavaScript / 前端专项规则
- `java/`：Java / Spring Boot / JPA 专项规则
- `python/`：Python 专项规则
- `golang/`：Go 专项规则

## 入口建议

- 通用工程治理：见 [common/README.md](common/README.md)、[common/coding-style.md](common/coding-style.md)、[common/testing.md](common/testing.md)
- 企业架构治理：见 [common/enterprise-architecture-governance.md](common/enterprise-architecture-governance.md)、[common/enterprise-component-baseline.md](common/enterprise-component-baseline.md)
- specialist 编排：见 [common/agents.md](common/agents.md)、[common/hooks.md](common/hooks.md)
- 前端与 TypeScript：见 [typescript/frontend.md](typescript/frontend.md)
- Java / Spring：见 [java/enterprise-java.md](java/enterprise-java.md)、[java/database.md](java/database.md)、[java/redis.md](java/redis.md)、[java/springboot.md](java/springboot.md)、[java/jpa.md](java/jpa.md)
