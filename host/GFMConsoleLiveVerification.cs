using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows;
using System.Windows.Threading;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;

namespace VBJA21
{
    internal static class GFMConsoleLiveVerification
    {
        public static int Run(string root)
        {
            PortablePaths.EnsureLayout(root);PortableFabric.Configure(root);JaMirrorNetworkClient.Configure(root);DfMediumNative.Boot(root);
            JavaScriptSerializer json=new JavaScriptSerializer();json.MaxJsonLength=Int32.MaxValue;
            Dictionary<string,object> unit=(Dictionary<string,object>)json.DeserializeObject(File.ReadAllText(Path.Combine(root,"engine","ja21","browser.ir.json")));
            Dictionary<string,object> renderer=(Dictionary<string,object>)json.DeserializeObject(File.ReadAllText(Path.Combine(root,"engine","ja21","renderer.ir.json")));
            VecSubstrate vec=new VecSubstrate(root);vec.BeginSession();
            Application app=new Application();app.ShutdownMode=ShutdownMode.OnMainWindowClose;
            BrowserWindow window=new BrowserWindow(root,new Ja21Vm(unit),new Ja21Vm(renderer),new DfSmallHelper(root),vec);
            window.ShowInTaskbar=false;
            string work=RuntimeSeal.Contained(root,"workspace/verification");Directory.CreateDirectory(work);
            string probe=File.ReadAllText(RuntimeSeal.Contained(root,"integration/combined-view-probe.js"));
            Dictionary<string,object> report=null;bool busy=false,injected=false;DateTime started=DateTime.UtcNow;
            Dictionary<string,object> stage=new Dictionary<string,object>();
            DispatcherTimer timer=new DispatcherTimer();timer.Interval=TimeSpan.FromMilliseconds(250);
            timer.Tick+=async delegate
            {
                if(busy)return;busy=true;
                try
                {
                    if((DateTime.UtcNow-started).TotalSeconds>180)throw new Exception("The embedded simulator did not finish its live verification within 180 seconds.");
                    PropertyInfo active=typeof(BrowserWindow).GetProperty("ActiveTab",BindingFlags.Instance|BindingFlags.NonPublic);
                    BrowserTab tab=(BrowserTab)active.GetValue(window,null);
                    stage["tabExists"]=tab!=null;
                    if(tab==null)return;
                    stage["logicalUrl"]=tab.LogicalUrl;stage["liveAttached"]=tab.LiveWeb!=null;stage["nativeMessage"]=NativeText(tab.PageHost,0);
                    if(tab.LiveWeb==null){if(Convert.ToString(stage["nativeMessage"]).Contains("could not"))throw new Exception(Convert.ToString(stage["nativeMessage"]));return;}
                    FrameworkElement view=tab.LiveWeb.View;
                    stage["surfaceReady"]=tab.LiveWeb.Ready;stage["surfaceSource"]=tab.LiveWeb.Source;stage["engineLabel"]=tab.LiveWeb.EngineLabel;
                    stage["viewType"]=view.GetType().FullName;
                    PropertyInfo coreProperty=view.GetType().GetProperty("CoreWebView2");
                    CoreWebView2 core=coreProperty==null?null:coreProperty.GetValue(view,null) as CoreWebView2;
                    if(core==null)return;
                    stage["viewLoaded"]=view.IsLoaded;stage["viewVisible"]=view.IsVisible;stage["viewWidth"]=view.ActualWidth;stage["viewHeight"]=view.ActualHeight;
                    if(!tab.LiveWeb.Ready)return;
                    if(!injected)
                    {
                        string ready=await core.ExecuteScriptAsync("Boolean(window.GFM_CONSOLE && !window.GFM_CONSOLE.initializing)");
                        stage["backendReadyObject"]=ready;stage["browserLocation"]=core.Source;
                        stage["documentText"]=await core.ExecuteScriptAsync("document.body ? document.body.innerText.slice(0,1000) : 'No body'");
                        if(ready!="true")return;
                        await core.ExecuteScriptAsync(probe);injected=true;return;
                    }
                    string encoded=await core.ExecuteScriptAsync("JSON.stringify(window.__gfmConsoleTest || null)");
                    string text=json.Deserialize<string>(encoded);
                    if(text==null || text=="null")return;
                    report=(Dictionary<string,object>)json.DeserializeObject(text);
                    report["schema"]="GFM-JA21-live-verification/1";
                    report["status"]=Convert.ToBoolean(report["ok"])?"passed":"failed";
                    report["nativeWindowCreated"]=true;report["userVisibleWindow"]=true;report["liveRendererExercised"]=true;report["windowsPolicyChanged"]=false;
                    string initial=await core.ExecuteScriptAsync("JSON.stringify(window.__gfmConsoleInitialFrame || null)");
                    File.WriteAllText(RuntimeSeal.Contained(root,"workspace/verification/native-initial-frame.json"),json.Deserialize<string>(initial),Encoding.UTF8);
                    string phase=await core.ExecuteScriptAsync("JSON.stringify(window.__gfmConsolePhaseInitialFrame || null)");
                    File.WriteAllText(RuntimeSeal.Contained(root,"workspace/verification/native-phase-initial-frame.json"),json.Deserialize<string>(phase),Encoding.UTF8);
                    using(FileStream image=File.Create(RuntimeSeal.Contained(root,"workspace/verification/native-live-preview.png")))await core.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png,image);
                    timer.Stop();window.Close();
                }
                catch(Exception ex)
                {
                    report=new Dictionary<string,object>();report["schema"]="GFM-JA21-live-verification/1";report["status"]="failed";report["error"]=ex.GetBaseException().Message;report["liveRendererExercised"]=injected;report["windowsPolicyChanged"]=false;
                    timer.Stop();window.Close();
                }
                finally{busy=false;}
            };
            timer.Start();app.Run(window);timer.Stop();vec.EndSession();
            if(report==null){report=new Dictionary<string,object>();report["status"]="failed";report["error"]="Verification closed before a result was recorded.";}
            report["startupStage"]=stage;
            File.WriteAllText(RuntimeSeal.Contained(root,"workspace/verification/native-live.json"),json.Serialize(report),Encoding.UTF8);
            return Convert.ToString(report["status"])=="passed"?0:1;
        }
        private static string NativeText(DependencyObject node,int depth)
        {
            if(node==null || depth>8)return "";
            System.Windows.Controls.TextBlock text=node as System.Windows.Controls.TextBlock;
            if(text!=null)return text.Text+" ";
            string result="";
            foreach(object child in LogicalTreeHelper.GetChildren(node))
            {
                DependencyObject dependency=child as DependencyObject;
                if(dependency!=null)result+=NativeText(dependency,depth+1);
            }
            return result;
        }
    }
}
