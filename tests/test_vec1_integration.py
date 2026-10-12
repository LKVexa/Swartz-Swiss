"""Package-level tests for the VEC1 electron substrate + live-web + portable desktop integration (9.8.7).

These run from the browser package root, next to the existing engine tests, and check the
seams the substrate introduces rather than the control plane itself (substrate/tests covers
that). Nothing here needs Windows, .NET or a native toolchain.
"""
from __future__ import annotations
import hashlib, json, re, subprocess, sys, unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SUB = ROOT / 'substrate'
HOST = ROOT / 'host'
NODES = ('N_SMALL', 'N_MEDIUM', 'N_LARGE', 'N_XLARGE')


def canonical_sha256(obj):
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')).hexdigest()


class SubstratePresent(unittest.TestCase):
    def test_control_plane_files_are_installed(self):
        for rel in ('vec1/vecctl.py', 'vec1/core.py', 'vec1/common.py', 'vec1/ledger.py',
                    'vec1/binding.py', 'vec1/presenter.py', 'vec1/dfbridge.py',
                    'config/vec1.json', 'config/security_policy.json', 'config/CONFIG_SEAL.json',
                    'NODES.json', 'DF_Fabric/adapter/dfabric/cli.py',
                    'evidence/presenter/CANONICAL_VECTORS.json'):
            self.assertTrue((SUB / rel).is_file(), 'missing substrate/' + rel)

    def test_presenter_source_is_installed_and_referenced(self):
        self.assertTrue((HOST / 'Vec1Substrate.cs').is_file())
        start = (HOST / 'Start-JA21Browser.ps1').read_text(encoding='utf-8-sig')
        self.assertIn('Vec1Substrate.cs', start)
        verify = (HOST / 'Verify-JA21Browser.ps1').read_text(encoding='utf-8-sig')
        self.assertIn('Vec1Substrate.cs', verify)


class NodeBinding(unittest.TestCase):
    def setUp(self):
        self.binding = json.loads((SUB / 'NODES.json').read_text(encoding='utf-8'))['nodes']

    def test_all_four_nodes_are_accounted_for(self):
        self.assertEqual(sorted(self.binding), sorted(NODES))

    def test_vendored_containers_exist_where_they_are_declared(self):
        for nid in NODES:
            rec = self.binding[nid]
            if not rec.get('container'):
                continue
            vm = ROOT / rec['container'] / 'vm' / rec['vm_dirname']
            self.assertTrue(vm.is_dir(), nid + ' points at a missing container: ' + rec['container'])

    def test_unvendored_nodes_are_declared_honestly(self):
        for nid in NODES:
            rec = self.binding[nid]
            if rec.get('container'):
                self.assertTrue(rec.get('vendored'), nid)
            else:
                self.assertFalse(rec.get('vendored'), nid)
                self.assertTrue(rec.get('drop_in'), nid)

    def test_binding_reuses_the_package_trees_rather_than_duplicating_them(self):
        self.assertEqual(self.binding['N_SMALL']['container'], 'helper/DF_Small')
        self.assertEqual(self.binding['N_MEDIUM']['container'], 'engine/df_medium/baseline')
        self.assertFalse((SUB / 'DF_Small').exists(), 'DF_Small was duplicated into the substrate')
        self.assertFalse((SUB / 'DF_Medium').exists(), 'DF_Medium was duplicated into the substrate')


class ClaimDiscipline(unittest.TestCase):
    """The integration must not let the presenter assert something it did not earn."""

    def test_presenter_never_writes_an_execution_verdict(self):
        src = (HOST / 'Vec1Substrate.cs').read_text(encoding='utf-8')
        self.assertNotIn('EXECUTION_VERIFIED', src)
        self.assertIn('PRESENTATION_FAILED', src)

    def test_config_forbids_the_presenter_recording_a_fabric_verdict(self):
        cfg = json.loads((SUB / 'config/vec1.json').read_text(encoding='utf-8'))
        self.assertFalse(cfg['presenter']['records_fabric_verdict'])
        self.assertTrue(cfg['strict_four_node_execution'])
        self.assertEqual(cfg['network_policy'], 'deny')
        self.assertEqual(cfg['host_integration'], 'JA21 Portable Optical Instrument Desktop 9.8.7')

    def test_engine_profile_states_full_four_node_binding(self):
        prof = json.loads((ROOT / 'engine/ja21/profile.json').read_text(encoding='utf-8'))
        self.assertEqual(prof['version'], '9.8.7')
        vec = prof['vec1_substrate']
        self.assertFalse(vec['presenter_records_fabric_verdict'])
        self.assertEqual(vec['unvendored_nodes'], [])
        self.assertEqual(len(vec['bound_node_containers']), 4)
        self.assertIn('fail-closed', vec['strict_four_node_execution'])

    def test_live_web_is_explicit_without_reintroducing_electron_or_node(self):
        prof = json.loads((ROOT / 'engine/ja21/profile.json').read_text(encoding='utf-8'))
        for k in ('electron', 'bundled_chromium', 'mshtml', 'chromium', 'node_runtime_required'):
            self.assertFalse(prof.get(k), k)
        self.assertTrue(prof['webview2'])
        self.assertTrue(prof['edge_chromium'])
        self.assertEqual(prof['live_web']['sdk_adapter_version'], '1.0.4191.47')


