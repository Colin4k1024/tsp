---
version: "0.1.0"
status: draft
created: 2026-03-29
updated: 2026-03-29
owner: 工程团队
---

# 插件与扩展平台演示剧本

本文是一份可直接照着讲的演示脚本，面向宿主集成点、命令入口、配置面、安装路径和兼容矩阵场景。

## 1. 演示目标

- 说明插件仓库为什么要同时治理命令面、配置面和安装路径
- 说明 `/tdd` 如何前置锁定兼容和升级完成标准
- 说明 `/verify` 如何收口宿主集成点、安装路径和配置验证结果

## 2. 适用对象

- 需要介绍插件 / 扩展交付方法的 Tech Lead
- 需要讲宿主兼容与安装路径的前端 / 工具链负责人
- 需要向团队解释 verify 为何必须覆盖升级和禁用态的讲解人

## 3. 演示时长建议

- 5 分钟：讲命令面、配置面、安装路径三类风险
- 10 分钟：再讲 `/tdd` 与 `/verify`
- 15 分钟：完整走一遍 intake -> plan -> tdd -> execute -> verify -> review

## 4. 演示脚本

### Step 1. 先用 1 分钟讲清插件任务在治理什么

建议讲法：

```text
插件仓库要治理的不只是一个命令入口，至少还有配置项、宿主兼容和安装升级路径。
如果只改功能不改这些外围入口，发布后最容易出问题。
```

### Step 2. 用 `/team-intake` 讲清任务边界

建议输入：

```text
/team-intake
目标：为插件仓库新增命令入口并补齐安装、配置与兼容性说明
范围：命令、配置项、集成点、安装文档、测试计划
不做：无关业务服务改造
约束：必须说明宿主版本边界、升级路径、禁用态和失败回退行为
```

### Step 3. 用 `/team-plan` 说明如何拆分集成任务

建议输入：

```text
/team-plan
基于当前 intake 结果，拆命令入口、配置项、宿主集成、安装路径、兼容矩阵和验证收口动作。
输出必须指出哪些完成标准应先进入 /tdd，哪些证据最终应由 /verify 汇总。
```

### Step 4. 用 `/tdd` 讲“先锁兼容与升级标准”

建议输入：

```text
/tdd
基于当前 /team-plan 结果，先定义命令入口、配置兼容、安装升级、禁用态和失败回退的完成标准。
```

### Step 5. 用 `/team-execute` 讲实际收敛动作

建议讲法：

```text
执行阶段通常会先补命令入口和配置项，再补安装升级说明，最后补兼容矩阵和验证收口。
```

### Step 6. 用 `/verify` 收口

建议输入：

```text
/verify
请基于当前插件改动，输出命令入口、配置项、安装路径和兼容性验证结果，并整理成可直接进入 /team-review 的结论。
```

## 5. 建议演示顺序

1. 先讲命令面、配置面、安装路径三类风险
2. 再展示 `/team-intake` 与 `/team-plan`
3. 然后讲 `/tdd`
4. 再讲 `/team-execute`
5. 最后讲 `/verify` 与 `/team-review`

## 6. 演示后建议发给观众的材料

- [plugin-extension-platform-demo-execution-log.md](plugin-extension-platform-demo-execution-log.md)
- [plugin-extension-platform-walkthrough.md](plugin-extension-platform-walkthrough.md)
- [../../examples/plugin-extension-platform-CLAUDE.md](../../examples/plugin-extension-platform-CLAUDE.md)
