#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,sys,subprocess,os,re,struct
from windows_archive_preflight import scan_tree
from package_paths import manifest_entries, package_files
ROOT=Path(__file__).resolve().parents[1]
def h(p):
    s=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): s.update(b)
    return s.hexdigest()
errors=[]
for issue in scan_tree(ROOT):
    errors.append("Windows path preflight: "+json.dumps(issue,ensure_ascii=False,sort_keys=True))
try:
    manifest=json.loads((ROOT/'package.integrity.json').read_text(encoding='utf-8'))
    entries=manifest_entries(ROOT,manifest)
    actual_files={p.relative_to(ROOT).as_posix() for p in package_files(ROOT)}
except (ValueError, OSError) as exc:
    print('VERIFY FAIL: invalid package manifest or payload:',exc)
    sys.exit(1)
release_file=(ROOT/'VERSION')
if not release_file.is_file(): errors.append('top-level VERSION file is missing')
elif release_file.read_text(encoding='utf-8').strip()!='9.8.7': errors.append('top-level VERSION is not 9.8.7')
if manifest.get('format')!='vb-ja21-package/5': errors.append('wrong package manifest format')
if manifest.get('version')!='9.8.7': errors.append('wrong package version')
try:
    console_version=(ROOT/'CONSOLE_VERSION').read_text(encoding='utf-8').strip()
    console_build=json.loads((ROOT/'CONSOLE_BUILD.json').read_text(encoding='utf-8'))
    if not re.fullmatch(r'\d+\.\d+\.\d+', console_version): errors.append('invalid console release version')
    if console_build.get('console_version')!=console_version: errors.append('console release metadata mismatch')
    if console_build.get('base_browser_version')!=release_file.read_text(encoding='utf-8').strip(): errors.append('console/presenter compatibility version mismatch')
    if console_build.get('license')!='GPL-3.0-only': errors.append('unexpected console license identifier')
except (ValueError,OSError) as exc:
    errors.append('invalid console release metadata: '+str(exc))
listed_files={e['path'] for e,p in entries}
for rel in sorted(actual_files-listed_files): errors.append('unsealed package file '+rel)
for rel in sorted(listed_files-actual_files): errors.append('manifest path is absent or excluded from payload '+rel)
for e,p in entries:
    if not p.is_file(): errors.append('missing '+e['path']); continue
    if p.stat().st_size!=e['bytes']: errors.append('size '+e['path'])
    if h(p)!=e['sha256']: errors.append('hash '+e['path'])
try:
    runtime=json.loads((ROOT/'engine/ja21/runtime.integrity.json').read_text(encoding='utf-8'))
    runtime_entries=manifest_entries(ROOT,runtime)
    if runtime.get('format')!='vb-ja21-runtime-seal/4': errors.append('wrong runtime manifest format')
    if runtime.get('version')!=manifest.get('version'): errors.append('runtime/package version mismatch')
    for e,p in runtime_entries:
        if not p.is_file(): errors.append('runtime missing '+e['path']); continue
        if p.stat().st_size!=e['bytes'] or h(p)!=e['sha256']: errors.append('runtime integrity '+e['path'])
except (ValueError,OSError) as exc:
    errors.append('invalid runtime manifest: '+str(exc))
for p in ROOT.rglob('*'):
    if p.is_file() and p.name.lower() in {'vb.exe','electron.exe','chrome_elf.dll','resources.pak','snapshot_blob.bin','v8_context_snapshot.bin','default_app.asar','node.exe','msedgewebview2.exe'}:
        errors.append('external browser-engine payload present: '+p.relative_to(ROOT).as_posix())
cs=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
vecs=(ROOT/'host/Vec1Substrate.cs').read_text(encoding='utf-8')
for marker in ['namespace VBJA21','class Ja21Vm','BrowserWindow : Window','public sealed class ContextDrawerWindow','SpringScalar','DfMediumNative','DfMediumDocumentSurface','dfweb_feed_document','dfweb_scene_get','MediaElement','BitmapImage']:
    if marker not in cs: errors.append('presenter source missing marker '+marker)