class LiveWebIntegration(unittest.TestCase):
    def test_bridge_contract_and_fallback_are_present(self):
        self.assertTrue((HOST / 'LiveWebContracts.cs').is_file())
        self.assertTrue((HOST / 'LiveWebBridge.cs').is_file())
        self.assertTrue((HOST / 'LiveWebBridgeStub.cs').is_file())
        self.assertTrue((HOST / 'Ensure-WebView2Bridge.ps1').is_file())
        start=(HOST / 'Start-JA21Browser.ps1').read_text(encoding='utf-8-sig')
        self.assertIn('Ensure-WebView2Bridge.ps1', start)
        self.assertIn('LiveWebBridgeStub.cs', start)
        self.assertIn('LiveWebBridge.cs', start)

    def test_bridge_has_modern_web_and_trust_boundaries(self):
        bridge=(HOST / 'LiveWebBridge.cs').read_text(encoding='utf-8')
        for marker in ('Microsoft.Web.WebView2.Wpf','NewWindowRequested','PermissionRequested','ContainsFullScreenElementChanged','ClearBrowsingDataAsync','JA21_ALLOW_WEB_PERMISSIONS','JA21_ENABLE_DEVTOOLS','PortablePaths.LiveWebState(root)','DownloadStarting'):
            self.assertIn(marker, bridge)
        self.assertNotIn('LocalApplicationData', bridge)
        self.assertIsNone(re.search(r'(?<!System\.IO\.)\bPath\.', bridge))

    def test_omni_shell_routes_live_and_native_modes(self):
        cs=(HOST / 'JA21VirtualBrowser.cs').read_text(encoding='utf-8')
        for marker in ('ILiveWebSurface LiveWeb','NavigateLive(','PreferLiveWeb&&LiveWebAvailable()','RenderMode == "LIVE"','FullScreenChanged','full-bleed content'):
            self.assertIn(marker, cs)

    def test_vec_presentation_evidence_names_engine_but_never_claims_fabric(self):
        src=(HOST / 'Vec1Substrate.cs').read_text(encoding='utf-8')
        self.assertIn('presentation_engine', src)
        self.assertIn('fabric_verdict', src)
        self.assertNotIn('EXECUTION_VERIFIED', src)


class ConfigSeal(unittest.TestCase):
    def test_seal_matches_the_live_substrate_config(self):
        seal = json.loads((SUB / 'config/CONFIG_SEAL.json').read_text(encoding='utf-8'))
        cfg = json.loads((SUB / 'config/vec1.json').read_text(encoding='utf-8'))
        pol = json.loads((SUB / 'config/security_policy.json').read_text(encoding='utf-8'))
        self.assertEqual(seal['configuration_sha256'], canonical_sha256(cfg))
        self.assertEqual(seal['security_policy_sha256'], canonical_sha256(pol))

    def test_canonical_vectors_are_self_consistent(self):
        doc = json.loads((SUB / 'evidence/presenter/CANONICAL_VECTORS.json').read_text(encoding='utf-8'))
        self.assertTrue(doc['vectors'])
        for v in doc['vectors']:
            self.assertEqual(json.dumps(v['value'], sort_keys=True, separators=(',', ':'), ensure_ascii=False), v['canonical'])
            self.assertEqual(hashlib.sha256(v['canonical'].encode('utf-8')).hexdigest(), v['sha256'])


