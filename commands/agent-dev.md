# /agent-dev

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

启动交互式 AI Agent 开发 Workshop，通过 6 阶段深度协作引导用户从零到一开发可运行的 Agent 项目。支持 LangChain、EINO、AutoGen、AgentScope、CrewAI 等主流框架。

## 主责角色

- `agent-builder`

## 期望输入

- 业务场景或 Agent 目标描述
- 可选：`--quick`（快速生成）、`--import`（导入已有代码）
- 可选：指定框架、语言、LLM 提供商

## 标准输出

- 可运行的 Agent 项目目录
- 阶段性设计文档（spec / architecture / tools / prompts）
- 验证报告

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. **需求发现**（Phase 1）：通过 5 轮交互锁定业务场景、Agent 类型、框架选择、LLM 约束和成功标准。
2. **架构设计**（Phase 2）：加载匹配的架构模式，设计组件拓扑与数据流。
3. **工具定义**（Phase 3）：逐一确认 Agent 需要的外部工具、记忆策略和 RAG 配置。
4. **提示词与编排**（Phase 4）：设计系统提示词和 Agent 间编排逻辑。
5. **代码生成**（Phase 5）：加载框架适配器，按统一项目结构生成全量可运行代码。
6. **验证迭代**（Phase 6）：依赖安装、语法检查、单元测试、冒烟测试、自动修复。

## 变体模式

### `/agent-dev --quick`

一句话需求 → 自动推断规格 → 跳过确认 → 一次性生成完整项目。适合框架熟练用户。

### `/agent-dev --import`

导入已有 Agent 代码 → 分析架构模式 → 选择目标框架 → 生成迁移报告和新框架代码。
