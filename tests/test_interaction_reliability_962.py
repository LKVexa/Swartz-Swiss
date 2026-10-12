from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
class InteractionReliability962(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
    def test_omni_edit_session_blocks_page_url_repopulation(self):
        for marker in ('private bool _omniUserEditing;','_omniUserEditing = true;','_omniUserEditing = false;','(_omniUserEditing || _omniEditDirty || _address.IsKeyboardFocusWithin)'):
            self.assertIn(marker,HOST)
    def test_drag_uses_full_owner_window_coordinate_space(self):
        self.assertIn('_omniPopup.PlacementTarget = this;',HOST)
        self.assertIn('_omniPopup.Placement = PlacementMode.RelativePoint;',HOST)
        self.assertIn('ActualWidth - width - (inset * 2)',HOST)
        self.assertNotIn('_overlayRoot.ActualWidth - width - (inset * 2)',HOST)
if __name__=='__main__':unittest.main()
