# TSP Grok Integration

## 目录结构

```
.grok/
├── matrix/
│   └── capability-matrix.md    # 能力矩阵 (native/adapted/deferred/unsupported)
├── contracts/
│   └── provenance.md           # 生成物契约与命名规范
└── plugin.json                 # Grok 插件 manifest (位于 .grok-plugin/)
```

## 阶段状态

| 阶段 | 状态 | 门禁 |
|------|------|------|
| Phase 0 | 进行中 | 文档 freshness ✓, 能力矩阵 ✓, 契约定义 ✓ |
| Phase 1A | 待开始 | Grok 插件机制验证 |
| Phase 1B | 待开始 | TSP 最小 PoC |
| Phase 2 | 待开始 | 生成式适配层 |
| Phase 3 | 待开始 | Hook 分级迁移 |
| Phase 4 | 待开始 | 状态与运行时 |
| Phase 5 | 待开始 | 发布与硬化 |

## 参考

- Issue: [#9 [Feature] grokbuild](https://github.com/Colin4k1024/tsp/issues/9)
- TSP Version: 2.5.5
- Branch: `feature/grokbuild`
