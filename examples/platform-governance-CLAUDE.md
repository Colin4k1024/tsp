# Example Platform Governance CLAUDE.md

适用于平台基建仓库、命令/agent/skill 仓库、CI/CD 治理仓库或文档平台本身。

这类项目和业务应用不同，重点不是单个功能交付，而是命令面、规则、安装链路、示例、runbook 和 runtime 能力的一致性。

## 适用信号

- 仓库主要产出命令、agent、skills、rules、templates、hooks 或 runbooks
- 需求经常是“新增能力”“重构入口”“补齐文档”“统一安装与校验链路”
- 成功标准常常是校验通过、入口一致、示例可用，而不是某个页面上线

## 相对通用版的主要差异

### 1. `/harness-audit` 会变成高频入口

- 这类仓库最容易出现“能力加了，但文档和示例没跟上”
- 因此 `/harness-audit` 不再是偶发命令，而是版本收口前的关键步骤

### 2. `/tdd` 用来先锁完成标准

- 不一定是先写代码测试
- 更常见的是先定义“哪些入口必须同步、哪些校验必须通过、哪些产物必须能被找到”

### 3. runtime 说明本身就是交付内容的一部分

- memory persistence、observe、budget、compact、instinct 这些机制需要单独说明
- 不能假定读者会自己从 hooks 或脚本目录推断平台行为

## 一份更适合平台治理仓库的精简成品

````md
# Platform Governance Working Agreement

## 项目定位

- 类型：平台治理 / Agent 能力仓库
- 重点：命令面、技能装配、文档入口、安装路径、校验链路、演示材料

## 默认角色

- `tech-lead`
- `architect`
- `project-manager`
- `qa-engineer`
- 涉及发布与安装链时引入 `devops-engineer`

## 默认命令流

1. `/team-intake`
2. `/team-plan`
3. `/tdd`
4. `/team-execute`
5. `/harness-audit`
6. `/handoff`
7. `/team-review`

## 项目约束

- 新增命令、skills、hooks、templates 后，必须补入口文档、示例和演示材料
- specialist 结论必须回收到主链，不能只停在专项说明里
- runtime 能力必须在 runbook 或 presentation 中有可读解释
- 收口前必须运行 `node scripts/validate-library.js`

## 常用提示模板

```text
/team-intake
目标：重审近期新增命令、skills、hooks、runtime 与文档入口是否同步
范围：README、quick start、runbooks、examples、presentation、校验脚本
不做：业务功能开发
约束：保留历史快照文档，不把历史记录改写成 evergreen 说明
```

```text
/harness-audit
请从命令覆盖、skills 完整度、hooks 有效性、文档同步、集成深度五个方向审视当前平台。
输出必须区分：立即修补、下一轮收敛、仅记录观察。
```
````

如果你的仓库仍然以业务交付为主，只是顺手维护一些脚本和 runbook，还是优先用 [project-CLAUDE.md](project-CLAUDE.md)。
