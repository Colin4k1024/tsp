# Spring Boot

## 默认实践

- 配置、依赖注入、异常处理和接口返回风格保持一致。
- 边界层负责协议与参数校验，业务层负责真正的业务判断。
- 长事务、重查询和外部调用要显式说明超时、重试和失败路径。
- 企业内部应用默认复用集团认可的中间件、运行环境和平台能力；偏离基线时要补 ADR。
- 涉及缓存、数据库和高可用设计时，分别补看 [database.md](database.md)、[redis.md](redis.md) 与 [../common/enterprise-architecture-governance.md](../common/enterprise-architecture-governance.md)。

## 交付关注点

- 新接口要有契约说明和兼容性说明。
- 配置变更要同步发布与回滚注意事项。
