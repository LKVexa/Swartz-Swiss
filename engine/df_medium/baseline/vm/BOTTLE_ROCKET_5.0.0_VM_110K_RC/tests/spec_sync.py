#!/usr/bin/env python3
import json,re
from pathlib import Path
r=Path(__file__).resolve().parents[1]
h=(r/'src/brvm.h').read_text(); c=(r/'src/brlctlc.c').read_text(); v=(r/'host/brverify.c').read_text(); b=json.loads((r/'spec/BR_SPEC.json').read_text()); l=json.loads((r/'spec/LCTLC_1_1.json').read_text()); rd=(r/'README.md').read_text()
def m(n):
 x=re.search(r'^#define\s+'+re.escape(n)+r'\s+([^\s]+)',h,re.M); assert x,n; return int(x.group(1).rstrip('uU'),0)
assert (m('BR_VERSION_MAJOR'),m('BR_VERSION_MINOR'),m('BR_VERSION_PATCH'))==(4,7,0)
assert m('BR_CORE_ABI')==b['core_abi']==0x00040700 and m('BR_IMAGE_ABI')==b['image_abi']==1
assert (m('BR_ISA_MAJOR'),m('BR_ISA_MINOR'))==(b['isa']['major'],b['isa']['minor'])==(4,1)
assert (m('BR_ABI_MAJOR'),m('BR_ABI_MINOR'),m('BR_ABI_VERSION'))==(b['abi']['major'],b['abi']['minor'],b['abi']['version'])==(1,0,0x10000)
assert m('N32')==b['machine']['word_bits']==1048576 and m('N43')==b['machine']['registers']==16 and m('N71')==b['machine']['capability_registers']==16
assert m('K3')==b['machine']['memory_bytes']==4096 and m('N69')==b['abi']['data_stack_words']==256 and m('N75')==b['abi']['call_stack_entries']==64
assert m('N28')==b['isa']['opcode_count']==len(l['isa']['opcodes'])==32 and m('N30')==24
assert m('N55')==b['services']['count']==len(l['isa']['services'])==20 and m('N36')==b['image']['provenance_bytes']==l['provenance']['bytes']==96
em=re.search(r'enum br_opcode\s*\{([^}]*)\}',h); assert em
ops=b['isa']['opcodes']; assert ops==l['isa']['opcodes'] and len(em.group(1).split(','))==32
sm=re.search(r'enum br_service_id\s*\{([^}]*)\}',h); assert sm
sv=b['services']['ids']; assert sv==l['isa']['services'] and len(sm.group(1).split(','))==20
for op in ops: assert f'"{op}"' in c and f'"{op}"' in v,op
assert b['language']['brir']=='BRIR/1.1'==l['brir']['version'] and l['unit']['required']['version']=='4.7.0'
for p in ['examples/boot.lctlc','src/CORE.lctlc']:
 s=(r/p).read_text(); assert s.startswith('LCTLC/1.1\n') and 'version=4.7.0' in s and 'f=MODEL' not in s and 'p=brvm:' not in s
assert 'ISA 4.1' in rd and 'ABI 1.0' in rd and 'BRPV/1' in rd
assert b['isa']['deprecation']['active']==[] and b['compatibility']['BRIM_4_1_0'] and b['compatibility']['BRIM_4_2_0']
assert set(b['isa']['feature_flags'])=={'CALL_RET','INDEXED_MEMORY','SYSTEM','STRICT_ALIGN','SERVICE_ABI','TRAP_TABLE'}
assert len(b['traps']['required'])==14 and len(json.loads((r/'conformance/ISA_ABI_CORPUS_4_3_0.json').read_text())['positive_opcode_vectors'])==32
assert b['wide_state']['zero_init_wide_heap_bytes']==0 and b['wide_state']['word_bytes']==131072
assert b['device_abi']['v']==m('BR_DABI')==0x10000 and len(b['device_abi']['d'])==8
assert b['device_abi']['d'][-1][0]==0x4708 and b['device_abi']['d'][-1][2]&8 and b['device_abi']['m']==[256,512]
assert b['device_abi']['q']==[64,8192,16,8,4] and b['device_abi']['n']==0
assert b['apdu_security']==[1,1,0,1,1]
print('BR-470 specification synchronization: PASS isa=4.1 abi=1.0 devices=8 opcodes=32 services=20 traps=14')
