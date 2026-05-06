# Open-source Release Readiness Gap Plan

本文把当前仓库作为公开开源项目时仍未收口的事项整理成可执行清单，优先回答三个问题：

1. 哪些问题会直接影响外部用户信任或安装成功率。
2. 哪些问题已经在文档中被承认，但还没有真正修掉。
3. 下一轮应该按什么顺序推进，才能最快把“可发布”变成“可稳定采用”。

## Status Update — 2026-04-21

本轮 release-blocking 缺口已完成收口：

- `commands-core` 的 Codex selective-install gap 已修复，并有 regression test 保护。
- `tsp-create` / wizard / README / SUPPORT 的公开 target/profile 口径已统一。
- CI 已接入 `validate-doc-freshness`、strict reference validation，以及轻量 target coverage。
- GitHub issue 入口链接已改为可点击的绝对 URL。
- prebuilt binaries 已明确为 release/package artifacts；`build-prebuilt.yml` 不再尝试把被 `.gitignore` 忽略的 `bin/prebuilt/` 回写 Git。
- `npm run release:health` 与 `open-source-release-checklist.md` 已把发布前的 docs / support / prebuilt / tarball / install-surface 校验收成统一入口。

后续剩余工作主要是 adoption-oriented 的增强项，而不是下一次公开发布的阻塞项。

## 1. 当前结论

当前仓库已经具备公开仓库的基础面：

