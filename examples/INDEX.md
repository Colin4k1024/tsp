# Examples Index

这份索引用来回答一个问题：项目级 `CLAUDE.md` 到底该从哪个示例开始。

职责划分：

- `project-CLAUDE.md`：完整主模板，可直接复制改造
- `saas-nextjs-CLAUDE.md`：相对主模板的前端差异指南 + 精简成品
- `springboot-service-CLAUDE.md`：相对主模板的后端差异指南 + 精简成品
- `workflow-enterprise-CLAUDE.md`：流程审批 / 权限联动型企业项目模板
- `platform-governance-CLAUDE.md`：平台治理 / 命令技能仓库模板
- `data-analytics-dashboard-CLAUDE.md`：数据看板 / 分析台项目模板
- `github-actions-supply-chain-CLAUDE.md`：GitHub Actions / 供应链治理仓库模板
- `ai-eval-platform-CLAUDE.md`：AI / Eval 平台项目模板
- `mobile-miniapp-CLAUDE.md`：移动端 / 小程序项目模板
- `iac-kubernetes-platform-CLAUDE.md`：IaC / Kubernetes 平台仓库模板
- `plugin-extension-platform-CLAUDE.md`：插件 / 扩展仓库模板
- `data-ml-pipeline-CLAUDE.md`：数据 / ML pipeline 仓库模板
- `security-compliance-platform-CLAUDE.md`：安全 / 合规平台仓库模板
- `internal-developer-platform-CLAUDE.md`：内部开发者平台模板
- `data-observability-quality-CLAUDE.md`：数据可观测性 / 质量平台模板
- `user-CLAUDE.md`：用户级偏好，不是项目级模板
- `claude-conversation-script.md`：Claude 端可直接复制的会话脚本
- `claude-scenario-playbook.md`：Claude 端按任务类型选示例的场景集
- `codex-conversation-script.md`：Codex 端可直接复制的会话脚本
- `codex-scenario-playbook.md`：Codex 端按任务类型选示例的场景集
- `enterprise-overlay-scenario-playbook.md`：自定义 overlay 扩展场景的兼容占位入口
- `enterprise-overlay-output-playbook.md`：自定义 overlay 扩展输出示例的兼容占位入口
- `role-conversation-scripts.md`：角色级高频会话脚本合集
- `project-type-starter-playbook.md`：按项目类型直接复制 Claude / Codex 起手句
- `vertical-project-conversation-scripts.md`：更垂直项目类型的连续对话脚本
- `full-lifecycle-demo.md`：完整交付生命周期演示脚本（通用审批与交付系统，覆盖 intake→plan→execute→handoff→review→release→closeout 全链路，已对齐新版主链）
- `full-lifecycle-demo-30min.md`：30 分钟深度演示版（带时间切片、主持人讲解重点、切屏顺序与问答预案）

如果你想先按命令或能力找示例，而不是按项目类型找，先看 [../docs/runbooks/command-and-capability-matrix.md](../docs/runbooks/command-and-capability-matrix.md)。

如果你想理解主模板每一段为什么这样设计，看 [../docs/runbooks/project-claude-design-rationale.md](../docs/runbooks/project-claude-design-rationale.md)。

## 快速选择

