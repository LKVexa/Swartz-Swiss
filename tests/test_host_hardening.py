"""Execute the Windows C# boundary and state code, including both host adapters.

The source assertions supplement executable regressions for browser callback wiring;
the actual Windows probes compile the complete presenter rather than a copied policy.
"""
from __future__ import annotations

import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
HOST = ROOT / "host"
FRAMEWORK = Path(os.environ.get("WINDIR", "C:/Windows")) / "Microsoft.NET/Framework64/v4.0.30319"

PROBE = r'''
namespace VBJA21 {
    internal static class HostHardeningProbe {
        private static void Require(bool value, string what) { if (!value) throw new Exception(what); }
        private static void Refuses(Action action, string what) {
            bool refused = false; try { action(); } catch { refused = true; }
            Require(refused, what);
        }
        public static int Main(string[] args) {
            try {
                string root = args[0]; string sandbox = args[1];
                DfMediumNative.Boot(root);
                string[] privateAddresses = { "127.0.0.1", "10.0.0.2", "169.254.169.254", "100.64.0.1", "198.18.0.1", "::", "::1", "::127.0.0.1", "::ffff:127.0.0.1", "64:ff9b::a00:1", "fc00::1", "fe80::1", "2001:db8::1" };
                foreach(string value in privateAddresses) Require(JaAddressPolicy.IsInternal(System.Net.IPAddress.Parse(value)), "private destination admitted: " + value);
                foreach(string value in new string[] { "8.8.8.8", "1.1.1.1", "2606:4700:4700::1111" }) Require(!JaAddressPolicy.IsInternal(System.Net.IPAddress.Parse(value)), "public address refused: " + value);
                Environment.SetEnvironmentVariable("JA21_ALLOW_PRIVATE_HOSTS", null);
                Environment.SetEnvironmentVariable("JA21_CONSOLE_ORIGINS", null);
                Refuses(delegate { JaAddressPolicy.CheckResolved(new Uri("http://127.0.0.1/")); }, "resolved literal bypassed address policy");
                Refuses(delegate { RuntimeSeal.Contained(root, "C:/Windows/win.ini"); }, "rooted sealed path accepted");
                Refuses(delegate { RuntimeSeal.Contained(root, "../elsewhere"); }, "traversal sealed path accepted");
                if (Directory.Exists(System.IO.Path.Combine(sandbox, "workspace", "linked")))
                    Refuses(delegate { RuntimeSeal.Contained(sandbox, "workspace/linked/secret.txt"); }, "junction escaped lexical package boundary");
                else Console.WriteLine("SKIP: junction regression requires host permission to create a reparse point");
                Require(RuntimeSeal.Contained(root, "host/LiveWebContracts.cs").EndsWith("LiveWebContracts.cs"), "valid package path refused");
                Refuses(delegate { JaAddressPolicy.CheckFile(new Uri("file://server/share/file.html"), root); }, "UNC file admitted");
                Environment.SetEnvironmentVariable("JA21_PORTABLE_ROOT", System.IO.Path.Combine(sandbox, "workspace"));
                Environment.SetEnvironmentVariable("JA21_ALLOW_EXTERNAL_PORTABLE_ROOT", null);
                PortablePaths.EnsureLayout(sandbox);
                string reserved = PortablePaths.UniqueDownloadPath(sandbox, "CON.txt");
                Require(System.IO.Path.GetFileName(reserved) == "_CON.txt" && File.Exists(reserved), "device download name not reserved safely");
                string trimmed = PortablePaths.UniqueDownloadPath(sandbox, "name. ");
                Require(System.IO.Path.GetFileName(trimmed) == "name", "Windows trailing name ambiguity");
                string[] downloads = new string[12];
                System.Threading.Tasks.Parallel.For(0, downloads.Length, delegate(int index) { downloads[index] = PortablePaths.UniqueDownloadPath(sandbox, "same.bin"); });
                Require(new HashSet<string>(downloads, StringComparer.OrdinalIgnoreCase).Count == downloads.Length, "concurrent downloads share an output path");
                foreach(string path in downloads) Require(File.Exists(path), "download path was not reserved atomically");
                string position = PortableUiState.OmniBarPlacementPath(sandbox);
                File.WriteAllText(position, "NaN,Infinity");
                double x, y; Require(!PortableUiState.TryLoadOmniBarPlacement(sandbox, out x, out y), "non-finite UI position admitted");
                PortableUiState.SaveOmniBarPlacement(sandbox, Double.NaN, Double.PositiveInfinity);
                Require(PortableUiState.TryLoadOmniBarPlacement(sandbox, out x, out y) && x == 0.5 && y == 0.5, "non-finite position was persisted");
                string atomic = System.IO.Path.Combine(sandbox, "atomic.txt");
                VecIo.WriteAtomic(atomic, "before"); VecIo.WriteAtomic(atomic, "after");
                Require(File.ReadAllText(atomic) == "after", "atomic state replacement failed");
                Require(Directory.GetFiles(sandbox, "atomic.txt.tmp-*").Length == 0, "atomic writes leaked temporary files");
                PortableFabric.Configure(sandbox); PortableFabric.Record("test", "escape", "tab\tcontrol\u0001");
                string journal = System.IO.Path.Combine(PortablePaths.Evidence(sandbox), "fabric-placement.jsonl");
                JavaScriptSerializer json = new JavaScriptSerializer();
                foreach(string line in File.ReadAllLines(journal)) json.DeserializeObject(line);
                string sub = System.IO.Path.Combine(sandbox, "substrate");
                Directory.CreateDirectory(System.IO.Path.Combine(sub, "config"));
                Directory.CreateDirectory(System.IO.Path.Combine(sub, "evidence", "presenter"));
                foreach(string name in new string[] { "vec1.json", "security_policy.json", "CONFIG_SEAL.json" }) File.Copy(System.IO.Path.Combine(root, "substrate", "config", name), System.IO.Path.Combine(sub, "config", name));
                File.Copy(System.IO.Path.Combine(root, "substrate", "evidence", "presenter", "CANONICAL_VECTORS.json"), System.IO.Path.Combine(sub, "evidence", "presenter", "CANONICAL_VECTORS.json"));
                string cfgPath = System.IO.Path.Combine(sub, "config", "vec1.json");
                Dictionary<string,object> cfg = (Dictionary<string,object>)json.DeserializeObject(File.ReadAllText(cfgPath)); cfg["host_integration"] = "tampered"; File.WriteAllText(cfgPath, json.Serialize(cfg));
                VecSubstrate tampered = new VecSubstrate(sandbox);
                Require(tampered.Verdict == "BLOCKED" && tampered.Detail.Contains("configuration seal"), "tampered configuration was bound");
                File.Copy(System.IO.Path.Combine(root, "substrate", "config", "vec1.json"), cfgPath, true);
                string policyPath = System.IO.Path.Combine(sub, "config", "security_policy.json");
                Dictionary<string,object> policy = (Dictionary<string,object>)json.DeserializeObject(File.ReadAllText(policyPath)); policy["extra"] = "tampered"; File.WriteAllText(policyPath, json.Serialize(policy));
                VecSubstrate tamperedPolicy = new VecSubstrate(sandbox);
                Require(tamperedPolicy.Verdict == "BLOCKED" && tamperedPolicy.Detail.Contains("security-policy seal"), "tampered policy was bound");
                File.Copy(System.IO.Path.Combine(root, "substrate", "config", "security_policy.json"), policyPath, true);
                Dictionary<string,object> nodes = (Dictionary<string,object>)json.DeserializeObject(File.ReadAllText(System.IO.Path.Combine(root, "substrate", "NODES.json")));
                Dictionary<string,object> nodeMap = (Dictionary<string,object>)nodes["nodes"];
                ((Dictionary<string,object>)nodeMap["N_SMALL"])["container"] = "../escaped";
                File.WriteAllText(System.IO.Path.Combine(sub, "NODES.json"), json.Serialize(nodes));
                VecSubstrate tamperedNode = new VecSubstrate(sandbox);
                Require(tamperedNode.Verdict == "BLOCKED" && tamperedNode.Detail.Contains("Unsafe sealed path"), "node container traversal was bound");
                Console.WriteLine("PASS: executable host boundary, concurrent download, finite UI, atomic state, evidence JSON and config-seal regressions");
                return 0;
            } catch(Exception ex) { Console.Error.WriteLine(ex.ToString()); return 1; }
        }
    }
}
'''


