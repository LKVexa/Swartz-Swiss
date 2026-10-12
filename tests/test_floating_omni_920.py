from pathlib import Path
import json, re, unittest
ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
PROFILE=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'))
class FloatingOmni920Tests(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('public const string Full = "9.8.7";',HOST)
        self.assertIn('DesignSystemVersion = "2.8.0"',HOST)
    def test_floating_url_pill_contract(self):
        for marker in (
            'shellGrid.Height = 48', 'shellGrid.MaxWidth = 940',
            'capsule.CornerRadius = new CornerRadius(18)',
            '_omniPopup = new Popup();', 'Floating URL and search bar',
            'Search the web or enter address', 'bottom control island', 'Compatibility marker: Copilot button.'):
            self.assertIn(marker,HOST)
    def test_command_carrier_is_not_one_large_toolbar(self):
        method=HOST[HOST.index('private void BuildCommandRail'):HOST.index('private void BuildAddressCapsule')]
        self.assertIn('island.VerticalAlignment = VerticalAlignment.Bottom;',method)
        self.assertIn('Border island = new Border(); _commandBand = island;',method)
        self.assertIn('bottom control island',method)
        self.assertNotIn('host.Background = Brush(Ja21Design.Glass3)',method)
    def test_single_line_address_surface(self):
        method=HOST[HOST.index('private void BuildAddressCapsule'):HOST.index('private void BuildTabRail')]
        self.assertIn('Grid inputHost',method)
        self.assertNotIn('StackPanel textStack',method)
        self.assertIn('_predict.IsHitTestVisible = false',method)
    def test_profile_declares_new_xd(self):
        omni=PROFILE['omni_experience']
        for key in ('floating_url_search_bar','single_line_address_surface','peripheral_control_clusters','copilot_button'):
            self.assertTrue(omni[key])
if __name__=='__main__': unittest.main()
