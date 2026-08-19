/**
 * TSP Harness Plugin - DSH Desktop ESM Entry
 *
 * Single-file ES module. All scanner, config, and tools logic inlined.
 * Uses ctx.get() for optional services (no hard inject) to match
 * DSH Desktop's runtime where some services may not be present.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// ── Scanner ──────────────────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }
  const meta = {}
  const lines = match[1].split('\n')
  let currentKey = null
  let currentValue = ''
  for (const line of lines) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (kv) {
      if (currentKey) meta[currentKey] = currentValue.trim()
      currentKey = kv[1]
      currentValue = kv[2]
    } else if (currentKey) {
      currentValue += ' ' + line.trim()
    }
  }
  if (currentKey) meta[currentKey] = currentValue.trim()
  return { meta, body: match[2] }
}

function readMd(filePath) {
  try { return parseFrontmatter(readFileSync(filePath, 'utf-8')) }
  catch { return null }
}

function listDirs(dir) {
  try { return readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name) }
  catch { return [] }
}

function listMd(dir) {
  try { return readdirSync(dir, { withFileTypes: true }).filter(f => f.isFile() && f.name.endsWith('.md')).map(f => f.name) }
  catch { return [] }
}

function summary(body) {
  for (const line of body.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#') && !t.startsWith('>') && !t.startsWith('---')) return t.slice(0, 200)
  }
  return ''
}

function isTspProject(root) {
  return existsSync(join(root, 'skills'))
}

function scanTspProject(projectRoot) {
  const result = { projectRoot, skills: [], commands: [], specialists: [], rules: [], agentsMd: null }

  // Skills
  for (const dirName of listDirs(join(projectRoot, 'skills'))) {
    const skillFile = join(projectRoot, 'skills', dirName, 'SKILL.md')
    const parsed = readMd(skillFile)
    if (!parsed) continue
    result.skills.push({
      name: parsed.meta.name || dirName,
      description: parsed.meta.description || summary(parsed.body),
      body: parsed.body,
      filePath: skillFile,
    })
  }

  // Commands
  for (const fileName of listMd(join(projectRoot, 'commands'))) {
    const filePath = join(projectRoot, 'commands', fileName)
    const parsed = readMd(filePath)
    if (!parsed) continue
    result.commands.push({
      name: fileName.replace(/\.md$/, ''),
      description: parsed.meta.description || summary(parsed.body),
      body: parsed.body,
      filePath,
    })
  }

  // Specialists
  for (const fileName of listMd(join(projectRoot, 'agents', 'specialists'))) {
    const filePath = join(projectRoot, 'agents', 'specialists', fileName)
    const parsed = readMd(filePath)
    if (!parsed) continue
    result.specialists.push({
      name: fileName.replace(/\.md$/, ''),
      description: parsed.meta.description || summary(parsed.body),
      body: parsed.body,
      filePath,
    })
  }

  // Rules (recursive)
  function scanRules(dir, prefix) {
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) }
    catch { return }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const parsed = readMd(full)
        if (!parsed) continue
        const name = prefix ? `${prefix}/${entry.name.replace(/\.md$/, '')}` : entry.name.replace(/\.md$/, '')
        result.rules.push({ name, group: prefix || 'general', body: parsed.body, filePath: full })
      } else if (entry.isDirectory()) {
        scanRules(full, prefix ? `${prefix}/${entry.name}` : entry.name)
      }
    }
  }
  scanRules(join(projectRoot, 'rules'), '')

  // AGENTS.md
  const agentsMdPath = join(projectRoot, 'AGENTS.md')
  if (existsSync(agentsMdPath)) {
    try { result.agentsMd = readFileSync(agentsMdPath, 'utf-8') }
    catch { /* ignore */ }
  }

  return result
}

// ── Query helpers ───────────────────────────────────────────────────────────

function matches(text, query) {
  return text.toLowerCase().includes(query.toLowerCase())
}

function searchSkills(data, query) {
  if (!query) return data.skills
  return data.skills.filter(s => matches(s.name, query) || matches(s.description, query))
}

function getSkill(data, name) {
  return data.skills.find(s => s.name === name)
}

