'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../src/engine.js');
const A = require('../src/gfm-models.js');
const registry = require('../equation-audit.json');
const EPS = 1e-10;
const c = (re, im = 0) => ({ re, im });
const conj = a => c(a.re, -a.im);
const times = (a, b) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const plus = (a, b) => c(a.re + b.re, a.im + b.im);
const matvec = (matrix, vector) => matrix.map(row => row.reduce((sum, value, j) => plus(sum, times(value, vector[j])), c(0)));
const adjoint = matrix => matrix[0].map((_, j) => matrix.map(row => conj(row[j])));
const matmul = (left, right) => left.map(row => right[0].map((_, j) => row.reduce((sum, value, k) => plus(sum, times(value, right[k][j])), c(0))));
const inner = (left, right) => left.reduce((sum, value, j) => plus(sum, times(conj(value), right[j])), c(0));
const vectorNorm = values => Math.sqrt(values.reduce((sum, value) => sum + value.re ** 2 + value.im ** 2, 0));
function close(actual, expected, eps = EPS) {
  assert.ok(Number.isFinite(actual), `Non-finite result ${actual}`);
  assert.ok(Math.abs(actual - expected) <= eps * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}
function vectorClose(actual, expected, eps = EPS) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, i) => { close(value.re, expected[i].re, eps); close(value.im, expected[i].im, eps); });
}
function matrixClose(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((row, i) => vectorClose(row, expected[i]));
}
const entry = id => registry.entries.find(value => value.id === id);
const prepared = q => E.normalize(Array.from({ length: q }, (_, x) => c(Math.sin(x + .7), Math.cos(2 * x + .3))));
const mod3 = x => (x % 3 + 3) % 3;
// Independent GF9 polynomial arithmetic: alpha^2=-1, Tr(a+b alpha)=2a.
const add9 = (x, y) => mod3(x % 3 + y % 3) + 3 * mod3(Math.floor(x / 3) + Math.floor(y / 3));
const neg9 = x => mod3(-x % 3) + 3 * mod3(-Math.floor(x / 3));
const sub9 = (x, y) => add9(x, neg9(y));
const mul9 = (x, y) => {
  const a = x % 3, b = Math.floor(x / 3), d = y % 3, e = Math.floor(y / 3);
  return mod3(a * d - b * e) + 3 * mod3(a * e + b * d);
};
const chi9 = x => c(Math.cos(2 * Math.PI * mod3(2 * (x % 3)) / 3), Math.sin(2 * Math.PI * mod3(2 * (x % 3)) / 3));
const F9 = Array.from({ length: 9 }, (_, k) => Array.from({ length: 9 }, (_, x) => {
  const value = chi9(mul9(k, x)); return c(value.re / 3, value.im / 3);
}));
function reflection9(q0, p0) {
  return Array.from({ length: 9 }, (_, x) => Array.from({ length: 9 }, (_, y) => {
    const partner = sub9(add9(q0, q0), x);
    return y === partner ? chi9(mul9(p0, sub9(x, y))) : c(0);
  }));
}
function independentWigner9(state) {
  return Array.from({ length: 9 }, (_, q0) => Array.from({ length: 9 }, (_, p0) => inner(state, matvec(reflection9(q0, p0), state)).re / 9));
}
function zetaSumEnclosure(s, N = 20000) {
  // Integral-test bounds for a positive decreasing series, independent of the
  // production Euler-Maclaurin reference and its Bernoulli corrections.
  let sum = 0, correction = 0;
  for (let n = 1; n <= N; n++) {
    const y = n ** -s - correction, next = sum + y;
    correction = (next - sum) - y; sum = next;
  }
  return [sum + (N + 1) ** (1 - s) / (s - 1), sum + N ** (1 - s) / (s - 1)];
}
function factorial(n) { let value = 1; for (let i = 2; i <= n; i++) value *= i; return value; }

