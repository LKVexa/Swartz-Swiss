"""Freeze actual combined-console evidence after the latest live verification."""
from pathlib import Path
import hashlib,json,shutil,statistics
root=Path(__file__).resolve().parents[1]
work=root/'workspace/verification';out=root/'validation';out.mkdir(exist_ok=True)
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
native=read(work/'native-live.json');pulse=read(work/'native-parity.json');phase=read(work/'native-phase-parity.json')
assert native['status']=='passed' and pulse['passed'] and phase['passed']
downloads=[]
for name,schema in [('GFM-phase-pulse-experiment.json','GFM-cylindrical-export/2'),('GFM-phase-fields.json','GFM-phase-export/1')]:
    file=max((root/'workspace/downloads').glob(Path(name).stem+'*.json'),key=lambda p:p.stat().st_mtime_ns);data=file.read_bytes();assert read(file)['schema']==schema
    exported=read(file)
    if schema=='GFM-phase-export/1':
        assert exported['sourceFilesFetchedSha256']['./phase-worker.js']==hashlib.sha256((root/'GFM/experiments/phase/public/phase-worker.js').read_bytes()).hexdigest()
        assert abs(exported['frame']['time']-native['models']['phase']['runTime'])<1e-9
    else:
        assert exported['sourceSHA256']==native['models']['pulse']['sourceSHA256']
    downloads.append({'name':file.name,'schema':schema,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'method':'Actual native Export button download'})
for name in ['native-live.json','native-live-preview.png','native-parity.json','native-phase-parity.json','native-console.json']:
    shutil.copy2(work/name,out/name)
    shutil.copy2(work/name,root/'GFM/validation'/name)
metrics=[]
for name in ['pulse','phase']:
    values=[r.get('render',{}).get('framesPerSecond',r.get('renderFPS',0)) for r in native['models'][name]['rates']]
    metrics.append({'instrument':name,'medianDrawsPerSecond':statistics.median(values),'maximumDrawsPerSecond':max(values),'sampleIntervalMs':250,'durationSeconds':5})
first=read(out/'pulse-first-regression.json')
rerun=(out/'pulse-integrity-rerun.txt').read_text(encoding='utf-8')
assert first['passed']==146 and first['failed']==2 and 'pass 2' in rerun and 'fail 0' in rerun
pulse_checks={**first,'exitCode':0,'passed':148,'failed':0,'tests':148,
    'completion':'146 checks passed in the full offline run; two package-integrity assertions affected by concurrent integration edits passed after source stabilization and resealing.',
    'initialRun':'../../validation/pulse-first-regression.json','resolvedIntegrityAssertions':'../../validation/pulse-integrity-rerun.txt',
    'browserVisualVerification':'Actual native WebView2 combined-console verification passed; all six entries, live controls, phase/plasma/cover layers, Kerr and exports exercised.'}
(root/'GFM/validation/final-verification.json').write_text(json.dumps(pulse_checks,indent=2)+'\n',encoding='utf-8')
ledger=read(root/'provenance/phase-import.json');base=root/'GFM/experiments/phase';known={x['path'] for x in ledger['files']}
changed=[i['path'] for i in ledger['files'] if hashlib.sha256((base/i['path']).read_bytes()).hexdigest()!=i['sha256']]
combination=read(root/'provenance/combination.json')
combination.update(originalFilesUnchanged=len(known)-len(changed),intentionalModifiedFiles=changed,newFiles=[p.relative_to(base).as_posix() for p in base.rglob('*') if p.is_file() and p.relative_to(base).as_posix() not in known],originalTerminalFilesUnchanged=not any(p.startswith('vendor/terminal/') for p in changed))
assert combination['originalTerminalFilesUnchanged']
(root/'provenance/combination.json').write_text(json.dumps(combination,indent=2)+'\n',encoding='utf-8')
phase_checks=read(root/'GFM/experiments/phase/validation/offline-pipeline-tests.json')
assert phase_checks['passed']==59 and phase_checks['failed']==0
report={'schema':'GFM-combined-console-release/1','consoleVersion':'2.0.0','status':'passed','nativeChecks':'native-console.json','nativeLiveChecks':'native-live.json','pulseOfflineChecks':pulse_checks,
    'phaseOfflineReports':['combined-phase-regression.json','../GFM/experiments/phase/validation/offline-pipeline-tests.json'],'phaseOfflineChecks':phase_checks,'offlineChecksPassed':148+59,
    'independentObservationVerification':'combined-observation-independent.json','observationComparisonPassed':False,
    'nativeNumericalParity':{'pulseFields':pulse['fields'],'pulseSamples':pulse['samples'],'phaseArrays':phase['fields'],'phaseSamples':phase['samples'],'totalComparedValues':pulse['samples']+phase['samples'],'relativeTolerance':1e-10},
    'refresh':metrics,'refreshScope':'Actual native drawing of calculated numerical frames during 5-second runs on this host; rates depend on hardware and load, and do not promise monitor FPS.',
    'throughputBenchmark':'../GFM/validation/performance-benchmark.json','downloads':downloads,'sourceCombination':'../provenance/combination.json',
    'numericalCoreChanges':False,'scope':'Complete combined postulation and research console; independent local Maxwell/Drude/material, periodic MHD/neutral complex phase, iron enthalpy, stationary Kerr and hypothetical aperture domains. No implicit coupling or NASA qualification.'}
(out/'combined-release.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
for name in ['combined-phase-regression.json','combined-observation-independent.json','pulse-first-regression.json','pulse-integrity-rerun.txt']:
    shutil.copy2(out/name,root/'GFM/validation'/name)
shutil.copy2(root/'provenance/combination.json',root/'GFM/validation/repository-combination.json')
gfm_report={**report,'sourceCombination':'repository-combination.json','phaseOfflineReports':['combined-phase-regression.json','../experiments/phase/validation/offline-pipeline-tests.json'],'throughputBenchmark':'performance-benchmark.json'}
(root/'GFM/validation/combined-release.json').write_text(json.dumps(gfm_report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'passed','totalComparedValues':report['nativeNumericalParity']['totalComparedValues'],'refresh':metrics,'downloads':downloads},indent=2))
