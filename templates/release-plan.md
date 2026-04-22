# 发布方案模板

参考：发布与回滚写法可结合 [../docs/runbooks/devops-engineer-daily-operations.md](../docs/runbooks/devops-engineer-daily-operations.md)、[../docs/runbooks/canary-staging-release-walkthrough.md](../docs/runbooks/canary-staging-release-walkthrough.md) 与 [../docs/runbooks/release-rollback-recovery-walkthrough.md](../docs/runbooks/release-rollback-recovery-walkthrough.md)。

## 1. 发布信息

- 发布目标：
- 环境：
- 计划窗口：
- 发布负责人：
- 放行人 / 值守人：

## 2. 变更与风险

- 应用变更：
- 配置变更：
- 数据变更：
- 依赖系统 / 影响范围：
- 高风险点：

## 3. 执行步骤

- 发布前检查：
- 执行步骤：
- 暂停点 / Go-No-Go 判断点：
- 若涉及前端：静态资源风险 / 关键页面 smoke / 性能基线检查：

## 4. 验证与监控

- 发布后检查：
- 关键监控指标：
- 告警阈值 / 升级路径：
- 观察窗口：

## 4.1 文档与实现一致性（建议填写）

- 本次变更已同步的 artifacts：
- API / 事件 / 权限是否与实现一致：是 / 否
- 需要在 `docs/memory/` 追加的记录：

## 5. 回滚方案

- 触发条件：
- 回滚步骤：
- 数据 / 配置回退说明：
- 回滚负责人：

## 6. 企业内控补充（按需填写，仅企业内部应用填写）

- 应用等级：
- 技术架构等级：
- 资源隔离要求：
- 关键组件 / 平台偏离：
- 资产文档入口：

## 7. 放行结论

- 放行结论：可放行 / 有条件放行 / 不建议放行
- 前提条件：
- 后续观察项：
- 文档追溯状态：完整 / 待补齐
