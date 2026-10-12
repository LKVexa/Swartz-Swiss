import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class WebView2LoaderRegressionTests(unittest.TestCase):
    def test_startup_loads_managed_adapter_before_add_type(self):
        s = (ROOT / 'host/Start-JA21Browser.ps1').read_text(encoding='utf-8-sig')
        load = s.index('$liveLoaded = & $liveLoader -Adapter $live -Quiet')
        compile_ = s.index('Add-Type -TypeDefinition $code')
        self.assertLess(load, compile_)
        self.assertIn("$bridgeSource = $liveStub", s)
        self.assertIn("if($liveLoaded.Ready)", s)

    def test_loader_binds_core_before_wpf(self):
        s = (ROOT / 'host/Import-WebView2Adapter.ps1').read_text(encoding='utf-8-sig')
        core = s.index('[System.Reflection.Assembly]::LoadFrom($Core)')
        wpf = s.index('[System.Reflection.Assembly]::LoadFrom($Wpf)')
        self.assertLess(core, wpf)
        self.assertIn("Microsoft.Web.WebView2.Core", s)
        self.assertIn("Microsoft.Web.WebView2.Wpf", s)
        self.assertIn("WebView2Loader.dll", s)

    def test_loader_validates_pinned_assembly_version(self):
        s = (ROOT / 'host/Import-WebView2Adapter.ps1').read_text(encoding='utf-8-sig')
        self.assertIn('$CoreIdentity.Version.ToString() -ne $ExpectedVersion', s)
        self.assertIn('$WpfIdentity.Version.ToString() -ne $ExpectedVersion', s)
        self.assertIn('AssemblyName]::GetAssemblyName', s)

    def test_runtime_discovery_is_not_managed_binding_gate(self):
        s = (ROOT / 'host/Import-WebView2Adapter.ps1').read_text(encoding='utf-8-sig')
        self.assertIn('Runtime discovery is diagnostic, not a managed-adapter load gate', s)
        self.assertIn('RuntimeReady', s)
        self.assertIn('Native DF_Medium mode', s)

    def test_explicit_bridge_setup_checks_loadability(self):
        s = (ROOT / 'host/Install-WebView2Bridge.ps1').read_text(encoding='utf-8-sig')
        self.assertIn('Import-WebView2Adapter.ps1', s)
        self.assertIn('could not be loaded', s)


if __name__ == '__main__':
    unittest.main()
