from pathlib import Path
import json, unittest
ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
PROFILE=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'))

class OmniFocus986Tests(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('public const string Full = "9.8.7";',HOST)

    def test_click_reclaims_webview_keyboard_focus_synchronously_and_retries(self):
        click=HOST[HOST.index('_address.PreviewMouseLeftButtonDown'):HOST.index('_address.TextChanged += OnAddressChanged')]
        self.assertIn('ClaimOmniKeyboardFocus(false);',click)
        self.assertIn('QueueOmniKeyboardFocusRecovery(false);',click)
        claim=HOST[HOST.index('private bool ClaimOmniKeyboardFocus'):HOST.index('private void QueueOmniKeyboardFocusRecovery')]
        for marker in ('Activate();','FocusManager.SetFocusedElement(_omniBar, _address)','_address.Focus()','Keyboard.Focus(_address)'):
            self.assertIn(marker,claim)
        queue=HOST[HOST.index('private void QueueOmniKeyboardFocusRecovery'):HOST.index('private void ReplaceOmniSelection')]
        self.assertIn('DispatcherPriority.Input',queue)
        self.assertIn('DispatcherPriority.ContextIdle',queue)

    def test_first_text_key_and_delete_survive_focus_race(self):
        self.assertIn('PreviewTextInput += OnPreviewTextInput;',HOST)
        text=HOST[HOST.index('private void OnPreviewTextInput'):HOST.index('private void OnPreviewKeyDown')]
        self.assertIn('OmniKeyboardRecoveryEligible()',text)
        self.assertIn('ReplaceOmniSelection(e.Text);',text)
        key=HOST[HOST.index('private void OnPreviewKeyDown'):HOST.index('public static class Program')]
        self.assertIn('e.Key == Key.Back || e.Key == Key.Delete',key)
        self.assertIn('DeleteOmniText(e.Key == Key.Back);',key)

    def test_page_click_releases_typing_ownership_without_discarding_dirty_draft(self):
        surf=HOST[HOST.index('_surface.PreviewMouseLeftButtonDown'):HOST.index('_layout.Children.Add(_contentFrame)')]
        self.assertIn('_omniUserEditing = false;',surf)
        self.assertNotIn('_omniEditDirty = false;',surf)
        lost=HOST[HOST.index('_address.LostKeyboardFocus'):HOST.index('TextOptions.SetTextFormattingMode(_address')]
        self.assertIn('_omniUserEditing = false;',lost)
        self.assertIn('!_omniEditDirty',lost)

    def test_focus_scope_and_profile_contract(self):
        self.assertIn('FocusManager.SetIsFocusScope(shellGrid, true);',HOST)
        omni=PROFILE['omni_experience']
        for k in ('omni_synchronous_focus_reclaim','omni_dispatcher_focus_verification','omni_first_keystroke_recovery','omni_backspace_delete_recovery','omni_page_click_releases_typing_ownership'):
            self.assertTrue(omni[k])

if __name__=='__main__': unittest.main()
