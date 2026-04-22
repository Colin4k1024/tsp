#!/usr/bin/env pwsh
# install.ps1 — Windows-native entrypoint for the ECC installer.
#
# This wrapper resolves the real repo/package root when invoked through a
# symlinked path, then delegates to the Node-based installer runtime.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptPath = $PSCommandPath

while ($true) {
    $item = Get-Item -LiteralPath $scriptPath -Force
    if (-not $item.LinkType) {
        break
    }

    $targetPath = $item.Target
    if ($targetPath -is [array]) {
        $targetPath = $targetPath[0]
    }

    if (-not $targetPath) {
        break
    }

    if (-not [System.IO.Path]::IsPathRooted($targetPath)) {
        $targetPath = Join-Path -Path $item.DirectoryName -ChildPath $targetPath
    }

    $scriptPath = [System.IO.Path]::GetFullPath($targetPath)
}

$scriptDir = Split-Path -Parent $scriptPath
$installerScript = Join-Path -Path (Join-Path -Path $scriptDir -ChildPath 'scripts') -ChildPath 'install-apply.js'

# Auto-install Node dependencies when running from a git clone
$nodeModules = Join-Path -Path $scriptDir -ChildPath 'node_modules'
if (-not (Test-Path -LiteralPath $nodeModules)) {
    Write-Host '[ECC] Installing dependencies...'
    Push-Location $scriptDir
    try {
        & npm install --no-audit --no-fund --loglevel=error
        if ($LASTEXITCODE -ne 0) {
            Write-Error "npm install failed with exit code $LASTEXITCODE"
            exit $LASTEXITCODE
        }
    }
    finally { Pop-Location }
}

& node $installerScript @args
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

# Post-install: provision oris-claude-bridge binary & enable self-evolution
$postScript = Join-Path -Path (Join-Path -Path $scriptDir -ChildPath 'scripts') -ChildPath 'post-install-bridge.js'

# Extract --target from args (default: claude)
$installTarget = 'claude'
$isDryRun = $false
for ($i = 0; $i -lt $args.Count; $i++) {
    if ($args[$i] -eq '--target' -and ($i + 1) -lt $args.Count) {
        $installTarget = $args[$i + 1]
    }
    if ($args[$i] -eq '--dry-run') {
        $isDryRun = $true
    }
}

if (-not $isDryRun) {
    & node $postScript --target $installTarget
}

exit $LASTEXITCODE