| 想体验完整链路：从需求文档到最终上线收口的全流程 | [full-lifecycle-demo.md](full-lifecycle-demo.md) | 含阶段脚本、主持人串词、重点展示 artifact，覆盖 `release` 后的 `closeout` 收口 |
| 你要正式做一场 30 分钟平台宣讲 | [full-lifecycle-demo-30min.md](full-lifecycle-demo-30min.md) | 含时间安排、讲解节奏、重点文件、问答预案，适合正式演示 |
| 你的项目类型 | 推荐起点 | 原因 |
|--------------|----------|------|
| 前后端混合、中后台平台、角色较完整 | [project-CLAUDE.md](project-CLAUDE.md) | 结构最完整，适合作为默认主模板 |
| Next.js / React / Tailwind，前端是主战场 | [saas-nextjs-CLAUDE.md](saas-nextjs-CLAUDE.md) | 这是前端差异指南，告诉你如何从主模板收缩到前端版 |
| Spring Boot / JPA / MySQL，后端是主战场 | [springboot-service-CLAUDE.md](springboot-service-CLAUDE.md) | 这是后端差异指南，告诉你如何从主模板收缩到后端版 |
| 审批流 / 工作流 / 权限联动明显的企业项目 | [workflow-enterprise-CLAUDE.md](workflow-enterprise-CLAUDE.md) | 适合长期命中 custom overlay 与发布治理的场景 |
| 命令 / skills / docs / hooks 为主的平台治理仓库 | [platform-governance-CLAUDE.md](platform-governance-CLAUDE.md) | 适合平台基建、治理和能力同步任务 |
| BI 看板 / 运营分析台 / 报表中心 | [data-analytics-dashboard-CLAUDE.md](data-analytics-dashboard-CLAUDE.md) | 适合指标口径、图表、查询性能和导出边界都很重要的项目 |
| GitHub Actions / 供应链治理仓库 | [github-actions-supply-chain-CLAUDE.md](github-actions-supply-chain-CLAUDE.md) | 适合 workflow、permissions、attestation、SBOM、签名治理 |
| AI / Eval 平台 | [ai-eval-platform-CLAUDE.md](ai-eval-platform-CLAUDE.md) | 适合 grader、pass@k、评测闭环和成本边界都很重要的项目 |
| 移动端 / 小程序项目 | [mobile-miniapp-CLAUDE.md](mobile-miniapp-CLAUDE.md) | 适合多终端适配、弱网、权限路径和交互反馈都很重要的项目 |
| IaC / Kubernetes 平台仓库 | [iac-kubernetes-platform-CLAUDE.md](iac-kubernetes-platform-CLAUDE.md) | 适合 chart、schema、policy、dry-run 与发布基线治理 |
| 插件 / 扩展仓库 | [plugin-extension-platform-CLAUDE.md](plugin-extension-platform-CLAUDE.md) | 适合宿主集成点、命令面、配置面、安装路径和兼容矩阵治理 |
| 数据 / ML pipeline 仓库 | [data-ml-pipeline-CLAUDE.md](data-ml-pipeline-CLAUDE.md) | 适合数据口径、任务编排、回填风险和质量校验都很重要的项目 |
| 安全 / 合规平台仓库 | [security-compliance-platform-CLAUDE.md](security-compliance-platform-CLAUDE.md) | 适合门禁分层、权限边界、审计证据、例外管理和放行规则治理 |
| 内部开发者平台 | [internal-developer-platform-CLAUDE.md](internal-developer-platform-CLAUDE.md) | 适合开发者入口、自助模板、平台 API、失败兜底和发布前提治理 |
| 数据可观测性 / 质量平台 | [data-observability-quality-CLAUDE.md](data-observability-quality-CLAUDE.md) | 适合规则口径、异常阈值、告警路径、误报漏报和修复闭环治理 |
| 只想配置个人默认偏好，不是配置项目 | [user-CLAUDE.md](user-CLAUDE.md) | 这是用户级配置，不是项目级模板 |
| 想直接复制 Claude 对话脚本 | [claude-conversation-script.md](claude-conversation-script.md) | 适合先跑主链和短链路示例 |
| 想按 Claude 任务类型直接选脚本 | [claude-scenario-playbook.md](claude-scenario-playbook.md) | 适合按“新功能 / 小修复 / 发布 / specialist 收口”快速起手 |
| 想直接复制 Codex 对话脚本 | [codex-conversation-script.md](codex-conversation-script.md) | 适合先跑并行编排和收口示例 |
| 想按 Codex 并行场景直接选脚本 | [codex-scenario-playbook.md](codex-scenario-playbook.md) | 适合按“前端并行 / 后端并行 / build-fix / 发布”快速起手 |
| 想快速判断是否需要自定义 overlay 扩展 | [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md) | 适合先确认任务是否依赖 custom overlay |
| 想看自定义 overlay 扩展兼容入口 | [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md) | 适合保留企业扩展入口，但不在公开仓承载内部内容 |
| 想按角色复制高频说法 | [role-conversation-scripts.md](role-conversation-scripts.md) | 适合 QA、DevOps、Tech Lead、PM、Architect |
| 想按项目类型直接复制第一段话 | [project-type-starter-playbook.md](project-type-starter-playbook.md) | 适合流程型企业项目、平台治理仓库、数据看板项目 |
| 想先体验 TDD、Harness Audit 或 runtime 能力 | [claude-scenario-playbook.md](claude-scenario-playbook.md) / [codex-scenario-playbook.md](codex-scenario-playbook.md) | 适合按能力而不是按项目类型起手 |

