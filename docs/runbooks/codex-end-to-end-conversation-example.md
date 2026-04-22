---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Codex 完整对话样例

本文给出一份偏 Codex 使用方式的成品对话样例，重点展示“主链 + 并行分析 + handoff 收口”是怎样串起来的。

## 1. 场景

- 任务：修复控制台首页在 iPad 横屏下的布局溢出
- 范围：页面布局、响应式回归、UI 验证清单
- 不做：接口与数据结构改造
- 约束：必须遵守 frontend-quality-gates

## 2. 第一步：用户先做 intake

用户可以这样说：

```text
/team-intake
目标：修复控制台首页在 iPad 横屏下的布局溢出
范围：页面布局、响应式回归、UI 验证清单
不做：接口与数据结构改造
约束：必须遵守 frontend-quality-gates
```

期望得到的结果至少包含：

```text
参与角色
- tech-lead
- frontend-engineer
- qa-engineer

主要风险
- iPad 横屏下卡片栅格断裂
- 修复后可能影响移动端按钮折行

下一步建议
- 进入 /multi-frontend，从实现、UI/UX、QA 三个视角并行拆解
```

## 3. 第二步：用户要求并行拆解

```text
/multi-frontend
基于当前 intake 结果，从实现、UI/UX、QA 风险三个视角拆解工作。
要求指出哪些结论必须进入最终 handoff。
```

期望得到的结果应分成两层：

```text
各视角结论
- 实现：问题出在栅格列宽和容器最小宽度冲突
- UI/UX：修复时需保留按钮层级和空态布局
- QA：重点验证 iPad 横屏、移动端折行和低分辨率桌面

必须进入 handoff 的内容
- 修复点：栅格列宽策略调整
- 验证点：iPad 横屏、移动端、桌面端
- 风险：低分辨率桌面可能出现按钮折行
```

## 4. 第三步：用户要求回收到 handoff

```text
请把上面的多 agent 结论整理成一次正式 /handoff。
不要重复每个 agent 的原话，只保留已确认结论、风险与依赖、下一角色动作清单。
```

期望得到：

```text
已确认结论
- 布局溢出由栅格列宽和容器最小宽度冲突导致

风险与依赖
- 修复后需回归移动端和低分辨率桌面

下一角色动作清单
- frontend-engineer 调整栅格策略并补 UI 自测
- qa-engineer 按 iPad 横屏、移动端、桌面端进行回归
```

## 5. 第四步：用户要求 execute

```text
/team-execute
按当前结论执行前端修复。
输出改动摘要、自测结论、待 QA 关注点，以及需要进入 review 的内容。
```

期望得到：

```text
改动摘要
- 调整首页栅格列宽和容器最小宽度
- 保持按钮区层级和空态布局不变

自测结论
- 桌面端、iPad 横屏、移动端已验证
- ui-review-checklist 已补齐

待 QA 关注点
- 低分辨率桌面是否出现按钮折行
```

## 6. 第五步：用户要求 review

```text
/team-review
基于当前 handoff 和 execute 结果，输出评审结论、阻塞项、放行建议和残余风险。
```

期望得到：

```text
评审结论
- 结论：通过

阻塞项
- 无

残余风险
- 暂无新的结构性风险

放行建议
- 可合并，并保留一次低分辨率桌面 smoke
```

## 7. 第六步：如果需要发布收口

如果这是一个高风险修复，用户还可以继续：

```text
/team-release
基于当前测试结论，整理发布方案、观察窗口、回滚条件和责任链。
如果需要 GitLab 手动流水线或 Langfuse 追踪，也请说明。
```

期望得到：

```text
发布方案
- 先在 staging 验证，再进入小流量观察

观察窗口
- 重点观察首页渲染错误率和关键点击链路

回滚条件
- 布局异常回归或关键页面不可用
```

## 8. 这份样例说明了什么

- Codex 的关键优势不是“多跑 agent”，而是“并行后还能回收成 handoff”
- 用户在 Codex 里最好显式要求哪些结论必须进入 handoff 或 review
- 小任务可以不走超长主链，但验证与收口不能省

如果你想直接复制 Codex 的高频表达方式，继续看 [codex-parallel-prompt-recipes.md](codex-parallel-prompt-recipes.md)；如果你想看更完整的并行原则，继续看 [codex-multi-agent-orchestration.md](codex-multi-agent-orchestration.md)。