- `README.md`、`LICENSE`、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md`、`SUPPORT.md` 已存在。
- `node scripts/validate-library.js`、`node scripts/validate-file-references.js --strict`、`node tests/run-all.js` 当前可通过。
- npm 发布工作流、CI、Issue / PR 模板、CODEOWNERS 已具备基础骨架。

本轮 release-blocking 缺口已经收口，剩余事项主要转为 adoption-oriented follow-up：

- 为次级 targets 补更轻量的 quick-start / example。
- 把 release health 汇总成更容易复用的一页 checklist 或 summary 命令。
- 持续保持 README / SUPPORT / install doctor / runbooks 的 support-level 口径一致。

## 2. Closed Release Blockers (Historical Record)

### 2.1 Clarify support depth after the Codex command-gap fix

**Evidence**

- `commands-core` 已补上 `codex` target，`install-plan --profile full --target codex` 不再跳过核心命令模块。
- 但 `copilot` 等次级 targets 仍会在 `team` profile 下跳过大量模块，说明“支持 target”与“支持深度”仍然不是一回事。
- `README.md` 目前已声明 10 个公开 targets，但没有把成熟度或能力边界表达清楚。

**Why this matters**

修掉核心命令缺口后，下一步风险不再是“能不能装上命令”，而是“用户是否会把 partial support 误读成 full parity”。

**Required work**

- 保留 Codex command-gap regression test，防止 `commands-core` 再次回退。
- 为次级 targets 标注 support level 或 capability depth，而不是只列 target 名称。
- 把 README / quick-start / support docs 的承诺改成与实际模块覆盖一致。

**Definition of done**

- `install-plan --profile full --target codex` 持续保持 `commands-core` 选中。
- 有明确测试在 CI 中覆盖该场景。
- README 与 support docs 对次级 targets 的能力边界表达一致。

### 2.2 Reconcile the public installer surface

**Evidence**

- `bin/tsp-create.js` 的帮助文本仍暴露 `enterprise` profile，并只列 7 个 targets。
- `bin/lib/wizard.js` 也只展示 7 个 targets，并把 `enterprise` 当作可选 profile。
- `manifests/install-profiles.json` 的公开 profile 中已经没有 `enterprise`。
- `scripts/lib/install-targets/registry.js` 的真实 target 适配器已经是 10 个。

**Why this matters**

外部用户最先接触的是 `npx @colin4k1024/tsp --help` 和交互向导。这里一旦和真实能力面不一致，用户会第一时间撞上“文档说可以、实际报错”的失败体验。

**Required work**

- 统一 `tsp-create` help、wizard、README、Support / quick-start 对 target 和 profile 的公开口径。
- 明确 public repo 是否真的对外承诺全部 10 个 targets；如果不是，就缩减声明，而不是继续半暴露。
- 对已移出公开仓的 `enterprise` profile 做更明确的错误提示或入口说明，避免现在这种看起来可用、实际报错的状态。

**Definition of done**

- `tsp-create --help`、交互式 wizard、README、SUPPORT 文档中的 targets / profiles 完全一致。
- 不存在帮助文本暴露但 runtime 拒绝的 profile。
- 至少为当前公开支持的每个 target 提供一句明确的安装边界说明。

### 2.3 Promote declared release gates into enforced CI

**Evidence**

- `CONTRIBUTING.md`、`package.json`、`AGENTS.md` 已要求运行 `validate-doc-freshness`、strict reference validation 等检查。
- `.github/workflows/ci.yml` 当前只跑 build / validate / tests / Claude install smoke，没有把这些文档门禁接入。
- `tests/test_platform_smoke.js` 只验证 `~/.claude` 安装面，与“10 个 targets”口径不匹配。

**Why this matters**

开源项目最怕“规则只写在文档里”。如果贡献者看见 PR 模板和贡献指南要求某些门禁，但 GitHub checks 并不执行，项目治理会快速失真。

**Required work**

- 在 CI 中加入 `node scripts/validate-doc-freshness.js`。
- 在 CI 中加入 `node scripts/validate-file-references.js --strict`。
- 评估是否把 `npm run lint` 也升级为正式门禁。
- 为非-Claude targets 至少补一层轻量安装验证：可接受 install-plan / doctor matrix，也可以做更窄的 smoke，但不能完全没有。

**Definition of done**

- PR required checks 与贡献文档列出的最低门禁一致。
- target coverage 不再只剩 Claude 一条路径。
- 文档、引用、安装面漂移能在 PR 阶段而不是发布后暴露。

### 2.4 Keep entry docs publish-clean

**Evidence**

- 当前 `validate-doc-freshness` 会因为 `AGENTS.md` 含 Claude memory context block 失败。
- 该检查说明入口文档存在会话残留污染风险。

**Why this matters**

这类内容一旦进入公开仓库，不只是噪音，还会泄露内部工作痕迹并破坏入口文档可信度。

**Required work**

- 在发布前移除 `AGENTS.md` 中的会话记忆块。
- 明确是否需要额外的 pre-commit / CI 保护，避免类似残留再次进入入口文档。

**Definition of done**

- `node scripts/validate-doc-freshness.js` 在干净工作区内通过。
- 入口文档没有 session residue、temporary notes 或会话上下文块。

## 3. Should Fix Next

### 3.1 Repair GitHub issue entry links

**Evidence**

- `.github/ISSUE_TEMPLATE/config.yml` 里的 `contact_links` 使用 `./docs/...` 相对路径。

**Why this matters**

GitHub issue chooser 需要真实可跳转的 URL。相对路径看起来像链接，但对外部贡献者通常不可点击或行为不符合预期。

**Required work**

- 改成仓库绝对 URL 或文档站 URL。
- 顺手确认 Discussions / Security / Support 入口与公开协作方式一致。

### 3.2 Decide the prebuilt binary source-of-truth

**Evidence**

- `build-prebuilt.yml` 试图把 `bin/prebuilt/` 回写仓库。
- `.gitignore` 明确忽略了 `bin/prebuilt/`。
- 当前 `git add --dry-run bin/prebuilt/...` 会被 ignore 拦住。

**Why this matters**

这是一个“自动化看起来完整，实际落不到 Git”的典型失效路径。要么 prebuilt 是 release-only artifact，要么它们应该真正进入版本管理，二者必须二选一。

**Required work**

- 明确 prebuilt 的权威存储位置：Git 仓库、GitHub Release artifact、还是 npm pack staging。
- 删除与最终策略冲突的 workflow 步骤。
- 把 README / release docs 中对 prebuilt 来源的描述同步到最终策略。

### 3.3 Clarify support depth for non-primary targets

**Evidence**

- README 对 10 个 targets 做了高层声明。
- runbooks / examples / smoke tests 仍主要围绕 Claude、Codex、Cursor、OpenCode。

**Why this matters**

“支持 target”不等于“有完整上手路径”。如果某些 target 只有 adapter，没有 docs、examples、troubleshooting，就应该明确标注成熟度。

**Required work**

- 给每个非主 target 标注 support level，例如 experimental / basic / recommended。
- 若暂时不打算投入文档和回归覆盖，就下调 README 的公开承诺。

## 4. Nice to Have

### 4.1 Add an open-source release checklist

- 目标：把发布前的 README / tarball / workflow / docs / support / security 校验收成一页 checklist。
- 价值：减少“这次是记得的，下次靠回忆”的人工波动。

### 4.2 Add community-facing adoption examples beyond Claude/Codex

- 目标：为 Cursor / Copilot / Windsurf / Augment 这类 target 增加最小示例或 quick-start stub。
- 价值：降低公开支持矩阵的首次理解成本。

### 4.3 Add a release-health summary command or report

- 目标：在发布前输出统一状态摘要，例如 docs gates、tarball gates、prebuilt gates、support surface、known risks。
- 价值：让发布决策不再依赖人工拼装多个脚本输出。

## 5. Recommended Execution Order

1. 先修 `codex` `commands-core` gap，因为这是最直接的真实能力缺口。
2. 再统一 `tsp-create` / wizard / README 的公开口径，避免继续误导新用户。
3. 把 `validate-doc-freshness`、strict reference validation 和 target coverage 接到 CI，让规则真正变成门禁。
4. 处理 GitHub issue 入口链接和 prebuilt workflow 失效路径，收掉“看似存在、实际不可用”的外围问题。
5. 最后再补 release checklist 和非主 target 文档，把项目从“能发布”推进到“更好采用”。

## 6. Exit Condition

当以下条件同时满足时，可以认为这一轮开源发布收口完成：

- 公开支持矩阵中不存在已知但未修的核心安装缺口。
- 对外 CLI、README、Support、Issue / PR 入口描述一致。
- 贡献指南里声明的最低质量门禁均已进入 GitHub checks。
- 发布自动化中不再保留与仓库策略冲突的失效步骤。
- 活跃入口文档可以在干净工作区内通过文档新鲜度校验。
