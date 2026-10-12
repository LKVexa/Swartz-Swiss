param([string]$Root)
$ErrorActionPreference='Stop'
if([string]::IsNullOrWhiteSpace($Root)){ $Root=Split-Path -Parent $PSScriptRoot }
$Root=[IO.Path]::GetFullPath($Root)
. (Join-Path $PSScriptRoot 'Portable-Security.ps1')
$Version=(Get-Content -LiteralPath (Join-Path $Root 'VERSION') -Raw -Encoding UTF8).Trim()
if($Version -ne '9.8.7'){ throw "Expected JA21 9.8.7, found '$Version'." }
$Workspace=Get-JA21PortableRoot $Root
if(!(Test-Path -LiteralPath $Workspace -PathType Container)){ throw "Portable workspace does not exist: $Workspace" }
$SnapshotDir=Assert-JA21NoReparsePoint (Join-Path $Workspace 'snapshots')
[void][IO.Directory]::CreateDirectory($SnapshotDir)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ExcludeTop=@('cache','temp','snapshots')
$files=New-Object System.Collections.Generic.List[object]
$pending=New-Object System.Collections.Generic.Queue[string]
$pending.Enqueue($Workspace)
while($pending.Count -gt 0){
    $directory=$pending.Dequeue()
    $null=Assert-JA21NoReparsePoint $directory
    foreach($item in Get-ChildItem -LiteralPath $directory -Force){
        $rel=$item.FullName.Substring($Workspace.Length).TrimStart('\','/')
        $top=($rel -split '[\\/]')[0]
        if($ExcludeTop -contains $top){continue}
        $null=Assert-JA21NoReparsePoint $item.FullName
        if($item.PSIsContainer){$pending.Enqueue($item.FullName)}else{[void]$files.Add($item)}
    }
}
$files=@($files | Sort-Object FullName)
if(@($files | Where-Object {$_.FullName.Substring($Workspace.Length).TrimStart('\','/') -ieq 'SNAPSHOT_MANIFEST.json'}).Count -gt 0){throw 'The workspace contains reserved snapshot entry SNAPSHOT_MANIFEST.json.'}
$inventory=New-Object System.Collections.Generic.List[object]
$partial=Join-Path $SnapshotDir ('.partial-'+[guid]::NewGuid().ToString('N')+'.zip')
$manifestJson=$null
try{
    $fs=[IO.File]::Open($partial,[IO.FileMode]::CreateNew,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)
    try{
        $zip=New-Object IO.Compression.ZipArchive($fs,[IO.Compression.ZipArchiveMode]::Create,$true)
        try{
            foreach($f in $files){
                $null=Assert-JA21NoReparsePoint $f.FullName
                $rel=$f.FullName.Substring($Workspace.Length).TrimStart('\','/').Replace('\','/')
                $entry=$zip.CreateEntry($rel,[IO.Compression.CompressionLevel]::Optimal)
                $entry.LastWriteTime=[DateTimeOffset]::new(2000,1,1,0,0,0,[TimeSpan]::Zero)
                # Reject concurrent writers, and hash exactly the bytes copied into the archive.
                $src=[IO.File]::Open($f.FullName,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Read)
                try{
                    $dst=$entry.Open()
                    $sha=[Security.Cryptography.SHA256]::Create()
                    try{
                        $buffer=New-Object byte[] 65536
                        [int64]$bytes=0
                        while(($n=$src.Read($buffer,0,$buffer.Length)) -gt 0){
                            $dst.Write($buffer,0,$n)
                            [void]$sha.TransformBlock($buffer,0,$n,$buffer,0)
                            $bytes+=$n
                        }
                        [void]$sha.TransformFinalBlock($buffer,0,0)
                        $hash=([BitConverter]::ToString($sha.Hash)).Replace('-','').ToLowerInvariant()
                        [void]$inventory.Add([ordered]@{path=$rel;bytes=$bytes;sha256=$hash})
                    }finally{$sha.Dispose();$dst.Dispose()}
                }finally{$src.Dispose()}
            }
            $canonical=($inventory | ForEach-Object { $_.path+'|'+$_.bytes+'|'+$_.sha256 }) -join "`n"
            $sha=[Security.Cryptography.SHA256]::Create()
            try{$contentId=([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($canonical)))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}
            $manifest=[ordered]@{
                schema='JA21/PORTABLE_WORKSPACE_SNAPSHOT/1'; application_version=$Version; content_id=$contentId;
                excludes=$ExcludeTop; file_count=$inventory.Count; files=@($inventory.ToArray());
                fabric_claim='HOST_MEDIATED_PLACEMENT_ONLY'; fabric_verdict=$null;
                note='Close JA21 before snapshotting. Each entry hash covers the archived bytes; cache/temp/prior snapshots are excluded. Junctions/symbolic links and files open for writing are refused.'
            }
            $manifestJson=$manifest|ConvertTo-Json -Depth 8
            $me=$zip.CreateEntry('SNAPSHOT_MANIFEST.json',[IO.Compression.CompressionLevel]::Optimal)
            $me.LastWriteTime=[DateTimeOffset]::new(2000,1,1,0,0,0,[TimeSpan]::Zero)
            $sw=New-Object IO.StreamWriter($me.Open(),(New-Object Text.UTF8Encoding($false)))
            try{$sw.Write($manifestJson)}finally{$sw.Dispose()}
        }finally{$zip.Dispose()}
    }finally{$fs.Dispose()}
    $out=Assert-JA21NoReparsePoint (Join-Path $SnapshotDir ('JA21-Workspace-'+$Version+'-'+$contentId.Substring(0,16)+'.zip'))
    if(Test-Path -LiteralPath $out){
        if((Get-FileHash -LiteralPath $out -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $partial -Algorithm SHA256).Hash){throw 'An existing snapshot has the same content ID but different archive bytes; refusing to overwrite it.'}
    }else{[IO.File]::Move($partial,$out)}
    $manifestPath=Assert-JA21NoReparsePoint ($out+'.manifest.json')
    if(Test-Path -LiteralPath $manifestPath){
        if([IO.File]::ReadAllText($manifestPath) -cne $manifestJson){throw 'Existing snapshot manifest differs; refusing to overwrite it.'}
    }else{
        $manifestStream=[IO.File]::Open($manifestPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
        try{$manifestWriter=New-Object IO.StreamWriter($manifestStream,(New-Object Text.UTF8Encoding($false)));try{$manifestWriter.Write($manifestJson)}finally{$manifestWriter.Dispose()}}finally{$manifestStream.Dispose()}
    }
}finally{
    if(Test-Path -LiteralPath $partial){$null=Assert-JA21NoReparsePoint $partial;Remove-Item -LiteralPath $partial -Force}
}
Write-Host 'JA21 portable workspace snapshot complete.' -ForegroundColor Green
Write-Host ('Content ID: '+$contentId)
Write-Host ('Files: '+$inventory.Count)
Write-Host ('Snapshot: '+$out)
Write-Host ('Manifest: '+$manifestPath)
