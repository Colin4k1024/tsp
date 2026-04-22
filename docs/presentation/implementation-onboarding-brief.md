# Implementation Onboarding Brief

这份讲稿面向准备把 Team Skills Platform 接入真实仓库的实施人。重点不是平台价值，而是怎么开始、用哪一套材料、如何避免入口选错。

## 1. 适用对象

- Tech Lead
- Architect
- Project Manager
- 负责仓库 onboarding 的实施人

## 2. 讲解重点

### 先讲从哪开始

建议讲法：

“接入时不要先看所有 runbook，而是先决定项目属于哪种模板。先从 examples 索引选模板，再从 starter playbook 选起手句，再看 route map 和 capability matrix 判断当前 vertical 材料是否完整。”

### 再讲主链和 specialist 怎么配

建议讲法：

“新仓库先跑 `/team-intake` 和 `/team-plan`，只有返工成本高或任务复杂时再插 `/tdd`、`/multi-*`、`/verify`。specialist 的结果必须回到 handoff 或主链。”

### 最后讲如何选 vertical 资产

建议讲法：

“如果你要快速复用现成材料，不要只看模板，要先查 route map 和 capability matrix。前者告诉你讲解入口，后者告诉你某个 vertical 是否已经具备 walkthrough、demo script 和 execution log。”

## 3. 推荐顺序

1. [../../examples/INDEX.md](../../examples/INDEX.md)
2. [../../examples/project-type-starter-playbook.md](../../examples/project-type-starter-playbook.md)
3. [vertical-scenario-route-map.md](vertical-scenario-route-map.md)
4. [../runbooks/vertical-scenario-capability-matrix.md](../runbooks/vertical-scenario-capability-matrix.md)
5. [../runbooks/project-onboarding.md](../runbooks/project-onboarding.md)
