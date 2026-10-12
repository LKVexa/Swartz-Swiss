param(
    [string]$Root = (Split-Path -Parent $PSScriptRoot),
    [string]$Work = (Join-Path (Split-Path -Parent $PSScriptRoot) 'workspace\verification')
)
$ErrorActionPreference = 'Stop'
$Root = [IO.Path]::GetFullPath($Root)
$Work = [IO.Path]::GetFullPath($Work)
New-Item -ItemType Directory -Force -Path $Work | Out-Null
$resultPath = Join-Path $Work 'console-verification.json'
$previewPath = Join-Path $Work 'console-preview.png'
$testWorkspace = Join-Path $Work ('console-test-state-' + [guid]::NewGuid().ToString('N'))
$checks = New-Object System.Collections.Generic.List[object]
$policyCases = New-Object System.Collections.Generic.List[object]
$window = $null
$vec = $null
$failure = $null
$treeTypes = @()
$sdkRuntimeReady = $null
$envNames = @('JA21_CONSOLE_MODE','JA21_CONSOLE_ORIGINS','JA21_START_URL','JA21_ALLOW_PRIVATE_HOSTS','JA21_PORTABLE_ROOT','JA21_ALLOW_EXTERNAL_PORTABLE_ROOT','JA21_WEB_DATA_ROOT','JA21_VEC1_STATE_ROOT','JA21_DOWNLOADS_ROOT','JA21_TEMP_ROOT','PATH')
$savedEnv = @{}
foreach ($name in $envNames) { $savedEnv[$name] = [Environment]::GetEnvironmentVariable($name) }

function Add-Check([string]$Name, [bool]$Passed, $Detail) {
    [void]$checks.Add([ordered]@{name=$Name;passed=$Passed;detail=$Detail})
}
function Join-CompilationUnits([string[]]$Sources) {
    $usings = New-Object System.Collections.Generic.List[string]
    $bodies = New-Object System.Collections.Generic.List[string]
    foreach ($sourceText in $Sources) {
        $body = New-Object Text.StringBuilder
        foreach ($line in ($sourceText -split "`r?`n")) {
            if ($line -match '^\s*using\s+(static\s+)?[A-Za-z_@][^();{}]*;\s*$') {
                $usingLine = $line.Trim()
                if (!$usings.Contains($usingLine)) { [void]$usings.Add($usingLine) }
            } else { [void]$body.AppendLine($line) }
        }
        [void]$bodies.Add($body.ToString())
    }
    return (($usings -join [Environment]::NewLine) + [Environment]::NewLine + ($bodies -join [Environment]::NewLine))
}
function Get-ContentTree([System.Windows.DependencyObject]$Node) {
    $visited = New-Object 'System.Collections.Generic.HashSet[System.Windows.DependencyObject]'
    $queue = New-Object 'System.Collections.Generic.Queue[System.Windows.DependencyObject]'
    $queue.Enqueue($Node)
    $nodes = New-Object System.Collections.Generic.List[object]
    while ($queue.Count -gt 0) {
        $current = $queue.Dequeue()
        if (!$visited.Add($current)) { continue }
        [void]$nodes.Add($current)
        if ($current -is [System.Windows.Media.Visual]) {
            for ($i = 0; $i -lt [System.Windows.Media.VisualTreeHelper]::GetChildrenCount($current); $i++) {
                $queue.Enqueue([System.Windows.Media.VisualTreeHelper]::GetChild($current,$i))
            }
        }
        foreach ($child in [System.Windows.LogicalTreeHelper]::GetChildren($current)) {
            if ($child -is [System.Windows.DependencyObject]) { $queue.Enqueue($child) }
        }
    }
    return $nodes.ToArray()
}
function Test-Origin([string]$Url, [bool]$Expected, [string]$Label) {
    $allowed = $false
    $reason = $null
    try {
        $targetUri = New-Object Uri $Url
        $null = $policyType.GetMethod('Check',$staticFlags).Invoke($null,[object[]]@($targetUri.PSObject.BaseObject))
        $null = $policyType.GetMethod('CheckResolved',$staticFlags).Invoke($null,[object[]]@($targetUri.PSObject.BaseObject))
        $allowed = $true
    } catch { $reason = $_.Exception.GetBaseException().Message }
    [void]$policyCases.Add([ordered]@{label=$Label;url=$Url;expected_allowed=$Expected;allowed=$allowed;passed=($allowed -eq $Expected);reason=$reason})
}

