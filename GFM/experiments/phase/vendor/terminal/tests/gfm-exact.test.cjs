'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../src/engine.js');
const G = require('../src/gfm-exact.js');

// Independent arithmetic: GF(9) is represented as a+b*i, i^2=-1, over F_3.
// These operations do not call the production field engine.
const mod3 = x => ((x % 3) + 3) % 3;
const pair = x => [x % 3, Math.floor(x / 3)];
const encode = (a, b) => mod3(a) + 3 * mod3(b);
function oracle(q) {
  const add = q === 3 ? (a, b) => mod3(a + b) : (x, y) => {
    const [a, b] = pair(x), [c, d] = pair(y); return encode(a + c, b + d);
  };
  const neg = q === 3 ? a => mod3(-a) : x => { const [a, b] = pair(x); return encode(-a, -b); };
  const mul = q === 3 ? (a, b) => mod3(a * b) : (x, y) => {
    const [a, b] = pair(x), [c, d] = pair(y); return encode(a * c - b * d, a * d + b * c);
  };
  const sub = (a, b) => add(a, neg(b));
  const inv = a => {
    if (a === 0) throw new Error('oracle division by zero');
    for (let x = 1; x < q; x += 1) if (mul(a, x) === 1) return x;
    throw new Error('oracle inverse missing');
  };
  return { q, add, sub, neg, mul, inv };
}

function product(f, a, b) {
  return a.map(row => b[0].map((_, j) => row.reduce((sum, x, k) => f.add(sum, f.mul(x, b[k][j])), 0)));
}
function transpose(m) { return m[0].map((_, j) => m.map(row => row[j])); }
function apply(f, m, vector) {
  return m.map(row => row.reduce((sum, x, i) => f.add(sum, f.mul(x, vector[i])), 0));
}
function det3(f, m) {
  const positive = f.add(f.add(f.mul(m[0][0], f.mul(m[1][1], m[2][2])),
    f.mul(m[0][1], f.mul(m[1][2], m[2][0]))), f.mul(m[0][2], f.mul(m[1][0], m[2][1])));
  const negative = f.add(f.add(f.mul(m[0][2], f.mul(m[1][1], m[2][0])),
    f.mul(m[0][0], f.mul(m[1][2], m[2][1]))), f.mul(m[0][1], f.mul(m[1][0], m[2][2])));
  return f.sub(positive, negative);
}
function verlet(f, state, kappa, h) {
  const half = f.inv(2);
  const vhalf = f.sub(state.v, f.mul(f.mul(f.mul(h, kappa), state.q), half));
  const q = f.add(state.q, f.mul(h, vhalf));
  return { q, v: f.sub(vhalf, f.mul(f.mul(f.mul(h, kappa), q), half)) };
}
function recurrence(f, initial, kappa, h) {
  let state = { ...initial };
  for (let length = 1; length <= f.q ** 2; length += 1) {
    state = verlet(f, state, kappa, h);
    if (state.q === initial.q && state.v === initial.v) return length;
  }
  throw new Error('oracle recurrence missing');
}

test('universal module exports the same API in CommonJS and a browser global', () => {
  assert.equal(globalThis.RusslGFMExact, G);
  assert.equal(G.maxSteps, 256);
  assert.equal(Object.isFrozen(G), true);
  const context = vm.createContext({});
  for (const name of ['engine.js', 'gfm-exact.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', name), 'utf8'), context, { filename: name });
  }
  assert.equal(typeof context.RusslGFMExact.oscillator, 'function');
  assert.equal(typeof context.RusslGFMExact.rotation, 'function');
  assert.equal(context.RusslGFMExact.rotation('gf9', 'z', 1, [1, 0, 0]).output.join(','), '0,1,0');
});

test('GF(3) prime-field rotations have the expected quarter-turn orientation', () => {
  assert.deepEqual(G.rotation('gf3', 'x', 1, [0, 1, 0]).output, [0, 0, 1]);
  assert.deepEqual(G.rotation('gf3', 'y', 1, [0, 0, 1]).output, [1, 0, 0]);
  assert.deepEqual(G.rotation('gf3', 'z', 1, [1, 0, 0]).output, [0, 1, 0]);
  assert.deepEqual(G.rotation('gf3', 'z', 2, [1, 0, 0]).output, [0, 2, 0]);
  assert.deepEqual(G.rotation('gf3', 'z', 'infinity', [1, 2, 1]).output, [2, 1, 1]);
});

