#!/usr/bin/env python3
"""Bounded JA21 Core 0.3 compiler/VM used to rebuild and verify VB.

This is a deliberately small, deterministic profile derived from the JA Core,
Interface, Security, Service/Protocol, Test/Proof and MCRT contracts bundled in
corpora/contracts. It is not a claim of full-suite JA21 implementation.
"""
from __future__ import annotations
import hashlib, json, re
from dataclasses import dataclass
from typing import Any, Callable

FORBIDDEN = {"__proto__", "prototype", "constructor"}
PRECEDENCE = {"or":1,"and":2,"==":3,"!=":3,"<":4,">":4,"<=":4,">=":4,"+":5,"-":5,"*":6,"/":6}
TOKEN_RE = re.compile(r'^(?:"(?:[^"\\\r\n]|\\["\\/bfnrt]|\\u[0-9a-fA-F]{4})*"|\d+(?:\.\d+)?|[A-Za-z_][A-Za-z_0-9]*|->|==|!=|<=|>=|[{}()\[\],:.=+*/<>-])')
SKIP_RE = re.compile(r'^(?:\s+|#[^\n]*|//[^\n]*)')

class Diagnostic(Exception):
    def __init__(self, message: str, token: dict[str, Any] | None = None):
        token = token or {}
        self.line = int(token.get("line",1)); self.column = int(token.get("column",1))
        super().__init__(f"{message} ({self.line}:{self.column})")

def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def lex(source: str) -> list[dict[str, Any]]:
    if len(source.encode("utf-8")) > 262144:
        raise Diagnostic("Source exceeds 256 KiB")
    out=[]; at=0; line=1; column=1
    while at < len(source):
        rest=source[at:]
        m=SKIP_RE.match(rest)
        if m:
            text=m.group(0)
            for c in text:
                if c=='\n': line += 1; column=1
                else: column += 1
            at += len(text); continue
        m=TOKEN_RE.match(rest)
        if not m: raise Diagnostic("Unexpected character",{"line":line,"column":column})
        text=m.group(0); out.append({"text":text,"line":line,"column":column}); at += len(text); column += len(text)
        if len(out)>40000: raise Diagnostic("Token limit exceeded",out[-1])
    out.append({"text":"<eof>","line":line,"column":column}); return out

