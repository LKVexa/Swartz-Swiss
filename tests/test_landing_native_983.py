from pathlib import Path
import json, unittest
ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
PROFILE=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'))
class LandingNative983Tests(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('public const string Full = "9.8.7";',HOST)
    def test_home_is_native_geometry_not_raster(self):
        method=HOST[HOST.index('private void ShowHome'):HOST.index('private BrowserTab FindTab')]
        for marker in ('Viewbox viewport','Canvas scene','LandingRibbon(','LandingHairline(','LandingPane(','Geometry.Parse','Stretch.UniformToFill','Glass floor and reflected color wash'):
            self.assertIn(marker,HOST if marker in ('LandingRibbon(','LandingHairline(','LandingPane(','Geometry.Parse') else method)
        for forbidden in ('BitmapImage','landingAsset','landing-windows-pixel-smoke','TextBlock headline','TextBlock body','Label("JA21'):
            self.assertNotIn(forbidden,method)
    def test_windows_spectrum_is_hardcoded(self):
        method=HOST[HOST.index('private void ShowHome'):HOST.index('private BrowserTab FindTab')]
        for color in ('#900078D4','#7000B7C3','#60107C10','#70FFB900','#00F25022'):
            self.assertIn(color,method)
    def test_profile(self):
        omni=PROFILE['omni_experience']
        self.assertTrue(omni['landing_text_free'])
        self.assertTrue(omni['landing_native_geometry'])
        self.assertTrue(omni['landing_windows_panes'])
        self.assertTrue(omni['landing_reflective_floor'])
        self.assertIsNone(omni['landing_raster_asset'])
        self.assertEqual(omni['landing_visual_mode'],'native-wpf-hardcoded-windows-spectrum-ribbons')
if __name__=='__main__': unittest.main()