## 选择信号

- 如果你不确定应该删掉哪些角色、哪些命令、哪些约束，先从 [project-CLAUDE.md](project-CLAUDE.md) 开始
- 如果你知道项目明显是前端主导，再看 [saas-nextjs-CLAUDE.md](saas-nextjs-CLAUDE.md)
- 如果你知道项目明显是后端主导，再看 [springboot-service-CLAUDE.md](springboot-service-CLAUDE.md)
- 如果你还不理解每个章节存在的目的，先看 [../docs/runbooks/project-claude-design-rationale.md](../docs/runbooks/project-claude-design-rationale.md)

## 推荐学习路径

### 路径 A：第一次接入全栈项目

1. 先看完整链路演示 [full-lifecycle-demo.md](full-lifecycle-demo.md)，在真实业务场景中感受每个阶段的输入、输出和演示顺序
2. 如果你要对内正式讲解，再补看 [full-lifecycle-demo-30min.md](full-lifecycle-demo-30min.md)
3. 再看 [../docs/runbooks/project-claude-design-rationale.md](../docs/runbooks/project-claude-design-rationale.md)
4. 再复制和改造 [project-CLAUDE.md](project-CLAUDE.md)
5. 然后回到 [../docs/runbooks/project-onboarding.md](../docs/runbooks/project-onboarding.md)

### 路径 B：前端主导项目

1. 先看 [saas-nextjs-CLAUDE.md](saas-nextjs-CLAUDE.md)
2. 如果发现后端或发布约束开始变重，再回退到 [project-CLAUDE.md](project-CLAUDE.md)

### 路径 C：后端主导项目

1. 先看 [springboot-service-CLAUDE.md](springboot-service-CLAUDE.md)
2. 如果后续前端交付变重，再补充通用版中的前端门禁和角色链路

### 路径 D：自定义 overlay 扩展场景

1. 先看 [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md)
2. 再看 [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md)
3. 最后再回到 [project-CLAUDE.md](project-CLAUDE.md) 或你的项目模板，把长期有效的 overlay 约束并回项目级配置

### 路径 E：流程型企业项目

1. 先看 [workflow-enterprise-CLAUDE.md](workflow-enterprise-CLAUDE.md)
2. 再补看 [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md)
3. 如果发布与观察要求较重，再看 [../docs/runbooks/custom-overlay.md](../docs/runbooks/custom-overlay.md)

### 路径 F：平台治理仓库

1. 先看 [platform-governance-CLAUDE.md](platform-governance-CLAUDE.md)
2. 再看 [../docs/runbooks/command-and-capability-matrix.md](../docs/runbooks/command-and-capability-matrix.md)
3. 最后按 [../docs/runbooks/platform-capability-demo-script.md](../docs/runbooks/platform-capability-demo-script.md) 跑一次演示链路

### 路径 G：数据看板项目

1. 先看 [data-analytics-dashboard-CLAUDE.md](data-analytics-dashboard-CLAUDE.md)
2. 如果前端权重更高但查询复杂度一般，再回到 [saas-nextjs-CLAUDE.md](saas-nextjs-CLAUDE.md)
3. 如果后端查询或聚合逻辑明显更重，再补 [springboot-service-CLAUDE.md](springboot-service-CLAUDE.md)