# 8.1.0 hardening. Each marker is a specific defect that was fixed; its absence is a regression.
for marker in ['JaAddressPolicy','JaAddressText','JaResourceBudget','DfMediumNative.EngineGate','BeginOutputReadLine','public static string Contained(','public static string RequireSha256(','JaMirrorNetworkClient.Configure','class BrowserVersion']:
    if marker not in cs: errors.append('8.1.0 hardening marker missing '+marker)
for marker in ['lock(typeof(DfMediumNative))','p.StandardOutput.ReadToEnd()','SecurityProtocol=ServicePointManager.SecurityProtocol|','media.Play();media.Pause();']:
    if marker in cs: errors.append('regressed 8.0.x construct present '+marker)
# 8.1.0 design system: the chrome must be built from tokens, not scattered literals.
for marker in ['class Ja21Design','class Ja21Motion','class BezierEase','BuildCommandRail','BuildAddressCapsule','BuildTabRail','BuildLoadSweep','PositionUnderline','private Border Disclosure']:
    if marker not in cs: errors.append('8.1.0 design-system marker missing '+marker)
# 9.8.7 Optical Instrument architecture: full-bleed composition surface + in-window chrome.
for marker in ['DesignSystemVersion = "2.8.0"','DeviceHairline(Visual visual)','BuildCommandPalette(','_omniPopup = new Popup();','renderer selection automatic','AttachOverlay(','ZPalette','MonitorBounds(this)','_overlayRoot.Background = null;']:
    if marker not in cs: errors.append('9.8.7 optical-instrument marker missing '+marker)
if 'ContextDrawerWindow : Window' in cs: errors.append('9.8.7 contextual drawer regressed to a top-level Window')
# 8.1.1 compile repair: ContextDrawerWindow is not a BrowserWindow subclass, so calls to
# BrowserWindow helper methods must be qualified. An unqualified Brush(...) binds to the WPF
# System.Windows.Media.Brush type and makes Add-Type fail with CS0119/"type used like variable".
drawer_start=cs.find('public sealed class ContextDrawerWindow')
drawer_end=cs.find('internal sealed class JaMirrorFetchResult')
if drawer_start<0 or drawer_end<=drawer_start:
    errors.append('ContextDrawerWindow source range could not be located')
else:
    drawer=cs[drawer_start:drawer_end]
    if re.search(r'(?<![\w.])Brush\s*\(', drawer): errors.append('unqualified Brush(...) call remains in ContextDrawerWindow')
    if 'BrowserWindow.Brush(' not in drawer: errors.append('ContextDrawerWindow is not using the qualified BrowserWindow.Brush helper')
# Runtime release metadata must be tied to the executable presenter.
if 'Runtime integrity seal version does not match this presenter build.' not in cs:
    errors.append('runtime seal/presenter version consistency check is missing')

for marker in ('shellGrid.Height = 48','shellGrid.MaxWidth = 940','capsule.CornerRadius = new CornerRadius(18)','Floating URL and search bar','island.VerticalAlignment = VerticalAlignment.Bottom;','Compatibility marker: Copilot button.'):
    if marker not in cs: errors.append('9.8.7 floating URL/search instrument marker missing '+marker)
for marker in ('_omniBar = shellGrid','_omniPopup = new Popup();','_omniPopup.Placement = PlacementMode.RelativePoint;','_omniPopup.Child = shellGrid','NativeGlass.CursorIn(this)','OnOmniGripMouseDown','OnOmniGripMouseMove','OnOmniGripMouseUp','Ctrl+Shift+L','Recenter floating omni bar'):
    if marker not in cs: errors.append('9.8.7 movable omni-bar marker missing '+marker)