test('model adapters load as CommonJS and a dependency-free universal module', () => {
  assert.equal(globalThis.RusslGFMModels, A);
  const context = vm.createContext({});
  for (const filename of ['engine.js', 'refined-field.js', 'refined-scalar.js', 'gfm-matrix.js', 'gfm-exact.js', 'gfm-models.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', filename), 'utf8'), context);
  }
  assert.equal(context.RusslGFMModels.pendulum('gf9').passed, true);
  assert.equal(context.RusslGFMModels.rotation('gf3', context.RusslEngine.basisState(3, 1), 'x').passed, true);
});

test('pendulum reference uses exact sine, dimensional frequency and period, and the declared small-angle bound', () => {
  for (const maxAngle of [.001, .2, 1, Math.PI]) {
    const result = A.pendulum(E.field('gf9'), 8, 2, maxAngle);
    close(result.reference.omega, 2);
    close(result.reference.frequency, 1 / Math.PI);
    close(result.reference.smallAnglePeriod, Math.PI);
    close(result.reference.relativeLinearErrorBound, maxAngle ** 2 / 6);
    const independentlyExpected = Array.from({ length: 9 }, (_, x) => -4 * Math.sin(maxAngle * (x / 4 - 1)));
    result.samples.forEach((sample, x) => {
      const theta = maxAngle * (x / 4 - 1);
      close(sample.theta, theta); close(sample.acceleration, independentlyExpected[x]);
      close(sample.linearAcceleration, -4 * theta);
      close(sample.absoluteLinearError, 4 * Math.abs(theta - Math.sin(theta)));
      close(sample.relativeToLinear, theta === 0 ? 0 : Math.abs(Math.sin(theta) / theta - 1));
      assert.ok(sample.relativeToLinear <= maxAngle ** 2 / 6 + 1e-15);
    });
    close(result.samples[4].acceleration, 0);
    close(result.reference.maximumSampleRelativeLinearError, 1 - Math.sin(maxAngle) / maxAngle);
    assert.equal(result.passed, true);
    assert.match(result.reference.periodScope, /Small-angle continuum period/);
    assert.match(result.scope, /does not define sine on a finite field/);
  }
});

test('pendulum signal transform preserves its scale and independently specified sample values', () => {
  const result = A.pendulum('gf9', 9.81, 3, .45);
  const values = result.samples.map(sample => c(-(9.81 / 3) * Math.sin(sample.theta)));
  const scale = vectorNorm(values);
  const normalized = values.map(value => c(value.re / scale));
  close(result.transform.scale, scale);
  close(result.preparation.originalL2Scale, scale);
  vectorClose(result.transform.normalizedSamples, normalized);
  vectorClose(result.preparedState, matvec(F9, normalized));
  vectorClose(result.transform.restoredValues, values);
  vectorClose(matvec(adjoint(F9), result.preparedState).map(value => c(value.re * scale, value.im * scale)), values);
  close(vectorNorm(result.preparedState), 1);
  assert.deepEqual(result.codec.nodes, result.samples.map(sample => sample.theta));
  assert.equal(result.preparation.field, 'gf9');
});

test('all three real rotation axes retain the 232.75 degree active-column signs after reapplication', () => {
  const cosine = -.6052939880428941, sine = -.7960020025346223;
  const matrices = {
    x: [[1, 0, 0], [0, cosine, -sine], [0, sine, cosine]],
    y: [[cosine, 0, sine], [0, 1, 0], [-sine, 0, cosine]],
    z: [[cosine, -sine, 0], [sine, cosine, 0], [0, 0, 1]]
  };
  const state = [c(1 / Math.sqrt(3)), c(0, 1 / Math.sqrt(3)), c(-1 / Math.sqrt(3))];
  const before = JSON.stringify(state);
  for (const axis of ['x', 'y', 'z']) {
    const expected = matrices[axis].map(row => row.map(value => c(value)));
    const result = A.rotation('gf3', state, axis, 232.75);
    matrixClose(result.original.matrix, expected);
    vectorClose(result.preparedState, matvec(expected, state));
    close(result.original.angleRadians, 4.062253834016802);
    close(result.original.determinant, 1);
    assert.equal(result.reapplication.unitarity.isUnitary, true);
    assert.equal(result.reapplication.outputNormalized, true);
    assert.equal(result.passed, true);
    assert.match(result.scope, /real angle is not reduced modulo 3/);
  }
  assert.equal(JSON.stringify(state), before);
});

