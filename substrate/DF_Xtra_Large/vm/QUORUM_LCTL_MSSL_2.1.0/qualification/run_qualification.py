#!/usr/bin/env python3
from pathlib import Path
import json,hashlib,re,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
mods=json.loads((ROOT/'registry/modules.json').read_text())['modules']
if len(mods)!=66: errors.append('MODULE_COUNT')
for m in mods:
 p=ROOT/m['module_path']
 for rel in ['authority/module.mssl','authority/io_contract.mssl','authority/state_contract.mssl','authority/operator_contract.mssl','authority/policy_contract.mssl','authority/invariants.mssl','graph/graph_manifest.json','graph/lowering_map.json','execution/module.lctlc','execution/module.lctl','execution/optimized.lctlc','execution/optimized.lctl','fixtures/positive/nominal.json','fixtures/negative/malformed.json','evidence/qualification_ledger.json','package/MANIFEST.json']:
  if not (p/rel).exists(): errors.append(f'MISSING {m["id"]} {rel}')
 g=json.loads((p/'graph/graph_manifest.json').read_text())
 if len(g['nodes'])<8 or len(g['edges'])!=len(g['nodes'])-1: errors.append(f'GRAPH {m["id"]}')
 s=(p/'execution/module.lctlc').read_text()
 if s.count('│.│')!=1 or 'justification=canonical_entry_sentinel' not in s: errors.append(f'NOP_POLICY {m["id"]}')
 for q in (p/'authority').glob('*.mssl'):
  b=q.read_bytes()
  try:
   st=b.index('α≡'.encode()); en=b.index(',κ≡'.encode()); got=hashlib.sha256(b[st:en]).hexdigest(); mm=re.search(rb'\xce\xba\xe2\x89\xa1"sha256:([0-9a-f]{64})"',b)
   if not mm or mm.group(1).decode()!=got: errors.append(f'MSSL_SEAL {q.relative_to(ROOT)}')
  except Exception: errors.append(f'MSSL_PARSE {q.relative_to(ROOT)}')
led=json.loads((ROOT/'evidence/LCTL_VERIFICATION_LEDGER.json').read_text())
if not led.get('all_pass') or led.get('count')!=133: errors.append('LCTL_LEDGER')
if errors:
 print('FAIL'); [print(e) for e in errors]; sys.exit(1)
print('PASS: 66 deep module packages, MSSL seals, graph/NOP policy, and 133-source LCTL verifier ledger')
