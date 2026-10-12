using System;
using System.Windows;

namespace VBJA21
{
    internal interface ILiveWebSurface : IDisposable
    {
        FrameworkElement View { get; }
        bool Ready { get; }
        string EngineLabel { get; }
        string Source { get; }
        string DocumentTitle { get; }
        bool CanGoBack { get; }
        bool CanGoForward { get; }
        event Action<string, string> NavigationCommitted;
        event Action<string> NavigationFailed;
        event Action<string> StatusChanged;
        event Action<bool> FullScreenChanged;
        void Navigate(string url);
        void GoBack();
        void GoForward();
        void Reload();
        void Stop();
        void ClearBrowsingData();
    }
}
