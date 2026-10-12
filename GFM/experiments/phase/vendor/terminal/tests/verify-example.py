"""Independent GF9 reference and canonical JSON digest checks; stdlib only."""
import cmath
import hashlib
import json
import math
from pathlib import Path

root = Path(__file__).resolve().parent.parent
packet = json.loads((root / 'examples/Fourier-Weyl-session.json').read_text(encoding='utf-8'))

def canonical(value):
    # This example contains exactly integral metadata and shortest decimal
    # values emitted by JavaScript. Reuse the original numeric lexical tokens
    # when reproducing the canonical digest; Python's float JSON formatting
    # differs from ECMAScript for exponent notation and integral floats.
    if isinstance(value, dict):
        return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(value[k]) for k in sorted(value)) + '}'
    if isinstance(value, list):
        return '[' + ','.join(canonical(v) for v in value) + ']'
    if isinstance(value, RawNumber):
        return value.raw
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))

class RawNumber:
    def __init__(self, raw):
        self.raw = raw

lexical = json.loads((root / 'examples/Fourier-Weyl-session.json').read_text(encoding='utf-8'), parse_float=RawNumber, parse_int=RawNumber)
outer_hash = hashlib.sha256(canonical(lexical['data']).encode()).hexdigest()
assert outer_hash == packet['sha256'], 'Session envelope digest differs'
record_hash = hashlib.sha256(canonical(lexical['data']['records'][0]['data']).encode()).hexdigest()
assert record_hash == packet['data']['records'][0]['sha256'], 'Record envelope digest differs'
assert packet['data']['snapshot']['model']['field']['polynomial'] == [1, 0, 1]

# GF9 = GF3[a]/(a^2+1), x=x0+x1*a; Tr(x)=2*x0. After
# F|1>, X(a), Z(1+a), amplitude at x is omega^(x0+x1)/3.
state = packet['data']['snapshot']['state']
omega = cmath.exp(2j * math.pi / 3)
expected = [omega ** ((x % 3 + x // 3) % 3) / 3 for x in range(9)]
observed = [complex(v['re'], v['im']) for v in state]
residual = max(abs(a-b) for a,b in zip(observed,expected))
assert residual < 1e-12, f'Independent GF9 reference residual: {residual}'
assert abs(sum(abs(a)**2 for a in observed) - 1) < 1e-12
report = {'scope':'Deterministic example, independent closed-form GF9 calculation and canonical byte digests', 'schema':'RUSSL-independent-example-check/1','sessionHashVerified':True,'recordHashVerified':True,'referenceFormula':'psi(x0+x1*a)=exp(2*pi*i*(x0+x1)/3)/3','maximumAmplitudeResidual':residual,'normSquared':sum(abs(a)**2 for a in observed),'passed':True}
(root/'validation'/'independent-example-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
