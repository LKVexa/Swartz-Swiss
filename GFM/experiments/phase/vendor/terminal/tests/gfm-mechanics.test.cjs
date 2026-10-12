'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../src/engine.js');
const M = require('../src/gfm-mechanics.js');
const c = (re, im = 0) => ({ re, im });
const plain = value => JSON.parse(JSON.stringify(value));
const norm = values => values.reduce((n, v) => Math.hypot(n, v.re, v.im), 0);
function close(actual, expected, scale = Math.max(Math.abs(expected), 1)) {
  assert.ok(Number.isFinite(actual));
  assert.ok(Math.abs(actual - expected) <= 1e-10 * scale + 32 * Number.MIN_VALUE, `${actual} differs from ${expected}`);
}
function vectorClose(actual, expected) {
  assert.equal(actual.length, expected.length);
  const scale = norm(expected);
  actual.forEach((v, i) => { close(v.re, expected[i].re, scale); close(v.im, expected[i].im, scale); });
}
const mod3 = n => (n % 3 + 3) % 3;
const mul9 = (a, b) => mod3(a % 3 * (b % 3) - Math.floor(a / 3) * Math.floor(b / 3)) + 3 * mod3(a % 3 * Math.floor(b / 3) + Math.floor(a / 3) * (b % 3));
const add9 = (a, b) => mod3(a % 3 + b % 3) + 3 * mod3(Math.floor(a / 3) + Math.floor(b / 3));
function pow9(a, e) { let r = 1; for (let j = 0; j < e; j++) r = mul9(r, a); return r; }
function directFourier(values, field, inverse = false) {
  const q = field === 'gf3' ? 3 : 9;
  return Array.from({ length: q }, (_, k) => values.reduce((s, v, x) => {
    const trace = field === 'gf3' ? k * x % 3 : mod3(2 * (mul9(k, x) % 3));
    const angle = (inverse ? -1 : 1) * 2 * Math.PI * trace / 3, re = Math.cos(angle), im = Math.sin(angle);
    return c(s.re + (re * v.re - im * v.im) / Math.sqrt(q), s.im + (re * v.im + im * v.re) / Math.sqrt(q));
  }, c(0)));
}
function matVec(matrix, values) {
  return matrix.map(row => row.reduce((s, a, j) => c(s.re + a.re * values[j].re - a.im * values[j].im, s.im + a.re * values[j].im + a.im * values[j].re), c(0)));
}

