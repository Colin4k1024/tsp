# Helm Unittest 门禁手册

本手册承接 `helm-unittest/helm-unittest` 的工程实践，用于把 Helm chart 的单元测试接入 PR、评审和发布前预检。它补的是“模板渲染后的 chart 片段是否符合预期”这一层，强调本地渲染、纯 YAML 测试和快照断言，不负责替代 Kubernetes schema、policy 或集群级验证。

## 用途/定位

`helm-unittest` 是 Helm chart 的单元测试插件，定位是用可重复执行的测试把 chart 的设计意图固化下来。它适合验证模板输出、values 组合、release 选项、局部结构和 snapshot 稳定性，重点解决的是“chart 改了之后，渲染结果是不是还是我们要的样子”。

它更像 chart 层的行为测试，而不是集群层的接收性验证。换句话说，它回答的是“模板输出是否符合预期”，不是“这个对象是否已经被 Kubernetes 接受”。

## 适用场景

- chart 模板逻辑复杂，分支多，容易因 values 或条件渲染回归。
- 需要对某个 template、模板片段或 subchart 默认值做精确断言。
- 希望在不触碰集群的情况下验证渲染结果、快照和局部结构。
- 需要把容易变化但又必须稳定的输出用 snapshot 锁定，减少人工目检。
- 团队希望对 YAML test suite 做 schema completion 和 validation，降低测试文件编写成本。

## 不适用场景

- 期待它验证最终 manifest 是否满足 Kubernetes OpenAPI schema。
- 期待它做集群 admission、server-side 语义校验或真正 apply 行为的替身。
- 期待它表达组织级安全、合规、网络隔离、镜像来源或权限控制策略。
- 期望它替代 `kubectl-server-dry-run-gates` 这类面向 API server 的接收性预检。
- 只有纯 YAML 格式 lint 需求，没有 chart 渲染行为断言需求。

## 推荐落地方式

1. 把 `helm-unittest` 放在 chart 开发和 PR 验证的前段，先用单元测试锁定渲染意图，再交给后续结构和策略门禁。
2. 先覆盖高价值模板：
   - 条件分支多的 template
   - 容易回归的 labels、annotations、env、resources、probe、volume、service 端口
   - subchart 默认值和 alias 场景
3. 用纯 YAML 编写测试套件，并对关键场景保留 snapshot；变更时通过显式更新快照确认意图。
4. 在 repo 里把 chart 单测与后续门禁分层：
   - `helm-unittest` 负责 chart 模板的本地渲染断言和 snapshot
   - `kubeconform-schema-gates` 负责渲染后 manifest 的 schema 级结构校验
   - `conftest-policy-gates` 负责结构化配置上的 policy-as-code
   - `kubectl-server-dry-run-gates` 负责把变更送到 API server 做不落盘预检
5. 如果一个问题需要知道“渲染出来像不像预期”，先用 `helm-unittest`；如果需要知道“这个对象能不能被 Kubernetes 接受”，交给后续门禁。
6. 结果应回写到 `/team-review`、`/team-release` 或 chart 维护文档，不要只停在本地测试输出。

## 边界说明

- 与 `kubeconform-schema-gates` 的边界：`helm-unittest` 看的是 chart 模板和快照，`kubeconform` 看的是渲染后的 manifest 是否符合 schema。
- 与 `conftest-policy-gates` 的边界：`helm-unittest` 验证 chart 输出是否符合设计，`conftest` 验证结构化配置是否符合 policy。
- 与 `kubectl-server-dry-run-gates` 的边界：`helm-unittest` 是纯本地测试，不访问集群；`kubectl --dry-run=server` 是把对象送到 API server 做不落盘预检。

## 最小门禁模型

- `input layer`：chart templates、values、release options、subchart inputs
- `render layer`：`helm-unittest` 本地渲染
- `assertion layer`：YAML assertions、document selector、wildcard template selection、snapshot 比对
- `decision layer`：chart owner、`qa-engineer`、`devops-engineer`、`tech-lead` 根据结果判断是否阻塞合并或发布

最小模型的关键，不是“命令有没有跑完”，而是团队是否能稳定回答：

- 这个对象是因为 chart 逻辑问题失败，还是因为 snapshot 已经过期
- 失败来自 template 分支、values 组合、subchart 作用域，还是测试写法本身
- 这次 `helm-unittest` 的结果能否代表 chart 渲染意图，还是还必须交给后续 schema / policy / server-side 门禁继续判断

## 重点检查项

- 是否覆盖了真正容易回归的模板，而不是只挑几个 happy path。
- 是否明确了 values 覆盖、release 选项和 subchart 作用域，避免测试通过但实际渲染不一致。
- snapshot 是否只用于稳定输出，避免把高度不稳定的内容也锁进基线。
- 是否能区分“预期内的快照更新”和“模板行为变化导致的意外漂移”。
- 是否对模板选择范围足够明确，避免因 wildcard 过宽而漏测或误测。
- 是否把失败结果写成可行动信息，而不是只保留一段本地测试日志。
- 是否已经把 chart 层问题和 manifest 层问题分开，避免把 `helm-unittest` 当成全能门禁。

## 反模式

- 把所有模板都做成 snapshot，最后快照只会制造噪音。
- 只依赖 `helm-unittest`，完全跳过 schema、policy 和 server-side 预检。
- 把集群相关、环境相关或权限相关的行为硬塞进本地 chart 单测。
- 频繁无审核地更新 snapshot，导致测试失去约束力。
- 把失败一律解释成“测试不稳定”，不回头检查 chart 逻辑或测试设计。

## 输出回落

- PR 阶段：把模板回归、snapshot 漂移、测试覆盖缺口和建议修正写入 review 摘要。
- 评审阶段：在 `/team-review` 中明确这是 chart 层单测结果，并标注是否还需要 schema、policy 或 server-side 门禁继续判断。
- 发布阶段：若 chart 变更仍存在高风险回归，必须回写到 `/team-release` 的阻塞项、风险项或修复待办中。
- 治理阶段：把稳定的测试模式、snapshot 更新约定和 chart owner 责任沉淀到团队 runbook。

## 许可证与使用边界

- `helm-unittest/helm-unittest` 采用 MIT license。
- `helm-unittest` 是 Helm plugin，可通过 `helm` CLI 使用，也可以通过容器化方式运行；它属于 Helm 的插件扩展，而不是 Helm core。
- 它只验证 chart 的本地渲染结果，不负责创建资源，也不替代 API server 的接收性验证。
- 它适合做 chart 层的回归测试，不适合单独作为发布放行的最终证明。

## 参考来源

- [helm-unittest/helm-unittest](https://github.com/helm-unittest/helm-unittest)
- [The Helm Plugins Guide](https://helm.sh/docs/topics/plugins/)
- [kubectl apply | Kubernetes](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_apply)
- [kubeconform-schema-gates.md](kubeconform-schema-gates.md)
- [conftest-policy-gates.md](conftest-policy-gates.md)
- [kubectl-server-dry-run-gates.md](kubectl-server-dry-run-gates.md)
