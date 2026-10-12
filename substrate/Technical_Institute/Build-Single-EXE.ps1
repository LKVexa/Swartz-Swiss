param(
    [switch]$ForceIExpress,
    [switch]$NoFallback
)

$ErrorActionPreference = 'Stop'
$Version = '2.1.2'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$App = Join-Path $Root 'app'
$Build = Join-Path $Root 'build'
$Payload = Join-Path $Build 'DF-VM-Technical-Institute.payload.zip'
$Target = Join-Path $Root ('DF-VM-Technical-Institute-v' + $Version + '.exe')
$Template = Join-Path $Build 'Bootstrap.template.cs'
$GeneratedSource = Join-Path $Build 'DF-VM-Technical-Institute.Bootstrap.generated.cs'
$BuildLog = Join-Path $Build ('build-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')

function Assert-TechnicalSafePath([string]$Path) {
    $Full = [IO.Path]::GetFullPath($Path)
    if (-not $Full.StartsWith(([IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'), [StringComparison]::OrdinalIgnoreCase)) { throw "Build path escaped the institute directory: $Full" }
    $Probe = $Full
    while ($Probe) {
        try { $Attributes = [IO.File]::GetAttributes($Probe) } catch { $Cause=$_.Exception.GetBaseException(); if($Cause -is [IO.FileNotFoundException] -or $Cause -is [IO.DirectoryNotFoundException]){$Attributes=0}else{throw} }
        if (($Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Build path traverses a junction or symbolic link: $Probe" }
        $Probe = [IO.Path]::GetDirectoryName($Probe)
    }
}
foreach ($Path in @($Build,$App,$Payload,$Target,$Template,$GeneratedSource,$BuildLog)) { Assert-TechnicalSafePath $Path }
[void][IO.Directory]::CreateDirectory($Build)

function Write-BuildLog([string]$Message) {
    $line = (Get-Date -Format o) + ' ' + $Message
    Add-Content -LiteralPath $BuildLog -Value $line -Encoding UTF8
    Write-Host $Message
}

function Assert-Input([string]$Path, [string]$Label) {
    if (-not (Test-Path -LiteralPath $Path)) { throw "Required $Label is missing: $Path" }
}

function New-Payload {
    Assert-Input $App 'app directory'
    $Queue = New-Object System.Collections.Generic.Queue[string]
    $Queue.Enqueue($App)
    while ($Queue.Count -gt 0) {
        foreach ($Item in Get-ChildItem -LiteralPath $Queue.Dequeue() -Force) {
            Assert-TechnicalSafePath $Item.FullName
            if ($Item.PSIsContainer) { $Queue.Enqueue($Item.FullName) }
        }
    }
    Assert-TechnicalSafePath $Payload
    if (Test-Path -LiteralPath $Payload) { Remove-Item -LiteralPath $Payload -Force }
    Write-BuildLog ('Creating payload from: ' + $App)
    Compress-Archive -Path (Join-Path $App '*') -DestinationPath $Payload -CompressionLevel Optimal
    $hash = (Get-FileHash -LiteralPath $Payload -Algorithm SHA256).Hash.ToLowerInvariant()
    $size = (Get-Item -LiteralPath $Payload).Length
    Write-BuildLog ('Payload bytes: ' + $size)
    Write-BuildLog ('Payload SHA-256: ' + $hash)
    return $hash
}

function New-EmbeddedBootstrapSource([string]$PayloadHash) {
    Assert-Input $Template 'C# bootstrap template'
    $bytes = [System.IO.File]::ReadAllBytes($Payload)
    $base64 = [Convert]::ToBase64String($bytes)

    # Keep individual C# string literals deliberately small. This avoids compiler/user-string
    # edge cases that can occur when one very large literal is emitted.
    $chunks = New-Object System.Collections.Generic.List[string]
    $chunkSize = 6000
    for ($i = 0; $i -lt $base64.Length; $i += $chunkSize) {
        $n = [Math]::Min($chunkSize, $base64.Length - $i)
        [void]$chunks.Add(('            "' + $base64.Substring($i, $n) + '"'))
    }
    $chunkText = $chunks -join ",`r`n"

    $source = Get-Content -LiteralPath $Template -Raw
    $source = $source.Replace('__VERSION__', $Version)
    $source = $source.Replace('__PAYLOAD_SHA__', $PayloadHash)
    $source = $source.Replace('__BASE64_CHUNKS__', $chunkText)
    Set-Content -LiteralPath $GeneratedSource -Value $source -Encoding ASCII
    Write-BuildLog ('Generated C# bootstrap source: ' + $GeneratedSource)
    return $source
}

function Invoke-DotNetBootstrapBuild([string]$Source) {
    $stageExe = Join-Path $Build ('DFVMTI-bootstrap-' + [Guid]::NewGuid().ToString('N') + '.exe')
    if (Test-Path -LiteralPath $stageExe) { Remove-Item -LiteralPath $stageExe -Force }

    Write-BuildLog ('Primary builder: Windows .NET Framework Add-Type (IExpress not required).')
    Write-BuildLog ('PowerShell: ' + $PSVersionTable.PSVersion.ToString() + ' / Edition: ' + $(if ($PSVersionTable.PSEdition) {$PSVersionTable.PSEdition} else {'Desktop'}))
    Write-BuildLog ('CLR: ' + [Environment]::Version.ToString())

    $refs = @(
        'System.dll',
        'System.Core.dll',
        'System.Windows.Forms.dll',
        'System.IO.Compression.dll',
        'System.IO.Compression.FileSystem.dll'
    )

    Add-Type -TypeDefinition $Source -Language CSharp -OutputAssembly $stageExe -OutputType WindowsApplication -ReferencedAssemblies $refs -ErrorAction Stop | Out-Null
    if (-not (Test-Path -LiteralPath $stageExe -PathType Leaf)) { throw 'Add-Type returned without creating the bootstrap EXE.' }

    $compiledBytes = [System.IO.File]::ReadAllBytes($stageExe)
    if ($compiledBytes.Length -lt 2 -or $compiledBytes[0] -ne 0x4D -or $compiledBytes[1] -ne 0x5A) { throw 'Compiled output does not have a Windows MZ executable header.' }

    Assert-TechnicalSafePath $Target
    if (Test-Path -LiteralPath $Target) { [IO.File]::Replace($stageExe, $Target, ($Target+'.previous-'+[guid]::NewGuid().ToString('N')), $false) }
    else { [IO.File]::Move($stageExe, $Target) }
    Write-BuildLog ('Primary .NET bootstrap build succeeded.')
    return 'DOTNET_EMBEDDED_BOOTSTRAP'
}

function Invoke-IExpressFallback {
    throw 'Legacy IExpress extraction is disabled because it cannot authenticate and confine the extracted launcher. Use Build-Single-EXE-DotNet-Only.cmd or app\\Launch-DF-VM-Technical-Institute.cmd.'
}
try {
    Write-BuildLog ('DF Portable VM Technical Institute v' + $Version + ' single-EXE build')
    Write-BuildLog ('Distribution root: ' + $Root)
    $payloadHash = New-Payload
    $method = $null

    if ($ForceIExpress) {
        $method = Invoke-IExpressFallback
    }
    else {
        try {
            $source = New-EmbeddedBootstrapSource $payloadHash
            $method = Invoke-DotNetBootstrapBuild $source
        }
        catch {
            Write-BuildLog ('Primary .NET bootstrap build failed: ' + $_.Exception.Message)
            if ($NoFallback) { throw }
            Write-BuildLog 'Attempting isolated IExpress fallback.'
            $method = Invoke-IExpressFallback
        }
    }

    if (-not (Test-Path -LiteralPath $Target -PathType Leaf)) { throw 'Build completed without a final EXE.' }
    $targetHash = (Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash
    $targetSize = (Get-Item -LiteralPath $Target).Length
    Write-BuildLog ('Created: ' + $Target)
    Write-BuildLog ('Build method: ' + $method)
    Write-BuildLog ('EXE bytes: ' + $targetSize)
    Write-BuildLog ('EXE SHA-256: ' + $targetHash)
    Write-BuildLog ('Build log: ' + $BuildLog)
    Write-BuildLog 'The generated EXE is not Authenticode-signed. Sign it separately if your deployment policy requires code signing.'
    exit 0
}
catch {
    Write-BuildLog ('FATAL: ' + $_.Exception.ToString())
    Write-Host ''
    Write-Host ('Build failed. Diagnostic log: ' + $BuildLog) -ForegroundColor Red
    Write-Host 'You can still run the institute directly with app\Launch-DF-VM-Technical-Institute.cmd.' -ForegroundColor Yellow
    exit 1
}
