---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# 前端缺陷修复一页速查

本文把前端缺陷修复压缩成一页，适合已经知道平台基本工作方式，但不想每次都翻完整 walkthrough 的场景。

## 1. 什么时候用这页

- 页面布局错乱、交互异常、状态显示错误
- 需要补响应式、A11y 或 UI 验证证据
- 任务边界清晰，优先考虑短链路

## 2. 最短起手方式

```text
/team-intake
目标：修复订阅页在 iPad 横屏下的布局溢出
范围：页面布局、响应式回归、UI 自测证据
不做：接口改造
约束：必须附带 ui-review-checklist
```

## 3. 优先判断短链路还是长链路

- 只改单页面样式或交互：优先短链路
- 涉及多个页面、组件结构或状态流：补 `/team-plan`
- 涉及接口联动、权限或发布风险：直接进入完整主链

## 4. 推荐命令顺序

短链路：

1. `/team-intake`
2. `/code-review`
3. `/handoff`
4. `/team-review`

完整主链：

1. `/team-intake`
2. `/team-plan`
3. `/team-execute`
4. `/handoff`
5. `/team-review`

## 5. 必须出现的验证点

- 主路径是否恢复正常
- 响应式断点是否覆盖
- 关键交互状态是否正常
- 是否附带 UI 自测或 checklist 证据

## 6. handoff 至少写什么

```text
已完成
- 修复 iPad 横屏下的栅格溢出

验证结果
- 桌面、iPad 横屏、iPhone 视图已验证
- ui-review-checklist 已补齐

风险
- 暂未覆盖低版本 Safari

下一角色关注点
- QA 重点看横屏切换和按钮折行
```

## 7. 常见错误

- 只说“样式已修复”，没有响应式证据
- 明明是前端问题，却完全不提 `ui-review-checklist`
- 任务已经跨页面或跨状态流，还强行走短链路

如果你要看完整长演练，继续看 [bug-fix-complete-walkthrough.md](bug-fix-complete-walkthrough.md) 和 [frontend-refactor-walkthrough.md](frontend-refactor-walkthrough.md)。