test('mechanics API loads in CommonJS and a browser-like environment without quantum dataset prerequisites', () => {
  assert.equal(globalThis.RusslGFMMechanics, M);
  const context = vm.createContext({ TextEncoder });
  for (const file of ['engine.js', 'refined-field.js', 'refined-scalar.js', 'gfm-matrix.js', 'gfm-exact.js', 'gfm-models.js', 'horizon-gr.js', 'horizon-scenario.js', 'gfm-mechanics.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), context);
  const output = context.RusslGFMMechanics.traceTransform(context.RusslGFMMechanics.dataset('gf3', [2, 0, 0]));
  close(output.outputNorm, 2); assert.equal(output.passed, true);
  assert.equal(Object.hasOwn(output.dataset, 'probabilities'), false);
});

test('datasets preserve raw values, zero signals, codec data and independent copies', () => {
  const codec = { units: 'meters', nodes: [1, 2, 3], assumptions: { test: true } };
  const values = [2, [3, -4], c(0, 7)], before = plain({ codec, values });
  const d = M.dataset(E.fields.gf3, values, codec);
  assert.deepEqual(d.values, [c(2), c(3, -4), c(0, 7)]); close(norm(d.values), Math.sqrt(78));
  assert.equal(d.representation, 'samples'); assert.deepEqual(d.operations, []);
  d.codec.nodes[0] = 99; d.values[1].re = 50;
  assert.deepEqual({ codec, values }, before);
  const copy = M.validate(d); copy.values[0].re = 77; copy.codec.assumptions.test = false;
  assert.equal(d.values[0].re, 2); assert.equal(d.codec.assumptions.test, true);
  assert.deepEqual(M.dataset('gf3', [0, 0, 0]).values, [c(0), c(0), c(0)]);
});

for (const field of ['gf3', 'gf9']) test(`raw ${field} trace coefficients agree with an independent positive-character matrix`, () => {
  const q = E.field(field).q, values = Array.from({ length: q }, (_, j) => c(2 + .5 * j, j % 2 ? -3 : .75));
  const d = M.dataset(field, values, { units: 'acceleration' }), before = plain(d);
  const result = M.traceTransform(d);
  vectorClose(result.dataset.values, directFourier(values, field));
  close(result.inputNorm, norm(values)); close(result.outputNorm, norm(values));
  close(result.checks.energyPreservation.inputEnergy, norm(values) ** 2);
  assert.ok(result.inputNorm > 1); assert.equal(result.passed, true);
  assert.equal(result.dataset.representation, 'trace-coefficients'); assert.deepEqual(d, before);
  const restored = M.traceTransform(result.dataset, true);
  vectorClose(restored.dataset.values, values); assert.equal(restored.dataset.representation, 'samples');
  assert.deepEqual(restored.dataset.operations, ['trace.forward', 'trace.inverse']);
  assert.deepEqual(restored.dataset.codec, d.codec);
});

test('all fields retain raw energy and exact zero data through forward and inverse trace transforms', () => {
  for (const id of Object.keys(E.fields)) {
    const q = E.field(id).q;
    for (const values of [Array(q).fill(0), Array.from({ length: q }, (_, j) => c(j - 3, .125 * j))]) {
      const d = M.dataset(id, values), f = M.traceTransform(d), inverse = M.traceTransform(f.dataset, true);
      assert.equal(f.passed, true); assert.equal(inverse.passed, true); vectorClose(inverse.dataset.values, d.values);
      if (values.every(v => v === 0)) { assert.ok(f.dataset.values.every(v => v.re === 0 && v.im === 0)); assert.equal(f.checks.energyPreservation.inputEnergy, 0); }
    }
  }
});

test('large and extremely small raw scales are preserved rather than replaced by unit norm', () => {
  const values = [c(2, -3), c(-1, 4), c(7, .5)];
  const ordinary = M.traceTransform(M.dataset('gf3', values));
  for (const scale of [1e90, 1e-170]) {
    const raw = values.map(v => c(v.re * scale, v.im * scale)), result = M.traceTransform(M.dataset('gf3', raw));
    vectorClose(result.dataset.values, ordinary.dataset.values.map(v => c(v.re * scale, v.im * scale)));
    vectorClose(M.traceTransform(result.dataset, true).dataset.values, raw);
    close(result.outputNorm, norm(raw), norm(raw)); assert.equal(result.passed, true);
    assert.notEqual(result.computationScale, 1);
    if (scale < 1e-100) assert.equal(result.checks.energyPreservation.energyUnderflow, true);
  }
  const boundary = M.traceTransform(M.dataset('gf4', Array(4).fill(5e99)));
  close(boundary.outputNorm, 1e100, 1e100); assert.equal(boundary.passed, true);
});

test('exact prime and binary extension examples fix polynomial DFT root and inverse-length conventions', () => {
  const prime = M.polynomialTransform(M.dataset('gf3', [1, 2], {}, 'field-values'));
  assert.deepEqual(prime.dataset.values, [0, 2]); assert.equal(prime.kernel.primitiveRoot, 2);
  assert.equal(prime.kernel.embeddedLength, 2); assert.equal(prime.kernel.inverseLength, 2);
  assert.deepEqual(M.polynomialTransform(prime.dataset, true).dataset.values, [1, 2]);
  const binary = M.polynomialTransform(M.dataset('gf4', [1, 2, 3], {}, 'field-values'));
  assert.deepEqual(binary.kernel.matrix, [[1, 1, 1], [1, 2, 3], [1, 3, 2]]);
  assert.deepEqual(binary.dataset.values, [0, 0, 1]); assert.equal(binary.kernel.inverseLength, 1);
  assert.deepEqual(binary.ordering.nonzeroFieldNodes, [1, 2, 3]);
});

test('GF9 polynomial coefficients are independently evaluated in GF3[alpha]/(alpha squared+1)', () => {
  const input = [0, 1, 2, 3, 4, 5, 6, 7], result = M.polynomialTransform(M.dataset('gf9', input, { meaning: 'field coefficients' }, 'field-values'));
  assert.equal(result.kernel.primitiveRoot, 4);
  const expected = Array.from({ length: 8 }, (_, k) => input.reduce((sum, x, j) => add9(sum, mul9(x, pow9(4, j * k % 8))), 0));
  assert.deepEqual(result.dataset.values, expected);
  const inverse = M.polynomialTransform(result.dataset, true);
  assert.deepEqual(inverse.dataset.values, input); assert.equal(inverse.kernel.inverseLength, 2);
  assert.deepEqual(inverse.dataset.operations, ['polynomial.forward', 'polynomial.inverse']);
});

test('every registered field polynomial DFT exactly preserves zero, constant and full-label sequences', () => {
  for (const id of Object.keys(E.fields)) {
    const f = E.field(id), N = f.q - 1;
    for (const input of [Array(N).fill(0), Array(N).fill(1), Array.from({ length: N }, (_, j) => j)]) {
      const d = M.dataset(f, input, { units: 'field labels' }, 'field-values'), before = plain(d), result = M.polynomialTransform(d), inverse = M.polynomialTransform(result.dataset, true);
      assert.deepEqual(inverse.dataset.values, input); assert.equal(result.passed, true); assert.deepEqual(d, before);
      assert.equal(new Set(result.ordering.nonzeroFieldNodes).size, N);
      assert.equal(result.ordering.nonzeroFieldNodes.includes(0), false);
      if (input.every(x => x === 1)) assert.deepEqual(result.dataset.values, [N % f.p, ...Array(N - 1).fill(0)]);
      assert.equal(Object.hasOwn(result.checks, 'energyPreservation'), false);
    }
  }
});

test('transform direction and scalar domains must match the declared representation', () => {
  const signal = M.dataset('gf3', [1, 2, 3]), labels = M.dataset('gf3', [1, 2], {}, 'field-values');
  for (const call of [() => M.traceTransform(signal, true), () => M.polynomialTransform(labels, true), () => M.traceTransform(labels), () => M.polynomialTransform(signal), () => M.traceTransform(signal, 'false')]) assert.throws(call);
  assert.throws(() => M.traceTransform(M.traceTransform(signal).dataset));
  assert.throws(() => M.polynomialTransform(M.polynomialTransform(labels).dataset));
  assert.throws(() => M.validate({ ...signal, representation: 'polynomial-coefficients' }));
});

test('strict malformed-data checks reject coercions, field substitutions, accessors, sparse arrays and metadata cycles', () => {
  const bad = [
    () => M.dataset({ ...E.field('gf3') }, [1, 2, 3]),
    () => M.dataset('gf3', [1, 2]), () => M.dataset('gf3', [1, 2, NaN]),
    () => M.dataset('gf3', ['1', 2, 3]), () => M.dataset('gf3', [{ re: 1, im: 0, probability: 1 }, 2, 3]),
    () => M.dataset('gf3', [Infinity, 2, 3]), () => M.dataset('gf3', [1e101, 0, 0]),
    () => M.dataset('gf9', Array(8).fill(9), {}, 'field-values'),
    () => M.dataset('gf3', [1, 2, 3], {}, 'real-probabilities'),
    () => M.dataset('gf3', [1, 2, 3], new Date())
  ];
  bad.forEach(run => assert.throws(run));
  const sparse = [1, , 3]; assert.throws(() => M.dataset('gf3', sparse));
  let invoked = false; const codec = {}; Object.defineProperty(codec, 'unit', { enumerable: true, get() { invoked = true; return 'm'; } });
  assert.throws(() => M.dataset('gf3', [1, 2, 3], codec)); assert.equal(invoked, false);
  const cycle = {}; cycle.self = cycle; assert.throws(() => M.dataset('gf3', [1, 2, 3], cycle));
  const d = M.dataset('gf3', [1, 2, 3]); assert.throws(() => M.validate({ ...d, quantumState: true }));
  assert.throws(() => M.validate({ ...d, operations: Array(101).fill('trace.forward') }));
  assert.throws(() => M.traceTransform({ ...d, operations: Array(100).fill('trace.forward') }));
});

test('pendulum mechanics profiles retain ordinary acceleration, units, parameters and large raw scale', () => {
  const d = M.profile('gf9', 'pendulum', { g: 9.81, length: 2, maxAngle: .3 });
  const expected = Array.from({ length: 9 }, (_, j) => c(-4.905 * Math.sin(.3 * (j / 4 - 1))));
  vectorClose(d.values, expected); assert.equal(d.codec.units.value, 'radians/second^2');
  close(d.codec.reference.smallAnglePeriod, 2 * Math.PI / Math.sqrt(4.905));
  assert.deepEqual(d.codec.parameters, { g: 9.81, length: 2, maxAngle: .3 });
  const large = M.profile('gf16', 'pendulum', { g: 1e6, length: 1, maxAngle: Math.PI / 2 });
  assert.ok(norm(large.values) > 1e6); assert.equal(M.traceTransform(large).passed, true);
});

test('ordinary exterior profiles retain corrected metric values, scale, orientation and zero frame signals', () => {
  const gtt = M.profile('gf9', 'gtt', { M: 2, a: .4, Q: .3, rMin: 5, rMax: 9, theta: .7 });
  gtt.values.forEach((v, j) => { const r = 5 + j / 2, sigma = r * r + .4 * .4 * Math.cos(.7) ** 2; close(v.re, -(1 - (4 * r - .09) / sigma)); assert.equal(v.im, 0); });
  assert.equal(gtt.codec.units, 'dimensionless'); assert.ok(Math.abs(norm(gtt.values) - 1) > .1);
  const positive = M.profile('gf9', 'frameOmega', { a: .6, Q: .3, rMin: 3 }), negative = M.profile('gf9', 'frameOmega', { a: -.6, Q: .3, rMin: 3 });
  vectorClose(negative.values, positive.values.map(v => c(-v.re))); assert.equal(positive.codec.units, 'inverse geometrized length');
  const zero = M.profile('gf9', 'frameOmega', { a: 0, rMin: 3 });
  assert.ok(zero.values.every(v => v.re === 0 && v.im === 0)); assert.equal(M.traceTransform(zero).passed, true);
  assert.throws(() => M.profile('gf9', 'gtt', { a: 1, Q: .1 }));
  assert.throws(() => M.profile('gf9', 'gtt', { rMin: 1 }));
});

test('raw hypothetical profiles retain zero passage and large unnormalized radius without quantum preparation', () => {
  const sealed = M.profile('gf9', 'aggiePassage'); assert.ok(sealed.values.every(v => v.re === 0));
  vectorClose(M.traceTransform(sealed).dataset.values, sealed.values);
  const gas = M.profile('gf9', 'gaseousPassage'), uncovered = M.profile('gf9', 'aggiePassage', { aggieLoad: 0 });
  assert.deepEqual(gas.values, uncovered.values); assert.equal(gas.codec.sourceStatus, 'toy-assumption');
  const large = M.profile('gf16', 'aperture', { alphaCritical: 0, r0: 1e6 });
  assert.deepEqual(large.values, [c(0), ...Array.from({ length: 15 }, () => c(1e6))]);
  close(norm(large.values), 1e6 * Math.sqrt(15)); assert.equal(M.traceTransform(large).passed, true);
  assert.equal(Object.hasOwn(large, 'preparedState'), false); assert.equal(Object.hasOwn(large, 'preparation'), false);
  assert.throws(() => M.profile('gf9', 'aperture', { epsilonSpin: 0, Q: Number.MIN_VALUE }));
  assert.throws(() => M.profile('gf9', 'pendulum', { invalid: 1 }));
});

test('reapplication transports raw horizon and three image families while preserving scoped source dispositions', () => {
  const registry = require('../horizon-equations.json'), old = require('../equation-audit.json'), before = JSON.stringify({ registry, old });
  const result = M.reapply(registry, old), report = plain(result.report);
  assert.equal(result.passed, true); assert.deepEqual(report.coverage, { newFindings: 49, pdfNumberedEquations: 23, previousFindings: 20, previousImageFamilies: 3 });
  assert.deepEqual(report.entries.map(e => e.id), registry.entries.map(e => e.id));
  assert.deepEqual(report.historicalReference.registry, old);
  assert.equal(report.historicalReference.entries.length, 20);
  assert.ok(report.historicalReference.entries.every(e => e.outcome === 'historical-reference-retained' && e.appliedToDataset === false));
  assert.equal(report.entries.find(e => e.id === 'pdf-21').outcome, 'reference-retained');
  assert.equal(report.entries.find(e => e.id === 'image-etm-kn-fragment').outcome, 'reference-retained');
  assert.ok(report.entries.every(e => e.appliedToDataset === false));
  const values = Array.from({ length: 9 }, (_, j) => c(-1 + 2 / (2 + .75 * j)));
  vectorClose(report.primary.samples.values, values); vectorClose(result.dataset.values, directFourier(values, 'gf9'));
  vectorClose(report.primary.restoredSamples.values, values); assert.ok(Math.abs(norm(result.dataset.values) - 1) > .1);
  const pendulum = report.images.pendulum;
  vectorClose(pendulum.samples.values, Array.from({ length: 9 }, (_, j) => c(-9.81 * Math.sin(.2 * (j / 4 - 1)))));
  vectorClose(pendulum.dataset.values, directFourier(pendulum.samples.values, 'gf9'));
  const mellin = report.images.zetaGamma, rawMellin = Array.from({ length: 9 }, (_, j) => { const t = (j + .5) * 12 / 9; return c(t / Math.expm1(t)); });
  vectorClose(mellin.samples.values, rawMellin); vectorClose(mellin.dataset.values, directFourier(rawMellin, 'gf9'));
  close(mellin.reference.product, Math.PI ** 2 / 6); close(mellin.finiteSampling.coarseIntegral, rawMellin.reduce((s, v) => s + v.re, 0) * 12 / 9);
  assert.equal(JSON.stringify({ registry, old }), before);
  function forbiddenKeys(v) { if (!v || typeof v !== 'object') return []; return Object.entries(v).flatMap(([k, x]) => ['wigner', 'preparedState', 'probabilities'].includes(k) ? [k] : forbiddenKeys(x)); }
  assert.deepEqual(forbiddenKeys(result), []);
});

test('all three saved rotation transports act on raw Cartesian [1,2,3] and independently recover real Rx/Ry/Rz outputs', () => {
  const rotations = M.reapply(require('../horizon-equations.json'), require('../equation-audit.json')).report.images.rotation.axes;
  const angle = 232.75 * Math.PI / 180, cosine = Math.cos(angle), sine = Math.sin(angle);
  const expectedMatrices = { x: [[1, 0, 0], [0, cosine, -sine], [0, sine, cosine]], y: [[cosine, 0, sine], [0, 1, 0], [-sine, 0, cosine]], z: [[cosine, -sine, 0], [sine, cosine, 0], [0, 0, 1]] };
  for (const axis of ['x', 'y', 'z']) {
    const r = rotations[axis], input = [c(1), c(2), c(3)], expected = matVec(expectedMatrices[axis].map(row => row.map(v => c(v))), input);
    vectorClose(r.input.values, input); vectorClose(r.output.values, expected); vectorClose(r.directOutput, expected);
    vectorClose(r.transformedOutput, directFourier(expected, 'gf3'));
    const transformedProbe = [c(2, 1), c(-4, .5), c(3, -2)], inverseProbe = directFourier(transformedProbe, 'gf3', true);
    const expectedAction = directFourier(matVec(expectedMatrices[axis].map(row => row.map(v => c(v))), inverseProbe), 'gf3');
    vectorClose(matVec(r.transformedOperator, transformedProbe), expectedAction);
    close(norm(r.output.values), Math.sqrt(14)); assert.equal(r.passed, true);
  }
});
