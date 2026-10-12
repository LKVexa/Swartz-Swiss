param([string]$Root)
$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = Split-Path -Parent $PSScriptRoot }
. (Join-Path $PSScriptRoot 'Portable-Security.ps1')
$PortableRoot = Get-JA21PortableRoot $Root
$portableDirs = @('','state','state\webview2','state\vec1','desktop','documents','downloads','uploads','logs','temp','cache','home','host-env\LocalAppData','host-env\RoamingAppData','runtime','evidence','snapshots')
foreach ($rel in $portableDirs) {
    $dir = if ($rel) { Join-Path $PortableRoot $rel } else { $PortableRoot }
    $null = Assert-JA21NoReparsePoint $dir
    [void][IO.Directory]::CreateDirectory($dir)
}
$env:JA21_PORTABLE_ROOT = $PortableRoot
$env:JA21_WEB_DATA_ROOT = Join-Path $PortableRoot 'state\webview2'
$env:JA21_VEC1_STATE_ROOT = Join-Path $PortableRoot 'state\vec1'
$env:JA21_DOWNLOADS_ROOT = Join-Path $PortableRoot 'downloads'
$env:JA21_TEMP_ROOT = Join-Path $PortableRoot 'temp'
$env:LOCALAPPDATA = Join-Path $PortableRoot 'host-env\LocalAppData'
$env:APPDATA = Join-Path $PortableRoot 'host-env\RoamingAppData'
$env:TEMP = Join-Path $PortableRoot 'temp'
$env:TMP = Join-Path $PortableRoot 'temp'
$env:HOME = Join-Path $PortableRoot 'home'
$env:PYTHONPYCACHEPREFIX = Join-Path $PortableRoot 'cache\pycache'
$env:PYTHONDONTWRITEBYTECODE = '1'
