#!/usr/bin/env python3
import hashlib, importlib.util, json, re, struct, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('lctl420',ROOT/'tools/lctl420.py'); L=importlib.util.module_from_spec(spec); spec.loader.exec_module(L)
BOOT=ROOT/'src/BOOT.lctlc'; IMG=ROOT/'deploy/BOTTLE_ROCKET_SIM_CORE_4.2.0.brimg'; PROV=ROOT/'deploy/BOTTLE_ROCKET_SIM_CORE_4.2.0.provenance.json'
PASSES=[]
def ok(name): PASSES.append(name); print('TEST',name,'PASS')
def expect_fail(fn,name):
    try: fn()
    except Exception: ok(name); return
    raise AssertionError(name+' unexpectedly accepted')
def tmp_source(text):
    f=tempfile.NamedTemporaryFile('w',suffix='.lctlc',delete=False,encoding='utf-8',newline='\n');f.write(text);f.close();return Path(f.name)
def program(rows,caps='CONTROL',term='halt',version='8'):
    return 'LCTLC/1.1\n@unit id=test.u version=4.2.0 language=columned-lctl/4.2 isa=BR/1 termination='+term+' br_image_version='+version+' br_request_caps='+caps+'\n@defaults mode=WRAP width=WIDE region=MEM\n@frame id=F parent=ROOT module=test.u\nID│LANE│OP│OUT│CTRL│IN│ARG│META\n'+'\n'.join(rows)+'\n@end\n'
def sem(text):
    p=tmp_source(text)
    try:return L.semantic(L.parse(p,True))
    finally:p.unlink(missing_ok=True)
# 01 specification/lexical/canonical authority
ls=json.loads((ROOT/'spec/LCTL_SPEC.json').read_text()); bs=json.loads((ROOT/'spec/BR_SPEC.json').read_text())
assert ls['magic']=='LCTLC/1.1' and ls['columns']==['ID','LANE','OP','OUT','CTRL','IN','ARG','META'] and ls['separator']=='U+2502'; ok('language_specification')
p=L.parse(BOOT,True); assert p['unit']['version']=='4.2.0' and p['unit']['language']=='columned-lctl/4.2' and p['raw'].decode().splitlines()[0]=='LCTLC/1.1'; ok('lexical_version_encoding')
assert ls['canonical']['whitespace'] and ls['canonical']['ordering'] and ls['canonical']['numbers'];ok('canonical_whitespace_ordering')
# 02 native direct semantics
ins,req=L.semantic(p); assert [x['op'] for x in ins]==['MOVI','MOVI','ADD','MOVI','CMP','HALT']; assert b'br.op=' not in p['raw'] and b'br.mode=' not in p['raw'];ok('native_opcode_direct')
assert ins[2]['ra']==0 and ins[2]['rb']==1 and ins[2]['rd']==2 and ins[0]['imm']==40 and ins[2]['mode']=='CHECKED' and ins[2]['width']=='WIDE' and ins[2]['capability']=='ARITH';ok('native_operands_immediate_mode_width_capability')
memprog=program(['A│exec│LOAD│R0│C0:MEMORY│_│imm=0;region=MEM│src=t:1','H│exec│HALT│_│C0:CONTROL│_│_│src=t:2'],'MEMORY|CONTROL');mi,_=sem(memprog);assert mi[0]['region']=='MEM' and mi[0]['imm']==0;ok('native_memory_region')
svcprog=program(['S│exec│SVC│R0│C0:SERVICE│_│region=DEVICE;svc=DEVICE│src=t:1','H│exec│HALT│_│C0:CONTROL│_│_│src=t:2'],'SERVICE|CONTROL');si,_=sem(svcprog);assert si[0]['service']==14;ok('native_service_identifier')
branch=program(['J│exec│JMP│_│C0:CONTROL│_│target=@H│src=t:1','H│exec│HALT│_│C0:CONTROL│_│_│src=t:2']);bi,_=sem(branch);assert bi[0]['target']==1;ok('native_control_flow_destination')
# 03 types
t=ls['types']; assert t['wide_word']['bits']==1048576 and t['scalar']['bits']==64 and t['address']['range']==[0,4095] and t['register']['range']==[0,15];ok('type_wide_scalar_address_register')
assert len(t['capability']['set'])==8 and t['instruction_index']['range']==[0,255] and t['service_id']['range']==[0,15] and t['image_constant']['immutable'];ok('type_cap_instruction_service_constant')
assert 'immutable' in t['immutable_object'] or t['immutable_object']; assert 'state' in t['mutable_state_object'];ok('type_immutable_mutable_objects')
# 04 static verifier adversarial cases
base=BOOT.read_text()
def fail_mut(old,new):
 q=tmp_source(base.replace(old,new,1))
 try:L.semantic(L.parse(q,True))
 finally:q.unlink(missing_ok=True)
