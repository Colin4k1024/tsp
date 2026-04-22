# Decisions Log

> 追加策略：每次重大技术决策由主责角色追加，不覆盖历史行。格式：`## YYYY-MM-DD · {标题}`

---

## 2026-03-31 · Memory Persistence Hook 从被动等待改为主动采集

**背景**：原 `session_end.py` 设计依赖 Claude 发送结构化 JSON 结束信号，实际上 Claude 从不发送该信号，导致 hook 永远处于等待状态，经验数据完全不落盘。

**决策**：彻底重写 `session_end.py`，改为主动通过 `git log -15` + `docs/memory/` 文件读取的方式采集经验；`session_start.py` 改为双源加载（repo docs/memory/ + ~/.claude/memory/ 经验文件）。

**影响**：hook 现在不依赖 Claude 输出行为，在任何 session end 场景下都能落盘。Smoke test 验证：15 commits、61 experience capsules。待确认：session_start payload 中 repo_memory_files_found 是否非空（依赖 docs/memory/ 存在）。

---

## 2026-03-31 · Observability Trace Skill 归入公共增强层

**背景**：通用编码链路追踪能力不绑定特定业务系统，适合作为编码类 skill 的公共增强。

**决策**：将这类能力保留在公开增强层，配置给 backend-engineer 和 qa-engineer，而不是作为私有企业扩展的默认依赖。

**影响**：公共仓可以保留通用可观测性说明，而不会默认暴露私有企业发布或权限集成。

---

## 2026-04-01 · 文档架构能力并入 team 主链

**背景**：需要将 eags 风格 discovery/modeling/audit 能力与当前 team-skills 体系整合，并避免并行文档目录。

**决策**：新增 `skills/doc-architecture`，并将其装配到 tech-lead、architect、backend-engineer、frontend-engineer、qa-engineer、devops-engineer。同步增强 artifact 标准、输出契约与模板字段。

**影响**：主链可直接产出并追溯 PRD、Plan、Arch、API、Execute、Test、Release、ADR、Session Summary，不需要新增 team 主命令。

---

## 2026-04-02 · Internal Workflow and Permission Case Studies Moved Out of Public Memory

**背景**：部分记忆条目直接绑定私有流程系统、权限中心和组织专属案例，不适合作为公开仓的默认示例。

**决策**：将组织专属案例从公开记忆层移出，只保留公共运行时、文档架构和平台演进相关的决策记录；私有案例转入 `enterprise` overlay 或私有仓。

**影响**：公开仓的 `docs/memory/` 更适合外部用户阅读，也不会把私有领域案例误当成公共默认路径。
