# Changelog

## Release v2.4.1 — npm Package Surface Alignment

### v2.4.1 Highlights

- npm 发布版本升级到 `2.4.1`
- 公开 npm 包口径统一为 `@colin4k1024/tsp`，移除了发布脚本、安装帮助与错误提示中的旧包名引用
- 开源发布清单同步更新到 `2.4.1`，保持发布文档与实际 npm surface 一致

### v2.4.1 Verification

```bash
node -p "require('./package.json').name + '@' + require('./package.json').version"
node bin/tsp-create.js --help
grep -R "@colin4k1024/tsp" README.md CHANGELOG.md bin scripts docs -n
```

### v2.4.1 Notes

- CLI 二进制名仍保持 `tsp-create` 与 `tsp-install`，变化仅针对 npm 包名与发布版本。

## Release v2.4.0 — DESIGN.md Design Execution Layer

### v2.4.0 Highlights

- **DESIGN.md 设计执行层**：在 `design-system-brief（意图）→ DESIGN.md（具体值）→ ui-implementation-plan（实现）→ ui-review-checklist（核验）` 流程中补齐了"具体 token 值"的传递断层
- 项目根目录内置默认 `DESIGN.md`，基于 Notion 真实设计 token（温暖极简，企业管理类），前端 agent 无需额外配置即可生成视觉一致的 UI
- 支持通过 `npx getdesign@latest add <brand>` 覆盖为 69+ 品牌风格（linear.app / stripe / mintlify / hashicorp / posthog 等）
- `skills/frontend-ui-ux-system/SKILL.md`：新增 **Step 0**，强制 agent 在实现前先检查并读取根目录 `DESIGN.md`
- `skills/frontend-engineering/SKILL.md`：新增 **Step 0**，强制 agent 以 `DESIGN.md` 中的 token 为准，禁止硬编码原始色值
- 新增 `skills/frontend-ui-ux-system/references/design-md-integration.md`：DESIGN.md 9 区块字段与现有 Color/Typography/Spacing/Radius/Shadow token 体系的映射参考
- 新增 `templates/DESIGN.md`：完整 9 区块主模板，含 Notion/Linear 企业管理风格示例值和注释说明
- `templates/design-system-brief.md`：新增第 7 节"DESIGN.md 产出"，含参考品牌、npx 命令、定制要点字段
- `rules/frontend-design-knowledge-base.md`：新增 DESIGN.md token 字段映射、主模板入口、品牌参考库索引节（awesome-design-md 完整仓库链接）
- 新增 `docs/runbooks/design-md-workflow.md`：3 种 DESIGN.md 创建路径（npx 推荐 / 从 brief 提取 / 从头填写）+ 与 `/team-*` 命令的对接说明

### v2.4.0 Verification

```bash
node scripts/build-platform-artifacts.js
node scripts/validate-library.js
node scripts/validate-doc-freshness.js
# 检查 DESIGN.md 是否存在
ls DESIGN.md && head -5 DESIGN.md
# 检查 Step 0 是否已注入 frontend skills
grep -A3 "Step 0" skills/frontend-engineering/SKILL.md
grep -A3 "Step 0" skills/frontend-ui-ux-system/SKILL.md
```

### v2.4.0 Notes

- `docs/runbooks/design-md-workflow.md` 在 `.npmignore` 中被排除，不会打包进 npm 包；`DESIGN.md`（根目录）、`templates/DESIGN.md`、`skills/.../design-md-integration.md` 均包含在 npm 包中。
- 覆盖命令：`npx getdesign@latest add <brand>`，执行后 `DESIGN.md` 被替换；建议 git commit 固化。
- Notion token 来源：从 getdesign.md 提取，不代表 Notion 官方设计规范。

## Release v2.2.0 — BMAD Source Adoption v2.2

### v2.2.0 Highlights

