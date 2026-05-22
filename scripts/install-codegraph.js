#!/usr/bin/env node
'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const INSTALL_SH_URL = 'https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh'
const INSTALL_PS1_URL = 'https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.ps1'

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

function isWindows(platform = process.platform) {
  return platform === 'win32'
}

function executableNames(name, platform = process.platform) {
  if (!isWindows(platform)) {
    return [name]
  }

  const extensions = String(process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM')
    .split(';')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
  const lowerName = name.toLowerCase()
  if (extensions.some(ext => lowerName.endsWith(ext))) {
    return [name]
  }
  return [name, ...extensions.map(ext => `${name}${ext}`)]
}

function canExecute(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK)
    return true
  } catch {
    return false
  }
}

function findOnPath(commandName, options = {}) {
  const searchPath = options.pathValue !== undefined ? options.pathValue : process.env.PATH
  const platform = options.platform || process.platform
  const delimiter = isWindows(platform) ? ';' : path.delimiter
  const names = executableNames(commandName, platform)

  for (const entry of String(searchPath || '').split(delimiter)) {
    if (!entry) {
      continue
    }
    for (const name of names) {
      const candidate = path.join(entry, name)
      if (canExecute(candidate)) {
        return candidate
      }
    }
  }

  return null
}

function defaultCodeGraphCandidates(options = {}) {
  const homeDir = options.homeDir || os.homedir()
  const platform = options.platform || process.platform

  if (isWindows(platform)) {
    const localAppData = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local')
    return [
      path.join(localAppData, 'codegraph', 'current', 'bin', 'codegraph.exe'),
      path.join(localAppData, 'codegraph', 'current', 'bin', 'codegraph.cmd'),
    ]
  }

  return [
    path.join(homeDir, '.local', 'bin', 'codegraph'),
    path.join(homeDir, '.codegraph', 'current', 'bin', 'codegraph'),
  ]
}

function resolveCodeGraphBin(options = {}) {
  if (process.env.CODEGRAPH_INSTALL_BIN) {
    return {
      command: process.env.CODEGRAPH_INSTALL_BIN,
      argsPrefix: [],
      displayCommand: process.env.CODEGRAPH_INSTALL_BIN,
      source: 'env',
    }
  }

  if (process.env.CODEGRAPH_INSTALL_FORCE_STANDALONE === '1' && !options.ignoreForceStandalone) {
    return null
  }

  const pathCandidate = findOnPath('codegraph', options)
  if (pathCandidate) {
    return {
      command: pathCandidate,
      argsPrefix: [],
      displayCommand: pathCandidate,
      source: 'path',
    }
  }

  for (const candidate of defaultCodeGraphCandidates(options)) {
    if (canExecute(candidate)) {
      return {
        command: candidate,
        argsPrefix: [],
        displayCommand: candidate,
        source: 'default-location',
      }
    }
  }

  return null
}

function resolvePowerShellCommand() {
  return findOnPath('powershell.exe') || findOnPath('powershell') || findOnPath('pwsh') || 'powershell.exe'
}

function buildStandaloneInstallerInfo(platform = process.platform) {
  if (platform === 'darwin' || platform === 'linux') {
    return {
      supported: true,
      platform,
      display: `curl -fsSL ${INSTALL_SH_URL} -o "$TMPDIR/codegraph-install.sh" && sh "$TMPDIR/codegraph-install.sh"`,
      requiredCommand: 'curl',
      url: INSTALL_SH_URL,
    }
  }

  if (platform === 'win32') {
    return {
      supported: true,
      platform,
      display: `irm ${INSTALL_PS1_URL} | iex`,
      requiredCommand: resolvePowerShellCommand(),
      url: INSTALL_PS1_URL,
    }
  }

  return {
    supported: false,
    platform,
    display: '',
    requiredCommand: '',
    url: '',
    reason: `CodeGraph standalone installer does not support platform: ${platform}`,
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
    ...(resolved ? resolved.argsPrefix : []),
    'install',
    `--target=${mappedTarget}`,
    '--location=global',
    '--yes',
  ]
  const displayCommand = resolved ? resolved.displayCommand : 'codegraph'

  return {
    supported: true,
    target: mappedTarget,
    command: resolved ? resolved.command : null,
    args,
    display: [displayCommand, ...args.slice(resolved ? resolved.argsPrefix.length : 0)].join(' '),
    needsBootstrap: !resolved,
    bootstrap: buildStandaloneInstallerInfo(),
    binarySource: resolved ? resolved.source : null,
  }
}

function spawnChecked(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    encoding: 'utf8',
    stdio: options.stdio || ['inherit', process.stderr, process.stderr],
    timeout: options.timeout,
  })

  return typeof result.status === 'number' ? result.status : 1
}

function runStandaloneInstaller() {
  const installer = buildStandaloneInstallerInfo()
  if (!installer.supported) {
    throw new Error(installer.reason)
  }

  if (installer.platform === 'darwin' || installer.platform === 'linux') {
    const curl = findOnPath('curl') || 'curl'
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codegraph-install-'))
    const scriptPath = path.join(tempDir, 'install.sh')
    try {
      let status = spawnChecked(curl, ['-fsSL', INSTALL_SH_URL, '-o', scriptPath])
      if (status !== 0) {
        return status
      }
      status = spawnChecked('sh', [scriptPath])
      return status
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }

  return spawnChecked(resolvePowerShellCommand(), [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    `irm ${INSTALL_PS1_URL} | iex`,
  ])
}

function buildTargetInstallInvocation(target) {
  const mappedTarget = mapTarget(target)
  const resolved = resolveCodeGraphBin({ ignoreForceStandalone: true })
  if (!mappedTarget || !resolved) {
    return null
  }

  const args = [
    ...resolved.argsPrefix,
    'install',
    `--target=${mappedTarget}`,
    '--location=global',
    '--yes',
  ]

  return {
    command: resolved.command,
    args,
  }
}

function printHelp() {
  console.log(`Usage: node scripts/install-codegraph.js [--target <claude|codex|cursor|opencode>] [--dry-run]

Installs the standalone CodeGraph CLI with the official upstream curl/PowerShell installer when needed,
then configures CodeGraph for the current TSP install target only.

Environment:
  CODEGRAPH_INSTALL_BIN=<path>         Use an existing CodeGraph binary, including offline installs.
  CODEGRAPH_INSTALL_FORCE_STANDALONE=1 Re-run the official standalone installer before target config.

Project indexes are created by the Claude SessionStart auto-init hook or by running codegraph init -i.
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
    if (install.needsBootstrap) {
      console.log(`CodeGraph standalone install command: ${install.bootstrap.display}`)
    } else {
      console.log(`CodeGraph binary: ${install.command} (${install.binarySource})`)
    }
    console.log(`CodeGraph target install command: ${install.display}`)
    return 0
  }

  if (install.needsBootstrap) {
    console.error('Installing CodeGraph standalone CLI with the official upstream installer')
    const bootstrapStatus = runStandaloneInstaller()
    if (bootstrapStatus !== 0) {
      return bootstrapStatus
    }
  }

  const invocation = buildTargetInstallInvocation(install.target)
  if (!invocation) {
    console.error('CodeGraph binary is still unavailable after standalone install. Add it to PATH or set CODEGRAPH_INSTALL_BIN.')
    return 1
  }

  console.error(`Running CodeGraph installer for ${install.target}`)
  return spawnChecked(invocation.command, invocation.args)
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
  buildStandaloneInstallerInfo,
  defaultCodeGraphCandidates,
  findOnPath,
  mapTarget,
  parseArgs,
  resolveCodeGraphBin,
  run,
}
