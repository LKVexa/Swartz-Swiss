param([switch]$Fullscreen)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Index = Join-Path $Root 'index.html'
$PortableBase = if ($env:JA21_PORTABLE_ROOT) { Join-Path $env:JA21_PORTABLE_ROOT 'technical-institute' } else { Join-Path (Split-Path -Parent $PSScriptRoot) 'portable-runtime' }
function Assert-TechnicalPortablePath([string]$Path) {
    $Full = [IO.Path]::GetFullPath($Path)
    $Probe = $Full
    while ($Probe) {
        try { $Attributes = [IO.File]::GetAttributes($Probe) } catch { $Cause=$_.Exception.GetBaseException(); if($Cause -is [IO.FileNotFoundException] -or $Cause -is [IO.DirectoryNotFoundException]){$Attributes=0}else{throw} }
        if (($Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Institute path traverses a junction or symbolic link: $Probe" }
        $Probe = [IO.Path]::GetDirectoryName($Probe)
    }
    return $Full
}
$PackageRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$PackageSecurity = Join-Path $PackageRoot 'host\Portable-Security.ps1'
if (Test-Path -LiteralPath $PackageSecurity -PathType Leaf) {
    . $PackageSecurity
    $PortableBase = Join-Path (Get-JA21PortableRoot $PackageRoot) 'technical-institute'
} elseif ($env:JA21_PORTABLE_ROOT -and $env:JA21_ALLOW_EXTERNAL_PORTABLE_ROOT -ne '1') {
    throw 'Standalone institute requires its default local workspace or JA21_ALLOW_EXTERNAL_PORTABLE_ROOT=1 for an external workspace.'
}
$PortableBase = Assert-TechnicalPortablePath $PortableBase
$LogRoot = Join-Path $PortableBase 'logs'
$null = Assert-TechnicalPortablePath $LogRoot
[void][IO.Directory]::CreateDirectory($LogRoot)
$Log = Join-Path $LogRoot ('launch-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.log')
function Write-Log([string]$Message) { Add-Content -LiteralPath $Log -Value ((Get-Date -Format o) + ' ' + $Message) -Encoding UTF8 }
function Show-Failure([string]$Message) {
    Write-Log ('ERROR ' + $Message)
    try {
        $ws = New-Object -ComObject WScript.Shell
        [void]$ws.Popup($Message + "`r`n`r`nDiagnostic log:`r`n" + $Log, 0, 'DF VM Technical Institute - Launch Error', 16)
    } catch { Write-Host $Message }
}
try {
    Write-Log ('Launcher root: ' + $Root)
    if (-not (Test-Path -LiteralPath $Index -PathType Leaf)) { throw "index.html not found at $Index" }
    foreach ($required in @('assets\styles.css','assets\data.js','assets\site.js')) {
        $p = Join-Path $Root $required
        if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { throw "Required asset missing: $p" }
    }
    $uri = ([System.Uri]$Index).AbsoluteUri
    Write-Log ('Index URI: ' + $uri)

    # IMPORTANT: force an array. A single pipeline result must never become a scalar string
    # whose [0] index is only the first character of the path.
    $pf86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
    $pf64 = [Environment]::GetEnvironmentVariable('ProgramFiles')
    $local = $null # portable institute does not probe per-user AppData
    $known = @(
        $(if ($pf86) { Join-Path $pf86 'Microsoft\Edge\Application\msedge.exe' }),
        $(if ($pf64) { Join-Path $pf64 'Microsoft\Edge\Application\msedge.exe' }),
        $(if ($local) { Join-Path $local 'Microsoft\Edge\Application\msedge.exe' }),
        $(if ($pf64) { Join-Path $pf64 'Google\Chrome\Application\chrome.exe' }),
        $(if ($pf86) { Join-Path $pf86 'Google\Chrome\Application\chrome.exe' }),
        $(if ($local) { Join-Path $local 'Google\Chrome\Application\chrome.exe' })
    ) | Where-Object { $_ }
    $discovered = New-Object System.Collections.Generic.List[string]
    foreach ($p in $known) { if ($p -and (Test-Path -LiteralPath $p -PathType Leaf)) { [void]$discovered.Add($p) } }
    # Browser executables are discovered only in their installed Program Files locations.
    $candidates = @($discovered | Select-Object -Unique)
    Write-Log ('Browser candidates: ' + ($candidates -join ' | '))

    if ($candidates.Count -gt 0) {
        $browser = [string]$candidates[0]
        $args = @("--app=$uri", '--no-first-run', '--no-default-browser-check', '--disable-extensions')
        if ($Fullscreen) { $args += '--start-fullscreen' } else { $args += '--start-maximized' }
        Write-Log ('Starting browser: ' + $browser + ' ' + ($args -join ' '))
        Start-Process -FilePath $browser -ArgumentList $args | Out-Null
    } else {
        Write-Log 'No Edge/Chrome candidate found; using Windows file association fallback.'
        Start-Process -FilePath $Index | Out-Null
    }
    Write-Log 'Launch request completed.'
    exit 0
} catch {
    Show-Failure $_.Exception.Message
    exit 1
}
