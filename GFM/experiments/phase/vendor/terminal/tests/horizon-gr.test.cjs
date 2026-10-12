'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('../src/horizon-gr.js');
function close(actual, expected, epsilon = 1e-10) {
  assert.ok(Number.isFinite(actual));
  assert.ok(Math.abs(actual - expected) <= epsilon * Math.max(Math.abs(expected), 1e-300), `${actual} differs from ${expected}`);
}
function matrixClose(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((row, i) => row.forEach((value, j) => {
    if (expected[i][j] === 0) assert.ok(Math.abs(value) < 1e-13);
    else close(value, expected[i][j]);
  }));
}
function determinant(matrix) {
  // Independent general elimination, without the metric's block determinant.
  const A = matrix.map(row => row.slice());
  let answer = 1;
  for (let k = 0; k < A.length; k++) {
    let pivot = k;
    for (let i = k + 1; i < A.length; i++) if (Math.abs(A[i][k]) > Math.abs(A[pivot][k])) pivot = i;
    if (A[pivot][k] === 0) return 0;
    if (pivot !== k) { [A[k], A[pivot]] = [A[pivot], A[k]]; answer = -answer; }
    answer *= A[k][k];
    for (let i = k + 1; i < A.length; i++) {
      const ratio = A[i][k] / A[k][k];
      for (let j = k + 1; j < A.length; j++) A[i][j] -= ratio * A[k][j];
    }
  }
  return answer;
}
function metricFromSquares(M, a, Q, r, theta) {
  // Negative of Adamo-Newman Eq.3.2, independently expanding two rank-one
  // squares rather than using the production component expressions.
  const sigma = r ** 2 + a ** 2 * Math.cos(theta) ** 2;
  const delta = r ** 2 - 2 * M * r + a ** 2 + Q ** 2;
  const s2 = Math.sin(theta) ** 2;
  const u = [1, 0, 0, -a * s2], v = [-a, 0, 0, r ** 2 + a ** 2];
  const matrix = u.map((_, i) => u.map((_, j) => -delta / sigma * u[i] * u[j] + s2 / sigma * v[i] * v[j]));
  matrix[1][1] = sigma / delta; matrix[2][2] = sigma;
  return matrix;
}
function area(M, a, Q) {
  const radius = M + Math.sqrt(M ** 2 - a ** 2 - Q ** 2);
  return 4 * Math.PI * (radius ** 2 + a ** 2);
}
function finiteData(value) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value));
  else if (value && typeof value === 'object') Object.values(value).forEach(finiteData);
}

test('stationary reference module is dependency-free in both CommonJS and a browser-like global context', () => {
  assert.equal(globalThis.RusslHorizonGR, H);
  assert.equal(H.version, '0.4.0');
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/horizon-gr.js'), 'utf8'), context);
  const result = context.RusslHorizonGR.kerrNewman(1, 0, 0);
  assert.equal(result.passed, true); assert.equal(result.rPlus, 2);
  assert.equal(context.RusslHorizonGR.metric(1, 0, 0, 3, 1).passed, true);
});

test('Schwarzschild limit has the exact horizon, area, surface gravity, entropy and irreducible mass', () => {
  for (const M of [1e-12, .5, 1, 5, 1e6]) {
    const h = H.kerrNewman(M, 0, 0);
    close(h.rPlus, 2 * M); assert.equal(h.rMinus, 0);
    close(h.area, 16 * Math.PI * M ** 2);
    close(h.kappa, 1 / (4 * M)); close(h.temperature, 1 / (8 * Math.PI * M));
    close(h.entropy, 4 * Math.PI * M ** 2); close(h.irreducibleMass, M);
    assert.equal(h.omegaH, 0); assert.equal(h.phiH, 0); assert.equal(h.J, 0);
    assert.equal(h.extremal, false); assert.equal(h.passed, true);
    close(h.smarr.rhs, M); close(h.massRelation.rhs, M ** 2);
    finiteData(h);
  }
});

test('Reissner-Nordstrom 3-4-5 reference preserves the charged mass relation', () => {
  const h = H.kerrNewman(5, 0, 3);
  assert.equal(h.rPlus, 9); assert.equal(h.rMinus, 1);
  close(h.area, 324 * Math.PI); close(h.kappa, 4 / 81); close(h.phiH, 1 / 3);
  close(h.irreducibleMass, 4.5);
  assert.equal(h.omegaH, 0); close(h.smarr.rhs, 5);
  close(h.massRelation.rhs, (4.5 + 9 / (4 * 4.5)) ** 2);
  assert.equal(h.passed, true);
});

