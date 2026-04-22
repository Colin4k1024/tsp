---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# Bug 修复全流程演练

本文演示一个典型 bug 如何从问题确认一路走到验证和收口，适用于 Claude 和 Codex。

## 1. 场景

- 问题：订阅页在 iPad 横屏下布局溢出
- 影响：按钮被挤压，部分文案不可见
- 不涉及：接口和数据库改造

## 2. 推荐链路

轻量问题可走短链路：

1. `/team-intake`
2. `/team-execute`
3. `/code-review`
4. `/handoff`
5. `/team-review`

如果问题影响范围大，再补 `/team-plan`。

## 3. 输入示例

```text
/team-intake
目标：修复订阅页在 iPad 横屏下的布局溢出
范围：页面布局、响应式验证、UI 自测证据
不做：接口改造
约束：必须附带 ui-review-checklist
```

## 4. execute 阶段的关键输出

- 根因说明
- 改动范围最小化
- 响应式自测证据
- 是否存在其他断点回归风险

## 5. review 阶段的关键输出

- bug 是否真正复现并修复
- 是否引入新的视觉回归
- 是否仍有设备覆盖缺口

## 6. 常见错误

- 只说“修了样式”而不说明根因
- 没有任何设备或断点验证证据
- 把小 bug 修复也写成很重的长链路

与前端专项说明配合阅读：[frontend-engineer-daily-operations.md](frontend-engineer-daily-operations.md)
