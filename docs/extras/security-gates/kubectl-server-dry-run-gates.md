# Kubectl Server Dry-Run 门禁手册

本手册承接 Kubernetes 官方关于 `kubectl apply --server-side [--dry-run=server]`、server-side apply、字段管理和 server-side validation 的工程实践，用于把“先把变更送到 API server 做一次不落盘预检”纳入 PR、评审和发布前检查。它是 reference-only 的静态说明，不替代集群内真实发布，也不替代 schema、policy 或 admission 强制门禁。

## 用途/定位

`kubectl --dry-run=server` 的核心价值，是让变更在不真正持久化的前提下，走一遍 API server 能理解的接收流程。对 `kubectl apply` 而言，这意味着它不仅看本地文件，还会把请求交给 server 侧做处理；配合 `--server-side` 使用时，还会进入 server-side apply 的字段管理、冲突检测和 validation 路径。

这个门禁适合回答的是：

- 这个变更在目标集群的 API server 上能不能被接受
- server-side apply 视角下会不会发生字段所有权冲突
- 目标集群对该对象的 server-side validation 是否能通过
- 这次变更在不落盘的情况下，会暴露出哪些默认值、字段管理或权限问题

它不负责判断“这是不是团队允许的配置”，也不负责判断“这是不是最优的安全姿态”。它关注的是 server 端能否接住这次 declarative intent。

## 适用场景

- 变更会通过 `kubectl apply`、`kubectl apply --server-side`、GitOps 预处理或类似流程进入集群。
- 团队希望在合并前尽早发现对象在目标集群上不可接受的问题，例如字段冲突、校验失败、权限不足或资源定义不兼容。
- 团队已经有稳定的 API server 连接、明确的 kubeconfig、可控的 RBAC，以及清晰的目标集群版本。
- 团队需要把“本地渲染通过”与“server 端真的能接受”分开验证，避免只在文件级通过、上线后才失败。
- 团队希望补足离线 schema 校验无法覆盖的 server-side 行为，例如字段管理冲突和 server-side validation 的实际结果。

## 不适用场景

- 期望它替代 `kubeconform-schema-gates` 的 OpenAPI / JSON Schema 结构校验。
- 期望它替代 `conftest-policy-gates` 的 Rego policy 规则判断。
- 期望它替代 `policy-controller-gates` 在集群 admission 层的强制执行。
- 没有可访问的目标 API server，却想把它当成纯本地 lint 工具。
- 团队还没有统一的 field manager、目标集群版本和 RBAC 约定，导致 dry-run 结果不稳定。
- 需要判断镜像漏洞、SBOM、签名、provenance、网络安全或运行时策略时。

## 推荐落地方式

1. 把 `kubectl apply --server-side --dry-run=server` 放在“渲染后、落盘前”的预检层，优先检查目标集群是否愿意接受这次声明式变更。
2. 统一使用稳定的 field manager，并将其和流水线、环境或控制器身份对齐，避免不同执行主体混用同一名字。
3. 只把它当成“server 接受性预检”，不要把它当成唯一门禁。
4. 将门禁分层：
   - `kubeconform-schema-gates` 负责 manifest 的 schema 结构校验
   - `kubectl-server-dry-run-gates` 负责把变更送到 API server 做不落盘预检，观察 server-side apply、validation 和冲突结果
   - `conftest-policy-gates` 负责配置策略、团队规则和 policy-as-code
   - `policy-controller-gates` 负责在集群 admission 层强制执行已确认策略
5. 对于可能存在字段冲突的资源，先用 dry-run 暴露冲突，再决定是调整 manifest、切换 field manager，还是回到上游 owner 协调字段所有权。
6. 把结果回写到评审或发布结论，而不是把 dry-run 当成一次“只是看看”的临时命令。

## 最小门禁模型

