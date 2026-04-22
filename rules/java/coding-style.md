# Java Coding Style

## 分层原则

- controller、service、repository、adapter 各自职责清晰。
- 不把事务、校验、映射、业务判断混在同一层。
- 领域对象和持久化对象的边界要清楚，避免一路透传 entity。

## 可维护性

- 命名反映业务语义，不滥用缩写。
- 常量、错误码、日志关键字和异常语义保持统一，不让同类问题在不同模块出现不同表达。
- 抛错和返回值策略一致，避免同类失败在不同层写不同约定。
- 复杂分支优先拆方法和对象，而不是堆叠 if/else。
- 企业内部项目补充参考 [enterprise-java.md](enterprise-java.md)。
