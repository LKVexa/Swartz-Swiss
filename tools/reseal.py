#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,os,tempfile
from package_paths import contained_file, package_files
ROOT=Path(__file__).resolve().parents[1]
def h(p):
    s=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): s.update(b)
    return s.hexdigest()
runtime_paths=[
 'source/browser.ja','source/renderer.ja','source/web_engine.ja','source/browser.jaui','source/browser.jasec','source/browser.jasp','source/browser.jaops','source/browser.jxd',
 'engine/ja21/browser.ir.json','engine/ja21/renderer.ir.json','engine/ja21/web_engine.ir.json','engine/ja21/corpus.lock.json','engine/ja21/profile.json',
 'engine/df_medium/native/win-x64/dfmedium-ja21-web.dll','engine/df_medium/source/brvm.c','engine/df_medium/source/brvm.h','engine/df_medium/source/brtrust.c','engine/df_medium/source/brtrust.h','engine/df_medium/source/ja21_webengine.c','engine/df_medium/source/ja21_webengine.h','engine/df_medium/ENGINE_PROVENANCE.json','engine/df_medium/DF_Medium.source.zip',
 'host/JA21VirtualBrowser.cs','host/Vec1Substrate.cs','host/PortableDesktop.cs','host/LiveWebContracts.cs','host/LiveWebBridge.cs','host/LiveWebBridgeStub.cs','host/Ensure-WebView2Bridge.ps1','host/Import-WebView2Adapter.ps1','host/Start-JA21Browser.ps1','host/Wpf-CompileReferences.ps1',
 'host/Start-Console.ps1','host/Portable-Security.ps1','host/Initialize-PortableWorkspace.ps1','Start Console.cmd','Start Console.vbs',
 'runtime/webview2-sdk/1.0.4191.47/Microsoft.Web.WebView2.Core.dll',
 'runtime/webview2-sdk/1.0.4191.47/Microsoft.Web.WebView2.Wpf.dll',
 'runtime/webview2-sdk/1.0.4191.47/WebView2Loader.dll',
 'runtime/webview2-sdk/1.0.4191.47/PROVISIONED.json',
 # VEC1 substrate: the control plane, its policy and the canonical vectors the presenter
 # checks itself against are all load-bearing at startup, so they are runtime-sealed too.
 'substrate/NODES.json','substrate/config/vec1.json','substrate/config/ja21_portable_placement.json','engine/ja21/portable.runtime.json','host/portable-env.cmd','substrate/config/security_policy.json','substrate/config/CONFIG_SEAL.json',
 'substrate/evidence/presenter/CANONICAL_VECTORS.json',
 'substrate/vec1/__init__.py','substrate/vec1/common.py','substrate/vec1/core.py','substrate/vec1/ledger.py',
 'substrate/vec1/binding.py','substrate/vec1/presenter.py','substrate/vec1/dfbridge.py','substrate/vec1/vecctl.py'
]
gfm_manifest = json.loads((ROOT/'GFM/release-manifest.json').read_text(encoding='utf-8'))
runtime_paths += ['GFM/release-manifest.json', 'Start GFM Console.cmd', 'host/GFMConsoleEntry.cs', 'GfmJa21.exe', 'console.json']
runtime_paths += ['host/GFMConsoleLiveVerification.cs', 'integration/native-view-probe.js']
runtime_paths += ['GFM/'+item['path'] for item in gfm_manifest['files'] if not item['path'].startswith('validation/')]
def atomic_json(path, value):
    fd, name = tempfile.mkstemp(prefix=path.name+'.', suffix='.tmp', dir=path.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8', newline='\n') as stream:
            json.dump(value, stream, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name): os.unlink(name)

version=(ROOT/'VERSION').read_text(encoding='utf-8').strip()
runtime={'format':'vb-ja21-runtime-seal/4','product':'JA21 Portable Optical Instrument Desktop','version':version,'files':[]}
for rel in runtime_paths:
    p=contained_file(ROOT,rel); runtime['files'].append({'path':rel,'bytes':p.stat().st_size,'sha256':h(p)})
atomic_json(ROOT/'engine/ja21/runtime.integrity.json',runtime)
files=[]
for p in package_files(ROOT):
    rel=p.relative_to(ROOT).as_posix()
    # Substrate runtime state is written while the browser runs; sealing it would make the
    # manifest fail the moment a tab is opened. package_files also excludes Git metadata.
    # Its mutable-state rules include rel.startswith('workspace/').
    files.append({'path':rel,'bytes':p.stat().st_size,'sha256':h(p)})
manifest={'format':'vb-ja21-package/5','product':'JA21 Portable Optical Instrument Desktop','version':version,'files':files}
atomic_json(ROOT/'package.integrity.json',manifest)
print('runtime-seal',len(runtime['files']),'package-files',len(files))
