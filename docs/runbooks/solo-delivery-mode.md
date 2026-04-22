---
version: "0.1.0"
status: draft
created: 2026-04-03
updated: 2026-04-03
owner: 工程团队
---

# Solo Delivery Mode

本文定义 Team Skills Platform 在“一人从需求到上线”场景下的运行方式。它不是 Team Mode 的替代品，而是把多人协作链路压缩成单人可执行的闭环。

## 1. 核心原则

- solo mode 压缩的是角色数量，不是治理门禁
- 一个人可以同时承担 `tech-lead`、研发、QA、DevOps 职责
- 需求澄清、方案收口、验证、发布准备、观察窗口、上线后收口都不能跳过
- 不能因为没有多人 handoff，就把关键决策只留在对话里

一句话判断：

- Team Mode：多人分工 + 结构化 handoff
- Solo Mode：单人承接 + 同样的关键事实落盘

## 2. 适用场景

适合使用 solo mode 的典型场景：

- 单个开发者独立交付一个中小需求
- 需要快速闭环，但仍然要保留发布与回滚治理
- 只有一个主要实施人，但希望以后还能被别人接手

不适合直接使用 solo mode 的场景：

- 多团队依赖明显
- 需求边界仍然高度不确定
- 发布风险高，必须多人共同决策

这类场景应继续走 Team Mode，或至少在关键节点升级为多人评审。

## 3. Solo Mode 不省略什么

solo mode 下可以把角色压缩到一个人，但下面这些 gate 不能省略：

1. intake gate：目标、范围、不做项、约束、成功标准清楚
2. plan gate：实现边界、关键设计、风险和验收路径清楚
3. execute gate：实现前先知道怎么验证，不允许边做边猜
4. review gate：至少完成自测、回归判断和上线风险判断
5. release gate：有发布入口、回滚路径、观察窗口和监控项
6. closeout gate：观察窗口结束后有最终结论、遗留项和下一步

如果其中任一项答不上来，就说明 solo mode 不是“更快”，而是“跳步骤”。

## 4. 角色压缩方式

推荐把单人职责映射成下面四个视角，而不是假装只存在“开发”：

| 视角 | 你要回答的问题 |
|------|----------------|
| `tech-lead` | 为什么做、做多少、什么算完成、有什么风险 |
| `engineer` | 具体怎么实现、怎么验证、边界怎么控制 |
| `qa` | 哪些行为必须测、哪些风险可接受、什么情况下不放行 |
| `devops` | 怎么发布、怎么回滚、观察什么、何时算上线稳定 |

实际写文档时，不要求拆成 4 份 handoff，但要求这些视角都能在主链产物里找到。

## 5. 推荐最短主链

solo mode 的推荐路径是：

1. `intake`
2. `plan`
3. `execute`
4. `review`
5. `release`
6. `closeout`

对应最小动作：

| 阶段 | 最少要回答的事 |
|------|----------------|
| intake | 做什么、不做什么、成功标准是什么 |
| plan | 方案怎么做、风险是什么、如何验证 |
| execute | 改了什么、做了哪些验证、还有什么未完成 |
| review | 是否达到可上线质量、剩余风险是否可接受 |
| release | 如何发布、如何回滚、观察窗口看什么 |
| closeout | 观察窗口结果、最终验收、遗留项和 lessons learned |

## 6. 推荐产物

如果项目仓库已经按主链落盘，solo mode 建议至少保留这些文件：

- `docs/artifacts/.../prd.md`
- `docs/artifacts/.../delivery-plan.md`
- `docs/artifacts/.../execute-log.md`
- `docs/artifacts/.../test-plan.md` 或等价验证记录
- `docs/artifacts/.../release-plan.md`
- `docs/artifacts/.../closeout-summary.md`

其中 `closeout-summary.md` 负责承接发布后的观察窗口和最终状态，不要让这一步停留在聊天记录里。

## 7. Release 后的观察窗口

solo mode 最容易漏掉的是“上线成功”和“上线稳定”之间的区别。

建议把观察窗口单独写清楚：

- 起止时间
- 观察指标
- 告警阈值
- 人工检查点
- 升级/回滚条件

closeout 只能在观察窗口结束后做。  
如果观察窗口未结束，只能说“已发布”，不能说“已收口”。

## 8. Closeout 要产出什么

closeout 阶段至少回答四个问题：

1. 本次发布最终是否成立
2. 观察窗口内是否出现异常，以及如何处理
3. 哪些遗留项要进入下一个版本或 backlog
4. 这次交付有哪些 lessons learned

可以直接参考 [team-closeout-example.md](team-closeout-example.md)。

## 9. 和 Team Mode 的边界

当出现下面任一情况时，solo mode 应升级回 Team Mode 或引入至少一次多人评审：

- 需求反复变化，单人无法锁定边界
- 有跨系统依赖，需要别人承诺配合
- 有高风险发布动作，需要共同背书
- 有合规、权限、数据安全等高风险决策

solo mode 的目标是减少形式成本，不是把高风险决策私有化。

## 10. 快速入口

如果你想按一页纸最短路径执行，直接看 [solo-delivery-one-page.md](solo-delivery-one-page.md)。  
如果你想把 solo mode 放进新项目接入流程，继续看 [project-onboarding.md](project-onboarding.md)。
