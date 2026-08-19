# Loop Engineering Phase 2-5 实现设计方案

Status: in-progress  
Role: backend-engineer  
Date: 2026-07-21  

## 一、接口契约设计

### 1.1 Loop Spec Schema（已有，需补全）

现有 `schemas/loop-spec.schema.json` 和 `scripts/lib/loop-spec.js` 已覆盖核心字段。需补全的增量：

**新增字段（向下兼容）：**

```json
{
  "loop": {
    "automation": {
      "type": "object",
      "properties": {
        "adapter": { "type": "string", "enum": ["dsh-cordis", "claude-cron", "codex-thread", "opencode-cli", "github-actions"] },
        "enabled": { "type": "boolean", "default": true },
        "onMissedRun": { "type": "string", "enum": ["skip", "catch-up", "triage"], "default": "triage" }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "acceptedChangeRateMin": { "type": "number", "default": 0.5 },
        "reviewWindowHours": { "type": "number", "default": 48 }
      }
    }
  }
}
```

**Intake 判定接口：**

```javascript
/**
 * 四项准入条件检查结果
 * @typedef {Object} IntakeResult
 * @property {boolean} eligible - 是否全部通过
 * @property {boolean} taskRepeats - 任务是否重复发生
 * @property {boolean} automatedVerification - 是否有可执行的自动验证
 * @property {boolean} budgetDefined - 是否有预算上限
 * @property {boolean} toolAccessBounded - 权限是否受限
 * @property {string[]} blockers - 未通过条件的说明
 * @property {string} recommendedAlternative - 不通过时的推荐命令
 */

/**
 * 对 loop spec 做四项准入检查
 * @param {Object} spec - 已解析的 loop spec
 * @param {Object} [context] - 运行时上下文
 * @param {string} [context.projectRoot] - 项目根目录
 * @param {string} [context.target] - 目标平台
 * @returns {IntakeResult}
 */
function checkIntake(spec, context) { ... }
```

### 1.2 State Store API（已有，需增强）

现有 `loop-state-store.js` 提供基础 CRUD。以下为增量 API 设计：

```javascript
// ============ 新增 API ============

/**
 * 获取 loop 级别的指标汇总
 * @param {string} loopId - loop 标识
 * @param {Object} [options] - 状态目录选项
 * @returns {LoopMetrics}
 * @typedef {Object} LoopMetrics
 * @property {string} loopId
 * @property {number} totalIterations - 总迭代次数（所有关联 goal）
 * @property {number} acceptedChanges - 被接受的变更数
 * @property {number} gatePasses - 门禁通过次数
 * @property {number} gateFailures - 门禁失败次数
 * @property {number} humanInterventions - 人工干预次数
 * @property {number} reworkIterations - 返工轮次数
 * @property {number} acceptedChangeRate - acceptedChanges / totalChanges
 * @property {number} costPerAcceptedChange - 总成本 / acceptedChanges
 * @property {string} lastRunAt - 最近运行时间
 * @property {string} nextScheduledAt - 下次计划运行时间
 */
function getLoopMetrics(loopId, options = {}) { ... }

/**
 * 列出所有活跃 loop 的摘要
 * @param {Object} [options]
 * @returns {LoopSummary[]}
 * @typedef {Object} LoopSummary
 * @property {string} loopId
 * @property {string} state - 'running' | 'paused' | 'escalated' | 'completed'
 * @property {number} activeGoalCount
 * @property {number} pendingTriageCount
 * @property {Object} budget - 剩余预算
 * @property {string} lastActivity
 */
function listLoopSummaries(options = {}) { ... }

/**
 * 原子性地记录一次 gate 执行结果
 * @param {string} loopId
 * @param {GateRunRecord} record
 * @returns {string} 写入路径
 * @typedef {Object} GateRunRecord
 * @property {string} gateName
 * @property {boolean} passed
 * @property {string} output - 输出摘要（截断到 500 字符）
 * @property {number} durationMs
 * @property {string} timestamp - ISO 8601
 */
function recordGateRun(loopId, record, options = {}) { ... }

/**
 * 读取 triage inbox 中指定状态的条目
 * @param {Object} filter
 * @param {string} [filter.status] - 'pending' | 'acted' | 'dismissed'
 * @param {string} [filter.severity] - 'high' | 'medium' | 'low'
 * @returns {TriageItem[]}
 */
function listTriageItems(filter = {}, options = {}) { ... }

/**
 * 更新 triage 条目状态
 * @param {string} itemId
 * @param {string} action - 'goal' | 'defer' | 'dismiss'
 * @param {Object} [metadata]
 * @returns {boolean} 是否成功
 */
function actOnTriageItem(itemId, action, metadata = {}, options = {}) { ... }
```

