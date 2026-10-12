import hashlib,json,re,subprocess,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
class EngineTests(unittest.TestCase):
    def test_profile(self):
        p=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'));self.assertEqual(p['version'],'9.8.7');self.assertEqual(p['product'],'JA21 Portable Optical Instrument Desktop');self.assertIn('DF_Medium',p['application_engine'])
        for k in ['electron','bundled_chromium','mshtml','chromium','node_runtime_required']:self.assertFalse(p[k])
        self.assertTrue(p['webview2']);self.assertTrue(p['edge_chromium']);self.assertEqual(p['live_web']['sdk_adapter_version'],'1.0.4191.47')
    def test_ja21_source_ir_identity(self):
        for s,i in [('source/browser.ja','engine/ja21/browser.ir.json'),('source/renderer.ja','engine/ja21/renderer.ir.json'),('source/web_engine.ja','engine/ja21/web_engine.ir.json')]:self.assertEqual(sha(ROOT/s),json.loads((ROOT/i).read_text(encoding='utf-8'))['sourceHash'])
    def test_dfmedium_source_binding(self):
        p=json.loads((ROOT/'engine/df_medium/ENGINE_PROVENANCE.json').read_text(encoding='utf-8'));self.assertEqual(sha(ROOT/'engine/df_medium/DF_Medium.source.zip'),p['source_archive_sha256']);self.assertEqual(p['baseline_verify'],'20 passed / 0 failed / 0 skipped')
    def test_native_dll_binding(self):
        p=json.loads((ROOT/'engine/df_medium/ENGINE_PROVENANCE.json').read_text(encoding='utf-8'));b=(ROOT/'engine/df_medium/native/win-x64/dfmedium-ja21-web.dll').read_bytes();self.assertTrue(b.startswith(b'MZ'));self.assertIn(b'PE\0\0',b[:4096]);self.assertEqual(hashlib.sha256(b).hexdigest(),p['windows_dll_sha256']);self.assertIn(p['ja21_web_engine_source_sha256'].encode(),b)
    def test_native_exports(self):
        b=(ROOT/'engine/df_medium/native/win-x64/dfmedium-ja21-web.dll').read_bytes()
        for x in [b'dfweb_init',b'dfweb_begin',b'dfweb_feed_document',b'dfweb_add_stylesheet',b'dfweb_commit',b'dfweb_scene_get',b'dfweb_resource_get',b'dfweb_selftest',b'dfweb_profile_hash_get']:self.assertIn(x,b)
    def test_vm_device_path(self):
        s=(ROOT/'engine/df_medium/source/ja21_webengine.c').read_text(encoding='utf-8')
        for x in ['br_device_invoke','br_core_configure','br_core_set_device','BR_DWEB_TRANSPORT','DFWEB_SCENE_IMAGE','DFWEB_SCENE_VIDEO','DFWEB_RES_CSS']:self.assertIn(x,s)
    def test_old_host_renderer_removed(self):
        s=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
        for x in ['JaDomNode','JaMirrorHtml','JaMirrorCss','JaMirrorDocumentSurface','Forms.WebBrowser','Microsoft.Web.WebView2']:self.assertNotIn(x,s)
    def test_presenter_only_markers(self):
        s=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
        for x in ['DfMediumNative','DfMediumDocumentSurface','dfweb_feed_document','dfweb_scene_get','BitmapImage','MediaElement']:self.assertIn(x,s)
    def test_media_resources(self):
        h=(ROOT/'engine/df_medium/source/ja21_webengine.h').read_text(encoding='utf-8');self.assertIn('DFWEB_SCENE_IMAGE=3',h);self.assertIn('DFWEB_SCENE_VIDEO=4',h);self.assertIn('DFWEB_RES_VIDEO=3',h)
    def test_luxury_omni_shell(self):
        s=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
        for x in ['WindowStyle.None','RadialGradientBrush','CornerRadius','BezierEase','SpringScalar','TextRenderingMode.ClearType','SnapsToDevicePixels','ContextDrawerWindow']:self.assertIn(x,s)
    def test_search_is_scriptless(self):
        s=(ROOT/'source/browser.ja').read_text(encoding='utf-8');self.assertIn('https://html.duckduckgo.com/html/?q=',s)
    def test_web_profile_media_policy(self):
        s=(ROOT/'source/web_engine.ja').read_text(encoding='utf-8');self.assertIn('image: true',s);self.assertIn('video: true',s);self.assertIn('script: false',s)
    def test_no_unqualified_io_path(self):
        s=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8');self.assertIsNone(re.search(r'(?<!System\.IO\.)\bPath\.',s))
    def test_wpf_dependency_closure(self):
        s=(ROOT/'host/Wpf-CompileReferences.ps1').read_text(encoding='utf-8');self.assertIn('WindowsBase',s);self.assertIn('System.Xaml',s);self.assertNotIn('System.Windows.Forms',s)
    def test_no_external_engine_payload_names(self):
        bad={'electron.exe','chrome_elf.dll','msedgewebview2.exe','resources.pak','snapshot_blob.bin','v8_context_snapshot.bin','node.exe'};found={p.name.lower() for p in ROOT.rglob('*') if p.is_file()};self.assertFalse(bad & found)
    def test_no_out_ref_auto_properties(self):
        s=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
        props=re.findall(r'public\s+UInt32\s+(\w+)\{get;private set;\}',s)
        self.assertIn('NodeCount',props)
        for name in props:
            self.assertNotRegex(s,rf'\b(?:out|ref)\s+{re.escape(name)}\b',msg=f'auto-property {name} cannot be passed by ref/out')
    def test_corpus_lock(self): self.assertEqual(json.loads((ROOT/'engine/ja21/corpus.lock.json').read_text(encoding='utf-8'))['suite_count'],20)
if __name__=='__main__':unittest.main()