- `/team-help` 改为 catalog-first 路由：优先读取 `scripts/lib/workflow-help-catalog.json`，缺失时回退 heuristic 并标记 `routerSource=fallback`
- `/team-help --json` 新增稳定字段 `routerSource`、`decisionEvidence`、`nextCommandCandidates`，并把 `project-context` 必填段缺失作为优先补齐门禁
- `scripts/install-apply.js` 扩展为 `plan|status|doctor|repair|uninstall` 子命令；`repair/uninstall` 默认 dry-run，需 `--apply` 才落盘
- 安装链路新增 `install-manifest`（SHA-256 文件清单），`doctor` 新增 install-state 与 install-manifest 漂移联合审计
- 新增独立校验器 `scripts/validate-file-references.js` 与 `scripts/validate-skill-structure.js`，并接入 `scripts/validate-library.js`
- 继续保留已知风险：Codex selective-install 可能跳过 `commands-core`（只记录风险，不修改 target 矩阵）

### v2.2.0 Verification

```bash
node scripts/build-platform-artifacts.js
node scripts/validate-library.js
node tests/test_workflow_readiness.js
node tests/test_session_start.js
node tests/test_team_command_persistence.js
node tests/test_workflow_help_catalog.js
node tests/test_install_apply_lifecycle.js
node tests/test_install_manifest_hash.js
node tests/test_validation_scripts.js
node scripts/install-platform.js claude --claude-home /tmp/claude-smoke-bmad-v2
node scripts/install-plan.js --profile full --target codex
```

### v2.2.0 Notes

- Claude smoke 验收结果：`settings.json` 不再出现 `.py` hooks，且 JS hooks（`session-start-bootstrap.js`、`governance-capture.js`、`session-end.js`、`cost-tracker.js`）均已注册。
- `install-plan --target codex` 继续显示 `commands-core` 在 skipped 列表中，作为已知风险留档，不作为版本失败条件。

## Release v2.1.12 — BMAD Absorption v2 Closure

### v2.1.12 Highlights

- `/team-help` 继续收口为 `/team-*` 唯一公开入口，BMAD 不再暴露第二套并行命令面
- `scripts/install-platform.js` 已完成 legacy Claude 安装/runtime 对齐：清理旧 `.py` hook 注册，统一复制与注册当前 JS hooks
- Codex / Claude 的 skill 安装逻辑改为按 `SKILL.md` 识别平铺目录，避免漏装扁平技能
- active user-facing docs（README、AGENTS、onboarding、usage、runtime、matrix、quick-start）已统一到当前 JS runtime + `artifact:persist` 主链叙述
- 新增安装与文档漂移回归测试，防止旧 Python hook 名称和旧结构再次回流
- 已知风险记录：Codex selective-install 仍可能跳过 `commands-core`（本轮仅记录，不修改 manifest target 矩阵）

### v2.1.12 Verification

```bash
node scripts/build-platform-artifacts.js
node scripts/validate-library.js
node tests/test_workflow_readiness.js
node tests/test_session_start.js
node tests/test_team_command_persistence.js
node tests/test_install_platform_regression.js
node tests/test_active_surface_docs.js
node scripts/install-platform.js claude --claude-home /tmp/claude-smoke-bmad-v2
node scripts/install-plan.js --profile full --target codex
```

### v2.1.12 Notes

- Claude smoke 验收标准：`settings.json` 不得出现 `.py` hook，且必须存在 `session-start-bootstrap.js`、`governance-capture.js`、`session-end.js`、`cost-tracker.js` 注册项。
- `install-plan --target codex` 仍显示 `commands-core` 被跳过，这是已记录风险，不作为本版本失败条件。

## Release v2.1.5 — Tarball Gate & Install Hydration

### v2.1.5 Highlights

- 发布工作流在 `npm pack` 后新增 tarball 内容校验，确保最终 tgz 确实包含 5 个平台的 prebuilt bridge
- 本地 `npm pack` 现在也会先同步并校验 prebuilt bridge，避免离线 tgz 只带 `README.md`
- `tsp-create` 安装时若未命中 bundled prebuilt，会先尝试同步当前平台二进制，再回退到本地 Rust 构建
- `tsp-create`、source installer、embedded installer 统一改为等待 bridge provisioning 完成后再退出，避免异步收尾丢失

