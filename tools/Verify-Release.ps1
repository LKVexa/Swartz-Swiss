param(
    [string]$Root = (Split-Path -Parent $PSScriptRoot),
    [string]$Python = 'python',
    [string]$Work = (Join-Path ([IO.Path]::GetTempPath()) ('JA21-release-' + [guid]::NewGuid().ToString('N')))
)
$ErrorActionPreference = 'Stop'
if ($PSVersionTable.PSEdition -ne 'Desktop') { throw 'Use Windows PowerShell 5.1 for WPF release verification.' }
if ([Threading.Thread]::CurrentThread.GetApartmentState() -ne 'STA') { throw 'Start powershell.exe with -STA.' }
$Root = [IO.Path]::GetFullPath($Root)
$Work = [IO.Path]::GetFullPath($Work)
. (Join-Path $Root 'host\Portable-Security.ps1')
$null = Assert-JA21NoReparsePoint $Root
$null = Assert-JA21NoReparsePoint $Work
[void][IO.Directory]::CreateDirectory($Work)
$originalTemp = $env:TEMP
$originalTmp = $env:TMP
$originalLocation = Get-Location
try {
    $env:TEMP = $Work
    $env:TMP = $Work
    Set-Location -LiteralPath $Root
    # The package verifier also executes the browser suite and its nested VEC1 tests.
    & $Python tools/verify_package.py
    if ($LASTEXITCODE -ne 0) { throw 'Package verification failed.' }
    & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -STA -ExecutionPolicy Bypass -File (Join-Path $Root 'host\Verify-JA21Browser.ps1') -Root $Root
    if ($LASTEXITCODE -ne 0) { throw 'Windows presenter verification failed.' }
    & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -STA -ExecutionPolicy Bypass -File (Join-Path $Root 'tools\Test-LauncherSecurity.ps1') -Root $Root -Work (Join-Path $Work 'launcher')
    if ($LASTEXITCODE -ne 0) { throw 'Launcher security regression tests failed.' }
    & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root 'tools\Test-TechnicalBootstrap.ps1') -Root $Root -Work (Join-Path $Work 'technical-bootstrap')
    if ($LASTEXITCODE -ne 0) { throw 'Supplementary bootstrap security regression tests failed.' }
    & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -STA -ExecutionPolicy Bypass -File (Join-Path $Root 'tools\Verify-Console.ps1') -Root $Root -Work (Join-Path $Work 'console')
    if ($LASTEXITCODE -ne 0) { throw 'Headless console verification failed.' }
    Write-Output ('PASS: JA21 Blank Console release verification. Reports: ' + $Work)
} finally {
    Set-Location -LiteralPath $originalLocation.Path
    $env:TEMP = $originalTemp
    $env:TMP = $originalTmp
}