for (const s of [2, 3, 4, 5, 6, 7, 8]) {
  test(`Mellin integral at s=${s} agrees with an independent zeta reference`, () => {
    const even = { 2: Math.PI ** 2 / 6, 4: Math.PI ** 4 / 90, 6: Math.PI ** 6 / 945, 8: Math.PI ** 8 / 9450 };
    const result = A.zeta('gf9', s);
    const gamma = factorial(s - 1);
    let expected;
    if (s % 2 === 0) expected = even[s];
    else {
      const [lower, upper] = zetaSumEnclosure(s);
      assert.ok(upper - lower <= 2e-13);
      assert.ok(result.reference.zeta >= lower - 2e-14 && result.reference.zeta <= upper + 2e-14);
      expected = (lower + upper) / 2;
    }
    close(result.reference.zeta, expected, 2e-13);
    assert.equal(result.reference.gamma, gamma);
    close(result.reference.product, gamma * expected, 2e-13);
    close(result.reference.integral, gamma * expected);
    assert.ok(result.reference.relativeIdentityResidual <= EPS);
    assert.equal(result.reference.passed, true);
    assert.equal(result.passed, true);
    assert.ok(result.reference.tailUpperBound > 0 && result.reference.tailUpperBound / Math.max(1, gamma * expected) < 1e-16);
    assert.match(result.reference.quadratureErrorScope, /not a rigorous quadrature bound/);
  });
}

test('coarse Mellin samples are a declared window encoding, with retained scale and no improper-integral claim', () => {
  const result = A.zeta('gf9', 4);
  const spacing = 12 / 9;
  const values = Array.from({ length: 9 }, (_, x) => {
    const t = (x + .5) * spacing;
    close(result.samples[x].t, t);
    return c(t ** 3 / Math.expm1(t));
  });
  close(result.finiteSampling.coarseIntegral, spacing * values.reduce((sum, value) => sum + value.re, 0));
  close(result.finiteSampling.absoluteDifferenceFromReference, Math.abs(result.finiteSampling.coarseIntegral - Math.PI ** 4 / 15));
  assert.ok(result.finiteSampling.absoluteDifferenceFromReference > 1e-3);
  assert.ok(result.finiteSampling.tailUpperBound > 0);
  close(result.transform.scale, vectorNorm(values));
  vectorClose(result.transform.restoredValues, values);
  vectorClose(result.preparedState, matvec(F9, values.map(value => c(value.re / vectorNorm(values)))));
  assert.deepEqual(result.codec.window, [0, 12]);
  assert.match(result.finiteSampling.scope, /not the original improper integral/);
  assert.match(result.scope, /No finite-field exponential/);
});

test('Wigner values are invariant when both the GF9 state and every phase-point operator change basis', () => {
  const state = prepared(9), before = JSON.stringify(state);
  const result = A.wignerCovariance(E.field('gf9'), state);
  const transformed = matvec(F9, state);
  vectorClose(result.transformedState, transformed);
  const directGrid = independentWigner9(state);
  let stateOnlyDifference = 0;
  const changedStateOnlyGrid = independentWigner9(transformed);
  for (let q0 = 0; q0 < 9; q0++) for (let p0 = 0; p0 < 9; p0++) {
    const R = reflection9(q0, p0);
    const changedOperator = matmul(matmul(F9, R), adjoint(F9));
    const expectation = inner(transformed, matvec(changedOperator, transformed));
    close(expectation.im, 0);
    close(result.wigner.grid[q0][p0], directGrid[q0][p0]);
    close(result.transformedGrid[q0][p0], expectation.re / 9);
    close(result.transformedGrid[q0][p0], directGrid[q0][p0]);
    stateOnlyDifference = Math.max(stateOnlyDifference, Math.abs(changedStateOnlyGrid[q0][p0] - directGrid[q0][p0]));
  }
  assert.ok(stateOnlyDifference > .01, 'Transforming only the state must not masquerade as basis covariance');
  assert.ok(result.maximumResidual < EPS && result.maximumImaginaryResidual < EPS);
  assert.equal(result.passed, true);
  assert.equal(JSON.stringify(state), before);
});

