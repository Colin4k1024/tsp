# Open Design Integration

本手册说明如何把 [nexu-io/open-design](https://github.com/nexu-io/open-design) 作为 TSP 的外部设计工作台接入。目标是让 TSP 管需求、角色协作、handoff 和质量门禁，让 Open Design 管可预览、可导出的高保真设计 artifact。

## 采用边界

| 项 | 结论 |
|---|---|
| 上游 | `nexu-io/open-design` |
| License | `Apache-2.0` |
| 接入方式 | `reference-only controlled integration` |
| TSP 落点 | `skills/open-design` + 本 runbook + install manifest |
| 默认安装 | `team` 安装 TSP thin skill / runbook；`full` 额外自动 clone/update Open Design 到 `~/.tsp/open-design`，失败只警告不阻塞 TSP 核心安装 |
| 本仓库依赖 | 不新增 npm 依赖，不 vendoring OD 源码、skills、design-systems 或 daemon；OD 作为外部 checkout 管理 |

## 为什么这样接入

Evidence：Open Design 是独立产品形态，包含 Next.js web、Node daemon、SQLite、PATH agent detection、31 skills、100+ design systems、artifact export，以及 Node `~24` / pnpm `10.33.x` 要求。

Reasoning：如果把它当普通 skill 复制进 TSP，会把上游运行时、依赖、生成数据和设计资产生命周期绑进本仓库，增加验证和许可证归属成本。更合理的方式是让 TSP 提供调用协议、证据回写和安装发现入口。

Implications：`full` profile 会自动准备 Open Design checkout，但 TSP 不替它长期托管 daemon 生命周期。GitHub 不可达、上游临时失败或本机缺少 OD 运行时工具时，安装器只给出 warning 并继续完成 TSP 核心安装；用户可在网络恢复后重跑 full install 或直接执行 `node scripts/install-open-design.js`。

## 使用前检查

安装 TSP full profile 时会自动执行：

```bash
node scripts/install-open-design.js
```

默认安装目录是 `~/.tsp/open-design`。可通过环境变量覆盖：

```bash
TSP_OPEN_DESIGN_HOME=/path/to/open-design node scripts/install-apply.js --profile full --target codex
```

脚本行为：

- 目录不存在：`git clone --depth 1 --branch main https://github.com/nexu-io/open-design.git ~/.tsp/open-design`
- 目录已存在且 origin 是 Open Design：fetch 并 checkout 最新 `main`
- `corepack` / `pnpm` 可用时：自动执行 `corepack enable` 与 `pnpm install`
- `corepack` / `pnpm` 不可用时：保留源码 checkout 并提示手动补依赖
- GitHub 拉取失败时：`full` profile 继续安装 TSP，Open Design 可在网络恢复后重试

也可以手动在独立目录中准备 Open Design：

```bash
git clone https://github.com/nexu-io/open-design.git
cd open-design
corepack enable
pnpm install
pnpm tools-dev
```

上游当前要求 Node `~24` 与 pnpm `>=10.33.2 <11`。如果本机默认 Node 版本低于要求，用 `nvm`、`fnm` 或 Volta 进入 OD 目录后再切换版本。

## TSP 主链接入

### `/team-intake`

在需求 intake 阶段补齐：

- artifact 类型：prototype、dashboard、mobile、deck、poster、document-like output。
- 受众与使用场景：销售、融资、内部评审、产品验证、实现交接。
- 品牌输入：现有 `DESIGN.md`、品牌 URL、截图、素材包、竞品参考。
- 约束：响应式范围、A11y、导出格式、真实数据要求、素材授权。

### `/team-plan`

把 Open Design 作为设计证据任务，而不是实现任务：

- `product-manager` 锁定内容和验收标准。
- `frontend-engineer` 选择 OD skill、design system 和视觉方向。
- `qa-engineer` 定义 artifact 评审清单。
- `tech-lead` 决定 OD 产物是探索、交接参考，还是实现输入。

### `/team-execute`

执行时遵循：

1. 在 OD 中创建或打开项目。
2. 导入/选择 `DESIGN.md`。
3. 选择合适 skill：例如 `web-prototype`、`dashboard`、`mobile-app`、`guizang-ppt`、`pm-spec`。
4. 生成 artifact 后记录：
   - OD skill
   - design system
   - visual direction
   - artifact/export 路径
   - 截图或预览 URL
5. 若进入代码实现，继续走本仓库 `frontend-engineering` 与 `frontend-ui-ux-system` 门禁。

### `/team-review`

评审不只看“好不好看”，必须覆盖：

- 需求覆盖：artifact 是否响应 intake 中的核心场景。
- 视觉系统：是否遵守 `DESIGN.md`，有没有随机色值、随机字体、AI 默认视觉模式。
- 响应式：桌面、平板、手机关键断点是否可用。
- 可访问性：对比度、键盘、焦点、语义结构。
- 导出完整性：HTML/PDF/PPTX/ZIP/图片/视频是否能打开，素材路径是否完整。
- 实现风险：哪些只是 demo 表现，不能直接进入生产代码。

### `/team-release`

若 OD 产物作为对外材料发布，release 记录需要包含：

- 产物版本与导出格式。
- 素材授权来源。
- 验证人和验证命令/方式。
- 回退方案：保留上一版导出或静态文件。

## Artifact 回写模板

```markdown
# Open Design Artifact Brief

## Goal

## Inputs
- TSP command:
- OD skill:
- Design system:
- Visual direction:
- Source materials:

## Outputs
- Preview/export path:
- Screenshots:
- Target format:

## Decisions
- Evidence:
- Reasoning:
- Implications:

## Review
- Responsive:
- A11y:
- Visual quality:
- Data/material authorization:
- Implementation risks:

## Next Step
```

## 与现有 TSP 能力组合

| 场景 | 推荐组合 |
|---|---|
| 先收敛视觉系统 | `frontend-ui-ux-system -> open-design design-system -> /team-plan` |
| 做高保真网页原型 | `/team-intake -> open-design web-prototype -> /team-execute` |
| 做 dashboard / admin UI | `frontend-engineering -> open-design dashboard -> browser-smoke-testing` |
| 做汇报材料 | `frontend-slides -> open-design deck mode -> /team-review` |
| 做产品文档或 PM spec | `product-manager -> open-design pm-spec -> doc-architecture` |

## 禁用项

- 不复制 Open Design 上游源码、skills、design-systems、SQLite 数据或生成项目到 TSP canonical source。
- `full` profile 可以自动 clone/update Open Design；其他 profile 不自动拉取上游源码。
- 不把 Open Design 运行时加入 TSP 默认 npm 依赖或本仓库源码树。
- 不用 OD artifact 代替 TSP 的需求、交接、评审和发布记录。
- 不在 TSP 仓库中执行可能改写 AGENTS、hooks、MCP 或 agent 全局配置的外部 setup 命令。
- 不发布未确认授权的品牌资产、字体、图片、视频或第三方截图。
