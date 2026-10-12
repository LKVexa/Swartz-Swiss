from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')

class OmniDraft984Tests(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('public const string Full = "9.8.7";',HOST)
    def test_tab_scoped_dirty_draft_state(self):
        for marker in ('_omniEditDirty','_omniEditTabId = -1','_omniDraftText','BeginOmniEditSession','EndOmniEditSession','HasProtectedOmniDraft'):
            self.assertIn(marker,HOST)
    def test_empty_draft_is_protected(self):
        method=HOST[HOST.index('private void SyncChrome()'):HOST.index('private void SyncTrust()',HOST.index('private void SyncChrome()'))]
        self.assertIn('HasProtectedOmniDraft(t)',method)
        self.assertIn('_address.Text = _omniDraftText ?? ""',method)
        self.assertIn('This includes an intentionally empty string',method)
    def test_enter_empty_does_not_resync(self):
        method=HOST[HOST.index('private void OnAddressKeyDown'):HOST.index('private void OnAddressChanged')]
        self.assertIn('String.IsNullOrWhiteSpace(pending)',method)
        self.assertIn('_omniEditDirty = true',method)
        self.assertIn('_omniDraftText = ""',method)
        self.assertNotIn('Dispatch("navigate", pending, 0);\n            }\n            else',method.split('String.IsNullOrWhiteSpace(pending)')[1].split('return;')[0])
    def test_clear_button(self):
        for marker in ('_clearAddressButton = GlyphButton("×", "Clear omni text", 12)','_clearAddressButton.Click += delegate','UpdateClearAddressButton()'):
            self.assertIn(marker,HOST)
    def test_navigation_commit_only_syncs_through_guard(self):
        live=HOST[HOST.index('t.LiveWeb.NavigationCommitted'):HOST.index('t.LiveWeb.StatusChanged')]
        self.assertIn('SyncChrome();',live)
        self.assertNotIn('_address.Text',live)

if __name__=='__main__': unittest.main()
