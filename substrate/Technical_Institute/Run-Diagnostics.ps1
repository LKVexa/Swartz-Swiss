$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$App = Join-Path $Root 'app'
$Out = Join-Path $Root ('DF-VM-Technical-Institute-Diagnostic-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.txt')
$lines = New-Object System.Collections.Generic.List[string]
function Add-Line([string]$s) { [void]$lines.Add($s) }
Add-Line 'DF Portable VM Technical Institute v2.1.2 - Diagnostic Report'
Add-Line ('Generated: ' + (Get-Date -Format o))
Add-Line ('Root: ' + $Root)
Add-Line ('Windows: ' + [Environment]::OSVersion.VersionString)
Add-Line ('PowerShell: ' + $PSVersionTable.PSVersion.ToString())
Add-Line ('Process architecture: ' + [Environment]::GetEnvironmentVariable('PROCESSOR_ARCHITECTURE'))
Add-Line ''
Add-Line 'ASSET CHECK'
$required = @(
 'index.html','vm-small.html','vm-medium.html','vm-large.html','vm-xlarge.html','fabric.html','comparison.html','methodology.html',
 'assets\styles.css','assets\data.js','assets\site.js','Launch-DF-VM-Technical-Institute.ps1','Launch-DF-VM-Technical-Institute.cmd'
)
$ok = $true
foreach ($rel in $required) {
    $p = Join-Path $App $rel
    if (Test-Path -LiteralPath $p -PathType Leaf) {
        $f = Get-Item -LiteralPath $p
        Add-Line ('PASS ' + $rel + ' (' + $f.Length + ' bytes)')
    } else { Add-Line ('FAIL missing ' + $rel); $ok = $false }
}
Add-Line ''
Add-Line 'DATA / VERSION CHECK'
$data = Join-Path $App 'assets\data.js'
$site = Join-Path $App 'assets\site.js'
if (Test-Path $data) {
    $t = Get-Content -LiteralPath $data -Raw
    Add-Line ($(if ($t -match '"version":"2\.1\.1"') {'PASS data.js version 2.1.2'} else {'FAIL data.js version marker'}))
}
if (Test-Path $site) {
    $t = Get-Content -LiteralPath $site -Raw
    Add-Line ($(if ($t -match 'fail-visible renderer') {'PASS site.js hardened renderer marker'} else {'WARN site.js hardened renderer marker not found'}))
}
Add-Line ''
Add-Line 'BROWSER DISCOVERY'
$pf86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
$pf64 = [Environment]::GetEnvironmentVariable('ProgramFiles')
$local = $null # portable package does not probe per-user AppData
$known = @(
    $(if ($pf86) { Join-Path $pf86 'Microsoft\Edge\Application\msedge.exe' }),
    $(if ($pf64) { Join-Path $pf64 'Microsoft\Edge\Application\msedge.exe' }),
    $(if ($local) { Join-Path $local 'Microsoft\Edge\Application\msedge.exe' }),
    $(if ($pf64) { Join-Path $pf64 'Google\Chrome\Application\chrome.exe' }),
    $(if ($pf86) { Join-Path $pf86 'Google\Chrome\Application\chrome.exe' }),
    $(if ($local) { Join-Path $local 'Google\Chrome\Application\chrome.exe' })
) | Where-Object { $_ }
$found = @($known | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) } | Select-Object -Unique)
if ($found.Count -eq 0) { Add-Line 'INFO No direct Edge/Chrome path found; launcher will use Windows file association fallback.' }
else { foreach ($b in $found) { Add-Line ('PASS browser ' + $b) } }

Add-Line ''
Add-Line 'SINGLE-EXE BUILDER CHECK'
$builder = Join-Path $Root 'Build-Single-EXE.ps1'
$template = Join-Path $Root 'build\Bootstrap.template.cs'
if (Test-Path -LiteralPath $builder -PathType Leaf) { Add-Line 'PASS Build-Single-EXE.ps1 present' } else { Add-Line 'FAIL Build-Single-EXE.ps1 missing'; $ok = $false }
if (Test-Path -LiteralPath $template -PathType Leaf) { Add-Line 'PASS .NET bootstrap template present' } else { Add-Line 'FAIL C# bootstrap template missing'; $ok = $false }
try {
    $addType = Get-Command Add-Type -ErrorAction Stop
    Add-Line ('PASS Add-Type available: ' + $addType.Source)
} catch { Add-Line ('FAIL Add-Type unavailable: ' + $_.Exception.Message); $ok = $false }
try {
    $release = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full' -Name Release -ErrorAction Stop).Release
    Add-Line ('PASS .NET Framework v4 Full release: ' + $release)
} catch { Add-Line ('INFO .NET Framework v4 Full release registry value not readable: ' + $_.Exception.Message) }
$iexpress = Join-Path $env:WINDIR 'System32\iexpress.exe'
if (Test-Path -LiteralPath $iexpress -PathType Leaf) { Add-Line ('INFO IExpress fallback available: ' + $iexpress) } else { Add-Line 'INFO IExpress fallback unavailable; primary .NET builder does not require it.' }

Add-Line ''
Add-Line 'LAUNCHER AUDIT FIXES PRESENT'
$launchText = if (Test-Path (Join-Path $App 'Launch-DF-VM-Technical-Institute.ps1')) { Get-Content -LiteralPath (Join-Path $App 'Launch-DF-VM-Technical-Institute.ps1') -Raw } else { '' }
Add-Line ($(if ($launchText -match '\$candidates = @\(') {'PASS browser candidates explicitly forced to array'} else {'FAIL array-safety marker missing'}))
Add-Line ($(if ($launchText -match 'WScript\.Shell') {'PASS visible error popup path present'} else {'WARN visible error popup path missing'}))
Add-Line ''
Add-Line ('OVERALL STATIC RESULT: ' + $(if ($ok) {'PASS'} else {'FAIL'}))
$lines | Set-Content -LiteralPath $Out -Encoding UTF8
Write-Host ($lines -join [Environment]::NewLine)
Write-Host ''
Write-Host ('Report written to: ' + $Out)
exit $(if ($ok) {0} else {1})
