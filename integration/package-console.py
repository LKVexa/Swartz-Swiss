"""Seal and archive the integrated console, including all immutable native dependencies."""
from pathlib import Path
import hashlib,json,os,re,stat,zipfile

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'outputs'
OUTPUT.mkdir(exist_ok=True)
EXCLUDED={'.git','.hg','.svn','__pycache__','.pytest_cache','logs'}
files=[]
seen=set()
for folder,directories,names in os.walk(ROOT,followlinks=False):
    parent=Path(folder)
    directories[:]=sorted(name for name in directories if name not in EXCLUDED and not (parent==ROOT and name in {'workspace','outputs','work'}))
    for name in directories:
        info=(parent/name).lstat()
        if stat.S_ISLNK(info.st_mode) or getattr(info,'st_file_attributes',0)&0x400:raise ValueError('Package reparse directory rejected')
    for name in sorted(names):
        file=parent/name;relative=file.relative_to(ROOT).as_posix()
        if relative in {'package.integrity.json','GFM/validation/desktop-publish.json'} or name.endswith(('.pyc','.tmp')) or name=='.vec1.lock':continue
        info=file.lstat()
        if not stat.S_ISREG(info.st_mode) or getattr(info,'st_file_attributes',0)&0x400:raise ValueError('Nonregular packaged file: '+relative)
        key=relative.casefold()
        if key in seen:raise ValueError('Windows path collision: '+relative)
        seen.add(key)
        for part in relative.split('/'):
            if not part or part in {'.','..'} or re.search(r'[<>:"\\|?*]',part) or part[-1] in '. ' or re.match(r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)',part,re.I):raise ValueError('Unsafe Windows path: '+relative)
        if len(str(file))>240 or len(relative)>150:raise ValueError('Overlong package member: '+relative)
        data=file.read_bytes()
        files.append({'path':relative,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
manifest={'format':'vb-ja21-package/5','product':'JA21 GFM Console','version':'9.8.7','consoleVersion':'2.0.0','simulatorVersion':'2.1.0','files':files}
(ROOT/'package.integrity.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
runtime=json.loads((ROOT/'engine/ja21/runtime.integrity.json').read_text(encoding='utf-8'))
for item in runtime['files']:
    data=(ROOT/item['path']).read_bytes()
    if len(data)!=item['bytes'] or hashlib.sha256(data).hexdigest()!=item['sha256']:raise ValueError('Runtime changed after sealing: '+item['path'])
archive=OUTPUT/'GFM-Blackhole-Console-v2.0.0.zip'
if archive.exists():raise FileExistsError('Preserving the existing package: '+str(archive))
members=files+[{'path':'package.integrity.json','sha256':hashlib.sha256((ROOT/'package.integrity.json').read_bytes()).hexdigest()}]
with zipfile.ZipFile(archive,'x',zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as packed:
    for item in members:packed.write(ROOT/item['path'],'GFM-Blackhole-Console/'+item['path'])
with zipfile.ZipFile(archive) as packed:
    if packed.testzip() is not None:raise ValueError('Archive CRC mismatch')
    for item in members:
        if hashlib.sha256(packed.read('GFM-Blackhole-Console/'+item['path'])).hexdigest()!=item['sha256']:raise ValueError('Archive digest mismatch: '+item['path'])
receipt={'schema':'GFM-JA21-archive/1','archive':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'members':len(members),'runtimeSealedFiles':len(runtime['files']),'allMemberCRCsVerified':True,'allMemberSHA256Verified':True,'longestRelativePath':max(len(item['path']) for item in members),'longestInstalledPath':max(len(str(ROOT/item['path'])) for item in members),'originalZipPreserved':True}
(OUTPUT/'GFM-Blackhole-Console-v2.0.0.receipt.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
print(json.dumps(receipt,indent=2))
