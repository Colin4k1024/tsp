#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const IGNORED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build'])
const REQUIRED_ACTIVE_FIELDS = ['owner', 'updated', 'doc_tier', 'last_verified', 'source_of_truth']
const MAX_STALENESS_DAYS = 45

const AUTHORITATIVE_DOCS = [
  'README.md',
  'AGENTS.md',
  path.join('docs', 'index.md'),
  path.join('docs', 'guides', 'installation.md'),
  path.join('docs', 'guides', 'user-guide.md'),
  path.join('docs', 'runbooks', 'claude-quick-start.md'),
  path.join('docs', 'runbooks', 'codex-quick-start.md'),
  path.join('docs', 'runbooks', 'cursor-quick-start.md'),
  path.join('docs', 'runbooks', 'opencode-quick-start.md'),
  path.join('docs', 'runbooks', 'project-onboarding.md'),
  path.join('docs', 'runbooks', 'team-skills-usage.md'),
  path.join('docs', 'runbooks', 'troubleshooting.md'),
  path.join('docs', 'runbooks', 'command-and-capability-matrix.md'),
  path.join('docs', 'runbooks', 'agent-governance.md'),
  path.join('docs', 'runbooks', 'handoff-governance.md'),
  path.join('docs', 'runbooks', 'sub-agent-invocation-map.md'),
]

const REQUIRED_HISTORICAL_DOCS = [
  path.join('docs', 'runbooks', 'platform-capability-demo-script.md'),
  path.join('docs', 'runbooks', 'platform-capability-demo-execution-log.md'),
  path.join('docs', 'runbooks', 'version-closure-2026-03-29.md'),
  path.join('docs', 'plans', 'team-skills-platform-migration.md'),
]

const COMMAND_SURFACE_DOCS = [
  'README.md',
  'AGENTS.md',
  path.join('docs', 'runbooks', 'command-and-capability-matrix.md'),
]

const EXPECTED_COMMANDS = [
  '/team-help',
  '/team-intake',
  '/team-plan',
  '/handoff',
  '/team-execute',
  '/team-review',
  '/team-release',
  '/team-closeout',
  '/plan',
  '/tdd',
  '/code-review',
  '/build-fix',
  '/verify',
  '/multi-frontend',
  '/multi-backend',
  '/quick',
  '/pause',
  '/resume',
  '/pua',
  '/harness-audit',
  '/model-route',
  '/evolve',
  '/learn',
  '/agent-dev',
]

const MEM_CONTEXT_TAG = '<claude-mem-context>'
const LEGACY_SCRIPT_RE = /(?:python3\s+scripts\/(?:build_platform_artifacts|validate_library)\.py|validate_library\.py|build_platform_artifacts\.py)/
const OUTDATED_TARBALL_RE = /colin4k1024-tsp-create-2\.1\.5\.tgz/

function walkMarkdownFiles(rootDir, currentDir, out) {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
      continue
    }

    const absolutePath = path.join(currentDir, entry.name)
    if (entry.isDirectory()) {
      walkMarkdownFiles(rootDir, absolutePath, out)
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(path.relative(rootDir, absolutePath))
    }
  }
}

function parseFrontmatter(markdownText) {
  const match = markdownText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) {
    return null
  }

  const lines = match[1].split(/\r?\n/)
  const data = {}
  let currentListKey = null

  for (const line of lines) {
    const listMatch = line.match(/^\s*-\s*(.+)$/)
    if (listMatch && currentListKey) {
      data[currentListKey].push(stripQuotes(listMatch[1].trim()))
      continue
    }

    const kvMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!kvMatch) {
      currentListKey = null
      continue
    }

    const key = kvMatch[1]
    const rawValue = kvMatch[2].trim()

    if (rawValue.length === 0) {
      data[key] = []
      currentListKey = key
      continue
    }

    data[key] = stripQuotes(rawValue)
    currentListKey = null
  }

  return data
}

