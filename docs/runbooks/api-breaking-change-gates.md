# API Breaking Change 门禁手册

本手册承接 `OpenAPITools/openapi-diff` 的工程实践，用于把 OpenAPI 契约变更从“人工肉眼比对”升级为可执行的 breaking change 检查。它是 API 契约治理和发布前验证的补充，不替代 `api-contract` 或 `/team-review` 的人工判断。

## 适用场景

- 接口契约以 OpenAPI 形式维护，且需要评估本次变更是否破坏向后兼容。
- 发布前需要明确区分 `breaking / non-breaking / unclassified` 风险。
- 多团队共享 API，不能只靠 reviewer 凭记忆判断兼容性。

## 不适用场景

- 当前接口尚未形成可比对的 OpenAPI 基线文件。
- 变更只停留在实现层，没有对外契约变化。
- 团队没有清晰的版本或兼容性策略，diff 结果即使出来也没人负责解释。

## 推荐落地方式

1. 先锁定比较对象：`baseline spec` 与 `candidate spec`，不要拿不完整或不同环境生成的产物直接互比。
2. 在做 diff 前，优先用 [api-lint-gates.md](api-lint-gates.md) 确认 spec 本身结构稳定；否则 diff 容易混入低质量文档噪音。
3. 在方案或实现阶段先做一次预比对，尽早发现潜在 breaking change，不要等到发布前才第一次看结果。
4. 对 diff 结果分类处理：
   - 明确 breaking：必须改设计、升版本、做兼容层，或由 `tech-lead` 显式接受风险
   - 明确非 breaking：记录结论，继续后续测试和发布
   - 无法自动判断：回到 `architect` / `backend-engineer` 做人工契约评审
5. 把 diff 结论回写到 `API Contract`、`/team-review` 或 `/team-release`，不要让结果停留在 CI 日志里。

## 最小门禁模型

- `input layer`：稳定的基线 OpenAPI 文件 + 当前候选 OpenAPI 文件
- `diff layer`：生成 breaking / changed / compatible 结果
- `decision layer`：`architect`、`backend-engineer`、`qa-engineer`、`tech-lead` 判断是否阻塞

这三层必须分开：工具给出“发现”，团队给出“结论”。

## 重点检查项

- 删除 path、operation、response field、enum 值或 required 字段
- 修改字段类型、约束、状态码语义或鉴权要求
- 新增字段但改变默认行为、分页语义或错误处理方式
- 文档中写着兼容，结果 diff 却显示 breaking

## 反模式

- 用实现代码或接口联调结果替代契约 diff。
- 基线文件不稳定，却把 diff 结果当正式阻塞门禁。
- 工具报告 breaking，团队却不做任何版本/兼容性说明。
- 只看“有无 diff”，不解释 diff 为什么重要、影响哪些调用方。

## 输出回落

- 设计阶段：把兼容性结论回写到 [api-contract.md](../../templates/api-contract.md) 的兼容性部分。
- 评审阶段：在 `/team-review` 中记录 breaking change 是否阻塞、影响哪些调用方、需要哪些补救动作。
- 发布阶段：若 breaking risk 仍存在，必须同步到 `/team-release` 的放行结论或观察项。

## 参考来源

- [OpenAPITools/openapi-diff](https://github.com/OpenAPITools/openapi-diff)
