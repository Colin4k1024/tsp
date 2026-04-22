# Common Agents

## 何时使用 specialist

- 任务需要专业视角，但还不应打断主团队角色的责任边界。
- 需要更细颗粒度的规划、review、验证或 build 归因。
- 多角色并行任务需要一个中间编排层降低上下文噪音。

## 何时不用 specialist

- 问题很简单，主责角色可以直接完成。
- specialist 结论不能改变当前路径，只会增加来回传递成本。
- 当前任务缺少最基本的输入，先回到 `tech-lead` 补齐上下文。

## 协作红线

- specialist 不替代 `tech-lead` 仲裁。
- specialist 不对未验证的结论作最终承诺。
- 所有关键结论必须回落到 role handoff 或 `/team-*` 命令。
