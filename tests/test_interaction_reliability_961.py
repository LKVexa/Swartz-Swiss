from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
BRIDGE=(ROOT/'host/LiveWebBridge.cs').read_text(encoding='utf-8')
class InteractionReliability961(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
    def test_drag_uses_global_pointer_frame_polling(self):
        for marker in ('GetAsyncKeyState','LeftButtonDown()','CompositionTarget.Rendering += OnOmniDragFrame','NativeGlass.CursorIn(this)','FinishOmniDrag'):
            self.assertIn(marker,HOST)
        self.assertNotIn('element.CaptureMouse();',HOST[HOST.index('private void OnOmniGripMouseDown'):HOST.index('private void BuildTabRail')])
    def test_live_site_does_not_overwrite_active_address_edit(self):
        sync=HOST[HOST.index('private void SyncChrome()'):HOST.index('private void SyncTrust()',HOST.index('private void SyncChrome()'))]
        guard=HOST[HOST.index('private bool HasProtectedOmniDraft'):HOST.index('private void UpdateClearAddressButton',HOST.index('private bool HasProtectedOmniDraft'))]
        self.assertIn('HasProtectedOmniDraft(t)',sync)
        self.assertIn('(_omniUserEditing || _omniEditDirty || _address.IsKeyboardFocusWithin)',guard)
        self.assertIn('_address.PreviewMouseLeftButtonDown',HOST)
        self.assertIn('Keyboard.Focus(_address)',HOST)
    def test_video_cursor_guard_only_overrides_cursor_none(self):
        self.assertIn("getComputedStyle(n).cursor==='none'",BRIDGE)
        self.assertIn("AddScriptToExecuteOnDocumentCreatedAsync(cursorGuard)",BRIDGE)
        self.assertNotIn("cursor='none'",BRIDGE)
if __name__=='__main__': unittest.main()
