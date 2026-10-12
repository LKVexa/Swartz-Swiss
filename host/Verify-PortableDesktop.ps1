param([string]$Root)
$ErrorActionPreference='Stop'
if([string]::IsNullOrWhiteSpace($Root)){ $Root=Split-Path -Parent $PSScriptRoot }
$Root=[IO.Path]::GetFullPath($Root)
$version=(Get-Content -LiteralPath (Join-Path $Root 'VERSION') -Raw -Encoding UTF8).Trim()
if($version -ne '9.8.7'){ throw "Expected JA21 9.8.7, found '$version'." }
. (Join-Path $PSScriptRoot 'Portable-Security.ps1')
$workspace=Get-JA21PortableRoot $Root
$userAppData=Join-Path $env:USERPROFILE 'AppData'
if($workspace.StartsWith([IO.Path]::GetFullPath($userAppData),[StringComparison]::OrdinalIgnoreCase)){ throw "Portable workspace resolves under the real user AppData tree: $workspace" }
$expected=@{
 'JA21_WEB_DATA_ROOT'=(Join-Path $workspace 'state\webview2');
 'JA21_VEC1_STATE_ROOT'=(Join-Path $workspace 'state\vec1');
 'JA21_DOWNLOADS_ROOT'=(Join-Path $workspace 'downloads');
 'TEMP'=(Join-Path $workspace 'temp'); 'TMP'=(Join-Path $workspace 'temp');
 'LOCALAPPDATA'=(Join-Path $workspace 'host-env\LocalAppData'); 'APPDATA'=(Join-Path $workspace 'host-env\RoamingAppData')
}
foreach($k in $expected.Keys){$actual=[Environment]::GetEnvironmentVariable($k); if([IO.Path]::GetFullPath($actual) -ne [IO.Path]::GetFullPath($expected[$k])){throw "$k is not redirected into the portable workspace. Expected '$($expected[$k])', got '$actual'."}}
$placement=Get-Content -LiteralPath (Join-Path $Root 'substrate\config\ja21_portable_placement.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if($placement.transport.network -ne 'deny'){throw 'DF0 portable placement network policy is not deny.'}
$checks=@(@('N_SMALL','boot.guard'),@('N_MEDIUM','native.render'),@('N_LARGE','live.web'),@('N_XLARGE','workspace.state'))
foreach($c in $checks){$services=@($placement.nodes.($c[0]).ja21_services); if($services -notcontains $c[1]){throw "Node placement missing $($c[0])/$($c[1])."}}
$active=@('host\JA21VirtualBrowser.cs','host\Vec1Substrate.cs','host\PortableDesktop.cs','host\LiveWebBridge.cs','host\Start-JA21Browser.ps1')
foreach($rel in $active){$txt=Get-Content -LiteralPath (Join-Path $Root $rel) -Raw -Encoding UTF8; if($txt -match 'SpecialFolder\.LocalApplicationData'){throw "Active runtime contains LocalApplicationData fallback: $rel"}}
$probe=Join-Path $workspace 'evidence\portable-write-probe.txt'; New-Item -ItemType Directory -Force -Path (Split-Path -Parent $probe)|Out-Null; [IO.File]::WriteAllText($probe,'JA21 portable write probe '+[DateTime]::UtcNow.ToString('o'),(New-Object Text.UTF8Encoding($false)))
Write-Host 'JA21 portable path qualification PASS.' -ForegroundColor Green
Write-Host ('Application: '+$Root)
Write-Host ('Workspace: '+$workspace)
Write-Host 'JA21-owned mutable roots are redirected away from the real user AppData tree.'
Write-Warning 'This source/path qualification cannot prove that Windows, an installed WebView2 Runtime, antivirus, GPU drivers, or other external OS components never touch their own profile locations. Use Process Monitor for that target-machine observation.'
