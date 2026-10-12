from pathlib import Path
import json, unittest
ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
PROFILE=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'))
class PageIndependentOmni940(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('DesignSystemVersion = "2.8.0"',HOST)
    def test_popup_omni_survives_page_navigation_airspace(self):
        for marker in ('Popup _omniPopup','_omniPopup = new Popup();','PlacementMode.Relative','AllowsTransparency = true','StaysOpen = true','NativeGlass.CursorIn(this)'):
            self.assertIn(marker,HOST)
        self.assertTrue(PROFILE['omni_experience']['popup_omni_surface'])
        self.assertTrue(PROFILE['omni_experience']['omni_page_independent'])
    def test_home_has_no_hard_card_or_duplicate_address_surface(self):
        method=HOST[HOST.index('private void ShowHome'):HOST.index('private BrowserTab FindTab')]
        self.assertNotIn('Border card',method)
        self.assertNotIn('GhostButton(',method)
        self.assertNotIn('TextBox',method)
        self.assertIn('Viewbox viewport',method)
        self.assertIn('Canvas scene',method)
        self.assertTrue(PROFILE['omni_experience']['home_surface_unboxed'])
    def test_renderer_choice_removed_and_routing_automatic(self):
        for marker in ('BuildRendererInstrument','renderer_live','renderer_native','SetRenderPreference(bool preferLive)','Switch renderer to LIVE','Switch renderer to NATIVE'):
            self.assertNotIn(marker,HOST)
        self.assertIn('t.PreferLiveWeb&&LiveWebAvailable()',HOST)
        self.assertTrue(PROFILE['omni_experience']['renderer_selection_automatic'])
        self.assertFalse(PROFILE['omni_experience']['renderer_selector_visible'])
    def test_popup_withdraws_in_immersive(self):
        self.assertIn('if (_omniPopup != null) _omniPopup.IsOpen = false;',HOST)
        self.assertIn('_omniPopup.IsOpen = true; LayoutOmniBarFromNormalized();',HOST)
if __name__=='__main__': unittest.main()