test('Kerr 3-4-5 reference has the rotational Smarr contribution with the correct factor two', () => {
  const h = H.kerrNewman(5, 3, 0);
  assert.equal(h.J, 15); assert.equal(h.rPlus, 9); assert.equal(h.rMinus, 1);
  close(h.area, 360 * Math.PI); close(h.omegaH, 1 / 30); close(h.kappa, 2 / 45);
  close(h.temperature, 1 / (45 * Math.PI)); close(h.irreducibleMass, Math.sqrt(90) / 2);
  close(h.kappa * h.area / (4 * Math.PI), 4);
  close(2 * h.omegaH * h.J, 1); close(h.smarr.rhs, 5);
  assert.equal(h.passed, true);
});

test('generic charged Kerr horizon checks both independently assembled mass identities', () => {
  const M = 5, a = 3, Q = 1, root = Math.sqrt(15), r = 5 + root, den = 49 + 10 * root;
  const h = H.kerrNewman(M, a, Q);
  close(h.rPlus, r); close(h.rMinus, 5 - root);
  close(h.area, 4 * Math.PI * den); close(h.omegaH, 3 / den);
  close(h.kappa, root / den); close(h.phiH, r / den);
  close(h.smarr.rhs, root + 90 / den + r / den);
  close(h.massRelation.rhs, (Math.sqrt(den) / 2 + 1 / (2 * Math.sqrt(den))) ** 2 + 225 / den);
  assert.equal(h.smarr.passed, true); assert.equal(h.massRelation.passed, true);
});

test('negative angular momentum and charge reverse orientation/potential without changing horizon geometry', () => {
  const positive = H.kerrNewman(5, 3, 1), negative = H.kerrNewman(5, -3, -1);
  for (const key of ['rPlus', 'rMinus', 'area', 'kappa', 'temperature', 'entropy', 'irreducibleMass']) close(negative[key], positive[key]);
  close(negative.omegaH, -positive.omegaH); close(negative.phiH, -positive.phiH); close(negative.J, -positive.J);
  const pm = H.metric(5, 3, 1, 12, 1), nm = H.metric(5, -3, -1, 12, 1);
  close(nm.matrix[0][3], -pm.matrix[0][3]); close(nm.frameOmega, -pm.frameOmega);
  close(nm.matrix[0][0], pm.matrix[0][0]); close(nm.matrix[3][3], pm.matrix[3][3]);
  assert.equal(negative.passed, true);
});

test('extremal Kerr, RN and KN limits are explicit zero-temperature horizons, with no generic differential inferred', () => {
  for (const [M, a, Q] of [[1, 1, 0], [1, 0, 1], [5, 3, 4]]) {
    const h = H.kerrNewman(M, a, Q);
    assert.equal(h.extremal, true); assert.equal(h.rPlus, M); assert.equal(h.rMinus, M);
    assert.equal(h.kappa, 0); assert.equal(h.temperature, 0); assert.equal(h.firstLawAvailable, false);
    close(h.irreducibleMass ** 2, (M ** 2 + a ** 2) / 4);
    assert.equal(h.passed, true); assert.match(h.limitScope, /derivatives are singular/);
    assert.throws(() => H.firstLaw(M, a, Q, 1, 0, 0), /nonextremal/);
  }
});

test('near-extremal positive discriminants remain positive and tiny inner horizons are retained', () => {
  const a = 1 - 1e-12, h = H.kerrNewman(1, a, 0);
  const epsilon = 1 - a, leadingRoot = Math.sqrt(2 * epsilon);
  assert.equal(h.extremal, false); assert.ok(h.discriminant > 0 && h.temperature > 0);
  close(h.rPlus - 1, leadingRoot, 1e-8);
  close(h.kappa, leadingRoot / (2 * (1 + leadingRoot)), 1e-8);
  assert.equal(h.passed, true);
  const inner = H.kerrNewman(1, 0, 1e-12);
  assert.ok(inner.rMinus > 0); close(inner.rMinus, 5e-25);
});

test('horizon formulas obey independent geometrized dimensional scaling', () => {
  const base = H.kerrNewman(5, 3, 1);
  for (const scale of [1e-9, .25, 1e5]) {
    const h = H.kerrNewman(5 * scale, 3 * scale, scale);
    for (const key of ['rPlus', 'rMinus', 'irreducibleMass']) close(h[key], base[key] * scale);
    for (const key of ['area', 'entropy', 'J']) close(h[key], base[key] * scale ** 2);
    for (const key of ['omegaH', 'kappa', 'temperature']) close(h[key], base[key] / scale);
    close(h.phiH, base.phiH); assert.equal(h.passed, true);
  }
});

