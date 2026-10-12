#!/usr/bin/env python3
import hashlib,json,os,platform,shutil,subprocess,tempfile
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
SRC=['src/brvm.c','src/brtrust.c','host/br_prod_host.c','src/brlctlc.c','host/brctl.c']
ISA=['src/brvm.c','src/brtrust.c','host/br_host.c','tests/isa_abi_conformance.c']
image=BASE/'deploy/BOTTLE_ROCKET_4.7.0_COLUMNED_LCTL_VIRTUAL_DEVICE_IO_SERVICE_ARCHITECTURE.brimg'
signed=BASE/'.build/signed.brimg'
def H(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def run(c,cwd=BASE,timeout=80):return subprocess.run(c,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
def main():
 if not signed.exists(): raise SystemExit('signed fixture missing: run make signed-smoke')
 rows=[]; brims=[]; conf=[]
 with tempfile.TemporaryDirectory() as td:
  for cc in ('gcc','clang'):
   if not shutil.which(cc):
    rows.append({'compiler':cc,'status':'BLOCKED'});continue
   for opt in (0,2,3):
    tag=f'{cc}-O{opt}';ctl=Path(td)/(tag+'-brctl');isa=Path(td)/(tag+'-isa');out=Path(td)/(tag+'.brimg');brir=Path(td)/(tag+'.brir')
    common=[cc,'-DBR_PRODUCTION','-Isrc','-Ihost','-std=c11',f'-O{opt}','-Wall','-Wextra','-Werror','-fno-common','-fstack-protector-strong']
    p=run(common+SRC+['-o',str(ctl),'-lcrypto']);
    if p.returncode: raise SystemExit(tag+' brctl compile failed\n'+p.stderr[-4000:])
    for cmd in ([str(ctl),'verify-lctlc','examples/boot.lctlc'],[str(ctl),'lctl-to-brir','examples/boot.lctlc',str(brir)],[str(ctl),'compile-lctlc','examples/boot.lctlc',str(out)]):
     p=run(cmd)
     if p.returncode: raise SystemExit(tag+' image command failed\n'+p.stderr)
    p=run([cc,'-Isrc','-Ihost','-std=c11',f'-O{opt}','-Wall','-Wextra','-Werror']+ISA+['-o',str(isa),'-lcrypto'])
    if p.returncode: raise SystemExit(tag+' isa compile failed\n'+p.stderr[-4000:])
    p=run([str(isa),str(signed)])
    if p.returncode or '"failures":0' not in p.stdout: raise SystemExit(tag+' conformance failed\n'+p.stdout+p.stderr)
    d=H(out); brims.append(d); conf.append(hashlib.sha256(p.stdout.encode()).hexdigest())
    rows.append({'compiler':cc,'opt':opt,'arch':platform.machine(),'os':platform.system(),'brim_sha256':d,'brim_matches_baseline':Path(out).read_bytes()==image.read_bytes(),'conformance':'PASS'})
 # Same semantic result across compilers/opts; output wording should also be identical.
 same_brim=len(set(brims))==1 and brims[0]==H(image);same_conf=len(set(conf))==1
 aarch=shutil.which('aarch64-linux-gnu-gcc') and shutil.which('qemu-aarch64')
 win=shutil.which('x86_64-w64-mingw32-gcc') and shutil.which('wine')
 result={'suite':'BR-480_CROSS_PLATFORM_REPRO','host':platform.platform(),'machine':platform.machine(),'rows':rows,
  'requirements':{
   'BR-480-13-R01':'OPERATIONAL' if any(r.get('compiler')=='gcc' and r.get('conformance')=='PASS' for r in rows) else 'BLOCKED',
   'BR-480-13-R02':'OPERATIONAL' if any(r.get('compiler')=='clang' and r.get('conformance')=='PASS' for r in rows) else 'BLOCKED',
   'BR-480-13-R03':'OPERATIONAL' if platform.machine() in ('x86_64','AMD64') else 'BLOCKED',
   'BR-480-13-R04':'BLOCKED' if not aarch else 'NOT_RUN',
   'BR-480-13-R05':'OPERATIONAL' if platform.system()=='Linux' else 'BLOCKED',
   'BR-480-13-R06':'BLOCKED' if not win else 'NOT_RUN',
   'BR-480-13-R07':'OPERATIONAL' if len(rows)>=6 else 'PARTIAL',
   'BR-480-14-R01':'BLOCKED_NO_INDEPENDENT_MACHINE',
   'BR-480-14-R02':'BLOCKED_NO_INDEPENDENT_OPERATOR',
   'BR-480-14-R03':'OPERATIONAL' if same_brim else 'REGRESSED',
   'BR-480-14-R04':'OPERATIONAL' if same_brim else 'REGRESSED',
   'BR-480-14-R05':'OPERATIONAL' if same_conf else 'REGRESSED'},
  'same_brim_all_available_builds':same_brim,'same_conformance_output_all_available_builds':same_conf,
  'aarch64_toolchain_runtime_available':bool(aarch),'windows_cross_runtime_available':bool(win)}
 print(json.dumps(result,sort_keys=True))
 if not same_brim or not same_conf:return 1
 return 0
if __name__=='__main__':raise SystemExit(main())
