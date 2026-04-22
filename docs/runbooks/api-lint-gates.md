# API Lint 门禁手册

本手册承接 `stoplightio/spectral` 的工程实践，用于把 OpenAPI / AsyncAPI 规范从“口头约定”升级为可执行的 lint ruleset。它是接口设计与契约治理的补充，不替代 `api-contract` 或架构评审。

## 适用场景

- 团队以 OpenAPI 或 AsyncAPI 维护接口文档，希望对命名、错误响应、分页、鉴权等规则做统一检查。
- 仓库已经有 API spec 文件，但 review 还在靠人工发现风格不一致或漏填字段。
- 需要把“API 规范应该怎样写”沉淀成能重复执行的 ruleset。

## 不适用场景

- 当前 API 规格尚不稳定，连基础字段和输出格式都在快速漂移。
- 团队还没统一基本 API 设计原则，却急着上大量 lint 规则。
- 希望用 lint 结果替代人工设计评审或兼容性判断。

## 推荐落地方式

1. 先把规则分层：
   - `baseline rules`：必须满足的结构性要求，例如 operationId、response、schema 引用、错误响应
   - `style rules`：命名、描述、tag、分页约定等风格规则
2. 第一阶段只启用高信号规则，先压住明显缺陷，不要一开始就把所有风格问题都做成阻塞项。
3. 本地和 CI 使用同一套 ruleset，保证开发者能复现 lint 结果。
4. 先 lint，再做 breaking change diff；否则候选 spec 本身不稳定，diff 结论也会失真。
5. lint 结果要回写到 API 契约和 review 结论里，而不是只留在命令行输出。

## 最小门禁模型

- `input layer`：稳定的 OpenAPI / AsyncAPI 文件
- `lint layer`：ruleset 输出错误、警告和建议
- `decision layer`：`architect`、`backend-engineer`、`qa-engineer`、`tech-lead` 判断哪些规则阻塞、哪些暂时接受

工具负责指出偏差，团队负责定义规则和接受风险。

## 推荐优先检查项

- operationId、summary、description、tags 是否完整
- 错误响应、鉴权要求、分页参数是否缺失
- schema 引用、命名约定、枚举描述是否一致
- 是否存在空 response schema、未定义错误码、含糊字段名或重复 path 设计

## 反模式

- 还没对齐 API 设计原则，就先把 lint 全面阻塞。
- 本地和 CI 的 ruleset 不一致，导致 PR 报错无法复现。
- 用 lint 替代设计 review，结果结构整齐但语义仍然有问题。
- 只看 warning 数量，不分析哪些规则真正影响协作和兼容性。

## 输出回落

- 设计阶段：把规则偏差和例外说明回写到 [api-contract.md](../../templates/api-contract.md) 或方案说明。
- 评审阶段：在 `/team-review` 或 `/code-review` 中明确哪些 lint 问题阻塞、哪些属于暂时接受的风格偏差。
- 发布阶段：若 lint 规则属于正式门禁，结果同步到 `/team-release` 的检查项或放行前提。

## 参考来源

- [stoplightio/spectral](https://github.com/stoplightio/spectral)
