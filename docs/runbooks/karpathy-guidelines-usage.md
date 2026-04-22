# Karpathy Guidelines Usage

`karpathy-guidelines` 是一层行为护栏，不是新的主链命令，也不是 `coding-standards`、`tdd-workflow`、`verification-loop` 的替代品。

## 什么时候用

- 任务描述有歧义，但又很容易让代理“猜一个就开始写”
- 变更本来应该很小，却有过度设计风险
- 需要明确哪些地方能改、哪些地方只能记录不能顺手清理
- 想先把“成功长什么样”说清楚，再进入 TDD 或实现

## 推荐搭配

1. 先用 `karpathy-guidelines` 收敛假设、简化方案、锁定改动边界和成功标准
2. 进入实现后，用 `coding-standards` 或相应语言/框架 skill 保持代码质量
3. 涉及新行为或 bugfix 时，接 `tdd-workflow`
4. 收尾前，用 `verification-loop` 给出 fresh verification evidence

## 不做什么

- 不替你生成完整实现计划
- 不替代语言/框架专项 skill
- 不强制修改 `/team-*` 主链或 role agent 默认行为

## 一个简短判断

如果你担心代理会“误解需求、做复杂、顺手多改、没定义成功标准”，就先用 `$karpathy-guidelines`。
