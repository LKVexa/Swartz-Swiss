import hashlib,json,unittest,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
class T(unittest.TestCase):
 def test_engine(self):
  p=json.loads((R/'engine/ja21/profile.json').read_text(encoding='utf-8')); self.assertEqual(p['version'],'9.8.7'); self.assertIn('DF_Medium',p['application_engine']); self.assertFalse(p['chromium']); self.assertFalse(p['electron']); self.assertTrue(p['webview2']); self.assertTrue(p['edge_chromium']); self.assertFalse(p['mshtml'])
 def test_native(self):
  b=(R/'engine/df_medium/native/win-x64/dfmedium-ja21-web.dll').read_bytes(); self.assertTrue(b.startswith(b'MZ')); self.assertIn(b'PE\x00\x00',b); self.assertIn(b'dfweb_selftest',b)
 def test_boundary(self):
  c=(R/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8');
  [self.assertNotIn(x,c) for x in ['JaDomNode','JaMirrorHtml','JaMirrorCss','JaMirrorDocumentSurface','Forms.WebBrowser','Microsoft.Web.WebView2']]; [self.assertIn(x,c) for x in ['DfMediumDocumentSurface','dfweb_feed_document','dfweb_scene_get','MediaElement','BitmapImage']]
 def test_vm(self):
  c=(R/'engine/df_medium/source/ja21_webengine.c').read_text(encoding='utf-8'); [self.assertIn(x,c) for x in ['br_device_invoke','br_core_configure','br_core_set_device','DFWEB_SCENE_IMAGE','DFWEB_SCENE_VIDEO']]
 def test_source_binding(self):
  p=json.loads((R/'engine/df_medium/ENGINE_PROVENANCE.json').read_text(encoding='utf-8')); self.assertEqual(hashlib.sha256((R/'engine/df_medium/DF_Medium.source.zip').read_bytes()).hexdigest(),p['source_archive_sha256']); self.assertEqual(hashlib.sha256((R/'engine/df_medium/native/win-x64/dfmedium-ja21-web.dll').read_bytes()).hexdigest(),p['windows_dll_sha256'])

 def test_string_abi_blank_surface_repair(self):
  c=(R/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
  self.assertIn('int n=dfweb_string_get(id,b,(UInt32)cap);',c)
  self.assertIn('int n=dfweb_title_get(b,(UInt32)cap);',c)
  self.assertIn('if(n<0)return "";',c)
  self.assertIn('if(n<cap-1)return Encoding.UTF8.GetString(b,0,n);',c)
  self.assertIn('if(cap>=StrCapMax)throw',c)
  self.assertIn('if(cap>=TitleCapMax)throw',c)
  self.assertIn('[Out] byte[] output',c)
  self.assertIn('InteropSelfTest()',c)
  self.assertIn('Marshal.SizeOf(typeof(DfWebSceneItem))!=44',c)
  self.assertIn('Marshal.SizeOf(typeof(DfWebResourceItem))!=8',c)
  self.assertNotIn('dfweb_string_get(id,b,(UInt32)b.Capacity)==0?b.ToString():""',c)
 def test_startup_home_precedes_optional_drawer(self):
  c=(R/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
  browser_start=c.index('public BrowserWindow(')
  loaded=c[c.index('Loaded += delegate',browser_start):c.index('LocationChanged += delegate',browser_start)]
  self.assertLess(loaded.index('Dispatch("new_tab"'),loaded.index('new ContextDrawerWindow'))
  self.assertIn('if(_tabs.Count==0)CreateTab(Ja21Design.ConsoleMode ? "about:blank" : "vb://new-tab",false)',loaded)

if __name__=='__main__':unittest.main()
