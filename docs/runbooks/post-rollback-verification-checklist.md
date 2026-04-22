---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 回滚后验证检查清单

本文用于回滚完成后的快速验证，避免“服务恢复了”就直接结束。

## 1. 服务状态

- [ ] 关键服务已恢复可用
- [ ] 关键页面或接口已可访问
- [ ] 依赖服务状态正常

## 2. 数据与配置

- [ ] 数据一致性已抽样验证
- [ ] 配置与开关已确认回退到目标状态
- [ ] 新旧版本混合状态已排除

## 3. 指标与观察

- [ ] 错误率回落到预期区间
- [ ] 耗时或吞吐恢复到基线
- [ ] 用户反馈或监控告警已明显收敛

## 4. 后续动作

- [ ] 事故记录已更新
- [ ] 后续修复任务已登记
- [ ] 是否需要继续观察已明确

相关长文档见：[release-rollback-recovery-walkthrough.md](release-rollback-recovery-walkthrough.md)、[production-incident-response-walkthrough.md](production-incident-response-walkthrough.md)
