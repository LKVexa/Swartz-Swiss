from pathlib import Path
import json, unittest
ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
PROFILE=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'))

class OmniInteraction971Tests(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('public const string Full = "9.8.7";',HOST)
    def test_full_client_drag_domain(self):
        self.assertGreaterEqual(HOST.count('double inset = 0.0;'),2)
        self.assertIn('ActualWidth - width',HOST)
        self.assertIn('ActualHeight - height',HOST)
        self.assertIn('PlacementMode.RelativePoint',HOST)
        self.assertTrue(PROFILE['omni_experience']['omni_full_client_drag_domain'])
        self.assertTrue(PROFILE['omni_experience']['omni_zero_inset_drag_bounds'])
    def test_highlighted_selection(self):
        self.assertIn('_address.SelectionBrush = Brush("#D00078D4")',HOST)
        self.assertIn('_address.SelectionOpacity = 1.0',HOST)
        self.assertIn('_address.SelectAll()',HOST)
        self.assertTrue(PROFILE['omni_experience']['selection_highlight_windows_blue'])
    def test_live_navigation_cannot_overwrite_edit(self):
        self.assertIn('BeginOmniEditSession()',HOST)
        self.assertIn('HasProtectedOmniDraft(t)',HOST)
        self.assertIn('_omniEditDirty',HOST)
        self.assertIn('_omniDraftText',HOST)
        self.assertTrue(PROFILE['omni_experience']['omni_edit_survives_live_navigation'])
    def test_double_click_collapse_contract(self):
        self.assertIn('ToggleOmniCollapsed()',HOST)
        self.assertIn('if (e.ClickCount >= 2) { ToggleOmniCollapsed();',HOST)
        self.assertIn('_omniBar.Width = 30; _omniBar.Height = 30;',HOST)
        self.assertIn('_omniShell.Width = 30; _omniShell.Height = 30;',HOST)
        self.assertIn('_omniCollapsed = !_omniCollapsed;',HOST)
        self.assertIn('Ctrl+Shift+L',HOST)
        self.assertTrue(PROFILE['omni_experience']['omni_double_click_collapse'])
        self.assertEqual(PROFILE['omni_experience']['omni_collapsed_size_dip'],30)

if __name__=='__main__': unittest.main()
