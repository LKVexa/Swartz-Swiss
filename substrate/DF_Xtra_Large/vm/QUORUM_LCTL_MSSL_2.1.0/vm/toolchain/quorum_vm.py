#!/usr/bin/env python3
"""QUORUM Generic VM 5.0.0 candidate.

A deterministic, bounded, offline-by-default host reference VM for COLUMNED LCTL-C
source. The implementation is intentionally self-contained in the Python standard
library. It is not a claim of bare-metal, self-hosted, or independently audited
production qualification.
"""
from __future__ import annotations
import argparse, base64, hashlib, json, os, pathlib, random, struct, subprocess, sys, tempfile, time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

VM_ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(VM_ROOT) not in sys.path:
    sys.path.insert(0, str(VM_ROOT))
from world.operational_reference import OperationalWorldRuntime as WorldRuntime
from world.world_runtime import WorldError

VERSION = "5.0.0-candidate"
WORLD_EXTENSION_VERSION = "7.0.0-operational-reference-315"
ISA_VERSION = 1
ABI_VERSION = 2
BRIM_VERSION = 2
WORD_BITS = 1_048_576
WORD_MASK = (1 << WORD_BITS) - 1
REG_COUNT = 16
MEMORY_BYTES = 4096
STACK_DEPTH = 256
MAX_PROGRAM_INSNS = 65535
MAX_STEPS_DEFAULT = 1_000_000
MAX_APDU_BYTES = 4096

WORLD_SERVICES = {
    16:"world-init",17:"world-advance",18:"world-move-reference",19:"world-spawn",
    20:"world-entity-view",21:"world-expand-frontier",22:"world-archive-region",
    23:"world-rehydrate-region",24:"world-authority-well",25:"world-digest",
    26:"world-invariants",27:"world-knowledge",28:"world-succession",
    29:"world-partition-migrate",30:"world-inventory-transfer",31:"world-summary",
    32:"world-canonical-verify",33:"world-coherent-snapshot",34:"world-scheduler-tick",
    35:"world-resource-govern",36:"world-atomic-reference",37:"world-c2-entity-view",
    38:"world-economic-transition",39:"world-crime-law",40:"world-materialize",
    41:"world-frame-view",42:"world-checkpoint",43:"world-transition",
    44:"world-traversal-plan",45:"world-penteract",46:"world-history-archive",
    47:"world-semantic-graph",
}
WORLD_KIND_CODES = {0:"generic",1:"agent",2:"mount",3:"merchant",4:"wildlife",5:"transport",6:"structure"}
WORLD_ITEM_CODES = {1:"coin",2:"food",3:"cargo"}

OPCODES = [
    "NOP","MOVI","MOV","ADD","SUB","MUL","DIVU","MODU",
    "AND","OR","XOR","NOT","SHL","SHR","LOAD","STORE",
    "PUSH","POP","JMP","JZ","JNZ","CMP","SVC","HALT",
]
OPCODE_ID = {name:i for i,name in enumerate(OPCODES)}
ARITH_MODES = {"modular","checked","saturating","exact"}

TRAPS = {
    "TRAP_BAD_IMAGE": 1,
    "TRAP_SIGNATURE": 2,
    "TRAP_ROLLBACK": 3,
    "TRAP_BAD_OPCODE": 4,
    "TRAP_BAD_REGISTER": 5,
    "TRAP_DIV_ZERO": 6,
    "TRAP_OVERFLOW": 7,
    "TRAP_OOB_MEMORY": 8,
    "TRAP_CAPABILITY": 9,
    "TRAP_STACK_OVERFLOW": 10,
    "TRAP_STACK_UNDERFLOW": 11,
    "TRAP_BAD_BRANCH": 12,
    "TRAP_RESOURCE": 13,
    "TRAP_BAD_SERVICE": 14,
    "TRAP_MALFORMED_SOURCE": 15,
    "TRAP_VERIFY": 16,
}

