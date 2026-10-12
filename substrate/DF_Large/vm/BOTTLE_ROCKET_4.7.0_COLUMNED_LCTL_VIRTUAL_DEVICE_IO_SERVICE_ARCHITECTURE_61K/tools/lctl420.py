#!/usr/bin/env python3
import argparse, hashlib, json, os, re, struct, subprocess, sys, unicodedata
from pathlib import Path
V='4.2.0'; LANG='columned-lctl/4.2'; MAGIC='LCTLC/1.1'; HDR='ID│LANE│OP│OUT│CTRL│IN│ARG│META'
OPS=['NOP','MOVI','MOV','JMP','JZ','JNZ','HALT','ADD','SUB','MUL','DIVU','MODU','AND','OR','XOR','NOT','SHL','SHR','CMP','LOAD','STORE','PUSH','POP','SVC']
OPI={x:i for i,x in enumerate(OPS)}
MODES=['WRAP','CHECKED','SATURATE','TRAPPING']; MI={x:i for i,x in enumerate(MODES)}
CAP={'CONTROL':1,'ARITH':2,'MEMORY':4,'STACK':8,'SERVICE':16,'STATE':32,'UPDATE':64,'DIAG':128}
SVC={'NOP':0,'STATUS':1,'REVOKE':2,'GRANT':3,'CONFIG':4,'SAVE':5,'DIAG':6,'SHA256':7,'VERIFY':8,'TRUST':9,'RANDOM':10,'CLOCK':11,'WRITE':12,'READ':13,'DEVICE':14,'YIELD':15}
SVC_CAP={0:'SERVICE',1:'SERVICE',2:'CONTROL',3:'CONTROL',4:'STATE',5:'STATE',6:'DIAG',7:'SERVICE',8:'SERVICE',9:'UPDATE',10:'SERVICE',11:'SERVICE',12:'SERVICE',13:'SERVICE',14:'SERVICE',15:'SERVICE'}
ID_RE=re.compile(r'^[A-Za-z][A-Za-z0-9_.-]{0,31}$'); REG_RE=re.compile(r'^R([0-9]|1[0-5])$'); CTRL_RE=re.compile(r'^C([0-9]|1[0-5]):([A-Z]+)$')
U64=(1<<64)-1; WORD_BITS=1048576; MEM=4096; STACK=256; MAX_CODE=256; HEADER=80
class E(Exception): pass

