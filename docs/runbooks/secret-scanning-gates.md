# Secret Scanning 门禁手册

本手册承接 `gitleaks/gitleaks` 的工程实践，用于把仓库级 secret 扫描接入 PR、默认分支与发布流程。它补的是“在代码进入主链前尽早发现硬编码密钥、token、凭证和误提交 secret”这一层，不替代人工 review、依赖门禁、运行时密钥管理或发布放行判断。

## 适用场景

- PR 直接涉及 `.env`、配置文件、示例文件、测试数据、脚本、CI 配置或文档中的敏感字段。
- 仓库里已经发生过 secret 误提交，希望把“发现后再处理”前置成“合并前先拦住”。
- 需要同时扫描当前工作区、PR diff 和历史提交，区分新引入问题与既有存量问题。
- 仓库里存在归档文件、压缩包或嵌套制品，担心 secret 被打包后藏进历史产物。
- 团队希望为 false positives 建立稳定 baseline，而不是每次都手工重判全部命中。

## 不适用场景

- 仓库本身不承载源码或配置，只是一个运行时消费端，且 secret 只存在于外部密钥系统中。
- 团队还没有明确 secret 发现后由谁响应、谁负责旋转、谁负责清理历史。
- 期望 secret 扫描替代密钥管理、权限收敛、发布审计或人工安全 review。
- 团队无法接受任何形式的误报却又不愿维护 baseline、allowlist 或 triage 流程。

## 推荐落地方式

1. 先明确扫描边界，不要一上来把所有路径都当成阻塞项：
   - PR 阶段优先扫 diff
   - 默认分支定期扫全仓库
   - 发现历史问题时再单独跑历史扫描和清理
2. 第一轮先建立 baseline，再谈门禁：
   - 把已知存量命中固化成 baseline 或忽略列表
   - 只对新增命中、严重命中或高可信命中设置阻塞
   - 给每条 baseline 记录 owner、原因和到期复核时间
3. 将 secret scanning 与现有安全链分层：
   - `dependency-review-gates` 负责依赖和许可证变化
   - `codeql-pr-security-gates` 负责代码级语义问题
   - `trivy-security-gates` 负责镜像、文件系统和 IaC 中的 secret / misconfiguration
   - `secret-scanning-gates` 负责源码仓库、PR diff 与历史中的硬编码 secret
   - 安全评审角色、`/team-review` 负责最终判断与阻塞决策
4. 命中后不要只“报出来”：
   - 先确认命中是否为真实 secret
   - 再判断是否需要立刻 rotate、revoke 或 purge 历史
   - 需要时把清理、替换和复查拆成独立任务
5. 结果必须回写到 PR、review 结论或发布记录，不要只停在扫描输出里。

## 最小门禁模型

- `target layer`：源码、配置、脚本、文档、测试数据和归档文件
- `scan layer`：gitleaks 对当前内容、diff 或历史做 secret 检测
- `baseline layer`：已知存量命中、误报和临时豁免
- `triage layer`：确认命中是否真实、是否新增、是否阻塞
- `decision layer`：安全评审角色、`tech-lead`、`devops-engineer` 决定是否放行

重点不是“有没有命中”，而是这条命中是否是新增、是否是真 secret、是否已经被接管处理。

## 重点检查项

- 是否出现硬编码 token、API key、密码、私钥、访问凭证或 session 信息
- 是否把真实 secret 写进示例、测试数据、文档或脚本中
- 是否在归档文件、压缩包或嵌套制品里藏入了 secret
- 是否只是旧 baseline 复现，还是本次变更引入的新问题
- 是否存在高置信规则命中，但还需要人工确认上下文才能判断是否真漏
- 是否有重复出现的 secret 类型，说明仓库里存在系统性泄漏模式

## 反模式

- 只看扫描结果条数，不区分真实命中、误报和存量 baseline。
- 因为误报多就直接关闭 secret 扫描，最后让真正泄漏无人发现。
- 命中以后只删代码，不做 token 轮换、访问撤销或历史清理。
- 只扫 PR diff，不扫默认分支和历史，导致旧 secret 一直留在仓库里。
- baseline 永久不复核，最后把所有问题都变成“已知问题”。

## 输出回落

- PR 阶段：把新增命中、误报判断和 triage 结论写入 review 摘要。
- 评审阶段：在 `/team-review` 中明确哪些命中来自 secret scanning，哪些已被人工确认、豁免或阻塞。
- 发布阶段：若仍存在未关闭的高风险命中，必须回写到 `/team-release` 的风险、放行结论或后续观察项。
- 事故处理：若确认泄漏，必须同步到 token 轮换、密钥撤销、历史清理和复查任务。

## 许可证与使用边界

- `gitleaks/gitleaks` 采用 MIT License。
- 启用前应确认仓库扫描范围、baseline 管理方式、误报 triage 责任人和 secret 轮换流程。
- 对组织级仓库、历史扫描和高敏感仓库，建议先用非阻塞模式观察一轮，再逐步收紧门禁。

## 参考来源

- [gitleaks/gitleaks](https://github.com/gitleaks/gitleaks)
- [gitleaks/gitleaks-action](https://github.com/gitleaks/gitleaks-action)