class Hardening(unittest.TestCase):
    """Each check below corresponds to a defect the 8.1.0 audit found in the 8.0.3 presenter."""

    def setUp(self):
        self.cs = (HOST / 'JA21VirtualBrowser.cs').read_text(encoding='utf-8')

    def test_address_boundary_is_enforced(self):
        self.assertIn('class JaAddressPolicy', self.cs)
        self.assertIn('CheckResolved', self.cs)
        self.assertIn('169 && b[1] == 254', self.cs)          # link-local / metadata
        self.assertIn('JA21_ALLOW_PRIVATE_HOSTS', self.cs)

    def test_tls_set_is_assigned_not_widened(self):
        self.assertNotIn('SecurityProtocol=ServicePointManager.SecurityProtocol|', self.cs)
        self.assertIn('ServicePointManager.SecurityProtocol = wanted', self.cs)

    def test_subresource_fetching_is_bounded(self):
        self.assertIn('class JaResourceBudget', self.cs)
        self.assertIn('MaxConcurrent', self.cs)
        self.assertIn('MaxTotalBytes', self.cs)

    def test_helper_pipes_are_drained_concurrently(self):
        self.assertNotIn('p.StandardOutput.ReadToEnd()', self.cs)
        self.assertIn('BeginOutputReadLine', self.cs)
        self.assertIn('BeginErrorReadLine', self.cs)

    def test_engine_monitor_is_private(self):
        self.assertNotIn('lock(typeof(DfMediumNative))', self.cs)
        self.assertIn('EngineGate', self.cs)

    def test_seal_paths_are_containment_checked(self):
        self.assertIn('Sealed path escapes the package root', self.cs)

    def test_video_is_not_preloaded(self):
        self.assertNotIn('media.Play();media.Pause();', self.cs)

    def test_address_text_is_sanitised(self):
        self.assertIn('class JaAddressText', self.cs)
        self.assertIn('0x202A', self.cs)   # bidi overrides stripped

    def test_one_version_constant(self):
        self.assertIn('class BrowserVersion', self.cs)
        self.assertNotIn('DF_Medium 8.0.3', self.cs)
        self.assertEqual(len(re.findall(r'public const string Full = "9\.8\.7";', self.cs)), 1)


class DesignSystem(unittest.TestCase):
    """The design brief is implemented as a token system, so it can be audited as one."""

    def setUp(self):
        self.cs = (HOST / 'JA21VirtualBrowser.cs').read_text(encoding='utf-8')

    def test_tokens_and_motion_exist(self):
        for m in ('class Ja21Design', 'class Ja21Motion', 'class BezierEase', 'Glass0', 'HairFocus', 'InkFaint'):
            self.assertIn(m, self.cs)

    def test_components_named_in_the_brief_are_present(self):
        for m in ('BuildAddressCapsule',     # hairline input bar
                  'BubbleButton',            # floating action bubbles
                  'public static Button Pill',  # pill-shaped controls
                  'GhostButton',             # ghost buttons
                  'BuildOmniBinPanel',       # layered panels
                  'ContextDrawerWindow',     # contextual drawers
                  'private Border Disclosure'):  # progressive disclosure
            self.assertIn(m, self.cs)

    def test_motion_is_pixel_snapped_and_causal(self):
        self.assertIn('snapToPixel', self.cs)
        self.assertIn('private void SetLoading', self.cs)      # the only repeating animation, and it is gated

    def test_easing_uses_real_api_names(self):
        """Two defects that only a compiler or this test would catch: the EasingMode enum has
        no member 'In' (it is EaseIn), and KeySpline's spline evaluator is internal to
        PresentationCore, so it can never be called from the presenter assembly."""
        code = code_only(self.cs)
        self.assertIn('EasingMode.EaseIn', code)
        self.assertNotIn('EasingMode.In;', code)
        self.assertNotIn('GetSplineProgress', code)
        self.assertNotIn('KeySpline', code)
        # The curve is solved in-house, so the control points are literal and checkable.
        self.assertIn('new BezierEase(0.22, 1.00, 0.36, 1.00)', self.cs)
        self.assertIn('new BezierEase(0.40, 0.00, 0.20, 1.00)', self.cs)

    def test_no_member_shadows_a_framework_type_it_uses(self):
        """A member named Action would shadow System.Action for the whole class."""
        self.assertNotIn('private Button Action(', code_only(self.cs))
        self.assertIn('private Button DrawerAction(', self.cs)

    def test_context_drawer_qualifies_browser_brush_helper(self):
        """ContextDrawerWindow is not a BrowserWindow subclass. Unqualified Brush(...)
        therefore binds to System.Windows.Media.Brush, a type, and fails Add-Type compilation."""
        start = self.cs.index('public sealed class ContextDrawerWindow')
        end = self.cs.index('internal sealed class JaMirrorFetchResult')
        drawer = code_only(self.cs[start:end])
        self.assertIsNone(re.search(r'(?<![\w.])Brush\s*\(', drawer))
        self.assertIn('BrowserWindow.Brush(', drawer)

    def test_runtime_seal_version_is_bound_to_presenter(self):
        self.assertIn('Runtime integrity seal version does not match this presenter build.', self.cs)


