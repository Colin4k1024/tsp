#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { buildInstallCommand, mapTarget } = require('./install-codegraph')

const MIN_NODE_MAJOR = 18
const MAX_NODE_MAJOR_EXCLUSIVE = 25
const PACKAGE_NAME = '@colbymchenry/codegraph'

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
  return Boolean(
    version
      && version.major >= MIN_NODE_MAJOR
      && version.major < MAX_NODE_MAJOR_EXCLUSIVE
  )
}

function loadPackageMetadata() {
  if (process.env.CODEGRAPH_PREFLIGHT_PACKAGE_JSON) {
    return {
      ok: true,
      source: 'env',
      metadata: JSON.parse(process.env.CODEGRAPH_PREFLIGHT_PACKAGE_JSON),
    }
  }

  try {
    const packageJsonPath = require.resolve(`${PACKAGE_NAME}/package.json`)
    return {
      ok: true,
      source: packageJsonPath,
      metadata: JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')),
    }
  } catch (error) {
    return {
      ok: false,
      source: 'node-resolution',
      warning: error.message || String(error),
    }
  }
}

function detectCli(target) {
  if (process.env.CODEGRAPH_PREFLIGHT_SKIP_CLI === '1') {
    return {
      ok: true,
      command: '(skipped)',
      output: 'skipped by CODEGRAPH_PREFLIGHT_SKIP_CLI',
    }
  }

  let install
  try {
    install = buildInstallCommand(target || 'codex')
  } catch (error) {
    return {
      ok: false,
      command: 'codegraph',
      output: error.message || String(error),
    }
  }

  if (!install.supported) {
    return {
      ok: true,
      command: '(unsupported target skipped)',
      output: install.reason,
    }
  }

  const args = install.args.slice(0, install.args.length - 4).concat(['--help'])
  const result = spawnSync(install.command, args, {
    encoding: 'utf8',
    timeout: 8000,
  })

  if (result.error || result.status !== 0) {
    return {
      ok: false,
      command: install.command,
      output: result.error ? result.error.message : `${result.stdout || ''}${result.stderr || ''}`.trim(),
    }
  }

  return {
    ok: true,
    command: install.command,
    output: 'codegraph --help',
  }
}

function main() {
  console.log('CodeGraph preflight check')
  console.log('=========================')

  const target = process.env.TSP_INSTALL_TARGET || process.env.CODEGRAPH_PREFLIGHT_TARGET || ''
  const nodeVersion = parseNodeVersion(process.env.CODEGRAPH_PREFLIGHT_NODE_VERSION || process.version)
  const packageInfo = loadPackageMetadata()
  const cli = detectCli(target)
  const mappedTarget = target ? mapTarget(target) : null
  let hasFailure = false

  if (!nodeVersion) {
    hasFailure = true
    console.log(`- Node: unable to detect version (requires >= ${MIN_NODE_MAJOR} and < ${MAX_NODE_MAJOR_EXCLUSIVE})`)
  } else if (!isNodeSupported(nodeVersion)) {
    hasFailure = true
    console.log(`- Node: ${nodeVersion.raw} (requires >= ${MIN_NODE_MAJOR} and < ${MAX_NODE_MAJOR_EXCLUSIVE})`)
  } else {
    console.log(`- Node: ${nodeVersion.raw} (ok)`)
  }

  if (packageInfo.ok && packageInfo.metadata) {
    const engine = packageInfo.metadata.engines && packageInfo.metadata.engines.node
      ? packageInfo.metadata.engines.node
      : '(not declared)'
    console.log(`- CodeGraph package: ${packageInfo.metadata.version || '(unknown)'} (license ${packageInfo.metadata.license || '(unknown)'}, node ${engine})`)
  } else {
    hasFailure = true
    console.log(`- CodeGraph package: unavailable (${packageInfo.warning || 'not installed'})`)
  }

  if (!cli.ok) {
    hasFailure = true
    console.log(`- CodeGraph CLI: unavailable (${cli.output || cli.command})`)
  } else {
    console.log(`- CodeGraph CLI: ${cli.output} (ok)`)
  }

  if (target) {
    if (mappedTarget) {
      console.log(`- TSP target: ${target} -> CodeGraph target ${mappedTarget} (ok)`)
    } else {
      console.log(`- TSP target: ${target} (unsupported by upstream installer; wrapper will skip)`)
    }
  } else {
    console.log('- TSP target: not provided (doctor only)')
  }

  console.log('\nControlled integration boundaries:')
  console.log('- TSP calls CodeGraph installer with the current target only; it never uses --target=auto.')
  console.log('- TSP install does not run `codegraph init -i`; initialize indexes inside target projects only.')
  console.log('- Do not commit `.codegraph/` databases as TSP artifacts.')

  if (hasFailure) {
    console.log('\nFix failed checks before applying the CodeGraph integration.')
    process.exit(1)
  }

  console.log('\nRecommended next commands:')
  console.log('- npm run codegraph:doctor')
  console.log('- codegraph init -i')
  console.log('- codegraph status')
}

if (require.main === module) {
  main()
}

module.exports = {
  isNodeSupported,
  parseNodeVersion,
}
