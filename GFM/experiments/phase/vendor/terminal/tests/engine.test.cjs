"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../src/engine.js");
const EPSILON = 1e-11;

function close(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < EPSILON, message || `${actual} differs from ${expected}`);
}

function complexClose(actual, expected) {
  close(actual.re, expected.re);
  close(actual.im, expected.im);
}

function complexState(q) {
  return engine.normalize(Array.from({ length: q }, (_, i) => ({
    re: Math.sin(i + 0.37) * (i + 1),
    im: Math.cos(2 * i + 0.13) * (q - i)
  })));
}

test("exports the same API to CommonJS and the browser global", () => {
  assert.equal(globalThis.RusslEngine, engine);
  assert.deepEqual(Object.keys(engine.fields), ["gf3", "gf4", "gf8", "gf9", "gf16"]);
  assert.ok(Object.isFrozen(engine.fields.gf8.polynomial));
});

test("GF(8) explicitly follows α³ = α + 1 and the absolute trace", () => {
  const f = engine.field("gf8");
  assert.deepEqual(Array.from({ length: 8 }, (_, exponent) => f.pow(2, exponent)), [1, 2, 4, 3, 6, 7, 5, 1]);
  assert.equal(f.mul(2, 4), 3);
  assert.equal(f.mul(4, 4), 6);
  assert.equal(f.mul(7, 5), 6);
  assert.deepEqual(Array.from({ length: 8 }, (_, a) => f.trace(a)), [0, 1, 0, 1, 0, 1, 0, 1]);
});

test("GF(8) trace table, zero, and polynomial labels are exact", () => {
  const f = engine.field("gf8");
  assert.deepEqual(Array.from({ length: 8 }, (_, a) => f.trace(a)), [0, 1, 0, 1, 0, 1, 0, 1]);
  assert.equal(f.labelElement(0), "0");
  assert.equal(f.labelElement(7), "1 + α + α²");
});

for (const id of Object.keys(engine.fields)) {
  test(`${id} is a field with additive inverses, distributivity, and Frobenius automorphism`, () => {
    const f = engine.field(id);
    for (let a = 0; a < f.q; a += 1) {
      assert.equal(f.add(a, f.neg(a)), 0);
      assert.equal(f.sub(a, a), 0);
      assert.equal(f.mul(a, 1), a);
      assert.equal(f.pow(a, f.q), a);
      if (a !== 0) assert.equal(f.mul(a, f.inv(a)), 1);
      let cycled = a;
      for (let i = 0; i < f.n; i += 1) cycled = f.frobenius(cycled);
      assert.equal(cycled, a);
      for (let b = 0; b < f.q; b += 1) {
        assert.equal(f.add(a, b), f.add(b, a));
        assert.equal(f.mul(a, b), f.mul(b, a));
        assert.equal(f.frobenius(f.add(a, b)), f.add(f.frobenius(a), f.frobenius(b)));
        assert.equal(f.frobenius(f.mul(a, b)), f.mul(f.frobenius(a), f.frobenius(b)));
        assert.equal(f.trace(f.add(a, b)), (f.trace(a) + f.trace(b)) % f.p);
        for (let c = 0; c < f.q; c += 1) {
          assert.equal(f.mul(a, f.add(b, c)), f.add(f.mul(a, b), f.mul(a, c)));
        }
      }
    }
  });

  test(`${id} additive character sums give exactly the orthogonality relation`, () => {
    const f = engine.field(id);
    for (let a = 0; a < f.q; a += 1) {
      let re = 0;
      let im = 0;
      for (let x = 0; x < f.q; x += 1) {
        const trace = f.trace(f.mul(a, x));
        // Evaluate independently of engine.character.
        re += Math.cos(2 * Math.PI * trace / f.p);
        im += Math.sin(2 * Math.PI * trace / f.p);
      }
      close(re, a === 0 ? f.q : 0);
      close(im, 0);
    }
  });

  test(`${id} Fourier round trip and Frobenius cycle preserve a nontrivial complex state`, () => {
    const f = engine.field(id);
    const state = complexState(f.q);
    const original = JSON.stringify(state);
    const transformed = engine.fourier(f, state);
    close(engine.norm(transformed), 1);
    assert.ok(engine.compare(state, engine.fourier(f, transformed, true)) < EPSILON);
    const twice = engine.fourier(f, transformed);
    const negatedLabels = state.map((_, x) => state[f.neg(x)]);
    assert.ok(engine.compare(twice, negatedLabels) < EPSILON, "F² must send label x to −x");
    let cycled = state;
    for (let i = 0; i < f.n; i += 1) cycled = engine.frobeniusState(f, cycled);
    assert.equal(engine.compare(state, cycled), 0);
    close(engine.probabilities(transformed).reduce((a, b) => a + b, 0), 1);
    assert.equal(JSON.stringify(state), original, "Operations must not mutate input states");
    assert.equal(engine.audit(f, state).passed, true);
  });

  test(`${id} obeys Z(b)X(a) = χ(ab)X(a)Z(b) for all labels`, () => {
    const f = engine.field(id);
    const state = complexState(f.q);
    for (let a = 0; a < f.q; a += 1) {
      for (let b = 0; b < f.q; b += 1) {
        const left = engine.phase(f, engine.shift(f, state, a), b);
        const right = engine.shift(f, engine.phase(f, state, b), a);
        const angle = 2 * Math.PI * f.trace(f.mul(a, b)) / f.p;
        const factor = { re: Math.cos(angle), im: Math.sin(angle) };
        for (let x = 0; x < f.q; x += 1) {
          complexClose(left[x], {
            re: factor.re * right[x].re - factor.im * right[x].im,
            im: factor.re * right[x].im + factor.im * right[x].re
          });
        }
      }
    }
  });
}

