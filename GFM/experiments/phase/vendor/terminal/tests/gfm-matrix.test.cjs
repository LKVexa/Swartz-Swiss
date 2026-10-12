'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../src/engine.js');
const G = require('../src/gfm-matrix.js');
const EPS = 1e-10;
const c = (re, im = 0) => ({ re, im });
const cmul = (a, b) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const conj = a => c(a.re, -a.im);
function close(actual, expected) { assert.ok(Math.abs(actual - expected) < EPS, `${actual} differs from ${expected}`); }
function cclose(actual, expected) { close(actual.re, expected.re); close(actual.im, expected.im); }
function vectorClose(actual, expected) { assert.equal(actual.length, expected.length); actual.forEach((value, i) => cclose(value, expected[i])); }
function matrixClose(actual, expected) { assert.equal(actual.length, expected.length); actual.forEach((row, i) => vectorClose(row, expected[i])); }
const adjoint = A => A[0].map((_, j) => A.map(row => conj(row[j])));
const multiply = (A, B) => A.map(row => B[0].map((_, j) => row.reduce((sum, value, k) => {
  const t = cmul(value, B[k][j]); return c(sum.re + t.re, sum.im + t.im);
}, c(0))));
function complexState(q) { return E.normalize(Array.from({ length: q }, (_, i) => c(Math.sin(i + 0.2), Math.cos(2 * i - 0.4)))); }
const root = c(-0.5, Math.sqrt(3) / 2);
const explicitF3 = [
  [c(1), c(1), c(1)],
  [c(1), root, conj(root)],
  [c(1), conj(root), root]
].map(row => row.map(value => c(value.re / Math.sqrt(3), value.im / Math.sqrt(3))));

test('GF3 uses prime-field arithmetic, absolute trace, and positive F3 roots', () => {
  const f = E.field('gf3');
  assert.equal(f.q, 3); assert.equal(f.n, 1);
  assert.deepEqual(f.polynomial, [0, 1]);
  assert.equal(f.add(2, 2), 1); assert.equal(f.mul(2, 2), 1); assert.equal(f.neg(1), 2);
  assert.deepEqual([0, 1, 2].map(x => f.trace(x)), [0, 1, 2]);
  assert.deepEqual([0, 1, 2].map(x => f.frobenius(x)), [0, 1, 2]);
  matrixClose(G.fourierMatrix(f), explicitF3);
  vectorClose(G.apply(G.fourierMatrix(f), [0, 1, 0]), explicitF3.map(row => row[1]));
});

test('module loads in CommonJS and a dependency-free browser context', () => {
  assert.equal(globalThis.RusslGFMMatrix, G);
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/engine.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/gfm-matrix.js'), 'utf8'), context);
  assert.equal(context.RusslGFMMatrix.fourierMatrix('gf3').length, 3);
  assert.equal(context.RusslGFMMatrix.rotation('z', 232.75).passed, true);
});

test('F3 conjugation of a diagonal operator gives an independently known circulant matrix', () => {
  const transformed = G.changeBasis('gf3', [[1, 0, 0], [0, 2, 0], [0, 0, 4]]);
  const d = c(7 / 3), t1 = c(-2 / 3, -Math.sqrt(3) / 3), t2 = conj(t1);
  matrixClose(transformed, [[d, t2, t1], [t1, d, t2], [t2, t1, d]]);
  matrixClose(G.changeBasis('gf3', transformed, true), [[1, 0, 0], [0, 2, 0], [0, 0, 4]].map(row => row.map(value => c(value))));
});

test('rotation 232.75 degrees uses real active column signs for all three axes', () => {
  // Independent double values from Python's real trigonometry at 232.75°.
  const cosine = -0.6052939880428941, sine = -0.7960020025346223;
  const expected = {
    x: [[1, 0, 0], [0, cosine, -sine], [0, sine, cosine]],
    y: [[cosine, 0, sine], [0, 1, 0], [-sine, 0, cosine]],
    z: [[cosine, -sine, 0], [sine, cosine, 0], [0, 0, 1]]
  };
  for (const axis of ['x', 'y', 'z']) {
    const result = G.rotation(axis, 232.75);
    matrixClose(result.matrix, expected[axis].map(row => row.map(value => c(value))));
    close(result.angleRadians, 4.062253834016802);
    close(result.determinant, 1);
    assert.equal(result.passed, true);
    assert.match(result.domain, /real numbers/);
    const product = multiply(adjoint(result.matrix), result.matrix);
    matrixClose(product, Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => c(i === j ? 1 : 0))));
  }
  vectorClose(G.apply(G.rotation('z', 232.75).matrix, [1, 0, 0]), [c(cosine), c(sine), c(0)]);
});

test('complex Fourier representation of the real rotation agrees with explicit F3 conjugation', () => {
  const R = G.rotation('z', 232.75).matrix;
  const expected = multiply(multiply(explicitF3, R), adjoint(explicitF3));
  const transformed = G.changeBasis('gf3', R);
  matrixClose(transformed, expected);
  assert.ok(transformed.flat().some(value => Math.abs(value.im) > 0.1), 'Ordinary complex matrix entries must survive the representation change');
  const reapplied = G.reapply('gf3', R, [1, 0, 0]);
  vectorClose(reapplied.transformedOutput, G.apply(expected, explicitF3.map(row => row[0])));
  vectorClose(reapplied.output, [c(-0.6052939880428941), c(-0.7960020025346223), c(0)]);
  assert.equal(reapplied.unitarity.isUnitary, true);
  assert.equal(reapplied.outputNormalized, true);
  assert.equal(reapplied.passed, true);
});