### 路径 H：GitHub Actions / 供应链治理仓库

1. 先看 [github-actions-supply-chain-CLAUDE.md](github-actions-supply-chain-CLAUDE.md)
2. 再看 [vertical-project-conversation-scripts.md](vertical-project-conversation-scripts.md)
3. 最后按 [../docs/runbooks/actionlint-workflow-gates.md](../docs/runbooks/actionlint-workflow-gates.md) 和 [../docs/runbooks/scorecard-supply-chain-gates.md](../docs/runbooks/scorecard-supply-chain-gates.md) 继续细化

### 路径 I：AI / Eval 平台

1. 先看 [ai-eval-platform-CLAUDE.md](ai-eval-platform-CLAUDE.md)
2. 再看 [vertical-project-conversation-scripts.md](vertical-project-conversation-scripts.md)
3. 如果要解释命令和 runtime 的配合，再看 [../docs/runbooks/ecc-harness-usage.md](../docs/runbooks/ecc-harness-usage.md)

### 路径 J：移动端 / 小程序项目

1. 先看 [mobile-miniapp-CLAUDE.md](mobile-miniapp-CLAUDE.md)
2. 再看 [vertical-project-conversation-scripts.md](vertical-project-conversation-scripts.md)
3. 如果只是普通 Web 响应式页面，再回到 [saas-nextjs-CLAUDE.md](saas-nextjs-CLAUDE.md)

### 路径 K：IaC / Kubernetes 平台仓库

1. 先看 [iac-kubernetes-platform-CLAUDE.md](iac-kubernetes-platform-CLAUDE.md)
2. 再看 [project-type-starter-playbook.md](project-type-starter-playbook.md)
3. 如果要按现有 demo 成熟度决定讲解顺序，再看 [../docs/presentation/vertical-scenario-route-map.md](../docs/presentation/vertical-scenario-route-map.md)

### 路径 L：插件 / 扩展仓库

1. 先看 [plugin-extension-platform-CLAUDE.md](plugin-extension-platform-CLAUDE.md)
2. 再看 [project-type-starter-playbook.md](project-type-starter-playbook.md)
3. 如果当前仓库本身还是平台治理仓库，再补 [platform-governance-CLAUDE.md](platform-governance-CLAUDE.md)

### 路径 M：数据 / ML pipeline 仓库

1. 先看 [data-ml-pipeline-CLAUDE.md](data-ml-pipeline-CLAUDE.md)
2. 再看 [project-type-starter-playbook.md](project-type-starter-playbook.md)
3. 如果项目更偏结果评测和 agent 基线，再补 [ai-eval-platform-CLAUDE.md](ai-eval-platform-CLAUDE.md)

### 路径 N：安全 / 合规平台仓库

1. 先看 [security-compliance-platform-CLAUDE.md](security-compliance-platform-CLAUDE.md)
2. 再看 [project-type-starter-playbook.md](project-type-starter-playbook.md)
3. 如果要按治理演示顺序或 demo 完整度决定入口，再看 [../docs/presentation/vertical-scenario-route-map.md](../docs/presentation/vertical-scenario-route-map.md) 和 [../docs/runbooks/vertical-scenario-capability-matrix.md](../docs/runbooks/vertical-scenario-capability-matrix.md)

### 路径 O：内部开发者平台

1. 先看 [internal-developer-platform-CLAUDE.md](internal-developer-platform-CLAUDE.md)
2. 再看 [project-type-starter-playbook.md](project-type-starter-playbook.md)
3. 如果当前仓库还承担平台治理职责，再补 [platform-governance-CLAUDE.md](platform-governance-CLAUDE.md)

### 路径 P：数据可观测性 / 质量平台