class Parser:
    def __init__(self, source: str): self.tokens=lex(source); self.i=0; self.depth=0
    def peek(self,v): return self.tokens[self.i]["text"]==v
    def take(self): t=self.tokens[self.i]; self.i += 1; return t
    def accept(self,v):
        if self.peek(v): self.i += 1; return True
        return False
    def need(self,v):
        if not self.accept(v): raise Diagnostic(f"Expected '{v}', received '{self.tokens[self.i]['text']}'",self.tokens[self.i])
    def ident(self):
        t=self.take()
        if not re.match(r'^[A-Za-z_]\w*$',t["text"]) or t["text"] in FORBIDDEN: raise Diagnostic("Invalid identifier",t)
        return t["text"]
    def qualified(self):
        v=self.ident()
        while self.accept('.'): v += '.'+self.ident()
        return v
    def typ(self): return self.ident()
    def header(self):
        self.need('ja'); self.need('source'); self.need('0.3'); self.need('module'); module=self.qualified(); imports=[]
        while self.accept('use'): imports.append(self.qualified())
        self.need('policy'); self.need('no_network')
        return {"module":module,"imports":imports,"policy":"no_network"}
    def core(self):
        unit={**self.header(),"records":{},"functions":{}}
        while not self.peek('<eof>'):
            start=self.tokens[self.i]
            if self.accept('record'):
                name=self.ident()
                if name in unit["records"]: raise Diagnostic("Duplicate record",start)
                self.need('{'); fields=[]
                while not self.accept('}'):
                    n=self.ident(); self.need(':'); fields.append({"name":n,"type":self.typ()})
                    if not self.accept(','): self.need('}'); break
                if len({f['name'] for f in fields})!=len(fields): raise Diagnostic("Duplicate field",start)
                unit["records"][name]=fields
            elif self.accept('function'):
                name=self.ident()
                if name in unit["functions"]: raise Diagnostic("Duplicate function",start)
                self.need('('); params=[]
                if not self.peek(')'):
                    while True:
                        n=self.ident(); self.need(':'); params.append({"name":n,"type":self.typ()})
                        if not self.accept(','): break
                self.need(')'); self.need('->'); returns=self.typ(); self.need('effects'); self.need('{'); self.need('pure'); self.need('}')
                if len({p['name'] for p in params})!=len(params): raise Diagnostic("Duplicate parameter",start)
                unit["functions"][name]={"params":params,"returns":returns,"body":self.block(),"line":start["line"]}
            else: raise Diagnostic("Unsupported declaration in VB profile",start)
        return unit
    def block(self):
        self.need('{'); self.depth += 1
        if self.depth>64: raise Diagnostic("Parser nesting limit")
        body=[]
        while not self.accept('}'):
            if self.accept('let'):
                name=self.ident(); typ=self.typ() if self.accept(':') else None; self.need('='); body.append({"op":"let","name":name,"type":typ,"value":self.expr()})
            elif self.accept('return'): body.append({"op":"return","value":self.expr()})
            elif self.accept('if'):
                condition=self.expr(); yes=self.block(); no=[]
                if self.accept('else'): no=self.block()
                body.append({"op":"if","condition":condition,"yes":yes,"no":no})
            elif self.accept('assert'): body.append({"op":"assert","value":self.expr()})
            else: raise Diagnostic("Unsupported statement",self.tokens[self.i])
        self.depth -= 1; return body
    def expr(self,min_rank=0):
        self.depth += 1
        if self.depth>64: raise Diagnostic("Expression nesting limit")
        t=self.take(); text=t["text"]
        if text in ('not','-'): value={"op":"unary","kind":text,"value":self.expr(7)}
        elif text=='(':
            value=self.expr(); self.need(')')
        elif text.startswith('"'): value={"op":"literal","value":json.loads(text)}
        elif re.match(r'^\d',text): value={"op":"literal","value":float(text) if '.' in text else int(text)}
        elif text in ('true','false'): value={"op":"literal","value":text=='true'}
        elif re.match(r'^[A-Za-z_]\w*$',text) and text not in FORBIDDEN:
            value={"op":"name","name":text}
            if text[:1].isupper() and self.accept('{'):
                fields=[]
                while not self.accept('}'):
                    n=self.ident(); self.need(':'); fields.append({"name":n,"value":self.expr()})
                    if not self.accept(','): self.need('}'); break
                if len({f['name'] for f in fields})!=len(fields): raise Diagnostic("Duplicate constructor field",t)
                value={"op":"record","name":text,"fields":fields}
        else: raise Diagnostic("Expected expression",t)
        while True:
            if self.accept('.'):
                value={"op":"get","object":value,"key":self.ident()}
            elif self.accept('('):
                args=[]
                if not self.peek(')'):
                    while True:
                        args.append(self.expr())
                        if not self.accept(','): break
                self.need(')'); value={"op":"call","callee":value,"args":args}
            else:
                kind=self.tokens[self.i]["text"]; rank=PRECEDENCE.get(kind)
                if rank is None or rank<min_rank: break
                self.take(); value={"op":"binary","kind":kind,"left":value,"right":self.expr(rank+1)}
        self.depth -= 1; return value