### 1.3 Scheduler Adapter Interface

这是 Phase 5 的核心契约。不同 target 的调度方式完全不同，但必须共享同一个 interface：

```javascript
/**
 * @typedef {Object} SchedulerAdapter
 * @property {string} target - 目标平台标识
 * @property {string} name - 人类可读名称
 *
 * @property {(spec: LoopSpec, options?: SchedulerOptions) => ScheduleResult} schedule
 *   - 注册周期调度。返回调度标识，不保证立即执行。
 *
 * @property {(scheduleId: string) => UnscheduleResult} unschedule
 *   - 取消已注册的调度。
 *
 * @property {(scheduleId: string) => ScheduleStatus} getStatus
 *   - 查询调度状态和下次运行时间。
 *
 * @property {() => boolean} isAvailable
 *   - 当前环境是否支持此 adapter。
 *
 * @property {(spec: LoopSpec) => Promise<SingleRunResult>} runOnce
 *   - 立即执行一次循环（用于 dry-run 和手工验证）。
 *
 * @typedef {Object} SchedulerOptions
 * @property {boolean} [safeMode] - 安全模式：每次只处理一个发现
 * @property {string} [branchPrefix] - 分支前缀
 * @property {number} [timeoutMs] - 单次运行超时
 *
 * @typedef {Object} ScheduleResult
 * @property {boolean} success
 * @property {string} scheduleId - 调度标识
 * @property {string} message - 人类可读说明
 * @property {string} [nextRunAt] - 下次运行时间
 * @property {string} [warning] - 非致命告警
 *
 * @typedef {Object} UnscheduleResult
 * @property {boolean} success
 * @property {string} message
 *
 * @typedef {Object} ScheduleStatus
 * @property {string} scheduleId
 * @property {boolean} active
 * @property {string} [lastRunAt]
 * @property {string} [nextRunAt]
 * @property {number} totalRuns
 * @property {number} failedRuns
 *
 * @typedef {Object} SingleRunResult
 * @property {string} status - 'all_clear' | 'issues_found' | 'error'
 * @property {Object[]} findings
 * @property {string} summary
 */

/** @type {SchedulerAdapter} */
const adapter = {
  target: 'dsh-cordis',
  name: 'DSH Cordis Plugin Scheduler',
  schedule(spec, options) { ... },
  unschedule(scheduleId) { ... },
  getStatus(scheduleId) { ... },
  isAvailable() { ... },
  runOnce(spec) { ... },
};
```

---

## 二、DSH 环境下的调度适配方案

### 2.1 方案对比

| 维度 | Cordis Plugin 方案 | 独立进程方案 |
|------|-------------------|-------------|
| 生命周期 | 跟随 DSH Host 进程 | 独立 Node.js 进程 |
| 精度 | 毫秒级（`setInterval`） | 秒级（cron / `setTimeout`） |
| 资源占用 | 共享进程内存 | 独立进程开销 |
| 故障隔离 | Plugin crash 可能影响 Host | 进程级隔离 |
| 状态可见性 | 通过 Cordis Service 暴露 | 通过文件/IPC |
| 安装复杂度 | 零安装，`cordis_define` 即用 | 需要 pm2/systemd/launchd |
| 多 session 共享 | 需要 Host 级 Service | 天然共享 |
| 离线调度 | 不支持（Host 关闭即停止） | 支持 |

### 2.2 推荐方案：Cordis Plugin + 外部 fallback

