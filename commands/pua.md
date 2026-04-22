# /pua

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

启用 PUA 高能动性与高压闭环模式，统一处理连续失败、原地打转、空口完成、没搜就猜和被动等待。

## 主责角色

- `planner`

## 期望输入

- 当前任务描述或卡点
- 是否需要切换模式：p7 / p9 / p10 / pro / yes / mama / loop / on / off / flavor
- 当前失败次数、已尝试方案和验证状态

## 标准输出

- 已选中的 PUA 模式
- 当前 flavor 与方法论路由
- 下一轮必须执行的动作清单
- 若为 on / off / flavor，则给出本地状态更新动作

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 先根据参数路由决定模式：无参数默认加载 `pua` 核心；`p7`、`p9`、`p10`、`pro`、`yes`、`mama`、`loop` 分别切到对应 skill。
2. 若参数是 `on`，创建或更新 `~/.claude/pua/config.json`，写入 `{ "always_on": true }`，并保留当前 flavor。
3. 若参数是 `off`，创建或更新 `~/.claude/pua/config.json`，写入 `{ "always_on": false }`。
4. 若参数是 `flavor`，先读取 `skills/pua/references/flavors.md`，再让用户明确选择 flavor，并把结果写入 `~/.claude/pua/config.json`。
5. 若参数是任务描述或卡点，先读取 `skills/pua/references/methodology-router.md`，按任务类型自动选择默认 flavor 与方法论。
6. 激活后严格遵循三条红线：没证据不算完成、没验证不允许归因、没穷尽不允许放弃。
7. 若当前已连续失败 2 次以上，明确当前等级 L1-L4，并按 `skills/pua/SKILL.md` 的 7 项检查清单或失败切换链继续推进。
8. 当前本平台仅对 SessionStart、PostToolUse、PostToolUseFailure、PreCompact、Stop 做了 hooks 映射；不支持 UserPromptSubmit 级别的即时拦截，需要显式说明这是降级兼容项。