test('stored displacement and reflection adapters agree with independent GF9 formulas', () => {
  const state = prepared(9), before = JSON.stringify(state);
  for (const id of ['eq-67', 'eq-88']) {
    const result = A.stored('gf9', state, entry(id));
    assert.deepEqual(result.parameters, { xi: 3, zeta: 4 });
    let expected;
    if (id === 'eq-88') expected = matvec(reflection9(3, 4), state);
    else expected = state.map((_, x) => {
      const y = sub9(x, 3);
      const halfPhase = chi9(neg9(mul9(2, mul9(3, 4))));
      return times(times(halfPhase, chi9(mul9(4, x))), state[y]);
    });
    vectorClose(result.preparedState, expected);
    assert.equal(result.outcome, 'operator-reapplied');
    assert.equal(result.applied, true); assert.equal(result.passed, true);
    assert.equal(result.reapplication.unitarity.isUnitary, true);
  }
  assert.equal(JSON.stringify(state), before);
});

test('stored character and quadratic-sign signals are complex encodings with exact independently computed samples', () => {
  const state = E.basisState(9, 1);
  const character = A.stored('gf9', state, entry('eq-28'));
  const expectedCharacter = Array.from({ length: 9 }, (_, x) => chi9(x));
  vectorClose(character.transform.originalValues, expectedCharacter);
  vectorClose(character.preparedState, matvec(F9, expectedCharacter.map(value => c(value.re / 3, value.im / 3))));
  const quadratic = A.stored('gf9', state, entry('eq-37'));
  const squares = new Set(Array.from({ length: 8 }, (_, x) => mul9(x + 1, x + 1)));
  const signs = Array.from({ length: 9 }, (_, x) => c(x === 0 ? 0 : squares.has(x) ? 1 : -1));
  vectorClose(quadratic.transform.originalValues, signs);
  close(quadratic.transform.scale, Math.sqrt(8));
  vectorClose(quadratic.transform.restoredValues, signs);
  assert.equal(character.passed, true); assert.equal(quadratic.passed, true);
  assert.match(quadratic.preparation.codec.valuesAre, /not field amplitude scalars/);
});

test('SU2 coupling uses the GF4 complex dimension and the singlet relative minus sign', () => {
  const state = E.basisState(4, 1), before = JSON.stringify(state);
  const result = A.stored('gf4', state, entry('eq-181'));
  vectorClose(result.preparedState, [c(0), c(1 / Math.sqrt(2)), c(1 / Math.sqrt(2)), c(0)]);
  vectorClose(A.stored('gf4', E.basisState(4, 2), entry('eq-181')).preparedState,
    [c(0), c(1 / Math.sqrt(2)), c(-1 / Math.sqrt(2)), c(0)]);
  assert.equal(result.reapplication.unitarity.isUnitary, true);
  assert.equal(result.passed, true);
  assert.match(result.scope, /no field-valued Clebsch/);
  assert.throws(() => A.stored('gf9', E.basisState(9, 1), entry('eq-181')), /4×4/);
  assert.equal(JSON.stringify(state), before);
});

test('arithmetic-delta signals explicitly encode the residue table rather than GF9 arithmetic', () => {
  for (const id of ['eq-318', 'eq-319']) {
    const result = A.stored('gf9', E.basisState(9, 1), entry(id));
    const expected = Array.from({ length: 9 }, (_, x) => c(((x - x ** 3) / 3 % 3 + 3) % 3));
    vectorClose(result.transform.originalValues, expected);
    vectorClose(result.transform.restoredValues, expected);
    assert.deepEqual(result.preparation.codec, {
      kind: 'residue-table-label-bijection', inputRing: 'Z/9Z', outputRing: 'Z/3Z', preservesRingOperations: false
    });
    assert.equal(result.passed, true);
  }
  assert.throws(() => A.stored('gf3', E.basisState(3, 1), entry('eq-318')), /q=p²/);
});

