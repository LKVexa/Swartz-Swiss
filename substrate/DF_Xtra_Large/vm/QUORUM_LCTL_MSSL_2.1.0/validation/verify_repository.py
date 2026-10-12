#!/usr/bin/env python3
from pathlib import Path
import hashlib,re,json,sys,subprocess
ROOT=Path(__file__).resolve().parents[1]
errors=[]
# Verify MSSL Kappa seals and required shape.
for p in sorted(ROOT.rglob('*.mssl')):
    b=p.read_bytes()
    try:
        start=b.index('α≡'.encode('utf-8')); end=b.index(',κ≡'.encode('utf-8'))
        got=hashlib.sha256(b[start:end]).hexdigest()
        s=b.decode('utf-8')
        m=re.search(r'κ≡"sha256:([0-9a-f]{64})"',s)
        if not m or m.group(1)!=got: errors.append(f'MSSL_SEAL {p.relative_to(ROOT)}')
        if not s.startswith('MSSL{\n') or not s.endswith('}⇒⊤\n'): errors.append(f'MSSL_ENVELOPE {p.relative_to(ROOT)}')
        for token in ['α≡','ι≡','λ≡','ℛ≡','π≡','δ≡','τ≡','μ≡','ρ≡','χ≡','η≡','ν≡',',κ≡']:
            if token not in s: errors.append(f'MSSL_FIELD {token} {p.relative_to(ROOT)}')
    except Exception as e: errors.append(f'MSSL_PARSE {p.relative_to(ROOT)} {e}')
# Verify manifest checksums if present.
sha=ROOT/'SHA256SUMS.txt'
if sha.exists():
    for line in sha.read_text('utf-8').splitlines():
        if not line.strip(): continue
        digest, rel=line.split('  ',1)
        q=ROOT/rel
        if not q.exists() or hashlib.sha256(q.read_bytes()).hexdigest()!=digest:
            errors.append(f'SHA256 {rel}')
if errors:
    print('FAIL')
    for e in errors: print(e)
    sys.exit(1)
print(f'PASS: MSSL seals and repository hashes verified ({len(list(ROOT.rglob("*.mssl")))} MSSL documents)')