test('every admissible parameter in GF(3) and GF(9) is orthogonal with determinant one', () => {
  const identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (const order of [3, 9]) {
    const f = oracle(order);
    for (const axis of ['x', 'y', 'z']) {
      for (const t of [...Array(order).keys(), 'infinity']) {
        const denominator = t === 'infinity' ? null : f.add(1, f.mul(t, t));
        if (denominator === 0) {
          assert.throws(() => G.rotation('gf' + order, axis, t, [1, 2, 0]), /singular/);
          continue;
        }
        const result = G.rotation('gf' + order, axis, t, [1, 2, 0]);
        const c = t === 'infinity' ? f.neg(1) : f.mul(f.sub(1, f.mul(t, t)), f.inv(denominator));
        const s = t === 'infinity' ? 0 : f.mul(f.add(t, t), f.inv(denominator));
        assert.equal(result.denominator, denominator);
        assert.equal(result.c, c);
        assert.equal(result.s, s);
        assert.equal(f.add(f.mul(c, c), f.mul(s, s)), 1);
        assert.deepEqual(product(f, transpose(result.matrix), result.matrix), identity);
        assert.equal(det3(f, result.matrix), 1);
        assert.equal(result.determinant, 1);
        assert.deepEqual(result.checks, { unitCircle: true, orthogonal: true, determinantOne: true,
          normPreserved: true, inverseVerified: true });
      }
    }
  }
});

test('GF(9) rotations preserve the exact quadratic form and reverse for every point', () => {
  const f = oracle(9);
  const quadratic = point => point.reduce((sum, x) => f.add(sum, f.mul(x, x)), 0);
  for (const axis of ['x', 'y', 'z']) {
    for (const t of [0, 1, 2, 4, 5, 7, 8, 'infinity']) {
      for (let x = 0; x < 9; x += 1) for (let y = 0; y < 9; y += 1) for (let z = 0; z < 9; z += 1) {
        const point = [x, y, z];
        const result = G.rotation('gf9', axis, t, point);
        assert.deepEqual(result.output, apply(f, result.matrix, point));
        assert.equal(quadratic(result.output), quadratic(point));
        assert.equal(result.inputQuadraticForm, quadratic(point));
        const inverse = G.rotation('gf9', axis, t === 'infinity' ? t : f.neg(t), result.output);
        assert.deepEqual(inverse.output, point);
        assert.deepEqual(point, [x, y, z]);
      }
    }
  }
  // Isotropic vectors have zero field quadratic form despite being nonzero.
  const isotropic = G.rotation('gf9', 'z', 1, [1, 3, 0]);
  assert.equal(isotropic.inputQuadraticForm, 0);
  assert.match(isotropic.scope, /not a positive Euclidean norm/);
});

test('GF(9) alpha and negative alpha are the only singular finite parameters', () => {
  const f = oracle(9);
  assert.equal(f.mul(3, 3), 2);
  assert.equal(f.neg(3), 6);
  for (const t of [3, 6]) assert.throws(() => G.rotation('gf9', 'z', t, [1, 0, 0]), /1 \+ t² = 0/);
  const infinity = G.rotation('gf9', 'x', 'infinity', [1, 4, 7]);
  assert.equal(infinity.c, 2);
  assert.equal(infinity.s, 0);
  assert.equal(infinity.denominator, null);
  assert.deepEqual(infinity.output, [1, 8, 5]);
});

test('oscillator kick-drift-kick agrees with independent GF(9) arithmetic and its matrix', () => {
  const f = oracle(9);
  for (const kappa of [0, 1, 3, 4]) for (const h of [0, 1, 3, 5]) {
    const qBasis = verlet(f, { q: 1, v: 0 }, kappa, h);
    const vBasis = verlet(f, { q: 0, v: 1 }, kappa, h);
    const expectedMatrix = [[qBasis.q, vBasis.q], [qBasis.v, vBasis.v]];
    for (let q = 0; q < 9; q += 1) for (let v = 0; v < 9; v += 1) {
      const result = G.oscillator('gf9', q, v, kappa, h, 3);
      let expected = { q, v };
      assert.deepEqual(result.matrix, expectedMatrix);
      assert.equal(result.trajectory.length, 4);
      assert.deepEqual(result.initial, { q, v });
      for (let step = 1; step <= 3; step += 1) {
        expected = verlet(f, expected, kappa, h);
        assert.deepEqual(result.trajectory[step], { step, ...expected });
      }
      assert.deepEqual(result.final, expected);
      assert.equal(result.orbit.length, recurrence(f, { q, v }, kappa, h));
      assert.equal(result.orbit.preperiod, 0);
      assert.equal(result.orbit.statesVisited, result.orbit.length);
      assert.equal(result.orbit.bound, 81);
      assert.equal(result.orbit.complete, true);
      assert.deepEqual(result.checks, { determinantOne: true, symplectic: true, matrixAgrees: true, inverseVerified: true });
    }
  }
});

test('all GF(9) oscillator coefficient pairs have symplectic matrices and explicit inverse steps', () => {
  const f = oracle(9);
  const omega = [[0, 1], [2, 0]], identity = [[1, 0], [0, 1]];
  for (let kappa = 0; kappa < 9; kappa += 1) for (let h = 0; h < 9; h += 1) {
    const result = G.oscillator('gf9', 4, 8, kappa, h, 7);
    const inverse = G.oscillator('gf9', result.final.q, result.final.v, kappa, f.neg(h), 7);
    assert.equal(f.sub(f.mul(result.matrix[0][0], result.matrix[1][1]), f.mul(result.matrix[0][1], result.matrix[1][0])), 1);
    assert.deepEqual(product(f, product(f, transpose(result.matrix), omega), result.matrix), omega);
    assert.deepEqual(product(f, inverse.matrix, result.matrix), identity);
    assert.deepEqual(inverse.final, result.initial);
    assert.equal(result.determinant, 1);
  }
});

