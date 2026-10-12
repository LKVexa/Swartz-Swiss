from pathlib import Path
import re, unittest

ROOT=Path(__file__).resolve().parents[1]
SOURCES=[ROOT/'host/JA21VirtualBrowser.cs',ROOT/'host/Vec1Substrate.cs',ROOT/'host/PortableDesktop.cs',ROOT/'host/LiveWebContracts.cs',ROOT/'host/LiveWebBridge.cs',ROOT/'host/LiveWebBridgeStub.cs']

class CompileHygiene912Tests(unittest.TestCase):
    def test_release_version(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
    def test_no_declaration_only_private_underscore_fields(self):
        pat=re.compile(r'(?m)^\s*private\s+(?:readonly\s+)?(?:static\s+)?[A-Za-z_][A-Za-z0-9_\.<>\[\],?]*\s+(?P<name>_[A-Za-z][A-Za-z0-9_]*)\s*(?:=|;)')
        offenders=[]
        for p in SOURCES:
            s=p.read_text(encoding='utf-8')
            for m in pat.finditer(s):
                n=m.group('name')
                if len(re.findall(r'\b'+re.escape(n)+r'\b',s)) < 2:
                    offenders.append(f'{p.name}:{n}')
        self.assertEqual(offenders,[])
    def test_omni_user_editing_has_read_side_guard(self):
        s=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
        self.assertIn('(_omniUserEditing || _omniEditDirty || _address.IsKeyboardFocusWithin)',s)

    def test_renderer_selector_state_is_removed(self):
        s=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
        for marker in ('_modeIndicator','_liveModeButton','_nativeModeButton','BuildRendererInstrument','SetRenderPreference(bool preferLive)'):
            self.assertNotIn(marker,s)
    def test_launcher_banner_is_version_driven(self):
        s=(ROOT/'Start JA21 Portable Desktop.cmd').read_text(encoding='utf-8')
        self.assertIn('set /p JA21_VERSION=<"%~dp0VERSION"',s)
        self.assertIn('echo JA21 Portable Desktop %JA21_VERSION%',s)
        self.assertIsNone(re.search(r'(?im)^echo\s+JA21 Portable Desktop\s+9\.1\.[0-9]+\s*$',s))

if __name__=='__main__': unittest.main()