# ---- deterministic JSON / hashing ----
def canonical(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def sha256_obj(obj: Any) -> str:
    return sha256_bytes(canonical(obj))

# ---- Ed25519 ----
# Audit remediation (F8, Aug 2026): the pure-Python reference implementation below costs ~0.4 s per
# signature verification. When the 'cryptography' package is importable it is used instead (RFC 8032,
# OpenSSL-backed, deterministic signatures identical to the reference path). Set QVM_PURE_PYTHON_ED25519=1
# to force the reference implementation (e.g. for the package-integrity self-tests or on hosts without
# 'cryptography'). Both paths accept exactly the same well-formed keys/signatures; only the treatment of
# non-canonical or small-order points may differ (OpenSSL semantics vs the reference subgroup check).
try:
    if os.environ.get("QVM_PURE_PYTHON_ED25519", "") == "":
        from cryptography.hazmat.primitives.asymmetric import ed25519 as _c_ed25519
        from cryptography.hazmat.primitives import serialization as _c_serialization
        ED25519_BACKEND = "cryptography"
    else:
        _c_ed25519 = None; ED25519_BACKEND = "pure-python"
except Exception:
    _c_ed25519 = None; ED25519_BACKEND = "pure-python"

# ---- compact pure-python Ed25519 (RFC 8032 formulas) ----
# Reference implementation for package integrity tests. Not constant-time.
q = 2**255 - 19
l = 2**252 + 27742317777372353535851937790883648493
d = -121665 * pow(121666, q-2, q) % q
I = pow(2, (q-1)//4, q)

def inv(x: int) -> int: return pow(x, q-2, q)

def xrecover(y: int) -> int:
    xx = (y*y - 1) * inv(d*y*y + 1)
    x = pow(xx, (q+3)//8, q)
    if (x*x - xx) % q != 0: x = (x * I) % q
    if x & 1: x = q - x
    return x

By = 4 * inv(5) % q
Bx = xrecover(By)
B = (Bx, By)

def edwards(P: Tuple[int,int], Q: Tuple[int,int]) -> Tuple[int,int]:
    x1,y1=P; x2,y2=Q
    x3 = (x1*y2 + x2*y1) * inv(1 + d*x1*x2*y1*y2) % q
    y3 = (y1*y2 + x1*x2) * inv(1 - d*x1*x2*y1*y2) % q
    return x3,y3

def scalarmult(P: Tuple[int,int], e: int) -> Tuple[int,int]:
    if e == 0: return (0,1)
    Q = scalarmult(P, e//2)
    Q = edwards(Q,Q)
    if e & 1: Q = edwards(Q,P)
    return Q

def encodeint(y: int) -> bytes: return int(y).to_bytes(32,"little")
def encodepoint(P: Tuple[int,int]) -> bytes:
    x,y=P
    return int(y | ((x & 1) << 255)).to_bytes(32,"little")

def bit(h: bytes, i: int) -> int: return (h[i//8] >> (i%8)) & 1

def decodeint(s: bytes) -> int: return int.from_bytes(s,"little")
def decodepoint(s: bytes) -> Tuple[int,int]:
    if len(s)!=32: raise ValueError("point length")
    y = decodeint(s) & ((1<<255)-1)
    x = xrecover(y)
    if (x & 1) != bit(s,255): x = q-x
    P=(x,y)
    if scalarmult(P,l)!=(0,1): raise ValueError("point not in main subgroup")
    return P

def H(m: bytes) -> bytes: return hashlib.sha512(m).digest()
def Hint(m: bytes) -> int: return int.from_bytes(H(m),"little")

def ed25519_public(seed: bytes) -> bytes:
    if len(seed)!=32: raise ValueError("seed must be 32 bytes")
    if _c_ed25519 is not None:
        return _c_ed25519.Ed25519PrivateKey.from_private_bytes(bytes(seed)).public_key().public_bytes(_c_serialization.Encoding.Raw,_c_serialization.PublicFormat.Raw)
    h=bytearray(H(seed)); h[0]&=248; h[31]&=63; h[31]|=64
    a=int.from_bytes(h[:32],"little")
    return encodepoint(scalarmult(B,a))

def ed25519_sign(seed: bytes, msg: bytes) -> bytes:
    if len(seed)!=32: raise ValueError("seed must be 32 bytes")
    if _c_ed25519 is not None:
        return _c_ed25519.Ed25519PrivateKey.from_private_bytes(bytes(seed)).sign(bytes(msg))
    h=bytearray(H(seed)); h[0]&=248; h[31]&=63; h[31]|=64
    a=int.from_bytes(h[:32],"little"); prefix=bytes(h[32:])
    A=encodepoint(scalarmult(B,a))
    r=Hint(prefix+msg)%l; R=encodepoint(scalarmult(B,r))
    S=(r + Hint(R+A+msg)*a)%l
    return R+encodeint(S)

def ed25519_verify(pub: bytes, msg: bytes, sig: bytes) -> bool:
    try:
        if len(pub)!=32 or len(sig)!=64: return False
        if _c_ed25519 is not None:
            try:
                _c_ed25519.Ed25519PublicKey.from_public_bytes(bytes(pub)).verify(bytes(sig),bytes(msg)); return True
            except Exception:
                return False
        R=decodepoint(sig[:32]); A=decodepoint(pub); S=decodeint(sig[32:])
        if S>=l: return False
        h=Hint(sig[:32]+pub+msg)%l
        return scalarmult(B,S)==edwards(R,scalarmult(A,h))
    except Exception:
        return False

# ---- source parser/compiler ----
def parse_kv(text: str) -> Dict[str,str]:
    out: Dict[str,str]={}
    for part in text.split(";"):
        part=part.strip()
        if not part or part=="_": continue
        if "=" not in part: raise ValueError(f"bad key/value: {part}")
        k,v=part.split("=",1); out[k.strip()]=v.strip().strip('"')
    return out

def parse_reg(s: str) -> int:
    if not s.upper().startswith("R"): raise ValueError(f"not register: {s}")
    n=int(s[1:])
    if not 0<=n<REG_COUNT: raise ValueError(f"register out of range: {s}")
    return n

def parse_int(s: str) -> int:
    s=s.strip()
    return int(s,0)

def decode_s64(v: int) -> int:
    v = int(v) & ((1 << 64) - 1)
    return v - (1 << 64) if v & (1 << 63) else v

def encode_s64(v: int) -> int:
    return int(v) & ((1 << 64) - 1)

def parse_lctlc(path: pathlib.Path) -> Dict[str,Any]:
    lines=path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip()!="LCTLC/1.0": raise ValueError("missing LCTLC/1.0")
    if not any(ln.startswith("ID│LANE│OP│OUT│CTRL│IN│ARG│META") for ln in lines): raise ValueError("missing 8-column header")
    unit={}; rows=[]; in_rows=False
    for ln in lines[1:]:
        ln=ln.strip()
        if not ln: continue
        if ln.startswith("@unit "):
            unit=parse_kv(ln[len("@unit "):].replace(" ",";"))
        elif ln.startswith("ID│LANE│OP│OUT│CTRL│IN│ARG│META"):
            in_rows=True
        elif ln=="@end": break
        elif ln.startswith("@"): continue
        elif in_rows:
            parts=ln.split("│")
            if len(parts)!=8: raise ValueError(f"row must have 8 columns: {ln}")
            row=dict(zip(["id","lane","op","out","ctrl","in","arg","meta"],parts))
            rows.append(row)
    if not unit: raise ValueError("missing @unit")
    return {"unit":unit,"rows":rows}

def external_lctl_verify(source: pathlib.Path, root: pathlib.Path) -> Dict[str,Any]:
    tool=root.parent / "toolchain" / "lctl_1_6_1_rc1" / "START_LCTL_1_6_1.sh"
    if not tool.exists():
        return {"status":"UNAVAILABLE","command":str(tool),"exit_code":127,"output":"bundled LCTL verifier not found"}
    cp=subprocess.run(["sh",str(tool),"column-verify",str(source)],cwd=str(tool.parent),capture_output=True,text=True,timeout=60)
    out=(cp.stdout+cp.stderr).strip()
    return {"status":"PASS" if cp.returncode==0 else "FAIL","command":" ".join(["sh",str(tool),"column-verify",str(source)]),"exit_code":cp.returncode,"output":out[-8000:]}

def compile_source(source: pathlib.Path, root: pathlib.Path, require_lctl: bool=True) -> Dict[str,Any]:
    # Resolve caller-relative input before invoking the bundled verifier, whose cwd is its own tool directory.
    source=source.expanduser().resolve()
    root=root.expanduser().resolve()
    parsed=parse_lctlc(source)
    # Audit remediation (F7, Aug 2026): --skip-lctl-verify previously still spawned the bundled JVM verifier and only
    # ignored its verdict; it now skips the invocation entirely (Java is then not required to compile).
    if require_lctl:
        lctl=external_lctl_verify(source, root)
        if lctl["status"]!="PASS": raise RuntimeError("canonical LCTL verification failed: "+lctl["output"])
    else:
        lctl={"status":"SKIPPED","command":None,"exit_code":None,"output":"canonical LCTL verification skipped by request (--skip-lctl-verify); the payload carries no LCTL verification claim"}
    labels: Dict[str,int]={}; raw=[]
    for row in parsed["rows"]:
        if row["lane"]!="vm": continue
        kv=parse_kv(row["arg"])
        if "label" in kv:
            if kv["label"] in labels: raise ValueError("duplicate label")
            labels[kv["label"]]=len(raw)
            if "vm.op" not in kv: continue
        if "vm.op" not in kv: continue
        raw.append((row,kv))
    if not raw: raise ValueError("no vm rows")
    if len(raw)>MAX_PROGRAM_INSNS: raise ValueError("program too large")
    insns=[]
    for row,kv in raw:
        op=kv["vm.op"].upper()
        if op not in OPCODE_ID: raise ValueError(f"unsupported opcode {op}")
        ins={"op":op}
        for k in ["dst","a","b"]:
            if k in kv: ins[k]=parse_reg(kv[k])
        for k in ["imm","width","svc"]:
            if k in kv: ins[k]=parse_int(kv[k])
        if "target" in kv:
            t=kv["target"]
            ins["target"]=labels[t] if t in labels else parse_int(t)
        if "mode" in kv:
            mode=kv["mode"].lower()
            if mode not in ARITH_MODES: raise ValueError(f"bad mode {mode}")
            ins["mode"]=mode
        ins["source_row"]=row["id"]
        insns.append(ins)
    # static verification
    for pc,ins in enumerate(insns):
        if "target" in ins and not 0<=ins["target"]<len(insns): raise ValueError(f"bad branch target at {pc}")
        if ins.get("width",1)<1 or ins.get("width",1)>MEMORY_BYTES: raise ValueError(f"bad width at {pc}")
        if ins["op"]=="HALT" and pc != len(insns)-1:
            # legal but deterministic dead-code marker, keep accepted
            pass
    brir={
        "format":"QVM-BRIR/1","source_unit":parsed["unit"],"source_sha256":sha256_bytes(source.read_bytes()),
        "isa_version":ISA_VERSION,"abi_version":ABI_VERSION,"word_bits":WORD_BITS,"instructions":insns,
    }
    payload={
        "magic":"QBRIM","version":BRIM_VERSION,"vm_version":VERSION,"isa_version":ISA_VERSION,"abi_version":ABI_VERSION,
        "word_bits":WORD_BITS,"memory_bytes":MEMORY_BYTES,"stack_depth":STACK_DEPTH,"program_version":int(parsed["unit"].get("program_version","1")),
        "entry":0,"instructions":insns,"source_sha256":brir["source_sha256"],
        "capabilities":{"memory":[[0,MEMORY_BYTES]],"services":[0,1,2,3,*sorted(WORLD_SERVICES)]},
    }
    return {"brir":brir,"payload":payload,"lctl_verification":lctl}

# ---- VM ----
class VMTrap(RuntimeError):
    def __init__(self,name:str,detail:str=""):
        super().__init__(f"{name}: {detail}"); self.name=name; self.code=TRAPS[name]; self.detail=detail

@dataclass
class VM:
    image: Dict[str,Any]
    max_steps: int=MAX_STEPS_DEFAULT
    regs: List[int]=field(default_factory=lambda:[0]*REG_COUNT)
    memory: bytearray=field(default_factory=lambda:bytearray(MEMORY_BYTES))
    stack: List[int]=field(default_factory=list)
    pc: int=0
    steps: int=0
    halted: bool=False
    cmp: int=0
    output: bytearray=field(default_factory=bytearray)
    trace: List[Dict[str,Any]]=field(default_factory=list)
    rng_state: int=0x51564D35
    vclock: int=0
    world: Optional[WorldRuntime]=None

    def cap_memory(self,addr:int,width:int)->bool:
        for base,length in self.image.get("capabilities",{}).get("memory",[]):
            if addr>=base and width>=0 and addr+width<=base+length: return True
        return False
    def service_allowed(self,svc:int)->bool:
        return svc in self.image.get("capabilities",{}).get("services",[])
    def reg(self,n:int)->int:
        if not 0<=n<REG_COUNT: raise VMTrap("TRAP_BAD_REGISTER",str(n))
        return self.regs[n]
    def setreg(self,n:int,v:int,mode:str="modular"):
        if not 0<=n<REG_COUNT: raise VMTrap("TRAP_BAD_REGISTER",str(n))
        if v<0:
            if mode=="modular": v &= WORD_MASK
            else: raise VMTrap("TRAP_OVERFLOW","negative")
        if v.bit_length()>WORD_BITS:
            if mode=="modular": v &= WORD_MASK
            elif mode=="saturating": v=WORD_MASK
            else: raise VMTrap("TRAP_OVERFLOW",f"{v.bit_length()} bits")
        self.regs[n]=v
    def value(self,ins:Dict[str,Any],key:str,default:int=0)->int:
        if key in ins: return self.reg(ins[key])
        return ins.get("imm",default)
    def step(self):
        if self.halted: return
        insns=self.image["instructions"]
        if self.steps>=self.max_steps: raise VMTrap("TRAP_RESOURCE","step limit")
        if not 0<=self.pc<len(insns): raise VMTrap("TRAP_BAD_BRANCH",str(self.pc))
        ins=insns[self.pc]; op=ins["op"]; before=self.pc; self.pc+=1; self.steps+=1; self.vclock+=1
        mode=ins.get("mode","modular")
        try:
            if op=="NOP": pass
            elif op=="MOVI": self.setreg(ins["dst"],ins.get("imm",0),mode)
            elif op=="MOV": self.setreg(ins["dst"],self.reg(ins["a"]),mode)
            elif op in {"ADD","SUB","MUL","DIVU","MODU","AND","OR","XOR"}:
                a=self.reg(ins["a"]); b=self.reg(ins["b"])
                if op=="ADD": v=a+b
                elif op=="SUB": v=a-b
                elif op=="MUL": v=a*b
                elif op=="DIVU":
                    if b==0: raise VMTrap("TRAP_DIV_ZERO")
                    v=a//b
                elif op=="MODU":
                    if b==0: raise VMTrap("TRAP_DIV_ZERO")
                    v=a%b
                elif op=="AND": v=a&b
                elif op=="OR": v=a|b
                else: v=a^b
                self.setreg(ins["dst"],v,mode)
            elif op=="NOT": self.setreg(ins["dst"],(~self.reg(ins["a"])) & WORD_MASK,mode)
            elif op in {"SHL","SHR"}:
                a=self.reg(ins["a"]); sh=ins.get("imm",0)
                if sh<0 or sh>WORD_BITS: raise VMTrap("TRAP_RESOURCE","shift")
                self.setreg(ins["dst"],a<<sh if op=="SHL" else a>>sh,mode)
            elif op=="LOAD":
                addr=self.reg(ins["a"]) if "a" in ins else ins.get("imm",0); width=ins.get("width",8)
                if addr<0 or addr+width>len(self.memory): raise VMTrap("TRAP_OOB_MEMORY",f"{addr}+{width}")
                if not self.cap_memory(addr,width): raise VMTrap("TRAP_CAPABILITY","memory read")
                self.setreg(ins["dst"],int.from_bytes(self.memory[addr:addr+width],"little"),mode)
            elif op=="STORE":
                addr=self.reg(ins["a"]) if "a" in ins else ins.get("imm",0); width=ins.get("width",8)
                if addr<0 or addr+width>len(self.memory): raise VMTrap("TRAP_OOB_MEMORY",f"{addr}+{width}")
                if not self.cap_memory(addr,width): raise VMTrap("TRAP_CAPABILITY","memory write")
                v=self.reg(ins["b"] if "b" in ins else ins.get("dst",0))
                self.memory[addr:addr+width]=(v & ((1<<(8*width))-1)).to_bytes(width,"little")
            elif op=="PUSH":
                if len(self.stack)>=STACK_DEPTH: raise VMTrap("TRAP_STACK_OVERFLOW")
                self.stack.append(self.reg(ins["a"]))
            elif op=="POP":
                if not self.stack: raise VMTrap("TRAP_STACK_UNDERFLOW")
                self.setreg(ins["dst"],self.stack.pop(),mode)
            elif op=="JMP": self.pc=ins["target"]
            elif op=="JZ":
                if self.reg(ins["a"])==0: self.pc=ins["target"]
            elif op=="JNZ":
                if self.reg(ins["a"])!=0: self.pc=ins["target"]
            elif op=="CMP":
                a=self.reg(ins["a"]); b=self.reg(ins["b"]); self.cmp=(a>b)-(a<b)
            elif op=="SVC": self.service(ins.get("svc",0),ins)
            elif op=="HALT": self.halted=True
            else: raise VMTrap("TRAP_BAD_OPCODE",op)
        finally:
            self.trace.append({"step":self.steps,"pc":before,"op":op,"next_pc":self.pc,"state_sha256":self.state_hash(compact=True)})
    def service(self,svc:int,ins:Dict[str,Any]):
        if not self.service_allowed(svc): raise VMTrap("TRAP_CAPABILITY",f"service {svc}")
        if svc==0: return
        if svc==1: # console byte from low R0
            if len(self.output)>=MAX_APDU_BYTES: raise VMTrap("TRAP_RESOURCE","output limit")
            self.output.append(self.regs[0]&0xff)
        elif svc==2: # virtual clock -> R0
            self.setreg(0,self.vclock)
        elif svc==3: # deterministic PRNG -> R0
            self.rng_state=(1103515245*self.rng_state+12345)&0x7fffffff; self.setreg(0,self.rng_state)
        elif svc in WORLD_SERVICES:
            try:
                if svc==16: # initialize deterministic canonical world; seed in R0
                    self.world=WorldRuntime(seed=self.regs[0] & ((1<<64)-1))
                    self.setreg(0,int(self.world.state_digest()[:16],16))
                elif self.world is None:
                    raise WorldError("world service requires WORLD_INIT")
                elif svc==17: # advance canonical world by R0 ticks
                    ticks=int(self.regs[0])
                    if ticks>100000: raise WorldError("per-service tick bound exceeded")
                    self.world.advance(ticks)
                    self.setreg(0,self.world.tick)
                elif svc==18: # move reference using signed 64-bit coordinates in R0..R2
                    self.world.move_reference(decode_s64(self.regs[0]),decode_s64(self.regs[1]),decode_s64(self.regs[2]))
                    self.setreg(0,self.world.tick)
                elif svc==19: # spawn entity: kind R0; xyz R1..R3; region R4
                    kind=WORLD_KIND_CODES.get(int(self.regs[0]),"generic")
                    region=str(int(self.regs[4]) or 1)
                    eid=self.world.spawn_entity(kind,[decode_s64(self.regs[1]),decode_s64(self.regs[2]),decode_s64(self.regs[3])],region)
                    self.setreg(0,int(eid))
                elif svc==20: # query reference-relative folded view for entity R0
                    view=self.world.entity_view(str(int(self.regs[0])))
                    for i,v in enumerate(view["folded_pos"][:3]): self.setreg(i,encode_s64(v))
                    self.setreg(3,int(view["shell"])); self.setreg(4,int(view["lod"])); self.setreg(5,int(view["canonical_distance"]))
                elif svc==21: # deterministic frontier expansion; anchor region in R0
                    anchor=str(int(self.regs[0]) or 1)
                    rid=self.world.expand_frontier(anchor_region=anchor)
                    self.setreg(0,int(rid))
                elif svc==22: # archive region
                    digest=self.world.archive_region(str(int(self.regs[0])))
                    self.setreg(0,int(digest[:16],16))
                elif svc==23: # rehydrate region
                    digest=self.world.rehydrate_region(str(int(self.regs[0])))
                    self.setreg(0,int(digest[:16],16))
                elif svc==24: # authority well xyz/priority/radius in R0..R4
                    wid=self.world.add_authority_well(decode_s64(self.regs[0]),decode_s64(self.regs[1]),decode_s64(self.regs[2]),int(self.regs[3]),int(self.regs[4]) or 4096)
                    self.setreg(0,int(wid[1:]))
                elif svc==25: # digest/head
                    self.setreg(0,int(self.world.state_digest()[:16],16))
                    self.setreg(1,int(self.world.ledger_head[:16],16))
                elif svc==26: # invariant count
                    self.setreg(0,len(self.world.invariants()))
                elif svc==27: # local knowledge: observer R0, fact R1, value R2
                    self.world.tell(str(int(self.regs[0])),f"guest.fact.{int(self.regs[1])}",int(self.regs[2]),source="guest-svc")
                    self.setreg(0,1)
                elif svc==28: # succession: role code R0, successor R1
                    role={1:"sheriff:eastvale"}.get(int(self.regs[0]),f"guest-role:{int(self.regs[0])}")
                    self.world.succession(role,str(int(self.regs[1])))
                    self.setreg(0,1)
                elif svc==29: # migrate region R0 to partition P<R1>
                    self.world.migrate_region(str(int(self.regs[0])),f"P{int(self.regs[1])}")
                    self.setreg(0,1)
                elif svc==30: # idempotent inventory transfer
                    item=WORLD_ITEM_CODES.get(int(self.regs[3]),f"item-{int(self.regs[3])}")
                    applied=self.world.transfer_inventory(str(int(self.regs[0])),str(int(self.regs[1])),str(int(self.regs[2])),item,int(self.regs[4]))
                    self.setreg(0,1 if applied else 0)
                elif svc==31: # compact summary
                    summary=self.world.summary()
                    self.setreg(0,int(summary["regions"])); self.setreg(1,int(summary["entities"])); self.setreg(2,int(summary["ledger_events"])); self.setreg(3,int(summary["archived_regions"]))
                elif svc==32: # canonical verifier
                    rep=self.world.canonical_verify(); self.setreg(0,1 if rep["pass"] else 0); self.setreg(1,int(rep["digest"][:16],16))
                elif svc==33: # coherent snapshot
                    rep=self.world.coherent_snapshot(); self.setreg(0,1 if rep["coherent"] else 0); self.setreg(1,int(rep["state_digest"][:16],16))
                elif svc==34: # deterministic scheduler phase trace
                    trace=self.world.scheduler_tick(); self.setreg(0,len(trace)); self.setreg(1,int(hashlib.sha256(canonical(trace)).hexdigest()[:16],16))
                elif svc==35: # deterministic resource governor; R0 cpu R1 mem R2 io R3 backlog
                    rep=self.world.resource_govern({"cpu":int(self.regs[0]),"memory":int(self.regs[1]),"io":int(self.regs[2]),"materialization_backlog":int(self.regs[3])}); self.setreg(0,int(rep["level"])); self.setreg(1,1 if rep["canonical_protected"] else 0)
                elif svc==36: # atomic reference update xyz R0..R2
                    rep=self.world.atomic_reference_update([decode_s64(self.regs[0]),decode_s64(self.regs[1]),decode_s64(self.regs[2])]); self.setreg(0,int(rep["epoch"])); self.setreg(1,int(self.world.temporal_history_version))
                elif svc==37: # C2 folded entity view
                    eid=str(int(self.regs[0])); ent=self.world.entities[eid]; view=self.world.fold_point_c2(ent["pos"]);
                    [self.setreg(i,encode_s64(int(round(v)))) for i,v in enumerate(view["folded"][:3])]; self.setreg(3,int(view["shell"])); self.setreg(4,int(view["folded_distance"]))
                elif svc==38: # settlement economic transition
                    rep=self.world.economic_transition("eastvale","route_loss" if int(self.regs[0]) else None); self.setreg(0,int(rep["after"]["food"])); self.setreg(1,int(rep["market"]["price_food"])); self.setreg(2,1 if rep["journal"]["balanced"] else 0)
                elif svc==39: # crime/law transition actor R0
                    rep=self.world.crime_law_transition(str(int(self.regs[0]) or 1)); self.setreg(0,int(rep["reputation"])); self.setreg(1,1 if rep["institution_knows"] else 0)
                elif svc==40: # materialize entity R0
                    rep=self.world.materialize(str(int(self.regs[0]))); self.setreg(0,1 if rep.interactable() else 0)
                elif svc==41: # immutable frame-view digest
                    rep=self.world.frame_view(); self.setreg(0,int(hashlib.sha256(canonical(rep)).hexdigest()[:16],16)); self.setreg(1,int(rep["view_revision"]))
                elif svc==42: # checkpoint digest
                    rep=self.world.checkpoint(); self.setreg(0,int(rep["digest"][:16],16)); self.setreg(1,int(rep["tick"]))
                elif svc==43: # representation transition entity R0 target LOD R1
                    rep=self.world.transition_entity(str(int(self.regs[0])),int(self.regs[1])); self.setreg(0,1 if rep["conserved"] else 0); self.setreg(1,int(rep["record"]["target"]))
                elif svc==44: # route-aware traversal route code R0 speed R1
                    route={1:"route:heart-east",2:"route:heart-west",3:"rail:east"}.get(int(self.regs[0]),"route:heart-east"); rep=self.world.plan_traversal(route,int(self.regs[1]) or 10); self.setreg(0,int(rep["canonical_distance"])); self.setreg(1,len(rep["milestones"]))
                elif svc==45: # penteract entity R0
                    rep=self.world.penteract_state(str(int(self.regs[0]))); self.setreg(0,int(rep["tau"])); self.setreg(1,int(rep["lambda"])); self.setreg(2,int(rep["rho"]))
                elif svc==46: # compact history digest
                    rep=self.world.compact_history(); self.setreg(0,int(rep["digest"][:16],16)); self.setreg(1,len(rep["exact"])); self.setreg(2,len(rep["aggregate"]))
                elif svc==47: # semantic graph digest
                    self.setreg(0,int(sha256_obj(self.world.semantic_graph)[:16],16)); self.setreg(1,len(self.world.semantic_graph["regions"])); self.setreg(2,len(self.world.semantic_graph["routes"]))
            except WorldError as e:
                raise VMTrap("TRAP_BAD_SERVICE",f"world:{e}")
        else: raise VMTrap("TRAP_BAD_SERVICE",str(svc))
    def run(self):
        while not self.halted: self.step()
        return self.snapshot()
    def state_hash(self,compact:bool=False)->str:
        obj={"pc":self.pc,"steps":self.steps,"halted":self.halted,"cmp":self.cmp,"regs":[hex(v) for v in self.regs],"stack":[hex(v) for v in self.stack],"memory_sha256":sha256_bytes(bytes(self.memory)),"output_sha256":sha256_bytes(bytes(self.output)),"vclock":self.vclock,"rng_state":self.rng_state,"world_sha256":self.world.state_digest() if self.world is not None else None}
        return sha256_obj(obj)
    def snapshot(self)->Dict[str,Any]:
        snap={"status":"HALTED" if self.halted else "RUNNING","pc":self.pc,"steps":self.steps,"state_sha256":self.state_hash(),"registers_hex":[hex(v) for v in self.regs],"memory_sha256":sha256_bytes(bytes(self.memory)),"stack_depth":len(self.stack),"output_b64":base64.b64encode(bytes(self.output)).decode(),"trace_sha256":sha256_obj(self.trace)}
        if self.world is not None:
            snap["world"]=self.world.summary()
        return snap

# ---- images / persistence ----
def image_message(payload: Dict[str,Any]) -> bytes: return canonical(payload)

def sign_payload(payload: Dict[str,Any],seed: bytes,key_id:str="dev-root") -> Dict[str,Any]:
    pub=ed25519_public(seed); sig=ed25519_sign(seed,image_message(payload))
    return {"payload":payload,"signature":{"algorithm":"Ed25519","key_id":key_id,"public_key":pub.hex(),"signature":sig.hex()}}

def verify_image(image: Dict[str,Any], trust: Dict[str,Any], rollback_floor:int=0) -> Dict[str,Any]:
    if not isinstance(image,dict) or "payload" not in image or "signature" not in image: raise VMTrap("TRAP_BAD_IMAGE","missing payload/signature")
    p=image["payload"]; s=image["signature"]
    if p.get("magic")!="QBRIM" or p.get("version")!=BRIM_VERSION: raise VMTrap("TRAP_BAD_IMAGE","format/version")
    if p.get("isa_version")!=ISA_VERSION or p.get("abi_version")!=ABI_VERSION: raise VMTrap("TRAP_BAD_IMAGE","ISA/ABI mismatch")
    key_id=s.get("key_id"); tk=trust.get("keys",{}).get(key_id)
    if not tk or tk.get("revoked"): raise VMTrap("TRAP_SIGNATURE","untrusted/revoked key")
    pub=bytes.fromhex(tk["public_key"]); sig=bytes.fromhex(s.get("signature",""))
    if s.get("public_key")!=tk["public_key"] or not ed25519_verify(pub,image_message(p),sig): raise VMTrap("TRAP_SIGNATURE","verification failed")
    if int(p.get("program_version",0)) < rollback_floor: raise VMTrap("TRAP_ROLLBACK",f"{p.get('program_version')} < {rollback_floor}")
    if len(p.get("instructions",[]))>MAX_PROGRAM_INSNS: raise VMTrap("TRAP_RESOURCE","program length")
    return p

def state_mac(payload:Dict[str,Any],key:bytes)->str:
    # Keyed BLAKE2s for deterministic authenticated local state.
    return hashlib.blake2s(canonical(payload),key=key,digest_size=32).hexdigest()

def save_state_dual(root:pathlib.Path,state:Dict[str,Any],key:bytes):
    root.mkdir(parents=True,exist_ok=True)
    ctrl=root/"control.json"; old={"active":"A","generation":0}
    if ctrl.exists():
        try: old=json.loads(ctrl.read_text())
        except Exception: pass
    new_slot="B" if old.get("active")=="A" else "A"; gen=int(old.get("generation",0))+1
    payload={"generation":gen,"state":state}; rec={"payload":payload,"mac":state_mac(payload,key)}
    tmp=root/f"slot_{new_slot}.json.tmp"; final=root/f"slot_{new_slot}.json"
    tmp.write_bytes(canonical(rec)+b"\n"); os.replace(tmp,final)
    ctmp=root/"control.json.tmp"; ctmp.write_bytes(canonical({"active":new_slot,"generation":gen})+b"\n"); os.replace(ctmp,ctrl)

def load_state_dual(root:pathlib.Path,key:bytes)->Optional[Dict[str,Any]]:
    candidates=[]
    for slot in ["A","B"]:
        p=root/f"slot_{slot}.json"
        if not p.exists(): continue
        try:
            rec=json.loads(p.read_text()); payload=rec["payload"]
            if rec.get("mac")!=state_mac(payload,key): continue
            candidates.append(payload)
        except Exception: continue
    if not candidates: return None
    return max(candidates,key=lambda x:int(x.get("generation",0)))["state"]

# ---- CLI ----
def root_from_script()->pathlib.Path: return pathlib.Path(__file__).resolve().parents[1]
def load_json(p:pathlib.Path): return json.loads(p.read_text())
def write_json(p:pathlib.Path,obj:Any): p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(canonical(obj)+b"\n")

def cmd_compile(a):
    root=root_from_script(); out=compile_source(pathlib.Path(a.source),root,not a.skip_lctl_verify)
    write_json(pathlib.Path(a.brir),out["brir"]); write_json(pathlib.Path(a.out),out["payload"])
    print(json.dumps({"status":"PASS","brir":a.brir,"brim_payload":a.out,"source_sha256":out["brir"]["source_sha256"],"lctl":out["lctl_verification"]["status"]},indent=2))
def cmd_keygen(a):
    seed=bytes.fromhex(a.seed) if a.seed else os.urandom(32); pub=ed25519_public(seed)
    pathlib.Path(a.private).write_text(seed.hex()+"\n"); pathlib.Path(a.public).write_text(pub.hex()+"\n")
    print(json.dumps({"algorithm":"Ed25519","public_key":pub.hex(),"private_seed_path":a.private},indent=2))
def cmd_sign(a):
    payload=load_json(pathlib.Path(a.payload)); seed=bytes.fromhex(pathlib.Path(a.key).read_text().strip())
    img=sign_payload(payload,seed,a.key_id); write_json(pathlib.Path(a.out),img); print(json.dumps({"status":"PASS","image":a.out,"sha256":sha256_bytes(pathlib.Path(a.out).read_bytes())},indent=2))
def cmd_verify(a):
    p=verify_image(load_json(pathlib.Path(a.image)),load_json(pathlib.Path(a.trust)),a.rollback_floor)
    print(json.dumps({"status":"PASS","program_version":p["program_version"],"instructions":len(p["instructions"]),"payload_sha256":sha256_obj(p)},indent=2))
def cmd_run(a):
    image=load_json(pathlib.Path(a.image)); trust=load_json(pathlib.Path(a.trust)); payload=verify_image(image,trust,a.rollback_floor)
    vm=VM(payload,max_steps=a.max_steps); snap=vm.run()
    if a.trace: write_json(pathlib.Path(a.trace),vm.trace)
    if a.snapshot: write_json(pathlib.Path(a.snapshot),snap)
    print(json.dumps(snap,indent=2))
def cmd_apdu(a):
    raw=bytes.fromhex(a.hex); 
    if len(raw)>MAX_APDU_BYTES: raise VMTrap("TRAP_RESOURCE","APDU too large")
    # APDU reference service: 00=ping, 01=sha256, 02=version.
    if not raw: raise VMTrap("TRAP_BAD_SERVICE","empty APDU")
    ins=raw[0]; data=raw[1:]
    if ins==0: resp=b"PONG"
    elif ins==1: resp=hashlib.sha256(data).digest()
    elif ins==2: resp=VERSION.encode()
    else: raise VMTrap("TRAP_BAD_SERVICE",hex(ins))
    print(resp.hex())
def cmd_selftest(a):
    root=root_from_script(); test=root/"tests"/"test_vm.py"
    cp=subprocess.run([sys.executable,str(test)],cwd=str(root),text=True)
    raise SystemExit(cp.returncode)
def cmd_inspect(a):
    p=pathlib.Path(a.source); out=compile_source(p,root_from_script(),not a.skip_lctl_verify)
    print(json.dumps(out["brir"],indent=2))

def parser():
    p=argparse.ArgumentParser(prog="quorum-vm",description="QUORUM Generic COLUMNED-LCTL VM 5.0.0 candidate")
    p.add_argument("--version",action="version",version=VERSION)
    sp=p.add_subparsers(dest="cmd",required=True)
    c=sp.add_parser("compile"); c.add_argument("source"); c.add_argument("out"); c.add_argument("--brir",required=True); c.add_argument("--skip-lctl-verify",action="store_true"); c.set_defaults(fn=cmd_compile)
    k=sp.add_parser("keygen"); k.add_argument("--private",required=True); k.add_argument("--public",required=True); k.add_argument("--seed"); k.set_defaults(fn=cmd_keygen)
    s=sp.add_parser("sign"); s.add_argument("payload"); s.add_argument("--key",required=True); s.add_argument("--key-id",default="dev-root"); s.add_argument("--out",required=True); s.set_defaults(fn=cmd_sign)
    v=sp.add_parser("verify"); v.add_argument("image"); v.add_argument("--trust",required=True); v.add_argument("--rollback-floor",type=int,default=0); v.set_defaults(fn=cmd_verify)
    r=sp.add_parser("run"); r.add_argument("image"); r.add_argument("--trust",required=True); r.add_argument("--rollback-floor",type=int,default=0); r.add_argument("--max-steps",type=int,default=MAX_STEPS_DEFAULT); r.add_argument("--trace"); r.add_argument("--snapshot"); r.set_defaults(fn=cmd_run)
    qx=sp.add_parser("apdu"); qx.add_argument("hex"); qx.set_defaults(fn=cmd_apdu)
    st=sp.add_parser("selftest"); st.set_defaults(fn=cmd_selftest)
    i=sp.add_parser("inspect"); i.add_argument("source"); i.add_argument("--skip-lctl-verify",action="store_true"); i.set_defaults(fn=cmd_inspect)
    return p

def main():
    a=parser().parse_args()
    try: return a.fn(a) or 0
    except VMTrap as e:
        print(json.dumps({"status":"TRAP","trap":e.name,"code":e.code,"detail":e.detail}),file=sys.stderr); return e.code
    except Exception as e:
        print(json.dumps({"status":"ERROR","error":type(e).__name__,"detail":str(e)}),file=sys.stderr); return 70

if __name__=="__main__": raise SystemExit(main())
