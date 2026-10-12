param(
    [Parameter(Mandatory=$true)]
    [object]$Adapter,
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0
. (Join-Path $PSScriptRoot 'Portable-Security.ps1')

function New-JA21AdapterResult {
    param(
        [bool]$Ready,
        [string]$ErrorText = '',
        [object]$CoreAssembly = $null,
        [object]$WpfAssembly = $null,
        [bool]$RuntimeReady = $false,
        [string]$RuntimeVersion = '',
        [string]$RuntimeError = ''
    )
    return [pscustomobject]@{
        Ready          = $Ready
        Error          = $ErrorText
        CoreAssembly   = $CoreAssembly
        WpfAssembly    = $WpfAssembly
        RuntimeReady   = $RuntimeReady
        RuntimeVersion = $RuntimeVersion
        RuntimeError   = $RuntimeError
    }
}

function Get-JA21FullFile([string]$Path, [string]$Label) {
    if ([string]::IsNullOrWhiteSpace($Path)) { throw "$Label path is empty." }
    $Full = [System.IO.Path]::GetFullPath($Path)
    if (-not (Test-Path -LiteralPath $Full -PathType Leaf)) { throw "$Label is missing: $Full" }
    return $Full
}

function Assert-JA21ContainedFile([string]$Root, [string]$Path, [string]$Label) {
    $RootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd('\')
    $PathFull = Get-JA21FullFile $Path $Label
    $Prefix = $RootFull + '\'
    if (-not $PathFull.StartsWith($Prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "$Label escaped the adapter directory: $PathFull"
    }
    return $PathFull
}

function Get-JA21LoadedAssemblyByIdentity([System.Reflection.AssemblyName]$Identity) {
    foreach ($Assembly in [AppDomain]::CurrentDomain.GetAssemblies()) {
        try {
            if ($Assembly.GetName().FullName -eq $Identity.FullName) { return $Assembly }
        } catch { }
    }
    return $null
}

try {
    if ($null -eq $Adapter -or -not $Adapter.Ready) {
        return (New-JA21AdapterResult -Ready $false -ErrorText 'WebView2 adapter was not provisioned.')
    }

    $AdapterRoot = [System.IO.Path]::GetFullPath([string]$Adapter.Root).TrimEnd('\')
    if (-not (Test-Path -LiteralPath $AdapterRoot -PathType Container)) {
        throw "WebView2 adapter directory is missing: $AdapterRoot"
    }

    $Core = Assert-JA21ContainedFile $AdapterRoot ([string]$Adapter.Core) 'Microsoft.Web.WebView2.Core.dll'
    $Wpf = Assert-JA21ContainedFile $AdapterRoot ([string]$Adapter.Wpf) 'Microsoft.Web.WebView2.Wpf.dll'
    $Loader = Assert-JA21ContainedFile $AdapterRoot ([string]$Adapter.Loader) 'WebView2Loader.dll'
    $ExpectedVersion = [string]$Adapter.Version
    if ([string]::IsNullOrWhiteSpace($ExpectedVersion)) { throw 'WebView2 adapter version is empty.' }
    $null = Assert-JA21PinnedAdapter $AdapterRoot $ExpectedVersion
    foreach ($Artifact in @(@($Core,'Microsoft.Web.WebView2.Core.dll'),@($Wpf,'Microsoft.Web.WebView2.Wpf.dll'),@($Loader,'WebView2Loader.dll'))) {
        $ExpectedPath = [IO.Path]::GetFullPath((Join-Path $AdapterRoot $Artifact[1]))
        if (-not $Artifact[0].Equals($ExpectedPath, [StringComparison]::OrdinalIgnoreCase)) { throw 'Adapter descriptor does not name the exact pinned SDK artifacts.' }
    }

    $CoreIdentity = [System.Reflection.AssemblyName]::GetAssemblyName($Core)
    $WpfIdentity = [System.Reflection.AssemblyName]::GetAssemblyName($Wpf)
    if ($CoreIdentity.Name -ne 'Microsoft.Web.WebView2.Core') {
        throw "Unexpected Core assembly identity: $($CoreIdentity.FullName)"
    }
    if ($WpfIdentity.Name -ne 'Microsoft.Web.WebView2.Wpf') {
        throw "Unexpected WPF assembly identity: $($WpfIdentity.FullName)"
    }
    if ($CoreIdentity.Version.ToString() -ne $ExpectedVersion) {
        throw "WebView2 Core assembly version mismatch. Expected $ExpectedVersion, found $($CoreIdentity.Version)."
    }
    if ($WpfIdentity.Version.ToString() -ne $ExpectedVersion) {
        throw "WebView2 WPF assembly version mismatch. Expected $ExpectedVersion, found $($WpfIdentity.Version)."
    }

    # Load the native DLL from its verified absolute path before any WebView2 API can P/Invoke.
    # Safe dependency-search flags omit the working directory and PATH.
    if (-not ('JA21AdapterNativeLoader' -as [type])) {
        Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;
public static class JA21AdapterNativeLoader {
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    private static extern IntPtr LoadLibraryExW(string path, IntPtr file, uint flags);
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    private static extern uint GetModuleFileNameW(IntPtr module, StringBuilder path, int size);
    public static void Load(string path) {
        IntPtr module = LoadLibraryExW(path, IntPtr.Zero, 0x00000100 | 0x00001000);
        if (module == IntPtr.Zero) throw new Win32Exception(Marshal.GetLastWin32Error());
        StringBuilder actual = new StringBuilder(32768);
        uint length = GetModuleFileNameW(module, actual, actual.Capacity);
        if (length == 0 || length >= actual.Capacity || !String.Equals(actual.ToString(), path, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Native WebView2 loader resolved outside the pinned adapter directory.");
    }
}
'@
    }
    [JA21AdapterNativeLoader]::Load($Loader)
    # Keep the exact adapter directory first for WebView2's additional lookup paths.
    $PathParts = @()
    if (-not [string]::IsNullOrWhiteSpace($env:PATH)) { $PathParts = @($env:PATH -split ';') }
    $AlreadyOnPath = $false
    foreach ($Part in $PathParts) {
        if ([string]::IsNullOrWhiteSpace($Part)) { continue }
        try {
            if ([System.IO.Path]::GetFullPath($Part.Trim('"')).TrimEnd('\').Equals($AdapterRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
                $AlreadyOnPath = $true
                break
            }
        } catch { }
    }
    if (-not $AlreadyOnPath) {
        if ([string]::IsNullOrWhiteSpace($env:PATH)) { $env:PATH = $AdapterRoot }
        else { $env:PATH = $AdapterRoot + ';' + $env:PATH }
    }

    # Add-Type's -ReferencedAssemblies switch is a *compiler* reference. It does not guarantee
    # that the CLR can resolve those strong-named assemblies later when Program.Run executes.
    # Explicitly load Core first, then WPF, into the current AppDomain before compiling JA21.
    $CoreAssembly = Get-JA21LoadedAssemblyByIdentity $CoreIdentity
    if ($null -eq $CoreAssembly) { $CoreAssembly = [System.Reflection.Assembly]::LoadFrom($Core) }
    if ($CoreAssembly.GetName().FullName -ne $CoreIdentity.FullName) {
        throw "Loaded WebView2 Core identity differs from the pinned adapter: $($CoreAssembly.GetName().FullName)"
    }
    if (-not $CoreAssembly.Location.Equals($Core, [StringComparison]::OrdinalIgnoreCase)) { throw 'WebView2 Core identity was already loaded from an unexpected path.' }

    $WpfAssembly = Get-JA21LoadedAssemblyByIdentity $WpfIdentity
    if ($null -eq $WpfAssembly) { $WpfAssembly = [System.Reflection.Assembly]::LoadFrom($Wpf) }
    if ($WpfAssembly.GetName().FullName -ne $WpfIdentity.FullName) {
        throw "Loaded WebView2 WPF identity differs from the pinned adapter: $($WpfAssembly.GetName().FullName)"
    }
    if (-not $WpfAssembly.Location.Equals($Wpf, [StringComparison]::OrdinalIgnoreCase)) { throw 'WebView2 WPF identity was already loaded from an unexpected path.' }

    # Runtime discovery is diagnostic, not a managed-adapter load gate. If Evergreen is absent,
    # JA21 still compiles with the real bridge and LiveWebFactory returns false at runtime so the
    # application opens in Native DF_Medium mode instead of crashing before the window appears.
    $RuntimeReady = $false
    $RuntimeVersion = ''
    $RuntimeError = ''
    try {
        $EnvironmentType = $CoreAssembly.GetType('Microsoft.Web.WebView2.Core.CoreWebView2Environment', $true)
        $Candidates = @($EnvironmentType.GetMethods([System.Reflection.BindingFlags]'Public,Static') | Where-Object { $_.Name -eq 'GetAvailableBrowserVersionString' } | Sort-Object { $_.GetParameters().Count })
        if ($Candidates.Count -lt 1) { throw 'CoreWebView2Environment.GetAvailableBrowserVersionString was not found.' }
        $Method = $Candidates[0]
        $ParameterCount = $Method.GetParameters().Count
        if ($ParameterCount -eq 0) {
            $RuntimeVersion = [string]$Method.Invoke($null, $null)
        } elseif ($ParameterCount -eq 1) {
            [object[]]$InvokeArgs = New-Object object[] 1
            $InvokeArgs[0] = $null
            $RuntimeVersion = [string]$Method.Invoke($null, $InvokeArgs)
        } else {
            throw "Unexpected WebView2 runtime-discovery signature with $ParameterCount parameters."
        }
        $RuntimeReady = -not [string]::IsNullOrWhiteSpace($RuntimeVersion)
    }
    catch {
        $RuntimeError = $_.Exception.Message
    }

    if (-not $Quiet) {
        Write-Host "WebView2 managed adapter loaded: $ExpectedVersion" -ForegroundColor Green
        Write-Host "  Core:   $Core"
        Write-Host "  WPF:    $Wpf"
        Write-Host "  Loader: $Loader"
        if ($RuntimeReady) { Write-Host "  Evergreen runtime: $RuntimeVersion" -ForegroundColor Green }
        else { Write-Warning "Evergreen runtime was not detected. JA21 will retain Native DF_Medium fallback. $RuntimeError" }
    }

    return (New-JA21AdapterResult -Ready $true -CoreAssembly $CoreAssembly -WpfAssembly $WpfAssembly -RuntimeReady $RuntimeReady -RuntimeVersion $RuntimeVersion -RuntimeError $RuntimeError)
}
catch {
    $Message = $_.Exception.Message
    if (-not $Quiet) { Write-Warning "WebView2 managed adapter load failed. JA21 can continue in Native DF_Medium mode. $Message" }
    return (New-JA21AdapterResult -Ready $false -ErrorText $Message)
}