# 9.8.7 omni draft hardening: live navigation callbacks may call SyncChrome but must never
# write the TextBox directly, and an empty dirty draft must remain first-class state.
live_start=cs.find('t.LiveWeb.NavigationCommitted+=delegate')
live_end=cs.find('t.LiveWeb.StatusChanged+=delegate',live_start)
if live_start<0 or live_end<=live_start:
    errors.append('9.8.7 live navigation callback range missing')
else:
    live_block=cs[live_start:live_end]
    if '_address.Text' in live_block: errors.append('9.8.7 live navigation callback writes omni text directly')
    if 'SyncChrome();' not in live_block: errors.append('9.8.7 live navigation callback bypasses guarded SyncChrome')
for marker in ('BeginOmniEditSession()','EndOmniEditSession(bool preserveCurrentText)','HasProtectedOmniDraft(BrowserTab t)','_omniDraftText = "";','This includes an intentionally empty string'):
    if marker not in cs: errors.append('9.8.7 draft-state marker missing '+marker)
if '(_omniUserEditing || _omniEditDirty || _address.IsKeyboardFocusWithin)' not in cs:
    errors.append('9.8.7 Add-Type warning-as-error regression: _omniUserEditing is assigned but not consumed by the omni draft guard')

portable_source=(ROOT/'host/PortableDesktop.cs').read_text(encoding='utf-8')
for marker in ('class PortableUiState','state\\\\ui','omni-bar.position','TryLoadOmniBarPlacement','SaveOmniBarPlacement'):
    if marker not in portable_source: errors.append('9.8.7 portable omni-state marker missing '+marker)


# 9.8.7 full-range/edit/collapse contract.
for marker in ('double inset = 0.0;','_address.SelectionBrush = Brush("#D00078D4")','_address.SelectionOpacity = 1.0','ToggleOmniCollapsed()','_omniBar.Width = 30; _omniBar.Height = 30;','HasProtectedOmniDraft(t)','_omniEditDirty','_omniDraftText','_clearAddressButton = GlyphButton("×", "Clear omni text", 12)'):
    if marker not in cs: errors.append('9.8.7 omni interaction marker missing '+marker)


# 9.8.7 landing-page compile regression gate.
if re.search(r'\bToggleCommandPalette\s*\(\s*\)\s*;', cs):
    errors.append('9.8.7 landing compile regression: ToggleCommandPalette requires bool? force')
if 'Dispatch("new_private"' in cs:
    errors.append('9.8.7 landing action regression: unsupported new_private event')

# 9.8.7 native text-free landing visual gate.
for marker in ('LandingRibbon(','LandingHairline(','LandingPane(','Geometry.Parse','Viewbox viewport','Canvas scene','Glass floor and reflected color wash'):
    if marker not in cs: errors.append('9.8.7 native landing visual marker missing '+marker)
show_home=cs[cs.find('private void ShowHome'):cs.find('private BrowserTab FindTab')]
for forbidden in ('BitmapImage','landing-windows-pixel-smoke','TextBlock headline','TextBlock body'):
    if forbidden in show_home: errors.append('9.8.7 native landing regressed to raster/text marker '+forbidden)
for forbidden in ('A wispy, smoky Windows-color home field','Use the floating omni search box to search','JA21 · Windows Spectrum Landing Field'):
    if forbidden in cs[cs.find('private void ShowHome'):cs.find('private BrowserTab FindTab')]: errors.append('9.8.7 descriptive landing copy remains '+forbidden)

# 9.8.7 modern-web integration: explicit bridge, automatic DF_Medium fallback and true full-bleed omni mode.
for rel in ['host/LiveWebContracts.cs','host/LiveWebBridge.cs','host/LiveWebBridgeStub.cs','host/Ensure-WebView2Bridge.ps1','host/Import-WebView2Adapter.ps1','host/Install-WebView2Bridge.ps1','Install Live Web Bridge.cmd']:
    if not (ROOT/rel).is_file(): errors.append('9.8.7 live-web component missing '+rel)
