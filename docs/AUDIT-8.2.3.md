# JA21 8.2.3 audit — WebView2 CLR binding + installer shortcut repair

## Trigger
JA21 printed `Live web: WebView2 adapter 1.0.4191.47 + installed runtime` and then failed at `Program.Run` with `FileNotFoundException` for `Microsoft.Web.WebView2.Core, Version=1.0.4191.47`. The application window never appeared. The independently repaired 8.2.2 installation also had no Desktop/Start-menu icon because shortcut creation was absent from the installer.

## Root cause
The launcher passed `Microsoft.Web.WebView2.Core.dll` and `Microsoft.Web.WebView2.Wpf.dll` to `Add-Type -ReferencedAssemblies`. That is sufficient for C# compilation, but it is not a runtime assembly-binding contract. The emitted presenter assembly held strong-name references to the WebView2 managed assemblies; when `Program.Run` first touched the Live Web types, the CLR's normal probing path did not include the mutable adapter directory. `PATH` helps native `WebView2Loader.dll` lookup but does not by itself bind strong-named managed DLL references.

## Repair
`host/Import-WebView2Adapter.ps1` now validates the adapter root, Core/WPF assembly names and exact pinned version, prepends the adapter directory for native loader discovery, explicitly loads Core and then WPF with `System.Reflection.Assembly.LoadFrom`, and returns managed/runtime readiness separately. Startup uses the real Live Web bridge only after this managed load succeeds. A load failure compiles the stub bridge and opens Native DF_Medium mode instead of aborting startup.

`Verify-JA21Browser.ps1` executes the same loader boundary before compiling the real bridge. `Install Live Web Bridge.cmd` now delegates to a bridge installer/check script that proves provisioning plus CLR loadability.

## Installer integration
The Windows-safe installer incorporates the prior shortcut repair after transactional payload promotion. It creates current-user Desktop and Start Menu shortcuts plus an install-root shortcut, all targeting `Start JA21 Virtual Browser.cmd` and using `assets\vb.ico`.

## Claim boundary
The Linux validation environment can verify source logic, manifests, packaging, regression tests and Windows filename constraints. Actual WPF, COM shortcut creation, Microsoft WebView2 Runtime discovery and live video behavior remain target-Windows qualification items.
