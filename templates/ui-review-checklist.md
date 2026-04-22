# UI Review Checklist

参考：UI 评审可结合 [../rules/frontend-engineering-standards.md](../rules/frontend-engineering-standards.md)、[../rules/frontend-ui-ux-standards.md](../rules/frontend-ui-ux-standards.md) 与 [../docs/runbooks/code-review-collaboration-walkthrough.md](../docs/runbooks/code-review-collaboration-walkthrough.md)。

## 1. 视觉一致性

- [ ] 页面与组件遵循统一设计 token
- [ ] 字体、颜色、间距、圆角、阴影没有散装硬编码
- [ ] 核心页面视觉层级清晰，没有无意的样式漂移

## 2. 交互完整性

- [ ] 主路径的 loading / empty / error / success 状态完整
- [ ] 提交、删除、保存、切换等关键动作有明确反馈
- [ ] 导航、返回和弹层关闭路径可预测

## 3. 响应式与布局

- [ ] 小屏、中屏、大屏都有可接受布局
- [ ] 没有非预期横向滚动或内容遮挡
- [ ] 表格、图表、筛选区在小屏有降级方案

## 4. 可访问性

- [ ] 所有交互元素具备可见标签或可理解名称
- [ ] 焦点状态可见，键盘路径可达
- [ ] 颜色不是唯一状态信号，对比度满足基线
- [ ] 图标按钮、图片、图表具备必要说明

## 5. 性能

- [ ] 首屏和关键交互没有明显卡顿或布局抖动
- [ ] 图片、图标、列表或图表有合理加载策略
- [ ] 不存在明显不必要的重复渲染或大包体引入

## 6. 证据

- [ ] 已附关键页面/组件截图或等价说明
- [ ] 已记录已知风险、未覆盖项和下一步建议
- [ ] 结论已通过 `/handoff` 传递给 QA 或 Tech Lead