function stripQuotes(value) {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function normalizeDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function daysBetween(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((b.getTime() - a.getTime()) / msPerDay)
}

function readFile(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

function validateDocFreshness(options = {}) {
  const root = path.resolve(options.root || process.cwd())
  const markdownFiles = []
  walkMarkdownFiles(root, root, markdownFiles)
  markdownFiles.sort()

  const errors = []
  const warnings = []
  const now = new Date()

  for (const relativePath of markdownFiles) {
    const text = readFile(root, relativePath)

    if (text.includes(MEM_CONTEXT_TAG)) {
      errors.push(`${relativePath}: 禁止提交会话记忆块 (${MEM_CONTEXT_TAG})`)
    }
  }

  for (const relativePath of AUTHORITATIVE_DOCS) {
    const absolutePath = path.join(root, relativePath)
    if (!fs.existsSync(absolutePath)) {
      errors.push(`${relativePath}: 缺少权威入口文档`)
      continue
    }

    const text = readFile(root, relativePath)
    if (LEGACY_SCRIPT_RE.test(text)) {
      errors.push(`${relativePath}: 出现旧脚本别名（validate_library.py/build_platform_artifacts.py）`)
    }

    if (OUTDATED_TARBALL_RE.test(text)) {
      errors.push(`${relativePath}: 出现过期 tarball 版本示例 (2.1.5)`)
    }
  }

  for (const relativePath of markdownFiles) {
    if (!relativePath.startsWith(path.join('docs', ''))) {
      continue
    }

    const text = readFile(root, relativePath)
    const frontmatter = parseFrontmatter(text)
    if (!frontmatter) {
      continue
    }

    if (frontmatter.status !== 'active') {
      continue
    }

    for (const field of REQUIRED_ACTIVE_FIELDS) {
      const value = frontmatter[field]
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        errors.push(`${relativePath}: active 文档缺少必填字段 ${field}`)
      }
    }

    for (const dateField of ['updated', 'last_verified']) {
      const parsed = normalizeDate(frontmatter[dateField])
      if (!parsed) {
        errors.push(`${relativePath}: 字段 ${dateField} 必须为 YYYY-MM-DD`)
        continue
      }

      const age = daysBetween(parsed, now)
      if (age > MAX_STALENESS_DAYS) {
        errors.push(`${relativePath}: 字段 ${dateField} 已超出 ${MAX_STALENESS_DAYS} 天有效窗口（当前 ${age} 天）`)
      }
    }
  }

  for (const relativePath of REQUIRED_HISTORICAL_DOCS) {
    const absolutePath = path.join(root, relativePath)
    if (!fs.existsSync(absolutePath)) {
      warnings.push(`${relativePath}: 未找到历史分组文档，跳过检查`)
      continue
    }

    const text = readFile(root, relativePath)
    const frontmatter = parseFrontmatter(text)
    if (!frontmatter || frontmatter.doc_tier !== 'historical') {
      errors.push(`${relativePath}: 历史文档必须设置 doc_tier: historical`)
    }
  }

  for (const relativePath of COMMAND_SURFACE_DOCS) {
    const absolutePath = path.join(root, relativePath)
    if (!fs.existsSync(absolutePath)) {
      errors.push(`${relativePath}: 缺少命令口径文档`)
      continue
    }

    const text = readFile(root, relativePath)
    const missingCommands = EXPECTED_COMMANDS.filter((command) => !text.includes(command))
    if (missingCommands.length > 0) {
      errors.push(`${relativePath}: 缺少命令口径 ${missingCommands.join(', ')}`)
    }
  }

  return {
    root,
    markdownFileCount: markdownFiles.length,
    authoritativeDocCount: AUTHORITATIVE_DOCS.length,
    activeDocCount: markdownFiles.filter((relativePath) => {
      if (!relativePath.startsWith(path.join('docs', ''))) {
        return false
      }
      const frontmatter = parseFrontmatter(readFile(root, relativePath))
      return frontmatter && frontmatter.status === 'active'
    }).length,
    warningCount: warnings.length,
    errorCount: errors.length,
    warnings,
    errors,
  }
}

function formatHumanReport(report) {
  const lines = []
  if (report.warningCount > 0) {
    lines.push('Doc freshness warnings:')
    for (const warning of report.warnings) {
      lines.push(`- ${warning}`)
    }
  }

  if (report.errorCount > 0) {
    lines.push('Doc freshness validation failed:')
    for (const error of report.errors) {
      lines.push(`- ${error}`)
    }
    return `${lines.join('\n')}\n`
  }

  lines.push('Doc freshness validation passed.')
  lines.push(`- Scanned Markdown files: ${report.markdownFileCount}`)
  lines.push(`- Authoritative docs checked: ${report.authoritativeDocCount}`)
  lines.push(`- Active docs metadata checked: ${report.activeDocCount}`)
  return `${lines.join('\n')}\n`
}

function main() {
  const report = validateDocFreshness({ root: process.cwd() })
  const output = formatHumanReport(report)
  if (report.errorCount > 0) {
    process.stderr.write(output)
    process.exit(1)
  }
  process.stdout.write(output)
}

if (require.main === module) {
  main()
}

module.exports = {
  formatHumanReport,
  main,
  parseFrontmatter,
  validateDocFreshness,
}