1. 先看 [data-observability-quality-CLAUDE.md](data-observability-quality-CLAUDE.md)
2. 再看 [project-type-starter-playbook.md](project-type-starter-playbook.md)
3. 如果项目更偏数据任务编排和回填，再补 [data-ml-pipeline-CLAUDE.md](data-ml-pipeline-CLAUDE.md)

## 三类示例的核心差异

| 维度 | 通用版 | 前端版 | 后端版 |
|------|--------|--------|--------|
| 默认角色 | 更完整 | 更偏前端 | 更偏后端 |
| 默认命令流 | 主链完整 | 更强调 `/multi-frontend` | 更强调 `/multi-backend` |
| 默认技能装配 | shared + 前后端 + 通用专项 | shared + 前端专项 | shared + 后端专项 |
| custom overlay | 默认关闭，按任务判断 | 默认关闭，通常较少启用 | 默认关闭，但更可能命中流程或权限场景 |

补充理解：

- `workflow-enterprise-CLAUDE.md` 更强调 custom overlay 判断、发布观察和完整主链
- `platform-governance-CLAUDE.md` 更强调 `/tdd`、`/harness-audit` 和文档一致性
- `data-analytics-dashboard-CLAUDE.md` 更强调指标口径、图表交互、查询性能和导出边界
- `github-actions-supply-chain-CLAUDE.md` 更强调 workflow 门禁、token 权限、provenance 与发布证据链
- `ai-eval-platform-CLAUDE.md` 更强调 grader、pass@k、eval 回归和成本边界
- `mobile-miniapp-CLAUDE.md` 更强调终端差异、弱网、授权路径和交互反馈
- `iac-kubernetes-platform-CLAUDE.md` 更强调 chart、schema、policy、dry-run 和发布基线的分层验证
- `plugin-extension-platform-CLAUDE.md` 更强调宿主集成点、命令面、配置面、安装路径和兼容矩阵
- `data-ml-pipeline-CLAUDE.md` 更强调数据口径、任务窗口、质量校验、回填风险和结果追溯
- `security-compliance-platform-CLAUDE.md` 更强调风险分层、权限边界、例外管理、审计证据和放行结论
- `internal-developer-platform-CLAUDE.md` 更强调开发者入口、模板行为、失败兜底、人工介入和发布前提
- `data-observability-quality-CLAUDE.md` 更强调规则口径、异常阈值、告警有效性、误报漏报和修复责任

## 使用注意

- `user-CLAUDE.md` 只放个人偏好，不放项目事实
- `project-claude-design-rationale.md` 用于学习，不建议把设计说明直接放进项目根目录
- `saas-nextjs-CLAUDE.md` 和 `springboot-service-CLAUDE.md` 不是完全独立世界，它们是在通用版基础上做场景化收缩
- 所有项目级模板都建议保留主链收口角色，不要只剩 specialist

## 会话脚本入口

- Claude 直接开跑：看 [claude-conversation-script.md](claude-conversation-script.md)
- Claude 按场景选：看 [claude-scenario-playbook.md](claude-scenario-playbook.md)
- Codex 直接开跑：看 [codex-conversation-script.md](codex-conversation-script.md)
- Codex 按场景选：看 [codex-scenario-playbook.md](codex-scenario-playbook.md)
- 自定义 overlay 扩展兼容入口：看 [enterprise-overlay-scenario-playbook.md](enterprise-overlay-scenario-playbook.md)
- 自定义 overlay 扩展输出兼容入口：看 [enterprise-overlay-output-playbook.md](enterprise-overlay-output-playbook.md)
- 按角色补局部收口：看 [role-conversation-scripts.md](role-conversation-scripts.md)
- 按项目类型直接复制起手句：看 [project-type-starter-playbook.md](project-type-starter-playbook.md)
- 按更垂直项目类型复制连续脚本：看 [vertical-project-conversation-scripts.md](vertical-project-conversation-scripts.md)
- 按材料成熟度或讲解目标选 vertical 场景：看 [../docs/presentation/vertical-scenario-route-map.md](../docs/presentation/vertical-scenario-route-map.md)
- 按表格查看 vertical 场景材料覆盖：看 [../docs/runbooks/vertical-scenario-capability-matrix.md](../docs/runbooks/vertical-scenario-capability-matrix.md)

