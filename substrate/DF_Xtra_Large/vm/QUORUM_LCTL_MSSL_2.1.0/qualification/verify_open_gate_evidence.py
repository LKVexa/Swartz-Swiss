#!/usr/bin/env python3
from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]
Q=ROOT/'qualification/open_gates'
errors=[]
summary=json.loads((Q/'OPEN_GATE_SUMMARY_2.1.0.json').read_text())
expected={'module_count':66,'L4_reference_pass':66,'L5_source_diff_pass':66,'L6_reference_replay_pass':66,'L7_reference_security_pass':66,'L8_reference_performance_pass':66,'L9_scenarios_pass':5,'L9_scenarios_total':5,'L9_local_reference_operational_profile':'PASS'}
for k,v in expected.items():
    if summary.get(k)!=v: errors.append(f'SUMMARY {k}: {summary.get(k)!r} != {v!r}')
mat=json.loads((Q/'L4_L9_OPEN_GATE_MATRIX_2.1.0.json').read_text())
for level in ('L4','L5','L6','L7','L8','L9'):
    if mat.get('repository_gates',{}).get(level,{}).get('availability')!='OPEN': errors.append(f'{level} NOT OPEN')
if len(mat.get('modules',[]))!=66: errors.append('MODULE MATRIX COUNT')
for m in mat.get('modules',[]):
    d=ROOT/m['evidence_dir']
    req=['l4_nominal.json','l4_negative.json','l4_edge.json','l5_source_differential.json','l6_replay.json','l7_security.json','l8_performance.json','qualification_2_1_0.json']
    for n in req:
        if not (d/n).exists(): errors.append(f'MISSING {m["directory"]}/{n}')
    try:
        if json.loads((d/'l4_nominal.json').read_text()).get('status')!='PASS': errors.append(f'L4 NOMINAL {m["directory"]}')
        if json.loads((d/'l4_negative.json').read_text()).get('status')!='DENIED': errors.append(f'L4 NEGATIVE {m["directory"]}')
        if json.loads((d/'l5_source_differential.json').read_text()).get('status')!='PASS': errors.append(f'L5 {m["directory"]}')
        if not json.loads((d/'l6_replay.json').read_text()).get('exact'): errors.append(f'L6 {m["directory"]}')
        if json.loads((d/'l7_security.json').read_text()).get('status')!='PASS': errors.append(f'L7 {m["directory"]}')
        if not json.loads((d/'l8_performance.json').read_text()).get('deterministic_result_hash'): errors.append(f'L8 {m["directory"]}')
    except Exception as e: errors.append(f'PARSE {m["directory"]}: {e}')
native=json.loads((Q/'NATIVE_RUNTIME_EVIDENCE_INDEX_2.1.0.json').read_text())
if native.get('summary',{}).get('all_core_pass_count')!=66 or not native.get('summary',{}).get('all_pass'): errors.append('NATIVE CORE INDEX')
sc=json.loads((Q/'L9_REFERENCE_SCENARIO_RESULTS_2.1.0.json').read_text())
if len(sc.get('scenarios',[]))!=5 or not all(x.get('status')=='PASS' and x.get('exact_replay') for x in sc.get('scenarios',[])): errors.append('L9 SCENARIOS')
if errors:
    print('FAIL: L4-L9 open-gate evidence')
    for e in errors: print(e)
    sys.exit(1)
print('PASS: L4-L9 gates OPEN; L4-L8 module reference profiles 66/66; L9 local/offline scenarios 5/5; native core index 66/66')
