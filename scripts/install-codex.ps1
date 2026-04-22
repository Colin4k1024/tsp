$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$ArgsList = @()
if ($env:CODEX_HOME_DIR) {
  $ArgsList += @("--codex-home", $env:CODEX_HOME_DIR)
}
if ($env:AGENTS_HOME_DIR) {
  $ArgsList += @("--agents-home", $env:AGENTS_HOME_DIR)
}

node scripts/install-platform.js codex @ArgsList @args
