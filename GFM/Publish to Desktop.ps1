$ErrorActionPreference = 'Stop'
$publishRoot = $PSScriptRoot
$publishDesktop = [Environment]::GetFolderPath('Desktop')
if ([string]::IsNullOrWhiteSpace($publishDesktop) -or !(Test-Path -LiteralPath $publishDesktop -PathType Container)) { throw 'Windows Desktop could not be located.' }
$publishDesktop = [IO.Path]::GetFullPath($publishDesktop)
$publishReceipt = [ordered]@{schema='GFM-desktop-publish/1'; version='2.1.0'; projectRoot=$publishRoot; desktop=$publishDesktop; published=$false; entries=@(); windowsPolicyChanged=$false}
try {
 foreach ($publishName in @('GFM Simulator.url','GFM Project.url')) {
  $publishEntry = if ($publishName -eq 'GFM Simulator.url') { 'Open GFM Preview.html' } else { 'GFM Project.html' }
  $publishFile = Join-Path $publishRoot $publishEntry
  if (!(Test-Path -LiteralPath $publishFile -PathType Leaf)) { throw ('The project entry is missing: ' + $publishFile) }
  $publishUrl = [Uri]::new($publishFile).AbsoluteUri
  $publishBytes = [Text.UTF8Encoding]::new($false).GetBytes("[InternetShortcut]`r`nURL=$publishUrl`r`n")
  $publishHasher = [Security.Cryptography.SHA256]::Create()
  try { $publishHash = [BitConverter]::ToString($publishHasher.ComputeHash($publishBytes)).Replace('-','') } finally { $publishHasher.Dispose() }
  $publishTarget = Join-Path $publishDesktop $publishName
  if (Test-Path -LiteralPath $publishTarget) {
   if ((Get-FileHash -LiteralPath $publishTarget -Algorithm SHA256).Hash -ne $publishHash) {
    $publishBase = [IO.Path]::GetFileNameWithoutExtension($publishName)
    $publishTarget = Join-Path $publishDesktop ($publishBase + ' 2.1.0.url')
    if ((Test-Path -LiteralPath $publishTarget) -and (Get-FileHash -LiteralPath $publishTarget -Algorithm SHA256).Hash -ne $publishHash) { throw ('A different shortcut already occupies ' + $publishTarget) }
   }
  }
  if (!(Test-Path -LiteralPath $publishTarget)) { [IO.File]::WriteAllBytes($publishTarget,$publishBytes) }
  if ((Get-FileHash -LiteralPath $publishTarget -Algorithm SHA256).Hash -ne $publishHash) { throw 'Desktop shortcut verification failed.' }
  $publishReceipt.entries += [ordered]@{path=$publishTarget;sha256=$publishHash;verified=$true}
 }
 $publishReceipt.published = $true
 Write-Output 'Published GFM Simulator and GFM Project to your Windows desktop.'
} catch {
 $publishReceipt.error = $_.Exception.Message
 Write-Error $_ -ErrorAction Continue
} finally {
 $publishReceipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $publishRoot 'validation\desktop-publish.json') -Encoding UTF8
}
if (!$publishReceipt.published) { exit 1 }
