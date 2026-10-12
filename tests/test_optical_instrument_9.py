import hashlib
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOST = (ROOT / "host/JA21VirtualBrowser.cs").read_text(encoding="utf-8")
BRIDGE = (ROOT / "host/LiveWebBridge.cs").read_text(encoding="utf-8")
PROFILE = json.loads((ROOT / "engine/ja21/profile.json").read_text(encoding="utf-8"))
JXD = (ROOT / "source/browser.jxd").read_text(encoding="utf-8")
JAUI = (ROOT / "source/browser.jaui").read_text(encoding="utf-8")
SUMMARY = json.loads((ROOT / "evidence/OPTICAL-INSTRUMENT-APPLICATION-SUMMARY-9.0.0.json").read_text(encoding="utf-8"))


class OpticalInstrument900(unittest.TestCase):
    def test_release_version(self):
        self.assertEqual((ROOT / "VERSION").read_text(encoding="utf-8").strip(), "9.8.7")
        self.assertEqual(PROFILE["version"], "9.8.7")
        self.assertIn('public const string Full = "9.8.7";', HOST)
        self.assertIn("JA21 Optical Instrument", HOST)

    def test_design_system_version_and_semantic_tokens(self):
        for marker in (
            'DesignSystemVersion = "2.8.0"',
            "CanvasA", "CanvasB", "AccentSoft", "Glass0", "Glass4",
            "HairSoft", "HairFocus", "InkStrong", "InkMuted",
            "Space2", "Space96", "RadiusPill", "RadiusPanel",
        ):
            self.assertIn(marker, HOST)

    def test_one_accent_family(self):
        self.assertIn('public static string Accent', HOST)
        self.assertNotIn("accent.violet", JXD.lower())
        self.assertNotIn("B8A8FF", HOST)

    def test_light_dark_high_contrast_contract(self):
        self.assertIn("SystemParameters.HighContrast", HOST)
        self.assertIn('Environment.GetEnvironmentVariable("JA21_THEME")', HOST)
        self.assertTrue(PROFILE["omni_experience"]["light_theme"])
        self.assertEqual(PROFILE["omni_experience"]["dark_theme_env_override"], "JA21_THEME=dark")
        self.assertTrue(PROFILE["omni_experience"]["windows_high_contrast"])

    def test_device_pixel_hairline(self):
        self.assertIn("DeviceHairline(Visual visual)", HOST)
        self.assertIn("TransformToDevice", HOST)
        self.assertIn("Ja21Design.DeviceHairline", HOST)
        self.assertTrue(PROFILE["omni_experience"]["device_pixel_hairline_service"])

    def test_optical_plane_z_contract(self):
        values = [int(x) for x in re.findall(r"public const int Z\w+ = (\d+);", HOST)]
        self.assertGreaterEqual(len(values), 7)
        self.assertEqual(values, sorted(values))
        for marker in ("ZAmbient", "ZContent", "ZChrome", "ZFloating", "ZDrawer", "ZPalette", "ZCritical"):
            self.assertIn(marker, HOST)

    def test_content_is_full_bleed_and_chrome_is_overlay(self):
        self.assertIn("_contentFrame.Margin = new Thickness(0);", HOST)
        self.assertIn("_overlayRoot = new Grid();", HOST)
        self.assertIn("_overlayRoot.Background = null;", HOST)
        self.assertIn("Panel.SetZIndex(_overlayRoot, Ja21Design.ZChrome)", HOST)
        self.assertNotIn("_layout.RowDefinitions[0]", HOST)
        self.assertTrue(PROFILE["omni_experience"]["full_bleed_content_plane"])
        self.assertTrue(PROFILE["omni_experience"]["overlay_chrome"])

    def test_live_web_uses_composition_control(self):
        self.assertIn("WebView2CompositionControl", BRIDGE)
        self.assertNotIn("private readonly WebView2 _view;", BRIDGE)
        self.assertTrue(PROFILE["live_web"]["composition_control"])
        self.assertTrue(PROFILE["live_web"]["airspace_safe_overlays"])

    def test_context_drawer_is_in_window_overlay(self):
        start = HOST.index("public sealed class ContextDrawerWindow")
        end = HOST.index("internal sealed class JaMirrorFetchResult", start)
        drawer = HOST[start:end]
        self.assertNotIn(": Window", drawer.splitlines()[0])
        self.assertIn("_owner.AttachOverlay(_shell, Ja21Design.ZDrawer);", drawer)
        self.assertIn("Instrument context", drawer)
        self.assertTrue(PROFILE["omni_experience"]["inline_context_drawer"])

    def test_context_drawer_keeps_qualified_brush_calls(self):
        start = HOST.index("public sealed class ContextDrawerWindow")
        end = HOST.index("internal sealed class JaMirrorFetchResult", start)
        drawer = HOST[start:end]
        self.assertIsNone(re.search(r"(?<![\w.])Brush\s*\(", drawer))
        self.assertIn("BrowserWindow.Brush(", drawer)

    def test_command_palette(self):
        for marker in (
            "BuildCommandPalette(", "ToggleCommandPalette(", "RefreshCommandPalette(",
            "RunPaletteCommand(", 'Key.K', 'renderer selection automatic',
        ):
            self.assertIn(marker, HOST)
        self.assertTrue(PROFILE["omni_experience"]["command_palette_ctrl_k"])
        self.assertIn("component CommandPalette", JAUI)

    def test_renderer_is_automatic_without_visible_selector(self):
        self.assertNotIn("BuildRendererInstrument", HOST)
        self.assertNotIn("_liveModeButton", HOST)
        self.assertNotIn("_nativeModeButton", HOST)
        self.assertNotIn("SetRenderPreference(bool preferLive)", HOST)
        self.assertFalse(PROFILE["omni_experience"]["segmented_renderer_instrument"])
        self.assertTrue(PROFILE["omni_experience"]["renderer_selection_automatic"])
        self.assertFalse(PROFILE["omni_experience"]["renderer_selector_visible"])

    def test_reduced_motion(self):
        self.assertIn('JA21_REDUCED_MOTION', HOST)
        self.assertIn("if (Ja21Design.ReducedMotion) { Snap(target); return; }", HOST)
        self.assertEqual(PROFILE["omni_experience"]["reduced_motion_env_override"], "JA21_REDUCED_MOTION=1")

    def test_motion_has_no_idle_timer(self):
        self.assertNotIn("DispatcherTimer", HOST)
        self.assertIn("CompositionTarget.Rendering", HOST)
        self.assertIn("BezierEase", HOST)

    def test_per_monitor_immersive_bounds(self):
        self.assertIn("MonitorFromWindow", HOST)
        self.assertIn("GetMonitorInfo", HOST)
        self.assertIn("NativeGlass.MonitorBounds(this)", HOST)
        self.assertTrue(PROFILE["omni_experience"]["per_monitor_fullscreen_bounds"])

    def test_root_escape_closes_transients_first(self):
        key = HOST[HOST.index("private void OnPreviewKeyDown"):]
        self.assertLess(key.index("_commandPaletteOpen"), key.index("_immersive && !_siteRequestedImmersive"))
        self.assertLess(key.index("_drawer != null && _drawer.IsOpen"), key.index("_immersive && !_siteRequestedImmersive"))
        self.assertLess(key.index("_omniBinOpen"), key.index("_immersive && !_siteRequestedImmersive"))
        self.assertTrue(PROFILE["omni_experience"]["root_escape_focus_recovery"])

    def test_keyboard_tab_navigation(self):
        self.assertIn("SelectRelativeTab(1)", HOST)
        self.assertIn("SelectRelativeTab(-1)", HOST)
        self.assertIn("Key.Tab", HOST)

    def test_automation_names_are_runtime_code(self):
        self.assertIn("using System.Windows.Automation;", HOST)
        self.assertIn("AutomationProperties.SetName(_address", HOST)
        self.assertIn("AutomationProperties.SetName(_commandPaletteInput", HOST)
        self.assertIn("AutomationProperties.SetName(b, tip)", HOST)

    def test_compact_trust_layer(self):
        self.assertIn('_trust.Text = "◇  " + host + " · " + vecShort', HOST)
        self.assertIn("_trust.ToolTip = detail.ToString();", HOST)
        self.assertTrue(PROFILE["omni_experience"]["compact_trust_pill"])

    def test_declarative_experience_matches_runtime(self):
        for marker in (
            "JA21OpticalInstrument", "OpticalPlaneStack", "FloatingOmniRail",
            "HairlineOmniInput", "AutomaticRendererRouter", "SpatialTabRail",
            "CommandPalette", "ContextualDrawer", "TrustPill",
            "LiveWebSurface", "NativeInspectionSurface",
        ):
            self.assertIn(marker, JXD)

    def test_declarative_interface_matches_runtime(self):
        for marker in (
            "JA21OpticalInstrument", "FloatingOmniRail", "PredictiveOmniInput",
            "AutomaticRendererRouter", "SpatialTabRail", "CommandPalette",
            "ContextDrawer", "TrustPill",
        ):
            self.assertIn(marker, JAUI)

    def test_profile_does_not_reintroduce_electron_or_node(self):
        self.assertFalse(PROFILE["electron"])
        self.assertFalse(PROFILE["node_runtime_required"])
        self.assertFalse(PROFILE["bundled_chromium"])
        self.assertTrue(PROFILE["webview2"])
        self.assertTrue(PROFILE["edge_chromium"])

    def test_master_series_summary(self):
        self.assertEqual(SUMMARY["work_item_count"], 12500)
        self.assertEqual(SUMMARY["id_range"], ["1.01.01", "20.25.25"])
        self.assertEqual(sum(SUMMARY["dispositions"].values()), 12500)
        self.assertRegex(SUMMARY["source_catalog_sha256"], r"^[0-9a-f]{64}$")

    def test_master_series_traceability_is_one_to_one(self):
        trace = ROOT / "evidence/OPTICAL-INSTRUMENT-WORKITEM-TRACEABILITY-9.0.0.jsonl"
        ids = []
        statuses = {}
        with trace.open(encoding="utf-8") as f:
            for line in f:
                r = json.loads(line)
                ids.append(r["work_item_id"])
                statuses[r["disposition"]] = statuses.get(r["disposition"], 0) + 1
        self.assertEqual(len(ids), 12500)
        self.assertEqual(len(set(ids)), 12500)
        self.assertEqual(ids[0], "1.01.01")
        self.assertEqual(ids[-1], "20.25.25")
        self.assertEqual(statuses, SUMMARY["dispositions"])

    def test_closeout_is_not_falsely_claimed(self):
        self.assertEqual(SUMMARY["dispositions"]["PENDING_TARGET_QUALIFICATION"], 500)
        self.assertIn("Windows WPF Add-Type compile", SUMMARY["runtime_qualification_not_claimed"])

    def test_application_docs_present(self):
        for rel in (
            "docs/OPTICAL-INSTRUMENT-9.0.0.md",
            "docs/MASTER-SERIES-APPLICATION-9.0.0.md",
            "docs/PORTABLE-QUALIFICATION-9.8.7.md",
        ):
            self.assertTrue((ROOT / rel).is_file(), rel)

    def test_visual_chrome_is_restrained(self):
        build = HOST[HOST.index("private void BuildCommandRail"):HOST.index("private void BuildAddressCapsule")]
        self.assertIn("bottom control island", build)
        self.assertIn("Back  (Alt+Left)", build)
        self.assertIn("Exit", build)
        self.assertNotIn("Private control tab", build)  # moved behind progressive disclosure
        self.assertTrue(PROFILE["omni_experience"]["permanent_chrome_reduced"])

    def test_status_copy_is_neutral(self):
        self.assertNotIn("Awesome!", HOST)
        self.assertNotIn("Oops!", HOST)
        self.assertNotIn("You're all set", HOST)

    def test_no_blanket_runtime_claim_in_traceability(self):
        text = (ROOT / "docs/MASTER-SERIES-APPLICATION-9.0.0.md").read_text(encoding="utf-8")
        self.assertIn("not a blanket 12,500/12,500 PASS claim", text)


if __name__ == "__main__":
    unittest.main()
