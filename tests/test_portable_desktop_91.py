from pathlib import Path
import json, os, re, unittest

ROOT=Path(__file__).resolve().parents[1]
HOST=(ROOT/'host/JA21VirtualBrowser.cs').read_text(encoding='utf-8')
PORT=(ROOT/'host/PortableDesktop.cs').read_text(encoding='utf-8')
START=(ROOT/'host/Start-JA21Browser.ps1').read_text(encoding='utf-8-sig')
LIVE=(ROOT/'host/LiveWebBridge.cs').read_text(encoding='utf-8')
VEC=(ROOT/'host/Vec1Substrate.cs').read_text(encoding='utf-8')
PROFILE=json.loads((ROOT/'engine/ja21/profile.json').read_text(encoding='utf-8'))
PLACEMENT=json.loads((ROOT/'substrate/config/ja21_portable_placement.json').read_text(encoding='utf-8'))
POLICY=json.loads((ROOT/'engine/ja21/portable.runtime.json').read_text(encoding='utf-8'))

class PortableDesktop91Tests(unittest.TestCase):
    def test_version(self):
        self.assertEqual((ROOT/'VERSION').read_text(encoding='utf-8').strip(),'9.8.7')
        self.assertIn('public const string Full = "9.8.7";',HOST)
        self.assertEqual(PROFILE['version'],'9.8.7')
    def test_no_active_appdata_fallback_in_host(self):
        active='\n'.join([HOST,PORT,START,LIVE,VEC])
        self.assertNotIn('SpecialFolder.LocalApplicationData',active)
        self.assertNotIn('%LOCALAPPDATA%/VBJA21',active)
        self.assertIn('workspace',active.lower())
    def test_portable_env_redirects_before_runtime(self):
        env=(ROOT/'host/portable-env.cmd').read_text(encoding='utf-8')
        for marker in ('LOCALAPPDATA','APPDATA','TEMP','TMP','HOME','JA21_WEB_DATA_ROOT','JA21_VEC1_STATE_ROOT','JA21_DOWNLOADS_ROOT'):
            self.assertIn(marker,env)
        cmd=(ROOT/'Start JA21 Portable Desktop.cmd').read_text(encoding='utf-8')
        executable = '"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -NoLogo'
        self.assertIn(executable, cmd)
        self.assertLess(cmd.index('portable-env.cmd'),cmd.index(executable))
    def test_webview2_uses_portable_user_data_and_downloads(self):
        self.assertIn('PortablePaths.LiveWebState(root)',LIVE)
        self.assertIn('private readonly string _root;',LIVE)
        self.assertIn('PortablePaths.UniqueDownloadPath(_root, d.ResultFilePath)',LIVE)
        self.assertIn('DownloadStarting',LIVE)
        self.assertEqual(PROFILE['live_web']['user_data'],'workspace/state/webview2/ (no AppData fallback in JA21 code)')
    def test_vec1_uses_portable_state(self):
        self.assertIn('PortablePaths.Vec1State(packageRoot)',VEC)
        core=(ROOT/'substrate/vec1/core.py').read_text(encoding='utf-8')
        self.assertIn('JA21_VEC1_STATE_ROOT',core)
        self.assertEqual(PROFILE['vec1_substrate']['presenter_writes'],'sealed electron state + hash-chained ledgers under workspace/state/vec1/')
    def test_node_placement_matches_technical_suite_tiers(self):
        nodes=PLACEMENT['nodes']
        self.assertIn('boot.guard',nodes['N_SMALL']['ja21_services'])
        self.assertIn('native.render',nodes['N_MEDIUM']['ja21_services'])
        self.assertIn('live.web',nodes['N_LARGE']['ja21_services'])
        self.assertIn('workspace.state',nodes['N_XLARGE']['ja21_services'])
        self.assertEqual(PLACEMENT['transport']['network'],'deny')
        self.assertIn('sealed semantic rows',PLACEMENT['transport']['portable_unit'])
    def test_fabric_receipts_cannot_claim_verdict(self):
        self.assertIn('HOST_MEDIATED_PLACEMENT_ONLY',PORT)
        self.assertIn('\\\"fabric_verdict\\\":null',PORT)
        self.assertIn('No presenter-generated CROSS_NODE_DIFFERENTIAL_AGREEMENT verdict',PLACEMENT['fabric']['non_claims'])
    def test_portable_profile_contract(self):
        p=PROFILE['portable_desktop']
        self.assertTrue(p['enabled']); self.assertTrue(p['run_in_place']); self.assertFalse(p['appdata_write_target'])
        self.assertEqual(p['workspace_root'],'workspace/')
    def test_runtime_policy_has_fixed_webview2_slot(self):
        self.assertIn('fixed_runtime_slot',POLICY['webview2'])
        self.assertIn('Evergreen',POLICY['reproducibility']['fixed_webview2_requirement'])
    def test_package_seal_excludes_workspace(self):
        reseal=(ROOT/'tools/reseal.py').read_text(encoding='utf-8')
        self.assertIn("rel.startswith('workspace/')",reseal)
    def test_download_command_no_longer_opens_user_downloads(self):
        self.assertNotIn('SpecialFolder.UserProfile)+"\\\\Downloads"',HOST)
        self.assertIn('PortablePaths.Downloads(_root)',HOST)

    def test_joined_compile_unit_has_no_unqualified_io_path(self):
        # Start-JA21Browser.ps1 hoists using directives from all C# sources. Because the
        # browser imports System.Windows.Shapes as well as System.IO, bare Path.* becomes
        # ambiguous. PortableDesktop must therefore use System.IO.Path explicitly.
        self.assertIsNone(re.search(r"(?<![A-Za-z0-9_.])Path\.", PORT))
        self.assertIn('System.IO.Path.Combine(packageRoot, "workspace")', PORT)

    def test_portable_docs(self):
        self.assertTrue((ROOT/'docs/PORTABLE-VIRTUAL-DESKTOP-9.8.7.md').is_file())
        self.assertTrue((ROOT/'docs/PORTABLE-QUALIFICATION-9.8.7.md').is_file())

    def test_portable_operator_tools(self):
        self.assertTrue((ROOT/'Verify JA21 Portable Desktop.cmd').is_file())
        self.assertTrue((ROOT/'host/Verify-PortableDesktop.ps1').is_file())
        self.assertTrue((ROOT/'Snapshot JA21 Portable Workspace.cmd').is_file())
        snap=(ROOT/'host/Snapshot-PortableWorkspace.ps1').read_text(encoding='utf-8')
        self.assertIn('JA21/PORTABLE_WORKSPACE_SNAPSHOT/1',snap)
        self.assertIn("@('cache','temp','snapshots')",snap)
        self.assertIn('content_id',snap)

    def test_windows_compile_gate_includes_portable_source(self):
        verify=(ROOT/'host/Verify-JA21Browser.ps1').read_text(encoding='utf-8')
        self.assertIn("host\\PortableDesktop.cs",verify)
        self.assertIn('$portableSource',verify)
        self.assertIn('Join-JA21CompilationUnits @($hostSource, $substrateSource, $portableSource',verify)

if __name__=='__main__': unittest.main()
