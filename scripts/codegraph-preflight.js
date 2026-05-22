#!/usr/bin/env node
'use strict'

const { spawnSync } = require('child_process')
const {
  buildStandaloneInstallerInfo,
  findOnPath,
  mapTarget,
  resolveCodeGraphBin,
} = require('./install-codegraph')

function detectPlatform(platform = process.platform) {
  if (platform === 'darwin' || platform === 'linux' || platform === 'win32') {
    return {
      ok: true,
      output: platform,
    }
  }

  return {
    ok: false,
    output: `unsupported platform: ${platform}`,
  }
}

function detectDownloader(platform = process.platform) {
  const installer = buildStandaloneInstallerInfo(platform)
  if (!installer.supported) {
    return {
      ok: false,
      output: installer.reason,
    }
  }

  if (platform === 'win32') {
    const command = findOnPath('powershell.exe') || findOnPath('powershell') || findOnPath('pwsh')
    if (!command) {
      return {
        ok: false,
        output: 'PowerShell not found; install PowerShell or provide CODEGRAPH_INSTALL_BIN',
      }
    }
    return {
      ok: true,
      output: command,
    }
  }

  const curl = findOnPath('curl')
  if (!curl) {
    return {
      ok: false,
      output: 'curl not found; install curl or provide CODEGRAPH_INSTALL_BIN',
    }
  }

  return {
    ok: true,
    output: curl,
  }
}

function detectCli() {
  if (process.env.CODEGRAPH_PREFLIGHT_SKIP_CLI === '1') {
    return {
      ok: true,
      command: '(skipped)',
      output: 'skipped by CODEGRAPH_PREFLIGHT_SKIP_CLI',
    }
  }

  const resolved = resolveCodeGraphBin()
  if (!resolved) {
    return {
      ok: false,
      command: 'codegraph',
      output: 'CodeGraph standalone binary not found',
    }
  }

  const result = spawnSync(resolved.command, [...resolved.argsPrefix, '--help'], {
    encoding: 'utf8',
    timeout: 8000,
  })

  if (result.error || result.status !== 0) {
    return {
      ok: false,
      command: resolved.command,
      output: result.error ? result.error.message : `${result.stdout || ''}${result.stderr || ''}`.trim(),
    }
  }

  return {
    ok: true,
    command: resolved.command,
    output: `${resolved.displayCommand} (${resolved.source})`,
  }
}

function main() {
  console.log('CodeGraph preflight check')
  console.log('=========================')

  const target = process.env.TSP_INSTALL_TARGET || process.env.CODEGRAPH_PREFLIGHT_TARGET || ''
  const platform = detectPlatform()
  const downloader = detectDownloader()
  const cli = detectCli()
  const mappedTarget = target ? mapTarget(target) : null
  let hasFailure = false

  if (!platform.ok) {
    hasFailure = true
    console.log(`- Platform: ${platform.output}`)
  } else {
    console.log(`- Platform: ${platform.output} (ok)`)
  }

  if (!downloader.ok) {
    hasFailure = true
    console.log(`- Standalone installer dependency: ${downloader.output}`)
  } else {
    console.log(`- Standalone installer dependency: ${downloader.output} (ok)`)
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
  console.log('- TSP installs CodeGraph through the official standalone curl/PowerShell installer when no binary is available.')
  console.log('- TSP calls CodeGraph installer with the current target only; it never uses --target=auto.')
  console.log('- Claude SessionStart may initialize project indexes automatically; Codex/OpenCode rely on instructions and diagnostics.')
  console.log('- Do not commit `.codegraph/` databases as TSP artifacts.')

  if (hasFailure) {
    const installer = buildStandaloneInstallerInfo()
    console.log('\nFix failed checks before applying the CodeGraph integration.')
    if (installer.supported) {
      console.log(`Recommended standalone install: ${installer.display}`)
    }
    console.log('Offline fallback: set CODEGRAPH_INSTALL_BIN=/path/to/codegraph')
    process.exit(1)
  }

  console.log('\nRecommended next commands:')
  console.log('- npm run codegraph:doctor')
  console.log('- codegraph status')
}

if (require.main === module) {
  main()
}

module.exports = {
  detectCli,
  detectDownloader,
  detectPlatform,
}
