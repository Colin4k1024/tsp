---
layout: home
status: active
updated: 2026-06-10
owner: 工程团队
doc_tier: entry
last_verified: 2026-06-10
source_of_truth:
  - ../README.md
  - ../AGENTS.md
  - ./runbooks/command-and-capability-matrix.md

hero:
  name: Team Skills Platform
  text: 角色化 AI 研发团队
  tagline: 200+ Skills · 8 Roles · 多平台支持 — 内置 /team-help、brownfield 补齐与 story-sized execution
  actions:
    - theme: brand
      text: 快速开始
      link: /runbooks/claude-quick-start
    - theme: alt
      text: 用户指南
      link: /runbooks/team-skills-usage
    - theme: alt
      text: GitHub
      link: https://github.com/Colin4k1024/tsp

features:
  - icon: 🧭
    title: 单入口主链
    details: 通过 /team-help 统一判断当前应该进入 intake、plan 还是先补 brownfield 文档、project context 与 readiness 证据，降低首次接入成本。
  - icon: 👥
    title: 角色化协作
    details: Tech Lead 编排 + 产品、架构、前端、后端、测试、运维 8 个专业角色协作，每个角色有明确的职责边界和交接规则。
  - icon: ⚡
    title: 200+ AI Skills
    details: 覆盖调试验证、编排效率、学习记忆、进化复用等多个维度，包含前端工程、后端模式、安全审查、TDD 等专项能力。
  - icon: 🔧
    title: 多平台支持
    details: 一套定义，同时支持 Claude Code、Codex、Cursor、OpenCode 四个平台，通过 npx 一键安装。
  - icon: 🏗️
    title: ECC Harness Layer
    details: Specialist agents、快捷命令、分层规则、运行时 hooks、上下文管理、成本追踪与持续学习等工程增强能力。
  - icon: 🧩
    title: BMAD 经验吸收
    details: 已吸收 implementation-readiness、brownfield/document-project、Story Slice Plan 与阶段化 readiness gate，不额外引入第二套平行框架。
  - icon: 🕸️
    title: 代码图谱能力
    details: CodeGraph 提供默认 MCP-backed 符号、调用链与影响面证据，Graphify / GitNexus 作为更细分的结构与深影响面补充。
  - icon: 🎨
    title: 前端治理
    details: React/Next 优先的工程规范 + UI/UX 设计知识库 + 强制质量门禁，从 intake 到 release 全链路覆盖。
  - icon: 🏢
    title: 企业级扩展
    details: 支持公司领域 Skill 扩展、企业架构治理、组件基线、数据库/缓存规范，可对齐集团标准。
---

## 文档生命周期字段

| 字段 | 值 | 说明 |
|------|----|------|
| `status` | `active` | 首页属于公开入口，作为文档导航首屏 |
| `doc_tier` | `entry` | 入口层文档；不承载与 runbooks 重复的细节说明 |
| `last_verified` | `2026-04-17` | 最近一次入口链路回归核对日期 |
| `source_of_truth` | `README.md`、`AGENTS.md`、`runbooks/command-and-capability-matrix.md` | 命令面与入口说明的权威来源 |
