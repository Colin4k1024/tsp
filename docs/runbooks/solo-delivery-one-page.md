---
version: "0.1.0"
status: draft
created: 2026-04-03
updated: 2026-04-03
owner: 工程团队
---

# Solo Delivery One Page

这一页给的是 solo mode 最短闭环。适合你已经知道需求大致方向，只需要一个不跳 gate 的执行路径。

完整原则见 [solo-delivery-mode.md](solo-delivery-mode.md)。

## 1. 一句话规则

- 压缩角色，不压缩 gate
- 发布不是结束，观察窗口结束后的 closeout 才是收口

## 2. 最短路径

1. `intake`
2. `plan`
3. `execute`
4. `review`
5. `release`
6. `closeout`

## 3. 每一步最少要做什么

| 阶段 | 最少输入 | 最少输出 | 进入下一步前必须确认 |
|------|----------|----------|----------------------|
| intake | 需求、背景、约束 | 目标、范围、不做项、成功标准 | 需求边界不是模糊口号 |
| plan | intake 结论 | 实现思路、风险、验证路径 | 知道怎么做，也知道怎么证明做对 |
| execute | 已确认方案 | 代码/文档变更、执行记录、自测结果 | 没有把关键问题留给 review 才发现 |
| review | execute 输出 | 放行意见、剩余风险、是否可上线 | “测试通过”与“可以上线”分开判断 |
| release | review 结论 | 发布动作、回滚入口、观察窗口 | 已知看什么、谁来判断是否稳定 |
| closeout | 发布结果、观察数据 | 最终结论、遗留项、lessons learned | 观察窗口已结束并完成状态收口 |

## 4. Solo Mode 检查清单

每次交付至少过这一轮：

- 目标和不做项写清楚了
- 验收标准不是口头默认
- 已提前想好验证方法
- 发布入口和回滚入口是明确的
- 观察窗口有起止时间和指标
- closeout 有最终结论和遗留项归档

## 5. 什么时候不要继续往前

出现这些情况时，先停下来补齐，而不是继续推进：

- 还说不清这次到底交付什么
- 设计方案没有收口，只是在边做边试
- 没有回滚路径就准备发布
- 观察窗口还没结束就想宣布完成

## 6. 最小示例节奏

```text
intake
目标：
范围：
不做：
成功标准：
```

```text
plan
方案：
关键风险：
验证方法：
```

```text
execute
改动：
自测：
剩余问题：
```

```text
review
放行结论：
剩余风险：
是否允许进入 release：
```

```text
release
发布步骤：
回滚步骤：
观察窗口：
关键指标：
```

```text
closeout
观察窗口结论：
最终验收：
遗留项：
lessons learned：
```

## 7. 参考

- [project-onboarding.md](project-onboarding.md)
- [team-release-example.md](team-release-example.md)
- [team-closeout-example.md](team-closeout-example.md)
