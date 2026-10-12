'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const scalar = require('../src/refined-scalar.js');
const close = (actual, expected, epsilon = 1e-11) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} differs from ${expected}`);
const coefficient = (...parameters) => scalar.clebschGordan(...parameters).coefficient;
const vectorClose = (actual, expected, epsilon = 1e-11) => actual.forEach((value, i) => { close(value.re, expected[i].re, epsilon); close(value.im, expected[i].im, epsilon); });
const mod = (value, modulus) => ((value % modulus) + modulus) % modulus;

test('exports one immutable API to CommonJS and browser global', () => {
  assert.equal(globalThis.RusslRefinedScalar, scalar);
  assert.ok(Object.isFrozen(scalar));
  assert.ok(Object.isFrozen(scalar.limits));
});

test('CG coefficients reproduce independent spin-half singlet and triplet states', () => {
  close(coefficient(.5, .5, .5, .5, 1, 1), 1);
  close(coefficient(.5, -.5, .5, -.5, 1, -1), 1);
  close(coefficient(.5, .5, .5, -.5, 1, 0), 1 / Math.sqrt(2));
  close(coefficient(.5, -.5, .5, .5, 1, 0), 1 / Math.sqrt(2));
  close(coefficient(.5, .5, .5, -.5, 0, 0), 1 / Math.sqrt(2));
  close(coefficient(.5, -.5, .5, .5, 0, 0), -1 / Math.sqrt(2));
  const record = scalar.clebschGordan(.5, -.5, .5, .5, 0, 0);
  assert.deepEqual(record.squared, { numerator: '1', denominator: '2' });
  assert.deepEqual([record.kMin, record.kMax], [1, 1]);
  assert.match(record.domain, /SU\(2\)/);
  assert.equal(record.phaseConvention, 'Condon-Shortley');
});

test('CG matches the three published SymPy documentation examples', () => {
  // Primary source: docs.sympy.org/latest/modules/physics/wigner.html#sympy.physics.wigner.clebsch_gordan
  close(coefficient(1.5, 1.5, .5, .5, 2, 2), 1);
  close(coefficient(1.5, 1.5, .5, -.5, 1, 1), Math.sqrt(3) / 2);
  close(coefficient(1.5, -.5, .5, .5, 1, 0), -Math.sqrt(2) / 2);
});

test('CG selection rules return zero while invalid numeric domains reject', () => {
  for (const parameters of [[.5, .5, .5, .5, 0, 0], [1, 0, 1, 0, 3, 0], [1, .5, 1, -.5, 1, 0], [.5, .5, .5, -.5, .5, 0], [1, 2, 1, -2, 1, 0]]) {
    const value = scalar.clebschGordan(...parameters);
    assert.equal(value.coefficient, 0); assert.equal(value.allowed, false); assert.equal(value.kMin, null);
  }
  for (const parameters of [[7, 0, 0, 0, 0, 0], [1.1, 0, 1, 0, 1, 0], [1, .25, 1, -.25, 1, 0], [NaN, 0, 1, 0, 1, 0], ['1', 0, 1, 0, 1, 0]]) assert.throws(() => scalar.clebschGordan(...parameters));
  const cancellation = scalar.clebschGordan(1, 0, 1, 0, 1, 0);
  assert.equal(cancellation.allowed, true); assert.equal(cancellation.coefficient, 0);
});

test('CG highest weights and singlet phases hold throughout the bounded spin range', () => {
  for (let j = 0; j <= 6; j += .5) for (let m = -j; m <= j; m++) close(coefficient(j, m, j, -m, 0, 0), (-1) ** (j - m) / Math.sqrt(2 * j + 1));
  for (let j1 = 0; j1 <= 6; j1 += .5) for (let j2 = 0; j2 + j1 <= 6; j2 += .5) close(coefficient(j1, j1, j2, j2, j1 + j2, j1 + j2), 1);
});

test('CG coupled bases are orthonormal and complete for integer and half-integer spins', () => {
  for (const [j1, j2] of [[.5, .5], [1, .5], [1, 1], [1.5, 1.5], [2, 1], [3, 3]]) {
    const products = [], coupled = [];
    for (let m1 = -j1; m1 <= j1; m1++) for (let m2 = -j2; m2 <= j2; m2++) products.push([m1, m2]);
    for (let J = Math.abs(j1 - j2); J <= j1 + j2; J++) for (let M = -J; M <= J; M++) coupled.push([J, M]);
    const matrix = coupled.map(([J, M]) => products.map(([m1, m2]) => coefficient(j1, m1, j2, m2, J, M)));
    assert.equal(matrix.length, products.length);
    for (let i = 0; i < matrix.length; i++) for (let j = 0; j < matrix.length; j++) {
      close(matrix[i].reduce((sum, value, k) => sum + value * matrix[j][k], 0), i === j ? 1 : 0);
      close(matrix.reduce((sum, row) => sum + row[i] * row[j], 0), i === j ? 1 : 0);
    }
  }
});

test('CG agrees with an independent exact-rational Python DLMF 3j reference', context => {
  const cases = [];
  for (const [j1, j2] of [[.5, .5], [1.5, .5], [2, 3], [4.5, 2.5], [6, 6]]) {
    for (let J = Math.abs(j1 - j2); J <= Math.min(6, j1 + j2); J++) {
      for (let m1 = -j1; m1 <= j1; m1++) {
        for (let m2 = -j2; m2 <= j2; m2++) {
          const M = m1 + m2;
          if (Math.abs(M) <= J) cases.push([j1, m1, j2, m2, J, M]);
        }
      }
    }
  }
  const program = [
    'import sys,json,math',
    'from fractions import Fraction as F',
    'def fac(x): return math.factorial(int(x))',
    'def cg(args):',
    ' j1,m1,j2,m2,J,M=args; m3=-M',
    ' tri=F(fac(j1+j2-J)*fac(j1-j2+J)*fac(-j1+j2+J),fac(j1+j2+J+1))',
    ' mags=fac(j1+m1)*fac(j1-m1)*fac(j2+m2)*fac(j2-m2)*fac(J+m3)*fac(J-m3)',
    ' total=F(0)',
    ' for s in range(20):',
    '  a=[s,j1+j2-J-s,j1-m1-s,j2+m2-s,J-j2+m1+s,J-j1-m2+s]',
    '  if min(a)>=0: total+=F((-1)**s,math.prod(fac(x) for x in a))',
    ' square=(2*J+1)*tri*mags*total*total',
    ' phase3j=(-1)**int(j1-j2-m3); phasecg=(-1)**int(j1-j2+M)',
    ' value=phasecg*phase3j*(1 if total>0 else -1 if total<0 else 0)*math.sqrt(float(square))',
    ' return value',
    'print(json.dumps([cg(x) for x in json.load(sys.stdin)]))',
  ].join('\n');
  const result = spawnSync(process.env.RUSSL_PYTHON || 'python', ['-c', program], { input: JSON.stringify(cases), encoding: 'utf8', timeout: 20000 });
  if (result.error && result.error.code === 'ENOENT') { context.skip('Python is unavailable; published-value and orthogonality checks still execute.'); return; }
  assert.equal(result.status, 0, result.stderr);
  const expected = JSON.parse(result.stdout);
  cases.forEach((parameters, i) => close(coefficient(...parameters), expected[i]));
  assert.ok(cases.length > 500);
});

test('arithmetic delta uses exact signed integers and the canonical p-squared residue', () => {
  for (const p of [2, 3, 5, 7, 11, 31, 97]) for (const x of [-9409, -17, -1, 0, 1, 2, 17, 9410]) {
    const result = scalar.arithmeticDelta(p, x), bigP = BigInt(p), residue = mod(BigInt(x), bigP * bigP);
    const expected = mod((residue - residue ** bigP) / bigP, bigP);
    assert.equal(result.residueModP2, Number(residue)); assert.equal(result.delta, Number(expected));
    if (residue % bigP !== 0n) {
      assert.equal(result.fermatQuotient, Number(mod((residue ** (bigP - 1n) - 1n) / bigP, bigP)));
      assert.equal(result.delta, Number(mod(-residue * BigInt(result.fermatQuotient), bigP)));
    } else assert.equal(result.fermatQuotient, null);
  }
  const exact = '123456789012345678901234567890123456789012345678901234567890';
  assert.equal(scalar.arithmeticDelta(97, exact).residueModP2, Number(BigInt(exact) % (97n * 97n)));
  assert.deepEqual(scalar.arithmeticDelta(5, '-00017'), scalar.arithmeticDelta(5, -17n));
  assert.equal(scalar.arithmeticDelta(2, -1).residueModP2, 3);
});

test('arithmetic delta is invariant under changing the p-squared representative', () => {
  for (const p of [2, 3, 5, 7, 11, 97]) for (let x = 0; x < p * p; x += Math.max(1, Math.floor(p * p / 64))) {
    const record = scalar.arithmeticDelta(p, x);
    for (const lift of [-100, -1, 1, 100]) assert.equal(scalar.arithmeticDelta(p, x + lift * p * p).delta, record.delta);
  }
});

test('Eq 319 arithmetic Leibniz identity holds over complete small residue rings', () => {
  for (const p of [2, 3, 5, 7, 11]) {
    const deltas = Array.from({ length: p * p }, (_, x) => scalar.arithmeticDelta(p, x).delta);
    for (let x = 0; x < p * p; x++) for (let y = 0; y < p * p; y++) assert.equal(deltas[(x * y) % (p * p)], (x * deltas[y] + y * deltas[x]) % p);
  }
});

test('arithmetic delta is not additive and does not invent a Fermat quotient for nonunits', () => {
  assert.equal(scalar.arithmeticDelta(2, 1).delta, 0);
  assert.equal(scalar.arithmeticDelta(2, 2).delta, 1);
  assert.notEqual(scalar.arithmeticDelta(2, 1 + 1).delta, (scalar.arithmeticDelta(2, 1).delta + scalar.arithmeticDelta(2, 1).delta) % 2);
  assert.equal(scalar.arithmeticDelta(5, 10).fermatQuotient, null);
  for (const p of [1, 4, 9, 101, 3.5, '5']) assert.throws(() => scalar.arithmeticDelta(p, 1));
  for (const x of [1.5, Number.MAX_SAFE_INTEGER + 1, NaN, '1e20', '0x10', '1/2', '1'.repeat(4097)]) assert.throws(() => scalar.arithmeticDelta(5, x));
});

test('Cayley diagonal evolution matches its exact rational complex phase', () => {
  const initial = [Math.sqrt(.3), { re: 0, im: Math.sqrt(.7) }], eigenvalues = [-2, 1], dt = .4, hbar = 2;
  const result = scalar.cayleyStep([[-2, 0], [0, 1]], initial, dt, hbar), alpha = dt / (2 * hbar);
  const expected = initial.map((value, i) => {
    const z = typeof value === 'number' ? { re: value, im: 0 } : value, a = alpha * eigenvalues[i];
    const re = (1 - a * a) / (1 + a * a), im = -2 * a / (1 + a * a);
    return { re: re * z.re - im * z.im, im: re * z.im + im * z.re };
  });
  vectorClose(result.state, expected);
  close(result.normBefore, 1); close(result.normAfter, 1);
  assert.equal(result.toleranceMet, true); assert.equal(result.renormalized, false);
});

test('Cayley sigma-x and complex sigma-y implement the conventional forward-time sign', () => {
  const dt = .3, alpha = dt / 2, diagonal = (1 - alpha * alpha) / (1 + alpha * alpha), mixing = 2 * alpha / (1 + alpha * alpha);
  vectorClose(scalar.cayleyStep([[0, 1], [1, 0]], [1, 0], dt).state, [{ re: diagonal, im: 0 }, { re: 0, im: -mixing }]);
  vectorClose(scalar.cayleyStep([[0, [0, -1]], [[0, 1], 0]], [1, 0], dt).state, [{ re: diagonal, im: 0 }, { re: mixing, im: 0 }]);
  const epsilon = 1e-5, step = scalar.cayleyStep([[1]], [1], epsilon, 2);
  close(step.state[0].im / epsilon, -.5, 1e-9);
  assert.match(step.domain, /complex-amplitude/);
});

test('Cayley inverse time restores an eight-component state without renormalization', () => {
  const dimension = 8, H = Array.from({ length: dimension }, () => Array(dimension));
  for (let i = 0; i < dimension; i++) for (let j = i; j < dimension; j++) {
    const value = { re: Math.cos(i + j + .3), im: i === j ? 0 : Math.sin(i * j + .2) };
    H[i][j] = value; H[j][i] = { re: value.re, im: -value.im };
  }
  const initial = Array.from({ length: dimension }, (_, i) => ({ re: Math.sin(i + .7), im: Math.cos(i + .2) }));
  const before = JSON.stringify({ H, initial });
  const forward = scalar.cayleyStep(H, initial, 1.7, .8), reverse = scalar.cayleyStep(H, forward.state, -1.7, .8);
  vectorClose(reverse.state, initial);
  close(forward.normBefore, forward.normAfter); close(reverse.normBefore, reverse.normAfter);
  assert.equal(forward.toleranceMet, true); assert.ok(forward.relativeResidual < 1e-12);
  assert.equal(JSON.stringify({ H, initial }), before, 'caller-owned inputs are preserved');
  const nonnormalized = scalar.cayleyStep([[1]], [2], .1);
  close(nonnormalized.normBefore, 2); close(nonnormalized.normAfter, 2);
});

test('Cayley rejects non-Hermitian, malformed, excessive and nonfinite inputs', () => {
  for (const args of [
    [[[0, 1], [2, 0]], [1, 0], .1],
    [[[{ re: 0, im: 1 }]], [1], .1],
    [[[1, 0]], [1], .1],
    [[[1]], [1, 0], .1],
    [[[Infinity]], [1], .1],
    [[[1]], [NaN], .1],
    [[[1]], [1], 101],
    [[[1]], [1], .1, 0],
    [[[1]], [1], .1, 1e-20],
    [[[1e6 + 1]], [1], .1],
    [[[1]], [1e6 + 1], .1],
    [Array.from({ length: 9 }, () => Array(9).fill(0)), Array(9).fill(1), .1],
  ]) assert.throws(() => scalar.cayleyStep(...args));
  const zero = scalar.cayleyStep([[1]], [0], 0);
  assert.deepEqual(zero.state, [{ re: 0, im: 0 }]);
  assert.equal(zero.normBefore, 0); assert.equal(zero.toleranceMet, true);
});

test('Cayley bounds the scaled matrix and rejects executable or sparse data', () => {
  vectorClose(scalar.cayleyStep([[0]], [1], 100, 1e-308).state, [{ re: 1, im: 0 }]);
  vectorClose(scalar.cayleyStep([[1e-308]], [1], 100, 1e-308).state, [{ re: -2499 / 2501, im: -100 / 2501 }]);
  let calls = 0;
  const tuple = [0, 0];
  Object.defineProperty(tuple, '0', { enumerable: true, get() { calls++; return 0; } });
  assert.throws(() => scalar.cayleyStep([[tuple]], [1], .1));
  const row = [1];
  Object.defineProperty(row, '0', { enumerable: true, get() { calls++; return 1; } });
  assert.throws(() => scalar.cayleyStep([row], [1], .1));
  assert.equal(calls, 0, 'data getters are never evaluated');
  const sparse = []; sparse.length = 1;
  assert.throws(() => scalar.cayleyStep([sparse], [1], .1));
});
