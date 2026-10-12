"""Verify and package the local simulator without claiming browser execution."""
from pathlib import Path
import hashlib
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'outputs' / 'GFM_Aperture_Aggie_Simulator_v1.0.zip'
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))
def require(ok, reason):
    if not ok:
        raise RuntimeError(reason)
tests = (ROOT/'validation/tests.txt').read_text(encoding='utf-8-sig')
require(re.search(r'^# tests 13$',tests,re.M) and re.search(r'^# pass 13$',tests,re.M) and re.search(r'^# fail 0$',tests,re.M), 'Final passing tests are missing')
independent = read(ROOT/'validation/independent-results.json')
require(independent.get('passed') is True, 'Independent numerical validation failed')
provenance = read(ROOT/'SOURCE_PROVENANCE.json')
for item in provenance['modules']:
    require(sha(ROOT/item['copied']) == item['sha256'], 'A preserved backend module changed')
cases = [case for case in independent['results'] if 'snapshots' in case]
summary = {
    'schema':'GFM-Aperture-Aggie-verification/1',
    'prepared':'2026-10-11',
    'version':'1.0.0',
    'tests':{'passed':13,'failed':0,'transcript':'validation/tests.txt','sha256':sha(ROOT/'validation/tests.txt'),
             'scope':'Real local HTTP/SSE, calculation rules, bounded recordings, source preservation, isolated DOM client interaction with real HTTP/SSE, and finite schematic renderer geometry using a mocked graphics interface.'},
    'independentValidation':{'passed':True,'snapshotsChecked':sum(c['snapshots'] for c in cases),'gf9BasisRoundTrips':9,
                            'evidence':'validation/independent-results.json','sha256':sha(ROOT/'validation/independent-results.json'),
                            'maximumCoefficientError':max(c['maxCoefficientError'] for c in cases),
                            'maximumRecoveredError':max(c['maxRecoveredError'] for c in cases)},
    'preservedEngine':'RUSSL GFM Terminal 0.5.1, unchanged computation modules and complete original terminal in vendor/terminal',
    'modelScope':'Declared aperture/cover hypothesis with shared stationary Kerr exterior. GF9 samples are a spin sweep, not spatial or time coordinates. Motion and shapes are illustrative.',
    'browserVerification':{'status':'blocked','liveBrowserRenderingVerified':False,'gpuRenderingVerified':False,
                           'reason':'Automatic approval review rejected opening a new browser tab under the earlier preview/workaround restriction. No alternate browser or indirect opening was attempted after rejection.',
                           'serviceLimit':'Real HTTP/SSE tests in one process pass. Cross-process localhost readiness probes timed out in the managed environment. The local launcher is provided for execution on the user host.'},
    'example':{'recording':'examples/two-branch-example.json','csv':'examples/two-branch-history.csv',
               'defaultRadius':read(ROOT/'examples/default-frame.json')['branches']['gaseous']['apertureRadius'],
               'scriptedExperimentSeconds':12},
}
(ROOT/'validation/verification-summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
files = sorted(p for p in ROOT.rglob('*') if p.is_file() and 'outputs' not in p.relative_to(ROOT).parts and '__pycache__' not in p.relative_to(ROOT).parts and p.name != 'SHA256SUMS.txt')
manifest = ''.join(sha(p)+'  '+p.relative_to(ROOT).as_posix()+'\n' for p in files)
(ROOT/'SHA256SUMS.txt').write_text(manifest,encoding='utf-8')
files.append(ROOT/'SHA256SUMS.txt')
require(not OUTPUT.exists(), 'Release already exists; preserve it rather than replacing it')
OUTPUT.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(OUTPUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in files:
        archive.write(p,'GFM_Aperture_Aggie_Simulator/'+p.relative_to(ROOT).as_posix())
with zipfile.ZipFile(OUTPUT) as archive:
    require(archive.testzip() is None,'ZIP CRC verification failed')
    expected={'GFM_Aperture_Aggie_Simulator/'+p.relative_to(ROOT).as_posix():sha(p) for p in files}
    require(set(archive.namelist()) == set(expected),'ZIP membership differs')
    for name,digest in expected.items():
        require(hashlib.sha256(archive.read(name)).hexdigest() == digest,'ZIP contents differ')
print(json.dumps({'zip':str(OUTPUT),'files':len(files),'bytes':OUTPUT.stat().st_size,'sha256':sha(OUTPUT),'testsPassed':13,'independentSnapshots':summary['independentValidation']['snapshotsChecked'],'browserVerified':False},indent=2))
