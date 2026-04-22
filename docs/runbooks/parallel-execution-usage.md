# Parallel Execution Framework 使用指南

## 概述

Parallel Execution Framework（并行执行框架）提供：
- 任务智能拆分
- Git worktree 多分支并行
- 动态实例扩展
- 结果自动汇总

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Parallel Execution                       │
├─────────────────────────────────────────────────────────────┤
│  Task Input  →  Decomposer  →  Task Queue                  │
│                              ↓                              │
│              ┌────────────────┼────────────────┐           │
│              ↓                ↓                ↓           │
│         Instance 1       Instance 2      Instance N         │
│              ↓                ↓                ↓           │
│              └────────────────┼────────────────┘           │
│                              ↓                              │
│                        Aggregator                           │
│                              ↓                              │
│                    Execution Summary                        │
└─────────────────────────────────────────────────────────────┘
```

## 任务分解策略

### 独立任务 (Independent)

```python
tasks = [
    {"id": "1", "type": "independent", "command": "npm test -- --testNamePattern=auth"},
    {"id": "2", "type": "independent", "command": "npm test -- --testNamePattern=api"},
    {"id": "3", "type": "independent", "command": "npm test -- --testNamePattern=ui"},
]
```

### 串行任务 (Sequential)

```python
tasks = [
    {"id": "1", "type": "sequential", "command": "npm run build"},
    {"id": "2", "type": "sequential", "command": "npm run test", "depends_on": ["1"]},
]
```

### 级联任务 (Cascade)

```python
tasks = [
    {"id": "main", "type": "cascade", "command": "npm run build"},
    {"id": "sub1", "type": "cascade", "trigger": "on_success", "parent": "main", "command": "./deploy.sh staging"},
    {"id": "sub2", "type": "cascade", "trigger": "on_success", "parent": "main", "command": "./notify.sh"},
]
```

## Git Worktree 并行

### 创建 Worktree

```bash
git worktree add ../feature-auth-worktree feature-auth
git worktree add ../feature-api-worktree feature-api
```

### 管理 Worktrees

```bash
# 列出所有 worktree
git worktree list

# 列出所有 worktree（详细）
git worktree list --verbose

# 移除 worktree
git worktree remove ../feature-auth-worktree

# 清理无效 worktree
git worktree prune
```

### 在 Worktree 中执行任务

```bash
cd ../feature-auth-worktree
npm test
cd ../feature-api-worktree
npm test
```

## 动态扩展

### Scale Out（横向扩展）

增加并行实例数量：

```python
# 从 2 个实例扩展到 4 个
scale_out(max_instances=4)
```

### Scale Up（纵向扩展）

提升单个实例规格：

```python
# 切换到更大内存的实例
scale_up(instance_type="large")
```

## 使用场景

### 场景 1：多模块并行测试

```
任务：为 4 个独立模块运行测试
策略：scale_out with 4 instances

→ Instance 1: npm test -- --testNamePattern=module-auth
→ Instance 2: npm test -- --testNamePattern=module-api
→ Instance 3: npm test -- --testNamePattern=module-db
→ Instance 4: npm test -- --testNamePattern=module-ui

汇总结果
```

### 场景 2：多分支并行开发

```
任务：在 feature-a 和 feature-b 分支上并行开发
策略：Git worktree

→ Worktree 1: feature-a 分支，单独开发
→ Worktree 2: feature-b 分支，单独开发

合并到主分支时解决冲突
```

### 场景 3：构建 + 部署级联

```
任务：构建 → 部署 staging → 部署 prod
策略：Cascade

→ Step 1: npm run build (sequential)
    → Step 2a: ./deploy.sh staging (cascade on success)
    → Step 2b: ./run-tests.sh (cascade on success)
        → Step 3: ./deploy.sh prod (cascade on success of all)
```

## 最佳实践

1. **任务拆分粒度**：每个子任务耗时 2-10 分钟最佳
2. **避免写冲突**：并行任务不要写同一个文件
3. **共享状态**：使用文件、数据库或消息队列传递
4. **失败处理策略**：
   - `fail-fast`：一个失败立即停止
   - `fail-continue`：部分失败继续，返回完整报告
   - `retry`：自动重试 N 次
5. **资源估算**：预估总耗时 = 最长任务时间 + 汇总时间

## 与其他模块配合

### 与 Verification Loop 配合

验证任务天然适合并行执行（多个验证点同时检查）。

### 与 TDD Guide 配合

TDD 的 red-green-refactor 可用 cascade 串联。

### 与 Harness Optimizer 配合

根据历史执行数据，自动推荐最优并行策略。
