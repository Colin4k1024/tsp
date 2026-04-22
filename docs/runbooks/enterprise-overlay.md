# Enterprise Overlay

公开仓 `master` 只分发通用 Team Skills Platform 能力。企业内部 skills、rules、runbook、toolkits 与 examples 已从公开仓剥离，不再作为公开 profile 的内建资产。

## 公开仓的默认行为

- `core`、`developer`、`security`、`research`、`full`、`team` 都只包含公开能力
- `team` 是公开的协作 profile，不再隐含企业 rules 或企业 docs
- 未显式指定 overlay 时，安装流程不会尝试解析任何企业能力

## 如何叠加企业能力

企业内部能力通过私有 npm overlay 包提供，而不是通过公开仓分支或公开 tarball 分发。

```bash
node scripts/install-apply.js --profile team --target claude --overlay enterprise
```

也可以在 `ecc-install.json` 中声明：

```json
{
  "version": 1,
  "profile": "team",
  "target": "claude",
  "overlays": ["enterprise"]
}
```

## 私有交付约定

- 私有镜像仓库：`harness-engineering-enterprise`
- 私有长期分支：`enterprise`
- 私有 overlay 包：`@<private-scope>/tsp-enterprise-overlay`

如果你在公开仓环境里请求 `--overlay enterprise`，但没有安装对应私有包，安装器会明确报 overlay 缺失，而不是回退到半安装状态。
