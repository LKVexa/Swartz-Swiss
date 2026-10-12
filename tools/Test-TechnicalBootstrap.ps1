param([string]$Root = (Split-Path -Parent $PSScriptRoot), [string]$Work = (Join-Path (Split-Path -Parent $PSScriptRoot) 'workspace\technical-bootstrap-tests'))
$ErrorActionPreference = 'Stop'
[void][IO.Directory]::CreateDirectory($Work)
$CaseRoot = Join-Path $Work ('case-'+[guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($CaseRoot)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$Source = [IO.File]::ReadAllText((Join-Path $Root 'substrate\Technical_Institute\build\Bootstrap.template.cs'))
$Source = $Source.Replace('__VERSION__','test').Replace('__PAYLOAD_SHA__',('0'*64)).Replace('__BASE64_CHUNKS__','"UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA=="')
$Assembly = Add-Type -TypeDefinition $Source -Language CSharp -ReferencedAssemblies @('System.dll','System.Core.dll','System.Windows.Forms.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll') -PassThru
$Type = @($Assembly | Where-Object {$_.Name -eq 'Program'})[0]
$Extract = $Type.GetMethod('ExtractZipSafely',[Reflection.BindingFlags]'NonPublic,Static')
function New-Zip([string[]]$Names) {
    $Memory = New-Object IO.MemoryStream
    try {
        $Zip = New-Object IO.Compression.ZipArchive($Memory,[IO.Compression.ZipArchiveMode]::Create,$true)
        try { foreach($Name in $Names) { $Entry=$Zip.CreateEntry($Name); $Writer=New-Object IO.StreamWriter($Entry.Open()); try{$Writer.Write('bootstrap regression')}finally{$Writer.Dispose()} } } finally {$Zip.Dispose()}
        return ,($Memory.ToArray())
    } finally {$Memory.Dispose()}
}
$Checks = New-Object System.Collections.Generic.List[object]
function Check([string]$Name,[bool]$Passed){[void]$Checks.Add([ordered]@{name=$Name;passed=$Passed});if(-not $Passed){throw "Bootstrap regression failed: $Name"}}
function Invoke-Extraction([string[]]$Names,[string]$Destination){
    $InvokeArgs=New-Object object[] 2
    $InvokeArgs[0]=(New-Zip $Names).PSObject.BaseObject
    $InvokeArgs[1]=$Destination.PSObject.BaseObject
    $null=$Extract.Invoke($null,$InvokeArgs)
}
$Failure = $null
try {
    foreach($Case in @(@('../escape.txt'),@('C:/rooted.txt'),@('alternate.txt:stream'),@('duplicate.txt','DUPLICATE.txt'))){
        $Destination=Join-Path $CaseRoot ([guid]::NewGuid().ToString('N'))
        [void][IO.Directory]::CreateDirectory($Destination)
        $Rejected=$false
        try{Invoke-Extraction $Case $Destination}catch{$Rejected=$_.Exception.GetBaseException() -is [IO.InvalidDataException]}
        Check ('Unsafe ZIP rejected: '+($Case -join ', ')) $Rejected
    }
    $Destination=Join-Path $CaseRoot 'valid'
    [void][IO.Directory]::CreateDirectory($Destination)
    Invoke-Extraction @('nested/valid.txt') $Destination
    Check 'Valid ZIP confined extraction succeeds' ([IO.File]::ReadAllText((Join-Path $Destination 'nested\valid.txt')) -ceq 'bootstrap regression')
    Check 'ZIP traversal did not write outside staging' (-not (Test-Path -LiteralPath (Join-Path $CaseRoot 'escape.txt')))
}catch{$Failure=$_.Exception.GetBaseException().Message}finally{
    $Report=[ordered]@{status=$(if($Failure){'failed'}else{'passed'});checks=$Checks.ToArray();failure=$Failure;case_root=$CaseRoot;application_started=$false}
    [IO.File]::WriteAllText((Join-Path $Work 'technical-bootstrap-tests.json'),($Report|ConvertTo-Json -Depth 6),(New-Object Text.UTF8Encoding($false)))
    Write-Output ('Technical bootstrap regressions: '+$Report.status+'; '+$Checks.Count+' checks. '+$Failure)
}
if($Failure){exit 1}