def code_only(src):
    """Strip // and /* */ comments so an 'absent API' check tests code, not the comment that
    explains why the API is absent."""
    src = re.sub(r'/\*.*?\*/', ' ', src, flags=re.S)
    return re.sub(r'//[^\n]*', ' ', src)


USING_DIRECTIVE = re.compile(r'^\s*using\s+(static\s+)?[A-Za-z_@][^();{}]*;\s*$')


def join_compilation_units(sources):
    """Mirror of Join-JA21CompilationUnits in host/Start-JA21Browser.ps1."""
    usings, bodies = [], []
    for src in sources:
        body = []
        for line in src.replace('\r\n', '\n').split('\n'):
            if USING_DIRECTIVE.match(line):
                u = line.strip()
                if u not in usings:
                    usings.append(u)
            else:
                body.append(line)
        bodies.append('\n'.join(body) + '\n')
    return '\n'.join(usings) + '\n\n' + '\n'.join(bodies)


class CompilationUnit(unittest.TestCase):
    """Add-Type receives ONE compilation unit.

    8.1.0 first shipped with the two presenter sources concatenated verbatim, which put the
    second file's using directives after the first file's namespace and failed to compile with
    CS1529. Each file was individually valid, so only a check on the joined text catches it.
    """

    def setUp(self):
        self.host = (HOST / 'JA21VirtualBrowser.cs').read_text(encoding='utf-8')
        self.sub = (HOST / 'Vec1Substrate.cs').read_text(encoding='utf-8')
        self.unit = join_compilation_units([self.host, self.sub])

    @staticmethod
    def _usings_after_namespace(unit):
        ns = unit.find('namespace ')
        if ns < 0:
            return ['no namespace found']
        bad, offset = [], 0
        for line in unit.split('\n'):
            if USING_DIRECTIVE.match(line) and offset > ns:
                bad.append(line.strip())
            offset += len(line) + 1
        return bad

    def test_launchers_hoist_using_directives(self):
        for name in ('Start-JA21Browser.ps1', 'Verify-JA21Browser.ps1'):
            text = (HOST / name).read_text(encoding='utf-8-sig')
            self.assertIn('Join-JA21CompilationUnits', text, name + ' does not hoist using directives')
            self.assertNotIn('$hostSource + [Environment]::NewLine + $substrateSource', text)
            self.assertNotIn('-Raw -Encoding UTF8) + [Environment]::NewLine +', text)

    def test_joined_unit_has_no_using_after_namespace(self):
        self.assertEqual([], self._usings_after_namespace(self.unit))

    def test_naive_concatenation_would_still_fail(self):
        """Keeps this test honest: if the sources ever stop reproducing the defect, the
        guard above is no longer proving anything and we want to know."""
        naive = self.host + '\n' + self.sub
        self.assertTrue(self._usings_after_namespace(naive),
                        'naive concatenation no longer reproduces CS1529; this guard has lost its teeth')

    def test_joined_unit_keeps_both_namespaces_and_entry_points(self):
        self.assertEqual(2, self.unit.count('namespace VBJA21'))
        for marker in ('class Program', 'class VecSubstrate', 'class BrowserWindow', 'class Ja21Design'):
            self.assertIn(marker, self.unit)

    def test_no_using_statement_is_hoisted(self):
        head = self.unit[:self.unit.find('namespace ')]
        for line in head.split('\n'):
            if line.strip().startswith('using'):
                self.assertNotIn('(', line, 'a using statement was hoisted as a directive: ' + line.strip())

    def test_substrate_usings_are_covered_by_the_host(self):
        """Every using the substrate needs is already declared by the host file, so the hoist
        can never introduce an assembly reference the -ReferencedAssemblies list lacks."""
        host_usings = {l.strip() for l in self.host.split('\n') if USING_DIRECTIVE.match(l)}
        sub_usings = {l.strip() for l in self.sub.split('\n') if USING_DIRECTIVE.match(l)}
        self.assertTrue(sub_usings)
        self.assertEqual(set(), sub_usings - host_usings, 'substrate introduces a using the host does not declare')


class SubstrateSuite(unittest.TestCase):
    def test_substrate_control_plane_suite_passes(self):
        r = subprocess.run([sys.executable, '-B', '-m', 'unittest', 'discover', '-s', 'tests'],
                           cwd=str(SUB), capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


if __name__ == '__main__':
    unittest.main()
