# Windows-safe packaging 8.2.3

8.2.3 retains the shallow bootstrap + `payload.ja21pkg` transport introduced in 8.2.1 and the complete case/Unicode collision preflight + staged promotion introduced in 8.2.2.

After the staged application tree validates and is promoted, the installer now creates three shortcuts using the packaged `assets\vb.ico`: current-user Desktop, current-user Start Menu under `JA21`, and the install directory. Shortcut creation points to the promoted absolute `Start JA21 Virtual Browser.cmd` path and uses the install root as the working directory.

The browser's mutable WebView2 SDK adapter remains outside the sealed package manifest under `runtime/webview2-sdk/`. 8.2.3 closes the runtime-binding gap by explicitly loading the pinned Core and WPF managed assemblies before the generated presenter assembly can execute Live Web code.