test("GF(9) has non-real phase gates and the specified positive Fourier sign", () => {
  const f = engine.field("gf9");
  assert.equal(f.mul(3, 3), 2, "α² = −1 = 2 in GF(3)");
  assert.equal(f.trace(1), 2);
  assert.equal(f.trace(3), 0);
  const basis = engine.basisState(9, 1);
  complexClose(engine.phase(f, basis, 1)[1], { re: -0.5, im: -Math.sqrt(3) / 2 });
  complexClose(engine.fourier(f, basis)[1], { re: -1 / 6, im: -Math.sqrt(3) / 6 });
  complexClose(engine.fourier(f, basis, true)[1], { re: -1 / 6, im: Math.sqrt(3) / 6 });
});

test("basis states shift by field addition and Frobenius permutes labels", () => {
  const f = engine.field("gf9");
  assert.deepEqual(engine.shift(f, engine.basisState(9, 2), 1), engine.basisState(9, 0));
  assert.deepEqual(engine.frobeniusState(f, engine.basisState(9, 3)), engine.basisState(9, 6));
  assert.equal(engine.compare(engine.basisState(4, 0), engine.basisState(4, 1)), 1);
});

test("normalization is explicit and audit reports an unnormalized input", () => {
  const state = engine.basisState(4, 0);
  state[0].re = 2;
  assert.equal(engine.norm(state), 2);
  assert.equal(engine.probabilities(state)[0], 4);
  assert.equal(engine.norm(engine.normalize(state)), 1);
  const audit = engine.audit("gf4", state);
  assert.equal(audit.passed, false);
  assert.equal(audit.checks.normalization.residual, 3);
  assert.equal(audit.checks.fourierInverse.passed, true);
  const tiny = engine.normalize([{ re: Number.MIN_VALUE, im: Number.MIN_VALUE }]);
  complexClose(tiny[0], { re: 1 / Math.sqrt(2), im: 1 / Math.sqrt(2) });
  close(engine.norm(tiny), 1);
});

test("invalid field labels, exponents, dimensions, and amplitudes fail without coercion", () => {
  const f = engine.field("gf8");
  const state = engine.basisState(8, 0);
  for (const id of [null, 8, "GF8", "constructor", "gf80", ""]) assert.throws(() => engine.field(id));
  for (const label of [-1, 8, 1.5, "1", NaN, Infinity, null, undefined]) {
    for (const method of ["trace", "frobenius", "labelElement", "neg", "inv"]) assert.throws(() => f[method](label));
    for (const method of ["add", "sub", "mul", "div"]) {
      assert.throws(() => f[method](label, 1));
      assert.throws(() => f[method](1, label));
    }
    assert.throws(() => engine.shift(f, state, label));
    assert.throws(() => engine.phase(f, state, label));
  }
  for (const exponent of [-1, 1.5, "2", NaN, Infinity, 1000001]) assert.throws(() => f.pow(2, exponent));
  assert.throws(() => f.inv(0));
  assert.throws(() => f.div(1, 0));
  for (const q of [0, 257, -1, 1.5, "8", NaN]) assert.throws(() => engine.basisState(q, 0));
  for (const index of [-1, 8, "1", 1.5, NaN]) assert.throws(() => engine.basisState(8, index));
  for (const bad of [null, [], [{ re: "1", im: 0 }], [{ re: NaN, im: 0 }], [{ re: 0, im: Infinity }], [{ re: 0 }], [{ re: 1e7, im: 0 }]]) {
    assert.throws(() => engine.norm(bad));
    assert.throws(() => engine.normalize(bad));
    assert.throws(() => engine.probabilities(bad));
  }
  const sparse = new Array(8);
  assert.throws(() => engine.fourier(f, sparse));
  assert.throws(() => engine.normalize(engine.basisState(4, 0).map(() => ({ re: 0, im: 0 }))));
  assert.throws(() => engine.fourier(f, engine.basisState(4, 0)));
  assert.throws(() => engine.fourier(f, state, "false"));
  assert.throws(() => engine.fourier({ id: "gf8" }, state));
  assert.throws(() => engine.fourier(undefined, state));
  assert.throws(() => engine.compare(state, engine.basisState(4, 0)));
});
