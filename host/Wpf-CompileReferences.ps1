$ErrorActionPreference = 'Stop'

function Import-JA21WpfAssemblies {
    # OS target-adapter dependencies only. No browser/document engine is loaded here.
    $assemblies = @(
        'PresentationFramework',
        'PresentationCore',
        'WindowsBase',
        'System.Xaml',
        'System.Web.Extensions'
    )
    foreach ($name in $assemblies) {
        try { Add-Type -AssemblyName $name -ErrorAction Stop }
        catch { throw "Required Windows/.NET Framework assembly '$name' could not be loaded. Enable/install .NET Framework 4.x WPF components and retry. $($_.Exception.Message)" }
    }
}

function Get-JA21WpfCompileReferences {
    Import-JA21WpfAssemblies
    $refs = @(
        [System.Windows.Window].Assembly.Location,
        [System.Windows.Media.Brush].Assembly.Location,
        [System.Windows.Threading.Dispatcher].Assembly.Location,
        [System.Xaml.XamlReader].Assembly.Location,
        [System.Web.Script.Serialization.JavaScriptSerializer].Assembly.Location,
        [System.Uri].Assembly.Location,
        [System.Net.HttpWebRequest].Assembly.Location,
        [System.Security.Cryptography.SHA256].Assembly.Location
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique
    if ($refs.Count -lt 5) { throw "Incomplete WPF compile reference closure: resolved only $($refs.Count) unique assembly paths." }
    return $refs
}
