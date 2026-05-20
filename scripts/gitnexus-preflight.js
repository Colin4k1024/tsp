#!/usr/bin/env node
'use strict'

const { spawnSync } = require('child_process')

const MIN_NODE_MAJOR = 20
const PACKAGE_NAME = 'gitnexus'
const NPM_METADATA_TIMEOUT_MS = 8000

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    ...options,
  })
}

function summarizeCommandFailure(result) {
  if (result.error) {
    return result.error.message
  }

  return `${result.stdout || ''}${result.stderr || ''}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(' | ')
}

function parseNodeVersion(text) {
  const match = String(text || '').trim().match(/^v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) {
    return null
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: `${match[1]}.${match[2]}.${match[3]}`,
  }
}

function isNodeSupported(version) {
  return Boolean(version && version.major >= MIN_NODE_MAJOR)
}

function detectCommand(command) {
  if (process.env.GITNEXUS_PREFLIGHT_SKIP_COMMANDS === '1') {
    return {
      ok: true,
      command,
      output: 'skipped by test fixture',
    }
  }

  const result = run(command, ['--version'])
  if (result.error || result.status !== 0) {
    return {
      ok: false,
      command,
      output: result.error ? result.error.message : `${result.stdout || ''}${result.stderr || ''}`.trim(),
    }
  }

  return {
    ok: true,
    command,
    output: `${result.stdout || ''}${result.stderr || ''}`.trim(),
  }
}

function parsePackageMetadata(rawJson) {
  if (!rawJson) {
    return null
  }

  const parsed = JSON.parse(rawJson)
  return {
    version: parsed.version || '(unknown)',
    license: parsed.license || '(unknown)',
    engines: parsed.engines || {},
  }
}

function loadPackageMetadata() {
  if (process.env.GITNEXUS_PREFLIGHT_NPM_VIEW_JSON) {
    return {
      ok: true,
      source: 'env',
      metadata: parsePackageMetadata(process.env.GITNEXUS_PREFLIGHT_NPM_VIEW_JSON),
    }
  }

  const result = run('npm', ['view', PACKAGE_NAME, 'version', 'license', 'engines', '--json'], {
    timeout: NPM_METADATA_TIMEOUT_MS,
  })
  if (result.error || result.status !== 0) {
    return {
      ok: false,
      source: 'npm',
      warning: summarizeCommandFailure(result),
    }
  }

  try {
    return {
      ok: true,
      source: 'npm',
      metadata: parsePackageMetadata(result.stdout),
    }
  } catch (error) {
    return {
      ok: false,
      source: 'npm',
      warning: `Failed to parse npm metadata: ${error.message || error}`,
    }
  }
}

function main() {
  console.log('GitNexus preflight check')
  console.log('========================')

  const nodeVersion = parseNodeVersion(process.env.GITNEXUS_PREFLIGHT_NODE_VERSION || process.version)
  const npm = detectCommand('npm')
  const npx = detectCommand('npx')
  const packageInfo = loadPackageMetadata()
  const warnings = []

  let hasFailure = false

  if (!nodeVersion) {
    hasFailure = true
    console.log(`- Node: unable to detect version (requires Node >= ${MIN_NODE_MAJOR})`)
  } else if (!isNodeSupported(nodeVersion)) {
    hasFailure = true
    console.log(`- Node: ${nodeVersion.raw} (requires Node >= ${MIN_NODE_MAJOR})`)
  } else {
    console.log(`- Node: ${nodeVersion.raw} (ok)`)
  }

  if (!npm.ok) {
    hasFailure = true
    console.log('- npm: missing or unavailable')
  } else {
    console.log(`- npm: ${npm.output || 'available'} (ok)`)
  }

  if (!npx.ok) {
    hasFailure = true
    console.log('- npx: missing or unavailable')
  } else {
    console.log(`- npx: ${npx.output || 'available'} (ok)`)
  }

  if (packageInfo.ok && packageInfo.metadata) {
    const engine = packageInfo.metadata.engines.node || '(not declared)'
    console.log(`- GitNexus package: ${packageInfo.metadata.version} (license ${packageInfo.metadata.license}, node ${engine})`)
  } else {
    warnings.push(`Could not read npm metadata for ${PACKAGE_NAME}; continue only after checking the upstream license and engine manually.`)
    if (packageInfo.warning) {
      warnings.push(packageInfo.warning)
    }
    console.log('- GitNexus package: metadata unavailable (warning)')
  }

  if (warnings.length) {
    console.log('\nWarnings:')
    for (const warning of warnings) {
      console.log(`- ${warning}`)
    }
  }

  console.log('\nControlled integration boundaries:')
  console.log('- GitNexus is optional and is not installed by TSP.')
  console.log('- Review the upstream license before use; current npm metadata may report PolyForm-Noncommercial-1.0.0.')
  console.log('- Do not run `gitnexus setup` automatically; it writes global editor/MCP configuration.')
  console.log('- Do not run `gitnexus analyze` without `--skip-agents-md` in TSP-managed repositories.')

  if (hasFailure) {
    console.log('\nFix the failed checks before enabling GitNexus for a project.')
    process.exit(1)
  }

  console.log('\nRecommended next commands:')
  console.log('- npx --yes gitnexus@latest analyze --skip-agents-md')
  console.log('- npx --yes gitnexus@latest status')
  console.log('- npx --yes gitnexus@latest list')

  console.log('\nManual MCP command:')
  console.log('- npx --yes gitnexus@latest mcp')
}

main()
