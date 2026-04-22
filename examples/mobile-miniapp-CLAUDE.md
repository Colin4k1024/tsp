# Example Mobile Miniapp CLAUDE.md

适用于移动端 H5、Hybrid、企业 App 配套前端、小程序或强终端适配项目。

这类项目和普通 Web 前端不同，重点往往落在设备差异、弱网、交互反馈、终端权限和多尺寸适配，而不是只看桌面端页面质量。

## 适用信号

- 项目主要运行在手机、平板、小程序容器或企业移动端壳内
- 需求经常涉及终端权限、弱网、滚动性能、手势交互、机型适配
- QA 关注点明显偏向真机、低端机、弱网和多尺寸回归

## 相对通用版的主要差异

### 1. 角色链路更偏前端与 QA

- 默认保留：`tech-lead`、`frontend-engineer`、`qa-engineer`
- 若需要接口改动，再引入 `backend-engineer`
- 若涉及终端能力或架构边界，再引入 `architect`

### 2. 命令流更强调 `/tdd` 和前端专项拆解

- 建议链路：`/team-intake` -> `/team-plan` -> `/tdd` -> `/multi-frontend` -> `/team-execute` -> `/handoff` -> `/team-review`
- `/tdd` 用来先锁多终端、弱网、权限和交互边界
- `/multi-frontend` 用来拆 UI 体验、实现和 QA 风险

### 3. 项目约束更偏终端与交互稳定性

- 页面变更必须说明机型范围、断点策略和弱网/空态/异常态
- 涉及终端权限时必须说明授权路径、拒绝态和回退方案
- 进入 QA 前必须说明真机、模拟器、横竖屏或容器差异验证范围

## 一份更适合移动端 / 小程序项目的精简成品

````md
# Mobile Miniapp Working Agreement

## 项目定位

- 类型：移动端 H5 / 小程序 / 企业 App 配套前端
- 重点：多终端适配、弱网、终端权限、交互稳定性

## 默认角色

- `tech-lead`
- `frontend-engineer`
- `qa-engineer`
- 涉及接口时再引入 `backend-engineer`

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/multi-frontend`
5. `/team-execute`
6. `/handoff`
7. `/team-review`

## 项目约束

- 必须说明机型范围、终端容器、横竖屏和弱网要求
- 涉及权限时必须说明授权路径、拒绝态和兜底方案
- 自测必须覆盖空态、异常态、加载态和交互反馈

## 常用提示模板

```text
/team-intake
目标：新增移动端报销申请页与提交流程
范围：页面布局、表单交互、终端权限、测试计划
不做：后端流程改造
约束：必须说明多尺寸适配、弱网、授权路径、拒绝态和加载反馈
```

```text
/multi-frontend
基于当前 intake 结果，从交互体验、终端适配、QA 风险三个视角并行拆解。
必须指出哪些内容要进入最终 handoff 和 team-review。
```
````

如果你的项目其实主要是 Web SaaS，只是偶尔兼容移动端，优先回到 [saas-nextjs-CLAUDE.md](saas-nextjs-CLAUDE.md)。
