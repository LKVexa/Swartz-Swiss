from pathlib import Path
import json, unittest
ROOT=Path(__file__).resolve().parents[1]
CS=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
START=(ROOT/'host/Start-JA21Browser.ps1').read_text(encoding='utf-8')
LAUNCH=(ROOT/'Start JA21 Portable Desktop.cmd').read_text(encoding='utf-8')
PROFILE=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'))

class BootHardening987Tests(unittest.TestCase):
    def test_release(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('public const string Full = "9.8.7";',CS)

    def test_keyboard_focus_result_is_not_cross_type_compared(self):
        self.assertNotIn('Keyboard.Focus(_address) == _address',CS)
        claim=CS[CS.index('private bool ClaimOmniKeyboardFocus'):CS.index('private void QueueOmniKeyboardFocusRecovery')]
        self.assertIn('Keyboard.Focus(_address);',claim)
        self.assertIn('focused = _address.IsKeyboardFocusWithin || focused;',claim)

    def test_boot_script_persists_stage_markers_and_failure(self):
        for marker in ('logs\\boot-latest.log','Write-JA21BootStage','portable-layout-ready','live-web-provision-begin','presenter-compile-begin','presenter-compile-complete','presenter-run-begin','trap {'):
            self.assertIn(marker,START)
        self.assertIn('-ErrorAction Stop',START)

    def test_launcher_surfaces_boot_log_on_failure(self):
        self.assertIn('type "%JA21_PORTABLE_ROOT%\\logs\\boot-latest.log"',LAUNCH)
        self.assertIn('pause',LAUNCH)

    def test_profile_declares_boot_diagnostics(self):
        pd=PROFILE['portable_desktop']
        self.assertEqual(pd['boot_stage_log'],'workspace/logs/boot-latest.log')
        self.assertTrue(pd['launcher_surfaces_boot_log_on_failure'])
        self.assertTrue(pd['add_type_cross_type_reference_compare_removed'])

if __name__=='__main__': unittest.main()
