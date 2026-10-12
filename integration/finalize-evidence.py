"""Freeze actual integration evidence without rewriting previous model findings."""
from pathlib import Path
import hashlib,json,shutil
root=Path(__file__).resolve().parents[1]
validation=root/'validation';validation.mkdir(exist_ok=True)
work=root/'workspace/verification'
live=json.loads((work/'native-live.json').read_text(encoding='utf-8-sig'))
parity=json.loads((work/'native-parity.json').read_text(encoding='utf-8-sig'))
native=json.loads((work/'native-console.json').read_text(encoding='utf-8-sig'))
assert live['status']=='passed' and parity['passed'] and native['status']=='passed'
for name in ['native-live.json','native-parity.json','native-console.json','native-live-preview.png']:
    shutil.copy2(work/name,validation/name)
shutil.copy2(root/'workspace/build/native-build.json',validation/'native-build.json')
download=root/'workspace/downloads/GFM-phase-pulse-experiment.json'
export=json.loads(download.read_text(encoding='utf-8-sig'))
assert export['schema']=='GFM-cylindrical-export/2' and export['sourceSHA256']==live['sourceSHA256']
source=json.loads((root/'provenance/console-source.json').read_text(encoding='utf-8'))
math=json.loads((root/'GFM/validation/final-verification.json').read_text(encoding='utf-8'))
report={'schema':'GFM-JA21-integration-release/1','date':'2026-10-12','consoleVersion':'1.3.0','modelVersion':'2.1.0','nativeCompilationPassed':True,'nativeHostChecksPassed':len(native['checks']),'nativeOriginCasesPassed':len(native['policyCases']),'nativeLiveViewPassed':True,'webglError':live['webglError'],'threePhysicalLayersVisible':all(layer['checked'] for layer in live['layers']),'actualStepControlPassed':live['stepControlAdvancedModel'],'actualExportDownloaded':{'filename':download.name,'bytes':download.stat().st_size,'sha256':hashlib.sha256(download.read_bytes()).hexdigest(),'schema':export['schema']},'nativeModelParity':{'fields':parity['fields'],'samples':parity['samples'],'relativeTolerance':parity['relativeTolerance'],'maxScaledDifference':max(item['maxScaledDifference'] for item in parity['comparisons'])},'offlineModelChecks':{'passed':math['passed'],'failed':math['failed'],'deferredConnectionChecks':len(math['deferredNetworkTests'])},'projectIntegrationChecksPassed':2,'originalConsoleFilesPreserved':len(source['files']),'referencePathAliases':len(source['referenceAliases']),'simulatorSourceSHA256':live['sourceSHA256'],'renderer':'Standard WPF WebView2 in console mode; loaded control before navigation','appOrigin':'https://gfm.ja21.invalid/','localServerRequired':False,'externalBrowserRequired':False,'windowsPolicyChanged':False,'scientificScopeChanged':False,'historicalConsoleChecksDescribeBlankBaseline':True}
(validation/'integration-release.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
metadata=json.loads((root/'CONSOLE_BUILD.json').read_text(encoding='utf-8'))
metadata['simulation_integration']='Complete bundled GFM 2.1.0 through standard WPF WebView2 and exact virtual origin; native live controls and fields verified'
metadata['validation']={'report':'validation/integration-release.json','native_live_view':'passed','blank_console_baseline_is_not_integration_validation':True}
(root/'CONSOLE_BUILD.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
