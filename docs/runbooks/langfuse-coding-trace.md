# Langfuse 编码追踪手册

本手册承接原 `langfuse-coding-trace` custom overlay。它现在是编码、QA、发布流程的可观测性补充 runbook，不再作为正式 `skills/` 安装入口。

如果你想先判断什么时候该启用 Langfuse、记录哪些 trace 和 span，以及如何回写主链，继续看 [langfuse-and-observability-integration-guide.md](langfuse-and-observability-integration-guide.md)。

## 适用场景

- 当前任务已经存在编码、QA 或发布执行链，需要补充 Langfuse Trace / Span 记录。
- 追踪失败不能阻塞主流程。

## 前置条件

需要在执行环境中提供以下变量；缺失时直接声明“未开启 Langfuse 追踪”，主流程继续：

- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_HOST`

## 执行入口

脚本位置：

```bash
node scripts/langfuse-trace.js
```

主链阶段可按需调用：

- `trace-start`
- `span-start`
- `span-end`
- `trace-end`

## 输出回落

- 在 `/team-execute` 中记录是否开启追踪、trace 名称、关键 span 结果。
- 若发布链使用，也同步回落到 `/team-release` 的 `可选领域扩展执行记录`。

## 使用约定

1. Trace / Span 名称尽量和 `/team-*` 阶段或实际 skill 名保持一致。
2. 追踪只是附加证据，不能替代实现说明、自测结论、QA 结果或放行结论。
3. 若任务需要对外审计，在输出中显式说明“已开启 / 未开启 Langfuse 追踪”。
