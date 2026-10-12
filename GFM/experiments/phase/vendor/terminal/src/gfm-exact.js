/* Exact finite-field analogues of a linearized pendulum and axial rotations.
 * Labels encode field elements; they are not real times, lengths, or angles. */
(function (root, factory) {
  'use strict';
  const engine = typeof module === 'object' && module.exports
    ? require('./engine.js') : root.RusslEngine;
  const api = factory(engine);
  root.RusslGFMExact = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
  'use strict';
  if (!E || typeof E.field !== 'function') throw new Error('RusslEngine must be loaded first.');
  const MAX_STEPS = 256;
  const domain = 'exact finite-field labels in odd characteristic';
  const encoding = 'integer labels encode polynomial coefficients in base p, lowest degree first';

  function oddField(value) {
    let f;
    if (typeof value === 'string') f = E.field(value);
    else if (value && typeof value === 'object') {
      for (const id of Object.keys(E.fields)) {
        if (value === E.fields[id] || value === E.field(id)) { f = E.field(id); break; }
      }
    }
    if (!f) throw new TypeError('Expected a registered finite-field object or field id.');
    if (f.p === 2) throw new RangeError('This analogue requires odd characteristic; p = 2 is unsupported.');
    return f;
  }

  function label(f, value) { return f.add(value, 0); }

  function pointLabels(f, point) {
    if (!Array.isArray(point) || point.length !== 3) {
      throw new TypeError('Point must be an array of three finite-field labels.');
    }
    const values = [];
    for (let i = 0; i < 3; i += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(point, String(i));
      if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new TypeError('Point must contain three explicit labels without accessors.');
      }
      values.push(label(f, descriptor.value));
    }
    return values;
  }

  function matrixProduct(f, a, b) {
    return a.map(row => b[0].map((_, j) => row.reduce(
      (sum, value, k) => f.add(sum, f.mul(value, b[k][j])), 0)));
  }

  function applyMatrix(f, matrix, vector) {
    return matrix.map(row => row.reduce((sum, value, i) => f.add(sum, f.mul(value, vector[i])), 0));
  }

  function sameMatrix(a, b) {
    return a.every((row, i) => row.every((value, j) => value === b[i][j]));
  }

  function transpose(matrix) { return matrix[0].map((_, j) => matrix.map(row => row[j])); }
  function identity(n) { return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0)); }
  function sameVector(a, b) { return a.every((value, i) => value === b[i]); }

  function verletMatrix(f, kappa, h) {
    const halfKick = f.mul(f.mul(h, kappa), f.inv(f.add(1, 1)));
    const a = f.sub(1, f.mul(h, halfKick));
    return [[a, h], [f.neg(f.mul(halfKick, f.add(1, a))), a]];
  }

  function verletStep(f, state, kappa, h) {
    const halfKick = f.mul(f.mul(h, kappa), f.inv(f.add(1, 1)));
    const vhalf = f.sub(state.v, f.mul(halfKick, state.q));
    const q = f.add(state.q, f.mul(h, vhalf));
    return { q, v: f.sub(vhalf, f.mul(halfKick, q)) };
  }

  function orbitOf(f, initial, kappa, h) {
    const bound = f.q * f.q;
    const seen = new Map();
    let state = { ...initial };
    for (let count = 0; count <= bound; count += 1) {
      const key = state.q + ',' + state.v;
      if (seen.has(key)) {
        const preperiod = seen.get(key);
        if (preperiod !== 0 || state.q !== initial.q || state.v !== initial.v) {
          throw new Error('Internal error: an invertible Verlet map must return to its initial state.');
        }
        return {
          kind: count === 1 ? 'fixed-point' : 'cycle',
          length: count, preperiod, statesVisited: seen.size, bound, complete: true,
          meaning: 'exact recurrence in the finite label space; no real-time period is assigned'
        };
      }
      if (count === bound) break;
      seen.set(key, count);
      state = verletStep(f, state, kappa, h);
    }
    throw new Error('Internal error: finite orbit did not close within the field-order-squared bound.');
  }

  function oscillator(field, q, v, kappa, h, steps = 1) {
    const f = oddField(field);
    label(f, q); label(f, v); label(f, kappa); label(f, h);
    if (!Number.isInteger(steps) || steps < 1 || steps > MAX_STEPS) {
      throw new RangeError('Steps must be an integer from 1 to ' + MAX_STEPS + '.');
    }
    const initial = { q, v };
    const matrix = verletMatrix(f, kappa, h);
    const determinant = f.sub(f.mul(matrix[0][0], matrix[1][1]), f.mul(matrix[0][1], matrix[1][0]));
    const omega = [[0, 1], [f.neg(1), 0]];
    const symplectic = sameMatrix(matrixProduct(f, matrixProduct(f, transpose(matrix), omega), matrix), omega);
    const trajectory = [{ step: 0, ...initial }];
    let state = { ...initial };
    let matrixAgrees = true;
    for (let step = 1; step <= steps; step += 1) {
      const expected = applyMatrix(f, matrix, [state.q, state.v]);
      state = verletStep(f, state, kappa, h);
      matrixAgrees = matrixAgrees && sameVector(expected, [state.q, state.v]);
      trajectory.push({ step, ...state });
    }
    let reversed = { ...state };
    for (let step = 0; step < steps; step += 1) reversed = verletStep(f, reversed, kappa, f.neg(h));
    return {
      domain, field: f.id, encoding,
      model: 'dimensionless linearized pendulum, kick-drift-kick Verlet analogue',
      parameters: { kappa, h, steps }, initial, final: { ...state }, matrix, determinant, trajectory,
      checks: { determinantOne: determinant === 1, symplectic, matrixAgrees,
        inverseVerified: reversed.q === q && reversed.v === v },
      orbit: orbitOf(f, initial, kappa, h),
      scope: 'Exact label dynamics. h is a field element, not elapsed seconds; kappa is a field coefficient, not a physical calibration. Zero h gives the identity and zero kappa gives the free shear. This is not the nonlinear sine pendulum or a modular conversion of a pictured real trajectory.'
    };
  }

  function rotationMatrix(f, axis, c, s) {
    const negativeS = f.neg(s);
    if (axis === 'x') return [[1, 0, 0], [0, c, negativeS], [0, s, c]];
    if (axis === 'y') return [[c, 0, s], [0, 1, 0], [negativeS, 0, c]];
    return [[c, negativeS, 0], [s, c, 0], [0, 0, 1]];
  }

  function determinant3(f, m) {
    const minor0 = f.sub(f.mul(m[1][1], m[2][2]), f.mul(m[1][2], m[2][1]));
    const minor1 = f.sub(f.mul(m[1][0], m[2][2]), f.mul(m[1][2], m[2][0]));
    const minor2 = f.sub(f.mul(m[1][0], m[2][1]), f.mul(m[1][1], m[2][0]));
    return f.add(f.sub(f.mul(m[0][0], minor0), f.mul(m[0][1], minor1)), f.mul(m[0][2], minor2));
  }

  function quadraticForm(f, point) { return point.reduce((sum, value) => f.add(sum, f.mul(value, value)), 0); }

  function rotation(field, axis, t, point) {
    const f = oddField(field);
    if (axis !== 'x' && axis !== 'y' && axis !== 'z') throw new RangeError('Axis must be x, y, or z.');
    const input = pointLabels(f, point);
    let c, s, denominator;
    if (t === 'infinity') {
      c = f.neg(1); s = 0; denominator = null;
    } else {
      label(f, t);
      const squared = f.mul(t, t);
      denominator = f.add(1, squared);
      if (denominator === 0) throw new RangeError('Rotation parameter is singular: 1 + t² = 0 in this field.');
      const inverseDenominator = f.inv(denominator);
      c = f.mul(f.sub(1, squared), inverseDenominator);
      s = f.mul(f.add(t, t), inverseDenominator);
    }
    const matrix = rotationMatrix(f, axis, c, s);
    const output = applyMatrix(f, matrix, input);
    const inverseMatrix = rotationMatrix(f, axis, c, f.neg(s));
    const determinant = determinant3(f, matrix);
    const inputQuadraticForm = quadraticForm(f, input);
    const outputQuadraticForm = quadraticForm(f, output);
    return {
      domain, field: f.id, encoding, axis, parameter: t, c, s, denominator, matrix,
      point: input, output, determinant, inputQuadraticForm, outputQuadraticForm,
      checks: {
        unitCircle: f.add(f.mul(c, c), f.mul(s, s)) === 1,
        orthogonal: sameMatrix(matrixProduct(f, transpose(matrix), matrix), identity(3)),
        determinantOne: determinant === 1,
        normPreserved: inputQuadraticForm === outputQuadraticForm,
        inverseVerified: sameVector(applyMatrix(f, inverseMatrix, output), input)
      },
      scope: 'Exact rational axial rotation over the field: c=(1-t²)/(1+t²), s=2t/(1+t²), with the projective infinity point c=-1,s=0. Preserves the finite-field quadratic form, which is not a positive Euclidean norm. t is a field label, not a real angle; no angle from the supplied image is reduced modulo the field.'
    };
  }

  return Object.freeze({ oscillator, rotation, maxSteps: MAX_STEPS, domain, encoding });
});
