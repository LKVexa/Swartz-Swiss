using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows;

namespace VBJA21
{
    public static class GFMConsoleEntry
    {
        private static string _root;
        [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
        private static extern IntPtr LoadLibraryEx(string file, IntPtr reserved, uint flags);

        [STAThread]
        public static int Main(string[] args)
        {
            bool live = args.Length == 1 && args[0] == "--verify-live";
            bool verify = live || (args.Length == 1 && args[0] == "--verify");
            _root = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
            try
            {
                if(_root.Length>89)throw new Exception("This extraction path is too long for the complete package. Move the whole folder to D:\\Codex\\GFM-Blackhole-Console or another short writable folder.");
                Environment.SetEnvironmentVariable("JA21_CONSOLE_MODE", "1");
                Environment.SetEnvironmentVariable("JA21_REDUCED_MOTION", "1");
                Environment.SetEnvironmentVariable("JA21_ALLOW_PRIVATE_HOSTS", "0");
                Environment.SetEnvironmentVariable("JA21_PORTABLE_ROOT", Path.Combine(_root,"workspace"));
                Environment.SetEnvironmentVariable("JA21_WEB_DATA_ROOT", Path.Combine(_root,"workspace","state","webview2"));
                Environment.SetEnvironmentVariable("JA21_VEC1_STATE_ROOT", Path.Combine(_root,"workspace","state","vec1"));
                Environment.SetEnvironmentVariable("JA21_DOWNLOADS_ROOT", Path.Combine(_root,"workspace","downloads"));
                Environment.SetEnvironmentVariable("JA21_TEMP_ROOT", Path.Combine(_root,"workspace","temp"));
                AppDomain.CurrentDomain.AssemblyResolve += ResolveAdapter;
                RuntimeSeal.Verify(_root);
                PortablePaths.EnsureLayout(_root);
                string sdk = Path.Combine(_root,"runtime","webview2-sdk","1.0.4191.47");
                string loader = RuntimeSeal.Contained(_root,"runtime/webview2-sdk/1.0.4191.47/WebView2Loader.dll");
                if(LoadLibraryEx(loader,IntPtr.Zero,0x00000100 | 0x00001000)==IntPtr.Zero)
                    throw new Win32Exception(Marshal.GetLastWin32Error(),"The pinned WebView2 native loader could not load.");
                LoadCheckedAdapter("Microsoft.Web.WebView2.Core",sdk);
                LoadCheckedAdapter("Microsoft.Web.WebView2.Wpf",sdk);
                JavaScriptSerializer json = new JavaScriptSerializer();
                Dictionary<string,object> config = (Dictionary<string,object>)json.DeserializeObject(File.ReadAllText(Path.Combine(_root,"console.json"),Encoding.UTF8));
                string startUrl = Convert.ToString(config["start_url"]);
                JaAddressPolicy.CheckResolved(new Uri(startUrl));
                Environment.SetEnvironmentVariable("JA21_START_URL",startUrl);
                if(live) return VerifyLive();
                if(verify) return VerifyNative();
                RunHost();
                return 0;
            }
            catch(Exception ex)
            {
                string detail = ex.GetBaseException().Message;
                try
                {
                    string directory = RuntimeSeal.Contained(_root,"workspace/logs");
                    Directory.CreateDirectory(directory);
                    File.WriteAllText(RuntimeSeal.Contained(_root,"workspace/logs/native-startup-error.txt"),ex.ToString(),Encoding.UTF8);
                    if(verify)
                    {
                        string verification = RuntimeSeal.Contained(_root,"workspace/verification");
                        Directory.CreateDirectory(verification);
                        File.WriteAllText(RuntimeSeal.Contained(_root,"workspace/verification/native-console.json"),new JavaScriptSerializer().Serialize(new {schema="GFM-JA21-native-verification/2",status="failed",failure=detail,nativeWindowShown=false,liveRendererExercised=false,windowsPolicyChanged=false}),Encoding.UTF8);
                    }
                }
                catch { }
                Console.Error.WriteLine(detail);
                if(!verify) MessageBox.Show("GFM console could not start.\n\n"+detail+"\n\nDetails: workspace\\logs\\native-startup-error.txt","GFM / JA21 Console",MessageBoxButton.OK,MessageBoxImage.Error);
                return 1;
            }
        }

        private static Assembly ResolveAdapter(object sender, ResolveEventArgs args)
        {
            string name = new AssemblyName(args.Name).Name;
            if(name!="Microsoft.Web.WebView2.Core" && name!="Microsoft.Web.WebView2.Wpf")return null;
            return LoadCheckedAdapter(name,Path.Combine(_root,"runtime","webview2-sdk","1.0.4191.47"));
        }

        private static Assembly LoadCheckedAdapter(string name,string sdk)
        {
            string digest;
            if(name=="Microsoft.Web.WebView2.Core")
                digest="e6f54c8ce208e3797c427d01ad671b47cb25abc85604753d6ec2546d0ffef550";
            else if(name=="Microsoft.Web.WebView2.Wpf")
                digest="6942b85a3388ece45febde5584d2bfc035d84315f2dd5a4a47913f01a0193800";
            else throw new Exception("Only the two pinned WebView2 managed adapters may be loaded.");
            string expected=RuntimeSeal.Contained(_root,"runtime/webview2-sdk/1.0.4191.47/"+name+".dll");
            if(!String.Equals(Path.GetFullPath(Path.Combine(sdk,name+".dll")),expected,StringComparison.OrdinalIgnoreCase))
                throw new Exception("WebView2 adapter path does not match the pinned package.");
            if(!String.Equals(RuntimeSeal.Sha256(File.ReadAllBytes(expected)),digest,StringComparison.Ordinal))
                throw new Exception("Pinned WebView2 adapter SHA-256 verification failed: "+name);
            // GitHub ZIP extraction can retain Internet-zone metadata on these local files.
            // Trust only the exact verified SDK bytes, while retaining the load-from context
            // and file location needed by WPF and the already-pinned native loader.
            Assembly assembly=Assembly.UnsafeLoadFrom(expected);
            if(assembly.GetName().Name!=name || assembly.GetName().Version.ToString()!="1.0.4191.47" || !String.Equals(Path.GetFullPath(assembly.Location),expected,StringComparison.OrdinalIgnoreCase))
                throw new Exception("Loaded WebView2 adapter identity or location does not match the pinned package.");
            return assembly;
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static void RunHost() { Program.Run(_root); }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static int VerifyLive() { return GFMConsoleLiveVerification.Run(_root); }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static int VerifyNative()
        {
            List<object> checks = new List<object>();
            List<object> policies = new List<object>();
            string[] allowed = new string[] {"https://gfm.ja21.invalid/Open%20GFM%20Preview.html","https://gfm.ja21.invalid:443/GFM%20Project.html","https://GFM.JA21.INVALID/docs/GFM-Audit.pdf"};
            string[] denied = new string[] {"http://gfm.ja21.invalid/","https://gfm.ja21.invalid:444/","https://gfm.ja21.invalid.evil.example/","https://user:pass@gfm.ja21.invalid/","https://gfm.ja21.invalid./","https://example.com/","http://127.0.0.1:8788/","http://localhost:8791/","file:///D:/Codex/GFM-JA21/GFM/Open%20GFM%20Preview.html"};
            bool passed=true;
            foreach(string value in allowed)passed=CheckPolicy(policies,value,true) && passed;
            foreach(string value in denied)passed=CheckPolicy(policies,value,false) && passed;
            checks.Add(new {name="Exact virtual application origin",passed=passed});
            checks.Add(new {name="Native and bundled source integrity",passed=true});
            PortablePaths.EnsureLayout(_root);
            PortableFabric.Configure(_root);
            string runtime = LiveWebFactory.RuntimeVersion(_root);
            checks.Add(new {name="Evergreen WebView2 detected",passed=!String.IsNullOrWhiteSpace(runtime),detail=runtime});
            passed=passed && !String.IsNullOrWhiteSpace(runtime);
            DfMediumNative.Boot(_root);
            checks.Add(new {name="Native JA21 engine boot",passed=true});
            JavaScriptSerializer json=new JavaScriptSerializer();json.MaxJsonLength=Int32.MaxValue;
            Dictionary<string,object> unit=(Dictionary<string,object>)json.DeserializeObject(File.ReadAllText(Path.Combine(_root,"engine","ja21","browser.ir.json")));
            Dictionary<string,object> renderer=(Dictionary<string,object>)json.DeserializeObject(File.ReadAllText(Path.Combine(_root,"engine","ja21","renderer.ir.json")));
            VecSubstrate vec = new VecSubstrate(_root);
            try
            {
                vec.BeginSession();
                BrowserWindow window = new BrowserWindow(_root,new Ja21Vm(unit),new Ja21Vm(renderer),new DfSmallHelper(_root),vec);
                bool geometry=window.Width==1280 && window.Height==900 && window.MinWidth==760 && window.MinHeight==600;
                checks.Add(new {name="Native console window geometry",passed=geometry});passed=passed && geometry;
                window.Close();
            }
            finally {vec.EndSession();}
            string work=RuntimeSeal.Contained(_root,"workspace/verification");Directory.CreateDirectory(work);
            File.WriteAllText(RuntimeSeal.Contained(_root,"workspace/verification/native-console.json"),json.Serialize(new {schema="GFM-JA21-native-verification/2",status=passed?"passed":"failed",checks=checks,policyCases=policies,runtime=runtime,nativeWindowShown=false,liveRendererExercised=false,networkRequestsMade=false,windowsPolicyChanged=false}),Encoding.UTF8);
            return passed?0:1;
        }

        private static bool CheckPolicy(List<object> cases,string url,bool expected)
        {
            bool allowed=false;
            try {JaAddressPolicy.CheckResolved(new Uri(url));allowed=true;}catch{}
            bool passed=allowed==expected;
            cases.Add(new {url=url,expected=expected,allowed=allowed,passed=passed});return passed;
        }
    }
}