test('GF3 Cayley adapter uses a complex forward-time phase and consistently transforms the Hamiltonian', () => {
  const result = A.stored('gf3', E.basisState(3, 1), entry('eq-417'));
  vectorClose(result.preparedState, [c(0), c(399 / 401, -40 / 401), c(0)]);
  assert.equal(result.parameters.dt, .1); assert.equal(result.parameters.hbar, 1);
  assert.deepEqual(result.parameters.H, [[0, 0, 0], [0, 1, 0], [0, 0, 2]]);
  const root = c(-.5, Math.sqrt(3) / 2);
  const F3 = [[c(1), c(1), c(1)], [c(1), root, conj(root)], [c(1), conj(root), root]]
    .map(row => row.map(value => c(value.re / Math.sqrt(3), value.im / Math.sqrt(3))));
  const H = [[0, 0, 0], [0, 1, 0], [0, 0, 2]].map(row => row.map(value => c(value)));
  matrixClose(result.transformedHamiltonian, matmul(matmul(F3, H), adjoint(F3)));
  assert.equal(result.reapplication.unitarity.isUnitary, true);
  assert.equal(result.passed, true);
  assert.throws(() => A.stored('gf9', E.basisState(9, 1), entry('eq-417')), /dimension at most 8/);
});

test('rejected and unresolved source findings remain reference-only even for recognized adapter IDs', () => {
  const state = prepared(9), before = JSON.stringify(state);
  for (const source of registry.entries.filter(value => ['rejected', 'unresolved'].includes(value.status))) {
    const result = A.stored('gf9', state, source);
    assert.equal(result.outcome, 'reference-only'); assert.equal(result.applied, false);
    assert.equal(result.reason, source.finding);
    assert.equal(Object.hasOwn(result, 'preparedState'), false);
    assert.equal(Object.hasOwn(result, 'reapplication'), false);
  }
  for (const status of ['rejected', 'unresolved']) {
    const result = A.stored('gf9', state, { ...entry('eq-67'), status });
    assert.equal(result.outcome, 'reference-only'); assert.equal(result.applied, false);
  }
  assert.equal(JSON.stringify(state), before);
});

test('full applicability pass retains every one of the 20 findings and produces the declared normalized GF9 demonstration', () => {
  const before = JSON.stringify(registry), result = A.all(registry);
  assert.equal(registry.entries.length, 20);
  assert.equal(result.entries.length, registry.entries.length);
  assert.deepEqual(result.entries.map(value => value.id), registry.entries.map(value => value.id));
  assert.equal(new Set(result.entries.map(value => value.id)).size, 20);
  const counts = result.entries.reduce((sum, value) => { sum[value.outcome] = (sum[value.outcome] || 0) + 1; return sum; }, {});
  assert.deepEqual(counts, { 'metadata-retained': 4, 'signal-transformed': 4, 'operator-reapplied': 4, 'label-map-checked': 1, 'basis-covariance-verified': 2, 'reference-only': 5 });
  assert.equal(result.entries.filter(value => value.applied).length, 8);
  assert.equal(result.entries.find(value => value.id === 'eq-181').field, 'gf4');
  assert.equal(result.entries.find(value => value.id === 'eq-417').field, 'gf3');
  assert.deepEqual(result.sourceAudit, { schema: registry.schema, version: registry.version, sha256: registry.source.sha256 });
  const saved = JSON.parse(JSON.stringify(result));
  const cosine = -.6052939880428941, sine = -.7960020025346223;
  const expectedRotations = {
    x: [[1, 0, 0], [0, cosine, -sine], [0, sine, cosine]],
    y: [[cosine, 0, sine], [0, 1, 0], [-sine, 0, cosine]],
    z: [[cosine, -sine, 0], [sine, cosine, 0], [0, 0, 1]]
  };
  const rotations = { x: saved.images.rotation, ...saved.images.rotation.otherAxes };
  assert.deepEqual(Object.keys(rotations), ['x', 'y', 'z']);
  const root = c(-.5, Math.sqrt(3) / 2);
  const F3 = [[c(1), c(1), c(1)], [c(1), root, conj(root)], [c(1), conj(root), root]]
    .map(row => row.map(value => c(value.re / Math.sqrt(3), value.im / Math.sqrt(3))));
  const basis1 = [c(0), c(1), c(0)];
  for (const [axis, rotation] of Object.entries(rotations)) {
    const expected = expectedRotations[axis].map(row => row.map(value => c(value)));
    assert.equal(rotation.axis, axis); assert.equal(rotation.angleDegrees, 232.75);
    matrixClose(rotation.original.matrix, expected);
    matrixClose(rotation.reapplication.transformedOperator, matmul(matmul(F3, expected), adjoint(F3)));
    vectorClose(rotation.preparedState, matvec(expected, basis1));
    vectorClose(rotation.reapplication.output, matvec(expected, basis1));
    assert.equal(rotation.passed, true); assert.equal(rotation.reapplication.passed, true);
  }
  const maximumRotationResidual = Math.max(...Object.values(rotations)
    .flatMap(rotation => Object.values(rotation.reapplication.checks).map(check => check.residual)));
  assert.equal(saved.checks.rotation.passed, true);
  assert.equal(saved.checks.rotation.residual, maximumRotationResidual);
  const p = result.images.pendulum;
  const source = p.samples.map(value => c(-9.81 * Math.sin(value.theta)));
  const scale = vectorNorm(source);
  const psi = matvec(F9, source.map(value => c(value.re / scale)));
  const displacement = psi.map((_, x) => times(times(chi9(neg9(mul9(2, mul9(3, 4)))), chi9(mul9(4, x))), psi[sub9(x, 3)]));
  const final = matvec(reflection9(3, 4), displacement);
  assert.equal(result.finalState.field, 'gf9');
  vectorClose(result.finalState.vector, final);
  close(vectorNorm(result.finalState.vector), 1);
  const expectedGrid = independentWigner9(final);
  result.finalState.wigner.grid.forEach((row, q0) => row.forEach((value, p0) => close(value, expectedGrid[q0][p0])));
  assert.equal(result.finalState.audit.passed, true); assert.equal(result.finalState.wigner.passed, true);
  assert.ok(result.finalState.wigner.negativeCellCount > 0);
  assert.equal(result.passed, true);
  assert.match(result.scope, /Only declared adapters execute/);
  assert.equal(JSON.stringify(registry), before);
});