**核心判断**：DSH 环境下优先用 Cordis Plugin 做调度器，因为：

1. Loop Engineering 的状态存储已经是文件系统，不依赖内存
2. DSH Host 进程是长期运行的，符合"定时执行"的前提
3. Plugin 可以通过 Service 接口暴露给其他 Plugin 和命令
4. 不需要额外安装进程管理工具

但同时保留独立进程 fallback：当 DSH Host 未运行时，可以用 `heartbeat-scheduler.js` 直接被外部 cron/launchd 调用。

### 2.3 Cordis Plugin 设计

```
scripts/lib/loop-automation-adapters/
├── index.js                    # adapter registry
├── adapter-interface.js        # interface 定义和校验
├── dsh-cordis-adapter.js       # DSH Cordis Plugin adapter
├── claude-cron-adapter.js      # Claude CronCreate adapter
├── codex-thread-adapter.js     # Codex thread wakeup adapter
├── opencode-cli-adapter.js     # OpenCode CLI schedule adapter
└── github-actions-adapter.js   # GitHub Actions fallback
```

**DSH Cordis Plugin 核心逻辑：**

```javascript
/**
 * DSH Cordis 调度适配器的核心逻辑
 *
 * 注册为 Cordis Service: 'loopScheduler'
 * 依赖: 无硬依赖（heartbeat-scheduler 和 loop-state-store 直接 require）
 *
 * 生命周期:
 *   apply(ctx) → 注册 Service → 注册定时器（ctx.effect 清理）
 *   每次 tick → runHeartbeat() → 分发结果 → 更新状态
 */

// Host-side plugin skeleton:
function apply(ctx) {
  const timers = new Map();  // loopId → intervalId

  ctx.provide('loopScheduler', {
    schedule(spec, options) {
      const intervalMs = parseInterval(spec.cadence);
      const id = setInterval(() => {
        try {
          runHeartbeatForLoop(spec, options);
        } catch (err) {
          // 记录错误到 triage，不崩溃
        }
      }, intervalMs);
      timers.set(spec.id, id);
      return { success: true, scheduleId: spec.id };
    },

    unschedule(scheduleId) {
      const id = timers.get(scheduleId);
      if (id) { clearInterval(id); timers.delete(scheduleId); }
      return { success: true };
    },

    getStatus(scheduleId) {
      return {
        scheduleId,
        active: timers.has(scheduleId),
        // ... lastRun, nextRun from state store
      };
    },

    isAvailable() { return true; },

    async runOnce(spec) {
      return runHeartbeat(spec.projectRoot);
    },
  });

  // Fiber cleanup: 所有 timer 在 plugin stop 时清除
  ctx.effect(() => {
    return () => {
      for (const id of timers.values()) clearInterval(id);
      timers.clear();
    };
  });
}
```

### 2.4 各 Target 适配器行为

| Target | `isAvailable()` 判断 | `schedule()` 实现 | `runOnce()` 实现 |
|--------|---------------------|-------------------|------------------|
| **dsh-cordis** | `ctx.get('loopScheduler') !== undefined` | Cordis Service 注册 `setInterval` | 直接调 `runHeartbeat()` |
| **claude-cron** | 检测 `CronCreate` 工具可用性 | 输出 CronCreate JSON 指令 | 输出单次 heartbeat 执行指令 |
| **codex-thread** | 检测 Codex API 线程唤醒能力 | 创建 thread + 定时唤醒 | 输出单次扫描指令 |
| **opencode-cli** | 检测 OpenCode CLI 可用性 | 输出 CLI 定时任务指令 | 输出 CLI 单次执行指令 |
| **github-actions** | 检测 `.github/workflows/` 可写 | 生成 workflow YAML | 输出 `workflow_dispatch` 触发指令 |

**关键约束**：adapter 只负责"怎么触发"，不负责"做什么"。所有 target 共享同一套 `runHeartbeat()` → `classifyResult()` → `createGoal/triage` 逻辑。

---

## 三、核心业务逻辑和异常路径

### 3.1 Loop 生命周期状态机