test('Boyer-Lindquist metric matches independent completed-square expansion and general determinant elimination', () => {
  for (const values of [[2, .4, .3, 5, 1], [5, 3, 1, 12, .7], [5, -3, -1, 12, 2.4]]) {
    const [M, a, Q, r, theta] = values, g = H.metric(...values);
    matrixClose(g.matrix, metricFromSquares(...values));
    assert.deepEqual(g.coordinates, ['t', 'r', 'theta', 'phi']); assert.equal(g.signature, '-+++');
    const sigma = r ** 2 + a ** 2 * Math.cos(theta) ** 2;
    close(determinant(g.matrix), -(sigma ** 2) * Math.sin(theta) ** 2);
    close(g.determinant, determinant(g.matrix));
    close(g.frameOmega, a * (2 * M * r - Q ** 2) / ((r ** 2 + a ** 2) * sigma + a ** 2 * (2 * M * r - Q ** 2) * Math.sin(theta) ** 2));
    assert.equal(g.passed, true); finiteData(g);
  }
});

test('metric cross term has the negative orientation and twice the tensor component in ds squared', () => {
  const M = 2, a = .8, Q = .4, r = 5, theta = 1.1, g = H.metric(M, a, Q, r, theta);
  assert.ok(g.matrix[0][3] < 0); close(g.lineElementCrossCoefficient, 2 * g.matrix[0][3]);
  const velocity = [1, .2, -.3, .4];
  const contracted = velocity.reduce((sum, u, i) => sum + velocity.reduce((row, v, j) => row + g.matrix[i][j] * u * v, 0), 0);
  const sigma = r ** 2 + a ** 2 * Math.cos(theta) ** 2, delta = r ** 2 - 2 * M * r + a ** 2 + Q ** 2;
  const expected = -delta / sigma * (velocity[0] - a * Math.sin(theta) ** 2 * velocity[3]) ** 2
    + Math.sin(theta) ** 2 / sigma * ((r ** 2 + a ** 2) * velocity[3] - a * velocity[0]) ** 2
    + sigma / delta * velocity[1] ** 2 + sigma * velocity[2] ** 2;
  close(contracted, expected);
});

test('Schwarzschild and RN metric limits have diagonal lapse and reciprocal radial coefficient', () => {
  for (const Q of [0, 3]) {
    const M = 5, r = 12, theta = .8, g = H.metric(M, 0, Q, r, theta);
    const lapse = 1 - 2 * M / r + Q ** 2 / r ** 2;
    matrixClose(g.matrix, [[-lapse, 0, 0, 0], [0, 1 / lapse, 0, 0], [0, 0, r ** 2, 0], [0, 0, 0, r ** 2 * Math.sin(theta) ** 2]]);
    assert.ok(Math.abs(g.frameOmega) === 0); assert.equal(g.passed, true);
  }
});

test('exterior ergoregion remains Lorentzian even when the stationary time basis vector becomes spacelike', () => {
  const g = H.metric(1, .8, 0, 1.8, Math.PI / 2);
  assert.ok(g.parameters.r > g.rPlus); assert.ok(g.matrix[0][0] > 0);
  assert.equal(g.ergoregion, true); assert.equal(g.checks.lorentzianSignature.passed, true);
  assert.ok(determinant(g.matrix) < 0); assert.equal(g.passed, true);
});

test('differential first law agrees with independent central differences of area and angular momentum', () => {
  for (const [M, a, Q, dM, da, dQ] of [[2, .4, .3, .2, -.3, .1], [5, -3, -1, -.1, .2, -.3], [1, 0, 0, .3, .2, -.4]]) {
    const result = H.firstLaw(M, a, Q, dM, da, dQ), step = 1e-5;
    const areaDerivative = (area(M + step * dM, a + step * da, Q + step * dQ) - area(M - step * dM, a - step * da, Q - step * dQ)) / (2 * step);
    const JDerivative = ((M + step * dM) * (a + step * da) - (M - step * dM) * (a - step * da)) / (2 * step);
    close(result.dA, areaDerivative, 3e-9); close(result.dJ, JDerivative, 3e-9);
    close(result.dS, result.dA / 4); close(result.rhs, dM);
    assert.equal(result.passed, true); assert.match(result.scope, /not a finite transition/);
    assert.match(result.method, /Analytic directional derivatives/);
  }
  const zero = H.firstLaw(2, .4, .3, 0, 0, 0);
  assert.equal(zero.dA, 0); assert.equal(zero.rhs, 0); assert.equal(zero.passed, true);
});