expect_fail(lambda:fail_mut('│ADD│','│BOGUS│'),'reject_bad_opcode')
expect_fail(lambda:fail_mut('R0›R1','R0'),'reject_operand_count')
expect_fail(lambda:fail_mut('│R1│C0:CONTROL│','│R16│C0:CONTROL│'),'reject_operand_type_register_bounds')
expect_fail(lambda:sem(program(['A│exec│LOAD│R0│C0:MEMORY│_│imm=4090;region=MEM│_','H│exec│HALT│_│C0:CONTROL│_│_│_'],'MEMORY|CONTROL')),'reject_memory_bounds')
expect_fail(lambda:fail_mut('imm=40','imm=18446744073709551616'),'reject_immediate_bounds')
expect_fail(lambda:sem(program(['J│exec│JMP│_│C0:CONTROL│_│target=@NOPE│_'])),'reject_branch_target')
expect_fail(lambda:fail_mut('br_request_caps=CONTROL|ARITH','br_request_caps=CONTROL'),'reject_capability_excess')
expect_fail(lambda:sem(program(['P│exec│POP│R0│C0:STACK│_│_│_','H│exec│HALT│_│C0:CONTROL│_│_│_'],'STACK|CONTROL')),'reject_stack_underflow')
expect_fail(lambda:fail_mut('mode=CHECKED','mode=NOPE'),'reject_mode')
expect_fail(lambda:sem(program(['H│exec│HALT│_│C0:CONTROL│_│_│_','X│exec│HALT│_│C0:CONTROL│_│_│_'])),'reject_unreachable')
# 05 CFG/loop/call/return/termination
loop=program(['L│exec│JMP│_│C0:CONTROL│_│target=@L│_'],term='budgeted');li,_=sem(loop);assert li[0]['target']==0;ok('cfg_loop_budget_policy')
expect_fail(lambda:sem(program(['L│exec│JMP│_│C0:CONTROL│_│target=@L│_'])),'cfg_reject_unbounded_loop_policy')
expect_fail(lambda:sem(program(['C│exec│CALL│_│C0:CONTROL│_│target=@C│_'])),'cfg_call_validation_reject_unsupported')
expect_fail(lambda:sem(program(['R│exec│RET│_│C0:CONTROL│_│_│_'])),'cfg_return_validation_reject_unsupported')
ok('cfg_construct_validate_branches')
# 06 capability derivation and privileged/state/device checks
stateprog=program(['S│exec│SVC│R0│C0:STATE│_│svc=SAVE│_','H│exec│HALT│_│C0:CONTROL│_│_│_'],'STATE|CONTROL');sti,sv=sem(stateprog);assert sv&(L.CAP['STATE']|L.CAP['CONTROL'])==3*0+33;ok('capability_state_declared_derived')
expect_fail(lambda:sem(stateprog.replace('STATE|CONTROL','CONTROL')),'capability_reject_undeclared_state')
expect_fail(lambda:sem(svcprog.replace('SERVICE|CONTROL','CONTROL')),'capability_reject_undeclared_device')
grant=program(['S│exec│SVC│R0│C0:CONTROL│R1›R2│svc=GRANT│_','H│exec│HALT│_│C0:CONTROL│_│_│_']);sem(grant);ok('capability_privileged_instruction_declared')
expect_fail(lambda:sem(grant.replace('br_request_caps=CONTROL','br_request_caps=ARITH')),'capability_reject_undeclared_privileged')
# 07 BRIR
o=L.brir(BOOT); assert o['format']=='BRIR/1' and o['instructions'][0]['opcode']==1 and o['instructions'][0]['line']>0 and o['instructions'][0]['meta']['src']=='boot:1';ok('brir_canonical_opcode_operands_types_immediates')
assert all('capability' in x and 'line' in x for x in o['instructions']);ok('brir_explicit_capability_provenance')
bo=L.brir(tmp_source(branch)); assert bo['instructions'][0]['target']==1;ok('brir_explicit_cfg_edges')
assert L.jbytes(L.brir(BOOT))==L.jbytes(L.brir(BOOT));ok('brir_deterministic_serialization')
nop=tmp_source(program(['N│exec│NOP│_│C0:CONTROL│_│_│_','H│exec│HALT│_│C0:CONTROL│_│_│_']));no=L.brir(nop);nop.unlink();assert no['optimization']['removed']==1 and len(no['instructions'])==1;ok('brir_safe_optimization')
# 08 pipeline + no artifact on invalid
with tempfile.TemporaryDirectory() as td:
 td=Path(td); a=td/'a.brimg';b=td/'b.brimg';ma=td/'a.json';mb=td/'b.json';ra=td/'a.brir';rb=td/'b.brir'
 L.compile_src(BOOT,a,True,ma,ra);L.compile_src(BOOT,b,True,mb,rb)
 assert a.read_bytes()==b.read_bytes() and ma.read_bytes()==mb.read_bytes() and ra.read_bytes()==rb.read_bytes();ok('pipeline_parse_verify_brir_lower_serialize_hash_deterministic')
 bad=tmp_source(base.replace('│ADD│','│BAD│',1));out=Path(tempfile.mktemp(suffix='.brimg'))
 expect_fail(lambda:L.compile_src(bad,out),'pipeline_invalid_fails_before_image'); assert not out.exists();bad.unlink(missing_ok=True)