for marker in ['ILiveWebSurface LiveWeb','NavigateLive(','PreferLiveWeb&&LiveWebAvailable()','LiveWebFactory.IsAvailable','full-bleed content']:
    if marker not in cs: errors.append('9.8.7 integration marker missing '+marker)
bridge=(ROOT/'host/LiveWebBridge.cs').read_text(encoding='utf-8')
for marker in ['Microsoft.Web.WebView2.Wpf','WebView2CompositionControl','CoreWebView2Environment.GetAvailableBrowserVersionString','PermissionRequested','NewWindowRequested','ContainsFullScreenElementChanged','ClearBrowsingDataAsync']:
    if marker not in bridge: errors.append('live-web bridge missing '+marker)
loader=(ROOT/'host/Import-WebView2Adapter.ps1').read_text(encoding='utf-8-sig')
for marker in ['AssemblyName]::GetAssemblyName','Assembly]::LoadFrom($Core)','Assembly]::LoadFrom($Wpf)','Microsoft.Web.WebView2.Core','Microsoft.Web.WebView2.Wpf','WebView2Loader.dll','RuntimeReady']:
    if marker not in loader: errors.append('9.8.7 WebView2 managed-loader marker missing '+marker)
start=(ROOT/'host/Start-JA21Browser.ps1').read_text(encoding='utf-8-sig')
for marker in ['Import-WebView2Adapter.ps1','$liveLoaded = & $liveLoader -Adapter $live -Quiet','if($liveLoaded.Ready)']:
    if marker not in start: errors.append('9.8.7 startup managed-loader marker missing '+marker)
if start.find('$liveLoaded = & $liveLoader -Adapter $live -Quiet') > start.find('Add-Type -TypeDefinition $code'):
    errors.append('9.8.7 startup loads WebView2 after Add-Type instead of before it')

# VEC1 presenter: present, and structurally unable to claim a fabric verdict.
for marker in ['class VecSubstrate','class VecCanonical','class VecLedger','records_fabric_verdict','PRESENTATION_FAILED','CANONICAL_VECTORS.json']:
    if marker not in vecs: errors.append('VEC1 presenter missing marker '+marker)
if 'EXECUTION_VERIFIED' in vecs: errors.append('VEC1 presenter must never write an EXECUTION_VERIFIED event')
if re.search(r'(?<!System\.IO\.)(?<!\.)\bPath\.',vecs): errors.append('unqualified Path. token in Vec1Substrate.cs')
# VEC1 substrate tree.
for rel in ['substrate/vec1/vecctl.py','substrate/vec1/core.py','substrate/vec1/binding.py','substrate/vec1/presenter.py','substrate/config/vec1.json','substrate/config/CONFIG_SEAL.json','substrate/NODES.json','substrate/DF_Fabric/adapter/dfabric/cli.py','substrate/evidence/presenter/CANONICAL_VECTORS.json','substrate/tests/test_presenter_format.py']:
    if not (ROOT/rel).is_file(): errors.append('VEC1 substrate component missing '+rel)