## 按能力找示例

- 想从 `/tdd` 起手：先看 [claude-scenario-playbook.md](claude-scenario-playbook.md) 和 [codex-scenario-playbook.md](codex-scenario-playbook.md)
- 想用 `/harness-audit` 做平台自检：先看 [claude-scenario-playbook.md](claude-scenario-playbook.md) 和 [codex-scenario-playbook.md](codex-scenario-playbook.md)
- 想理解 observation、cost、budget、compact 这些后台机制：先看 [../docs/runbooks/runtime-capabilities-overview.md](../docs/runbooks/runtime-capabilities-overview.md)
- 想做一场专门讲新增能力的演示：看 [../docs/runbooks/platform-capability-demo-script.md](../docs/runbooks/platform-capability-demo-script.md) 和 [../docs/runbooks/platform-capability-demo-execution-log.md](../docs/runbooks/platform-capability-demo-execution-log.md)
- 想直接复用 vertical 场景的 demo 台账：看 [../docs/runbooks/github-actions-supply-chain-demo-execution-log.md](../docs/runbooks/github-actions-supply-chain-demo-execution-log.md)、[../docs/runbooks/ai-eval-platform-demo-execution-log.md](../docs/runbooks/ai-eval-platform-demo-execution-log.md)、[../docs/runbooks/mobile-miniapp-demo-execution-log.md](../docs/runbooks/mobile-miniapp-demo-execution-log.md)
- 想直接照着讲 vertical 场景 demo：看 [../docs/runbooks/github-actions-supply-chain-demo-script.md](../docs/runbooks/github-actions-supply-chain-demo-script.md)、[../docs/runbooks/ai-eval-platform-demo-script.md](../docs/runbooks/ai-eval-platform-demo-script.md)、[../docs/runbooks/mobile-miniapp-demo-script.md](../docs/runbooks/mobile-miniapp-demo-script.md)
- 想直接复用更多 vertical 场景的 demo 台账：看 [../docs/runbooks/iac-kubernetes-platform-demo-execution-log.md](../docs/runbooks/iac-kubernetes-platform-demo-execution-log.md)、[../docs/runbooks/plugin-extension-platform-demo-execution-log.md](../docs/runbooks/plugin-extension-platform-demo-execution-log.md)、[../docs/runbooks/data-ml-pipeline-demo-execution-log.md](../docs/runbooks/data-ml-pipeline-demo-execution-log.md)
- 想直接照着讲更多 vertical 场景 demo：看 [../docs/runbooks/iac-kubernetes-platform-demo-script.md](../docs/runbooks/iac-kubernetes-platform-demo-script.md)、[../docs/runbooks/plugin-extension-platform-demo-script.md](../docs/runbooks/plugin-extension-platform-demo-script.md)、[../docs/runbooks/data-ml-pipeline-demo-script.md](../docs/runbooks/data-ml-pipeline-demo-script.md)
- 想直接复用新增 vertical 场景的 demo 台账：看 [../docs/runbooks/security-compliance-platform-demo-execution-log.md](../docs/runbooks/security-compliance-platform-demo-execution-log.md)、[../docs/runbooks/internal-developer-platform-demo-execution-log.md](../docs/runbooks/internal-developer-platform-demo-execution-log.md)、[../docs/runbooks/data-observability-quality-demo-execution-log.md](../docs/runbooks/data-observability-quality-demo-execution-log.md)
- 想直接照着讲新增 vertical 场景 demo：看 [../docs/runbooks/security-compliance-platform-demo-script.md](../docs/runbooks/security-compliance-platform-demo-script.md)、[../docs/runbooks/internal-developer-platform-demo-script.md](../docs/runbooks/internal-developer-platform-demo-script.md)、[../docs/runbooks/data-observability-quality-demo-script.md](../docs/runbooks/data-observability-quality-demo-script.md)
