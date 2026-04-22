# Quality Gates Taxonomy

## 来源

融合 GSD gates 分类法与 Team Skills Platform 现有质量门禁（前端门禁、handoff 契约、放行机制），
统一为四类 gate，使所有角色和 `/team-*` 命令使用一致的门禁语言。

## 分类

### Pre-flight Gate（预飞检查）

在进入某个阶段**之前**必须满足的条件。不满足则不允许进入。

| 阶段入口 | 典型检查项 |
|----------|-----------|
| `/team-plan` | intake 完成、PRD 存在、关键待确认项已收敛 |
| `/team-execute` | plan 完成、handoff 状态为 `handoff-ready`、接口契约已锁定 |
| `/team-review` | 代码自测通过、execute-log 已写入、UI review checklist（若前端）已提交 |
| `/team-release` | 测试计划执行完毕、放行建议为"建议放行"、deployment-context 已就绪 |

### Revision Gate（修订门禁）

发现问题后**要求修改**但不阻塞整条链路的检查。

- 代码 review 中的 MEDIUM 级别问题
- 文档不完整但不影响理解的补充项
- 非阻塞的前端体验优化建议
- 非阻塞的性能改进建议

处理方式：标记为待修改、指定 owner，在当前阶段内或下一迭代中解决。

### Escalation Gate（升级门禁）

发现的问题超出当前角色决策范围，需要**升级给 tech-lead 或更高层级**。

- 需求范围、优先级或时间目标发生冲突
- 两个及以上角色对方案或质量结论不一致
- 跨团队依赖或外部阻塞
- 安全漏洞或合规风险超出预设等级
- 线上故障影响范围扩大

升级信息见 `rules/escalation-policy.md`。

### Abort Gate（中止门禁）

问题严重到必须**停止当前流程**，不允许继续推进。

- 发现 CRITICAL 级别安全漏洞（合并前必须修复）
- 发现数据丢失或不可逆损害风险
- 关键依赖不可用且无替代方案
- 测试结果与需求严重不符
- 前端一票否决项命中（见 `rules/frontend-quality-gates.md`）

触发 abort 后：
1. 立即停止当前流程
2. 通知 `tech-lead` 和相关角色
3. 记录 abort 原因和影响面
4. 确定恢复路径后才可重新启动

## 与现有规则的映射

| 现有规则 | 对应 Gate 类型 |
|---------|---------------|
| `handoff-contract.md` 中的 `就绪状态: blocked` | Abort Gate |
| `handoff-contract.md` 中的 `就绪状态: not-ready` | Pre-flight Gate |
| `frontend-quality-gates.md` 中的一票否决项 | Abort Gate |
| `frontend-quality-gates.md` 中的 `/team-execute` 门禁 | Pre-flight Gate |
| `escalation-policy.md` 中的升级场景 | Escalation Gate |
| 代码 review 中的 CRITICAL/HIGH | Abort Gate |
| 代码 review 中的 MEDIUM | Revision Gate |
| 代码 review 中的 LOW | 信息提示（不构成 gate） |

## 使用方式

### 在 `/team-*` 命令中

每个 `/team-*` 命令应在标准输出中包含门禁检查结果：

```
## 门禁状态
- Pre-flight: ✅ 全部通过 / ❌ {未满足项}
- Revision: {N} 项待修改
- Escalation: {N} 项需升级
- Abort: ✅ 无阻塞 / 🛑 {阻塞项}
```

### 在 Handoff 中

handoff 的 `就绪状态` 字段与 gate 的关系：

| 就绪状态 | Gate 含义 |
|---------|----------|
| `handoff-ready` | Pre-flight 全部通过、无 Abort |
| `ready-for-review` | Pre-flight 通过但有 Revision 待处理 |
| `blocked` | 存在 Abort Gate 或未解决的 Escalation |
| `not-ready` | Pre-flight 未通过 |