try:
    binding=json.loads((ROOT/'substrate/NODES.json').read_text(encoding='utf-8'))['nodes']
    for nid in ['N_SMALL','N_MEDIUM','N_LARGE','N_XLARGE']:
        rec=binding.get(nid)
        if rec is None: errors.append('VEC node binding missing '+nid); continue
        if rec.get('container'):
            vm=ROOT/rec['container']/'vm'/rec['vm_dirname']
            if not vm.is_dir(): errors.append('VEC node '+nid+' declares an absent container '+rec['container'])
        else: errors.append('9.8.7 requires all four VEC node containers to be vendored: '+nid)
    seal=json.loads((ROOT/'substrate/config/CONFIG_SEAL.json').read_text(encoding='utf-8'))
    cfg=json.loads((ROOT/'substrate/config/vec1.json').read_text(encoding='utf-8'))
    canon=hashlib.sha256(json.dumps(cfg,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode('utf-8')).hexdigest()
    if seal.get('configuration_sha256')!=canon: errors.append('substrate CONFIG_SEAL is stale; run tools/vec_seal.py')
    if cfg.get('network_policy')!='deny': errors.append('substrate config network_policy is not deny')
    if cfg.get('presenter',{}).get('records_fabric_verdict'): errors.append('substrate config would let the presenter record a fabric verdict')
    if not cfg.get('strict_four_node_execution'): errors.append('substrate config relaxed strict four-node execution')
except Exception as ex:
    errors.append('substrate configuration could not be validated: '+str(ex))
for marker in ['JaDomNode','JaMirrorHtml','JaMirrorCss','JaMirrorDocumentSurface','WindowsFormsHost','Forms.WebBrowser','System.Windows.Forms.Integration']:
    if marker in cs: errors.append('prohibited old renderer marker '+marker)
if re.search(r'(?<!System\.IO\.)\bPath\.',cs): errors.append('unqualified Path. token can collide with System.Windows.Shapes.Path')
for prop in re.findall(r'public\s+UInt32\s+(\w+)\{get;private set;\}',cs):
    if re.search(r'\b(?:out|ref)\s+'+re.escape(prop)+r'\b',cs): errors.append('C# auto-property passed by ref/out: '+prop)
# Native/managed string ABI: C returns character count on success, not zero.
# The 8.0.2 blank-surface repair (a non-negative return means success) survives in the
# 8.1.0 growing-buffer read; the legacy '==0' bug must stay absent.
for marker in ['int n=dfweb_string_get(id,b,(UInt32)cap);', 'if(n<0)return "";', 'int n=dfweb_title_get(b,(UInt32)cap);', 'InteropSelfTest()', 'Marshal.SizeOf(typeof(DfWebSceneItem))!=44', 'Marshal.SizeOf(typeof(DfWebResourceItem))!=8']:
    if marker not in cs: errors.append('blank-surface interop repair missing '+marker)
if 'dfweb_string_get(id,b,(UInt32)b.Capacity)==0?b.ToString():""' in cs: errors.append('legacy blank-surface string ABI bug present')
loaded=cs[cs.find('Loaded += delegate'):cs.find('LocationChanged += delegate')]
if loaded and loaded.find('Dispatch("new_tab"')>loaded.find('new ContextDrawerWindow'): errors.append('optional drawer is initialized before first tab')
# Conservative C# brace/string/character-literal check.
level=0; in_str=False; esc=False; verb=False; in_char=False; char_esc=False; i=0
while i<len(cs):
    c=cs[i]
    if in_char:
        if char_esc: char_esc=False
        elif c=='\\': char_esc=True
        elif c=="'": in_char=False
        i+=1; continue
    if in_str:
        if verb:
            if c=='"' and i+1<len(cs) and cs[i+1]=='"': i+=2; continue
            if c=='"': in_str=False; verb=False
        else:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c=='"': in_str=False
        i+=1; continue
    if c=="'": in_char=True; i+=1; continue
    if c=='@' and i+1<len(cs) and cs[i+1]=='"': in_str=True; verb=True; i+=2; continue
    if c=='"': in_str=True; verb=False; i+=1; continue
    if c=='/' and i+1<len(cs) and cs[i+1]=='/':
        j=cs.find('\n',i+2); i=len(cs) if j<0 else j+1; continue
    if c=='/' and i+1<len(cs) and cs[i+1]=='*':
        j=cs.find('*/',i+2); i=len(cs) if j<0 else j+2; continue
    if c=='{': level+=1
    elif c=='}': level-=1
    if level<0: errors.append('C# brace underflow'); break
    i+=1
if in_str or in_char: errors.append('C# unterminated literal')
if level!=0: errors.append('C# brace imbalance '+str(level))
# JA21 source/IR identity.
for src,ir,label in [('source/browser.ja','engine/ja21/browser.ir.json','browser'),('source/renderer.ja','engine/ja21/renderer.ir.json','renderer'),('source/web_engine.ja','engine/ja21/web_engine.ir.json','web_engine')]:
    unit=json.loads((ROOT/ir).read_text(encoding='utf-8'))
    if h(ROOT/src)!=unit.get('sourceHash'): errors.append(label+' source/IR mismatch')
profile=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'))
if profile.get('version')!='9.8.7': errors.append('engine profile version is not 9.8.7')
if profile.get('vec1_substrate',{}).get('presenter_records_fabric_verdict'): errors.append('engine profile claims the presenter records a fabric verdict')
for k in ['electron','bundled_chromium','mshtml','node_runtime_required']:
    if profile.get(k): errors.append('profile enables prohibited dependency '+k)
if not profile.get('webview2'): errors.append('9.8.7 profile does not enable the explicit live-web bridge')
if not profile.get('edge_chromium'): errors.append('9.8.7 profile does not truthfully identify WebView2 Edge runtime')
omni=profile.get('omni_experience',{})
for key in ['full_bleed_content_plane','overlay_chrome','webview2_composition_control','inline_context_drawer','command_palette_ctrl_k','renderer_selection_automatic','popup_omni_surface','omni_page_independent','home_surface_unboxed','device_pixel_hairline_service','root_escape_focus_recovery','permanent_chrome_reduced','movable_floating_omni_bar','omni_drag_grip','omni_position_persisted_portable_workspace','omni_position_normalized','omni_recenter_shortcut_ctrl_shift_l','omni_synchronous_focus_reclaim','omni_dispatcher_focus_verification','omni_first_keystroke_recovery','omni_backspace_delete_recovery','omni_page_click_releases_typing_ownership']:
    if not omni.get(key): errors.append('9.8.7 profile missing optical-experience flag '+key)
if profile.get('live_web',{}).get('wpf_host')!='Microsoft.Web.WebView2.Wpf.WebView2CompositionControl':
    errors.append('9.8.7 live_web profile does not name WebView2CompositionControl')
# One-to-one master-series application ledger.
trace=ROOT/'evidence/OPTICAL-INSTRUMENT-WORKITEM-TRACEABILITY-9.0.0.jsonl'
summary_path=ROOT/'evidence/OPTICAL-INSTRUMENT-APPLICATION-SUMMARY-9.0.0.json'
if not trace.is_file() or not summary_path.is_file():
    errors.append('9.8.7 master-series traceability evidence is missing')
else:
    tids=[]; disp={}
    with trace.open(encoding='utf-8') as tf:
        for line in tf:
            rec=json.loads(line); tids.append(rec['work_item_id']); disp[rec['disposition']]=disp.get(rec['disposition'],0)+1
    summ=json.loads(summary_path.read_text(encoding='utf-8'))
    if len(tids)!=12500 or len(set(tids))!=12500 or tids[:1]!=['1.01.01'] or tids[-1:]!=['20.25.25']:
        errors.append('9.8.7 master-series traceability ID/count mismatch')
    if disp!=summ.get('dispositions'): errors.append('9.8.7 master-series disposition summary mismatch')
    if disp.get('PENDING_TARGET_QUALIFICATION')!=500: errors.append('9.8.7 closeout claim discipline is not preserved')

# DF_Medium provenance + source-bound native image.
prov=json.loads((ROOT/'engine/df_medium/ENGINE_PROVENANCE.json').read_text(encoding='utf-8'))
if h(ROOT/'engine/df_medium/DF_Medium.source.zip')!=prov['source_archive_sha256']: errors.append('DF_Medium source archive mismatch')
dll=ROOT/'engine/df_medium/native/win-x64/dfmedium-ja21-web.dll'
if h(dll)!=prov['windows_dll_sha256']: errors.append('DF_Medium Windows DLL mismatch')
if h(ROOT/'source/web_engine.ja')!=prov['ja21_web_engine_source_sha256']: errors.append('JA21 web profile provenance mismatch')
b=dll.read_bytes()
if not b.startswith(b'MZ') or b'PE\x00\x00' not in b[:4096]: errors.append('native engine is not PE32+ family')
for marker in [b'dfweb_selftest',b'dfweb_profile_hash_get',prov['ja21_web_engine_source_sha256'].encode('ascii')]:
    if marker not in b: errors.append('native engine binary missing bound marker '+repr(marker[:24]))
eng=(ROOT/'engine/df_medium/source/ja21_webengine.c').read_text(encoding='utf-8')
for marker in ['br_device_invoke','br_core_configure','br_core_set_device','DFWEB_SCENE_IMAGE','DFWEB_SCENE_VIDEO','DFWEB_RES_CSS']:
    if marker not in eng: errors.append('DF_Medium engine source missing '+marker)

# 9.8.7 joined-C# compile repair: the browser compilation unit imports both System.IO
# and System.Windows.Shapes. Any bare Path.* therefore becomes CS0104 ambiguous.
joined_sources = [
    ROOT/'host/JA21VirtualBrowser.cs', ROOT/'host/Vec1Substrate.cs', ROOT/'host/PortableDesktop.cs',
    ROOT/'host/LiveWebContracts.cs', ROOT/'host/LiveWebBridge.cs', ROOT/'host/LiveWebBridgeStub.cs'
]
for jp in joined_sources:
    jt = jp.read_text(encoding='utf-8')
    if re.search(r'(?<![A-Za-z0-9_.])Path\.', jt):
        errors.append('9.8.7 joined-C# source contains unqualified Path.* ambiguity: '+jp.name)


# 9.8.7 post-navigation omni keyboard-focus recovery.
for marker in ['FocusManager.SetIsFocusScope(shellGrid, true);','ClaimOmniKeyboardFocus(false);','QueueOmniKeyboardFocusRecovery(false);','PreviewTextInput += OnPreviewTextInput;','ReplaceOmniSelection(e.Text);','DeleteOmniText(e.Key == Key.Back);','_surface.PreviewMouseLeftButtonDown += delegate']:
    if marker not in cs: errors.append('9.8.7 omni focus-recovery marker missing '+marker)
if 'Keyboard.Focus(_address) == _address' in cs:
    errors.append('9.8.7 Add-Type warning-as-error risk: cross-type Keyboard.Focus reference comparison is present')

# 9.8.7 Add-Type warning-as-error hygiene. Windows PowerShell rejects compiler warnings,
# so a private underscore field that appears only at its declaration is a release blocker.
for jp in joined_sources:
    jt=jp.read_text(encoding='utf-8')
    for fm in re.finditer(r'(?m)^\s*private\s+(?:readonly\s+)?(?:static\s+)?[A-Za-z_][A-Za-z0-9_\.<>\[\],?]*\s+(?P<name>_[A-Za-z][A-Za-z0-9_]*)\s*(?:=|;)',jt):
        name=fm.group('name')
        if len(re.findall(r'\b'+re.escape(name)+r'\b',jt)) < 2:
            errors.append('9.8.7 joined-C# warning-as-error risk: declaration-only private field '+jp.name+':'+name)
verify_ps=(ROOT/'host/Verify-JA21Browser.ps1').read_text(encoding='utf-8-sig')
if 'Get-Content -LiteralPath $portableSource' in verify_ps:
    errors.append('9.8.7 verifier path/content collision: portable source text is reused as a filesystem path')
if '$portableAudit = $portableSource' not in verify_ps:
    errors.append('9.8.7 verifier source-audit marker missing')
for marker in ['logs\\boot-latest.log','Write-JA21BootStage','presenter-compile-begin','presenter-compile-complete','presenter-run-begin','trap {']:
    if marker not in start: errors.append('9.8.7 boot diagnostic marker missing '+marker)
launcher=(ROOT/'Start JA21 Portable Desktop.cmd').read_text(encoding='utf-8')
if 'set /p JA21_VERSION=<"%~dp0VERSION"' not in launcher or 'echo JA21 Portable Desktop %JA21_VERSION%' not in launcher:
    errors.append('9.8.7 portable launcher banner is not sourced from top-level VERSION')
if re.search(r'(?im)^echo\s+JA21 Portable Desktop\s+9\.1\.[0-9]+\s*$',launcher):
    errors.append('9.8.7 portable launcher contains a hard-coded release banner')
if 'type "%JA21_PORTABLE_ROOT%\\logs\\boot-latest.log"' not in launcher:
    errors.append('9.8.7 portable launcher does not surface boot-latest.log on failure')

# 9.8.7 portable desktop contract.
portable=(ROOT/'host/PortableDesktop.cs').read_text(encoding='utf-8')
placement=json.loads((ROOT/'substrate/config/ja21_portable_placement.json').read_text(encoding='utf-8'))
policy=json.loads((ROOT/'engine/ja21/portable.runtime.json').read_text(encoding='utf-8'))
for marker in ['class PortablePaths','class PortableFabric','HOST_MEDIATED_PLACEMENT_ONLY','fabric_verdict\\":null']:
    if marker not in portable: errors.append('9.8.7 portable marker missing '+marker)
active_runtime='\n'.join([cs,vecs,bridge,start,portable])
if 'SpecialFolder.LocalApplicationData' in active_runtime: errors.append('9.8.7 active host code still contains a LocalApplicationData fallback')
if profile.get('portable_desktop',{}).get('workspace_root')!='workspace/': errors.append('9.8.7 portable workspace profile mismatch')
for node,service in [('N_SMALL','boot.guard'),('N_MEDIUM','native.render'),('N_LARGE','live.web'),('N_XLARGE','workspace.state')]:
    if service not in placement.get('nodes',{}).get(node,{}).get('ja21_services',[]): errors.append('9.8.7 node placement mismatch '+node+' '+service)
if placement.get('transport',{}).get('network')!='deny': errors.append('9.8.7 portable fabric network policy is not deny')
if policy.get('workspace')!='workspace/': errors.append('9.8.7 portable runtime policy workspace mismatch')


if errors:
    print('VERIFY FAIL'); print('\n'.join('- '+x for x in errors)); sys.exit(1)
print('Package integrity PASS:',len(manifest['files']),'sealed files')
print('DF_Medium boundary PASS: old C#/WPF document parser absent')
print('JA21 source/IR PASS: browser + renderer + web_engine')
print('DF_Medium native provenance PASS:',prov['source_archive_sha256'])
print('Native JA21 profile binding PASS:',prov['ja21_web_engine_source_sha256'])
print('Electron/Node bundled-engine absence PASS; WebView2 live-web bridge is explicit')
print('8.1.0 hardening markers PASS')
print('8.1.1 presenter compile regression gate PASS')
print('9.8.7 live-web composition + CLR managed-loader markers PASS')
print('9.8.7 Windows path/case-collision preflight PASS')
print('VEC1 electron substrate PASS: presenter cannot record a fabric verdict')
print('9.0.0 Optical Instrument master-series traceability PASS: 12,500 IDs preserved')
print('9.8.7 portable desktop/AppData-redirection + DF-tier placement contract PASS')
print('9.8.7 movable floating omni bar + normalized portable placement state PASS')
print('9.8.7 boot-stage diagnostics + Add-Type warning-risk gate PASS')
unvendored=[n for n,r in binding.items() if not r.get('container')]
if unvendored: print('VEC node integration FAIL:',', '.join(sorted(unvendored))); sys.exit(1)
else: print('VEC node binding PASS: all four DF node containers vendored')
if '--skip-tests' not in sys.argv:
    env=dict(os.environ); env['PYTHONDONTWRITEBYTECODE']='1'
    r=subprocess.run([sys.executable,'-B','-m','unittest','discover','-s','tests','-v'],cwd=str(ROOT),env=env)
    if r.returncode!=0: sys.exit(r.returncode)
print()
# test_vec1_integration already executes the substrate control-plane suite once.
sys.exit(0)