for (const id of Object.keys(E.fields)) {
  test(`${id} matrix Fourier and operator construction agree with the production field action`, () => {
    const f = E.field(id), state = complexState(f.q);
    vectorClose(G.apply(G.fourierMatrix(f), state), E.fourier(f, state));
    const shift = G.operatorFrom(f, vector => E.shift(f, vector, 1));
    vectorClose(G.apply(shift, state), E.shift(f, state, 1));
    const phase = G.operatorFrom(f, vector => E.phase(f, vector, 1));
    vectorClose(G.apply(phase, state), E.phase(f, state, 1));
    const result = G.reapply(f, phase, state);
    vectorClose(result.output, E.phase(f, state, 1));
    assert.equal(result.unitarity.isUnitary, true);
    assert.equal(result.passed, true);
  });
}

test('nonunitary operators retain their actual norm while representation covariance passes', () => {
  const result = G.reapply('gf3', [[2, 0, 0], [0, 3, 0], [0, 0, 4]], [1, 0, 0]);
  vectorClose(result.output, [c(2), c(0), c(0)]);
  close(result.norms.output, 2); close(result.norms.directOutput, 2); close(result.norms.transformedOutput, 2);
  assert.equal(result.unitarity.isUnitary, false);
  assert.equal(result.outputNormalized, false);
  assert.equal(result.checks.unitaryNormPreservation, undefined);
  assert.equal(result.passed, true);
  const zero = G.reapply('gf3', [[0, 0, 0], [0, 0, 0], [0, 0, 0]], [1, 0, 0]);
  close(zero.norms.output, 0); assert.equal(zero.outputNormalized, false); assert.equal(zero.passed, true);
});

test('complex non-Hermitian operators also recover Aψ without implicit normalization', () => {
  const A = [[c(0, 2), c(1), c(0)], [c(0), c(0, -1), c(0)], [c(0), c(0), c(3)]];
  const state = complexState(3);
  const result = G.reapply('gf3', A, state);
  vectorClose(result.output, G.apply(A, state));
  assert.equal(result.unitarity.isUnitary, false);
  assert.equal(result.passed, true);
});

test('sample preparation retains scale and independently known forward F3 phases', () => {
  const result = G.sampleTransform('gf3', [0, 2, 0]);
  close(result.scale, 2);
  vectorClose(result.normalizedSamples, [c(0), c(1), c(0)]);
  vectorClose(result.transformedState, explicitF3.map(row => row[1]));
  vectorClose(result.unscaledCoefficients, explicitF3.map(row => c(2 * row[1].re, 2 * row[1].im)));
  vectorClose(result.restoredValues, [c(0), c(2), c(0)]);
  assert.equal(result.passed, true);
  const mixedEncoding = [c(1, 2), [3, -1], -2];
  const before = JSON.stringify(mixedEncoding);
  const mixed = G.sampleTransform('gf3', mixedEncoding);
  vectorClose(mixed.originalValues, [c(1, 2), c(3, -1), c(-2)]);
  vectorClose(mixed.restoredValues, mixed.originalValues);
  assert.equal(mixed.passed, true);
  assert.equal(JSON.stringify(mixedEncoding), before);
});

test('matrix and state inputs remain unchanged through transforms and application', () => {
  const A = G.rotation('y', 232.75).matrix, state = complexState(3);
  const before = JSON.stringify({ A, state });
  G.changeBasis('gf3', A); G.changeBasis('gf3', A, true); G.apply(A, state); G.reapply('gf3', A, state);
  assert.equal(JSON.stringify({ A, state }), before);
});

test('dimension, finite-value, input-bound, and nonzero preparation rules are enforced', () => {
  const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], state = [1, 0, 0];
  for (const invalid of [null, [], [[1, 0], [0]], new Array(3), [[NaN]], [[Infinity]], [['1']], [[1e7]], Array.from({ length: 17 }, () => new Array(17).fill(0))]) assert.throws(() => G.apply(invalid, state));
  for (const badState of [[1, 0], ['1', 0, 0], [NaN, 0, 0], [1e7, 0, 0], new Array(3)]) assert.throws(() => G.apply(I, badState));
  for (const degrees of [NaN, Infinity, '232.75', null, 1000001, -1000001]) assert.throws(() => G.rotation('z', degrees));
  for (const axis of ['', 'w', null, 1]) assert.throws(() => G.rotation(axis, 232.75));
  assert.throws(() => G.changeBasis('gf3', I, 'false'));
  assert.throws(() => G.changeBasis('gf9', I));
  assert.throws(() => G.fourierMatrix('gf80'));
  assert.throws(() => G.fourierMatrix({ id: 'gf3' }));
  assert.throws(() => G.operatorFrom('gf3', null));
  assert.throws(() => G.operatorFrom('gf3', () => Promise.resolve(state)));
  assert.throws(() => G.operatorFrom('gf3', () => [1, 0]));
  assert.throws(() => G.reapply('gf3', I, [2, 0, 0]), /normalized/);
  assert.throws(() => G.reapply('gf3', I, [0, 0, 0]), /normalized/);
  assert.throws(() => G.sampleTransform('gf3', [0, 0, 0]), /Zero samples/);
  assert.throws(() => G.sampleTransform('gf3', [1, 0]));
});

test('validation rejects executable accessors before invoking them', () => {
  let calls = 0;
  const bad = Object.defineProperty({ im: 0 }, 're', { enumerable: true, get() { calls += 1; return 1; } });
  assert.throws(() => G.apply([[bad]], [1]));
  const row = [0];
  Object.defineProperty(row, '0', { enumerable: true, get() { calls += 1; return 1; } });
  assert.throws(() => G.apply([row], [1]));
  assert.equal(calls, 0);
});
