'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../src/engine.js');
const R = require('../src/refined-field.js');
const f = E.field('gf9');
const EPS = 1e-10;

const mod3 = value => ((value % 3) + 3) % 3;
const add9 = (a, b) => mod3(a % 3 + b % 3) + 3 * mod3(Math.floor(a / 3) + Math.floor(b / 3));
const neg9 = a => mod3(-(a % 3)) + 3 * mod3(-Math.floor(a / 3));
// Independent arithmetic: α² = 2, labels a0 + 3*a1 encode a0+a1*α.
const mul9 = (a, b) => mod3((a % 3) * (b % 3) + 2 * Math.floor(a / 3) * Math.floor(b / 3))
  + 3 * mod3((a % 3) * Math.floor(b / 3) + Math.floor(a / 3) * (b % 3));
const chi9 = a => ({ re: Math.cos(2 * Math.PI * mod3(2 * (a % 3)) / 3), im: Math.sin(2 * Math.PI * mod3(2 * (a % 3)) / 3) });
const cmul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const conj = a => ({ re: a.re, im: -a.im });
function close(actual, expected, tolerance = EPS) { assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`); }
function cclose(actual, expected) { close(actual.re, expected.re); close(actual.im, expected.im); }
const complexState = () => E.normalize(Array.from({ length: 9 }, (_, i) => ({ re: Math.sin(1.1 * i + 0.2), im: Math.cos(0.7 * i - 0.3) })));

function reflectionMatrix(q0, p0) {
  return Array.from({ length: 9 }, (_, x) => Array.from({ length: 9 }, (_, y) =>
    y === add9(add9(q0, q0), neg9(x)) ? chi9(mul9(p0, add9(x, neg9(y)))) : { re: 0, im: 0 }));
}
function matrixApply(matrix, state) {
  return matrix.map(row => row.reduce((sum, value, i) => {
    const term = cmul(value, state[i]);
    return { re: sum.re + term.re, im: sum.im + term.im };
  }, { re: 0, im: 0 }));
}
function matrixTraceProduct(a, b) {
  let re = 0, im = 0;
  for (let x = 0; x < 9; x += 1) for (let y = 0; y < 9; y += 1) {
    const value = cmul(a[x][y], b[y][x]); re += value.re; im += value.im;
  }
  return { re, im };
}

test('refined module loads in CommonJS and a dependency-free browser context', () => {
  assert.equal(globalThis.RusslRefinedField, R);
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/engine.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/refined-field.js'), 'utf8'), context);
  assert.equal(context.RusslRefinedField.quadraticCharacter('gf9', 4), -1);
  assert.equal(R.conventions.equationNumberScope, 'candidate aliases only');
  assert.equal(R.conventions.manaLogBase, 2);
});

test('quadratic character matches the explicitly enumerated GF9 squares', () => {
  const squares = new Set(Array.from({ length: 8 }, (_, i) => mul9(i + 1, i + 1)));
  assert.deepEqual([...squares].sort(), [1, 2, 3, 6]);
  assert.deepEqual(Array.from({ length: 9 }, (_, x) => R.quadraticCharacter(f, x)), [0, 1, 1, 1, -1, -1, 1, -1, -1]);
  for (let a = 1; a < 9; a += 1) for (let b = 1; b < 9; b += 1) {
    assert.equal(R.quadraticCharacter(f, mul9(a, b)), R.quadraticCharacter(f, a) * R.quadraticCharacter(f, b));
  }
});

test('every GF9 displacement column matches an independent explicit ZX matrix', () => {
  for (let xi = 0; xi < 9; xi += 1) for (let zeta = 0; zeta < 9; zeta += 1) {
    for (let source = 0; source < 9; source += 1) {
      const result = R.displacement(f, E.basisState(9, source), xi, zeta);
      const target = add9(source, xi);
      const exponent = add9(neg9(mul9(2, mul9(xi, zeta))), mul9(zeta, target));
      for (let x = 0; x < 9; x += 1) cclose(result[x], x === target ? chi9(exponent) : { re: 0, im: 0 });
    }
  }
});

test('GF9 displacement inverse and composition retain the required half-phase sign', () => {
  const state = complexState();
  for (let xi = 0; xi < 9; xi += 1) for (let zeta = 0; zeta < 9; zeta += 1) {
    const moved = R.displacement(f, state, xi, zeta);
    close(E.norm(moved), 1);
    assert.ok(E.compare(state, R.displacement(f, moved, neg9(xi), neg9(zeta))) < EPS);
    for (const [xi2, zeta2] of [[0, 0], [1, 1], [3, 4], [8, 7]]) {
      const left = R.displacement(f, R.displacement(f, state, xi2, zeta2), xi, zeta);
      const symplecticPhase = mul9(2, add9(mul9(zeta, xi2), neg9(mul9(xi, zeta2))));
      const right = R.displacement(f, state, add9(xi, xi2), add9(zeta, zeta2)).map(value => cmul(chi9(symplecticPhase), value));
      assert.ok(E.compare(left, right) < EPS);
    }
  }
});

test('displacement traces distinguish the identity from all other phase-space points', () => {
  for (let xi = 0; xi < 9; xi += 1) for (let zeta = 0; zeta < 9; zeta += 1) {
    let re = 0, im = 0;
    for (let x = 0; x < 9; x += 1) {
      const diagonal = R.displacement(f, E.basisState(9, x), xi, zeta)[x]; re += diagonal.re; im += diagonal.im;
    }
    close(re, xi === 0 && zeta === 0 ? 9 : 0); close(im, 0);
  }
});

test('all GF9 reflections match explicit Hermitian, unit-trace involutions', () => {
  const state = complexState();
  for (let q0 = 0; q0 < 9; q0 += 1) for (let p0 = 0; p0 < 9; p0 += 1) {
    const matrix = reflectionMatrix(q0, p0);
    let trace = { re: 0, im: 0 };
    for (let x = 0; x < 9; x += 1) {
      trace.re += matrix[x][x].re; trace.im += matrix[x][x].im;
      for (let y = 0; y < 9; y += 1) cclose(matrix[x][y], conj(matrix[y][x]));
    }
    cclose(trace, { re: 1, im: 0 });
    const reflected = R.reflection(f, state, q0, p0);
    assert.ok(E.compare(reflected, matrixApply(matrix, state)) < EPS);
    assert.ok(E.compare(state, R.reflection(f, reflected, q0, p0)) < EPS);
    close(E.norm(reflected), 1);
  }
});

test('the reflection matrices form a trace-orthogonal operator basis', () => {
  const matrices = [];
  for (let q0 = 0; q0 < 9; q0 += 1) for (let p0 = 0; p0 < 9; p0 += 1) matrices.push(reflectionMatrix(q0, p0));
  for (let i = 0; i < matrices.length; i += 1) for (let j = 0; j < matrices.length; j += 1) {
    cclose(matrixTraceProduct(matrices[i], matrices[j]), { re: i === j ? 9 : 0, im: 0 });
  }
});

test('basis-state Wigner grids are positive lines with zero base-2 mana', () => {
  for (const source of [0, 1, 3, 8]) {
    const result = R.pureWigner(f, E.basisState(9, source));
    assert.deepEqual(result.axes, { q0: [0, 1, 2, 3, 4, 5, 6, 7, 8], p0: [0, 1, 2, 3, 4, 5, 6, 7, 8] });
    for (let q0 = 0; q0 < 9; q0 += 1) for (let p0 = 0; p0 < 9; p0 += 1) close(result.grid[q0][p0], q0 === source ? 1 / 9 : 0);
    close(result.normalization, 1); close(result.purity, 1); close(result.l1Norm, 1);
    close(result.mana, 0); assert.equal(result.manaLogBase, 2); assert.equal(result.negativeCellCount, 0);
    assert.equal(result.passed, true);
  }
});

test('momentum eigenstates verify the momentum axis uses the inverse Fourier marginal', () => {
  const state = E.fourier(f, E.basisState(9, 4));
  const result = R.pureWigner(f, state);
  for (let q0 = 0; q0 < 9; q0 += 1) for (let p0 = 0; p0 < 9; p0 += 1) close(result.grid[q0][p0], p0 === 4 ? 1 / 9 : 0);
  close(result.marginals.momentum[4], 1);
  close(result.marginals.momentum[neg9(4)], 0);
  assert.match(result.momentumConvention, /negative-sign/);
});

test('a two-basis superposition has an independently known negative Wigner row', () => {
  const state = E.basisState(9, 0); state[0].re = 1 / Math.sqrt(2); state[1].re = 1 / Math.sqrt(2);
  const result = R.pureWigner(f, state);
  for (let q0 = 0; q0 < 9; q0 += 1) for (let p0 = 0; p0 < 9; p0 += 1) {
    const expected = q0 === 0 || q0 === 1 ? 1 / 18 : q0 === 2 ? chi9(p0).re / 9 : 0;
    close(result.grid[q0][p0], expected);
  }
  close(result.minValue, -1 / 18);
  close(result.l1Norm, 5 / 3);
  close(result.mana, Math.log2(5 / 3));
  close(result.negativity, 1 / 3);
  assert.equal(result.negativeCellCount, 6);
  assert.equal(result.passed, true);
});

test('Wigner expectations, both marginals, and purity agree for a generic complex state', () => {
  const state = complexState();
  const result = R.pureWigner(f, state);
  close(result.normalization, 1); close(result.purity, 1);
  for (let q0 = 0; q0 < 9; q0 += 1) for (let p0 = 0; p0 < 9; p0 += 1) {
    const reflected = matrixApply(reflectionMatrix(q0, p0), state);
    const expectation = reflected.reduce((sum, value, x) => {
      const term = cmul(conj(state[x]), value);
      return { re: sum.re + term.re, im: sum.im + term.im };
    }, { re: 0, im: 0 });
    close(result.grid[q0][p0], expectation.re / 9); close(expectation.im, 0);
  }
  const momentum = E.probabilities(E.fourier(f, state, true));
  for (let x = 0; x < 9; x += 1) {
    close(result.marginals.position[x], state[x].re ** 2 + state[x].im ** 2);
    close(result.marginals.momentum[x], momentum[x]);
  }
  assert.equal(result.passed, true);
});

test('displacements translate the Wigner grid by their field labels', () => {
  const state = complexState();
  const original = R.pureWigner(f, state);
  const translated = R.pureWigner(f, R.displacement(f, state, 4, 7));
  for (let q0 = 0; q0 < 9; q0 += 1) for (let p0 = 0; p0 < 9; p0 += 1) {
    close(translated.grid[add9(q0, 4)][add9(p0, 7)], original.grid[q0][p0]);
  }
});

test('symplectic label maps preserve omega exactly when the field determinant is one', () => {
  const matrices = [[1, 0, 0, 1], [0, 1, 2, 0], [1, 3, 0, 1], [4, 0, 0, f.inv(4)], [2, 0, 0, 1], [0, 0, 0, 0]];
  for (const matrix of matrices) {
    const det = add9(mul9(matrix[0], matrix[3]), neg9(mul9(matrix[1], matrix[2])));
    const first = R.symplectic(f, ...matrix, 4, 7);
    const second = R.symplectic(f, ...matrix, 5, 8);
    const omega = add9(mul9(4, 8), neg9(mul9(7, 5)));
    const mappedOmega = add9(mul9(first.output.x, second.output.y), neg9(mul9(first.output.y, second.output.x)));
    assert.equal(first.det, det);
    assert.equal(first.preservesOmega, det === 1);
    assert.equal(mappedOmega, mul9(det, omega));
    assert.match(first.scope, /no amplitude operator/);
    assert.equal(first.state, undefined);
  }
  assert.equal(R.symplectic('gf8', 1, 2, 0, 1, 3, 4).preservesOmega, true);
});

test('invalid labels, characteristic two, and unnormalized Wigner inputs do not mutate states', () => {
  const state = complexState(); const original = JSON.stringify(state);
  for (const id of ['gf4', 'gf8', 'gf16']) {
    const binary = E.basisState(E.fields[id].q, 1);
    assert.throws(() => R.quadraticCharacter(id, 1), /odd characteristic/);
    assert.throws(() => R.displacement(id, binary, 1, 1), /odd characteristic/);
    assert.throws(() => R.reflection(id, binary, 1, 1), /odd characteristic/);
    assert.throws(() => R.pureWigner(id, binary), /odd characteristic/);
    assert.deepEqual(binary, E.basisState(E.fields[id].q, 1));
  }
  for (const value of [-1, 9, 1.5, '1', null, NaN, Infinity, undefined]) {
    assert.throws(() => R.quadraticCharacter(f, value));
    assert.throws(() => R.displacement(f, state, value, 1));
    assert.throws(() => R.displacement(f, state, 1, value));
    assert.throws(() => R.reflection(f, state, value, 1));
    assert.throws(() => R.reflection(f, state, 1, value));
    assert.throws(() => R.symplectic(f, 1, 0, 0, 1, value, 1));
  }
  assert.throws(() => R.pureWigner(f, state.map(value => ({ re: value.re * 2, im: value.im * 2 }))), /normalized/);
  assert.throws(() => R.pureWigner(f, E.basisState(4, 1)), /dimension/);
  assert.throws(() => R.reflection(f, [{ re: NaN, im: 0 }], 1, 1));
  assert.throws(() => R.displacement({ id: 'gf9' }, state, 1, 1));
  assert.throws(() => R.symplectic(undefined, 1, 0, 0, 1, 1, 1));
  R.displacement(f, state, 3, 4); R.reflection(f, state, 3, 4); R.pureWigner(f, state);
  assert.equal(JSON.stringify(state), original);
});
