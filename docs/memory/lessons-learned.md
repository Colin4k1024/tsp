# Lessons Learned

> 追加策略：由 qa-engineer 或 devops-engineer 在遇到可复用经验时追加。格式：`## YYYY-MM-DD · {标题}`

---

## 2026-03-31 · session_end hook 不能依赖 LLM 主动发送结构化数据

**场景**：设计 memory persistence hook 时，原方案希望 Claude 在会话结束时输出结构化 JSON 摘要，由 hook 捕获存盘。

**问题**：Claude 不会主动向 hook stdin 发送任何结束信号。`while True: line = sys.stdin.readline()` 会永久阻塞，数据永远不落盘。

**建议**：session_end hook 应主动采集，而非被动等待。可读 git log、docs/memory/、changelog 等文件作为替代数据源；不依赖 LLM 在特定格式下产出数据。

---

## 2026-03-31 · _experience.json 文件格式与 SessionSummary dataclass 不兼容

**场景**：session_end.py 在同一目录写入 `{id}.json`（SessionSummary）和 `{id}_experience.json`（experience capsules）两类文件。

**问题**：`memory_store.py` 的 `load_latest_session_summary` 按日期排序读取所有 `.json` 文件，`_experience.json` 字段不同会导致 dataclass 反序列化失败。

**建议**：在 `load_latest_session_summary` 中添加 `if "_experience" in session_file.name: continue` 跳过逻辑；或将两类文件放入不同子目录隔离。

---

## 2026-03-31 · docs/memory/ 目录必须提前初始化

**场景**：session_start.py 重写后从 `docs/memory/project-context.md` 等文件读取上下文，但该目录在项目初始未被创建。

**问题**：`repo_memory_files_found: []` — session_start 运行无报错但上下文为空，导致新会话缺少项目感知。

**建议**：每个接入项目在首次配置 hooks 后，应立即创建 `docs/memory/project-context.md`、`decisions.md`、`lessons-learned.md` 三个基础文件，哪怕内容只是占位符。可在 `docs/runbooks/project-onboarding.md` 中补充这一步骤。

---

## 2026-03-31 · validate_library.py（当前等价 `node scripts/validate-library.js`）的 REQUIRED_ECC_SKILLS 必须与目录同步更新

**场景**：新增 ecc skill（langfuse-coding-trace、harness-audit）后，历史脚本 `validate_library.py`（当前等价 `node scripts/validate-library.js`）仍只检查旧的 9 个 required skills。

**问题**：新 skill 存在但不被验证，脚本 PASS 不代表实际完整性正确。

**建议**：每次在 `skills/` 新增 skill 时，同步更新 `scripts/validate-library.js` 中的 `REQUIRED_ECC_SKILLS` 列表；可考虑改为动态读取 `skills/` 自动发现。

---

## 2026-04-01 · 文档能力整合优先走 artifacts 映射而非新目录

**场景**：将外部文档能力并入 team-skills 主链。

**问题**：若沿用外部目录习惯（architecture/domains/specs/plans/runbooks），会与现有 artifact 持久化规则冲突，导致事实源分裂。

**建议**：统一把 discovery/modeling/audit 内容映射到现有 artifact 文件；新增能力优先通过 shared skill + 输出契约字段扩展落地，不新增并行主命令或并行主目录。

---

## 2026-04-09 · skills 子目录嵌套会阻止 Claude 自动发现

**场景**：skills 按 shared/ecc/company 三层子目录组织（`skills/shared/api-contract`、`skills/ecc/eval-harness`），认为逻辑清晰。

**问题**：Claude Code 只自动扫描 `skills/` 根目录下的 SKILL.md，嵌套一层子目录后 skill 不会出现在可用列表中，用户无法直接使用。

**建议**：所有 skill 统一平铺到 `skills/` 根目录。分类信息通过 manifest module 和 role.yaml 的 recommended_*_skills 字段表达，不依赖目录层级。

---

## 2026-04-09 · JSON 文件中的 Unicode 弯引号导致解析歧义

**场景**：`roles/architect/role.yaml` 中 outputs 字段包含中文弯引号 `"前端页面"`，Node.js `JSON.parse` 报错 position 422。

**问题**：中文弯引号 U+201C/U+201D 在 JSON 字符串内部时，解析器会在遇到 ASCII `"` 时错误地判断字符串终止位置。

**建议**：JSON 文件内的中文引号统一使用 `「」` 或反斜杠转义。CI 可加一条 pre-commit 检查，检测 .yaml/.json 中的 U+201C/U+201D。

---

## 2026-04-09 · 批量路径替换后验证脚本需单独修复

**场景**：sed 全局替换了 `skills/shared/` → `skills/`，文档和配置文件正确，但验证脚本内部 `path.join(root, "skills", "shared", skill)` 硬编码路径未被替换。

**问题**：验证脚本通过 string concat 拼路径，sed 替换 markdown/JSON 中的字符串引用时不会命中 JS/Python 代码中的路径拼接。

**建议**：路径替换后，必须单独 grep 验证脚本中的硬编码子目录名（如 `"shared"`、`"ecc"`、`"company"`），并运行验证脚本确认。

## 2026-04-17 - BMAD Source Adoption v2.2 closeout

Closeout readiness for /team-closeout depends on complete artifacts (prd, delivery-plan, handoff, execute/review/release docs). When continuing from mid-stream work, run a gate completeness check early to avoid end-stage backfill.
