$ErrorActionPreference = 'Stop'

function Assert-JA21NoReparsePoint {
    param([Parameter(Mandatory=$true)][string]$Path)
    $Full = [IO.Path]::GetFullPath($Path)
    $Probe = $Full
    while (-not [string]::IsNullOrWhiteSpace($Probe)) {
        try { $Attributes = [IO.File]::GetAttributes($Probe) }
        catch {
            $Cause = $_.Exception.GetBaseException()
            if ($Cause -is [IO.FileNotFoundException] -or $Cause -is [IO.DirectoryNotFoundException]) { $Attributes = 0 } else { throw }
        }
        if (($Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Portable paths must not traverse a junction or symbolic link: $Probe" }
        $Parent = [IO.Path]::GetDirectoryName($Probe.TrimEnd('\','/'))
        if ($Parent -eq $Probe) { break }
        $Probe = $Parent
    }
    return $Full
}

function Test-JA21PathWithin {
    param([string]$Root, [string]$Path)
    $RootFull = [IO.Path]::GetFullPath($Root).TrimEnd('\','/')
    $PathFull = [IO.Path]::GetFullPath($Path).TrimEnd('\','/')
    return $PathFull.StartsWith(($RootFull + [IO.Path]::DirectorySeparatorChar), [StringComparison]::OrdinalIgnoreCase)
}

function Get-JA21PortableRoot {
    param([Parameter(Mandatory=$true)][string]$Root)
    $PackageRoot = Assert-JA21NoReparsePoint $Root
    if (-not (Test-Path -LiteralPath $PackageRoot -PathType Container)) { throw "Package directory is missing: $PackageRoot" }
    $Workspace = if ([string]::IsNullOrWhiteSpace($env:JA21_PORTABLE_ROOT)) { Join-Path $PackageRoot 'workspace' } else { $env:JA21_PORTABLE_ROOT }
    $Workspace = (Assert-JA21NoReparsePoint $Workspace).TrimEnd('\','/')
    if ($Workspace.Equals($PackageRoot.TrimEnd('\','/'), [StringComparison]::OrdinalIgnoreCase) -or (Test-JA21PathWithin $Workspace $PackageRoot)) {
        throw 'The portable workspace cannot be the application directory or an ancestor of it.'
    }
    if (-not (Test-JA21PathWithin $PackageRoot $Workspace) -and $env:JA21_ALLOW_EXTERNAL_PORTABLE_ROOT -ne '1') {
        throw 'Portable workspace must remain inside the JA21 package unless JA21_ALLOW_EXTERNAL_PORTABLE_ROOT=1 is explicitly set.'
    }
    return $Workspace
}

function Get-JA21PinnedWebView2 {
    # These hashes bind the vendored adapter and the optional NuGet restore to the same bytes.
    return [pscustomobject]@{
        Version = '1.0.4191.47'
        PackageSha256 = 'f492bbf547d0da329553b6727435b677579b1e9f91cc9e4a1ad029366d5f23d0'
        Files = [ordered]@{
            'Microsoft.Web.WebView2.Core.dll' = 'e6f54c8ce208e3797c427d01ad671b47cb25abc85604753d6ec2546d0ffef550'
            'Microsoft.Web.WebView2.Wpf.dll' = '6942b85a3388ece45febde5584d2bfc035d84315f2dd5a4a47913f01a0193800'
            'WebView2Loader.dll' = 'c66e4a92fdc7a216118e43b7a5024ea2200e8c43f9310bf20d96a0084f82c5bc'
        }
    }
}

function Assert-JA21PinnedAdapter {
    param([Parameter(Mandatory=$true)][string]$Root, [Parameter(Mandatory=$true)][string]$Version)
    $Pin = Get-JA21PinnedWebView2
    if ($Version -ne $Pin.Version) { throw "Unsupported WebView2 adapter version: $Version" }
    $Full = Assert-JA21NoReparsePoint $Root
    foreach ($Name in $Pin.Files.Keys) {
        $File = Assert-JA21NoReparsePoint (Join-Path $Full $Name)
        if (-not (Test-Path -LiteralPath $File -PathType Leaf)) { throw "Pinned WebView2 artifact is missing: $File" }
        if ((Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Pin.Files[$Name]) {
            throw "Pinned WebView2 artifact failed SHA-256 verification: $Name"
        }
    }
    return $Full
}
