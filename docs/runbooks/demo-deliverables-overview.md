# 用户积分等级系统 - 产出清单

> 本文档说明基于示例需求，整个工程会产生什么内容。
> 场景：用户积分等级系统（4周交付）

---

## 一、最终交付物（结果）

### 1. 代码产物

| 类别 | 交付物 | 位置 |
|------|--------|------|
| 后端服务 | 积分微服务（Spring Boot） | `points-service/` |
| 数据库 | MySQL Schema + 迁移脚本 | `points-service/src/main/resources/db/` |
| 前端应用 | 积分页面（React + TypeScript） | `points-frontend/` |
| 契约 | API 契约文档 | `contracts/points-api.yaml` |
| 测试 | 单元测试、集成测试、E2E | `**/*Test.java`, `**/*.test.ts` |

### 2. 部署产物

| 交付物 | 说明 |
|--------|------|
| Docker 镜像 | `points-service:latest` |
| Helm Chart | `points-service-1.0.0.tgz` |
| SBOM | `points-service-sbom.json` |
| SLSA 证明 | `points-service.intoto.jsonl` |
| 容器镜像签名 | `points-service.sig` |

### 3. 安全产物

| 交付物 | 说明 |
|--------|------|
| CodeQL 分析报告 | `reports/codeql.md` |
| Secret 扫描结果 | `reports/secret-scan.json` |
| Trivy 漏洞报告 | `reports/trivy.json` |
| 依赖审查报告 | `reports/dependency-review.md` |

---

## 二、过程中的产物（中间产出）

### 阶段 1: /team-intake

**产出**：
```
📄 需求简报 (intake-brief.md)
   - 目标: 提升用户活跃度 10%
   - 范围: 积分获取、等级展示（MVP）
   - 约束: 4 周，与用户中心对接

📋 参与角色清单
   - tech-lead, product-manager, architect, ...

📝 待确认项列表
   - 用户中心 API 接入时间？
   - 积分兑换是否本期？
```

### 阶段 2: /team-plan

**产出**：
```
📄 交付计划 (delivery-plan.md)
   - 任务分解: T1-T10
   - 里程碑: M1-M4
   - 依赖关系图

📊 角色分工表
   - backend-engineer: T3, T4, T5
   - frontend-engineer: T6, T7
   - qa-engineer: T8, T9

⚠️ 风险台账
   - 用户中心 API 延期 (中/高)
   - 前端复杂度超预期 (低/中)

📑 ADR-001 (架构决策记录)
   - 决策: 事件驱动解耦
   - 证据: 订单系统 QPS 高
   - 影响: 需要补偿机制
```

### 阶段 3: /handoff（角色间交接）

**产出**（每次交接）：
```
🔄 Architect → Backend Engineer
   📦 输入: ADR-001, API 契约, 数据库设计
   📤 输出: 积分获取 API, 等级计算 API
   ⚠️ 风险: 需要 Mock 用户中心 API

🔄 Backend Engineer → QA Engineer
   📦 输入: API 实现, 自测报告
   📤 输出: 测试用例, 集成测试结果
   ⚠️ 风险: 事件补偿机制复杂

🔄 Frontend Engineer → QA Engineer
   📦 输入: 积分页面, 组件文档
   📤 输出: E2E 用例, A11y 报告
   ⚠️ 风险: Safari 兼容问题
```

### 阶段 4: /team-execute

**产出**：

#### Backend Engineer
```
📂 积分服务代码
   ├── PointsService.java       # 业务逻辑
   ├── PointsController.java    # REST API
   ├── PointsRepository.java    # 数据访问
   ├── LevelCalculator.java      # 等级计算
   └── PointsEventConsumer.java # 事件消费

📊 自测报告
   ├── API 响应时间: P99 < 50ms ✅
   ├── 幂等性测试: 通过 ✅
   └── 并发测试: 100并发无竞争 ✅
```

#### Frontend Engineer
```
📂 积分页面代码
   ├── PointsPage.tsx          # 积分主页
   ├── LevelBadge.tsx          # 等级徽章
   ├── PointsHistory.tsx        # 积分历史
   └── usePoints.ts            # 状态 Hook

📊 自测报告
   ├── 响应式: 320px-1920px ✅
   ├── A11y: WCAG 2.1 AA ✅
   └── 性能: LCP < 2.5s ✅
```

### 阶段 5: /team-review

**产出**：
```
📋 测试报告
   ├── 契约测试: 24用例 / 100%通过
   ├── 单元测试: 156用例 / 85%覆盖
   ├── 集成测试: 32用例 / 80%覆盖
   ├── E2E测试: 18用例 / 核心路径
   └── 性能测试: 8场景 / 峰值验证

🐛 问题清单
   ├── [高] 并发扣减竞争条件 → 已修复
   ├── [中] 等级边界计算错误 → 已修复
   └── [低] Safari 响应式问题 → 已修复

📈 质量评估
   ├── 代码覆盖率: 78%
   ├── 阻塞项: 0
   └── 放行建议: ✅ 可以发布
```

### 阶段 6: /team-release

**产出**：
```
📦 发布包
   ├── points-service-1.0.0.docker
   ├── points-frontend-1.0.0.tar.gz
   └── helm-chart-1.0.0.tgz

✅ 发布检查清单
   ├── SLSA Level 2 ✅
   ├── SBOM 生成 ✅
   ├── 镜像签名 ✅
   ├── 回滚方案验证 ✅
   └── 监控告警配置 ✅

📝 发布报告
   ├── 18:00 开始灰度 5%
   ├── 18:08 扩至 50%
   ├── 18:15 全量发布
   └── 18:18 发布完成
```