```
         /loop-start
             │
             ▼
    ┌──── [created] ────┐
    │                    │
    │ intake 通过        │ intake 失败
    │                    ▼
    │              [rejected] → 推荐 /quick 或 /verify
    ▼
 [registered] ──── spec 无效 ──→ [invalid] → 报错，不启动
    │
    │ adapter.schedule()
    ▼
 [scheduled] ──── adapter 不可用 ──→ [manual-only] → 仅支持 /heartbeat run
    │
    │ 首次执行
    ▼
  [running]
    │
    ├── 所有 gate 通过 → [all-clear] → 等待下次调度
    │
    ├── 有 gate 失败 → [issues-found]
    │       │
    │       ├── auto-goal → 创建 goal → [goal-active]
    │       │       │
    │       │       ├── converged → [goal-accepted]
    │       │       ├── escalated → [goal-escalated] → triage
    │       │       └── 5 consecutive fail → [goal-stalled] → triage
    │       │
    │       └── triage → 写入 inbox → [triage-pending]
    │
    └── 执行错误 → [error] → 记录，等待下次调度重试
```

### 3.2 异常路径清单

| 异常场景 | 检测方式 | 处理策略 | 升级路径 |
|---------|---------|---------|---------|
| **gate 命令不存在/无权限** | `execSync` ENOENT/EACCES | 记录为 scan error，标记 gate 为 `misconfigured` | 写 triage，建议修复 spec |
| **gate 命令超时（>60s）** | `execSync` timeout | 记录为 failed，output 截取 | 重试 1 次后写 triage |
| **goal 已达 maxIterations** | `checkBudget()` | 标记 `escalated`，写 triage | 用户 `/triage act` |
| **goal 已超 maxDuration** | `checkBudget()` elapsed | 同上 | 同上 |
| **goal 已超 maxDollars** | `checkBudget()` cost sum | 同上 | 同上 |
| **连续 5 次 checker fail** | `checkBudget()` recentFails | 标记 `escalated`，原因 `repeated_failure` | triage |
| **Oracle 返回 `uncertain`** | `confidence < 0.5` | 等 2 轮，仍 uncertain 则 escalate | triage |
| **状态文件写入失败** | `writeJson` catch | 不推进迭代，保持上一状态 | 日志告警 |
| **loop spec 文件损坏/丢失** | `loadLoopSpecFile` catch | 暂停调度，保留已有状态 | triage |
| **调度器 miss 了预期运行** | 比较 `lastRunAt` 与 `cadence` | 按 `onMissedRun` 策略处理 | 记录 warning |
| **adapter 不可用** | `isAvailable()` false | 降级为 manual-only 模式 | 告知用户 |
| **安全发现（gate 输出含 CVE 等）** | 关键词匹配或 oracle 判断 | `onSecurityFinding: human`，强制 triage | 人工决策 |
| **并发写入同一 goal** | 文件锁（当前无锁） | **当前设计**：单线程串行，不并发写 | Phase 3+ 考虑锁 |

### 3.3 Maker/Checker 隔离核心逻辑

```javascript
/**
 * 执行一轮 goal 迭代
 *
 * 流程:
 *   1. checkBudget() → 如果耗尽则 escalate
 *   2. 调用 makerFn(goal) → maker 做一轮修改
 *   3. runOracleEvaluation() → 独立 checker 评估所有 stoppingConditions
 *   4. recordIteration() → 记录结果
 *   5. saveGoal() → 持久化
 *
 * 隔离保证:
 *   - makerFn 通过外部传入，checker 评估的是客观 gate 输出
 *   - checker 不接收 maker 的私有 reasoning
 *   - checker verdict 只有 pass/fail/uncertain 三种
 *
 * @param {Goal} goal - 当前 goal 状态
 * @param {function} makerFn - maker 执行函数，返回 { summary, costDollars }
 * @returns {GoalIterationResult}
 */
async function runGoalIteration(goal, makerFn) { ... }
```

---

## 四、需要新增/修改的文件清单

### 4.1 新增文件