try {
    if ($PSVersionTable.PSEdition -ne 'Desktop') { throw 'Run with Windows PowerShell 5.x, not PowerShell Core: WPF and the original Add-Type path require .NET Framework.' }
    if ([Threading.Thread]::CurrentThread.GetApartmentState() -ne 'STA') { throw 'Run powershell.exe with -STA for headless WPF verification.' }
    $env:JA21_CONSOLE_MODE = '1'
    $env:JA21_START_URL = 'about:blank'
    $env:JA21_CONSOLE_ORIGINS = 'http://127.0.0.1:8788;http://127.0.0.1:8791'
    $env:JA21_ALLOW_PRIVATE_HOSTS = '1' # Console policy must ignore the broad legacy bypass.
    $env:JA21_PORTABLE_ROOT = $testWorkspace
    $env:JA21_ALLOW_EXTERNAL_PORTABLE_ROOT = '1'
    $env:JA21_WEB_DATA_ROOT = Join-Path $testWorkspace 'state\webview2'
    $env:JA21_VEC1_STATE_ROOT = Join-Path $testWorkspace 'state\vec1'
    $env:JA21_DOWNLOADS_ROOT = Join-Path $testWorkspace 'downloads'
    $env:JA21_TEMP_ROOT = Join-Path $testWorkspace 'temp'
    New-Item -ItemType Directory -Force -Path $testWorkspace | Out-Null

    # Compile exactly the launcher's five units, without invoking its Program.Run.
    # The full package verifier has already been run separately after resealing.
    . (Join-Path $Root 'host\Wpf-CompileReferences.ps1')
    $compileRefs = Get-JA21WpfCompileReferences
    $sdkRoot = Join-Path $Root 'runtime\webview2-sdk\1.0.4191.47'
    $adapter = [pscustomobject]@{Ready=$true;Version='1.0.4191.47';Root=$sdkRoot;Core=(Join-Path $sdkRoot 'Microsoft.Web.WebView2.Core.dll');Wpf=(Join-Path $sdkRoot 'Microsoft.Web.WebView2.Wpf.dll');Loader=(Join-Path $sdkRoot 'WebView2Loader.dll')}
    foreach ($path in @($adapter.Core,$adapter.Wpf,$adapter.Loader)) { if (!(Test-Path -LiteralPath $path -PathType Leaf)) { throw "Preprovisioned SDK file missing: $path" } }
    $loadedAdapter = & (Join-Path $Root 'host\Import-WebView2Adapter.ps1') -Adapter $adapter -Quiet
    if (!$loadedAdapter.Ready) { throw ('Managed WebView2 binding failed: ' + $loadedAdapter.Error) }
    $sdkRuntimeReady = $loadedAdapter.RuntimeReady
    $compileRefs = @($compileRefs) + @($adapter.Core,$adapter.Wpf)
    $units = @('host\JA21VirtualBrowser.cs','host\Vec1Substrate.cs','host\PortableDesktop.cs','host\LiveWebContracts.cs','host\LiveWebBridge.cs') | ForEach-Object { Get-Content -LiteralPath (Join-Path $Root $_) -Raw -Encoding UTF8 }
    Add-Type -TypeDefinition (Join-CompilationUnits $units) -Language CSharp -ReferencedAssemblies $compileRefs -ErrorAction Stop
    Add-Check 'Windows WPF console compilation' $true 'Same source closure and managed loader as the launcher; no presenter Run/Show call.'
    [VBJA21.RuntimeSeal]::Verify($Root)
    Add-Check 'Runtime integrity' $true 'RuntimeSeal.Verify succeeded on the derived package.'

    $assembly = [VBJA21.BrowserWindow].Assembly
    $instanceFlags = [Reflection.BindingFlags]'Instance,Public,NonPublic'
    $staticFlags = [Reflection.BindingFlags]'Static,Public,NonPublic'
    $policyType = $assembly.GetType('VBJA21.JaAddressPolicy',$true)
    $null = $assembly.GetType('VBJA21.PortableFabric',$true).GetMethod('Configure',$staticFlags).Invoke($null,[object[]]@($Root))
    $serializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
    $serializer.MaxJsonLength = [int]::MaxValue
    $browserUnit = $serializer.DeserializeObject([IO.File]::ReadAllText((Join-Path $Root 'engine\ja21\browser.ir.json'),[Text.Encoding]::UTF8))
    $rendererUnit = $serializer.DeserializeObject([IO.File]::ReadAllText((Join-Path $Root 'engine\ja21\renderer.ir.json'),[Text.Encoding]::UTF8))
    $browserVm = [Activator]::CreateInstance([VBJA21.Ja21Vm],[object[]]@($browserUnit))
    $rendererVm = [Activator]::CreateInstance([VBJA21.Ja21Vm],[object[]]@($rendererUnit))
    $helper = New-Object VBJA21.DfSmallHelper $Root
    $vec = New-Object VBJA21.VecSubstrate $Root
    $null = $vec.BeginSession()
    $windowConstructor = [VBJA21.BrowserWindow].GetConstructor([type[]]@([string],[VBJA21.Ja21Vm],[VBJA21.Ja21Vm],[VBJA21.DfSmallHelper],[VBJA21.VecSubstrate]))
    $window = $windowConstructor.Invoke([object[]]@($Root,$browserVm.PSObject.BaseObject,$rendererVm.PSObject.BaseObject,$helper.PSObject.BaseObject,$vec.PSObject.BaseObject))
    $windowType = $window.GetType()
    $create = $windowType.GetMethod('CreateTab',$instanceFlags)
    $null = $create.Invoke($window,[object[]]@('about:blank',$false))
    $activeProperty = $windowType.GetProperty('ActiveTab',$instanceFlags)
    $tab = $activeProperty.GetValue($window,$null)
    $tabType = $tab.GetType()
    $navigate = @($windowType.GetMethods($instanceFlags) | Where-Object {$_.Name -eq 'Navigate' -and $_.GetParameters().Count -eq 3})[0]
    $null = $navigate.Invoke($window,[object[]]@($tab,'about:blank',$true))
    Add-Check 'Hidden compact normal window' (!$window.IsVisible -and $window.Width -eq 760 -and $window.Height -eq 640 -and $window.MinWidth -eq 420 -and $window.MinHeight -eq 360 -and $window.WindowState.ToString() -eq 'Normal') ([ordered]@{visible=$window.IsVisible;width=$window.Width;height=$window.Height;min_width=$window.MinWidth;min_height=$window.MinHeight;state=$window.WindowState.ToString()})
    $liveField = $tabType.GetField('LiveWeb',$instanceFlags)
    Add-Check 'Initial blank has no live engine' ($null -eq $liveField.GetValue($tab)) $tabType.GetField('LogicalUrl',$instanceFlags).GetValue($tab)
    Add-Check 'Backing tab has no visible pill' ($null -eq $tabType.GetField('Pill',$instanceFlags).GetValue($tab) -and $null -eq $tabType.GetField('PillText',$instanceFlags).GetValue($tab)) 'Both tab-pill fields are null.'
    $null = $create.Invoke($window,[object[]]@('about:blank',$false))
    $tabs = $windowType.GetField('_tabs',$instanceFlags).GetValue($window)
    Add-Check 'Repeated blank creation keeps one backing surface' ($tabs.Count -eq 1) $tabs.Count
    $detachedChrome = @()
    foreach ($name in @('_omniBar','_omniPopup','_overlayRoot','_commandBand','_tabBand','_statusBand','_drawer','_omniFab','_commandPalettePanel')) {
        $field = $windowType.GetField($name,$instanceFlags)
        if ($null -eq $field -or $null -ne $field.GetValue($window)) { $detachedChrome += $name }
    }
    Add-Check 'No constructed chrome or popup surfaces' ($detachedChrome.Count -eq 0) $detachedChrome

    # Exercise clearing the content plane without a native window or live browser.
    $pageHost = $tabType.GetField('PageHost',$instanceFlags).GetValue($tab)
    $fakeView = New-Object System.Windows.Controls.Grid
    [void]$pageHost.Children.Add($fakeView)
    $null = $navigate.Invoke($window,[object[]]@($tab,'about:blank',$true))
    Add-Check 'Blank navigation clears the content surface' ($null -eq $liveField.GetValue($tab) -and $pageHost.Children.Count -eq 0) ([ordered]@{remaining_children=$pageHost.Children.Count;live_surface_null=($null -eq $liveField.GetValue($tab))})

    $content = [System.Windows.FrameworkElement]$window.Content
    $content.Measure((New-Object System.Windows.Size 760,640))
    $content.Arrange((New-Object System.Windows.Rect 0,0,760,640))
    $content.UpdateLayout()
    $nodes = @(Get-ContentTree $content)
    $treeTypes = @($nodes | ForEach-Object {$_.GetType().FullName})
    $forbidden = @($nodes | Where-Object {$_ -is [System.Windows.Controls.Primitives.ButtonBase] -or $_ -is [System.Windows.Controls.Primitives.TextBoxBase] -or $_ -is [System.Windows.Controls.TabControl] -or $_ -is [System.Windows.Controls.TabItem] -or $_ -is [System.Windows.Controls.Primitives.Popup] -or $_ -is [System.Windows.Controls.TextBlock]})
    Add-Check 'Blank WPF tree contains only layout containers' ($forbidden.Count -eq 0 -and @($nodes | Where-Object {!($_ -is [System.Windows.Controls.Grid]) -and !($_ -is [System.Windows.Controls.Border])}).Count -eq 0) $treeTypes
    $bitmap = New-Object System.Windows.Media.Imaging.RenderTargetBitmap 760,640,96,96,([System.Windows.Media.PixelFormats]::Pbgra32)
    $bitmap.Render($content)
    $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
    $previewStream = [IO.File]::Create($previewPath)
    try { $encoder.Save($previewStream) } finally { $previewStream.Dispose() }
    Add-Check 'Offscreen blank preview saved without showing window' (!$window.IsVisible -and (Test-Path -LiteralPath $previewPath -PathType Leaf)) $previewPath

    Test-Origin 'http://127.0.0.1:8788/' $true 'Configured simulator origin'
    Test-Origin 'http://127.0.0.1:8791/path?x=1#view' $true 'Configured origin with resource path'
    foreach ($url in @('http://127.0.0.1:8789/','http://127.0.0.1:80/','https://127.0.0.1:8788/','http://localhost:8788/','http://127.0.0.2:8788/','http://[::1]:8788/','http://192.168.1.1:8788/','http://10.0.0.1:8788/','http://169.254.169.254/','http://user:pass@127.0.0.1:8788/')) {
        Test-Origin $url $false 'Unconfigured/private/credential destination'
    }
    foreach ($badConfig in @('http://127.0.0.1:8788/app','http://127.0.0.1:8788/?x=1','http://127.0.0.1:8788/#fragment','http://user:pass@127.0.0.1:8788/')) {
        $env:JA21_CONSOLE_ORIGINS = $badConfig
        Test-Origin 'http://127.0.0.1:8788/' $false ('Invalid origin configuration: ' + $badConfig)
    }
    $env:JA21_CONSOLE_ORIGINS = 'http://127.0.0.1:8788;http://127.0.0.1:8791'
    Add-Check 'Narrow loopback policy' (@($policyCases | Where-Object {!$_.passed}).Count -eq 0) ($policyCases.Count.ToString() + ' policy cases; no network requests made.')
    Add-Check 'Test mutable state uses a dedicated directory' ([IO.Path]::GetFullPath($testWorkspace) -ne [IO.Path]::GetFullPath((Join-Path $Root 'workspace')) -and [IO.Path]::GetFileName($testWorkspace) -match '^console-test-state-[0-9a-f]{32}$') $testWorkspace
} catch {
    $failure = $_.Exception.GetBaseException().Message
    Write-Host $_.InvocationInfo.PositionMessage
    Write-Host $_.ScriptStackTrace
    Add-Check 'Headless verification completed' $false $failure
} finally {
    if ($null -ne $window) { try { $window.Close() } catch { } }
    if ($null -ne $vec) { try { $vec.EndSession() } catch { } }
    foreach ($name in $envNames) { [Environment]::SetEnvironmentVariable($name,$savedEnv[$name]) }
    $failed = @($checks | Where-Object {!$_.passed})
    $report = [ordered]@{schema='JA21/headless-console-verification/1';status=$(if($failed.Count -eq 0){'passed'}else{'failed'});root=$Root;test_workspace=$testWorkspace;native_ui_shown=$false;program_run_called=$false;live_browser_created=$false;network_requests_made=$false;sdk_runtime_detected=$sdkRuntimeReady;preview=$(if(Test-Path -LiteralPath $previewPath -PathType Leaf){$previewPath}else{$null});checks=$checks.ToArray();policy_cases=$policyCases.ToArray();content_tree_types=$treeTypes;failure=$failure}
    [IO.File]::WriteAllText($resultPath,($report | ConvertTo-Json -Depth 8),(New-Object Text.UTF8Encoding($false)))
    Write-Output ('Headless console verification: ' + $report.status + '; ' + $checks.Count + ' checks; ' + $policyCases.Count + ' policy cases.')
    Write-Output ('Result: ' + $resultPath)
}
if ($failed.Count -gt 0) { exit 1 }
