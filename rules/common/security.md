# Common Security

## 默认检查点

- 认证、授权、输入处理、敏感数据、依赖来源、日志暴露。
- 依赖升级、新增包、漏洞等级和许可证变化要能被追溯。
- 仓库级 secret scanning 若已启用，也要能追溯新增命中、baseline 记录、误报 triage 和泄漏后的旋转/撤销动作。
- 代码级语义安全扫描结果若已启用，也要能追溯其 triage 结论和阻塞策略。
- GitHub Actions token 权限基线若已启用，也要能追溯默认 workflow 权限、job 级 `permissions`、例外 scope 和收敛结论。
- IaC 安全与合规预检若已启用，也要能追溯其规则来源、命中项、例外处理和是否阻塞当前变更。
- Kubernetes manifest schema 校验若已启用，也要能追溯目标版本、schema 来源、CRD 覆盖范围和被跳过的资源类型。
- Kubernetes 原生策略引擎若已启用，也要能追溯策略范围、`Audit/Enforce` 状态、background scan 结果、policy reports 和例外处理。
- 容器镜像、仓库文件系统和 IaC 扫描结果若已启用，也要能追溯其 triage 结论和放行策略。
- 仓库级供应链基线检查若已启用，也要能追溯其 triage 结论、整改计划和是否阻塞当前变更。
- GitHub Actions workflow 级语法 / 结构 lint 若已启用，也要能追溯其命中项、修复结论和是否阻塞合并。
- GitHub Actions workflow 安全审计若已启用，也要能追溯其 triage 结论、误报处理和是否阻塞当前变更。
- GitHub Actions runner 的 egress hardening 若已启用，也要能追溯 allowlist、异常访问、例外处理和运行时告警结论。
- 配置策略的 policy-as-code 预检若已启用，也要能追溯其规则来源、例外条件、失败命中和发布前处置结论。
- 构建产物的 SBOM 若已启用，也要能追溯其生成时间、对应版本和归档位置。
- 构建产物 provenance attestation 若已启用，也要能追溯其生成时间、对应产物、归档位置和发布记录回链。
- attestation 的 predicate、schema 和 evidence model 若已启用，也要能追溯其版本、字段语义、证据来源和适用范围。
- 构建产物或镜像签名若已启用，也要能追溯其签名范围、验签入口和发布记录回链。
- provenance / attestation 的独立验证若已启用，也要能追溯其验证输入、验证结果和失败处置策略。
- 集群 admission 层的策略强制若已启用，也要能追溯其策略范围、拒绝原因、例外处理和回退方案。
- 基于执行证据的高级 policy gate 若已启用，也要能追溯其 evidence 来源、policy 规则、评估结果、triage 结论和例外处理。
- 配置与示例中不放真实密钥、真实 endpoint 或私人账号信息。
- 发布前明确回滚路径和最小暴露面。

## 常见风险

- 把“内部系统”当成不需要鉴权的借口。
- 把用户输入直接进入 SQL、命令或模板渲染。
- 在日志、错误栈或示例中泄漏 token、cookie、邮件、手机号等敏感信息。
