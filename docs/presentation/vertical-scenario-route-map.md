# Vertical Scenario Route Map

这份导览页回答两个问题：现在有哪些 vertical 场景已经有完整演示闭环，哪些还处在“模板 + 起手句 + 连续脚本”阶段，以及 presentation / onboarding 应该先带用户看哪一层。

## 1. 使用方式

- 如果你在做 onboarding，先看“按成熟度选择”
- 如果你在做汇报或演示，先看“按讲解目标选择”
- 如果你在补仓库文档，先看“按材料层次选择”

## 2. 按成熟度选择

### 已具备完整 demo 闭环

这些场景已经具备模板、起手句 / 连续脚本、walkthrough、demo script、execution log：

- GitHub Actions / 供应链治理
- AI / Eval 平台
- 移动端 / 小程序交付
- IaC / Kubernetes 平台仓库
- 插件 / 扩展仓库
- 数据 / ML pipeline 仓库
- 安全 / 合规平台仓库
- 内部开发者平台
- 数据可观测性 / 质量平台

推荐入口：

- [../runbooks/github-actions-supply-chain-demo-script.md](../runbooks/github-actions-supply-chain-demo-script.md)
- [../runbooks/ai-eval-platform-demo-script.md](../runbooks/ai-eval-platform-demo-script.md)
- [../runbooks/mobile-miniapp-demo-script.md](../runbooks/mobile-miniapp-demo-script.md)
- [../runbooks/iac-kubernetes-platform-demo-script.md](../runbooks/iac-kubernetes-platform-demo-script.md)
- [../runbooks/plugin-extension-platform-demo-script.md](../runbooks/plugin-extension-platform-demo-script.md)
- [../runbooks/data-ml-pipeline-demo-script.md](../runbooks/data-ml-pipeline-demo-script.md)
- [../runbooks/security-compliance-platform-demo-script.md](../runbooks/security-compliance-platform-demo-script.md)
- [../runbooks/internal-developer-platform-demo-script.md](../runbooks/internal-developer-platform-demo-script.md)
- [../runbooks/data-observability-quality-demo-script.md](../runbooks/data-observability-quality-demo-script.md)

## 3. 按讲解目标选择

### 目标：讲平台能力升级

- 先看 [../runbooks/platform-capability-demo-script.md](../runbooks/platform-capability-demo-script.md)
- 再看 [../runbooks/platform-capability-demo-execution-log.md](../runbooks/platform-capability-demo-execution-log.md)

### 目标：讲 brownfield 结构扫描与知识图谱证据

- 先看 [../runbooks/graphify-knowledge-graph-usage.md](../runbooks/graphify-knowledge-graph-usage.md)
- 再结合 [../runbooks/project-onboarding.md](../runbooks/project-onboarding.md) 的接入判定
- 再回到 [../runbooks/command-and-capability-matrix.md](../runbooks/command-and-capability-matrix.md) 的推荐组合链路

### 目标：讲一个具体 vertical 如何跑通

- 供应链治理：看 [../runbooks/github-actions-supply-chain-demo-script.md](../runbooks/github-actions-supply-chain-demo-script.md)
- AI / Eval：看 [../runbooks/ai-eval-platform-demo-script.md](../runbooks/ai-eval-platform-demo-script.md)
- 移动端：看 [../runbooks/mobile-miniapp-demo-script.md](../runbooks/mobile-miniapp-demo-script.md)
- IaC / Kubernetes：看 [../runbooks/iac-kubernetes-platform-demo-script.md](../runbooks/iac-kubernetes-platform-demo-script.md)
- 插件 / 扩展：看 [../runbooks/plugin-extension-platform-demo-script.md](../runbooks/plugin-extension-platform-demo-script.md)
- 数据 / ML pipeline：看 [../runbooks/data-ml-pipeline-demo-script.md](../runbooks/data-ml-pipeline-demo-script.md)
- 安全 / 合规：看 [../runbooks/security-compliance-platform-demo-script.md](../runbooks/security-compliance-platform-demo-script.md)
- 内部开发者平台：看 [../runbooks/internal-developer-platform-demo-script.md](../runbooks/internal-developer-platform-demo-script.md)
- 数据可观测性 / 质量平台：看 [../runbooks/data-observability-quality-demo-script.md](../runbooks/data-observability-quality-demo-script.md)

### 目标：讲“新接入项目该从哪个模板开始” 

- 先看 [../../examples/INDEX.md](../../examples/INDEX.md)
- 再看 [../../examples/project-type-starter-playbook.md](../../examples/project-type-starter-playbook.md)

## 4. 按材料层次选择

### 只想找项目模板

- 看 [../../examples/INDEX.md](../../examples/INDEX.md)

### 想直接复制第一句话

- 看 [../../examples/project-type-starter-playbook.md](../../examples/project-type-starter-playbook.md)

### 想直接复制一段连续脚本

- 看 [../../examples/vertical-project-conversation-scripts.md](../../examples/vertical-project-conversation-scripts.md)

### 想照着讲一场演示

- 看 [../runbooks/platform-capability-demo-script.md](../runbooks/platform-capability-demo-script.md)
- 或任一 vertical demo script，再结合 [../runbooks/vertical-scenario-capability-matrix.md](../runbooks/vertical-scenario-capability-matrix.md) 选路径

### 想拿复盘 / 同步材料

- 看各类 execution log

## 5. Onboarding 建议顺序

1. 先用 [../../examples/INDEX.md](../../examples/INDEX.md) 选项目类型
2. 再用 [../../examples/project-type-starter-playbook.md](../../examples/project-type-starter-playbook.md) 复制起手句
3. 如果场景已具备完整 demo 闭环，再直接复用对应 demo script
4. 如果要先确认材料是否完整，再查 [../runbooks/vertical-scenario-capability-matrix.md](../runbooks/vertical-scenario-capability-matrix.md)
5. 如果只是选项目模板，再回到 quick start 和 onboarding 路径接入
6. 如果项目是 brownfield 且结构复杂，先执行 Graphify 预检查与结构扫描，再进入 `/team-plan`