---

## 三、记忆与经验沉淀

### Memory Store（~/.claude/memory/）

```
📂 sessions/
   └── session_积分系统Demo.json
       ├── tasks_completed: ["架构设计", "API开发", ...]
       ├── decisions: [ADR-001, MVP策略, ...]
       ├── pending_items: ["积分兑换下期", ...]
       └── key_findings: ["事件驱动可行", ...]

📂 error_experience/
   └── patterns/
       └── points-concurrent-race.json  # 错误经验
           ├── root_cause: "Missing optimistic locking"
           ├── solution: "Add @Version column"
           └── success_count: 1
```

---

## 四、产出汇总图

```
┌─────────────────────────────────────────────────────────────────┐
│                        最终交付物                                  │
├─────────────────────────────────────────────────────────────────┤
│  代码: points-service/, points-frontend/                        │
│  部署: Docker镜像, Helm Chart, SBOM, SLSA                      │
│  安全: CodeQL报告, Secret扫描, Trivy报告                        │
│  文档: API契约, 测试报告, 发布报告                               │
└─────────────────────────────────────────────────────────────────┘
                                ↑
                    ┌───────────┴───────────┐
                    │      /team-release     │
                    │    DevOps Engineer     │
                    └───────────┬───────────┘
                                ↑
┌─────────────────────────────────────────────────────────────────┐
│                      过程产物                                     │
├─────────────────────────────────────────────────────────────────┤
│  /team-intake  → intake-brief.md, 待确认项清单                  │
│  /team-plan    → delivery-plan.md, ADR-001, 风险台账            │
│  /handoff      → 交接契约 × N (角色间每对交接)                  │
│  /team-execute → 代码, 自测报告                                  │
│  /team-review  → 测试报告, 问题清单, 质量评估                   │
│  /team-release → 发布清单, 检查报告                              │
└─────────────────────────────────────────────────────────────────┘
                                ↑
                    ┌───────────┴───────────┐
                    │     Memory Store     │
                    │  session summary     │
                    │  error patterns      │
                    │  decisions snapshot  │
                    └─────────────────────┘
```

---

## 五、一句话总结

| 阶段 | 主导角色 | 产生什么 |
|------|---------|---------|
| Intake | tech-lead | **需求简报** - 锁定目标、范围、MVP |
| Plan | tech-lead | **交付计划** - 任务分解、里程碑、ADR |
| Handoff | tech-lead | **交接契约** - 输入输出风险明确 |
| Execute | frontend/backend | **代码+自测** - 可运行可验证的代码 |
| Review | qa-engineer | **测试报告** - 质量评估+放行建议 |
| Release | devops-engineer | **发布包** - 可部署+可回滚+可观测 |

**整个工程的核心价值**：每一步都产出文档化的中间产物，确保可追溯、可审查、可复用。

---

## 六、平台能力升级版 Demo 材料

如果你当前要讲的不是业务系统交付，而是“平台最近新增了哪些命令、skills、runtime 和文档入口”，请不要只用积分系统这个业务 demo。改为搭配下面这组材料：

- [platform-capability-demo-script.md](platform-capability-demo-script.md)：面向讲解人的逐步演示剧本
- [platform-capability-demo-execution-log.md](platform-capability-demo-execution-log.md)：面向团队同步或复盘的执行记录
- [github-actions-supply-chain-demo-execution-log.md](github-actions-supply-chain-demo-execution-log.md)：GitHub Actions 与供应链治理场景的 execution log
- [ai-eval-platform-demo-execution-log.md](ai-eval-platform-demo-execution-log.md)：AI / Eval 平台场景的 execution log
- [mobile-miniapp-demo-execution-log.md](mobile-miniapp-demo-execution-log.md)：移动端 / 小程序交付场景的 execution log
- [iac-kubernetes-platform-demo-execution-log.md](iac-kubernetes-platform-demo-execution-log.md)：IaC / Kubernetes 平台场景的 execution log
- [plugin-extension-platform-demo-execution-log.md](plugin-extension-platform-demo-execution-log.md)：插件 / 扩展平台场景的 execution log
- [data-ml-pipeline-demo-execution-log.md](data-ml-pipeline-demo-execution-log.md)：数据 / ML pipeline 场景的 execution log
- [github-actions-supply-chain-demo-script.md](github-actions-supply-chain-demo-script.md)：GitHub Actions 与供应链治理场景的逐步演示剧本
- [ai-eval-platform-demo-script.md](ai-eval-platform-demo-script.md)：AI / Eval 平台场景的逐步演示剧本
- [mobile-miniapp-demo-script.md](mobile-miniapp-demo-script.md)：移动端 / 小程序交付场景的逐步演示剧本
- [iac-kubernetes-platform-demo-script.md](iac-kubernetes-platform-demo-script.md)：IaC / Kubernetes 平台场景的逐步演示剧本
- [plugin-extension-platform-demo-script.md](plugin-extension-platform-demo-script.md)：插件 / 扩展平台场景的逐步演示剧本
- [data-ml-pipeline-demo-script.md](data-ml-pipeline-demo-script.md)：数据 / ML pipeline 场景的逐步演示剧本
- [command-and-capability-matrix.md](command-and-capability-matrix.md)：命令与能力全景图
- [runtime-capabilities-overview.md](runtime-capabilities-overview.md)：runtime 后台机制说明
