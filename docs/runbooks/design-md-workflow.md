# DESIGN.md Workflow

> **定位**：DESIGN.md 是 AI agent 的设计执行层文件，放在项目根目录后，
> 前端 agent 读取即可生成视觉一致的 UI，无需 Figma 导出或手写设计规范。
>
> 本文说明如何在 harness-demo `/team-*` 工作流中创建、使用和维护 DESIGN.md。

---

## 默认推荐：根目录已有 DESIGN.md

本仓库根目录已内置一份基于 **Notion 风格**（温暖极简，企业管理类）的 `DESIGN.md`，
可直接使用，无需额外配置。

**直接使用**：前端 agent 读取 `DESIGN.md` 即可，无需操作。

**覆盖为其他风格**（在项目根目录执行）：

```bash
# 推荐备选风格（企业管理 / SaaS 工具类）
npx getdesign@latest add linear.app   # SaaS 超极简 / 品牌紫
npx getdesign@latest add stripe       # 企业渐变 / weight-300 优雅感
npx getdesign@latest add mintlify     # 文档平台 / 绿色阅读优化
npx getdesign@latest add hashicorp    # 企业简洁 / 黑白为主

# 执行后 DESIGN.md 将被替换为对应品牌的 token 值
# 替换后按项目需要编辑定制；完成后 git commit 即可
```

完整品牌库（69+ 品牌）：https://getdesign.md

---

---

## 为什么需要 DESIGN.md

现有设计流程存在一个传递断层：

```
design-system-brief.md     → 设计意图（What & Why）
        ↓  ← ❌ 传递断层：没有具体值
ui-implementation-plan.md  → 实现指引（How to build）
```

`design-system-brief` 记录的是**策略**（"用企业管理风格，品牌色为紫色"），
但前端 agent 在写 `bg-brand` 时不知道具体是哪个紫——是 `#5e6ad2` 还是 `#6366f1`？

DESIGN.md 填补这个断层，提供**可直接使用的具体值**：

```
design-system-brief.md → DESIGN.md → ui-implementation-plan.md
     设计意图            具体 token        实现指引
```

---

## 三种创建路径

### 路径 A — 从品牌参考库选参考（推荐）

适用于：有明确风格偏好，想快速获得高质量起点。

```bash
# 1. 在项目根目录运行（需要 Node.js）
npx getdesign@latest add notion        # 企业管理类（温暖极简）
npx getdesign@latest add linear.app   # SaaS 工具（超极简 / 紫色）
npx getdesign@latest add mintlify     # 文档平台（绿色 / 阅读优化）
npx getdesign@latest add stripe       # 企业 SaaS（渐变 / 优雅感）

# 命令会在根目录生成 DESIGN.md（以及可选的 preview.html）
# 2. 编辑 DESIGN.md，按项目需要调整色值、字体、组件样式
# 3. 完成后无需其他配置，前端 agent 读取即生效
```

**品牌选型参考（企业管理类）**：

| 品牌 | 风格 | 适合场景 |
|------|------|----------|
| `notion` | 暖白、衬线标题、柔和阴影 | 知识库、文档管理、内容平台 |
| `linear.app` | 纯黑深色、Inter 字体、品牌紫 | 项目管理、任务追踪、工程工具 |
| `mintlify` | 绿色强调、清晰排版 | 开发者文档、API 平台 |
| `hashicorp` | 企业简洁、黑白为主 | 基础设施、运维工具 |
| `posthog` | 深色仪表盘、数据密集 | 数据分析、监控面板 |

完整列表：[github.com/VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)

---

### 路径 B — 从 design-system-brief 提取生成

适用于：已填写 `design-system-brief.md`，需要将设计意图转化为具体 token 值。

1. 打开 [`templates/design-system-brief.md`](../../templates/design-system-brief.md) 查看第 2 节（视觉方向）和第 3 节（Token 策略）。
2. 复制 [`templates/DESIGN.md`](../../templates/DESIGN.md) 到项目根目录。
3. 根据 `design-system-brief` 中的视觉方向和 token 策略，逐区块填写具体值：
   - **Section 02**（色盘）：从 brief 第 3 节 Color token 提取，补充具体 hex 值
   - **Section 03**（排版）：从 brief 第 3 节 Typography token 提取，补充具体 size/weight
   - **Section 04**（组件）：参考 brief 第 4 节高风险交互，补充具体组件状态
