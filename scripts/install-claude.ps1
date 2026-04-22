$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$ArgsList = @()
if ($env:CLAUDE_HOME_DIR) {
  $ArgsList += @("--claude-home", $env:CLAUDE_HOME_DIR)
}

node scripts/install-platform.js claude @ArgsList @args
