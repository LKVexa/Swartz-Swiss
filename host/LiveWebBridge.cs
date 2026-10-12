// JA21 9.8.7 live-web bridge. This is selected only when the Microsoft WebView2 SDK
// adapter has been provisioned. The browser shell, VEC1 lifecycle, policy and evidence
// remain JA21/VEC1; Edge WebView2 is used only as the modern document/media engine.
using System;
using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;

namespace VBJA21
{
    internal static class LiveWebFactory
    {
        public static bool IsAvailable(string root)
        {
            string sdk = PortablePaths.WebView2SdkRoot(root);
            if(!Directory.Exists(sdk) || String.Equals(Environment.GetEnvironmentVariable("JA21_NATIVE_ONLY"), "1", StringComparison.Ordinal)) return false;
            try { RuntimeVersion(root); return true; } catch { return false; }
        }

        public static string AdapterStatus(string root)
        {
            if (!IsAvailable(root)) return "native-only";
            try { return "WebView2 " + RuntimeVersion(root); }
            catch { return "WebView2 runtime unavailable"; }
        }

        public static ILiveWebSurface Create(string root, int tabId, bool isPrivate)
        {
            return new WebView2LiveWebSurface(root, tabId, isPrivate);
        }

        internal static string RuntimeVersion(string root)
        {
            string fixedRuntime = PortablePaths.FixedWebView2Root(root);
            return CoreWebView2Environment.GetAvailableBrowserVersionString(String.IsNullOrWhiteSpace(fixedRuntime) ? null : fixedRuntime);
        }
    }

    internal sealed class WebView2ControlAdapter : IDisposable
    {
        private readonly WebView2 _standard;
        private readonly WebView2CompositionControl _composition;
        private readonly FrameworkElement _element;
        private Uri _pendingSource;
        private bool _stopRequested;
        private bool _disposed;

        public event EventHandler<CoreWebView2InitializationCompletedEventArgs> InitializationCompleted;
        public event EventHandler<CoreWebView2NavigationStartingEventArgs> NavigationStarting;
        public event EventHandler<CoreWebView2NavigationCompletedEventArgs> NavigationCompleted;
        public event Action<Exception> DeferredNavigationFailed;

        public WebView2ControlAdapter(bool consoleMode)
        {
            if (consoleMode)
            {
                _standard = new WebView2(); _element = _standard;
                _standard.CoreWebView2InitializationCompleted += ForwardInitialized;
                _standard.NavigationStarting += ForwardNavigationStarting;
                _standard.NavigationCompleted += ForwardNavigationCompleted;
            }
            else
            {
                _composition = new WebView2CompositionControl(); _element = _composition;
                _composition.CoreWebView2InitializationCompleted += ForwardInitialized;
                _composition.NavigationStarting += ForwardNavigationStarting;
                _composition.NavigationCompleted += ForwardNavigationCompleted;
            }
            _element.Loaded += OnLoaded;
        }

        public FrameworkElement Element { get { return _element; } }
        public string ControlName { get { return _standard != null ? "standard WPF WebView2" : "WPF WebView2 composition"; } }
        public CoreWebView2 Core { get { return _standard != null ? _standard.CoreWebView2 : _composition.CoreWebView2; } }
        public CoreWebView2CreationProperties CreationProperties
        {
            get { return _standard != null ? _standard.CreationProperties : _composition.CreationProperties; }
            set { if (_standard != null) _standard.CreationProperties = value; else _composition.CreationProperties = value; }
        }
        public Uri Source
        {
            get { return _pendingSource ?? (_standard != null ? _standard.Source : _composition.Source); }
            set
            {
                if (_disposed) return;
                _stopRequested = false;
                // A newly added child may not yet have a loaded WPF presentation source.
                // Retain only the latest request until the actual control is loaded.
                if (!_element.IsLoaded) { _pendingSource = value; return; }
                _pendingSource = null; SetSource(value);
            }
        }

