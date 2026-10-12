param([string]$Root=(Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference='Stop'
$Root=[IO.Path]::GetFullPath($Root)
$verifyWork=Join-Path $Root 'workspace\verification'
[void][IO.Directory]::CreateDirectory($verifyWork)
$verifyChecks=New-Object System.Collections.Generic.List[object]
$verifyPolicies=New-Object System.Collections.Generic.List[object]
$verifyFailure=$null
$verifyRuntime=$null
$verifyWindow=$null
$verifyVec=$null
function Add-GFMCheck([string]$Name,[bool]$Passed,$Detail){[void]$verifyChecks.Add([ordered]@{name=$Name;passed=$Passed;detail=$Detail})}
function Join-GFMUnits([string[]]$Files){
 $verifyUsings=New-Object System.Collections.Generic.List[string]
 $verifyBodies=New-Object System.Collections.Generic.List[string]
 foreach($verifyFile in $Files){
  $verifyBody=New-Object Text.StringBuilder
  foreach($verifyLine in ([IO.File]::ReadAllText((Join-Path $Root $verifyFile))-split "`r?`n")){
   if($verifyLine-match '^\s*using\s+(static\s+)?[A-Za-z_@][^();{}]*;\s*$'){
    if(!$verifyUsings.Contains($verifyLine.Trim())){[void]$verifyUsings.Add($verifyLine.Trim())}
   }else{[void]$verifyBody.AppendLine($verifyLine)}
  }
  [void]$verifyBodies.Add($verifyBody.ToString())
 }
 return (($verifyUsings-join [Environment]::NewLine)+[Environment]::NewLine+($verifyBodies-join [Environment]::NewLine))
}
try{
 if($PSVersionTable.PSEdition-ne 'Desktop'-or ![Environment]::Is64BitProcess){throw 'Run this verification with 64-bit Windows PowerShell 5.1.'}
 if([Threading.Thread]::CurrentThread.GetApartmentState()-ne 'STA'){throw 'Use the -STA parameter.'}
 $env:JA21_CONSOLE_MODE='1'
 $env:JA21_START_URL='about:blank'
 $env:JA21_PORTABLE_ROOT=Join-Path $Root 'workspace'
 $env:JA21_WEB_DATA_ROOT=Join-Path $Root 'workspace\state\webview2'
 $env:JA21_VEC1_STATE_ROOT=Join-Path $Root 'workspace\state\vec1'
 . (Join-Path $Root 'host\Wpf-CompileReferences.ps1')
 $verifyRefs=Get-JA21WpfCompileReferences
 $verifySdk=Join-Path $Root 'runtime\webview2-sdk\1.0.4191.47'
 $verifyAdapter=[pscustomobject]@{Ready=$true;Version='1.0.4191.47';Root=$verifySdk;Core=(Join-Path $verifySdk 'Microsoft.Web.WebView2.Core.dll');Wpf=(Join-Path $verifySdk 'Microsoft.Web.WebView2.Wpf.dll');Loader=(Join-Path $verifySdk 'WebView2Loader.dll')}
 $verifyLoaded=& (Join-Path $Root 'host\Import-WebView2Adapter.ps1') -Adapter $verifyAdapter -Quiet
 if(!$verifyLoaded.Ready){throw ('Managed adapter unavailable: '+$verifyLoaded.Error)}
 $verifyRuntime=$verifyLoaded.RuntimeReady
 Add-GFMCheck 'Pinned WebView2 managed adapter' $true $verifyLoaded.RuntimeVersion
 $verifyRefs=@($verifyRefs)+@($verifyAdapter.Core,$verifyAdapter.Wpf)
 $verifyCode=Join-GFMUnits @('host\JA21VirtualBrowser.cs','host\Vec1Substrate.cs','host\PortableDesktop.cs','host\LiveWebContracts.cs','host\LiveWebBridge.cs')
 Add-Type -TypeDefinition $verifyCode -Language CSharp -ReferencedAssemblies $verifyRefs -ErrorAction Stop
 Add-GFMCheck 'Complete native host compilation' $true 'Same five C# units and references as the console launcher.'
 [VBJA21.RuntimeSeal]::Verify($Root)
 Add-GFMCheck 'Native and bundled application integrity' $true 'RuntimeSeal.Verify completed.'
 $verifyAssembly=[VBJA21.BrowserWindow].Assembly
 $verifyStatic=[Reflection.BindingFlags]'Static,Public,NonPublic'
 $verifyInstance=[Reflection.BindingFlags]'Instance,Public,NonPublic'
 $verifyPolicy=$verifyAssembly.GetType('VBJA21.JaAddressPolicy',$true)
 $verifyCases=@(
  @('https://gfm.ja21.invalid/Open%20GFM%20Preview.html',$true),
  @('https://gfm.ja21.invalid:443/GFM%20Project.html',$true),
  @('https://GFM.JA21.INVALID/docs/GFM-Audit.pdf',$true),
  @('http://gfm.ja21.invalid/',$false),
  @('https://gfm.ja21.invalid:444/',$false),
  @('https://gfm.ja21.invalid.evil.example/',$false),
  @('https://user:pass@gfm.ja21.invalid/',$false),
  @('https://gfm.ja21.invalid./',$false),
  @('https://example.com/',$false),
  @('http://127.0.0.1:8788/',$false),
  @('http://localhost:8791/',$false),
  @('file:///D:/Codex/GFM-JA21/GFM/Open%20GFM%20Preview.html',$false)
 )
 foreach($verifyCase in $verifyCases){
  $verifyAllowed=$false
  try{
   $verifyUri=[Uri]::new([string]$verifyCase[0])
   [void]$verifyPolicy.GetMethod('Check',$verifyStatic).Invoke($null,[object[]]@($verifyUri))
   [void]$verifyPolicy.GetMethod('CheckResolved',$verifyStatic).Invoke($null,[object[]]@($verifyUri))
   $verifyAllowed=$true
  }catch{}
  [void]$verifyPolicies.Add([ordered]@{url=$verifyCase[0];expected=$verifyCase[1];allowed=$verifyAllowed;passed=($verifyAllowed-eq $verifyCase[1])})
 }
 Add-GFMCheck 'Exact mounted application origin' (@($verifyPolicies|Where-Object{!$_.passed}).Count-eq 0) $verifyPolicies.Count
 [void]$verifyAssembly.GetType('VBJA21.PortableFabric',$true).GetMethod('Configure',$verifyStatic).Invoke($null,[object[]]@($Root))
 $verifyJson=New-Object System.Web.Script.Serialization.JavaScriptSerializer
 $verifyJson.MaxJsonLength=[int]::MaxValue
 $verifyBrowser=[Activator]::CreateInstance([VBJA21.Ja21Vm],[object[]]@($verifyJson.DeserializeObject([IO.File]::ReadAllText((Join-Path $Root 'engine\ja21\browser.ir.json')))))
 $verifyRenderer=[Activator]::CreateInstance([VBJA21.Ja21Vm],[object[]]@($verifyJson.DeserializeObject([IO.File]::ReadAllText((Join-Path $Root 'engine\ja21\renderer.ir.json')))))
 $verifyHelper=New-Object VBJA21.DfSmallHelper $Root
 $verifyVec=New-Object VBJA21.VecSubstrate $Root
 [void]$verifyVec.BeginSession()
 $verifyCtor=[VBJA21.BrowserWindow].GetConstructor([type[]]@([string],[VBJA21.Ja21Vm],[VBJA21.Ja21Vm],[VBJA21.DfSmallHelper],[VBJA21.VecSubstrate]))
 $verifyWindow=$verifyCtor.Invoke([object[]]@($Root,$verifyBrowser,$verifyRenderer,$verifyHelper,$verifyVec))
 Add-GFMCheck 'Research window geometry' ($verifyWindow.Width-eq 1280-and $verifyWindow.Height-eq 900-and $verifyWindow.MinWidth-eq 760-and $verifyWindow.MinHeight-eq 600) '1280 x 900; minimum 760 x 600.'
 Add-GFMCheck 'No external browser window' (!$verifyWindow.IsVisible) 'Native window constructed without calling Show; no external browser launched.'
 $verifyConfig=Get-Content -LiteralPath (Join-Path $Root 'console.json') -Raw|ConvertFrom-Json
 Add-GFMCheck 'Bundled preview default' ($verifyConfig.start_url-eq 'https://gfm.ja21.invalid/Open%20GFM%20Preview.html'-and @($verifyConfig.local_origins).Count-eq 0) $verifyConfig.start_url
}catch{
 $verifyFailure=$_.Exception.GetBaseException().Message
 Add-GFMCheck 'Native verification completed' $false $verifyFailure
 Write-Host ($_|Out-String)
}finally{
 if($null-ne $verifyWindow){try{$verifyWindow.Close()}catch{}}
 if($null-ne $verifyVec){try{$verifyVec.EndSession()}catch{}}
 $verifyFailed=@($verifyChecks|Where-Object{!$_.passed})
 $verifyReport=[ordered]@{schema='GFM-JA21-native-verification/1';status=$(if($verifyFailed.Count){'failed'}else{'passed'});checks=$verifyChecks.ToArray();policyCases=$verifyPolicies.ToArray();runtimeDetected=$verifyRuntime;liveRendererExercised=$false;nativeWindowShown=$false;networkRequestsMade=$false;failure=$verifyFailure}
 [IO.File]::WriteAllText((Join-Path $verifyWork 'native-console.json'),($verifyReport|ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
 Write-Output ('Native console checks: '+$verifyReport.status+'; report: '+(Join-Path $verifyWork 'native-console.json'))
}
if($verifyFailed.Count){exit 1}
