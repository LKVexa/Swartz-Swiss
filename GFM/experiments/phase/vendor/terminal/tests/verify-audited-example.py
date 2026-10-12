"""Independent GF9 reflection/Wigner and scalar example check; stdlib only."""
import cmath
import hashlib
import json
import math
from pathlib import Path

root = Path(__file__).resolve().parent.parent
source = (root / 'examples/Audited-Equations-session.json').read_text(encoding='utf-8')
packet = json.loads(source)

class RawNumber:
    def __init__(self, raw):
        self.raw = raw

def canonical(value):
    if isinstance(value, RawNumber):
        return value.raw
    if isinstance(value, dict):
        return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(value[k]) for k in sorted(value)) + '}'
    if isinstance(value, list):
        return '[' + ','.join(canonical(v) for v in value) + ']'
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))

lexical = json.loads(source, parse_float=RawNumber, parse_int=RawNumber)
assert hashlib.sha256(canonical(lexical['data']).encode()).hexdigest() == packet['sha256']
for index, record in enumerate(packet['data']['records']):
    assert hashlib.sha256(canonical(lexical['data']['records'][index]['data']).encode()).hexdigest() == record['sha256']
data = packet['data']
assert data['version'] == '0.2.0'
assert data['snapshot']['model']['field']['polynomial'] == [1, 0, 1]
assert data['snapshot']['operations'] == 3
omega = cmath.exp(2j * math.pi / 3)
# Direct operator algebra, independent of production modules:
# D(a,1+a) then R(a,1+a) on (|0>+|1>)/sqrt(2) gives
# omega^2 |a>/sqrt(2) + |a-1>/sqrt(2).
expected = [0j] * 9
expected[3], expected[5] = omega ** 2 / math.sqrt(2), 1 / math.sqrt(2)
observed = [complex(v['re'], v['im']) for v in data['snapshot']['state']]
amplitude_residual = max(abs(a-b) for a,b in zip(observed,expected))
assert amplitude_residual < 1e-12

def add(a,b):
    return ((a%3+b%3)%3) + 3*((a//3+b//3)%3)

def negative(a):
    return (-a%3) + 3*((-(a//3))%3)

def multiply(a,b):
    ar, ai, br, bi = a%3, a//3, b%3, b//3
    return ((ar*br-ai*bi)%3) + 3*((ar*bi+ai*br)%3)

def character(a):
    return omega ** ((2*(a%3))%3)

grid = []
for q0 in range(9):
    row = []
    for p0 in range(9):
        expectation = 0j
        for x in range(9):
            y = add(add(q0,q0),negative(x))
            expectation += expected[x].conjugate() * character(multiply(p0,add(x,negative(y)))) * expected[y]
        assert abs(expectation.imag / 9) < 1e-12
        row.append(expectation.real / 9)
    grid.append(row)
wigner_return = next(r for r in data['returns'] if r['command'] == 'gf.wigner')
wigner = wigner_return['details']['wigner']
grid_residual = max(abs(grid[i][j]-wigner['grid'][i][j]) for i in range(9) for j in range(9))
assert grid_residual < 1e-12
l1 = sum(abs(value) for row in grid for value in row)
assert abs(l1 - 5/3) < 1e-12
assert abs(wigner['mana'] - math.log2(5/3)) < 1e-12
position = [sum(row) for row in grid]
momentum = [sum(row[j] for row in grid) for j in range(9)]
inverse_fourier = [sum(character(negative(multiply(k,x))) * expected[x] for x in range(9))/3 for k in range(9)]
assert max(abs(position[x]-abs(expected[x])**2) for x in range(9)) < 1e-12
assert max(abs(momentum[k]-abs(inverse_fourier[k])**2) for k in range(9)) < 1e-12

cg = next(r for r in data['returns'] if r['command'].startswith('math.cg'))
assert abs(cg['details']['coefficient'] - 1/math.sqrt(2)) < 1e-12
delta = next(r for r in data['returns'] if r['command'].startswith('math.delta '))
assert delta['details']['delta'] == ((2-2**3)//3)%3 == 1
cayley = next(r for r in data['returns'] if r['command'].startswith('math.cayley'))
input_data = cayley['details']['input']
assert input_data['H'] == [[0,1],[1,0]] and input_data['state'] == [1,0]
s = input_data['dt'] / (2*input_data.get('hbar',1))
cayley_expected = [(1-s*s)/(1+s*s), -2j*s/(1+s*s)]
cayley_observed = [complex(v['re'],v['im']) for v in cayley['details']['state']]
cayley_residual = max(abs(a-b) for a,b in zip(cayley_expected,cayley_observed))
assert cayley_residual < 1e-12
report = {'schema':'RUSSL-independent-audited-example/1','scope':'Independent closed-form GF9 amplitudes, explicit reflection expectations and scalar values; lexical canonical hashes','passed':True,'sessionHashVerified':True,'recordHashesVerified':True,'maximumAmplitudeResidual':amplitude_residual,'maximumWignerResidual':grid_residual,'l1Norm':l1,'manaBase2':math.log2(l1),'maximumCayleyResidual':cayley_residual}
(root/'validation/independent-audited-example-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