- `input layer`：渲染后的 Kubernetes manifests、Helm 输出、kustomize 输出或直接的 YAML / JSON 资源定义
- `server preflight layer`：`kubectl apply --server-side --dry-run=server`，必要时配合 `--validate=strict`
- `server behavior layer`：API server 的对象接收、server-side validation、defaulting、field management 和冲突检测
- `decision layer`：`qa-engineer`、`devops-engineer`、`tech-lead` 根据结果判断是否阻塞合并或发布

最小模型的关键，不是“命令有没有跑完”，而是团队是否能稳定回答：

- 这个对象是因为 schema 问题失败，还是因为 server-side 语义问题失败
- 失败来自字段冲突、校验失败，还是 RBAC / 访问路径问题
- 这次 dry-run 的结果能否代表目标集群当前真实行为

## 重点检查项

- 是否明确使用了 `--server-side`，避免把 client-side 习惯误以为是 server-side 预检
- 是否把 `--dry-run=server` 和 `--validate=strict` 的意义区分清楚，避免只做“看起来像校验”的假门禁
- 是否固定了目标集群、kubeconfig、命名空间和 field manager，避免结果受隐式上下文影响
- 是否检查字段冲突，尤其是被其他管理者或控制器接管过的字段
- 是否关注 server-side validation 的真实结果，而不是只看本地文件是否能被解析
- 是否把 warning、conflict 和 validation failure 分别记录，避免把所有失败都混成“kubectl 不好使”
- 是否识别出这类门禁依赖 API server 在线可达，不能拿它替代离线的 schema / policy 检查
- 是否在目标集群版本升级后重新验证 dry-run 行为，因为 server-side 行为会随集群能力变化

## 反模式

- 把 `kubectl --dry-run=server` 当成离线 YAML linter，用来替代 schema 校验或策略审查。
- 只在开发机本地跑一次，就把结果当成所有环境都成立的结论。
- field manager 命名随人、随流水线、随仓库变化，导致字段所有权判断失去稳定性。
- 把 dry-run 的成功理解成“资源一定能稳定运行”，忽略 admission、控制器回调和运行时依赖。
- 看到冲突就直接加 `--force-conflicts`，却没有先确认字段所有权和变更边界。
- 不区分 `dry-run=client` 和 `dry-run=server`，把“本地预览”误当成“server 接受性验证”。

## 输出回落

- PR 阶段：把 server-side validation failure、field conflict、权限不足和建议修正写入 review 摘要。
- 评审阶段：在 `/team-review` 中明确这是 API server 侧预检结果，和 schema / policy / admission 结果分开记录。
- 发布阶段：若 dry-run 暴露出关键对象不可接受，必须回写到 `/team-release` 的阻塞项、风险项或修复待办中。
- 治理阶段：把目标集群版本、field manager 约定、RBAC 前提和例外流程沉淀到团队 runbook 中。

## 许可证与使用边界

- Kubernetes 官方文档按 CC BY 4.0 许可分发；本手册仅做工程归纳，不复制大段原文。
- `kubectl --dry-run=server` 依赖目标 API server 在线可达，也依赖目标集群当前的 validation、defaulting 和 field management 行为。
- 官方文档说明，server-side apply 以 patch 语义工作，且需要合适的权限；对既有资源需要 `patch` 权限，对新建资源还需要 `create` 权限。
- 官方文档也说明，`kubectl apply --server-side` 可以与 `--dry-run=server` 一起使用，并支持 `--field-manager`；当 `--validate=strict` 可用时，它会尝试使用 server-side validation，若集群不支持则可能回退到较弱的客户端校验。
- 这意味着它是“目标集群接受性预检”，不是“最终放行证明”，更不是 admission 强制。

## 参考来源

- [kubectl apply | Kubernetes](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_apply/)
- [Server-Side Apply | Kubernetes](https://kubernetes.io/docs/reference/using-api/server-side-apply/)
- [kubectl Usage Conventions | Kubernetes](https://kubernetes.io/docs/reference/kubectl/conventions/)
- [kubeconform-schema-gates.md](kubeconform-schema-gates.md)
- [conftest-policy-gates.md](conftest-policy-gates.md)
- [policy-controller-gates.md](policy-controller-gates.md)
