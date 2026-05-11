import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/tsp/',
  title: 'Team Skills Platform',
  description: 'Company-grade role-based Team Skills Platform for AI-assisted development',
  lang: 'zh-CN',
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'TSP',

    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/runbooks/claude-quick-start' },
      { text: '用户指南', link: '/runbooks/team-skills-usage' },
      {
        text: '手册',
        items: [
          { text: 'Claude 快速开始', link: '/runbooks/claude-quick-start' },
          { text: 'Codex 快速开始', link: '/runbooks/codex-quick-start' },
          { text: 'Cursor 快速开始', link: '/runbooks/cursor-quick-start' },
          { text: 'OpenCode 快速开始', link: '/runbooks/opencode-quick-start' },
        ],
      },
    ],

    sidebar: {
      '/guides/': [
        {
          text: '指南',
          items: [
            { text: '安装（入口页）', link: '/guides/installation' },
            { text: '用户指南（入口页）', link: '/guides/user-guide' },
            { text: '权威安装文档', link: '/runbooks/claude-quick-start' },
            { text: '权威使用手册', link: '/runbooks/team-skills-usage' },
          ],
        },
      ],
      '/runbooks/': [
        {
          text: '快速开始',
          collapsed: false,
          items: [
            { text: 'Claude 快速开始', link: '/runbooks/claude-quick-start' },
            { text: 'Codex 快速开始', link: '/runbooks/codex-quick-start' },
            { text: 'Cursor 快速开始', link: '/runbooks/cursor-quick-start' },
            { text: 'OpenCode 快速开始', link: '/runbooks/opencode-quick-start' },
            { text: '首次主链演练', link: '/runbooks/first-team-workflow-walkthrough' },
            { text: '项目接入', link: '/runbooks/project-onboarding' },
            { text: '故障排查', link: '/runbooks/troubleshooting' },
          ],
        },
        {
          text: '使用场景',
          collapsed: true,
          items: [
            { text: 'Claude 使用场景', link: '/runbooks/claude-usage-scenarios' },
            { text: 'Codex 使用场景', link: '/runbooks/codex-usage-scenarios' },
            { text: 'Solo 交付模式', link: '/runbooks/solo-delivery-mode' },
            { text: 'Solo 单页速查', link: '/runbooks/solo-delivery-one-page' },
          ],
        },
        {
          text: '提示与对话',
          collapsed: true,
          items: [
            { text: 'Claude 提示模板', link: '/runbooks/claude-conversation-prompt-recipes' },
            { text: 'Codex 并行模板', link: '/runbooks/codex-parallel-prompt-recipes' },
            { text: '角色提示模板', link: '/runbooks/role-prompt-recipes' },
            { text: 'Claude 完整对话示例', link: '/runbooks/claude-end-to-end-conversation-example' },
            { text: 'Codex 完整对话示例', link: '/runbooks/codex-end-to-end-conversation-example' },
          ],
        },
        {
          text: '角色操作手册',
          collapsed: true,
          items: [
            { text: '架构师日常', link: '/runbooks/architect-daily-operations' },
            { text: '后端工程师日常', link: '/runbooks/backend-engineer-daily-operations' },
            { text: '产品经理对话示例', link: '/runbooks/product-manager-clarification-conversation-example' },
            { text: '项目经理规划示例', link: '/runbooks/project-manager-planning-conversation-example' },
            { text: '架构师设计对话', link: '/runbooks/architect-design-conversation-example' },
            { text: 'QA 评审对话', link: '/runbooks/qa-review-conversation-example' },
            { text: 'DevOps 发布对话', link: '/runbooks/devops-release-conversation-example' },
            { text: 'Tech Lead 收口对话', link: '/runbooks/tech-lead-closure-conversation-example' },
          ],
        },
        {
          text: '速查手册',
          collapsed: true,
          items: [
            { text: '前端 Bugfix 速查', link: '/runbooks/frontend-bugfix-one-page' },
            { text: '后端 API 交付速查', link: '/runbooks/backend-api-delivery-one-page' },
            { text: '发布收口速查', link: '/runbooks/release-closure-one-page' },
          ],
        },
        {
          text: '平台能力',
          collapsed: true,
          items: [
            { text: '命令与能力矩阵', link: '/runbooks/command-and-capability-matrix' },
            { text: 'ECC Harness 使用', link: '/runbooks/ecc-harness-usage' },
            { text: '运行时能力概览', link: '/runbooks/runtime-capabilities-overview' },
            { text: 'Agent 治理', link: '/runbooks/agent-governance' },
            { text: 'Sub-agent 调用地图', link: '/runbooks/sub-agent-invocation-map' },
            { text: 'Handoff 治理', link: '/runbooks/handoff-governance' },
            { text: '错误经验库', link: '/runbooks/error-experience-usage' },
            { text: '并行执行', link: '/runbooks/parallel-execution-usage' },
            { text: '进化系统', link: '/runbooks/evolution-usage' },
            { text: 'Graphify 知识图谱', link: '/runbooks/graphify-knowledge-graph-usage' },
          ],
        },
        {
          text: '工程实践',
          collapsed: true,
          items: [
            { text: 'Git PR 工作流', link: '/runbooks/git-pr-workflow' },
            { text: 'AI PR Review 自动化', link: '/runbooks/ai-pr-review-automation' },
            { text: '契约测试', link: '/runbooks/contract-testing-playbook' },
            { text: 'Helm 单元测试', link: '/runbooks/helm-unittest-playbook' },
            { text: '依赖更新自动化', link: '/runbooks/dependency-update-automation' },
            { text: 'Release Notes 自动化', link: '/runbooks/release-notes-automation' },
          ],
        },
        {
          text: 'CI/CD 安全门禁',
          collapsed: true,
          items: [
            { text: 'CodeQL 安全门禁', link: '/runbooks/codeql-pr-security-gates' },
            { text: 'Secret Scanning', link: '/runbooks/secret-scanning-gates' },
            { text: 'Trivy 安全扫描', link: '/runbooks/trivy-security-gates' },
            { text: 'Checkov IaC 门禁', link: '/runbooks/checkov-iac-gates' },
            { text: 'API Lint 门禁', link: '/runbooks/api-lint-gates' },
            { text: 'API Breaking Change', link: '/runbooks/api-breaking-change-gates' },
            { text: 'Reviewdog PR 门禁', link: '/runbooks/reviewdog-pr-gates' },
            { text: 'Scorecard 供应链', link: '/runbooks/scorecard-supply-chain-gates' },
            { text: 'SBOM 生成', link: '/runbooks/sbom-generation-gates' },
            { text: 'Cosign 签名', link: '/runbooks/cosign-signing-gates' },
            { text: 'SLSA 验证', link: '/runbooks/slsa-verification-gates' },
          ],
        },
        {
          text: '企业扩展',
          collapsed: true,
          items: [
            { text: '企业扩展快速开始', link: '/runbooks/enterprise-extension-quick-start' },
            { text: '公司技能集成', link: '/runbooks/company-skills-integration' },
            { text: '公司技能决策框架', link: '/runbooks/company-skills-decision-framework' },
            { text: '外部能力引入', link: '/runbooks/external-capability-intake' },
            { text: '企业标准映射', link: '/runbooks/enterprise-standards-mapping' },
          ],
        },
        {
          text: '历史档案',
          collapsed: true,
          items: [
            { text: '版本收口（2026-03-29）', link: '/runbooks/version-closure-2026-03-29' },
            { text: '平台能力演示剧本（历史）', link: '/runbooks/platform-capability-demo-script' },
            { text: '平台能力演示执行记录（历史）', link: '/runbooks/platform-capability-demo-execution-log' },
            { text: '平台迁移计划（历史）', link: '/plans/team-skills-platform-migration' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Colin4k1024/tsp' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: '© 2026 Team Skills Platform',
    },

    outline: {
      level: [2, 3],
      label: '页面导航',
    },

    lastUpdated: {
      text: '最后更新',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },
})