test('first law handles independent M/a/Q directions, negative orientations and a near-extremal tangent', () => {
  for (const direction of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
    const result = H.firstLaw(5, -3, -1, ...direction);
    assert.equal(result.passed, true);
    if (direction[0] === 0) assert.ok(Math.abs(result.rhs) < 1e-12);
    else close(result.rhs, 1);
  }
  const near = H.firstLaw(1, 1 - 1e-10, 0, .2, -.3, .1);
  assert.equal(near.passed, true); close(near.rhs, .2, 1e-8); finiteData(near);
});

test('SI Schwarzschild values agree with an independently evaluated 60-digit decimal reference', () => {
  // Python Decimal, exact h/c/kB/G decimal inputs, and a 60-digit pi.
  const result = H.schwarzschildSI(1e30);
  close(result.radius, 1485.23205382373310037, 1e-13);
  close(result.area, 27720336.05556039340269, 1e-13);
  close(result.temperature, 1.22690067059401708209958e-7, 1e-13);
  close(result.entropy, 3.66270554853342653849086e53, 1e-13);
  close(result.radiationPower, 3.56162214477849373449543e-28, 1e-13);
  close(result.evaporationTime, 8.41147789970210789731894e73, 1e-13);
  close(result.entropyOverKB, result.entropy / 1.380649e-23);
  assert.equal(result.constants.G, 6.67430e-11); assert.equal(result.constants.GStandardUncertainty, 1.5e-15);
  assert.equal(result.constants.c, 299792458); assert.equal(result.constants.h, 6.62607015e-34);
  assert.equal(result.constants.kB, 1.380649e-23);
  close(result.constants.hbar, result.constants.h / (2 * Math.PI));
  assert.equal(result.units.entropy, 'J/K'); assert.equal(result.units.evaporationTime, 's');
  assert.match(result.approximation.scope, /Blackbody approximation/);
  assert.match(result.approximation.scope, /not a verified full astrophysical lifetime/);
});

test('ideal radiation approximation matches Stefan-Boltzmann and the integrated inverse-square mass-loss model', () => {
  for (const mass of [1e-12, 1, 1e12, 1e30, 1e50]) {
    const result = H.schwarzschildSI(mass), { c, kB, hbar } = H.constants;
    const sigmaSB = Math.PI ** 2 * kB ** 4 / (60 * hbar ** 3 * c ** 2);
    close(result.radiationPower, sigmaSB * result.area * result.temperature ** 4);
    close(result.evaporationTime, mass * c ** 2 / (3 * result.radiationPower));
    close(result.temperature, hbar * result.surfaceGravity / (2 * Math.PI * c * kB));
    finiteData(result);
  }
});

test('strict input bounds reject naked horizons, nonnumeric coercions and nonfinite values without repair', () => {
  for (const parameters of [[1, 1 + Number.EPSILON, 0], [1, 0, 1 + Number.EPSILON], [1, 1, 1e-12], [1, .8, .8],
    [1, .6, .8], [1, 1, Number.MIN_VALUE], [1, Number.MIN_VALUE, 1],
    [0, 0, 0], [-1, 0, 0], [1e-13, 0, 0], [1e7, 0, 0], [1, 1e7, 0], [1, 0, 1e7],
    ['1', 0, 0], [new Number(1), 0, 0], [1, '0', 0], [NaN, 0, 0], [Infinity, 0, 0], [1, 0, undefined]]) {
    assert.throws(() => H.kerrNewman(...parameters));
  }
  const params = [1, .8, .8], before = params.slice();
  assert.throws(() => H.kerrNewman(...params), /Naked/); assert.deepEqual(params, before);
  for (const mass of [0, -1, '1', NaN, Infinity, 1e-13, 1e51]) assert.throws(() => H.schwarzschildSI(mass));
  for (const direction of [[NaN, 0, 0], [0, Infinity, 0], [0, 0, '1'], [1e7, 0, 0]]) assert.throws(() => H.firstLaw(2, .4, .3, ...direction));
});

test('metric executable profile rejects horizon, interior, polar axes and numerical coordinate singularities', () => {
  const h = H.kerrNewman(2, .4, .3);
  for (const [r, theta] of [[h.rPlus, 1], [h.rMinus, 1], [0, Math.PI / 2], [h.rPlus - .1, 1], [5, 0], [5, Math.PI],
    [5, -1], [5, Math.PI + .1], [5, 1e-200], [NaN, 1], [5, Infinity], ['5', 1], [5, '1'], [1e10, 1]]) {
    assert.throws(() => H.metric(2, .4, .3, r, theta));
  }
  assert.throws(() => H.metric(1, 2, 0, 5, 1), /Naked/);
  assert.equal(H.metric(2, .4, .3, h.rPlus + .1, 1).passed, true);
});
