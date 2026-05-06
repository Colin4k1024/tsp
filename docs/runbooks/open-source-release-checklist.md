---
version: "2.4.1"
status: active
created: 2026-04-22
updated: 2026-05-06
owner: 工程团队
doc_tier: entry
last_verified: 2026-05-06
source_of_truth:
  - ../../README.md
  - ../../package.json
  - ../../.github/workflows/publish.yml
  - ../../scripts/release-health-summary.js
---

# 开源发布收尾清单

本文用于把当前仓库作为公开开源项目发布前的最后收尾动作固定下来。它不替代通用发布方案，而是专门覆盖 public README / support / tarball / install surface / community entry points 这些开源发布面。

## 1. 最短执行顺序

1. 先跑 `npm run release:health`
2. 若已经生成 tarball，再跑 `npm run release:health -- --pack-json .npm-pack.json`
3. 处理所有 `FAIL` 项；`WARN` 项需要明确记录是否接受
4. 再过一次 [pre-release-checklist.md](pre-release-checklist.md)

## 2. 这条命令会帮你看什么

- `validate-library`
- `validate-doc-freshness`
- `validate-file-references --strict`
- `tests/test_public_release_surface.js`
- `tests/test_tsp_create_surface.js`
- `tests/test_codex_install_plan.js`
- `validate-prebuilt`
- `validate-packed-tarball`（若提供 tarball 或 pack-json）
- 公开 target support summary（默认按 `team` profile）

## 3. Maintainer Checklist

### 3.1 入口与社区面

- [ ] `README.md`、`SUPPORT.md`、`CONTRIBUTING.md`、`SECURITY.md` 入口齐全且互相可达
- [ ] README 中的 target/profile/support-level 口径与当前 manifests/runtime 一致
- [ ] GitHub issue contact links、PR template、CI checks 与公开协作方式一致

### 3.2 安装与能力面

- [ ] `tsp-create --help`、wizard、README、SUPPORT 对 target/profile 口径一致
- [ ] Codex `commands-core` regression test 仍为绿色
- [ ] partial / baseline targets 没有被文档误写成 full parity

### 3.3 打包与发布面

- [ ] `validate-prebuilt` 为绿色
- [ ] 若已打包 tarball，`validate-packed-tarball` 为绿色
- [ ] prebuilt source of truth 仍是 workflow/release staging + npm tarball，而不是 Git 回写目录
- [ ] publish workflow 与本地说明没有再次漂移

### 3.4 文档卫生

- [ ] `validate-doc-freshness` 为绿色
- [ ] `AGENTS.md`、README、runbooks 没有 session residue、临时记录或会话记忆块
- [ ] strict reference validation 为绿色

## 4. 怎样理解结果

- `PASS`：当前可直接进入发布或合并前最后确认
- `WARN`：不是硬阻塞，但要么当场修，要么在 release notes / backlog 中显式接受
- `FAIL`：不应继续做公开发布
- `SKIP`：通常表示你还没提供 tarball；如果当前要发 npm，这一项不能跳过

## 5. 当前公开支持口径

- `Recommended`：`claude`、`cursor`
- `Strong`：`codex`、`opencode`
- `Partial`：`antigravity`、`codebuddy`
- `Baseline`：`gemini`、`copilot`、`windsurf`、`augment`

如果 support matrix 发生变化，必须同步更新：

1. `README.md`
2. `SUPPORT.md`
3. `scripts/release-health-summary.js` 的 support summary 输出

## 6. 相关文档

- 通用发布检查：[pre-release-checklist.md](pre-release-checklist.md)
- 发布收口一页：[release-closure-one-page.md](release-closure-one-page.md)
- npm / release automation：[release-notes-automation.md](release-notes-automation.md)