| 文件 | 用途 | Phase |
|------|------|-------|
| `scripts/lib/loop-automation-adapters/index.js` | Adapter 注册中心，根据 target 选择 adapter | 5 |
| `scripts/lib/loop-automation-adapters/adapter-interface.js` | Interface 定义和校验工具 | 5 |
| `scripts/lib/loop-automation-adapters/dsh-cordis-adapter.js` | DSH Cordis Plugin 调度适配 | 5 |
| `scripts/lib/loop-automation-adapters/claude-cron-adapter.js` | Claude CronCreate 适配 | 5 |
| `scripts/lib/loop-automation-adapters/codex-thread-adapter.js` | Codex thread wakeup 适配 | 5 |
| `scripts/lib/loop-automation-adapters/opencode-cli-adapter.js` | OpenCode CLI 调度适配 | 5 |
| `scripts/lib/loop-automation-adapters/github-actions-adapter.js` | GitHub Actions fallback | 5 |
| `scripts/lib/loop-intake.js` | 四项准入检查逻辑 | 3 |
| `tests/test_loop_intake.js` | 准入检查测试 | 3 |
| `tests/test_loop_automation_adapters.js` | Adapter 接口和注册测试 | 5 |
| `tests/test_dsh_cordis_adapter.js` | DSH adapter 集成测试 | 5 |

### 4.2 修改文件

| 文件 | 变更内容 | Phase |
|------|---------|-------|
| `schemas/loop-spec.schema.json` | 补全 `automation`、`metrics` 字段 | 1/3 |
| `scripts/lib/loop-spec.js` | 增加 `automation`、`metrics` 的 normalize | 3 |
| `scripts/lib/loop-state-store.js` | 增加 `getLoopMetrics`、`listLoopSummaries`、`recordGateRun`、`listTriageItems`、`actOnTriageItem` | 2 |
| `scripts/lib/heartbeat-scheduler.js` | 从 adapter registry 获取调度器，支持 `onMissedRun` 策略 | 5 |
| `scripts/lib/completion-oracle.js` | Oracle 返回增加 `confidence` 和 `verdict` 枚举 (`pass`/`fail`/`uncertain`) | 2 |
| `scripts/hooks/session-start-goal-resume.js` | 支持多 target 状态读取 | 2 |
| `commands/loop-start.md` | 补全流程、输入输出字段 | 3 |
| `commands/loop-status.md` | 补全流程、输入输出字段 | 3 |
| `manifests/install-modules.json` | 已有 `loop-engineering` 模块，补全新增文件路径 | 4 |
| `manifests/install-components.json` | 已有 `capability:loop-engineering` | 4 |
| `.tsp/loop.example.yaml` | 增加 `automation` 和 `metrics` 示例 | 3 |
| `tests/test_loop_engineering_runtime.js` | 扩展覆盖新增 API | 2-5 |

### 4.3 不变的文件（已稳定）

| 文件 | 状态 |
|------|------|
| `scripts/lib/loop-oracle.js` | 仅 5 行 re-export，保持不变 |
| `docs/runbooks/loop-engineering-usage.md` | 已覆盖使用指南，增量更新 |

---

## 五、测试策略

### 5.1 分层测试架构

```
┌─────────────────────────────────────────────┐
│  Level 3: 集成测试（adapter + real target）  │
│  - DSH Cordis adapter + real timer           │
│  - Claude adapter + mock CronCreate          │
│  - Full loop: spec → heartbeat → goal → gate │
├─────────────────────────────────────────────┤
│  Level 2: 组件测试（模块级）                 │
│  - loop-intake 四项检查                      │
│  - loop-state-store 新增 API                 │
│  - completion-oracle verdict/confidence       │
│  - adapter interface 校验                    │
├─────────────────────────────────────────────┤
│  Level 1: 单元测试（函数级）                 │
│  - parseInterval / checkBudget / etc.        │
│  - normalizeLoopSpec 新增字段                │
│  - getLoopMetrics 计算逻辑                   │
└─────────────────────────────────────────────┘
```

### 5.2 测试用例矩阵

#### Level 1: 单元测试

