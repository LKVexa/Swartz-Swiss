"""Refresh existing declared runtime hashes after an intentional native rebuild."""
from pathlib import Path
import hashlib,json,os,stat
root=Path(__file__).resolve().parents[1]
file=root/'engine/ja21/runtime.integrity.json'
manifest=json.loads(file.read_text(encoding='utf-8'))
gfm=json.loads((root/'GFM/release-manifest.json').read_text(encoding='utf-8'))
paths={item['path'] for item in manifest['files']}
for relative in ['integration/combined-view-probe.js']:
    if relative not in paths:manifest['files'].append({'path':relative});paths.add(relative)
for item in gfm['files']:
    relative='GFM/'+item['path']
    if item['path'].startswith('validation/') or relative in paths: continue
    manifest['files'].append({'path':relative});paths.add(relative)
checked=set()
for item in manifest['files']:
    parts=item['path'].split('/')
    if any(part in {'','..','.'} for part in parts):raise ValueError('Invalid declared runtime path')
    target=root.joinpath(*parts)
    for parent in [target,*target.parents]:
        if parent==root.parent:break
        if parent in checked:continue
        info=parent.lstat()
        if stat.S_ISLNK(info.st_mode) or getattr(info,'st_file_attributes',0)&0x400:raise ValueError('Runtime reparse point rejected: '+str(parent))
        checked.add(parent)
    data=target.read_bytes()
    item.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
temporary=file.with_suffix('.tmp')
temporary.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
os.replace(temporary,file)
print('Refreshed',len(manifest['files']),'declared runtime files.')