        private void SetSource(Uri value) { if (_standard != null) _standard.Source = value; else _composition.Source = value; }
        private void OnLoaded(object sender, RoutedEventArgs e)
        {
            if (_disposed || _stopRequested || _pendingSource == null) return;
            Uri requested = _pendingSource; _pendingSource = null;
            try { SetSource(requested); }
            catch (Exception ex) { Action<Exception> handler = DeferredNavigationFailed; if (handler != null) handler(ex); }
        }
        private void ForwardInitialized(object sender, CoreWebView2InitializationCompletedEventArgs e)
        {
            if (_disposed) return;
            EventHandler<CoreWebView2InitializationCompletedEventArgs> handler = InitializationCompleted;
            if (handler != null) handler(this, e);
        }
        private void ForwardNavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs e)
        {
            if (_disposed || _stopRequested) { e.Cancel = true; return; }
            EventHandler<CoreWebView2NavigationStartingEventArgs> handler = NavigationStarting;
            if (handler != null) handler(this, e);
        }
        private void ForwardNavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            if (_disposed) return;
            EventHandler<CoreWebView2NavigationCompletedEventArgs> handler = NavigationCompleted;
            if (handler != null) handler(this, e);
        }

        public void GoBack() { if (!_disposed) { _stopRequested = false; if (_standard != null) _standard.GoBack(); else _composition.GoBack(); } }
        public void GoForward() { if (!_disposed) { _stopRequested = false; if (_standard != null) _standard.GoForward(); else _composition.GoForward(); } }
        public void Reload() { if (!_disposed) { _stopRequested = false; if (_standard != null) _standard.Reload(); else _composition.Reload(); } }
        public void Stop() { _pendingSource = null; _stopRequested = true; if (!_disposed && Core != null) Core.Stop(); }
        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true; _pendingSource = null; _element.Loaded -= OnLoaded;
            if (_standard != null) _standard.Dispose(); else _composition.Dispose();
        }
    }

    internal sealed class WebView2LiveWebSurface : ILiveWebSurface
    {
        private readonly WebView2ControlAdapter _view;
        private readonly string _root;
        private readonly string _dataDir;
        private readonly bool _private;
        private bool _ready;
        private bool _disposed;
        private bool _navigationStartedSecure;
        private ulong _navigationId;
        private bool _boundaryUnavailable;

        public event Action<string, string> NavigationCommitted;
        public event Action<string> NavigationFailed;
        public event Action<string> StatusChanged;
        public event Action<bool> FullScreenChanged;

        public WebView2LiveWebSurface(string root, int tabId, bool isPrivate)
        {
            _root = root;
            _private = isPrivate;
            string state = Environment.GetEnvironmentVariable("JA21_WEB_DATA_ROOT");
            if(String.IsNullOrWhiteSpace(state)) state = PortablePaths.LiveWebState(root);
            state = System.IO.Path.GetFullPath(state);
            RuntimeSeal.RejectReparsePoints(PortablePaths.Workspace(root), state);
            Directory.CreateDirectory(state);
            _dataDir = isPrivate
                ? System.IO.Path.Combine(state, "private", "tab-" + tabId.ToString() + "-" + Guid.NewGuid().ToString("N"))
                : System.IO.Path.Combine(state, "profile");
            RuntimeSeal.RejectReparsePoints(PortablePaths.Workspace(root), _dataDir);
            Directory.CreateDirectory(_dataDir);

            // The console has no optical overlays, so use the standard HWND-backed control.
            // The full browser keeps its composition control for its overlaid WPF chrome.
            _view = new WebView2ControlAdapter(Ja21Design.ConsoleMode);
            _view.Element.HorizontalAlignment = HorizontalAlignment.Stretch;
            _view.Element.VerticalAlignment = VerticalAlignment.Stretch;
            CoreWebView2CreationProperties creation = new CoreWebView2CreationProperties { UserDataFolder = _dataDir, IsInPrivateModeEnabled = isPrivate, AreBrowserExtensionsEnabled = false };
            string fixedRuntime = PortablePaths.FixedWebView2Root(root);
            if(!String.IsNullOrWhiteSpace(fixedRuntime)) { var bp = creation.GetType().GetProperty("BrowserExecutableFolder"); if(bp != null && bp.CanWrite) bp.SetValue(creation, fixedRuntime, null); }
            _view.CreationProperties = creation;
            PortableFabric.Record("live.web", "surface-create", (isPrivate ? "private " : "persistent portable ") + _view.ControlName + " surface");
            _view.InitializationCompleted += OnInitialized;
            _view.DeferredNavigationFailed += delegate(Exception ex)
            {
                _ready = false;
                LogInitializationFailure("deferred-navigation", ex);
                string failure = "Live web navigation could not initialize · " + ex.Message + " · HRESULT 0x" + ex.HResult.ToString("X8");
                EmitStatus(failure); EmitFailure(failure);
            };
            _view.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs e)
            {
                try
                {
                    if (_boundaryUnavailable) throw new Exception("The installed live web runtime cannot enforce the required resource boundary.");
                    _navigationId = e.NavigationId;
                    Uri target = RequireWebTarget(e.Uri, true);
                    if (target != null)
                    {
                        if (!e.IsRedirected) _navigationStartedSecure = target.Scheme == "https";
                        if (e.IsRedirected && _navigationStartedSecure && target.Scheme == "http")
                            throw new Exception("HTTPS to HTTP redirects are outside the JA21 transport boundary.");
                    }
                }
                catch(Exception policyEx) { e.Cancel=true; EmitStatus("Live web navigation blocked · "+policyEx.Message); return; }
                EmitStatus("Loading live web · " + SafeHost(e.Uri));
            };
            _view.NavigationCompleted += delegate(object sender, CoreWebView2NavigationCompletedEventArgs e)
            {
                if (_disposed || e.NavigationId != _navigationId) return;
                if (e.IsSuccess) EmitNavigation();
                else EmitFailure("Live web navigation failed · " + e.WebErrorStatus.ToString());
                EmitStatus(e.IsSuccess ? "Live web settled" : "Live web navigation failed · " + e.WebErrorStatus.ToString());
            };
        }

        private void OnInitialized(object sender, CoreWebView2InitializationCompletedEventArgs e)
        {
            if (_disposed) return;
            if (!e.IsSuccess || _view.Core == null)
            {
                _ready = false;
                Exception error = e.InitializationException ?? new Exception("WebView2 did not return an initialized core.");
                LogInitializationFailure("core-initialization", error);
                string failure = "Live web engine could not initialize · " + error.Message + " · HRESULT 0x" + error.HResult.ToString("X8");
                EmitStatus(failure); EmitFailure(failure);
                return;
            }
            CoreWebView2Settings s = _view.Core.Settings;
            s.IsStatusBarEnabled = false;
            s.AreDevToolsEnabled = String.Equals(Environment.GetEnvironmentVariable("JA21_ENABLE_DEVTOOLS"), "1", StringComparison.Ordinal);
            s.IsPasswordAutosaveEnabled = false;
            s.IsGeneralAutofillEnabled = false;
            s.AreDefaultScriptDialogsEnabled = true;
            s.AreDefaultContextMenusEnabled = true;
            s.IsZoomControlEnabled = true;
            s.AreBrowserAcceleratorKeysEnabled = true;
            s.AreHostObjectsAllowed = false;
            s.IsWebMessageEnabled = false;
            if (Ja21Design.ConsoleMode)
            {
                try
                {
                    string appFolder = RuntimeSeal.Contained(_root, "GFM");
                    RuntimeSeal.RejectReparsePoints(_root, appFolder);
                    if (!Directory.Exists(appFolder)) throw new Exception("The bundled GFM simulator folder is missing: " + appFolder);
                    // This callback runs before pending Source navigation. Only GFM files are
                    // mounted, and other origins receive no access to this local folder.
                    _view.Core.SetVirtualHostNameToFolderMapping(JaAddressPolicy.ConsoleAppHost, appFolder, CoreWebView2HostResourceAccessKind.Deny);
                }
                catch (Exception ex)
                {
                    _boundaryUnavailable = true; _ready = false; s.IsScriptEnabled = false; _view.Stop();
                    LogInitializationFailure("folder-mapping", ex);
                    string failure = "The GFM simulator could not mount its bundled files · " + ex.Message;
                    EmitStatus(failure); EmitFailure(failure); return;
                }
            }
            _view.Core.FrameNavigationStarting += delegate(object o, CoreWebView2NavigationStartingEventArgs n)
            {
                try { RequireWebTarget(n.Uri, true); }
                catch (Exception ex) { n.Cancel = true; EmitStatus("Live web frame blocked · " + ex.Message); }
            };
            // Cover images, scripts, fetch/XHR, frames and worker requests, rather than
            // applying a private-network boundary only to the top-level address bar.
            try { _view.Core.AddWebResourceRequestedFilter("*", CoreWebView2WebResourceContext.All, CoreWebView2WebResourceRequestSourceKinds.All); }
            catch (Exception ex)
            {
                _boundaryUnavailable = true; _ready = false; s.IsScriptEnabled = false; _view.Stop();
                LogInitializationFailure("resource-boundary", ex);
                string failure = "Live web runtime cannot enforce the required resource boundary · " + ex.Message;
                EmitStatus(failure); EmitFailure(failure); return;
            }
            _view.Core.WebResourceRequested += delegate(object o, CoreWebView2WebResourceRequestedEventArgs r)
            {
                try
                {
                    Uri target;
                    if (!Uri.TryCreate(r.Request.Uri, UriKind.Absolute, out target)) throw new Exception("Invalid resource address.");
                    if (target.Scheme == "data" || target.Scheme == "blob" || r.Request.Uri == "about:blank") return;
                    RequireWebTarget(r.Request.Uri, false);
                }
                catch (Exception ex)
                {
                    r.Response = _view.Core.Environment.CreateWebResourceResponse(new MemoryStream(new byte[0]), 403, "Forbidden", "Content-Type: text/plain\r\nCache-Control: no-store");
                    EmitStatus("Live web resource blocked · " + ex.Message);
                }
            };

            // Some video/player shells apply `cursor:none` while media is active. In a browser-owned
            // virtual desktop that can make the system pointer appear to fall behind the video surface.
            // Install a narrow guard that only overrides elements which explicitly compute to cursor:none;
            // ordinary link/text/resize cursor semantics remain site-controlled.
            string cursorGuard =
                "(function(){" +
                "function ja21CursorGuard(ev){var n=ev&&ev.target?ev.target:null;var hops=0;" +
                "while(n&&n.nodeType===1&&hops++<16){try{if(getComputedStyle(n).cursor==='none')n.style.setProperty('cursor','auto','important');}catch(e){}n=n.parentElement;}}" +
                "document.addEventListener('pointerover',ja21CursorGuard,true);" +
                "document.addEventListener('pointermove',ja21CursorGuard,true);" +
                "document.addEventListener('mousemove',ja21CursorGuard,true);" +
                "})();";
            try { _view.Core.AddScriptToExecuteOnDocumentCreatedAsync(cursorGuard); } catch { }
            _view.Core.NewWindowRequested += delegate(object o, CoreWebView2NewWindowRequestedEventArgs n)
            {
                // Keep web navigation in the omni surface rather than spawning external browser chrome.
                n.Handled = true;
                try
                {
                    Uri popup; if(!String.IsNullOrWhiteSpace(n.Uri) && Uri.TryCreate(n.Uri,UriKind.Absolute,out popup) && (popup.Scheme=="http" || popup.Scheme=="https")) Navigate(n.Uri);
                    else EmitStatus("Live web blocked a non-web popup target.");
                }
                catch (Exception ex) { EmitStatus("Live web popup blocked · " + ex.Message); }
            };
            _view.Core.LaunchingExternalUriScheme += delegate(object o, CoreWebView2LaunchingExternalUriSchemeEventArgs n)
            {
                n.Cancel = true;
                EmitStatus("Live web blocked an external application launch.");
            };
            _view.Core.ContainsFullScreenElementChanged += delegate(object o, object args)
            {
                Action<bool> h=FullScreenChanged; if(h!=null)h(_view.Core.ContainsFullScreenElement);
            };
            _view.Core.PermissionRequested += delegate(object o, CoreWebView2PermissionRequestedEventArgs p)
            {
                // The bundled console exports more than one calculated record.
                // Grant only this app-local download permission; every download
                // still passes the contained portable-path handler below.
                if (Ja21Design.ConsoleMode && p.PermissionKind == CoreWebView2PermissionKind.MultipleAutomaticDownloads)
                {
                    try
                    {
                        JaAddressPolicy.CheckResolved(new Uri(p.Uri));
                        p.State = CoreWebView2PermissionState.Allow;
                        p.SavesInProfile = false;
                        return;
                    }
                    catch { }
                }
                // Camera, microphone, geolocation, notifications and clipboard escalation are denied
                // unless explicitly opted in for this launch. Ordinary video playback is unaffected.
                if (String.Equals(Environment.GetEnvironmentVariable("JA21_ALLOW_WEB_PERMISSIONS"), "1", StringComparison.Ordinal)) return;
                p.State = CoreWebView2PermissionState.Deny;
                p.SavesInProfile = false;
            };
            _view.Core.ProcessFailed += delegate(object o, CoreWebView2ProcessFailedEventArgs p)
            {
                string failure = "Live web process needs recovery · " + p.ProcessFailedKind.ToString();
                _ready = false;
                EmitStatus(failure); EmitFailure(failure);
            };
            _view.Core.DownloadStarting += delegate(object o, CoreWebView2DownloadStartingEventArgs d)
            {
                try
                {
                    string path = PortablePaths.UniqueDownloadPath(_root, d.ResultFilePath);
                    d.ResultFilePath = path;
                    PortableFabric.Record("downloads", "download-route", System.IO.Path.GetFileName(path));
                    EmitStatus("Download routed to portable workspace · " + System.IO.Path.GetFileName(path));
                }
                catch(Exception ex) { d.Cancel = true; EmitStatus("Portable download path unavailable · " + ex.Message); }
            };
            _ready = true;
            EmitStatus("Live web engine ready · " + EngineLabel);
        }

        private void LogInitializationFailure(string stage, Exception error)
        {
            try
            {
                string directory = RuntimeSeal.Contained(_root, "workspace/logs");
                Directory.CreateDirectory(directory);
                string path = RuntimeSeal.Contained(_root, "workspace/logs/webview2-initialization-error.txt");
                string detail = DateTime.UtcNow.ToString("o") + " · " + stage + " · " + _view.ControlName +
                    Environment.NewLine + "HRESULT: 0x" + error.HResult.ToString("X8") + Environment.NewLine + error.ToString() + Environment.NewLine + Environment.NewLine;
                File.AppendAllText(path, detail, System.Text.Encoding.UTF8);
            }
            catch { }
        }

        private static Uri RequireWebTarget(string raw, bool allowBlank)
        {
            if (allowBlank && String.Equals(raw, "about:blank", StringComparison.OrdinalIgnoreCase)) return null;
            Uri target;
            if (!Uri.TryCreate(raw, UriKind.Absolute, out target)) throw new Exception("Live web address is not absolute.");
            JaAddressPolicy.CheckResolved(target);
            return target;
        }

        private void EmitNavigation()
        {
            Action<string, string> h = NavigationCommitted;
            if (h == null) return;
            string src = Source;
            string title = DocumentTitle;
            h(src, title);
        }
        private void EmitStatus(string text) { Action<string> h = StatusChanged; if (h != null) h(text); }
        private void EmitFailure(string text) { Action<string> h = NavigationFailed; if (h != null) h(text); }
        private static string SafeHost(string raw) { Uri u; return Uri.TryCreate(raw, UriKind.Absolute, out u) ? u.Host : "site"; }

        public FrameworkElement View { get { return _view.Element; } }
        public bool Ready { get { return _ready; } }
        public string EngineLabel
        {
            get
            {
                try { return "Microsoft Edge WebView2 " + LiveWebFactory.RuntimeVersion(_root); }
                catch { return "Microsoft Edge WebView2"; }
            }
        }
        public string Source { get { return _view.Source == null ? "" : _view.Source.AbsoluteUri; } }
        public string DocumentTitle { get { try { return _view.Core == null ? "" : _view.Core.DocumentTitle; } catch { return ""; } } }
        public bool CanGoBack { get { try { return _view.Core != null && _view.Core.CanGoBack; } catch { return false; } } }
        public bool CanGoForward { get { try { return _view.Core != null && _view.Core.CanGoForward; } catch { return false; } } }

        public void Navigate(string url)
        {
            if (_disposed) return;
            if (_boundaryUnavailable) throw new Exception("The installed live web runtime cannot enforce the required resource boundary.");
            Uri u;
            if (!Uri.TryCreate(url, UriKind.Absolute, out u)) throw new Exception("Live web address is not absolute.");
            if(u.Scheme!="http" && u.Scheme!="https") throw new Exception("Live web opens only HTTP or HTTPS addresses.");
            JaAddressPolicy.Check(u);
            PortableFabric.Record("live.web", "navigate", u.Host);
            _view.Source = u;
        }
        public void GoBack() { if (CanGoBack) _view.GoBack(); }
        public void GoForward() { if (CanGoForward) _view.GoForward(); }
        public void Reload() { try { if (_view.Core != null) _view.Reload(); } catch { } }
        public void Stop() { try { _view.Stop(); } catch { } }
        public void ClearBrowsingData() { try { if (_view.Core != null) _view.Core.Profile.ClearBrowsingDataAsync(); } catch { } }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            try { _view.Dispose(); } catch { }
            if (_private)
            {
                try { RuntimeSeal.RejectReparsePoints(PortablePaths.Workspace(_root), _dataDir); Directory.Delete(_dataDir, true); } catch { }
            }
        }
    }
}