def die(msg): raise E(msg)
def sha(b): return hashlib.sha256(b).hexdigest()
def jbytes(o): return json.dumps(o,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
def parse_uint(s):
    if not s: die('empty integer')
    if re.fullmatch(r'0|[1-9][0-9]*',s): v=int(s,10)
    elif re.fullmatch(r'0x[0-9A-Fa-f]+',s): v=int(s,16)
    else: die('non-canonical integer '+s)
    if v>U64: die('integer exceeds uint64')
    return v

def parse_kv(s, sep=' '):
    out={}
    if not s: return out
    toks=s.split(sep)
    for t in toks:
        if '=' not in t: die('expected key=value: '+t)
        k,v=t.split('=',1)
        if not k or not v or k in out: die('bad/duplicate key: '+k)
        out[k]=v
    return out

def parse_arg(s):
    if s=='_': return {}
    parts=s.split(';')
    if parts != sorted(parts,key=lambda x:x.split('=',1)[0]): die('ARG keys must be lexically ordered')
    out={}
    for t in parts:
        if '=' not in t: die('ARG token must be key=value')
        k,v=t.split('=',1)
        if k not in {'imm','target','mode','width','region','svc','offset'} or not v or k in out: die('bad/duplicate ARG key '+k)
        out[k]=v
    return out

def caps_value(s):
    if s=='0': return 0
    v=0; seen=set()
    for x in s.split('|'):
        if x not in CAP or x in seen: die('invalid capability set '+s)
        seen.add(x); v|=CAP[x]
    return v

def opcap(op,svc=None):
    i=OPI[op]
    if i<=OPI['HALT']: return 'CONTROL'
    if i<=OPI['CMP']: return 'ARITH'
    if i<=OPI['STORE']: return 'MEMORY'
    if i<=OPI['POP']: return 'STACK'
    return SVC_CAP[svc]

def reg(s, allow_empty=False):
    if s=='_' and allow_empty: return None
    m=REG_RE.fullmatch(s)
    if not m: die('bad register '+s)
    return int(m.group(1))

def inputs(s):
    if s=='_': return []
    xs=s.split('›')
    if len(xs)>2: die('too many source operands')
    return [reg(x) for x in xs]

def canonical_source(path):
    b=Path(path).read_bytes()
    if len(b)>65536: die('source exceeds 65536 bytes')
    if b'\r' in b: die('CR prohibited; canonical LF required')
    try: s=b.decode('utf-8')
    except UnicodeDecodeError: die('source is not UTF-8')
    if unicodedata.normalize('NFC',s)!=s: die('source must be NFC')
    for n,l in enumerate(s.splitlines(),1):
        if len(l.encode())>768: die(f'line {n} exceeds 768 bytes')
        if l!=l.rstrip(' \t'): die(f'trailing whitespace line {n}')
    return s,b

def parse(path, executable_required=False):
    text,raw=canonical_source(path); lines=text.splitlines();
    if not lines or lines[0]!=MAGIC: die('unsupported/missing '+MAGIC)
    unit=None; defaults={'mode':'WRAP','width':'WIDE','region':'MEM'}; rows=[]; header=False; ended=False; ids=set()
    for ln,line in enumerate(lines[1:],2):
        if not line or line.startswith('#'): continue
        if line.startswith('@unit '):
            if unit is not None: die('duplicate @unit')
            unit=parse_kv(line[6:]); continue
        if line.startswith('@defaults '):
            defaults.update(parse_kv(line[10:])); continue
        if line.startswith('@frame '): parse_kv(line[7:]); continue
        if line=='@end': ended=True; continue
        if line==HDR:
            if header: die('duplicate header')
            header=True; continue
        if line.startswith('@'): die('unknown directive '+line.split()[0])
        if not header or ended: die('row outside table')
        v=line.split('│')
        if len(v)!=8 or any(x!=x.strip() for x in v): die(f'line {ln}: exactly 8 canonical columns required')
        rid,lane,op,out,ctrl,ins,arg,meta=v
        if not ID_RE.fullmatch(rid) or rid in ids: die(f'line {ln}: invalid/duplicate ID')
        ids.add(rid)
        if 'br.' in arg or 'br.' in meta: die(f'line {ln}: hidden br.* semantic metadata forbidden')
        rows.append({'id':rid,'lane':lane,'op':op,'out':out,'ctrl':ctrl,'in':ins,'arg':arg,'meta':meta,'line':ln})
    if not unit or not header or not ended: die('missing @unit/header/@end')
    exec_rows=[r for r in rows if r['lane']=='exec']
    if executable_required and not exec_rows: die('no executable rows')
    if exec_rows:
        req={'version':V,'language':LANG,'isa':'BR/1'}
        for k,v in req.items():
            if unit.get(k)!=v: die(f'@unit {k} must be {v}')
        for k in ['id','br_image_version','br_request_caps']:
            if k not in unit: die('missing @unit '+k)
        if len(exec_rows)>MAX_CODE: die('too many instructions')
    return {'path':str(path),'raw':raw,'source_sha256':sha(raw),'unit':unit,'defaults':defaults,'rows':rows,'exec_rows':exec_rows}

def semantic(p):
    u=p['unit']; d=p['defaults']; er=p['exec_rows']; labels={r['id']:i for i,r in enumerate(er)}; reqcaps=caps_value(u.get('br_request_caps','0')) if er else 0
    insns=[]
    for i,r in enumerate(er):
        op=r['op']
        if op not in OPI: die(f"line {r['line']}: invalid opcode {op}")
        a=parse_arg(r['arg']); src=inputs(r['in']); dst=reg(r['out'],True)
        m=CTRL_RE.fullmatch(r['ctrl'])
        if not m: die(f"line {r['line']}: CTRL must be Cn:CAP")
        ci=int(m.group(1)); capname=m.group(2)
        mode=a.get('mode',d.get('mode','WRAP')); width=a.get('width',d.get('width','WIDE')); region=a.get('region',d.get('region','MEM'))
        if mode not in MI: die('invalid mode '+mode)
        if width not in {'WIDE','SCALAR'}: die('invalid width '+width)
        imm=0; service=None; target=None; flags=0
        if 'imm' in a: imm=parse_uint(a['imm'])
        if 'target' in a:
            if not a['target'].startswith('@') or a['target'][1:] not in labels: die('invalid branch target '+a['target'])
            target=labels[a['target'][1:]]; imm=target
        if 'svc' in a:
            s=a['svc']; service=SVC.get(s)
            if service is None:
                service=parse_uint(s)
                if service>15: die('service id out of range')
            imm=service
        if 'offset' in a:
            flags=parse_uint(a['offset'])
            if flags>65535: die('offset/flags exceeds uint16')
        # exact operand/argument contract
        arity={
          'NOP':(False,0),'MOVI':(True,0),'MOV':(True,1),'JMP':(False,0),'JZ':(False,0),'JNZ':(False,0),'HALT':(False,0),
          'ADD':(True,2),'SUB':(True,2),'MUL':(True,2),'DIVU':(True,2),'MODU':(True,2),'AND':(True,2),'OR':(True,2),'XOR':(True,2),
          'NOT':(True,1),'SHL':(True,1),'SHR':(True,1),'CMP':(False,2),'LOAD':(True,0),'STORE':(False,1),'PUSH':(False,1),'POP':(True,0),'SVC':(True,None)}[op]
        need_dst,nin=arity
        if need_dst!=(dst is not None): die(f'{op}: destination operand contract violation')
        if nin is not None and len(src)!=nin: die(f'{op}: source operand count violation')
        if op=='SVC' and len(src)>2: die('SVC: at most two source operands')
        allowed={'mode','width'}
        if op=='MOVI': allowed|={'imm'}; 
        if op in {'JMP','JZ','JNZ'}: allowed|={'target'}
        if op in {'SHL','SHR'}: allowed|={'imm'}
        if op in {'LOAD','STORE'}: allowed|={'imm','region'}
        if op=='SVC': allowed|={'svc','offset','region'}
        if any(k not in allowed for k in a): die(f'{op}: ARG key not allowed')
        if op=='MOVI' and 'imm' not in a: die('MOVI requires imm')
        if op in {'JMP','JZ','JNZ'} and 'target' not in a: die(op+' requires target')
        if op in {'SHL','SHR'} and ('imm' not in a or imm>=WORD_BITS): die(op+' shift immediate out of range')
        if op in {'LOAD','STORE'}:
            if 'imm' not in a or imm>MEM-8: die(op+' memory address out of range')
            if region!='MEM': die(op+' requires region=MEM')
        if op=='SVC' and 'svc' not in a: die('SVC requires svc')
        expected=opcap(op,service)
        if capname!=expected: die(f'{op}: declared capability {capname}, expected {expected}')
        if not (reqcaps & CAP[expected]): die(f'{op}: capability {expected} exceeds @unit declaration')
        if op=='SVC' and service==14 and region!='DEVICE': die('DEVICE service requires region=DEVICE')
        rd=dst if dst is not None else 0; ra=src[0] if src else 0; rb=src[1] if len(src)>1 else 0
        meta={}
        if r['meta']!='_':
            for t in r['meta'].split(';'):
                if '=' not in t: die('META must be provenance key=value')
                k,v=t.split('=',1)
                if k in meta or k in {'op','mode','imm','target','width','region','svc','cap'}: die('semantic/duplicate META key '+k)
                meta[k]=v
        insns.append({'index':i,'id':r['id'],'op':op,'opcode':OPI[op],'rd':rd,'ra':ra,'rb':rb,'cap_index':ci,'capability':capname,'mode':mode,'mode_id':MI[mode],'width':width,'imm':imm,'target':target,'region':region if op in {'LOAD','STORE','SVC'} else None,'service':service,'flags':flags,'line':r['line'],'meta':meta})
    if er: verify_cfg(insns,u)
    return insns,reqcaps

def verify_cfg(insns,u):
    n=len(insns); edges=[[] for _ in insns]
    for i,x in enumerate(insns):
        op=x['op']
        if op=='HALT' or (op=='SVC' and x['service']==15): pass
        elif op=='JMP': edges[i]=[x['target']]
        elif op in {'JZ','JNZ'}:
            edges[i]=[x['target']]
            if i+1<n: edges[i].append(i+1)
            else: die(op+' falls off program')
        elif i+1<n: edges[i]=[i+1]
        else: die('program falls off end without HALT/YIELD')
    seen=set(); stack=[0]
    while stack:
        i=stack.pop()
        if i in seen: continue
        seen.add(i); stack.extend(edges[i])
    if len(seen)!=n: die('unreachable executable instruction')
    # stack effect dataflow; all joins require same depth; cycles must be balanced
    depth={0:0}; q=[0]
    while q:
        i=q.pop(0); dep=depth[i]; op=insns[i]['op']; nd=dep+(1 if op=='PUSH' else -1 if op=='POP' else 0)
        if nd<0 or nd>STACK: die('stack effect violates 0..256 bound')
        for z in edges[i]:
            if z in depth and depth[z]!=nd: die('unbalanced stack across CFG/loop')
            if z not in depth: depth[z]=nd; q.append(z)
    # cycle policy
    visiting=set(); done=set(); cyc=False
    def dfs(i):
        nonlocal cyc
        if i in visiting: cyc=True; return
        if i in done:return
        visiting.add(i)
        for z in edges[i]: dfs(z)
        visiting.remove(i);done.add(i)
    dfs(0)
    term=u.get('termination','halt')
    if cyc and term!='budgeted': die('loop requires termination=budgeted')
    if not cyc and term=='yield' and not any(x['op']=='SVC' and x['service']==15 for x in insns): die('termination=yield requires YIELD service')
    # CALL/RET are not BR/1 opcodes and therefore fail opcode verification before CFG construction.

def brir(path):
    p=parse(path,True); ins,req=semantic(p)
    o={'format':'BRIR/1','compiler':'br-lctlc/'+V,'verifier':'br-lctlv/'+V,'language':LANG,'isa':'BR/1','unit':p['unit']['id'],'image_version':parse_uint(p['unit']['br_image_version']),'source_sha256':p['source_sha256'],'requested_caps':req,'required_caps':sum({CAP[x['capability']] for x in ins}), 'instructions':ins}
    return optimize(o)

def optimize(o):
    ins=o['instructions']; targets={x['target'] for x in ins if x['target'] is not None}; keep=[not (x['op']=='NOP' and x['index'] not in targets) for x in ins]
    if all(keep): o['optimization']={'pass':'safe-nop-elision','removed':0}; return o
    remap={old:new for new,old in enumerate(i for i,k in enumerate(keep) if k)}; ni=[]
    for old,x in enumerate(ins):
        if not keep[old]: continue
        y=dict(x); y['index']=remap[old]
        if y['target'] is not None: y['target']=remap[y['target']]; y['imm']=y['target']
        ni.append(y)
    o['instructions']=ni; o['optimization']={'pass':'safe-nop-elision','removed':len(ins)-len(ni)}; return o

def encode(o,factory=False):
    ins=o['instructions']; payload=bytearray()
    for x in ins:
        payload+=struct.pack('<6BH Q',x['opcode'],x['mode_id'],x['rd'],x['ra'],x['rb'],x['cap_index'],x['flags'],x['imm'])
    h=bytearray(HEADER); h[0:4]=b'BRIM'; h[4:7]=bytes([4,2,0]); h[7]=1 if factory else 0; h[8]=1;h[9]=20;h[10]=16;h[11]=16;h[12]=24;h[13]=4
    struct.pack_into('<H',h,14,HEADER); struct.pack_into('<I',h,16,o['image_version']); struct.pack_into('<Q',h,20,o['requested_caps']); struct.pack_into('<H',h,28,len(ins)); struct.pack_into('<H',h,30,0)
    h[32:64]=hashlib.sha256(payload).digest(); h[64:72]=b'BRLCTL42'; h[72:80]=bytes.fromhex(o['source_sha256'])[:8]
    return bytes(h+payload)

def compile_src(src,out,factory=False,manifest=None,brir_out=None,sign_private=None,brctl=None):
    o=brir(src); bb=jbytes(o); img=encode(o,factory)
    Path(out).parent.mkdir(parents=True,exist_ok=True); Path(out).write_bytes(img)
    if brir_out: Path(brir_out).write_bytes(bb+b'\n')
    signed=False
    if sign_private:
        if not brctl: die('--brctl required with --sign-private')
        tmp=str(out)+'.unsigned'; Path(tmp).write_bytes(img); subprocess.run([brctl,'sign-image',tmp,str(out),sign_private],check=True); os.remove(tmp); signed=True
    ib=Path(out).read_bytes()
    man={'record':'BR.Provenance','v':V,'source':str(src),'source_sha256':o['source_sha256'],'brir_sha256':sha(bb),'brim_sha256':sha(ib),'payload_sha256':ib[32:64].hex(),'compiler_version':'br-lctlc/'+V,'verifier_version':'br-lctlv/'+V,'language_version':LANG,'isa_version':'BR/1','image_version':o['image_version'],'requested_caps':o['requested_caps'],'instruction_count':len(o['instructions']),'signed':signed,'header_source_hash_prefix':ib[72:80].hex()}
    if manifest: Path(manifest).write_bytes(jbytes(man)+b'\n')
    return o,man

def decode(path):
    b=Path(path).read_bytes()
    if len(b)<HEADER or b[:4]!=b'BRIM': die('not BRIM/1')
    signed=bool(b[7]&2); cn=struct.unpack_from('<H',b,28)[0]; dn=struct.unpack_from('<H',b,30)[0]; need=HEADER+cn*16+dn+(64 if signed else 0)
    if len(b)!=need: die('BRIM length mismatch')
    if hashlib.sha256(b[HEADER:HEADER+cn*16+dn]).digest()!=b[32:64]: die('payload hash mismatch')
    out=[]
    for i in range(cn):
        op,mo,rd,ra,rb,cap,flags,imm=struct.unpack_from('<6BH Q',b,HEADER+i*16)
        out.append({'index':i,'op':OPS[op] if op<len(OPS) else f'INVALID({op})','opcode':op,'mode':MODES[mo] if mo<len(MODES) else f'INVALID({mo})','rd':rd,'ra':ra,'rb':rb,'cap_index':cap,'flags':flags,'imm':imm})
    return {'format':'BRIM/1','product_version':f'{b[4]}.{b[5]}.{b[6]}','flags':b[7],'abi':b[8],'isa_marker':b[9],'regs':b[10],'caps':b[11],'opcodes':b[12],'modes':b[13],'header':struct.unpack_from('<H',b,14)[0],'image_version':struct.unpack_from('<I',b,16)[0],'requested_caps':struct.unpack_from('<Q',b,20)[0],'instructions':out,'data_bytes':dn,'payload_sha256':b[32:64].hex(),'source_prefix':b[72:80].hex(),'signed':signed,'brim_sha256':sha(b)}

def cmd_check(a):
    p=parse(a.source,a.executable); 
    if p['exec_rows']: semantic(p)
    print(json.dumps({'status':'PASS','source':a.source,'rows':len(p['rows']),'exec_rows':len(p['exec_rows']),'sha256':p['source_sha256']},sort_keys=True))
def cmd_brir(a):
    o=brir(a.source); z=jbytes(o); Path(a.out).write_bytes(z+b'\n') if a.out else sys.stdout.buffer.write(z+b'\n')
def cmd_compile(a):
    _,m=compile_src(a.source,a.out,a.factory,a.manifest,a.brir_out,a.sign_private,a.brctl); print(json.dumps(m,sort_keys=True))
def cmd_disasm(a): print(json.dumps(decode(a.image),sort_keys=True,indent=2))
def cmd_prov(a):
    m=json.loads(Path(a.manifest).read_text()); b=Path(a.image).read_bytes(); s=Path(a.source).read_bytes(); o=brir(a.source); bb=jbytes(o)
    checks={'source_sha256':sha(s)==m['source_sha256'],'brir_sha256':sha(bb)==m['brir_sha256'],'brim_sha256':sha(b)==m['brim_sha256'],'header_source_hash_prefix':b[72:80].hex()==m['header_source_hash_prefix']==bytes.fromhex(sha(s))[:8].hex(),'compiler_version':m['compiler_version']=='br-lctlc/'+V,'verifier_version':m['verifier_version']=='br-lctlv/'+V,'language_version':m['language_version']==LANG,'isa_version':m['isa_version']=='BR/1'}
    if not all(checks.values()): die('provenance mismatch '+json.dumps(checks,sort_keys=True))
    print(json.dumps({'status':'PASS','checks':checks},sort_keys=True))
def cmd_round(a):
    o=brir(a.source); img=encode(o,a.factory); tmp=Path(a.out); tmp.write_bytes(img); d=decode(tmp)
    sem=[(x['opcode'],x['mode_id'],x['rd'],x['ra'],x['rb'],x['cap_index'],x['flags'],x['imm']) for x in o['instructions']]
    ds=[(x['opcode'],MI.get(x['mode'],-1),x['rd'],x['ra'],x['rb'],x['cap_index'],x['flags'],x['imm']) for x in d['instructions']]
    if sem!=ds: die('round-trip semantic mismatch')
    print(json.dumps({'status':'PASS','instructions':len(sem),'source_sha256':o['source_sha256'],'brim_sha256':sha(img)},sort_keys=True))
def main():
    ap=argparse.ArgumentParser(); sp=ap.add_subparsers(required=True)
    q=sp.add_parser('check'); q.add_argument('source');q.add_argument('--executable',action='store_true');q.set_defaults(f=cmd_check)
    q=sp.add_parser('brir');q.add_argument('source');q.add_argument('out',nargs='?');q.set_defaults(f=cmd_brir)
    q=sp.add_parser('compile');q.add_argument('source');q.add_argument('out');q.add_argument('--factory',action='store_true');q.add_argument('--manifest');q.add_argument('--brir-out');q.add_argument('--sign-private');q.add_argument('--brctl');q.set_defaults(f=cmd_compile)
    q=sp.add_parser('disasm');q.add_argument('image');q.set_defaults(f=cmd_disasm)
    q=sp.add_parser('provenance');q.add_argument('source');q.add_argument('image');q.add_argument('manifest');q.set_defaults(f=cmd_prov)
    q=sp.add_parser('roundtrip');q.add_argument('source');q.add_argument('out');q.add_argument('--factory',action='store_true');q.set_defaults(f=cmd_round)
    a=ap.parse_args()
    try: a.f(a)
    except (E,OSError,subprocess.CalledProcessError,ValueError,KeyError) as e: print('ERROR:',e,file=sys.stderr);sys.exit(1)
if __name__=='__main__': main()
