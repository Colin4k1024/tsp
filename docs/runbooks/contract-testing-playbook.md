# Contract Testing 手册

本手册承接 `pact-foundation/pact-jvm` 的工程实践，用于把 consumer/provider contract testing 接入 API 设计、实现验证和发布准备。它补的是“调用方与提供方对同一接口的真实约定是否一致”这一层，不替代 `api-contract`、`api-breaking-change-gates`、`api-lint-gates` 或人工架构评审。

配套实践可继续看 [api-mocking-strategy-and-lifecycle-guide.md](api-mocking-strategy-and-lifecycle-guide.md)、[frontend-backend-integration-acceptance-checklist.md](frontend-backend-integration-acceptance-checklist.md) 与 [consumer-driven-contract-testing-with-mock-alignment.md](consumer-driven-contract-testing-with-mock-alignment.md)。

## 适用场景

- 多服务协作时，consumer 和 provider 不同团队开发，接口语义容易口头对齐、代码上失配。
- 想在联调前就提前暴露请求字段、响应字段、状态码、鉴权或行为约定的偏差。
- 需要把“这个接口对调用方到底意味着什么”沉淀成可执行、可回放、可验证的契约。
- 接口实现变化频繁，但调用方又依赖稳定行为，适合用契约测试兜住协作边界。

## 不适用场景

- 当前接口契约还没稳定，连基本请求响应形状都在频繁漂移。
- 只有单体内局部方法调用，没有明确的 consumer/provider 边界。
- 团队没有人愿意维护 pact 文件、provider verification 或失败 triage。
- 期望 contract testing 替代 API 设计、breaking change 检查或系统级集成测试。

## 推荐落地方式

1. 先明确要覆盖的边界，不要一上来把所有接口都做成契约测试。
2. 第一阶段先挑最有价值的调用链：
   - 高价值 consumer
   - 经常联调失败的 provider
   - 容易回归的鉴权、分页、错误处理和字段映射
3. 先让 consumer 产出稳定 pact，再让 provider 做 verification，不要反过来用 provider 的实现细节去“猜” consumer 约定。
4. 将 contract testing 与现有 API 链路分层：
   - `api-contract` 负责接口语义与文档约定
   - `api-lint-gates` 负责 spec 结构和风格约束
   - `api-breaking-change-gates` 负责向后兼容性检查
   - `contract-testing-playbook` 负责 consumer/provider 的运行时契约验证
5. 如果团队有发布节奏，先把契约验证放进 PR 或 pre-merge 阶段，再决定是否把 provider verification 也纳入 release gate。
6. 结果必须回写到 `/team-review`、`/team-release` 或 `api-contract`，不要只停在某个模块测试日志里。

## 最小门禁模型

- `contract layer`：consumer 产出的 pact 文件或契约描述
- `mock layer`：consumer 测试时使用的 mock service 或 stub
- `verification layer`：provider 对 pact 的验证结果
- `decision layer`：`architect`、`backend-engineer`、`qa-engineer`、`tech-lead` 判断是否阻塞

工具负责把交互录下来，团队负责判断这些交互是不是产品真正需要的约定。

## 重点检查项

- consumer 是否只表达真正依赖的行为，而不是把内部实现细节也固化进 pact
- provider verification 是否覆盖了关键路径、错误响应和边界条件
- pact 文件是否稳定、可回放、可版本化，而不是每次跑出来都不一样
- 当接口变化时，是否能清楚区分“consumer 需要改”还是“provider 需要兼容”
- 失败结果是否能定位到具体交互，而不是只看到“verification failed”

## 反模式

- 把 provider 的实现细节硬塞进 consumer pact，导致契约变成伪测试。
- 只给 happy path 写 pact，错误响应和边界态完全没覆盖。
- pact 文件一变就全量重写，没有版本意识，也没有变更解释。
- 只有 consumer 端跑了 mock，provider 端从未做 verification。
- 契约测试失败后没人 triage，最后团队默认忽略这条门禁。

## 输出回落

- 设计阶段：把需要稳定的请求响应、错误码和行为约定回写到 [api-contract.md](../../templates/api-contract.md) 或接口说明中。
- 评审阶段：在 `/team-review` 中说明哪些 pact 变更是预期内的，哪些需要 provider 兼容或 consumer 回滚。
- 发布阶段：若契约验证仍存在未关闭的高风险问题，必须同步到 `/team-release` 的放行结论或观察项。

## 许可证与使用边界

- `pact-foundation/pact-jvm` 采用 Apache-2.0。
- 引入前应确认 JVM 版本、构建工具、provider verification 运行环境，以及团队是否有维护 pact 资产的责任人。

## 参考来源

- [pact-foundation/pact-jvm](https://github.com/pact-foundation/pact-jvm)
- [api-contract.md](../../templates/api-contract.md)
- [api-breaking-change-gates.md](api-breaking-change-gates.md)
- [api-lint-gates.md](api-lint-gates.md)
