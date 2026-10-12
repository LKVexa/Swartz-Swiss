'use strict';
// Build a reproducible module-generated session. Candidate material is data;
// the only calculations executed here are registered production module APIs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const E = require('./src/engine.js');
const F = require('./src/refined-field.js');
const M = require('./src/refined-scalar.js');

const TIMESTAMP = '2026-10-11T12:00:00.000Z';
const stableStringify = value => value === null || typeof value !== 'object'
  ? JSON.stringify(value)
  : Array.isArray(value)
    ? '[' + value.map(stableStringify).join(',') + ']'
    : '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
const digest = value => crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
const byteDigest = value => crypto.createHash('sha256').update(value).digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));

function buildPacket() {
  const registry = JSON.parse(fs.readFileSync(path.join(__dirname, 'equation-audit.json'), 'utf8'));
  if (registry.schema !== 'RUSSL-equation-audit/1' || registry.version !== '0.2.0') throw Error('The example requires the release 0.2 equation register.');
  const source = fs.readFileSync(path.join(__dirname, registry.source.path));
  if (byteDigest(source) !== registry.source.sha256 || source.length !== registry.source.bytes) throw Error('Equation-audit source byte identity does not match the register.');
  function evidence(ids) {
    return {
      version: registry.version,
      sourceSha256: registry.source.sha256,
      entries: ids.map(id => {
        const entry = registry.entries.find(item => item.id === id || item.aliases.includes(id));
        if (!entry) throw Error('Missing example equation entry: ' + id);
        return { id: entry.id, status: entry.status, domain: entry.domain };
      }),
      scope: registry.scope
    };
  }

  const f = E.field('gf9');
  const model = {
    schema: 'RUSSL-finite-field-model/1', field: clone(E.fields.gf9),
    labelEncoding: 'integer = sum(c_i * p^i), polynomial coefficients low first',
    amplitudes: 'complex floating point', fourierSign: '+2pi i',
    normalization: '1/sqrt(q)', character: 'exp(2pi i Tr(x)/p)',
    tolerance: E.tolerance, backend: 'local browser JavaScript',
    physicalScope: 'finite-dimensional complex-amplitude simulation'
  };
  let vector = E.basisState(9, 0);
  let description = 'Basis state |0⟩';
  let operations = 0;
  const commandProvenance = [];
  const returns = [];
  function snapshot() {
    return { model: clone(model), state: clone(vector), description, operations, normSquared: E.norm(vector) ** 2 };
  }
  function result(command, summary, details, profile = f.label, ok = true) {
    returns.push({
      id: 'ret-example-' + String(returns.length + 1).padStart(3, '0'),
      command, ok, summary, profile, elapsedMs: 0,
      details: clone(details)
    });
    commandProvenance.push(command);
  }

  result('gf.field gf9', 'Selected GF(9); state restarted at |0⟩.', model);
  const initial = Array.from({ length: 9 }, (_, x) => ({ re: x < 2 ? 1 / Math.sqrt(2) : 0, im: 0 }));
  vector = initial; description = 'Explicit complex state'; operations += 1;
  result('gf.state ' + JSON.stringify(initial), 'Loaded a validated normalized complex vector.', snapshot());
  const quadratic = F.quadraticCharacter(f, 4);
  result('gf.quadratic 4', 'η(1 + α) = ' + quadratic + '.', {
    element: 4, value: quadratic, model: clone(model), equationAudit: evidence(['37'])
  });

  vector = F.displacement(f, vector, 3, 4); description = 'Displacement (3, 4)'; operations += 1;
  result('gf.displace 3 4', 'Applied D(3,4) in GF(9).', {
    ...snapshot(), operator: F.conventions.displacement, equationAudit: evidence(['67'])
  });
  vector = F.reflection(f, vector, 3, 4); description = 'Reflection (3, 4)'; operations += 1;
  result('gf.reflect 3 4', 'Applied R(3,4) in GF(9).', {
    ...snapshot(), operator: F.conventions.reflection, equationAudit: evidence(['88'])
  });
  const fieldAudit = E.audit(f, vector);
  if (!fieldAudit.passed) throw Error('The generated field state did not pass its mathematical audit.');
  result('gf.verify', 'All five mathematical audits passed.', { audit: fieldAudit, model: clone(model) });
  const wigner = F.pureWigner(f, vector);
  if (!wigner.passed || wigner.negativeCellCount !== 6) throw Error('The generated Wigner example did not match its intended negative-state scope.');
  result('gf.wigner', 'Wigner checks passed; 6 negative cells; mana₂ = log₂(5/3) within floating-point tolerance.', {
    wigner, audit: { passed: wigner.passed, checks: wigner.checks },
    snapshot: snapshot(), equationAudit: evidence(['wigner', 'mana'])
  });

  const cg = M.clebschGordan(0.5, 0.5, 0.5, -0.5, 0, 0);
  result('math.cg 0.5 0.5 0.5 -0.5 0 0', 'Clebsch–Gordan singlet coefficient = +1/√2.', {
    ...cg, statePreserved: true, equationAudit: evidence(['181'])
  }, 'SU(2) / ordinary scalar coefficients');
  const delta = M.arithmeticDelta(3, '2');
  result('math.delta 3 2', 'δ₃(2) = 1 mod 3; Fermat quotient = 1.', {
    ...delta, statePreserved: true, equationAudit: evidence(['318'])
  }, 'Arithmetic residues / Z/p²Z → Z/pZ');
  const x = M.arithmeticDelta(3, '1');
  const y = M.arithmeticDelta(3, '1');
  const product = M.arithmeticDelta(3, String(x.residueModP2 * y.residueModP2));
  const sum = M.arithmeticDelta(3, String(x.residueModP2 + y.residueModP2));
  const rhs = (x.residueModP * y.delta + y.residueModP * x.delta) % 3;
  const additiveRhs = (x.delta + y.delta) % 3;
  const defect = (sum.delta - additiveRhs + 3) % 3;
  result('math.delta.check 3 1 1', 'Product rule passed; additive defect = 1 mod 3.', {
    p: 3, x, y, productRule: { lhs: product.delta, rhs, passed: product.delta === rhs },
    addition: { deltaOfSum: sum.delta, sumOfDeltas: additiveRhs, defect, additiveAtTheseInputs: defect === 0 },
    domain: x.domain, statePreserved: true, equationAudit: evidence(['318', '319'])
  }, 'Arithmetic residues / Z/p²Z → Z/pZ');
  const cayleyInput = { H: [[0, 1], [1, 0]], state: [1, 0], dt: 0.1, hbar: 1 };
  const cayley = M.cayleyStep(cayleyInput.H, cayleyInput.state, cayleyInput.dt, cayleyInput.hbar);
  if (!cayley.toleranceMet) throw Error('The scalar Cayley example failed its numerical checks.');
  result('math.cayley ' + JSON.stringify(cayleyInput), 'Forward Cayley step passed numerical checks; inspect-only scalar state.', {
    ...cayley, input: cayleyInput, statePreserved: true, equationAudit: evidence(['417'])
  }, 'Complex Hermitian Hamiltonian / Cayley');

  const label = 'Audited GF9 displacement / reflection / negative Wigner';
  const recordData = {
    schema: 'RUSSL-research-record/1', kind: 'gf-state', label, capturedAt: TIMESTAMP,
    payload: {
      snapshot: snapshot(), commandProvenance: commandProvenance.slice(), verification: fieldAudit,
      equationAudit: evidence(['37', '67', '88', 'wigner', 'mana'])
    }
  };
  const recordHash = digest(recordData);
  const record = { id: 'rec-1-' + recordHash.slice(0, 8), sha256: recordHash, data: recordData };
  result('ledger.record ' + label, 'Recorded ' + record.id + '.', {
    id: record.id, sha256: record.sha256, kind: recordData.kind, label
  });
  const packetData = {
    schema: 'RUSSL-virtual-session/1', version: '0.2.0', kind: 'session', exportedAt: TIMESTAMP,
    snapshot: snapshot(), records: [record], commandProvenance, returns,
    equationAudit: evidence(['37', '67', '88', 'wigner', 'mana', '181', '318', '319', '417']),
    example: {
      builder: 'audited-examples-build.cjs',
      executionScope: 'Deterministic production-module calculation; command provenance is inert on import.',
      timingScope: 'elapsedMs is fixed at zero for reproducibility, not measured browser performance.',
      initialState: '(|0> + |1>)/sqrt(2)',
      finalState: 'omega^2*|3>/sqrt(2) + |5>/sqrt(2), omega=exp(2*pi*i/3)',
      wignerWitness: 'Rows q0=3 and 5: 1/18. Row q0=4: cos(2*pi*(1+Tr(p0))/3)/9. Other rows: 0.',
      cayleyWitness: 'H=sigma_x, dt=0.1, hbar=1, initial (1,0): final (399/401, -40i/401).',
      scope: 'Audited displayed definitions only; no complete 500-equation validation or hardware claim.'
    }
  };
  return { sha256: digest(packetData), data: packetData };
}

if (require.main === module) {
  const oldPath = path.join(__dirname, 'examples', 'Fourier-Weyl-session.json');
  const oldHash = fs.existsSync(oldPath) ? byteDigest(fs.readFileSync(oldPath)) : null;
  const packet = buildPacket();
  fs.mkdirSync(path.join(__dirname, 'examples'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'examples', 'Audited-Equations-session.json'), JSON.stringify(packet, null, 2) + '\n');
  if (oldHash !== null && byteDigest(fs.readFileSync(oldPath)) !== oldHash) throw Error('The original 0.1 example changed unexpectedly.');
  console.log(JSON.stringify({ output: 'examples/Audited-Equations-session.json', sha256: packet.sha256,
    version: packet.data.version, sourceAuditSha256: packet.data.equationAudit.sourceSha256,
    operations: packet.data.snapshot.operations, returns: packet.data.returns.length, originalExamplePreserved: oldHash !== null }));
}

module.exports = Object.freeze({ buildPacket, stableStringify, digest });
