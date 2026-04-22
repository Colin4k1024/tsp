# DESIGN.md

> **用途**：本文件是 AI coding agent 的设计系统参考文档。将其放在项目根目录，
> agent 读取后即可生成视觉一致的 UI，无需额外配置或 Figma 导出。
>
> **格式来源**：基于 [Google Stitch DESIGN.md 规范](https://stitch.withgoogle.com/docs/design-md/format/)，
> 由 [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 社区扩展。
>
> **获取品牌起点（推荐）**：
> ```bash
> npx getdesign@latest add notion      # 企业管理类（温暖极简）
> npx getdesign@latest add linear.app  # SaaS 工具类（超极简 / 紫色）
> npx getdesign@latest add mintlify    # 文档平台类（绿色 / 阅读优化）
> npx getdesign@latest add stripe      # 企业 SaaS（渐变 / weight-300 优雅感）
> ```
> 运行后将生成的内容替换本文件，再按项目需要定制。
>
> **填写说明**：删除所有以 `>` 开头的注释行，仅保留实际设计值。

---

## 01 / VISUAL THEME & ATMOSPHERE

<!-- 用 2-4 句话描述设计的整体气质、信息密度和设计哲学。
     这是 agent 生成界面时的"基调"，越具体越好。
     示例（企业管理类）：                                         -->

**产品类型**：企业内部管理平台 / SaaS 工具
**核心气质**：温暖极简，内容优先，操作高效。白色或暖白底面托举内容，排版清晰，留白充足，组件感克制。
**信息密度**：中等偏低——每屏不超过 3 个信息层级，重要操作始终可见。
**设计哲学**：用结构代替装饰，用颜色传达语义，不用颜色追求美观。

---

## 02 / COLOR PALETTE & ROLES

<!-- 所有颜色按语义分组，格式：语义名称 + hex + 功能角色说明。
     必须覆盖：背景面 / 内容文字 / 品牌与强调 / 状态色 / 边框。
     示例基于 Notion/Linear 企业管理风格：                        -->

### Background Surfaces
| 名称 | Hex | 角色 |
|------|-----|------|
| Page Background | `#ffffff` | 主页面背景（亮色模式） |
| Surface Warm | `#f7f8f8` | 侧边栏、卡片、输入框背景 |
| Surface Elevated | `#f3f4f5` | 悬浮层、弹窗、Popover 背景 |
| Surface Hover | `#ebebeb` | 列表行 / 菜单项 hover 状态 |

### Text & Content
| 名称 | Hex | 角色 |
|------|-----|------|
| Text Primary | `#1a1a1a` | 标题、主要正文 |
| Text Secondary | `#4d4d4d` | 副标题、次要说明 |
| Text Tertiary | `#808080` | Placeholder、时间戳、disabled |
| Text Link | `#5e6ad2` | 超链接、可点击标签 |

### Brand & Accent
| 名称 | Hex | 角色 |
|------|-----|------|
| Brand Primary | `#5e6ad2` | 主按钮背景、active 状态、焦点环 |
| Brand Hover | `#7170ff` | 品牌色 hover 状态 |
| Brand Subtle | `#eef0ff` | 品牌色低饱和底色（tag/badge 背景） |

### Status Colors
| 名称 | Hex | 角色 |
|------|-----|------|
| Success Green | `#27a644` | 成功、完成、在线 |
| Warning Amber | `#f59e0b` | 警告、待处理 |
| Error Red | `#ef4444` | 错误、危险操作 |
| Info Blue | `#3b82f6` | 提示、信息 |

### Border & Dividers
| 名称 | Hex | 角色 |
|------|-----|------|
| Border Strong | `#e0e0e0` | 卡片、输入框边框 |
| Border Subtle | `#f0f0f0` | 分割线、列表分隔 |
| Border Focus | `#5e6ad2` | 输入框 focus 状态 |

---

## 03 / TYPOGRAPHY RULES

<!-- 字体族和完整层级表。
     字体优先级：品牌字体 > 系统字体栈（-apple-system, BlinkMacSystemFont, "Segoe UI", etc.）
     层级表字段：name / size / weight / line-height / letter-spacing / font-family    -->

### Font Families
- **Display / Heading**：`Inter Variable, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Body**：`Inter Variable, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Monospace**：`"JetBrains Mono", "Fira Code", "Cascadia Code", monospace`

### Type Scale
| 名称 | Size | Weight | Line-height | Letter-spacing | 用途 |
|------|------|--------|-------------|----------------|------|
| Display | 40px | 600 | 1.10 | -1.2px | 页面大标题、Hero |
| Heading 1 | 32px | 600 | 1.20 | -0.8px | 一级标题 |
| Heading 2 | 24px | 600 | 1.30 | -0.4px | 二级标题、卡片标题 |
| Heading 3 | 20px | 500 | 1.35 | -0.2px | 三级标题、Section |
| Body Large | 18px | 400 | 1.65 | normal | 说明文字、描述 |
| Body Medium | 16px | 400 | 1.55 | normal | 正文、列表项 |
| Body Small | 14px | 400 | 1.50 | normal | 辅助说明、表格内容 |
| Caption | 12px | 500 | 1.40 | +0.1px | 标签、时间戳、Badge |
| Mono Body | 14px | 400 | 1.60 | normal | 代码片段、API key |

---

## 04 / COMPONENT STYLES

<!-- 覆盖最常用组件及其状态。
     每个组件至少说明：default / hover / focus / disabled / error 状态中的视觉变化。  -->

### Buttons
| 变体 | 背景 | 文字 | 边框 | Hover | 说明 |
|------|------|------|------|-------|------|
| Primary | `#5e6ad2` | `#ffffff` | none | bg `#7170ff` | 主要操作（每屏最多 1 个） |
| Secondary | `#ffffff` | `#1a1a1a` | `1px #e0e0e0` | bg `#f7f8f8` | 次要操作 |
| Ghost | transparent | `#5e6ad2` | none | bg `#eef0ff` | 低权重操作、工具栏 |
| Danger | `#ef4444` | `#ffffff` | none | bg `#dc2626` | 不可撤销的危险操作 |

- **圆角**：`6px`（按钮）
- **内边距**：`8px 16px`（默认），`6px 12px`（小号）
- **Focus ring**：`2px offset 2px solid #5e6ad2`，不可移除

### Cards
- 背景：`#ffffff`，边框：`1px solid #e0e0e0`，圆角：`8px`
- 默认阴影：`0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`
- Hover 阴影：`0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)`
- 内边距：`16px`（标准），`24px`（宽松布局）

### Form Inputs
- 背景：`#ffffff`，边框：`1.5px solid #e0e0e0`，圆角：`6px`
- 内边距：`8px 12px`，高度：`36px`（单行）
- Focus：边框色 `#5e6ad2`，`box-shadow: 0 0 0 3px rgba(94,106,210,0.15)`
- Error：边框色 `#ef4444`，辅助文字色 `#ef4444`
- Placeholder 颜色：`#808080`
- Label：`Body Small`（14px / 500），颜色 `#4d4d4d`，显式标签不可省略

### Navigation（侧边栏 / 顶栏）
- 侧边栏背景：`#f7f8f8`，宽度：`240px`
- 菜单项高度：`32px`，内边距：`0 8px`，圆角：`4px`
- Active 状态：背景 `#eef0ff`，文字色 `#5e6ad2`，font-weight `500`
- Hover 状态：背景 `#ebebeb`
- 顶栏高度：`56px`，背景 `#ffffff`，border-bottom `1px solid #f0f0f0`

### Badges / Tags
- 圆角：`9999px`（pill）或 `4px`（方形标签）
- 默认：背景 `#f3f4f5`，文字 `#4d4d4d`，`Caption`（12px / 500）
- 品牌色：背景 `#eef0ff`，文字 `#5e6ad2`
- 成功色：背景 `#dcfce7`，文字 `#16a34a`
- 内边距：`2px 8px`

---

## 05 / LAYOUT PRINCIPLES

<!-- 间距刻度、栅格和留白哲学。
     与 Tailwind spacing 对齐时可直接写 tailwind class，否则写 px 值。  -->

### Spacing Scale
`4px → 8px → 12px → 16px → 20px → 24px → 32px → 40px → 48px → 64px`

### Grid & Breakpoints
| 断点名 | 宽度 | 列数 | 列间距 | 外边距 |
|--------|------|------|--------|--------|
| Mobile | < 768px | 4 | 16px | 16px |
| Tablet | 768px–1024px | 8 | 20px | 24px |
| Desktop | ≥ 1024px | 12 | 24px | 32px |
| Wide | ≥ 1440px | 12 | 24px | 48px |

### Whitespace Philosophy
- 段落之间留白优先大于组件间距，形成清晰节奏。
- 卡片容器内边距：`24px`（宽屏）/`16px`（移动端）。
- 相关内容组间距：`24px`；无关内容组间距：`40px` 以上。
- 正文最大宽度：`720px`（阅读优先场景），表单最大宽度：`480px`。

---

## 06 / DEPTH & ELEVATION

<!-- 阴影层级体系，Level 0（无阴影）到 Level 4（最高悬浮）。  -->

| 层级 | CSS Shadow | 用途 |
|------|-----------|------|
| Level 0 | `none` | 嵌入元素、输入框背景（flat） |
| Level 1 | `0 1px 2px rgba(0,0,0,0.05)` | 卡片默认、行内悬浮 |
| Level 2 | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | 卡片标准、侧边栏 |
| Level 3 | `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` | 悬停卡片、Dropdown |
| Level 4 | `0 10px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)` | 模态框、Popover |
| Focus Ring | `0 0 0 3px rgba(94,106,210,0.25)` | 所有可聚焦元素 |

---

## 07 / DO's AND DON'Ts

<!-- 设计护栏与反模式，帮助 agent 避开常见错误。  -->

### ✅ Do
- 用语义 token 名称表达颜色意图（`text-primary`、`bg-surface`），而非直接写 `#1a1a1a`。
- 每个状态（加载 / 空态 / 错误 / 成功）都有明确的视觉表达，不只处理成功态。
- 保持焦点环（focus ring）始终可见，键盘导航和屏幕阅读器用户依赖它。
- 使用留白建立层级，不靠堆砌颜色和线条制造结构感。
- 图标配合文字标签使用，单独图标仅用于用户高度熟悉的场景（如关闭、搜索）。

### ❌ Don't
- 不要使用超过 4 种品牌/强调色——本设计系统只有 1 个品牌主色。
- 不要把颜色作为**唯一**状态信号——错误必须同时有文字说明或图标。
- 不要移除焦点环（`outline: none` 没有替代方案时禁止）。
- 不要用 `!important` 大面积覆盖样式，也不要硬编码魔法数字 `z-index`。
- 不要让正文行宽超过 80 字符（720px），否则阅读体验显著下降。
- 不要在移动端使用小于 `44×44px` 的可点击目标。

---

## 08 / RESPONSIVE BEHAVIOR

<!-- 断点策略、小屏降级和触控适配。  -->

### Breakpoint Strategy
- **Mobile First**：所有组件先写移动端基线样式，再用 `@media (min-width: ...)` 向上增强。
- 不为不同端提供完全不同的 UI 结构——用同一组件响应式变化，而非维护两套代码。

### Key Collapsing Rules
| 元素 | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| 侧边栏 | 240px 固定显示 | Overlay（icon-only 触发） | 底部抽屉或顶部汉堡菜单 |
| 数据表格 | 全列显示 | 隐藏次要列 | 卡片模式（每行变卡片） |
| 导航栏 | 水平全展开 | 水平缩减 | 汉堡菜单 |
| 表单 | 双列布局 | 双列 | 单列 |
| 模态框宽度 | `max-width: 560px` | `max-width: 480px` | 全宽底部弹层 |

### Touch Targets
- 最小可点击区域：`44×44px`（移动端），`32×32px`（桌面端可接受）。
- 列表行高：移动端 `≥ 48px`，桌面端 `≥ 36px`。
- 表单控件高度：移动端 `44px`，桌面端 `36px`。

---

## 09 / AGENT PROMPT GUIDE

<!-- 给 AI coding agent 的快速参考和即用 prompt 片段。  -->

### Quick Color Reference
```
主背景:     #ffffff    侧栏/卡片背景: #f7f8f8
主文字:     #1a1a1a    次要文字:      #4d4d4d
品牌主色:   #5e6ad2    品牌 hover:    #7170ff
品牌底色:   #eef0ff    边框标准:      #e0e0e0
成功绿:     #27a644    错误红:        #ef4444
警告黄:     #f59e0b    信息蓝:        #3b82f6
```

### Ready-to-Use Prompts

**基础页面布局：**
> Build a page with a `#f7f8f8` sidebar (240px) on the left and `#ffffff` main content area. Use Inter font, `#1a1a1a` for headings, `#4d4d4d` for body text. Navigation items should have `#eef0ff` background and `#5e6ad2` text when active.

**主按钮：**
> Create a primary button with `#5e6ad2` background, white text, `6px` border-radius, `8px 16px` padding. On hover use `#7170ff`. Always include a visible `2px offset 2px solid #5e6ad2` focus ring.

**数据卡片：**
> Design a card with `#ffffff` background, `1px solid #e0e0e0` border, `8px` radius, `16px` padding, and shadow `0 1px 3px rgba(0,0,0,0.06)`. On hover elevate shadow to `0 4px 12px rgba(0,0,0,0.08)`.

**状态徽标：**
> Use pill badges: success with `#dcfce7` bg + `#16a34a` text, warning with `#fef3c7` bg + `#d97706` text, error with `#fee2e2` bg + `#dc2626` text. Font: 12px / 500 / Inter.

**表单字段：**
> Input field: `#ffffff` bg, `1.5px solid #e0e0e0` border, `6px` radius, `8px 12px` padding, 36px height. Focus state: border `#5e6ad2` + box-shadow `0 0 0 3px rgba(94,106,210,0.15)`. Error state: border `#ef4444`. Always include explicit `<label>` linked via `for`/`id`.
