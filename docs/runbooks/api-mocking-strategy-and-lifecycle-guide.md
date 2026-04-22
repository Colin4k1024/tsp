---
version: "0.1.0"
status: draft
created: 2026-03-28
updated: 2026-03-28
owner: 工程团队
---

# API Mock 策略与生命周期手册

本文说明前后端并行开发时，Mock 应该如何选型、使用、同步和下线。它补的是工程实践，不替代接口契约、contract testing 或真实联调。

## 1. 什么时候需要 Mock

- 前端先于后端开工
- 接口契约已基本稳定，但实现尚未交付
- QA 需要提前准备部分验收路径

## 2. Mock 的选型思路

- 固定 fixture：适合稳定 happy path
- 拦截型 mock：适合前端页面开发与交互验证
- 轻量 HTTP mock 服务：适合多端共享同一份假数据
- provider stub：适合后端依赖未就绪时的集成占位

## 3. 生命周期管理

- 立项时：明确是否允许 Mock 驱动开发
- plan 阶段：写清楚谁维护 Mock 和何时切真实接口
- execute 阶段：记录 Mock 覆盖的场景和已知缺口
- 联调阶段：把 Mock 与真实接口差异回写 handoff
- review 阶段：清理过期 Mock，避免长期漂移

## 4. 最小交接要求

- Mock 覆盖了哪些请求与响应
- 哪些字段仍待真实接口确认
- 切换真实接口的检查点
- 哪些问题不能靠 Mock 证明

## 5. 常见错误

- 契约还没稳定就先写大量 Mock
- Mock 数据和真实接口长期分叉
- 联调完成后没有回收临时 Mock

与这些文档配合阅读：[frontend-backend-parallel-integration-walkthrough.md](frontend-backend-parallel-integration-walkthrough.md)、[contract-testing-playbook.md](contract-testing-playbook.md)
