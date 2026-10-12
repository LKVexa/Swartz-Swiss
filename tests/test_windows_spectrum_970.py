from pathlib import Path
import json, unittest
ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
PROFILE=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'))
class WindowsSpectrum970(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('DesignSystemVersion = "2.8.0"',HOST)
    def test_palette_tokens(self):
        for m in ('WindowsBlue','WindowsCyan','WindowsGreen','WindowsGold','WindowsRed','WindowsSpectrum(byte alpha)'):
            self.assertIn(m,HOST)
    def test_spectrum_is_restrained_to_chrome(self):
        for m in ('capsule.BorderBrush = Ja21Design.WindowsSpectrum(104);','_focusRing.BorderBrush = Ja21Design.WindowsSpectrum(224);','_copilotButton.Background = Ja21Design.WindowsSpectrum(255);','island.BorderBrush = Ja21Design.WindowsSpectrum(82);'):
            self.assertIn(m,HOST)
    def test_profile(self):
        o=PROFILE['omni_experience']
        self.assertTrue(o['windows_spectrum_theme'])
        self.assertTrue(o['copilot_style_iridescence_windows_palette'])
        self.assertEqual(o['windows_spectrum_palette'],['#0078D4','#00B7C3','#107C10','#FFB900','#F25022'])
        self.assertTrue(o['neutral_surfaces_preserved'])
if __name__=='__main__': unittest.main()