test('prime-field oscillator gives fixed, free-shear, and six-step recurrence examples', () => {
  const fixed = G.oscillator('gf3', 1, 2, 1, 0);
  assert.deepEqual(fixed.matrix, [[1, 0], [0, 1]]);
  assert.equal(fixed.orbit.kind, 'fixed-point');
  assert.equal(fixed.orbit.length, 1);
  const free = G.oscillator('gf3', 1, 1, 0, 1, 3);
  assert.deepEqual(free.matrix, [[1, 1], [0, 1]]);
  assert.deepEqual(free.final, free.initial);
  assert.equal(free.orbit.kind, 'cycle');
  assert.equal(free.orbit.length, 3);
  const jordan = G.oscillator('gf3', 0, 1, 1, 1, 6);
  assert.deepEqual(jordan.matrix, [[2, 1], [0, 2]]);
  assert.deepEqual(jordan.final, jordan.initial);
  assert.equal(jordan.orbit.length, 6);
  assert.equal(jordan.orbit.bound, 9);
  assert.equal(G.oscillator('gf3', 1, 0, 1, 1).orbit.length, 2);
});

test('256-step bound is enforced and the full bounded trajectory reverses', () => {
  const f = oracle(9);
  const result = G.oscillator(E.field('gf9'), 8, 5, 7, 4, 256);
  assert.equal(result.trajectory.length, 257);
  assert.equal(result.trajectory[256].step, 256);
  assert.deepEqual(G.oscillator(E.fields.gf9, result.final.q, result.final.v, 7, f.neg(4), 256).final, result.initial);
  for (const steps of [0, -1, 1.5, 257, NaN, Infinity, '2']) {
    assert.throws(() => G.oscillator('gf9', 1, 2, 1, 1, steps), /Steps must be an integer from 1 to 256/);
  }
});

test('binary fields, unregistered fields, invalid labels and pictured real angles are rejected', () => {
  for (const id of ['gf4', 'gf8', 'gf16']) {
    assert.throws(() => G.oscillator(id, 1, 1, 1, 1), /odd characteristic/);
    assert.throws(() => G.rotation(id, 'z', 1, [1, 0, 0]), /odd characteristic/);
  }
  for (const f of [null, {}, { ...E.field('gf9') }, 9]) {
    assert.throws(() => G.rotation(f, 'z', 1, [1, 0, 0]), /registered finite-field/);
  }
  for (const value of [-1, 9, 1.25, NaN, Infinity, '1']) {
    for (let argument = 0; argument < 4; argument += 1) {
      const values = [1, 2, 1, 1]; values[argument] = value;
      assert.throws(() => G.oscillator('gf9', ...values), /Field element/);
    }
    assert.throws(() => G.rotation('gf9', 'z', value, [1, 0, 0]), /Field element/);
    assert.throws(() => G.rotation('gf9', 'z', 1, [1, value, 0]), /Field element/);
  }
  assert.throws(() => G.rotation('gf9', 'z', 232.75, [1, 0, 0]), /Field element/);
  for (const axis of ['X', 'theta', null]) assert.throws(() => G.rotation('gf9', axis, 1, [1, 0, 0]), /Axis must/);
});

test('rotation copies valid points and rejects sparse or accessor-backed point coordinates', () => {
  const point = [1, 2, 3], copy = point.slice();
  const result = G.rotation(E.field('gf9'), 'x', 4, point);
  assert.deepEqual(point, copy);
  assert.notEqual(result.point, point);
  for (const input of [null, [1, 2], [1, 2, 3, 4], new Array(3)]) {
    assert.throws(() => G.rotation('gf9', 'x', 1, input), /Point must/);
  }
  let reads = 0;
  const accessor = [1, 2, 3];
  Object.defineProperty(accessor, '1', { get() { reads += 1; return 2; } });
  assert.throws(() => G.rotation('gf9', 'x', 1, accessor), /without accessors/);
  assert.equal(reads, 0);
});

test('results identify exact field analogues and do not assign seconds or convert image angles', () => {
  const oscillator = G.oscillator('gf9', 1, 2, 3, 4);
  const rotation = G.rotation('gf9', 'z', 4, [1, 2, 3]);
  assert.match(oscillator.domain, /exact finite-field/);
  assert.match(oscillator.scope, /not elapsed seconds/);
  assert.match(oscillator.scope, /not the nonlinear sine pendulum/);
  assert.match(oscillator.orbit.meaning, /no real-time period/);
  assert.match(rotation.scope, /not a real angle/);
  assert.match(rotation.scope, /no angle from the supplied image is reduced/);
  assert.match(rotation.encoding, /polynomial coefficients/);
});