def compile_core(source: str) -> dict[str, Any]:
    unit=Parser(source).core(); unit["sourceHash"]=sha256_text(source); unit["profile"]="vb-ja21-core/2"
    # A left-associative expression can become deep without increasing parser recursion.
    # Check the generated tree iteratively before it reaches the bounded VM.
    pending=[(unit,0)]
    while pending:
        node,depth=pending.pop()
        if depth>128: raise Diagnostic("Syntax tree nesting limit")
        if isinstance(node,dict): pending.extend((v,depth+1) for v in node.values())
        elif isinstance(node,list): pending.extend((v,depth+1) for v in node)
    if unit["imports"] != ["Core"]: raise Diagnostic("Only use Core is supported in this profile")
    types={"Text","Count","Flag",*unit["records"].keys()}
    for fields in unit["records"].values():
        for f in fields:
            if f["type"] not in types: raise Diagnostic(f"Unknown type {f['type']}")
    for fn in unit["functions"].values():
        for typ in [fn["returns"],*[p["type"] for p in fn["params"]]]:
            if typ not in types: raise Diagnostic(f"Unknown type {typ}")
    return unit

def analyze_url(value: str) -> dict[str, Any]:
    if not isinstance(value,str) or len(value)>16384: raise Diagnostic("Address exceeds limit")
    text=value.strip()
    local=bool(re.match(r'^(?:localhost|\[[0-9a-f:]+\]|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:[/?#].*)?$',text,re.I))
    host=bool(re.match(r'^[^\s/:?#]+\.[^\s/:?#]+(?::\d+)?(?:[/?#].*)?$',text,re.UNICODE))
    explicit=not local and not host and bool(re.match(r'^[a-z][a-z\d+.-]*:',text,re.I))
    scheme=''; valid=False
    try:
        from urllib.parse import urlsplit
        u=urlsplit(text); scheme=u.scheme.lower()
        port=u.port # Accessing port rejects invalid and out-of-range port text.
        valid=scheme in ('https','http') and bool(u.hostname) and u.username is None and u.password is None and (port is None or 1<=port<=65535)
    except Exception: pass
    if any(ord(c)<32 or ord(c)==127 for c in text): valid=False
    return {"text":text,"scheme":scheme,"explicit":explicit,"local":local,"host":host,"valid":valid}

def encode_url(value: str) -> str:
    from urllib.parse import quote
    return quote(value,safe="~()*!.'-_")