### v2.1.5 Verification

```bash
node tests/test_validate_packed_tarball.js
node tests/test_post_install_bridge.js
node tests/run-all.js
```

## Release v2.1.4 — Artifact Persistence & Prebuilt Sync

### v2.1.4 Highlights

- 新增 `artifact:persist` CLI，将 `/team-*` 主链要求的 artifact / memory / session 落盘动作变成可执行命令
- `/team-help` 与 readiness gate 继续收紧，补齐 brownfield context、Story Slice Plan 和后续阶段 artifact 要求
- 本地 `npm publish` 前可自动从 GitHub 回填 prebuilt bridge 二进制，避免本地发布包缺少 `bin/prebuilt/`

### v2.1.4 Verification

```bash
node tests/test_sync_prebuilt_from_github.js
node tests/run-all.js
```

# Release v2.1.3 — BMAD Absorption MVP

## BMAD Absorption MVP

### Highlights

- 新增 `/team-help` 作为主链入口路由命令
- execute gate 引入 implementation-readiness、project-context 和 Story Slice Plan 要求
- brownfield 现状快照与 `/update-codemaps` 已纳入主链上下文

### Breaking Changes

- handoff 的 `readiness_status` 不再接受旧值 `ready`
- 新规则按目标阶段要求使用：`execute -> handoff-ready`、`review -> ready-for-review`、`release -> release-ready`、`closeout -> accepted`
- 既有项目升级后，需先迁移历史 handoff，再运行 `npm run workflow:readiness`

# Release v2.1.2 — PUA Integration & Hooked Pressure Loop

## Highlights

新增 PUA 高能动性与高压闭环能力，覆盖 `/pua` 命令入口、7 个模式 skill、失败升级 hooks、Always-On 状态恢复，以及配套 regression tests。

## What's New

### PUA Skills & Command Surface

- 新增核心 skill `skills/pua/`，以及 `pua-p7`、`pua-p9`、`pua-p10`、`pua-pro`、`pua-yes`、`pua-mama`、`pua-loop` 七个模式 skill
- 新增 `/pua` 命令并接入命令生成链路与安装模块
- 更新 `AGENTS.md`、`CLAUDE.md`、`README.md` 与 `hooks/README.md`，让 PUA 入口和运行时行为可发现

### Runtime Hook Mapping

- 新增 `pua-post-tool-failure`、`pua-post-tool-use`、`pua-pre-compact`、`pua-stop` 四个 hook 脚本
- 新增 `scripts/lib/pua-state.js`，持久化 `~/.claude/pua/config.json`、`state.json` 与 `builder-journal.md`
- `SessionStart` 现在会在 Always-On 模式下恢复当前 flavor、失败等级和连续失败次数
- `stop-hook-bootstrap.js` 负责 Stop 阶段非阻塞执行，避免 hook 异常卡住收尾

### Validation

- 新增 `tests/test_pua_hooks.js`，覆盖失败升级、成功重置、compact journal、stop journal、坏输入恢复
- 定向 PUA hooks 测试与仓库全量测试均已通过

## Verification

```bash
node tests/test_pua_hooks.js
node tests/run-all.js
```

# Release v2.1.1 — Bridge Packaging & Publish Pipeline Fixes

## Highlights

`@colin4k1024/tsp` npm 包现在内置 `crates/oris-claude-bridge` 源码和多平台预构建 bridge 二进制，安装时会按用户操作系统自动选择对应 bridge。

## What's New

### Bridge Packaging

- npm 包纳入 `crates/oris-claude-bridge/`，保证离线和 fallback 安装链路完整
- 发布流程会为 `darwin-arm64`、`darwin-x64`、`linux-x64`、`linux-arm64`、`win32-x64` 构建并打包预构建 bridge
- 安装流程优先使用预构建 bridge，不可用时再回退到本地 Rust 编译

### Publish Pipeline Fixes

