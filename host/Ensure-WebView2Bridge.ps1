param([string]$Root, [switch]$Quiet)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Portable-Security.ps1')
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = Split-Path -Parent $PSScriptRoot }
$Root = [IO.Path]::GetFullPath($Root)
$Pin = Get-JA21PinnedWebView2
$Version = $Pin.Version
$VersionRoot = ''
$tmp = $null
$PreviousProtocol = [Net.ServicePointManager]::SecurityProtocol
function New-JA21ProvisionResult([bool]$Ready, [string]$ErrorText = '') {
    return [pscustomobject]@{ Ready=$Ready; Version=$Version; Root=$VersionRoot; Core=(Join-Path $VersionRoot 'Microsoft.Web.WebView2.Core.dll'); Wpf=(Join-Path $VersionRoot 'Microsoft.Web.WebView2.Wpf.dll'); Loader=(Join-Path $VersionRoot 'WebView2Loader.dll'); Error=$ErrorText }
}
try {
    $PortableRoot = Get-JA21PortableRoot $Root
    $SealedVersionRoot = Join-Path $Root ('runtime\webview2-sdk\' + $Version)
    $MutableVersionRoot = Join-Path $PortableRoot ('runtime\webview2-sdk\' + $Version)
    $VersionRoot = if (Test-Path -LiteralPath $SealedVersionRoot -PathType Container) { $SealedVersionRoot } else { $MutableVersionRoot }
    if ($env:JA21_DISABLE_LIVE_WEB -eq '1') { return (New-JA21ProvisionResult $false 'Live web bridge disabled by JA21_DISABLE_LIVE_WEB=1.') }
    if (Test-Path -LiteralPath $VersionRoot) {
        $null = Assert-JA21PinnedAdapter $VersionRoot $Version
        if (!$Quiet) { Write-Host "WebView2 SDK adapter $Version verified." -ForegroundColor Green }
        return (New-JA21ProvisionResult $true)
    }
    $SdkRoot = Assert-JA21NoReparsePoint (Split-Path -Parent $MutableVersionRoot)
    [void][IO.Directory]::CreateDirectory($SdkRoot)
    $PortableTemp = Assert-JA21NoReparsePoint (Join-Path $PortableRoot 'temp')
    [void][IO.Directory]::CreateDirectory($PortableTemp)
    $tmp = Join-Path $PortableTemp ('ja21-webview2-' + [guid]::NewGuid().ToString('N'))
    [void][IO.Directory]::CreateDirectory($tmp)
    $pkg = Join-Path $tmp 'Microsoft.Web.WebView2.nupkg'
    $url = "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/$Version"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    if (!$Quiet) { Write-Host "Restoring pinned WebView2 SDK adapter $Version from NuGet..." -ForegroundColor Cyan }
    Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $pkg -TimeoutSec 60
    if ((Get-FileHash -LiteralPath $pkg -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Pin.PackageSha256) { throw 'Downloaded WebView2 NuGet package failed pinned SHA-256 verification.' }
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $Stage = Join-Path $tmp 'adapter'
    [void][IO.Directory]::CreateDirectory($Stage)
    $Artifacts = [ordered]@{
        'lib/net462/Microsoft.Web.WebView2.Core.dll' = 'Microsoft.Web.WebView2.Core.dll'
        'lib/net462/Microsoft.Web.WebView2.Wpf.dll' = 'Microsoft.Web.WebView2.Wpf.dll'
        'runtimes/win-x64/native/WebView2Loader.dll' = 'WebView2Loader.dll'
    }
    # Open only the three exact entries; no archive-controlled paths are extracted.
    $Archive = [IO.Compression.ZipFile]::OpenRead($pkg)
    try {
        foreach ($EntryName in $Artifacts.Keys) {
            $Matches = @($Archive.Entries | Where-Object { $_.FullName -ceq $EntryName })
            if ($Matches.Count -ne 1 -or $Matches[0].Length -gt 16777216) { throw "Missing, duplicate or oversized SDK artifact: $EntryName" }
            $Input = $Matches[0].Open()
            try {
                $Output = [IO.File]::Open((Join-Path $Stage $Artifacts[$EntryName]), [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
                try { $Input.CopyTo($Output) } finally { $Output.Dispose() }
            } finally { $Input.Dispose() }
        }
    } finally { $Archive.Dispose() }
    $null = Assert-JA21PinnedAdapter $Stage $Version
    $obj = [ordered]@{
        schema='VB-JA21/WEBVIEW2_ADAPTER/1'; version=$Version; source=$url; provisioned_utc=[DateTime]::UtcNow.ToString('o'); package_sha256=$Pin.PackageSha256;
        files=@($Pin.Files.Keys | ForEach-Object { [ordered]@{name=$_;sha256=$Pin.Files[$_]} })
    }
    [IO.File]::WriteAllText((Join-Path $Stage 'PROVISIONED.json'), ($obj | ConvertTo-Json -Depth 6), (New-Object Text.UTF8Encoding($false)))
    $null = Assert-JA21NoReparsePoint $MutableVersionRoot
    if (Test-Path -LiteralPath $MutableVersionRoot) {
        # Another process may have finished the same restore. Never overwrite an existing adapter.
        $null = Assert-JA21PinnedAdapter $MutableVersionRoot $Version
    } else { [IO.Directory]::Move($Stage, $MutableVersionRoot) }
    $VersionRoot = $MutableVersionRoot
    if (!$Quiet) { Write-Host 'Pinned WebView2 SDK adapter restored. An installed Evergreen Runtime is also required for live web.' -ForegroundColor Green }
    return (New-JA21ProvisionResult $true)
}
catch {
    if (!$Quiet) { Write-Warning "Live web adapter is unavailable; JA21 can continue in native DF_Medium mode. $($_.Exception.Message)" }
    if ([string]::IsNullOrWhiteSpace($VersionRoot)) { $VersionRoot = Join-Path $Root ('runtime\webview2-sdk\' + $Version) }
    return (New-JA21ProvisionResult $false $_.Exception.Message)
}
finally {
    [Net.ServicePointManager]::SecurityProtocol = $PreviousProtocol
    if ($tmp -and (Test-Path -LiteralPath $tmp)) {
        # Validate the exact owned directory immediately before recursive cleanup.
        if ((Test-JA21PathWithin $PortableTemp $tmp) -and ([IO.Path]::GetFileName($tmp) -match '^ja21-webview2-[0-9a-f]{32}$')) {
            $null = Assert-JA21NoReparsePoint $tmp
            Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}
