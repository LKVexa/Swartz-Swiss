param([string]$Root)
$ErrorActionPreference='Stop'
function Resolve-JA21PackageRoot { param([string]$Candidate)
 if([string]::IsNullOrWhiteSpace($Candidate)){ $Candidate=Split-Path -Parent $PSScriptRoot }
 $Candidate=[Environment]::ExpandEnvironmentVariables($Candidate.Trim()).Trim('"').Trim("'")
 try{$Full=[IO.Path]::GetFullPath($Candidate)}catch{throw "Invalid package root: $($_.Exception.Message)"}
 if(!(Test-Path -LiteralPath $Full -PathType Container)){throw "Package root missing: $Full"}; return $Full }
$Root=Resolve-JA21PackageRoot $Root
$releaseVersion=(Get-Content -LiteralPath (Join-Path $Root 'VERSION') -Raw -Encoding UTF8).Trim()
if($releaseVersion -ne '9.8.7'){throw "Unexpected top-level VERSION: $releaseVersion"}
. (Join-Path $PSScriptRoot 'Wpf-CompileReferences.ps1')
$refs=Get-JA21WpfCompileReferences
$hostCs=Join-Path $Root 'host\JA21VirtualBrowser.cs'
$substrateCs=Join-Path $Root 'host\Vec1Substrate.cs'
$portableCs=Join-Path $Root 'host\PortableDesktop.cs'
$contractsCs=Join-Path $Root 'host\LiveWebContracts.cs'
$bridgeCs=Join-Path $Root 'host\LiveWebBridge.cs'
$stubCs=Join-Path $Root 'host\LiveWebBridgeStub.cs'
$provisioner=Join-Path $Root 'host\Ensure-WebView2Bridge.ps1'
$loader=Join-Path $Root 'host\Import-WebView2Adapter.ps1'
if(!(Test-Path -LiteralPath $substrateCs -PathType Leaf)){throw 'VEC1 substrate presenter source is missing: host\Vec1Substrate.cs'}
if(!(Test-Path -LiteralPath $portableCs -PathType Leaf)){throw 'Portable desktop source is missing: host\PortableDesktop.cs'}
$hostSource=Get-Content -LiteralPath $hostCs -Raw -Encoding UTF8
$substrateSource=Get-Content -LiteralPath $substrateCs -Raw -Encoding UTF8
$portableSource=Get-Content -LiteralPath $portableCs -Raw -Encoding UTF8
$contractsSource=Get-Content -LiteralPath $contractsCs -Raw -Encoding UTF8
$live=& $provisioner -Root $Root -Quiet
$bridgeFile=$stubCs
$liveLoaded=$null
if($live.Ready){
  if(!(Test-Path -LiteralPath $loader -PathType Leaf)){throw 'WebView2 managed-loader helper is missing: host\Import-WebView2Adapter.ps1'}
  $liveLoaded=& $loader -Adapter $live -Quiet
  if(!$liveLoaded.Ready){throw "WebView2 adapter provisioned but CLR load binding failed: $($liveLoaded.Error)"}
  $bridgeFile=$bridgeCs
  $refs=@($refs)+@($live.Core,$live.Wpf)
}
$bridgeSource=Get-Content -LiteralPath $bridgeFile -Raw -Encoding UTF8
$joinedStaticAudit = ($hostSource + "`n" + $substrateSource + "`n" + $portableSource + "`n" + $contractsSource + "`n" + $bridgeSource)
$fieldPattern = '(?m)^\s*private\s+(?:readonly\s+)?(?:static\s+)?[A-Za-z_][A-Za-z0-9_\.<>\[\],?]*\s+(?<name>_[A-Za-z][A-Za-z0-9_]*)\s*(?:=|;)'
foreach($fm in [regex]::Matches($joinedStaticAudit,$fieldPattern)){
  $fieldName=$fm.Groups['name'].Value
  $useCount=[regex]::Matches($joinedStaticAudit,('\b'+[regex]::Escape($fieldName)+'\b')).Count
  if($useCount -lt 2){throw "9.8.7 joined-C# warning-as-error risk: private field '$fieldName' is declared but never used."}
}
$portableLauncher=Get-Content -LiteralPath (Join-Path $Root 'Start JA21 Portable Desktop.cmd') -Raw -Encoding UTF8
if($portableLauncher.IndexOf('set /p JA21_VERSION=<"%~dp0VERSION"') -lt 0 -or $portableLauncher.IndexOf('echo JA21 Portable Desktop %JA21_VERSION%') -lt 0){throw '9.8.7 launcher version-coherence gate failed.'}
foreach($prop in @('NodeCount','ScriptCount','VmCalls','ImagesRequested')){ if($hostSource -cmatch ('\b(?:out|ref)\s+'+[regex]::Escape($prop)+'\b')){ throw "C# presenter property cannot be passed by out/ref: $prop" } }
# The presenter is two C# compilation units in one namespace: the omni-bin window and the
# VEC1 electron substrate. Add-Type accepts a single -TypeDefinition string, and C# requires
# every using directive to precede the first namespace block in that string. Concatenating
# the files verbatim therefore fails with CS1529 on the second file's usings, so they are
# hoisted here: usings are collected (de-duplicated, first-seen order), everything else is
# appended in a fixed order, and the result is one valid compilation unit.
function Join-JA21CompilationUnits {
    param([string[]]$Sources)
    $usings = New-Object System.Collections.Generic.List[string]
    $bodies = New-Object System.Collections.Generic.List[string]
    foreach ($src in $Sources) {
        $body = New-Object System.Text.StringBuilder
        foreach ($line in ($src -split "`r?`n")) {
            # A using DIRECTIVE only: 'using X;' / 'using X = Y;' / 'using static X;'.
            # A using STATEMENT ('using (var x = ...)') starts with a parenthesis and is left alone.
            if ($line -match '^\s*using\s+(static\s+)?[A-Za-z_@][^();{}]*;\s*$') {
                $u = $line.Trim()
                if (-not $usings.Contains($u)) { [void]$usings.Add($u) }
            } else {
                [void]$body.AppendLine($line)
            }
        }
        [void]$bodies.Add($body.ToString())
    }
    if ($usings.Count -lt 1) { throw 'No using directives were found in the presenter sources; refusing to compile a suspect unit.' }
    return (($usings -join [Environment]::NewLine) + [Environment]::NewLine + [Environment]::NewLine + ($bodies -join [Environment]::NewLine))
}
Add-Type -TypeDefinition (Join-JA21CompilationUnits @($hostSource, $substrateSource, $portableSource, $contractsSource, $bridgeSource)) -Language CSharp -ReferencedAssemblies $refs -ErrorAction Stop
$native=Join-Path $Root 'engine\df_medium\native\win-x64\dfmedium-ja21-web.dll'
if(!(Test-Path -LiteralPath $native -PathType Leaf)){throw 'DF_Medium JA21 web-engine DLL missing.'}
$prov=Get-Content -LiteralPath (Join-Path $Root 'engine\df_medium\ENGINE_PROVENANCE.json') -Raw -Encoding UTF8|ConvertFrom-Json
if($prov.version -ne '8.1.0'){throw 'Unexpected DF_Medium engine version.'}  # native engine rebuilt with source-bound hardening
if((Get-FileHash -LiteralPath $native -Algorithm SHA256).Hash.ToLowerInvariant() -ne $prov.windows_dll_sha256){throw 'DF_Medium native DLL provenance mismatch.'}
$srcZip=Join-Path $Root 'engine\df_medium\DF_Medium.source.zip'
if((Get-FileHash -LiteralPath $srcZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $prov.source_archive_sha256){throw 'DF_Medium source archive provenance mismatch.'}
$manifest=Get-Content -LiteralPath (Join-Path $Root 'package.integrity.json') -Raw -Encoding UTF8|ConvertFrom-Json
if($manifest.format -ne 'vb-ja21-package/5' -or $manifest.version -ne '9.8.7'){throw 'Unexpected package integrity schema/version.'}
$count=0; foreach($e in $manifest.files){$f=Join-Path $Root ($e.path.Replace('/',[IO.Path]::DirectorySeparatorChar));if(!(Test-Path -LiteralPath $f -PathType Leaf)){throw "Missing sealed file: $($e.path)"};if((Get-Item -LiteralPath $f).Length -ne [int64]$e.bytes){throw "Size mismatch: $($e.path)"};if((Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToLowerInvariant() -ne $e.sha256){throw "Hash mismatch: $($e.path)"};$count++}
$cs=Get-Content -LiteralPath $hostCs -Raw -Encoding UTF8
foreach($bad in @('JaDomNode','JaMirrorHtml','JaMirrorCss','JaMirrorDocumentSurface','WindowsFormsHost','Forms.WebBrowser','System.Windows.Forms.Integration')){if($cs -match [regex]::Escape($bad)){throw "Prohibited old/external renderer marker present: $bad"}}
foreach($good in @('DfMediumDocumentSurface','dfweb_feed_document','dfweb_scene_get','MediaElement','BitmapImage','InteropSelfTest','if(n<0)return "";')){if($cs -notmatch [regex]::Escape($good)){throw "DF_Medium presenter marker missing: $good"}}
# 8.1.0 hardening markers. Each of these is a fix whose absence would be a silent regression.
foreach($good in @('JaAddressPolicy','JaAddressText','JaResourceBudget','DfMediumNative.EngineGate','BeginOutputReadLine','public static string Contained(','JaMirrorNetworkClient.Configure')){if($cs -notmatch [regex]::Escape($good)){throw "8.1.0 hardening marker missing: $good"}}
foreach($bad in @('lock(typeof(DfMediumNative))','p.StandardOutput.ReadToEnd()','SecurityProtocol=ServicePointManager.SecurityProtocol|')){if($cs -match [regex]::Escape($bad)){throw "Regressed 8.0.x construct present: $bad"}}
# 8.1.1 compile regression: ContextDrawerWindow must qualify BrowserWindow.Brush(...).
$drawerStart=$cs.IndexOf('public sealed class ContextDrawerWindow')
$drawerEnd=$cs.IndexOf('internal sealed class JaMirrorFetchResult')
if($drawerStart -lt 0 -or $drawerEnd -le $drawerStart){throw 'Unable to locate ContextDrawerWindow source range.'}
$drawer=$cs.Substring($drawerStart,$drawerEnd-$drawerStart)
if($drawer -match '(?<![\w.])Brush\s*\('){throw 'Unqualified Brush(...) remains in ContextDrawerWindow; this collides with System.Windows.Media.Brush.'}
if($drawer -notmatch [regex]::Escape('BrowserWindow.Brush(')){throw 'ContextDrawerWindow is not using BrowserWindow.Brush(...).'}
if($cs -notmatch [regex]::Escape('Runtime integrity seal version does not match this presenter build.')){throw 'Runtime seal/presenter version consistency check is missing.'}
# The VEC1 presenter must not be able to assert a fabric verdict.
foreach($good in @('VecCanonical','records_fabric_verdict','PRESENTATION_FAILED')){if($substrateSource -notmatch [regex]::Escape($good)){throw "VEC1 substrate marker missing: $good"}}
if($substrateSource -match [regex]::Escape('EXECUTION_VERIFIED')){throw 'VEC1 presenter must never write an EXECUTION_VERIFIED event.'}
foreach($rel in @('host\LiveWebContracts.cs','host\LiveWebBridge.cs','host\LiveWebBridgeStub.cs','host\Ensure-WebView2Bridge.ps1','host\Import-WebView2Adapter.ps1','host\Install-WebView2Bridge.ps1','Install Live Web Bridge.cmd')){if(!(Test-Path -LiteralPath (Join-Path $Root $rel) -PathType Leaf)){throw "9.8.7 live-web component missing: $rel"}}
foreach($good in @('ILiveWebSurface LiveWeb','NavigateLive(','PreferLiveWeb&&LiveWebAvailable()','full-bleed content')){if($cs -notmatch [regex]::Escape($good)){throw "9.8.7 integration marker missing: $good"}}
foreach($good in @('DesignSystemVersion = "2.8.0"','DeviceHairline(Visual visual)','BuildCommandPalette(','_omniPopup = new Popup();','renderer selection automatic','AttachOverlay(','ZPalette','MonitorBounds(this)','_overlayRoot.Background = null;')){if($cs -notmatch [regex]::Escape($good)){throw "9.8.7 optical-instrument marker missing: $good"}}
foreach($good in @('shellGrid.Height = 48','shellGrid.MaxWidth = 940','capsule.CornerRadius = new CornerRadius(18)','Floating URL and search bar','island.VerticalAlignment = VerticalAlignment.Bottom;')){if($cs -notmatch [regex]::Escape($good)){throw "9.8.7 floating URL/search instrument marker missing: $good"}}
foreach($good in @('_omniBar = shellGrid','_omniPopup = new Popup();','_omniPopup.Placement = PlacementMode.RelativePoint;','_omniPopup.Child = shellGrid','NativeGlass.CursorIn(this)','OnOmniGripMouseDown','OnOmniGripMouseMove','OnOmniGripMouseUp','Ctrl+Shift+L','Recenter floating omni bar')){if($cs -notmatch [regex]::Escape($good)){throw "9.8.7 movable omni-bar marker missing: $good"}}
foreach($good in @('class PortableUiState','state\\ui','omni-bar.position','TryLoadOmniBarPlacement','SaveOmniBarPlacement')){if($portableSource -notmatch [regex]::Escape($good)){throw "9.8.7 portable omni-state marker missing: $good"}}
foreach($good in @('_omniEditDirty','_omniEditTabId = -1','_omniDraftText','BeginOmniEditSession()','EndOmniEditSession(bool preserveCurrentText)','HasProtectedOmniDraft(BrowserTab t)','_clearAddressButton = GlyphButton("×", "Clear omni text", 12)','This includes an intentionally empty string')){if($cs -notmatch [regex]::Escape($good)){throw "9.8.7 omni draft-state marker missing: $good"}}
if($cs.IndexOf('(_omniUserEditing || _omniEditDirty || _address.IsKeyboardFocusWithin)') -lt 0){throw '9.8.7 Add-Type warning-as-error regression: _omniUserEditing is not consumed by the omni draft guard.'}
foreach($good in @('FocusManager.SetIsFocusScope(shellGrid, true);','ClaimOmniKeyboardFocus(false);','QueueOmniKeyboardFocusRecovery(false);','PreviewTextInput += OnPreviewTextInput;','ReplaceOmniSelection(e.Text);','DeleteOmniText(e.Key == Key.Back);','_surface.PreviewMouseLeftButtonDown += delegate')){if($cs -notmatch [regex]::Escape($good)){throw "9.8.7 omni keyboard-focus recovery marker missing: $good"}}
if($cs.IndexOf('Keyboard.Focus(_address) == _address') -ge 0){throw '9.8.7 Add-Type warning-as-error risk: cross-type Keyboard.Focus reference comparison is present.'}
$navStart=$cs.IndexOf('t.LiveWeb.NavigationCommitted+=delegate')
$navEnd=$cs.IndexOf('t.LiveWeb.StatusChanged+=delegate',$navStart)
if($navStart -lt 0 -or $navEnd -le $navStart){throw '9.8.7 live navigation callback range missing.'}
$navBlock=$cs.Substring($navStart,$navEnd-$navStart)
if($navBlock.IndexOf('_address.Text') -ge 0){throw '9.8.7 live navigation callback writes omni text directly.'}
if($navBlock.IndexOf('SyncChrome();') -lt 0){throw '9.8.7 live navigation callback bypasses guarded SyncChrome.'}
if($cs -match [regex]::Escape('ContextDrawerWindow : Window')){throw '9.8.7 contextual drawer regressed to a separate top-level Window.'}

$bridgeAudit=Get-Content -LiteralPath $bridgeCs -Raw -Encoding UTF8
foreach($good in @('Microsoft.Web.WebView2.Wpf','WebView2CompositionControl','CoreWebView2Environment.GetAvailableBrowserVersionString','PermissionRequested','NewWindowRequested','ContainsFullScreenElementChanged','ClearBrowsingDataAsync')){if($bridgeAudit -notmatch [regex]::Escape($good)){throw "Live-web bridge marker missing: $good"}}
$loaderAudit=Get-Content -LiteralPath $loader -Raw -Encoding UTF8
foreach($good in @('AssemblyName]::GetAssemblyName','Assembly]::LoadFrom($Core)','Assembly]::LoadFrom($Wpf)','WebView2Loader.dll','RuntimeReady')){if($loaderAudit -notmatch [regex]::Escape($good)){throw "9.8.7 WebView2 loader marker missing: $good"}}
$startAudit=Get-Content -LiteralPath (Join-Path $Root 'host\Start-JA21Browser.ps1') -Raw -Encoding UTF8
if($startAudit.IndexOf('$liveLoaded = & $liveLoader -Adapter $live -Quiet') -lt 0){throw '9.8.7 startup does not invoke the WebView2 managed loader.'}
if($startAudit.IndexOf('$liveLoaded = & $liveLoader -Adapter $live -Quiet') -gt $startAudit.IndexOf('Add-Type -TypeDefinition $code')){throw '9.8.7 WebView2 managed load occurs after Add-Type; expected before compile/run.'}
foreach($good in @('logs\boot-latest.log','Write-JA21BootStage','presenter-compile-begin','presenter-compile-complete','presenter-run-begin','trap {')){if($startAudit.IndexOf($good) -lt 0){throw "9.8.7 boot-diagnostic marker missing: $good"}}
$launcherAudit=Get-Content -LiteralPath (Join-Path $Root 'Start JA21 Portable Desktop.cmd') -Raw -Encoding UTF8
if($launcherAudit.IndexOf('type "%JA21_PORTABLE_ROOT%\logs\boot-latest.log"') -lt 0){throw '9.8.7 launcher does not surface the persisted boot log on failure.'}
# VEC1 substrate presence and node binding.
$substrateRoot=Join-Path $Root 'substrate'
foreach($rel in @('vec1\vecctl.py','vec1\core.py','vec1\binding.py','vec1\presenter.py','config\vec1.json','config\CONFIG_SEAL.json','NODES.json','DF_Fabric','evidence\presenter\CANONICAL_VECTORS.json')){if(!(Test-Path -LiteralPath (Join-Path $substrateRoot $rel))){throw "VEC1 substrate component missing: substrate\$rel"}}
$binding=Get-Content -LiteralPath (Join-Path $substrateRoot 'NODES.json') -Raw -Encoding UTF8|ConvertFrom-Json
$boundNodes=@(); $unvendored=@()
foreach($nid in @('N_SMALL','N_MEDIUM','N_LARGE','N_XLARGE')){
  $rec=$binding.nodes.$nid
  if([string]::IsNullOrWhiteSpace($rec.container)){$unvendored+=$nid;continue}
  $vm=Join-Path (Join-Path $Root ($rec.container.Replace('/',[IO.Path]::DirectorySeparatorChar))) ("vm\"+$rec.vm_dirname)
  if(Test-Path -LiteralPath $vm -PathType Container){$boundNodes+=$nid}else{throw "VEC node $nid declares container '$($rec.container)' but its VM directory is absent."}
}
if($cs -match [regex]::Escape('dfweb_string_get(id,b,(UInt32)b.Capacity)==0?b.ToString():""')){throw 'Legacy DF_Medium string ABI bug present.'}
$engine=Get-Content -LiteralPath (Join-Path $Root 'engine\df_medium\source\ja21_webengine.c') -Raw -Encoding UTF8
foreach($good in @('br_device_invoke','br_core_configure','br_core_set_device','DFWEB_SCENE_IMAGE','DFWEB_SCENE_VIDEO')){if($engine -notmatch [regex]::Escape($good)){throw "DF_Medium web-engine marker missing: $good"}}
foreach($rel in @('engine\VB.exe','electron.exe','chrome_elf.dll','msedgewebview2.exe','engine\resources.pak','engine\snapshot_blob.bin','engine\v8_context_snapshot.bin')){if(Test-Path -LiteralPath (Join-Path $Root $rel)){throw "Prohibited external browser-engine payload present: $rel"}}

$trace=Join-Path $Root 'evidence\OPTICAL-INSTRUMENT-WORKITEM-TRACEABILITY-9.0.0.jsonl'
$opticalSummary=Join-Path $Root 'evidence\OPTICAL-INSTRUMENT-APPLICATION-SUMMARY-9.0.0.json'
if(!(Test-Path -LiteralPath $trace -PathType Leaf) -or !(Test-Path -LiteralPath $opticalSummary -PathType Leaf)){throw '9.0.0 master-series traceability evidence is missing.'}
$traceLines=@(Get-Content -LiteralPath $trace -Encoding UTF8)
if($traceLines.Count -ne 12500){throw "Expected 12,500 Optical Instrument work-item trace records; found $($traceLines.Count)."}
$firstTrace=$traceLines[0]|ConvertFrom-Json; $lastTrace=$traceLines[$traceLines.Count-1]|ConvertFrom-Json
if($firstTrace.work_item_id -ne '1.01.01' -or $lastTrace.work_item_id -ne '20.25.25'){throw 'Optical Instrument traceability ID range mismatch.'}
Write-Host "PASS: package integrity ($count sealed files)." -ForegroundColor Green
Write-Host 'PASS: WPF presenter source compile preflight.' -ForegroundColor Green
Write-Host 'PASS: DF_Medium source archive and native DLL provenance.' -ForegroundColor Green
Write-Host 'PASS: old C#/WPF document parser removed; DF_Medium scene presenter installed.' -ForegroundColor Green
Write-Host 'PASS: DF_Medium VM Web Device ABI / image / video scene paths present.' -ForegroundColor Green
Write-Host 'PASS: Electron/Node bundled runtime absent; WebView2 bridge is explicit and externally runtime-backed.' -ForegroundColor Green
Write-Host "PASS: VEC1 electron substrate present; node containers bound: $($boundNodes -join ', ')." -ForegroundColor Green
Write-Host 'PASS: 8.1.0 hardening markers present (address boundary, resource budget, helper pipe drain, seal containment).' -ForegroundColor Green
Write-Host 'PASS: 8.1.1 presenter compile regression gate (qualified Brush helper + seal version binding).' -ForegroundColor Green
Write-Host 'PASS: 9.8.7 Optical Instrument composition bridge, overlay chrome, renderer routing, and four-node VEC1 binding.' -ForegroundColor Green
Write-Host 'PASS: 9.8.7 movable floating omni bar + portable normalized placement state.' -ForegroundColor Green
Write-Host 'PASS: 9.8.7 tab-scoped dirty omni draft + empty-clear protection.' -ForegroundColor Green
Write-Host 'PASS: 9.8.7 post-navigation omni typing/delete focus recovery.' -ForegroundColor Green
Write-Host 'PASS: 9.8.7 Add-Type warning-risk removal + persistent boot-stage diagnostics.' -ForegroundColor Green
Write-Host 'PASS: VEC1 presenter cannot record a fabric execution verdict.' -ForegroundColor Green
Write-Host 'PASS: 9.0.0 12,500-item master-series traceability remains preserved.'
$portableAudit = $portableSource
$unqualifiedPath = [regex]::Match($portableAudit, '(?<![A-Za-z0-9_.])Path\.')
if($unqualifiedPath.Success){throw '9.8.7 joined-C# compile regression: PortableDesktop.cs contains unqualified Path.* while System.Windows.Shapes is in the merged using set.'}
if($portableAudit.IndexOf('System.IO.Path.Combine(packageRoot, "workspace")') -lt 0){throw '9.8.7 PortableDesktop path qualification marker missing.'}
Write-Host 'PASS: 9.8.7 portable workspace + DF-tier placement source is included in the Windows compile gate.' -ForegroundColor Green
if($unvendored.Count -gt 0){throw "9.8.7 integration requires all four VEC1 nodes to be vendored; missing: $($unvendored -join ', ')"}
Write-Host 'Next: run Start JA21 Virtual Browser.cmd for live network/image/video qualification.' -ForegroundColor Cyan
Write-Host '      then: python substrate\vec1\vecctl.py presenter-audit' -ForegroundColor Cyan
