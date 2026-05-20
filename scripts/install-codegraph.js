#!/usr/bin/env node
'use strict'

const path = require('path')
const { spawnSync } = require('child_process')

const SUPPORTED_TARGETS = Object.freeze({
  claude: 'claude',
  codex: 'codex',
  cursor: 'cursor',
  opencode: 'opencode',
})

function normalizeTarget(value) {
  return String(value || '').trim().toLowerCase()
}

function mapTarget(value) {
  return SUPPORTED_TARGETS[normalizeTarget(value)] || null
}

function parseArgs(argv) {
  const parsed = {
    target: process.env.TSP_INSTALL_TARGET || '',
    dryRun: process.env.CODEGRAPH_INSTALL_DRY_RUN === '1',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--target') {
      parsed.target = argv[index + 1] || ''
      index += 1
      continue
    }
    if (arg.startsWith('--target=')) {
      parsed.target = arg.slice('--target='.length)
      continue
    }
    if (arg === '--dry-run') {
      parsed.dryRun = true
      continue
    }
    if (arg === '--help' || arg === '-h') {
      parsed.help = true
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  return parsed
}

function resolveCodeGraphBin() {
  if (process.env.CODEGRAPH_INSTALL_BIN) {
    return {
      command: process.env.CODEGRAPH_INSTALL_BIN,
      argsPrefix: [],
      displayCommand: process.env.CODEGRAPH_INSTALL_BIN,
    }
  }

  let packageJsonPath
  try {
    packageJsonPath = require.resolve('@colbymchenry/codegraph/package.json')
  } catch (error) {
    throw new Error(
      'Unable to resolve @colbymchenry/codegraph. Run npm install before applying the CodeGraph integration.'
    )
  }

  const binPath = path.join(path.dirname(packageJsonPath), 'dist', 'bin', 'codegraph.js')
  return {
    command: process.execPath,
    argsPrefix: [binPath],
    displayCommand: `${process.execPath} ${binPath}`,
  }
}

function buildInstallCommand(target) {
  const mappedTarget = mapTarget(target)
  if (!mappedTarget) {
    return {
      supported: false,
      target: normalizeTarget(target),
      reason: `CodeGraph upstream installer does not support TSP target: ${target || '(missing)'}`,
    }
  }

  const resolved = resolveCodeGraphBin()
  const args = [
    ...resolved.argsPrefix,
    'install',
    `--target=${mappedTarget}`,
    '--location=global',
    '--yes',
  ]

  return {
    supported: true,
    target: mappedTarget,
    command: resolved.command,
    args,
    display: [resolved.displayCommand, ...args.slice(resolved.argsPrefix.length)].join(' '),
  }
}

function printHelp() {
  console.log(`Usage: node scripts/install-codegraph.js [--target <claude|codex|cursor|opencode>] [--dry-run]

Runs the upstream CodeGraph installer for the current TSP install target only.
The project index is not initialized here; run codegraph init -i inside a target project when needed.
`)
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  if (options.help) {
    printHelp()
    return 0
  }

  const install = buildInstallCommand(options.target)
  if (!install.supported) {
    console.error(`Skipping CodeGraph installer: ${install.reason}`)
    return 0
  }

  if (options.dryRun) {
    console.log(`CodeGraph install command: ${install.display}`)
    return 0
  }

  console.error(`Running CodeGraph installer for ${install.target}`)
  const result = spawnSync(install.command, install.args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    stdio: ['inherit', process.stderr, process.stderr],
  })

  return typeof result.status === 'number' ? result.status : 1
}

if (require.main === module) {
  try {
    process.exit(run())
  } catch (error) {
    console.error(error.message || error)
    process.exit(1)
  }
}

module.exports = {
  buildInstallCommand,
  mapTarget,
  parseArgs,
  run,
}
