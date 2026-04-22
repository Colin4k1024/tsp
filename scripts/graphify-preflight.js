#!/usr/bin/env node
'use strict'

const { spawnSync } = require('child_process')

const MIN_PYTHON_MAJOR = 3
const MIN_PYTHON_MINOR = 10

function run(command, args) {
  return spawnSync(command, args, { encoding: 'utf8' })
}

function parsePythonVersion(text) {
  const match = text.match(/Python\s+(\d+)\.(\d+)\.(\d+)/i)
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

function isPythonAtLeast(version, minMajor, minMinor) {
  if (!version) {
    return false
  }
  if (version.major > minMajor) {
    return true
  }
  if (version.major < minMajor) {
    return false
  }
  return version.minor >= minMinor
}

function detectPython() {
  const candidates = ['python3', 'python']

  for (const cmd of candidates) {
    const result = run(cmd, ['--version'])
    if (result.error) {
      continue
    }

    const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
    const version = parsePythonVersion(output)
    if (!version) {
      continue
    }

    return {
      command: cmd,
      version,
      ok: isPythonAtLeast(version, MIN_PYTHON_MAJOR, MIN_PYTHON_MINOR),
      output,
    }
  }

  return null
}

function detectGraphifyCli() {
  const result = run('graphify', ['--version'])
  if (!result.error && result.status === 0) {
    return {
      ok: true,
      command: 'graphify',
      output: `${result.stdout || ''}${result.stderr || ''}`.trim(),
    }
  }

  const helpResult = run('graphify', ['--help'])
  if (!helpResult.error && helpResult.status === 0) {
    return {
      ok: true,
      command: 'graphify',
      output: 'graphify --help',
    }
  }

  return {
    ok: false,
    command: 'graphify',
    output: result.error ? result.error.message : `${result.stdout || ''}${result.stderr || ''}`.trim(),
  }
}

function main() {
  console.log('Graphify preflight check')
  console.log('=======================')

  const python = detectPython()
  const graphify = detectGraphifyCli()

  let hasFailure = false

  if (!python) {
    hasFailure = true
    console.log('- Python: missing (requires Python >= 3.10)')
  } else if (!python.ok) {
    hasFailure = true
    console.log(`- Python: ${python.command} ${python.version.raw} (requires >= ${MIN_PYTHON_MAJOR}.${MIN_PYTHON_MINOR})`)
  } else {
    console.log(`- Python: ${python.command} ${python.version.raw} (ok)`)
  }

  if (!graphify.ok) {
    hasFailure = true
    console.log('- Graphify CLI: missing (command: graphify)')
  } else {
    console.log('- Graphify CLI: graphify (ok)')
  }

  if (hasFailure) {
    console.log('\nSuggested fixes:')
    console.log(`1. Install Python ${MIN_PYTHON_MAJOR}.${MIN_PYTHON_MINOR}+ and make it available in PATH.`)
    console.log('2. Install Graphify package in your env: python3.10 -m pip install --upgrade graphify')
    console.log('3. Re-run this check: npm run graphify:doctor')
    console.log('4. Verify commands manually: graphify --help')
    process.exit(1)
  }

  console.log('\nRecommended next commands:')
  console.log('- graphify build ...')
  console.log('- graphify query ...')
  console.log('- graphify path ...')
  console.log('- graphify explain ...')
}

main()