function getCommand(data, name) {
  return data.commands.find(c => c.name === name)
}

function searchRules(data, query) {
  if (!query) return data.rules
  return data.rules.filter(r => matches(r.name, query) || matches(r.body, query))
}

function getSpecialist(data, name) {
  return data.specialists.find(s => s.name === name)
}

// ── Tool definitions ─────────────────────────────────────────────────────────

function createTspTools(data) {
  return [

    {
      name: 'tsp_search_skills',
      description:
        'Search TSP skills by keyword. Returns name, description, and file path ' +
        'for each match. Use tsp_get_skill to retrieve full content.',
      parameters: {
        query: {
          type: 'string',
          required: false,
          description: 'Keyword to search in skill name or description. Empty = list all.',
        },
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            skills: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  filePath: { type: 'string' },
                },
              },
            },
          },
        },
        render: (_args, value) => {
          const list = (value && value.skills) || []
          if (list.length === 0) return [{ type: 'text', text: 'No skills found.' }]
          const lines = list.map(s => `- ${s.name}: ${s.description}`)
          return [{ type: 'text', text: `Found ${list.length} skill(s):\n${lines.join('\n')}` }]
        },
      },
      async execute(args) {
        const results = searchSkills(data, (args && args.query) || '')
        return {
          skills: results.map(s => ({
            name: s.name,
            description: s.description,
            filePath: s.filePath,
          })),
        }
      },
    },

    {
      name: 'tsp_get_skill',
      description: 'Retrieve the full content of a TSP skill by its exact name.',
      parameters: {
        name: {
          type: 'string',
          required: true,
          description: 'Exact skill name (use tsp_search_skills to find it).',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args) {
        const skill = getSkill(data, args.name)
        if (!skill) throw new Error(`Skill not found: ${args.name}`)
        return `# ${skill.name}\n\n${skill.body}`
      },
    },

    {
      name: 'tsp_list_commands',
      description: 'List all available TSP slash commands with their descriptions.',
      parameters: {},
      output: {
        schema: {
          type: 'object',
          properties: {
            commands: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        render: (_args, value) => {
          const list = (value && value.commands) || []
          if (list.length === 0) return [{ type: 'text', text: 'No commands available.' }]
          const lines = list.map(c => `- /${c.name}: ${c.description}`)
          return [{ type: 'text', text: `${list.length} command(s):\n${lines.join('\n')}` }]
        },
      },
      async execute() {
        return {
          commands: data.commands.map(c => ({
            name: c.name,
            description: c.description,
          })),
        }
      },
    },

    {
      name: 'tsp_get_command',
      description: 'Retrieve the full definition of a TSP slash command by name.',
      parameters: {
        name: {
          type: 'string',
          required: true,
          description: 'Command name without the leading slash.',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args) {
        const cmd = getCommand(data, args.name)
        if (!cmd) throw new Error(`Command not found: ${args.name}`)
        return `# /${cmd.name}\n\n${cmd.body}`
      },
    },

    {
      name: 'tsp_search_rules',
      description:
        'Search TSP rules by keyword. Returns the rule name, group, and a ' +
        'content preview. Useful for finding applicable standards and constraints.',
      parameters: {
        query: {
          type: 'string',
          required: false,
          description: 'Keyword to search in rule name or body. Empty = list all.',
        },
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            rules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  group: { type: 'string' },
                  preview: { type: 'string' },
                },
              },
            },
          },
        },
        render: (_args, value) => {
          const list = (value && value.rules) || []
          if (list.length === 0) return [{ type: 'text', text: 'No rules found.' }]
          const lines = list.map(r => `- [${r.group}] ${r.name}: ${r.preview}`)
          return [{ type: 'text', text: `${list.length} rule(s):\n${lines.join('\n')}` }]
        },
      },
      async execute(args) {
        const results = searchRules(data, (args && args.query) || '')
        return {
          rules: results.map(r => ({
            name: r.name,
            group: r.group,
            preview: r.body.slice(0, 200),
          })),
        }
      },
    },

    {
      name: 'tsp_get_specialist',
      description: 'Retrieve the full prompt of a TSP specialist agent by name.',
      parameters: {
        name: {
          type: 'string',
          required: true,
          description: 'Specialist agent name (e.g. planner, tdd-guide, code-reviewer).',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args) {
        const specialist = getSpecialist(data, args.name)
        if (!specialist) throw new Error(`Specialist not found: ${args.name}`)
        return `# Specialist: ${specialist.name}\n\n${specialist.body}`
      },
    },

  ]
}