def combined_source(adapter: str) -> str:
    imports: list[str] = []
    bodies: list[str] = []
    for name in ("JA21VirtualBrowser.cs", "Vec1Substrate.cs", "PortableDesktop.cs", "LiveWebContracts.cs", adapter):
        lines = []
        for line in (HOST / name).read_text(encoding="utf-8-sig").splitlines():
            if re.match(r"^\s*using\s+(?:static\s+)?[A-Za-z_@][^();{}]*;\s*$", line):
                if line.strip() not in imports:
                    imports.append(line.strip())
            else:
                lines.append(line)
        bodies.append("\n".join(lines))
    return "\n".join(imports + bodies) + PROBE


class HostHardeningTests(unittest.TestCase):
    def test_live_failures_do_not_claim_success(self):
        bridge = (HOST / "LiveWebBridge.cs").read_text(encoding="utf-8")
        self.assertIn("if (e.IsSuccess) EmitNavigation();", bridge)
        self.assertIn("else EmitFailure", bridge)
        self.assertIn("t.LiveWeb.NavigationFailed+=", (HOST / "JA21VirtualBrowser.cs").read_text(encoding="utf-8"))

    def test_live_resources_frames_workers_and_private_profiles_are_guarded(self):
        bridge = (HOST / "LiveWebBridge.cs").read_text(encoding="utf-8")
        for marker in ("FrameNavigationStarting", "WebResourceRequested +=", "CoreWebView2WebResourceRequestSourceKinds.All", "IsInPrivateModeEnabled = isPrivate", "AreHostObjectsAllowed = false", "IsWebMessageEnabled = false", "JaAddressPolicy.CheckResolved(target)"):
            self.assertIn(marker, bridge)
        self.assertNotIn("me.Source=mediaUri", (HOST / "JA21VirtualBrowser.cs").read_text(encoding="utf-8"))
        self.assertIn("PortablePaths.FixedWebView2Root(root)", bridge)
        self.assertIn("String.IsNullOrWhiteSpace(fixedRuntime) ? null : fixedRuntime", bridge)
        self.assertIn("_boundaryUnavailable = true", bridge)
        self.assertIn("Live web popup blocked", bridge)

    @unittest.skipUnless(os.name == "nt" and (FRAMEWORK / "csc.exe").exists(), "requires Windows .NET Framework WPF compiler")
    def test_complete_presenter_compiles_and_executes_boundary_probes(self):
        work = ROOT / "work"
        work.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="host-regression-", dir=work) as folder:
            scratch = Path(folder)
            references = [FRAMEWORK / "WPF/PresentationFramework.dll", FRAMEWORK / "WPF/PresentationCore.dll", FRAMEWORK / "WPF/WindowsBase.dll", FRAMEWORK / "System.Xaml.dll", FRAMEWORK / "System.Web.Extensions.dll"]
            for adapter in ("LiveWebBridgeStub.cs", "LiveWebBridge.cs"):
                source = scratch / (adapter + ".probe.cs")
                output = scratch / (adapter + ".probe.exe")
                source.write_text(combined_source(adapter), encoding="utf-8")
                refs = references.copy()
                if adapter == "LiveWebBridge.cs":
                    sdk = next((ROOT / "runtime/webview2-sdk").glob("*/Microsoft.Web.WebView2.Core.dll"), None)
                    if sdk is None:
                        self.skipTest("WebView2 SDK is unavailable for the live bridge compile gate")
                    refs += [sdk, sdk.parent / "Microsoft.Web.WebView2.Wpf.dll"]
                compile_result = subprocess.run([str(FRAMEWORK / "csc.exe"), "/nologo", "/target:exe", "/main:VBJA21.HostHardeningProbe", "/out:" + str(output), *["/reference:" + str(ref) for ref in refs], str(source)], cwd=ROOT, text=True, capture_output=True, timeout=90)
                self.assertEqual(compile_result.returncode, 0, compile_result.stdout + compile_result.stderr)
                sandbox = scratch / (adapter + ".sandbox")
                sandbox.mkdir()
                outside = sandbox / "outside"
                outside.mkdir()
                (outside / "secret.txt").write_text("outside workspace", encoding="utf-8")
                (sandbox / "workspace").mkdir()
                def ps_literal(path: Path) -> str:
                    return "'" + str(path).replace("'", "''") + "'"
                junction = subprocess.run(["powershell.exe", "-NoLogo", "-NoProfile", "-NonInteractive", "-Command", "$ErrorActionPreference='Stop'; New-Item -ItemType Junction -Path " + ps_literal(sandbox / "workspace/linked") + " -Target " + ps_literal(outside) + " | Out-Null"], cwd=ROOT, text=True, capture_output=True, timeout=20)
                # Some sandboxed Windows hosts deny reparse-point creation. The remaining
                # executable regressions still run and explicitly report this limitation.
                result = subprocess.run([str(output), str(ROOT), str(sandbox)], cwd=ROOT, text=True, capture_output=True, timeout=60)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn("PASS:", result.stdout)


if __name__ == "__main__":
    unittest.main()
