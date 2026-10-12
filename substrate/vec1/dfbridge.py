from __future__ import annotations
import json, os, shutil, subprocess, sys, tempfile
from pathlib import Path
from . import binding
ROOT=Path(__file__).resolve().parents[1]
FABRIC=ROOT/'DF_Fabric'
CLI=FABRIC/'adapter/dfabric/cli.py'
NODES_ROOT=ROOT
# Node containers are bound through substrate/NODES.json (see vec1/binding.py) so the
# browser package's existing DF_Small and DF_Medium trees are used in place rather than
# duplicated. Any node without a vendored container stays unbound and fails closed.
def node_vm():
    return dict(binding.node_roots())
NODE_VM=node_vm()
def find_make():
    e=os.environ.get('DF_MAKE')
    if e and (Path(e).exists() or shutil.which(e)): return e
    for name in ('make','mingw32-make','gmake'):
        p=shutil.which(name)
        if p: return p
    return None
def find_sh(): return shutil.which('sh') or shutil.which('bash')
DEFAULT_TIMEOUT=int(os.environ.get('VEC1_TIMEOUT','1800') or 1800)
def run(argv,cwd=None,timeout=None):
    """Run a declared DF host surface. Timeouts and launch failures are reported, never raised."""
    timeout=timeout or DEFAULT_TIMEOUT
    env=binding.apply_env(os.environ.copy())
    sh=find_sh()
    if sh and os.name=='nt': env.setdefault('SHELL',sh)
    argv=[str(x) for x in argv]
    try:
        p=subprocess.run(argv,cwd=str(cwd) if cwd else None,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=timeout,env=env)
    except subprocess.TimeoutExpired as e:
        return {'argv':argv,'returncode':124,'stdout':(e.stdout or '') if isinstance(e.stdout,str) else '','stderr':f'timed out after {timeout}s','timed_out':True}
    except OSError as e:
        return {'argv':argv,'returncode':127,'stdout':'','stderr':f'launch failed: {e}'}
    return {'argv':argv,'returncode':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
def _cli(args, out_path=None, timeout=None):
    argv=[sys.executable,'-B',str(CLI)]+list(args)
    if out_path:
        out_path=Path(out_path); out_path.parent.mkdir(parents=True,exist_ok=True)
        if out_path.exists(): out_path.unlink()  # never read a stale result from an earlier run
        argv += ['--out',str(out_path)]
    r=run(argv,cwd=FABRIC,timeout=timeout)
    data=None
    if out_path and Path(out_path).exists():
        try: data=json.loads(Path(out_path).read_text(encoding='utf-8'))
        except Exception: data={'parse_error':True,'stdout':r['stdout'],'stderr':r['stderr']}
    else:
        try: data=json.loads(r['stdout'])
        except Exception: data={'parse_error':True,'stdout':r['stdout'],'stderr':r['stderr']}
    return r,data
def attest(out_path=None): return _cli(['fabric-attest','--nodes-root',str(NODES_ROOT)],out_path)
def build_required():
    mk=find_make(); rec={'make':mk,'nodes':{},'ok':False}
    if not mk: rec['blocked']='GNU-compatible make not found (set DF_MAKE or install MSYS2/MinGW make)'; return rec
    plans={
      'N_SMALL':['.build/brctl'],
      'N_MEDIUM':['.build/bradmin','.build/brverify'],
      'N_LARGE':['brctl-dev'],
      'N_XLARGE':[],
    }
    ok=True
    roots=node_vm()
    rec['node_binding']=binding.node_report()
    for n,targets in plans.items():
        if n not in roots:
            rec['nodes'][n]={'returncode':3,'blocked':'node container is not bound in this package','binding':rec['node_binding'].get(n)}
            ok=False
            continue
        if not targets: rec['nodes'][n]={'returncode':0,'note':'hosted Python QVM; no native compile required'}; continue
        r=run([mk]+targets,cwd=roots[n]); rec['nodes'][n]=r; ok=ok and r['returncode']==0
    rec['ok']=ok
    return rec
def fabric_run(program, out_path, event_log_path=None, profile='single_process_deterministic', placement='static', strict=True, programs=None):
    args=['fabric-run',str(program),'--nodes-root',str(NODES_ROOT),'--profile',profile,'--placement',placement]
    if programs: args += ['--programs', programs]
    if strict: args.append('--strict')
    if event_log_path: args += ['--event-log',str(event_log_path)]
    if event_log_path and Path(event_log_path).exists(): Path(event_log_path).unlink()
    return _cli(args,out_path)
