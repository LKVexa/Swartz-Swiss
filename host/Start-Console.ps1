param([string]$StartUrl)
$ErrorActionPreference = 'Stop'
$consolePackageRoot = Split-Path -Parent $PSScriptRoot
$consoleFileManifest = Get-Content -LiteralPath (Join-Path $consolePackageRoot 'package.integrity.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($consoleFileRecord in $consoleFileManifest.files) {
    if ((Join-Path $consolePackageRoot $consoleFileRecord.path).Length -gt 240) { throw 'This extraction path is too long. Move the complete GFM-JA21 folder to D:\Codex\GFM-JA21 or another short writable folder.' }
}
$consoleSettings = Get-Content -LiteralPath (Join-Path $consolePackageRoot 'console.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($StartUrl)) { $StartUrl = [string]$consoleSettings.start_url }
if ([string]::IsNullOrWhiteSpace($StartUrl)) { $StartUrl = 'about:blank' }
$env:JA21_CONSOLE_MODE = '1'
$env:JA21_REDUCED_MOTION = '1'
$env:JA21_ALLOW_PRIVATE_HOSTS = '0'
$env:JA21_CONSOLE_ORIGINS = @($consoleSettings.local_origins) -join ';'
$env:JA21_PORTABLE_ROOT = Join-Path $consolePackageRoot 'workspace'
try {
    & (Join-Path $PSScriptRoot 'Start-JA21Browser.ps1') -Root $consolePackageRoot -StartUrl $StartUrl
} catch {
    $consoleErrorPath = Join-Path $consolePackageRoot 'workspace\logs\console-error.txt'
    $consoleFailure = $_
    try {
        . (Join-Path $PSScriptRoot 'Portable-Security.ps1')
        $null = Assert-JA21NoReparsePoint $consoleErrorPath
        [void][IO.Directory]::CreateDirectory((Split-Path -Parent $consoleErrorPath))
        ($consoleFailure | Out-String) | Set-Content -LiteralPath $consoleErrorPath -Encoding UTF8
    } catch { }
    throw
}