4. 同步更新 `design-system-brief.md` 第 7 节，记录引用品牌和定制要点。

---

### 路径 C — 从头填写

适用于：全新项目，没有现成品牌参考，需要从零设计。

1. 复制 [`templates/DESIGN.md`](../../templates/DESIGN.md) 到项目根目录。
2. 按照 9 个区块逐一填写，删除所有注释行（以 `>` 开头的行）。
3. 重点先填 Section 02（色盘）、Section 03（排版）、Section 04（组件），其余区块可后续补充。
4. 提交前请用 [ui-review-checklist.md](../../templates/ui-review-checklist.md) 验证设计的一致性。

---

## 与 `/team-*` 命令的对接

### `/team-intake` 阶段

- `tech-lead` 在 intake 时确认前端设计约束，需要锁定：
  - **产品类型**（如"企业管理工具"）
  - **参考品牌**（如"参考 Notion 风格定制"）
  - 填写 `design-system-brief.md` 第 7 节
- **输出**：intake 产出的 PRD 应注明"DESIGN.md 参考品牌：`<brand>`"

### `/team-execute` 阶段（前端任务）

- `frontend-engineer` 在开始编码前：
  1. 检查根目录是否存在 `DESIGN.md`
  2. 若不存在 → 根据 `design-system-brief` 第 7 节选择路径 A/B/C 创建
  3. 若存在 → 优先读取，所有 token 值以 DESIGN.md 为准
- **实现约束**：代码中不允许出现与 DESIGN.md 不一致的硬编码色值

### `/team-review` 阶段

- `qa-engineer` 评审时额外检查：
  - [ ] 实现色值是否与 DESIGN.md Section 02 一致（无散装硬编码）
  - [ ] 组件状态（hover / focus / error / disabled）是否符合 Section 04
  - [ ] 响应式行为是否符合 Section 08 规则

---

## DESIGN.md 在项目中的位置

```
my-project/
├── DESIGN.md           ← 放这里（项目根目录，全局共享）
├── AGENTS.md
├── src/
├── docs/
│   └── artifacts/
│       └── {slug}/
│           └── design-system-brief.md   ← 设计意图
│           └── ui-implementation-plan.md
```

- **一个项目一个 DESIGN.md**：全局共享，不按任务隔离。
- 如果一个项目有多个明显差异的子产品（如管理端 + C 端），考虑用 `DESIGN-admin.md` / `DESIGN-consumer.md` 区分，并在 AGENTS.md 中说明各部分引用哪个文件。

---

## 维护策略

### 何时需要更新 DESIGN.md

| 触发条件 | 建议操作 |
|----------|---------|
| 品牌色变更 | 更新 Section 02，运行一次 `ui-review-checklist` 回归验证 |
| 新增重要组件（如 DatePicker / Table） | 在 Section 04 新增组件样式描述 |
| 设计系统大版本升级 | 重新运行 `npx getdesign@latest add <brand>`，对比 diff 决定采纳哪些变更 |
| 发现实现与 DESIGN.md 不一致 | 先确认是设计值错误还是实现错误，再对应修改 |

### 不需要更新的情况

- 单个页面的局部样式调整（如调整某个表格的行间距）——这属于组件级变更，在代码注释中说明即可。
- QA 发现的轻微响应式问题——在 `ui-review-checklist` 记录，不必改 DESIGN.md。

---

## 参考资料

- [templates/DESIGN.md](../../templates/DESIGN.md) — 项目模板（9 区块 + 企业管理风格示例值）
- [templates/design-system-brief.md](../../templates/design-system-brief.md) — 设计意图模板（含第 7 节 DESIGN.md 产出）
- [skills/frontend-ui-ux-system/references/design-md-integration.md](../../skills/frontend-ui-ux-system/references/design-md-integration.md) — DESIGN.md 字段与 token 体系的映射说明
- [awesome-design-md GitHub](https://github.com/VoltAgent/awesome-design-md) — 69+ 品牌参考库
- [getdesign.md](https://getdesign.md/) — 在线浏览和预览各品牌 DESIGN.md
