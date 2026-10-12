param(
    [string]$Root = (Split-Path -Parent $PSScriptRoot),
    [string]$Work = (Join-Path (Split-Path -Parent $PSScriptRoot) 'workspace\launcher-tests'),
    [string]$Package
)
$ErrorActionPreference = 'Stop'
$Root = [IO.Path]::GetFullPath($Root)
$Work = [IO.Path]::GetFullPath($Work)
. (Join-Path $Root 'host\Portable-Security.ps1')
$null = Assert-JA21NoReparsePoint $Work
[void][IO.Directory]::CreateDirectory($Work)
$CaseRoot = Join-Path $Work ('case-' + [guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($CaseRoot)
$TestPackageRoot = Join-Path $CaseRoot 'package'
[void][IO.Directory]::CreateDirectory($TestPackageRoot)
[IO.File]::WriteAllText((Join-Path $TestPackageRoot 'VERSION'), ([IO.File]::ReadAllText((Join-Path $Root 'VERSION'))))
$TestWorkspace = Join-Path $TestPackageRoot 'workspace'
$Results = New-Object System.Collections.Generic.List[object]
$Skipped = New-Object System.Collections.Generic.List[string]
$EnvNames = @('JA21_PORTABLE_ROOT','JA21_ALLOW_EXTERNAL_PORTABLE_ROOT','JA21_DISABLE_LIVE_WEB','PATH')
$SavedEnv = @{}
foreach ($Name in $EnvNames) { $SavedEnv[$Name] = [Environment]::GetEnvironmentVariable($Name) }
function Check([string]$Name, [bool]$Passed) {
    [void]$Results.Add([ordered]@{name=$Name;passed=$Passed})
    if (-not $Passed) { throw "Regression failed: $Name" }
}
function Rejects([scriptblock]$Action) {
    try { $null = & $Action; return $false } catch { return $true }
}
$Junction = $null
$Writer = $null
$Failure = $null
try {
    $env:JA21_PORTABLE_ROOT = $TestWorkspace
    $env:JA21_ALLOW_EXTERNAL_PORTABLE_ROOT = $null
    $env:JA21_DISABLE_LIVE_WEB = $null
    Check 'Sibling directory is outside package' (-not (Test-JA21PathWithin $TestPackageRoot ($TestPackageRoot + '-sibling')))
    $env:JA21_PORTABLE_ROOT = Join-Path $CaseRoot 'outside-new'
    Check 'Unauthorized external workspace rejected before writes' (Rejects { & (Join-Path $Root 'host\Initialize-PortableWorkspace.ps1') -Root $TestPackageRoot })
    Check 'Unauthorized external workspace was not created' (-not (Test-Path -LiteralPath $env:JA21_PORTABLE_ROOT))
    $env:JA21_PORTABLE_ROOT = $TestPackageRoot
    Check 'Package root cannot become workspace' (Rejects { Get-JA21PortableRoot $TestPackageRoot })
    $env:JA21_PORTABLE_ROOT = $TestWorkspace
    [void][IO.Directory]::CreateDirectory((Join-Path $TestWorkspace 'documents'))
    [void][IO.Directory]::CreateDirectory((Join-Path $TestWorkspace 'temp'))
    [IO.File]::WriteAllText((Join-Path $TestWorkspace 'documents\[literal].txt'),'first snapshot file')
    [IO.File]::WriteAllText((Join-Path $TestWorkspace 'empty.txt'),'')
    [IO.File]::WriteAllText((Join-Path $TestWorkspace 'temp\excluded.txt'),'excluded')
    & (Join-Path $Root 'host\Snapshot-PortableWorkspace.ps1') -Root $TestPackageRoot
    $Snapshot = @(Get-ChildItem -LiteralPath (Join-Path $TestWorkspace 'snapshots') -Filter '*.zip')[0]
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $Archive = [IO.Compression.ZipFile]::OpenRead($Snapshot.FullName)
    try {
        $Reader = New-Object IO.StreamReader($Archive.GetEntry('SNAPSHOT_MANIFEST.json').Open())
        try { $Manifest = $Reader.ReadToEnd() | ConvertFrom-Json } finally { $Reader.Dispose() }
        Check 'Snapshot excludes transient paths and handles literal filenames' ($Manifest.file_count -eq 2 -and $Archive.Entries.Count -eq 3)
        foreach ($Entry in $Manifest.files) {
            $Stream = $Archive.GetEntry($Entry.path).Open()
            $Hash = [Security.Cryptography.SHA256]::Create()
            try { $Actual = ([BitConverter]::ToString($Hash.ComputeHash($Stream))).Replace('-','').ToLowerInvariant() } finally { $Hash.Dispose(); $Stream.Dispose() }
            Check ('Manifest hashes actual archive bytes: ' + $Entry.path) ($Actual -eq $Entry.sha256 -and $Archive.GetEntry($Entry.path).Length -eq $Entry.bytes)
        }
    } finally { $Archive.Dispose() }
    $Before = (Get-FileHash -LiteralPath $Snapshot.FullName -Algorithm SHA256).Hash
    & (Join-Path $Root 'host\Snapshot-PortableWorkspace.ps1') -Root $TestPackageRoot
    Check 'Repeated snapshot preserves identical archive' ($Before -eq (Get-FileHash -LiteralPath $Snapshot.FullName -Algorithm SHA256).Hash -and @(Get-ChildItem -LiteralPath (Join-Path $TestWorkspace 'snapshots') -Filter '*.zip').Count -eq 1)
    $Writer = [IO.File]::Open((Join-Path $TestWorkspace 'empty.txt'), [IO.FileMode]::Open, [IO.FileAccess]::Write, [IO.FileShare]::ReadWrite)
    Check 'Snapshot refuses files open for writing' (Rejects { & (Join-Path $Root 'host\Snapshot-PortableWorkspace.ps1') -Root $TestPackageRoot })
    $Writer.Dispose(); $Writer = $null
    Check 'Failed snapshot leaves no partial archive' (@(Get-ChildItem -LiteralPath (Join-Path $TestWorkspace 'snapshots') -Filter '.partial-*' -Force).Count -eq 0)
    [IO.File]::WriteAllText((Join-Path $TestWorkspace 'SNAPSHOT_MANIFEST.json'),'reserved')
    Check 'Reserved manifest filename rejected' (Rejects { & (Join-Path $Root 'host\Snapshot-PortableWorkspace.ps1') -Root $TestPackageRoot })
    Remove-Item -LiteralPath (Join-Path $TestWorkspace 'SNAPSHOT_MANIFEST.json')
    $Junction = Join-Path $TestWorkspace 'outside-link'
    try { [void](New-Item -ItemType Junction -Path $Junction -Value $CaseRoot) } catch { [void]$Skipped.Add(('Junction creation unavailable in this environment: ' + $_.Exception.Message)); $Junction=$null }
    if ($Junction) {
        Check 'Snapshot refuses junction traversal' (Rejects { & (Join-Path $Root 'host\Snapshot-PortableWorkspace.ps1') -Root $TestPackageRoot })
        Check 'Workspace resolver refuses junction traversal' (Rejects { Assert-JA21NoReparsePoint (Join-Path $Junction 'secret.txt') })
        [IO.Directory]::Delete($Junction); $Junction = $null
    }

    $Pin = Get-JA21PinnedWebView2
    $env:JA21_PORTABLE_ROOT = Join-Path $Root 'workspace'
    $env:JA21_DISABLE_LIVE_WEB = '1'
    $Disabled = & (Join-Path $Root 'host\Ensure-WebView2Bridge.ps1') -Root $Root -Quiet
    Check 'Disable flag wins over bundled SDK' (-not $Disabled.Ready -and $Disabled.Error -match 'disabled')
    $env:JA21_DISABLE_LIVE_WEB = $null
    $env:JA21_PORTABLE_ROOT = $TestWorkspace
    $SealedSdk = Join-Path $TestPackageRoot ('runtime\webview2-sdk\' + $Pin.Version)
    [void][IO.Directory]::CreateDirectory($SealedSdk)
    foreach ($Name in $Pin.Files.Keys) { [IO.File]::Copy((Join-Path $Root ('runtime\webview2-sdk\' + $Pin.Version + '\' + $Name)), (Join-Path $SealedSdk $Name)) }
    $Good = & (Join-Path $Root 'host\Ensure-WebView2Bridge.ps1') -Root $TestPackageRoot -Quiet
    Check 'Pinned adapter accepted without network' $Good.Ready
    $Dll = Join-Path $SealedSdk 'WebView2Loader.dll'
    $Tamper = [IO.File]::Open($Dll,[IO.FileMode]::Open,[IO.FileAccess]::Write)
    try { $Tamper.WriteByte(0) } finally { $Tamper.Dispose() }
    $Bad = & (Join-Path $Root 'host\Ensure-WebView2Bridge.ps1') -Root $TestPackageRoot -Quiet
    Check 'Tampered bundled adapter rejected without replacement' (-not $Bad.Ready -and $Bad.Error -match 'SHA-256')
    $LoadBad = & (Join-Path $Root 'host\Import-WebView2Adapter.ps1') -Adapter $Good -Quiet
    Check 'Loader independently rejects tampered SDK' (-not $LoadBad.Ready -and $LoadBad.Error -match 'SHA-256')

    if ($Package) {
        $Package = [IO.Path]::GetFullPath($Package)
        Check 'Offline restore fixture matches pinned official package' ((Get-FileHash -LiteralPath $Package -Algorithm SHA256).Hash.ToLowerInvariant() -eq $Pin.PackageSha256)
        # Mock only the download boundary; exercise the production checksum, extraction and publish.
        function Invoke-WebRequest { param([switch]$UseBasicParsing,[string]$Uri,[string]$OutFile,[int]$TimeoutSec); [IO.File]::Copy($Package,$OutFile) }
        $RestoreRoot = Join-Path $CaseRoot 'restore-package'
        [void][IO.Directory]::CreateDirectory($RestoreRoot)
        $env:JA21_PORTABLE_ROOT = Join-Path $RestoreRoot 'workspace'
        $Restored = & (Join-Path $Root 'host\Ensure-WebView2Bridge.ps1') -Root $RestoreRoot -Quiet
        Check 'Pinned offline restore extracts exact SDK files' ($Restored.Ready -and @(Get-ChildItem -LiteralPath $Restored.Root).Count -eq 4)
        Check 'Restore leaves no staging directories' (@(Get-ChildItem -LiteralPath (Join-Path $env:JA21_PORTABLE_ROOT 'temp')).Count -eq 0)
    }
} catch {
    $Failure = $_.Exception.GetBaseException().Message
    Write-Output $_.ScriptStackTrace
} finally {
    if ($Writer) { $Writer.Dispose() }
    if ($Junction -and (Test-Path -LiteralPath $Junction)) { [IO.Directory]::Delete($Junction) }
    foreach ($Name in $EnvNames) { [Environment]::SetEnvironmentVariable($Name, $SavedEnv[$Name]) }
    $Report = [ordered]@{status=$(if($Failure){'failed'}else{'passed'}); checks=$Results.ToArray(); skipped=$Skipped.ToArray();failure=$Failure;case_root=$CaseRoot;network_requests_made=$false}
    [IO.File]::WriteAllText((Join-Path $Work 'launcher-security-tests.json'), ($Report | ConvertTo-Json -Depth 6), (New-Object Text.UTF8Encoding($false)))
    Write-Output ('Launcher/security regressions: ' + $Report.status + '; ' + $Results.Count + ' checks. ' + $Failure)
}
if ($Failure) { exit 1 }
