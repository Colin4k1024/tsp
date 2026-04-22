---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 插件与扩展平台演示执行记录

本文记录一条插件 / 扩展平台演示路径，重点展示团队如何把命令入口、配置项、宿主兼容和安装路径收敛成可验证的交付链路。

## 1. 场景定义

### 背景

- 仓库当前维护 extension / plugin 的命令入口、配置项和安装说明
- 团队准备新增一个宿主命令入口，并同步补齐兼容与升级说明
- 希望避免“功能能用，但安装、升级和禁用态无人解释”的交付状态

### 演示目标

- 让观众理解命令面、配置面和安装路径是三个不同层次
- 让观众看到 `/tdd` 如何前置定义兼容标准
- 让观众看到 `/verify` 如何把安装和升级验证结果正式回写到 review

## 2. 阶段 1：/team-intake

### 输入

```text
/team-intake
目标：为插件仓库新增命令入口并补齐安装、配置与兼容性说明
范围：命令、配置项、集成点、安装文档、测试计划
不做：无关业务服务改造
约束：必须说明宿主版本边界、升级路径、禁用态和失败回退行为
```

### 产出

| 字段 | 内容 |
|------|------|
| 任务类型 | 插件 / 扩展交付 |
| 主体对象 | 命令入口、配置项、宿主集成、安装路径 |
| 主要风险 | 兼容矩阵不清、升级失败、安装路径失联 |
| 收口要求 | review 必须承接兼容与安装验证结果 |

## 3. 阶段 2：/team-plan

### 拆解结果

| 模块 | 动作 | 收口位置 |
|------|------|----------|
| 命令面 | 新增或调整命令入口 | 代码 / docs |
| 配置面 | 定义配置项与默认值 | 代码 / docs |
| 安装面 | 更新安装、升级、禁用路径 | docs / verify |
| 兼容面 | 明确宿主版本与例外项 | verify / review |

### 关键判断

- 命令入口变更必须同步到安装和配置说明
- 兼容矩阵需要进入 verify，而不是只口头说明

## 4. 阶段 3：/tdd

### 定义的完成标准

```text
1. 命令入口、配置边界和安装路径说明清晰
2. 宿主兼容矩阵有正式记录
3. verify 能汇总安装、升级、禁用态和回退结果
4. review 能明确说明阻塞项与例外
5. 仓库校验通过
```

## 5. 阶段 4：/team-execute

### 执行批次

#### 批次 A：命令与配置

- 调整命令入口
- 调整配置项与默认值

#### 批次 B：安装与升级

- 更新安装路径
- 更新升级与禁用说明

#### 批次 C：兼容收口

- 汇总宿主版本矩阵
- 整理 verify 所需证据

## 6. 阶段 5：/verify

### Verify 结果

| 检查项 | 判断 |
|--------|------|
| 命令入口 | 已确认 |
| 配置项 | 已确认 |
| 安装路径 | 已确认 |
| 升级 / 禁用态 | 已确认 |
| 兼容矩阵 | 已确认 |

## 7. 阶段 6：/team-review

### Review 结论

- 当前交付已经覆盖命令、配置、安装和兼容四层
- 若仍有例外项，应明确标记为下一轮优化或限制说明

## 8. 校验结果

### 文档静态检查

- 本轮新增 walkthrough、demo script 与 execution log 无错误

### 仓库校验

```text
Validation passed.
- Roles: 8
- Shared skills: 3
- ECC skills: 9
- Private overlay skills: not shipped in public repo
- Specialist agents: 27
- Generated artifacts: 70
```

## 9. 推荐搭配材料

- [plugin-extension-platform-demo-script.md](plugin-extension-platform-demo-script.md)
- [plugin-extension-platform-walkthrough.md](plugin-extension-platform-walkthrough.md)
- [../../examples/plugin-extension-platform-CLAUDE.md](../../examples/plugin-extension-platform-CLAUDE.md)