// ── Plugin exports ───────────────────────────────────────────────────────────

export const name = 'tsp-harness'
export const inject = []

export function apply(ctx, config) {
  const cfg = {
    projectRoot: config?.projectRoot || '',
    enableTools: config?.enableTools !== false,
    enablePrompt: config?.enablePrompt !== false,
    enableSpecialists: config?.enableSpecialists !== false,
    enableRules: config?.enableRules !== false,
    maxPromptRules: config?.maxPromptRules || 0,
  }

  const projectRoot = cfg.projectRoot
    || process.env.TSP_PROJECT_ROOT
    || process.cwd()

  if (!isTspProject(projectRoot)) {
    return
  }

  const data = scanTspProject(projectRoot)

  // ── Register tools (optional: requires ctx.tools service) ──────────
  const toolsSvc = ctx.get('tools')
  if (cfg.enableTools && toolsSvc && toolsSvc.register) {
    const tools = createTspTools(data)
    for (const tool of tools) {
      try {
        const dispose = toolsSvc.register(tool)
        if (dispose && typeof dispose === 'function') {
          ctx.effect(() => dispose)
        }
      } catch { /* skip conflicts */ }
    }
  }

  // ── Inject system prompt sections (optional: requires ctx.systemPrompt) ──
  const promptSvc = ctx.get('systemPrompt')
  if (cfg.enablePrompt && promptSvc && promptSvc.section) {

    // AGENTS.md
    if (data.agentsMd) {
      try {
        const dispose = promptSvc.section({
          id: 'tsp-agents-md',
          title: 'TSP Project Context (AGENTS.md)',
          content: data.agentsMd,
          priority: 40,
        })
        if (dispose && typeof dispose === 'function') {
          ctx.effect(() => dispose)
        }
      } catch { /* ignore */ }
    }

    // Specialist agents
    if (cfg.enableSpecialists && data.specialists.length > 0) {
      const content = data.specialists
        .map(s => `### Specialist: ${s.name}\n\n${s.body}`)
        .join('\n\n---\n\n')
      try {
        const dispose = promptSvc.section({
          id: 'tsp-specialists',
          title: 'TSP Specialist Agents',
          content,
          priority: 50,
        })
        if (dispose && typeof dispose === 'function') {
          ctx.effect(() => dispose)
        }
      } catch { /* ignore */ }
    }

    // Rules
    if (cfg.enableRules && data.rules.length > 0) {
      const rules = cfg.maxPromptRules > 0
        ? data.rules.slice(0, cfg.maxPromptRules)
        : data.rules

      const groups = new Map()
      for (const rule of rules) {
        const group = rule.group || 'general'
        if (!groups.has(group)) groups.set(group, [])
        groups.get(group).push(rule)
      }

      const content = Array.from(groups.entries())
        .map(([group, entries]) => {
          const body = entries
            .map(r => `#### ${r.name}\n\n${r.body}`)
            .join('\n\n')
          return `### Rule Group: ${group}\n\n${body}`
        })
        .join('\n\n---\n\n')

      const truncated = cfg.maxPromptRules > 0 && data.rules.length > cfg.maxPromptRules
        ? `\n\n_(Showing ${cfg.maxPromptRules} of ${data.rules.length} rules. Use tsp_search_rules tool for more.)_`
        : ''

      try {
        const dispose = promptSvc.section({
          id: 'tsp-rules',
          title: 'TSP Rules & Standards',
          content: content + truncated,
          priority: 60,
        })
        if (dispose && typeof dispose === 'function') {
          ctx.effect(() => dispose)
        }
      } catch { /* ignore */ }
    }
  }

  // ── Observe tool results ────────────────────────────────────────────
  if (ctx.on) {
    try {
      ctx.on('tools/result', (_exec, _result) => {
        // Observability hook
      })
    } catch { /* ignore */ }
  }
}