test('invalid continuum parameters and incompatible mathematical domains reject without modifying supplied states', () => {
  const state = prepared(9), before = JSON.stringify(state);
  const attempts = [
    () => A.pendulum('gf9', 0, 1, .2), () => A.pendulum('gf9', NaN, 1, .2),
    () => A.pendulum('gf9', 9.81, 0, .2), () => A.pendulum('gf9', 9.81, 1, Math.PI + .01),
    () => A.pendulum('gf9', '9.81', 1, .2), () => A.pendulum('gf9', 1e6, 1e-9, .2),
    () => A.rotation('gf9', state, 'x', 232.75), () => A.rotation('gf3', E.basisState(3, 1), 'bad', 232.75),
    () => A.rotation('gf3', E.basisState(3, 1), 'x', Infinity),
    () => A.rotation('gf3', [c(1), c(1), c(0)], 'x', 232.75),
    () => A.zeta('gf9', 1), () => A.zeta('gf9', 9), () => A.zeta('gf9', 2.5), () => A.zeta('gf9', '2'),
    () => A.wignerCovariance('gf4', E.basisState(4, 1)),
    () => A.wignerCovariance('gf9', state.map(value => c(value.re * 2, value.im * 2))),
    () => A.stored('gf4', E.basisState(4, 1), entry('eq-37')),
    () => A.stored('gf4', E.basisState(4, 1), entry('eq-67')),
    () => A.stored('gf4', E.basisState(4, 1), entry('eq-88'))
  ];
  attempts.forEach(run => assert.throws(run));
  assert.equal(JSON.stringify(state), before);
});

test('model adapters reject unregistered field objects rather than trusting substituted arithmetic', () => {
  const fake = { ...E.field('gf9'), id: 'unregistered', character: () => c(1) };
  assert.throws(() => A.pendulum(fake));
  assert.throws(() => A.zeta(fake, 2));
  assert.throws(() => A.wignerCovariance(fake, E.basisState(9, 1)));
  assert.throws(() => A.stored(fake, E.basisState(9, 1), entry('field-algebra')));
});
