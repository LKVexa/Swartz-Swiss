from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
class LandingCompile981Tests(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('public const string Full = "9.8.7";',HOST)
    def test_command_palette_arity(self):
        self.assertNotIn('ToggleCommandPalette();',HOST)
        self.assertIn('ToggleCommandPalette(null);',HOST)
    def test_private_tab_event(self):
        self.assertNotIn('Dispatch("new_private"',HOST)
        self.assertIn('Dispatch("private_tab"',HOST)
if __name__=='__main__': unittest.main()
