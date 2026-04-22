# DESIGN.md

> **默认推荐风格**：Notion（温暖极简，企业管理类）
>
> **覆盖方式**：在项目根目录运行以下任意命令，生成的文件会替换本文件：
> ```bash
> npx getdesign@latest add linear.app   # SaaS 超极简 / 品牌紫
> npx getdesign@latest add stripe       # 企业渐变 / weight-300 优雅感
> npx getdesign@latest add mintlify     # 文档平台 / 绿色阅读优化
> npx getdesign@latest add hashicorp    # 企业简洁 / 黑白为主
> npx getdesign@latest add posthog      # 数据仪表盘 / 深色密集
> ```
> 完整品牌库（69+）：https://getdesign.md
>
> **来源**：[awesome-design-md / Notion](https://github.com/VoltAgent/awesome-design-md)
> — 提取自 Notion 公开 CSS，不代表 Notion 官方设计规范。

---

## 01 / VISUAL THEME & ATMOSPHERE

**产品类型**：企业内部管理平台、知识库、文档协作工具  
**核心气质**：温暖极简，内容优先。暖白底面托举内容，排版清晰，留白充足，交互克制。不靠装饰吸引眼球，靠结构和节奏引导注意力。  
**信息密度**：中等——每屏不超过 3 个信息层级，重要操作始终可见，次要操作藏在上下文菜单中。  
**设计哲学**：块即内容（block-based），颜色传达语义而非美观，字重传达层级，所有元素服务于文本可读性。

---

## 02 / COLOR PALETTE & ROLES

### Background Surfaces

| 名称 | Hex / Value | 角色 |
|------|-------------|------|
| Page Background | `#ffffff` | 主页面背景（亮色模式） |
| Surface Warm | `#f6f5f4` | 侧边栏、卡片、Section 背景 |
| Surface Dark | `#31302e` | 深色模式主背景 |
| Surface Elevated | `#f0efee` | 悬浮层、Hover 高亮 |

### Text & Content

| 名称 | Hex / Value | 角色 |
|------|-------------|------|
| Text Primary | `rgba(0,0,0,0.95)` | 标题、主要正文（Notion Black） |
| Text Secondary | `#615d59` | 副标题、次要说明（Warm Gray 500） |
| Text Tertiary | `#a39e98` | Placeholder、时间戳、disabled（Warm Gray 300） |
| Text Inverse | `#ffffff` | 深色背景上的文字 |

### Brand & Interactive

| 名称 | Hex | 角色 |
|------|-----|------|
| Notion Blue | `#0075de` | 主 CTA 按钮、超链接 |
| Active Blue | `#005bab` | 按钮按下 / active 状态 |
| Focus Blue | `#097fe8` | 焦点环（focus ring）颜色 |
| Deep Navy | `#213183` | 品牌副色、深蓝强调 |
| Badge Background | `#f2f9ff` | Pill 徽章底色 |

### Semantic / Status

| 名称 | Hex | 角色 |
|------|-----|------|
| Success Teal | `#2a9d99` | 完成、在线、成功态 |
| Confirm Green | `#1aae39` | 确认操作、正向结果 |
| Warning Orange | `#dd5b00` | 警告、待处理 |
| Error / Input Error | `#ff64c8`（装饰） / `#dd5b00`（功能） | 表单错误用 Orange，装饰性用 Pink |
| Premium Purple | `#391c57` | 高级功能标记、会员权益 |
| Earthy Brown | `#523410` | 分类标签、Earthy 主题 |

### Borders & Dividers

| 名称 | Value | 角色 |
|------|-------|------|
| Border Default | `rgba(0,0,0,0.10)` | 卡片、输入框边框 |
| Divider | `rgba(0,0,0,0.07)` | 区块分隔线 |
| Focus Ring | `2px solid #097fe8` | 所有可聚焦元素 |

---

## 03 / TYPOGRAPHY RULES

### Font Families

- **Display / Heading / Body**：`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Monospace**：`"SFMono-Regular", Menlo, Consolas, "PT Mono", "Liberation Mono", monospace`

> Notion 在正文排版中使用 Inter 而非衬线字体。页面标题在某些模板中支持衬线（Georgia），
> 但系统 UI 与仪表盘类产品统一使用 Inter。

### Type Scale

| 名称 | Size | Weight | Line-height | Letter-spacing | 用途 |
|------|------|--------|-------------|----------------|------|
| Display Hero | 64px | 700 | 1.00 | -2.125px | 营销首屏大标题 |
| Display Secondary | 54px | 700 | 1.04 | -1.875px | 次级英雄区标题 |
| Section Heading | 48px | 700 | 1.00 | -1.5px | 页面分区标题 |
| Sub-heading Large | 40px | 700 | 1.50 | normal | 大副标题 |
| Sub-heading | 26px | 700 | 1.23 | -0.625px | 卡片标题、区块标题 |
| Card Title | 22px | 700 | 1.27 | -0.25px | 功能卡片标题 |
| Body Large | 20px | 600 | 1.40 | -0.125px | 导语、重要说明 |
| Body Medium | 16px | 500 | 1.50 | normal | 导航、强调文字 |
| Body | 16px | 400 | 1.50 | normal | 标准正文、列表项 |
| Nav / Button | 15px | 600 | 1.33 | normal | 导航链接、按钮文字 |
| Caption | 14px | 500 | 1.43 | normal | 标签、时间戳、元数据 |
| Badge / Micro | 12px | 600 | 1.33 | +0.125px | 徽章、状态标签 |

---

## 04 / COMPONENT STYLES

### Buttons

| 变体 | 背景 | 文字 | 圆角 | Hover | 说明 |
|------|------|------|------|-------|------|
| Primary | `#0075de` | `#ffffff` | `5px` | bg `#005bab` | 主要行动（每屏最多 1 个） |
| Secondary | `#ffffff` | `rgba(0,0,0,0.95)` | `5px` | bg `#f6f5f4` | 次要操作，带 `1px solid rgba(0,0,0,0.1)` 边框 |
| Ghost | transparent | `#0075de` | `5px` | bg `#f2f9ff` | 工具栏、低权重操作 |
| Pill Badge | `#f2f9ff` | `#0075de` | `9999px` | — | 状态徽章、分类标签 |

- **内边距**：`8px 16px`（默认），`6px 12px`（小号）
- **高度**：`36px`（默认），`32px`（紧凑），`44px`（大号 CTA）
- **Focus ring**：`2px solid #097fe8`，不可移除

### Cards

- 背景：`#ffffff`
- 边框：`1px solid rgba(0,0,0,0.10)`
- 圆角：`12px`（标准卡片），`16px`（Hero 卡片），`8px`（小卡片）
- 默认阴影：见 Section 06 Level 2
- 内边距：`24px`（标准），`16px`（紧凑）

### Form Inputs

- 背景：`#ffffff`，边框：`1px solid rgba(0,0,0,0.10)`，圆角：`4px`
- 高度：`36px`（单行），内边距：`8px 12px`
- Focus：`border-color: #097fe8`，`box-shadow: 0 0 0 2px rgba(9,127,232,0.20)`
- Error：`border-color: #dd5b00`，辅助文字 `#dd5b00`
- Placeholder：`#a39e98`
- Label：`Caption`（14px / 500），显式标签不可省略

### Navigation（侧边栏）

- 侧边栏背景：`#f6f5f4`，宽度：`240px`
- 菜单项高度：`30px`，内边距：`0 8px`，圆角：`4px`
- Active 状态：背景 `rgba(0,0,0,0.07)`，字重 `500`
- Hover 状态：背景 `rgba(0,0,0,0.04)`
- 图标：`16px`，颜色 `rgba(0,0,0,0.45)`
- 顶栏高度：`48px`，背景 `#ffffff`，边框 `1px solid rgba(0,0,0,0.07)`

### Badges / Status Tags

- Pill 圆角：`9999px`；方形标签圆角：`4px`
- 默认：bg `#f6f5f4`，文字 `#615d59`
- 品牌蓝：bg `#f2f9ff`，文字 `#0075de`
- 成功：bg `rgba(42,157,153,0.12)`，文字 `#2a9d99`
- 警告：bg `rgba(221,91,0,0.10)`，文字 `#dd5b00`
- 内边距：`2px 8px`（pill），`2px 6px`（方形）

---

## 05 / LAYOUT PRINCIPLES

### Spacing Scale

`2px → 4px → 6px → 8px → 12px → 14px → 16px → 24px → 32px → 48px → 64px`

Tailwind 对应：`space-0.5` / `space-1` / `space-1.5` / `space-2` / `space-3` / `space-4` / `space-6` / `space-8` / `space-12` / `space-16`

### Grid & Breakpoints

| 断点名 | 宽度 | 列数 | 内容最大宽 | 外边距 |
|--------|------|------|-----------|--------|
| Mobile | < 768px | 4 | 100% | 16px |
| Tablet | 768px–1024px | 8 | 100% | 24px |
| Desktop | ≥ 1024px | 12 | 1200px | 32px |
| Wide | ≥ 1440px | 12 | 1200px | auto |

### Whitespace Philosophy

- **内容最大宽**：正文 `720px`，表单 `480px`，文档全宽 `900px`
- 相关内容组间距：`24px`；无关内容分区间距：`48px`
- 卡片网格间距：`16px`（紧凑），`24px`（宽松）
- 侧边栏内项目间距：`2px`，分组间距：`16px`

---

## 06 / DEPTH & ELEVATION

| 层级 | 描述 | CSS Shadow | 用途 |
|------|------|------------|------|
| Level 0 | Flat | `none` | 嵌入元素、段落块 |
| Level 1 | Whisper | `0 1px 0 rgba(0,0,0,0.10)` 或 `1px solid rgba(0,0,0,0.10)` | 表格行、行内悬浮 |
| Level 2 | Card | `0 0 0 1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04)` | 卡片默认 |
| Level 3 | Deep | `0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.04), 0 16px 32px rgba(0,0,0,0.04), 0 32px 52px rgba(0,0,0,0.02)` | Dropdown、Popover |
| Level 4 | Modal | 同 Level 3 + `backdrop: rgba(0,0,0,0.25)` | 模态框、Sheet |
| Focus Ring | Interactive | `0 0 0 2px #097fe8` | 所有可聚焦元素，不可移除 |

---

## 07 / DO's AND DON'Ts

### ✅ Do

- 用块状结构（block-based）组织内容，每个块职责单一、边界清晰。
- 用颜色传达**语义**（状态、类型、优先级），不用颜色制造视觉噪音。
- 保持侧边栏层级不超过 3 层，导航项控制在每屏可见范围内。
- 空态（Empty State）要有插图或说明文字，引导用户完成首个操作。
- Focus ring（`#097fe8`）始终可见，键盘用户和屏幕阅读器依赖它。
- 每个操作（提交、删除、归档）都要有即时视觉反馈（loading / success / error）。

### ❌ Don't

- 不在导航或正文中使用超过 3 种颜色，颜色多 = 信息层级混乱。
- 不在按钮或交互元素上使用透明度 `opacity` 代替 `disabled` 状态颜色。
- 不用阴影堆叠制造"高级感"，超过 Level 2 的阴影仅用于悬浮层。
- 不使用内联样式硬编码颜色，所有值必须来自 CSS 变量或 Tailwind token。
- 不在 placeholder 上依赖超过 3 个单词的说明，label 是唯一可靠的表单字段说明。
- 不跳过移动端设计——侧边栏必须支持 slide-in drawer 模式。

---

## 08 / RESPONSIVE BEHAVIOR

### 断点策略

- **移动端优先**：基础样式针对 `< 768px`，向上增强。
- **侧边栏**：≥ 1024px 固定展开；768px–1024px 可收起（图标模式）；< 768px 隐藏，通过汉堡菜单弹出 drawer。
- **卡片网格**：桌面端 3 列 → 平板端 2 列 → 移动端 1 列。
- **数据表格**：移动端横向滚动，不压缩列内容；固定操作列在右侧。

### Touch Targets

- 最小可点击区域：`44×44px`（iOS HIG 标准）。
- 列表项高度不低于 `44px`（移动端），`32px`（桌面端）。
- 相邻可点击元素间距不少于 `8px`。

### 小屏降级规则

| 元素 | 桌面端 | 移动端 |
|------|--------|--------|
| 侧边栏 | 固定展开 `240px` | Drawer（slide-in） |
| 数据表格 | 多列显示 | 横向滚动 / 关键列保留 |
| 模态框 | 居中浮层 | 全屏 Sheet（从底部弹起） |
| 顶部导航 | 完整菜单 | 汉堡菜单收起 |
| 卡片网格 | 3 列 | 1 列 |

---

## 09 / AGENT PROMPT GUIDE

> 本节为 AI coding agent 提供即用参考，在生成 UI 时粘贴相关片段到 prompt 中。

### 快速色彩参考

| 语义 | CSS 变量（推荐命名） | 值 |
|------|--------------------|----|
| 页面背景 | `--bg-page` | `#ffffff` |
| 表面暖白 | `--bg-surface` | `#f6f5f4` |
| 主文字 | `--text-primary` | `rgba(0,0,0,0.95)` |
| 次要文字 | `--text-secondary` | `#615d59` |
| 占位文字 | `--text-muted` | `#a39e98` |
| 品牌蓝 | `--brand` | `#0075de` |
| 品牌深色 | `--brand-active` | `#005bab` |
| 焦点环 | `--focus` | `#097fe8` |
| 边框 | `--border` | `rgba(0,0,0,0.10)` |
| 成功 | `--success` | `#2a9d99` |
| 警告 | `--warning` | `#dd5b00` |

### 即用 Prompt 片段

**生成页面整体布局：**
```
使用 DESIGN.md 的 Notion 风格：暖白背景 #f6f5f4 侧边栏 + 白色 #ffffff 主内容区，
侧边栏宽 240px，顶栏高 48px，所有颜色通过 CSS 变量引用，禁止硬编码原始值。
```

**生成按钮组：**
```
按照 DESIGN.md Section 04 Buttons：
- Primary：bg #0075de，文字白色，圆角 5px，hover bg #005bab
- Secondary：bg 白色，边框 1px solid rgba(0,0,0,0.1)，hover bg #f6f5f4
所有按钮必须有 focus ring：0 0 0 2px #097fe8。
```

**生成表单：**
```
输入框圆角 4px，高度 36px，border 1px solid rgba(0,0,0,0.1)，
focus 状态 border-color #097fe8 + box-shadow 0 0 0 2px rgba(9,127,232,0.20)，
error 状态 border-color #dd5b00，每个字段必须有显式 label（14px / weight 500）。
```

**生成状态徽章：**
```
Pill badge：border-radius 9999px，内边距 2px 8px，字号 12px weight 600，
品牌色：bg #f2f9ff 文字 #0075de；成功：bg rgba(42,157,153,0.12) 文字 #2a9d99；
警告：bg rgba(221,91,0,0.10) 文字 #dd5b00。
```

**生成数据卡片列表：**
```
卡片：bg 白色，border 1px solid rgba(0,0,0,0.10)，圆角 12px，
shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04)，
桌面端 3 列，平板 2 列，移动端 1 列，卡片间距 16px。
```
