#!/usr/bin/env python3
import hashlib,importlib.util,json,subprocess,sys,tempfile
from pathlib import Path
R=Path(__file__).resolve().parents[1];P=[]
spec=importlib.util.spec_from_file_location('lctl430',R/'tools/lctl430.py');L=importlib.util.module_from_spec(spec);spec.loader.exec_module(L)
def ok(n):P.append(n);print('PASS',n)
def reject(text,n):
 with tempfile.NamedTemporaryFile('w',suffix='.lctlc',delete=False,encoding='utf8') as f:f.write(text);p=Path(f.name)
 try:
  try:L.semantic(L.parse(p,True))
  except Exception:ok(n);return
  raise AssertionError(n)
 finally:p.unlink(missing_ok=True)
b=R/'src/BOOT.lctlc';raw=b.read_text();q=L.parse(b,True);ins,caps=L.semantic(q);fx=R/'baseline/4.4.0/BOOT.lctlc';fraw=fx.read_text();bs=json.loads((R/'spec/BR_SPEC.json').read_text());ls=json.loads((R/'spec/LCTL_SPEC.json').read_text())
assert q['unit']['version']=='4.3.0' and q['unit']['language']=='columned-lctl/4.3' and q['unit']['isa']=='BR/1.1' and raw.startswith('LCTLC/1.2\n');ok('versioned_native_lctl_43')
assert len(L.OPS)==41 and L.OPS==bs['isa']['opcode'];ok('isa_41_sync')
assert len(L.SVC)==22 and bs['service']['version']==2;ok('service_abi_22_sync')
assert len(bs['trap']['canonical_required'])==14 and bs['abi']['version']==2;ok('trap_abi_contract')
assert [x['op'] for x in ins]==['MOVI','HALT'] and caps==1;ok('native_semantic_columns')
assert 'br.op=' not in raw and 'br.mode=' not in raw;ok('no_hidden_carrier')
reject(fraw.replace('LCTLC/1.2','LCTLC/1.1',1),'reject_legacy_source_magic')
reject(fraw.replace('│ADD│','│BOGUS│',1),'reject_unknown_opcode')
reject(fraw.replace('R0›R1','R0›R16',1),'reject_register_bounds')
reject(fraw.replace('mode=CHECKED','mode=NOPE',1),'reject_unknown_mode')
reject(fraw.replace('br_request_caps=CONTROL|ARITH','br_request_caps=CONTROL',1),'reject_missing_capability')
reject(fraw.replace('imm=40','imm=18446744073709551616',1),'reject_immediate_overflow')
with tempfile.TemporaryDirectory() as td:
 td=Path(td);a=td/'a';c=td/'c';ma=td/'ma';mc=td/'mc';ba=td/'ba';bc=td/'bc'
 L.compile_src(fx,a,True,ma,ba);L.compile_src(fx,c,True,mc,bc);assert a.read_bytes()==c.read_bytes() and ma.read_bytes()==mc.read_bytes() and ba.read_bytes()==bc.read_bytes();ok('deterministic_compile')
 subprocess.run([sys.executable,str(R/'tools/brim_verify.py'),str(a),'--manifest',str(ma)],check=True,stdout=subprocess.DEVNULL);ok('independent_current_verify')
 x=bytearray(a.read_bytes());x[80]=255;x[32:64]=hashlib.sha256(x[80:]).digest();bad=td/'bad';bad.write_bytes(x);assert subprocess.run([sys.executable,str(R/'tools/brim_verify.py'),str(bad)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode!=0;ok('independent_semantic_rejection')
legacy=R/'tests/legacy_4_2.brimg'
if legacy.exists():subprocess.run([sys.executable,str(R/'tools/brim_verify.py'),str(legacy)],check=True,stdout=subprocess.DEVNULL);ok('legacy_42_explicit_verify')
assert bs['image']['abi']==2 and bs['image']['isa_marker']==21 and bs['image']['tag']=='BRLCTL43';ok('image_contract')
assert ls['magic']=='LCTLC/1.2' and ls['types']['service']==[0,21];ok('language_spec_contract')
assert bs['isa']['decisions']['MIN_MAX'].startswith('omitted') and bs['isa']['decisions']['POPCOUNT'].startswith('omitted');ok('optional_opcode_decisions')
print(json.dumps({'suite':'BR-430-semantic','tests':len(P),'result':'PASS','names':P},sort_keys=True))
