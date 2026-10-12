"""Build the existing JA21 host as a normal x64 .NET Framework application."""
from pathlib import Path
import hashlib, json, subprocess
root=Path(__file__).resolve().parents[1]
framework=Path(r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319")
references=[framework/name for name in ['System.dll','System.Core.dll','System.Xaml.dll','System.Web.Extensions.dll']]
references += [framework/'WPF'/name for name in ['PresentationFramework.dll','PresentationCore.dll','WindowsBase.dll']]
references += [root/'runtime/webview2-sdk/1.0.4191.47'/name for name in ['Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.Wpf.dll']]
for reference in references:
    if not reference.is_file():raise FileNotFoundError(reference)
sources=[root/'host'/name for name in ['JA21VirtualBrowser.cs','Vec1Substrate.cs','PortableDesktop.cs','LiveWebContracts.cs','LiveWebBridge.cs','GFMConsoleEntry.cs','GFMConsoleLiveVerification.cs']]
output=root/'GfmJa21.exe'
command=[str(framework/'csc.exe'),'/nologo','/target:winexe','/platform:x64','/optimize+','/main:VBJA21.GFMConsoleEntry','/out:'+str(output),'/win32icon:'+str(root/'assets/vb.ico')]+['/reference:'+str(item) for item in references]+[str(item) for item in sources]
result=subprocess.run(command,cwd=root,capture_output=True,text=True)
work=root/'workspace/build';work.mkdir(parents=True,exist_ok=True)
(work/'native-build.txt').write_text(result.stdout+result.stderr,encoding='utf-8')
receipt={'schema':'GFM-JA21-native-build/1','compiler':str(framework/'csc.exe'),'exitCode':result.returncode,'fullHostUnits':len(sources),'references':[str(item) for item in references],'windowsPolicyChanged':False,'output':str(output) if output.is_file() else None}
if output.is_file():receipt.update(bytes=output.stat().st_size,sha256=hashlib.sha256(output.read_bytes()).hexdigest())
(work/'native-build.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
print(result.stdout+result.stderr)
print(json.dumps(receipt))
raise SystemExit(result.returncode)
