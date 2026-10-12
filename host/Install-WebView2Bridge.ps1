param([string]$Root)
$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = Split-Path -Parent $PSScriptRoot }
$Root = [System.IO.Path]::GetFullPath($Root)
$Provisioner = Join-Path $PSScriptRoot 'Ensure-WebView2Bridge.ps1'
$Loader = Join-Path $PSScriptRoot 'Import-WebView2Adapter.ps1'
foreach ($p in @($Provisioner,$Loader)) { if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { throw "Live-web helper is missing: $p" } }
$Adapter = & $Provisioner -Root $Root
if (-not $Adapter.Ready) { throw "WebView2 SDK adapter provisioning did not complete. $($Adapter.Error)" }
$Loaded = & $Loader -Adapter $Adapter
if (-not $Loaded.Ready) { throw "WebView2 SDK adapter was provisioned but could not be loaded. $($Loaded.Error)" }
Write-Host ''
Write-Host 'JA21 Live Web managed bridge is installed and loadable.' -ForegroundColor Green
if ($Loaded.RuntimeReady) { Write-Host ("Installed Evergreen runtime detected: " + $Loaded.RuntimeVersion) -ForegroundColor Green }
else { Write-Warning 'The managed adapter is ready, but an installed Evergreen WebView2 Runtime was not detected. Native mode remains available until the Runtime is installed.' }
