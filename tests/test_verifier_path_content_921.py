from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
VERIFY=(ROOT/'host/Verify-JA21Browser.ps1').read_text(encoding='utf-8-sig')
class VerifierPathContent921Tests(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
    def test_portable_source_content_is_not_reused_as_path(self):
        self.assertIn('$portableSource=Get-Content -LiteralPath $portableCs -Raw -Encoding UTF8', VERIFY)
        self.assertIn('$portableAudit = $portableSource', VERIFY)
        self.assertNotIn('Get-Content -LiteralPath $portableSource', VERIFY)
    def test_portable_path_variable_remains_distinct(self):
        self.assertIn("$portableCs=Join-Path $Root 'host\\PortableDesktop.cs'", VERIFY)
        self.assertIn("if(!(Test-Path -LiteralPath $portableCs -PathType Leaf))", VERIFY)
if __name__=='__main__': unittest.main()