- `publish.yml` 为 npm 发布步骤显式注入 `NPM_TOKEN`
- `darwin-x64` GitHub Actions runner 切换到官方 Intel 标签 `macos-15-intel`
- publish dry-run 已验证通过，5 个 bridge 构建矩阵和最终 publish job 全部成功

## Verification

```bash
node tests/run-all.js
tmp_home=$(mktemp -d) && HOME="$tmp_home" CLAUDE_HOME_DIR="$tmp_home/.claude" ./scripts/install-claude.sh && HOME="$tmp_home" RUN_INSTALL_SMOKE_TESTS=1 node tests/test_platform_smoke.js
```

# Release v2.1.0 — Python → JavaScript Migration Complete

## Highlights

**100% JavaScript `scripts/` directory** — All Python scripts have been migrated, deleted, or replaced with JavaScript equivalents.

## What's New

### Migration: Python → JavaScript (34 files deleted)

- `scripts/build_platform_artifacts.py` → `scripts/build-platform-artifacts.js`
- `scripts/install_platform.py` → `scripts/install-platform.js`
- `scripts/langfuse_trace.py` → `scripts/langfuse-trace.js`
- `scripts/query_audit_logs.py` → `scripts/query-audit-logs.js`
- `scripts/scan_leaked_keys.py` → `scripts/scan-leaked-keys.js`
- `scripts/trigger_gitlab_pipeline.py` → `scripts/trigger-gitlab-pipeline.js`
- `scripts/validate_workflow_state.py` → logic merged into `scripts/validate-workflow-state.js`
- `scripts/team_skills_platform.py` → constants merged into `scripts/lib/team-skills-platform.js`
- `scripts/validate_library.py` → logic merged into `scripts/validate-library.js`
- `scripts/hooks/*.py` (6 files) — deleted, hooks already ran JS versions
- `scripts/evolution/*.py` (7 files) — deleted, obsolete evolution system
- `scripts/lib/audit_logger.py`, `audit_query.py`, `hook_contract.py`, `memory_store.py`, `utils.py` — deleted
- Maintenance scripts (`_inspect_project_session.py`, `_migrate_agent_governance.py`, etc.) — deleted

### Test Suite Improvements

- **New**: `tests/test_platform_smoke.js` — pure JavaScript smoke tests (no pytest dependency)
- **New**: `tests/run-all.js` — unified test runner for both JS and Python tests
- **Deleted**: `test_audit_logging.py`, `test_security_scan.py`, `test_workflow_validation.py`, `test_platform_smoke.py` (all tested deleted Python code)

### Lint & Code Quality

- ESLint errors fixed across 12 files (unused variables, empty catch blocks, regex patterns)
- Added vendor file ignores for third-party code (`layer.js`, monaco-editor, goframe-v2 examples)
- Created `.eslintignore` for compatibility

### CI/CD

- `.github/workflows/ci.yml` updated: all Python script references replaced with JavaScript equivalents
- `python3 scripts/scan_leaked_keys.py` → `node scripts/scan-leaked-keys.js`
- `python3 scripts/build_platform_artifacts.py` → `node scripts/build-platform-artifacts.js`
- `python3 scripts/validate_library.py` → `node scripts/validate-library.js`
- Removed `test_security_scan` (deleted)

### Full Test Suite: 97 Tests Passing

```
npm run validate  →  PASS (73 artifacts validated)
npm run lint      →  PASS (0 errors)
npm test          →  PASS (97 tests: 60 Python unittest + 37 JS smoke)
```

## Other Changes Since v2.0.0

- Security: patch template injection and path traversal vulnerabilities
- Workflow execution CLI (`workflow run`, `workflow readiness`)
- Unified error types and TypeScript definitions
- Workflow name index for faster lookups
- Exit code mapping and fingerprint display in CLI

## Upgrading

No breaking changes. If you have custom CI workflows referencing `scripts/*.py`, update to `scripts/*.js`.

```bash
# Old (removed)
python3 scripts/scan_leaked_keys.py
python3 scripts/build_platform_artifacts.py

# New
node scripts/scan-leaked-keys.js
node scripts/build-platform-artifacts.js
```
