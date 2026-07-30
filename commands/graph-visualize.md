# /graph-visualize

> 本文件由 `scripts/build-platform-artifacts.js` 生成，请勿手改。

## 用途

生成代码架构的可视化图表，展示模块依赖、调用关系和系统结构。

## 主责角色

- `graph-engineer`

## 期望输入

- 可视化范围
- 图表类型偏好

## 标准输出

- Mermaid 图表
- 架构说明
- 关键节点标注

输出字段定义与交付结构见 [team-command-output-contracts.md](../docs/runbooks/team-command-output-contracts.md)。

## 默认流程

1. 通过 CodeGraph 获取项目结构和符号关系。
2. 生成 Mermaid 格式的依赖/调用图表。
3. 标注关键节点和模块边界。
