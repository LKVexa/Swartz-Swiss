from pathlib import Path
import json, unittest
ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
PORT=(ROOT/'host/PortableDesktop.cs').read_text(encoding='utf-8')
PROFILE=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'))
POLICY=json.loads((ROOT/'engine/ja21/portable.runtime.json').read_text(encoding='utf-8'))
PLACEMENT=json.loads((ROOT/'substrate/config/ja21_portable_placement.json').read_text(encoding='utf-8'))

class MovableOmni930Tests(unittest.TestCase):
    def test_release_and_design_system(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('DesignSystemVersion = "2.8.0"',HOST)
    def test_omni_is_independent_floating_plane(self):
        method=HOST[HOST.index('private void BuildAddressCapsule'):HOST.index('private void BuildTabRail')]
        self.assertIn('_omniBar = shellGrid',method)
        self.assertIn('_omniPopup = new Popup();',method)
        self.assertIn('_omniPopup.Placement = PlacementMode.RelativePoint;',method)
        self.assertIn('_omniPopup.Child = shellGrid;',method)
        self.assertNotIn('Grid.SetColumn(shellGrid, 1)',method)
    def test_drag_grip_and_zero_reflow_motion(self):
        for marker in ('Move floating omni search box','OnOmniGripMouseDown','OnOmniGripMouseMove','OnOmniGripMouseUp','SetOmniBarPixels','Popup _omniPopup','NativeGlass.CursorIn(this)'):
            self.assertIn(marker,HOST)
        self.assertIn('CompositionTarget.Rendering += OnOmniDragFrame',HOST)
        self.assertIn('NativeGlass.LeftButtonDown()',HOST)
        self.assertIn('FinishOmniDrag',HOST)
    def test_portable_position_persistence(self):
        for marker in ('class PortableUiState','state\\\\ui','omni-bar.position','TryLoadOmniBarPlacement','SaveOmniBarPlacement'):
            self.assertIn(marker,PORT)
        self.assertEqual(POLICY['ui_state']['omni_bar_placement'],'workspace/state/ui/omni-bar.position')
        self.assertIn('portable omni-bar placement state',PLACEMENT['nodes']['N_XLARGE']['browser_parts'])
    def test_recenter_and_normalized_contract(self):
        for marker in ('SnapOmniNorm','_omniNormX = .5; _omniNormY = 0.0','Ctrl+Shift+L','Recenter floating omni bar','recenter_omni'):
            self.assertIn(marker,HOST)
    def test_profile_flags(self):
        omni=PROFILE['omni_experience']
        for key in ('movable_floating_omni_bar','omni_drag_grip','omni_position_persisted_portable_workspace','omni_position_normalized','omni_recenter_shortcut_ctrl_shift_l'):
            self.assertTrue(omni[key])
    def test_immersive_withdraws_movable_bar(self):
        self.assertIn('if (_omniPopup != null) _omniPopup.IsOpen = false;',HOST)
        self.assertIn('_omniPopup.IsOpen = true; LayoutOmniBarFromNormalized();',HOST)
if __name__=='__main__': unittest.main()