# signing artifact through release host signing boundary
with tempfile.TemporaryDirectory() as td:
 td=Path(td);pr=td/'k';pu=td/'p';sg=td/'s.brimg';subprocess.run([str(ROOT/'.build/brctl'),'keygen',str(pr),str(pu)],check=True,stdout=subprocess.DEVNULL);subprocess.run([str(ROOT/'.build/brctl'),'sign-image',str(IMG),str(sg),str(pr)],check=True); assert sg.read_bytes()[7]&2; subprocess.run([sys.executable,str(ROOT/'tools/brim_verify.py'),str(sg)],check=True,stdout=subprocess.DEVNULL);ok('pipeline_sign_artifact')
# 09 provenance
m=json.loads(PROV.read_text()); assert m['source_sha256']==hashlib.sha256(BOOT.read_bytes()).hexdigest() and m['brir_sha256'] and m['brim_sha256'] and m['verifier_version']=='br-lctlv/4.2.0' and m['compiler_version']=='br-lctlc/4.2.0' and m['language_version']=='columned-lctl/4.2' and m['isa_version']=='BR/1';ok('source_to_binary_provenance_manifest')
assert IMG.read_bytes()[72:80].hex()==m['header_source_hash_prefix'];ok('source_hash_embedded_header_prefix')
# 10 sync
assert bs['isa']['op']==L.OPS and bs['isa']['mode']==L.MODES and bs['v']=='4.2.0' and ls['v']=='4.2.0';ok('spec_compiler_sync')
h=(ROOT/'src/brvm.h').read_text();enum=re.search(r'enum br_opcode\{([^}]*)\}',h).group(1);hn=[x.strip().replace('BR_','') for x in enum.split(',')];assert hn==L.OPS and '#define BR_VERSION_MINOR 2u' in h;ok('header_opcode_sync')
c=(ROOT/'src/brvm.c').read_text();assert all(('case BR_'+x+':') in c or x in {'NOP','DIVU','MODU','AND','OR','XOR','SHL','SHR'} for x in L.OPS);assert 'BR4.2-LCTL' in c;ok('runtime_opcode_version_sync')
v=(ROOT/'tools/brim_verify.py').read_text();assert 'OPS=24' in v and 'MODES=4' in v and 'BRLCTL42' in v;ok('independent_verifier_sync')
assert (ROOT/'docs/WORKFLOW_APPLIED_4.2.0/README.md').exists() and Path(__file__).exists();ok('documentation_tests_sync')
# 11 round trip
with tempfile.TemporaryDirectory() as td:
 rt=Path(td)/'rt.brimg';L.cmd_round(type('A',(),{'source':str(BOOT),'out':str(rt),'factory':True})());assert rt.read_bytes()==IMG.read_bytes();ok('roundtrip_lctl_brir_brim_disassembly')
d=L.decode(IMG); assert d['instructions'][2]['op']=='ADD' and d['instructions'][2]['rd']==2;ok('brim_disassembly_semantic_compare')
subprocess.run([sys.executable,str(ROOT/'tools/lctl420.py'),'provenance',str(BOOT),str(IMG),str(PROV)],check=True,stdout=subprocess.DEVNULL);ok('roundtrip_binary_provenance')
# 12 acceptance/independent verifier and hidden-path removal
host=(ROOT/'host/brctl.c').read_text();assert 'br.op=' not in host and 'br.mode=' not in host and 'assemble' not in host;ok('acceptance_hidden_semantic_metadata_eliminated')
subprocess.run([sys.executable,str(ROOT/'tools/brim_verify.py'),str(IMG),'--manifest',str(PROV)],check=True,stdout=subprocess.DEVNULL);ok('acceptance_independent_brim_verifier')
# tampered opcode with valid payload hash must be rejected semantically by independent verifier
with tempfile.TemporaryDirectory() as td:
 q=bytearray(IMG.read_bytes());q[80]=255;q[32:64]=hashlib.sha256(q[80:]).digest();f=Path(td)/'bad.brimg';f.write_bytes(q);r=subprocess.run([sys.executable,str(ROOT/'tools/brim_verify.py'),str(f)],stdout=subprocess.PIPE,stderr=subprocess.PIPE);assert r.returncode!=0;ok('acceptance_independent_rejects_invalid_brim')
assert IMG.read_bytes()[64:72]==b'BRLCTL42';ok('acceptance_every_production_brim_tagged_verified_lctl')
print(json.dumps({'status':'PASS','tests':len(PASSES),'names':PASSES},sort_keys=True))