| 测试文件 | 覆盖范围 | 关键用例 |
|---------|---------|---------|
| `test_loop_state_store.js` | State Store 所有 API | 写入/读取/列表/legacy 兼容/多 target 路径解析 |
| `test_loop_spec.js` | Spec 解析和校验 | 有效 spec / 缺少 gate / 缺少 budget / 无效 cadence / 新增 automation 字段 |
| `test_loop_intake.js` | 四项准入检查 | 全部通过 / 缺少 verification / 缺少 budget / 无 tool access |
| `test_completion_oracle.js` | Oracle 评估 | all pass / partial fail / budget exhausted / confidence 阈值 |

#### Level 2: 组件测试

| 测试文件 | 覆盖范围 | 关键用例 |
|---------|---------|---------|
| `test_loop_engineering_runtime.js`（扩展现有） | 端到端：spec → heartbeat → goal → oracle → converged | 创建 goal → 模拟 gate pass → 验证 converged |
| `test_loop_automation_adapters.js` | Adapter 注册和 interface | 注册/查找/校验/isAvailable |
| `test_loop_metrics.js` | 指标计算 | 多 goal 汇总 / acceptedChangeRate / costPerAcceptedChange |

#### Level 3: 集成测试

| 测试文件 | 覆盖范围 | 关键用例 |
|---------|---------|---------|
| `test_dsh_cordis_adapter.js` | DSH adapter 完整流程 | schedule → tick → heartbeat → goal → unschedule |
| `test_loop_full_cycle.js` | 完整 loop 生命周期 | 创建 spec → intake → schedule → 运行 → converged → 指标 |

### 5.3 测试隔离原则

```javascript
// 所有测试通过 TSP_LOOP_STATE_DIR 隔离，不写真实 home
function withTempDir(prefix, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const previous = {
    HOME: process.env.HOME,
    USERPROFILE: process.env.USERPROFILE,
    TSP_LOOP_STATE_DIR: process.env.TSP_LOOP_STATE_DIR,
    TSP_LOOP_TARGET: process.env.TSP_LOOP_TARGET,
  };
  try {
    fn(dir);
  } finally {
    // 恢复环境变量
    // 清理临时目录
  }
}
```

### 5.4 验收标准

```bash
# Phase 2 验收
node tests/test_loop_state_store.js        # 全部通过
node tests/test_loop_engineering_runtime.js # 全部通过（含新增 API 测试）

# Phase 3 验收
node tests/test_loop_spec.js              # 全部通过（含 automation 字段）
node tests/test_loop_intake.js            # 全部通过
node -e "require('./scripts/lib/loop-spec').loadLoopSpecFile('.tsp/loop.example.yaml'); console.log('ok')"

# Phase 4 验收
node scripts/validate-library.js
node scripts/install-plan.js --profile full --target codex   # loop-engineering 出现在 selected
node scripts/install-plan.js --profile full --target claude  # 同上
node scripts/install-plan.js --profile full --target opencode

# Phase 5 验收
node tests/test_loop_automation_adapters.js  # 全部通过
node tests/test_dsh_cordis_adapter.js       # 全部通过
node tests/test_loop_full_cycle.js          # 全部通过
```

---

## 六、实施顺序建议

| 顺序 | 任务 | 依赖 | 预估 |
|------|------|------|------|
| 1 | `loop-intake.js` + 测试 | 无 | 0.5h |
| 2 | State Store 新增 API + 测试 | 无 | 1h |
| 3 | Oracle verdict/confidence 增强 | 无 | 0.5h |
| 4 | Schema + loop-spec 增强 | 无 | 0.5h |
| 5 | loop-start / loop-status 命令补全 | 1-4 | 0.5h |
| 6 | Adapter interface + registry | 无 | 1h |
| 7 | DSH Cordis adapter | 6 | 1.5h |
| 8 | Claude/Codex/OpenCode adapters | 6 | 1h |
| 9 | GitHub Actions adapter | 6 | 0.5h |
| 10 | Install surface 更新 | 1-9 | 0.5h |
| 11 | 端到端集成测试 | 7-9 | 1h |
| 12 | 文档更新 | 1-11 | 0.5h |

**总计约 9 小时**，建议分 2-3 个工作批次完成。
