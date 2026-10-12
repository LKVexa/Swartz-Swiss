/* RUSSL refined finite-field operators. Candidate equation numbers are aliases,
 * not equation numbers in the primary references. Complex amplitudes remain
 * distinct from polynomial-encoded finite-field labels. */
(function (root, factory) {
  'use strict';
  const engine = typeof module === 'object' && module.exports
    ? require('./engine.js') : root.RusslEngine;
  const api = factory(engine);
  root.RusslRefinedField = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
  'use strict';
  if (!E || typeof E.field !== 'function') throw new Error('RusslEngine must be loaded first.');
  const tolerance = E.tolerance;
  const conventions = Object.freeze({
    displacement: 'D(xi,zeta) = chi(-xi*zeta/2) Z(zeta) X(xi)',
    displacementComposition: 'D(xi,zeta) D(xi2,zeta2) = chi((zeta*xi2-xi*zeta2)/2) D(xi+xi2,zeta+zeta2)',
    reflection: 'R(q0,p0) psi[x] = chi(p0*(x-y)) psi[y], y = 2*q0-x',
    pureWigner: 'W(q0,p0) = (1/q) <psi|R(q0,p0)|psi>',
    gridOrder: 'grid[q0][p0], polynomial-encoded position and momentum labels',
    momentumConvention: 'probabilities of the negative-sign Fourier state',
    mana: 'log2(sum_{q0,p0} abs(W(q0,p0)))',
    manaLogBase: 2,
    symplecticScope: 'finite-field label map; no amplitude operator',
    equationNumberScope: 'candidate aliases only',
    primaryReferences: Object.freeze([
      'https://arxiv.org/abs/quant-ph/0605054',
      'https://arxiv.org/abs/quant-ph/0602001'
    ])
  });

  function registeredField(value) {
    if (typeof value === 'string') return E.field(value);
    if (value && typeof value === 'object') {
      for (const id of Object.keys(E.fields)) {
        const f = E.field(id);
        if (value === f || value === E.fields[id]) return f;
      }
    }
    throw new TypeError('Expected a registered finite-field object or field id.');
  }

  function oddField(value) {
    const f = registeredField(value);
    if (f.p === 2) throw new RangeError('This operator requires odd characteristic; p = 2 is unsupported.');
    return f;
  }

  function label(f, value) { return f.add(value, 0); }

  function validateState(f, state) {
    const norm = E.norm(state);
    if (state.length !== f.q) throw new RangeError('State dimension must equal the field order (' + f.q + ').');
    return norm;
  }

  function multiply(a, b) {
    return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
  }

  function quadraticCharacter(field, x) {
    const f = oddField(field);
    label(f, x);
    if (x === 0) return 0;
    const result = f.pow(x, (f.q - 1) / 2);
    if (result === 1) return 1;
    if (result === f.neg(1)) return -1;
    throw new Error('Quadratic-character power did not land at a field sign.');
  }

  function displacement(field, state, xi, zeta) {
    const f = oddField(field);
    validateState(f, state);
    label(f, xi); label(f, zeta);
    const half = f.inv(f.add(1, 1));
    const factor = f.character(f.neg(f.mul(half, f.mul(xi, zeta))));
    return E.phase(f, E.shift(f, state, xi), zeta).map(amplitude => multiply(factor, amplitude));
  }

  function reflect(f, state, q0, p0) {
    const twicePosition = f.add(q0, q0);
    return state.map((_, x) => {
      const y = f.sub(twicePosition, x);
      return multiply(f.character(f.mul(p0, f.sub(x, y))), state[y]);
    });
  }

  function reflection(field, state, q0, p0) {
    const f = oddField(field);
    validateState(f, state);
    label(f, q0); label(f, p0);
    return reflect(f, state, q0, p0);
  }

  function maxDifference(a, b) {
    let maximum = 0;
    for (let i = 0; i < a.length; i += 1) maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
    return maximum;
  }

  function pureWigner(field, state) {
    const f = oddField(field);
    const stateNorm = validateState(f, state);
    if (Math.abs(stateNorm * stateNorm - 1) > tolerance) {
      throw new RangeError('Pure-state Wigner evaluation requires a normalized state.');
    }
    const labels = Array.from({ length: f.q }, (_, x) => x);
    const grid = labels.map(() => new Array(f.q).fill(0));
    const position = new Array(f.q).fill(0);
    const momentum = new Array(f.q).fill(0);
    let normalization = 0;
    let squareSum = 0;
    let l1Norm = 0;
    let minValue = Infinity;
    let maxValue = -Infinity;
    let maxImaginaryResidual = 0;
    let negativeCellCount = 0;
    for (const q0 of labels) {
      for (const p0 of labels) {
        const reflected = reflect(f, state, q0, p0);
        let re = 0;
        let im = 0;
        for (let x = 0; x < f.q; x += 1) {
          re += state[x].re * reflected[x].re + state[x].im * reflected[x].im;
          im += state[x].re * reflected[x].im - state[x].im * reflected[x].re;
        }
        const value = re / f.q;
        maxImaginaryResidual = Math.max(maxImaginaryResidual, Math.abs(im / f.q));
        grid[q0][p0] = value;
        position[q0] += value;
        momentum[p0] += value;
        normalization += value;
        squareSum += value * value;
        l1Norm += Math.abs(value);
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
        if (value < -tolerance) negativeCellCount += 1;
      }
    }
    if (maxImaginaryResidual > tolerance) throw new Error('Wigner expectation is not real within the stated tolerance.');
    const purity = f.q * squareSum;
    const expectedPosition = E.probabilities(state);
    const expectedMomentum = E.probabilities(E.fourier(f, state, true));
    const residuals = {
      normalization: Math.abs(normalization - 1),
      reality: maxImaginaryResidual,
      positionMarginal: maxDifference(position, expectedPosition),
      momentumMarginal: maxDifference(momentum, expectedMomentum),
      purity: Math.abs(purity - 1)
    };
    const checks = {};
    for (const [name, residual] of Object.entries(residuals)) checks[name] = { residual, passed: residual <= tolerance };
    return {
      field: f.id,
      dimension: f.q,
      axes: { q0: labels.slice(), p0: labels.slice() },
      axisOrder: conventions.gridOrder,
      grid,
      normalization,
      marginals: { position, momentum, expectedPosition, expectedMomentum },
      momentumConvention: conventions.momentumConvention,
      purity,
      l1Norm,
      mana: Math.log2(l1Norm),
      manaLogBase: 2,
      negativity: Math.max(0, (l1Norm - normalization) / 2),
      negativeCellCount,
      minValue,
      maxValue,
      maxImaginaryResidual,
      tolerance,
      residuals,
      checks,
      passed: Object.values(checks).every(check => check.passed),
      scope: 'normalized pure-state finite-field Wigner function; no mixed-state or hardware claim'
    };
  }

  function symplectic(field, a, b, c, d, x, y) {
    const f = registeredField(field);
    for (const value of [a, b, c, d, x, y]) label(f, value);
    const det = f.sub(f.mul(a, d), f.mul(b, c));
    return {
      field: f.id,
      matrix: [[a, b], [c, d]],
      det,
      determinant: det,
      preservesOmega: det === 1,
      input: { x, y },
      output: { x: f.add(f.mul(a, x), f.mul(b, y)), y: f.add(f.mul(c, x), f.mul(d, y)) },
      omegaConvention: 'omega((x,y),(x2,y2)) = x*y2-y*x2; omega(Mu,Mv) = det(M)*omega(u,v)',
      scope: conventions.symplecticScope
    };
  }

  return Object.freeze({ quadraticCharacter, displacement, reflection, pureWigner, symplectic, conventions, tolerance });
});
