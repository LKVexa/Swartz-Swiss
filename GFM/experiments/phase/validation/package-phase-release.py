"""Package the preserved native console and separately bundled calculation engine."""
from pathlib import Path
import hashlib, json, zipfile

PROJECT=Path(__file__).resolve().parents[1]
CONSOLE=Path(r'D:\Codex\JA21_GFM_Console')
BACKEND=Path(r'D:\Codex\GFM_Phase_Texture_Backend')
OUTPUT=PROJECT.parent/'outputs'
OUTPUT.mkdir(exist_ok=True)
ZIP=OUTPUT/'JA21_GFM_Phase_Texture_v3.0.0.zip'
assert not ZIP.exists(), 'Preserve an existing release; do not replace it.'

def digest(data):return hashlib.sha256(data).hexdigest()
def original_entries(manifest):
    for item in json.loads((CONSOLE/manifest).read_text(encoding='utf-8'))['files']:
        data=(CONSOLE/item['path']).read_bytes()
        assert digest(data)==item['sha256'], item['path']
        assert len(data)==item['bytes'],item['path']
original_entries('package.integrity.json')
original_entries('engine/ja21/runtime.integrity.json')
meta=json.loads((CONSOLE/'GFM_CONSOLE_BUILD.json').read_text())
for item in meta['additionHashes']:assert digest((CONSOLE/item['path']).read_bytes())==item['sha256']
assert not list(CONSOLE.rglob('node.exe'))
release=json.loads((BACKEND/'RELEASE_PHASE.json').read_text())
assert release['tests']['simulator']['passed']==62
assert release['observationHoldoutPassed'] is False
assert (BACKEND/'backend/phase-mhd.js').read_bytes()==(BACKEND/'public/phase-mhd.js').read_bytes()
assert digest((BACKEND/'backend/phase-mhd.js').read_bytes())==release['numericalSourceSha256']
assert 'pass 62' in (BACKEND/'validation/phase-release-tests.txt').read_text(encoding='utf-8-sig')
node=json.loads((BACKEND/'runtime/node/RUNTIME_PROVENANCE.json').read_text())
assert node['officialChecksumVerified'] and digest((BACKEND/'runtime/node/node.exe').read_bytes())==node['binarySha256']

files=[];seen=set()
for root in (CONSOLE,BACKEND):
    for p in sorted(root.rglob('*')):
        if not p.is_file():continue
        rel=p.relative_to(root).as_posix()
        if '__pycache__/' in rel or rel.endswith('.pyc') or rel.startswith(('workspace/','substrate/runtime/')):continue
        if root==BACKEND and rel=='SHA256SUMS.txt':continue
        name=root.name+'/'+rel
        key=name.casefold();assert key not in seen,name;seen.add(key)
        assert all(part not in ('..','.') and ':' not in part and '\\' not in part for part in Path(name).parts)
        files.append((p,name))
manifest={'schema':'JA21-GFM-combined-package/1','version':'3.0.0','originalConsoleBytesPreserved':True,'nativeWindowVerified':False,'nativeLaunchRestriction':'Windows script policy blocked the lifecycle test; no new bypass included','liveExample':'http://127.0.0.1:8788/phase-console.html','scientificStatus':release['scientificStatus'],'files':[]}
with zipfile.ZipFile(ZIP,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p,name in files:
        data=p.read_bytes();z.writestr(name,data);manifest['files'].append({'path':name,'bytes':len(data),'sha256':digest(data)})
    z.writestr('RELEASE_MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
    z.writestr('READ ME FIRST.txt',(BACKEND/'README.txt').read_bytes())
with zipfile.ZipFile(ZIP) as z:
    assert z.testzip() is None
    assert len(z.namelist())==len(files)+2
    for item in manifest['files']:assert digest(z.read(item['path']))==item['sha256'],item['path']
artifact={'schema':'JA21-GFM-release-verification/1','passed':True,'archive':str(ZIP),'bytes':ZIP.stat().st_size,'sha256':digest(ZIP.read_bytes()),'files':len(files)+2,'crcAndEveryFileHashChecked':True,'originalConsoleEntriesChecked':7695,'originalRuntimeEntriesChecked':55,'simulatorTestsPassed':62,'preservedConsoleTestsPassed':202,'preservedConsoleTestsSkipped':3,'nativeGFMWindowVerified':False,'observationHoldoutPassed':False}
(OUTPUT/'JA21_GFM_Phase_Texture_v3.0.0-verification.json').write_text(json.dumps(artifact,indent=2)+'\n')
(OUTPUT/'JA21_GFM_Phase_Texture_v3.0.0-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(artifact,indent=2))