class VM:
    def __init__(self, unit: dict[str,Any], builtins: dict[str,Callable[...,Any]]|None=None):
        self.unit=unit; self.builtins={"URL.analyze":analyze_url,"URL.encode":encode_url}; self.builtins.update(builtins or {}); self.steps=0; self.calls=0; self.eval_depth=0
    def tick(self):
        self.steps += 1
        if self.steps>20000: raise Diagnostic("Execution budget exceeded")
    def check(self,value,typ):
        if typ=='Text':
            if not isinstance(value,str) or len(value)>16384: raise Diagnostic("Expected bounded Text")
        elif typ=='Count':
            if isinstance(value,bool) or not isinstance(value,int) or value<0 or value>9007199254740991: raise Diagnostic("Expected Count")
        elif typ=='Flag':
            if not isinstance(value,bool): raise Diagnostic("Expected Flag")
        else:
            fields=self.unit["records"].get(typ)
            if not fields or not isinstance(value,dict) or set(value.keys())!={f['name'] for f in fields}: raise Diagnostic(f"Expected {typ}")
            for f in fields: self.check(value[f['name']],f['type'])
        return value
    def run(self,name,args=None): self.steps=0; self.calls=0; return self.invoke(name,args or [])
    def invoke(self,name,args):
        self.tick(); self.calls += 1
        if self.calls>48: raise Diagnostic("Call depth exceeded")
        try:
            fn=self.unit["functions"].get(name)
            if not fn: raise Diagnostic(f"Unknown function {name}")
            if len(args)!=len(fn["params"]): raise Diagnostic(f"Arity mismatch {name}")
            scope={}
            for p,v in zip(fn["params"],args): scope[p["name"]]=self.check(v,p["type"])
            result=self.block(fn["body"],scope)
            if not result["returned"]: raise Diagnostic(f"Missing return from {name}")
            return self.check(result["value"],fn["returns"])
        finally: self.calls -= 1
    def block(self,statements,parent):
        scope=dict(parent)
        for s in statements:
            self.tick(); op=s["op"]
            if op=='return': return {"returned":True,"value":self.eval(s["value"],scope)}
            if op=='let':
                if s["name"] in scope: raise Diagnostic(f"Duplicate binding {s['name']}")
                value=self.eval(s["value"],scope); scope[s["name"]]=self.check(value,s["type"]) if s.get("type") else value
            elif op=='assert':
                if self.check(self.eval(s["value"],scope),'Flag') is not True: raise Diagnostic("Assertion failed")
            elif op=='if':
                branch=s["yes"] if self.check(self.eval(s["condition"],scope),'Flag') else s["no"]
                r=self.block(branch,scope)
                if r["returned"]: return r
        return {"returned":False,"value":None}
    def call_name(self,node):
        if node["op"]=='name': return node["name"]
        if node["op"]=='get': return self.call_name(node["object"])+'.'+node["key"]
        raise Diagnostic("Only named calls are supported")
    def eval(self,node,scope):
        self.eval_depth += 1
        try:
            if self.eval_depth>128: raise Diagnostic("Expression evaluation nesting limit")
            return self._eval(node,scope)
        finally:
            self.eval_depth -= 1
    def _eval(self,node,scope):
        self.tick(); op=node["op"]
        if op=='literal': return node["value"]
        if op=='name':
            if node["name"] not in scope: raise Diagnostic(f"Unknown field {node['name']}")
            return scope[node["name"]]
        if op=='get':
            obj=self.eval(node["object"],scope); key=node["key"]
            if key in FORBIDDEN or not isinstance(obj,dict) or key not in obj: raise Diagnostic(f"Unknown field {key}")
            return obj[key]
        if op=='record':
            v={f["name"]:self.eval(f["value"],scope) for f in node["fields"]}; return self.check(v,node["name"])
        if op=='call':
            name=self.call_name(node["callee"]); args=[self.eval(a,scope) for a in node["args"]]
            return self.builtins[name](*args) if name in self.builtins else self.invoke(name,args)
        if op=='unary':
            v=self.eval(node["value"],scope)
            return (not self.check(v,'Flag')) if node["kind"]=='not' else -self.check(v,'Count')
        if op=='binary':
            a=self.eval(node["left"],scope); kind=node["kind"]
            if kind=='and': return self.check(a,'Flag') and self.check(self.eval(node["right"],scope),'Flag')
            if kind=='or': return self.check(a,'Flag') or self.check(self.eval(node["right"],scope),'Flag')
            b=self.eval(node["right"],scope)
            if kind=='==': return type(a) is type(b) and a==b
            if kind=='!=': return not (type(a) is type(b) and a==b)
            if type(a) is not type(b) or not isinstance(a,(int,str)) or isinstance(a,bool): raise Diagnostic("Operand type mismatch")
            if kind=='+': return a+b
            if kind=='-': return self.check(a,'Count')-self.check(b,'Count')
            if kind=='*': return self.check(a,'Count')*self.check(b,'Count')
            if kind=='/':
                if b==0: raise Diagnostic("Division by zero")
                q,remainder=divmod(self.check(a,'Count'),self.check(b,'Count'))
                if remainder: raise Diagnostic("Count division produced a non-integer")
                return q
            if kind=='<': return a<b
            if kind=='>': return a>b
            if kind=='<=': return a<=b
            if kind=='>=': return a>=b
        raise Diagnostic(f"Unsupported operation {op}")

if __name__=='__main__':
    import argparse, pathlib
    ap=argparse.ArgumentParser(); ap.add_argument('source'); ap.add_argument('-o','--output',required=True); ns=ap.parse_args()
    source=pathlib.Path(ns.source).read_text(encoding='utf-8'); unit=compile_core(source)
    pathlib.Path(ns.output).write_text(json.dumps(unit,indent=2),encoding='utf-8')
    print(f"compiled {ns.source} -> {ns.output} [{unit['sourceHash'][:16]}]")
