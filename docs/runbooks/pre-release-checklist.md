---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 发布前检查速查清单

本文用于发布前 5 到 10 分钟的最后检查，不替代完整发布方案。

## 1. 环境

- [ ] 目标环境与发布窗口已确认
- [ ] 责任人、值守人与观察窗口已确认
- [ ] 必要配置与环境变量已就绪

## 2. 变更

- [ ] 发布范围和版本信息已锁定
- [ ] 高风险点已单独标记
- [ ] 数据或配置变更已确认可回退

## 3. 质量

- [ ] QA 放行结论明确
- [ ] 关键链路 smoke 范围明确
- [ ] 残余风险已进入观察项

## 4. 回滚

- [ ] 回滚条件已明确
- [ ] 回滚步骤已明确
- [ ] 回滚负责人已明确

## 5. 扩展项

- [ ] 如需 GitLab manual job，已确认触发条件
- [ ] 如需 Langfuse 追踪，已确认 trace 粒度和回写位置

## 6. npm 发布补充检查（适用于 npm registry 发布）

- [ ] 若使用 npm Trusted Publisher，已在 npm 包设置中正确绑定 GitHub 仓库、仓库名与 workflow 文件名（例如 `publish.yml`）
- [ ] GitHub Actions 发布 workflow 已启用 `id-token: write`
- [ ] `npm publish` 步骤未再注入发布用 `NODE_AUTH_TOKEN` / `NPM_TOKEN`，避免从 OIDC 回落到 token 鉴权后触发 OTP
- [ ] 若 `npm ci` 需要访问私有依赖，仅读取阶段使用只读 token；publish 阶段保持 OIDC-only
- [ ] 若启用 provenance，已确认当前仓库与 runner 满足 npm Trusted Publishing 的支持条件

相关长文档见：[team-release-example.md](team-release-example.md)、[release-governance-reading-path.md](release-governance-reading-path.md)
