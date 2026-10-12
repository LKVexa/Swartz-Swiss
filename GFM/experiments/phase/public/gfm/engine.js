(function (root) {
  "use strict";

  // Labels encode coefficients in base p, lowest degree first. Amplitudes are
  // ordinary complex numbers; field elements are never amplitude scalars.
  const MAX_DIMENSION = 256;
  const MAX_STATE_NORM = 1e6;
  const MAX_EXPONENT = 1000000;
  const TOLERANCE = 1e-10;
  const definitions = [
    { id: "gf3", p: 3, n: 1, q: 3, polynomial: [0, 1], label: "GF(3)" },
    { id: "gf4", p: 2, n: 2, q: 4, polynomial: [1, 1, 1], label: "GF(4)" },
    { id: "gf8", p: 2, n: 3, q: 8, polynomial: [1, 1, 0, 1], label: "GF(8)" },
    { id: "gf9", p: 3, n: 2, q: 9, polynomial: [1, 0, 1], label: "GF(9)" },
    { id: "gf16", p: 2, n: 4, q: 16, polynomial: [1, 1, 0, 0, 1], label: "GF(16)" }
  ];
  const fields = Object.create(null);
  for (const definition of definitions) {
    fields[definition.id] = Object.freeze({
      ...definition,
      polynomial: Object.freeze(definition.polynomial.slice())
    });
  }
  Object.freeze(fields);
  const arithmetic = Object.create(null);

  function integer(value, name, minimum, maximum) {
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      throw new RangeError(name + " must be an integer from " + minimum + " to " + maximum + ".");
    }
    return value;
  }

  function mod(value, p) {
    return ((value % p) + p) % p;
  }

  function makeField(definition) {
    const { p, n, q, polynomial } = definition;
    const coefficients = Array.from({ length: q }, (_, label) => {
      const result = [];
      for (let i = 0; i < n; i += 1) {
        result.push(label % p);
        label = Math.floor(label / p);
      }
      return result;
    });
    function encode(values) {
      let result = 0;
      for (let i = n - 1; i >= 0; i -= 1) result = result * p + mod(values[i], p);
      return result;
    }
    function rawAdd(a, b) {
      return encode(coefficients[a].map((value, i) => value + coefficients[b][i]));
    }
    function rawNeg(a) {
      return encode(coefficients[a].map(value => -value));
    }
    function rawMul(a, b) {
      const product = new Array(2 * n - 1).fill(0);
      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < n; j += 1) {
          product[i + j] = mod(product[i + j] + coefficients[a][i] * coefficients[b][j], p);
        }
      }
      // The defining polynomial is monic. Subtract each leading coefficient
      // times the appropriate shifted polynomial, entirely in the prime field.
      for (let degree = product.length - 1; degree >= n; degree -= 1) {
        const leading = product[degree];
        for (let i = 0; i <= n; i += 1) {
          product[degree - n + i] = mod(product[degree - n + i] - leading * polynomial[i], p);
        }
      }
      return encode(product);
    }
    function rawPow(a, exponent) {
      let result = 1;
      while (exponent > 0) {
        if (exponent % 2 === 1) result = rawMul(result, a);
        a = rawMul(a, a);
        exponent = Math.floor(exponent / 2);
      }
      return result;
    }
    function element(value) {
      return integer(value, "Field element", 0, q - 1);
    }
    const traces = coefficients.map((_, a) => {
      let total = 0;
      let conjugate = a;
      for (let i = 0; i < n; i += 1) {
        total = rawAdd(total, conjugate);
        conjugate = rawPow(conjugate, p);
      }
      if (total >= p) throw new Error("Internal field error: trace did not land in the prime field.");
      return total;
    });
    const characters = traces.map(trace => {
      if (trace === 0) return Object.freeze({ re: 1, im: 0 });
      if (p === 2) return Object.freeze({ re: -1, im: 0 });
      return Object.freeze({ re: -0.5, im: trace === 1 ? Math.sqrt(3) / 2 : -Math.sqrt(3) / 2 });
    });
    const superscripts = ["", "", "²", "³", "⁴"];
    return Object.freeze({
      ...definition,
      add(a, b) { return rawAdd(element(a), element(b)); },
      sub(a, b) { return rawAdd(element(a), rawNeg(element(b))); },
      neg(a) { return rawNeg(element(a)); },
      mul(a, b) { return rawMul(element(a), element(b)); },
      pow(a, exponent) { return rawPow(element(a), integer(exponent, "Exponent", 0, MAX_EXPONENT)); },
      inv(a) {
        element(a);
        if (a === 0) throw new RangeError("Zero has no multiplicative inverse.");
        return rawPow(a, q - 2);
      },
      div(a, b) {
        element(a); element(b);
        if (b === 0) throw new RangeError("Cannot divide by zero.");
        return rawMul(a, rawPow(b, q - 2));
      },
      trace(a) { return traces[element(a)]; },
      frobenius(a) { return rawPow(element(a), p); },
      character(a) { return { ...characters[element(a)] }; },
      labelElement(a) {
        const terms = [];
        coefficients[element(a)].forEach((coefficient, degree) => {
          if (coefficient === 0) return;
          if (degree === 0) terms.push(String(coefficient));
          else terms.push((coefficient === 1 ? "" : String(coefficient)) + "α" + superscripts[degree]);
        });
        return terms.length ? terms.join(" + ") : "0";
      }
    });
  }

  function field(id) {
    if (typeof id !== "string" || !Object.prototype.hasOwnProperty.call(fields, id)) {
      throw new RangeError("Unknown field. Choose gf3, gf4, gf8, gf9, or gf16.");
    }
    if (!arithmetic[id]) arithmetic[id] = makeField(fields[id]);
    return arithmetic[id];
  }

  function resolveField(value) {
    if (typeof value === "string") return field(value);
    if (!value || typeof value !== "object") {
      throw new TypeError("Expected a registered field object or field id.");
    }
    for (const id of Object.keys(fields)) {
      if (value === fields[id] || value === arithmetic[id]) return field(id);
    }
    throw new TypeError("Expected a registered field object or field id.");
  }

  function validateState(state, dimension) {
    if (!Array.isArray(state) || state.length < 1 || state.length > MAX_DIMENSION) {
      throw new RangeError("State must be an array with 1 to " + MAX_DIMENSION + " amplitudes.");
    }
    if (dimension !== undefined && state.length !== dimension) {
      throw new RangeError("State dimension must equal the field order (" + dimension + ").");
    }
    let result = 0;
    for (let i = 0; i < state.length; i += 1) {
      const amplitude = state[i];
      if (!amplitude || typeof amplitude !== "object" ||
          !Number.isFinite(amplitude.re) || !Number.isFinite(amplitude.im)) {
        throw new TypeError("Amplitude " + i + " must have finite numeric re and im components.");
      }
      if (Math.abs(amplitude.re) > MAX_STATE_NORM * (1 + 1e-12) ||
          Math.abs(amplitude.im) > MAX_STATE_NORM * (1 + 1e-12)) {
        throw new RangeError("State norm must not exceed " + MAX_STATE_NORM + ".");
      }
      result = Math.hypot(result, amplitude.re, amplitude.im);
    }
    if (result > MAX_STATE_NORM * (1 + 1e-12)) {
      throw new RangeError("State norm must not exceed " + MAX_STATE_NORM + ".");
    }
    return result;
  }

  function zeros(q) {
    return Array.from({ length: q }, () => ({ re: 0, im: 0 }));
  }

  function basisState(q, index) {
    integer(q, "Dimension", 1, MAX_DIMENSION);
    integer(index, "Basis index", 0, q - 1);
    const state = zeros(q);
    state[index].re = 1;
    return state;
  }

  function normalize(state) {
    const length = validateState(state);
    if (length === 0) throw new RangeError("Cannot normalize the zero state.");
    // Scale first so even subnormal but nonzero input components normalize
    // correctly without underflow in the sum of their squares.
    let scale = 0;
    for (const amplitude of state) scale = Math.max(scale, Math.abs(amplitude.re), Math.abs(amplitude.im));
    let scaledNorm = 0;
    for (const amplitude of state) scaledNorm = Math.hypot(scaledNorm, amplitude.re / scale, amplitude.im / scale);
    return state.map(amplitude => ({
      re: (amplitude.re / scale) / scaledNorm,
      im: (amplitude.im / scale) / scaledNorm
    }));
  }

  function norm(state) {
    return validateState(state);
  }

  function probabilities(state) {
    validateState(state);
    return state.map(amplitude => amplitude.re * amplitude.re + amplitude.im * amplitude.im);
  }

  function complexMultiply(a, b) {
    return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
  }

  function fourier(fieldValue, state, inverse = false) {
    const f = resolveField(fieldValue);
    validateState(state, f.q);
    if (typeof inverse !== "boolean") throw new TypeError("Inverse must be a boolean.");
    const result = zeros(f.q);
    const scale = 1 / Math.sqrt(f.q);
    for (let k = 0; k < f.q; k += 1) {
      for (let x = 0; x < f.q; x += 1) {
        const character = f.character(f.mul(k, x));
        if (inverse) character.im = -character.im;
        const term = complexMultiply(character, state[x]);
        result[k].re += term.re * scale;
        result[k].im += term.im * scale;
      }
    }
    return result;
  }

  function shift(fieldValue, state, a) {
    const f = resolveField(fieldValue);
    validateState(state, f.q);
    integer(a, "Shift label", 0, f.q - 1);
    const result = zeros(f.q);
    for (let x = 0; x < f.q; x += 1) result[f.add(x, a)] = { ...state[x] };
    return result;
  }

  function phase(fieldValue, state, b) {
    const f = resolveField(fieldValue);
    validateState(state, f.q);
    integer(b, "Phase label", 0, f.q - 1);
    return state.map((amplitude, x) => complexMultiply(f.character(f.mul(b, x)), amplitude));
  }

  function frobeniusState(fieldValue, state) {
    const f = resolveField(fieldValue);
    validateState(state, f.q);
    const result = zeros(f.q);
    for (let x = 0; x < f.q; x += 1) result[f.frobenius(x)] = { ...state[x] };
    return result;
  }

  function compare(a, b) {
    validateState(a);
    validateState(b, a.length);
    let result = 0;
    for (let i = 0; i < a.length; i += 1) {
      result = Math.max(result, Math.hypot(a[i].re - b[i].re, a[i].im - b[i].im));
    }
    return result;
  }

  function audit(fieldValue, state) {
    const f = resolveField(fieldValue);
    const stateNorm = validateState(state, f.q);
    const relativeScale = Math.max(1, stateNorm);
    const residuals = {
      normalization: Math.abs(stateNorm * stateNorm - 1),
      fourierInverse: compare(state, fourier(f, fourier(f, state), true)) / relativeScale,
      frobeniusCycle: 0,
      characterOrthogonality: 0,
      weyl: 0
    };
    let cycled = state;
    for (let i = 0; i < f.n; i += 1) cycled = frobeniusState(f, cycled);
    residuals.frobeniusCycle = compare(state, cycled) / relativeScale;
    for (let c = 0; c < f.q; c += 1) {
      let real = 0;
      let imaginary = 0;
      for (let x = 0; x < f.q; x += 1) {
        const character = f.character(f.mul(c, x));
        real += character.re;
        imaginary += character.im;
      }
      residuals.characterOrthogonality = Math.max(residuals.characterOrthogonality,
        Math.hypot(real - (c === 0 ? f.q : 0), imaginary) / f.q);
    }
    // Test every pair of field labels, not only a convenient sample.
    for (let a = 0; a < f.q; a += 1) {
      for (let b = 0; b < f.q; b += 1) {
        const left = phase(f, shift(f, state, a), b);
        const character = f.character(f.mul(a, b));
        const right = shift(f, phase(f, state, b), a).map(amplitude => complexMultiply(character, amplitude));
        residuals.weyl = Math.max(residuals.weyl, compare(left, right) / relativeScale);
      }
    }
    const checks = {};
    for (const [name, residual] of Object.entries(residuals)) {
      checks[name] = { residual, passed: residual <= TOLERANCE };
    }
    return {
      field: f.id,
      dimension: f.q,
      stateNorm,
      tolerance: TOLERANCE,
      residuals,
      checks,
      passed: Object.values(checks).every(check => check.passed)
    };
  }

  const api = Object.freeze({
    fields, field, basisState, normalize, fourier, shift, phase, frobeniusState,
    probabilities, norm, compare, audit,
    limits: Object.freeze({ maxDimension: MAX_DIMENSION, maxStateNorm: MAX_STATE_NORM, maxExponent: MAX_EXPONENT }),
    tolerance: TOLERANCE
  });
  root.RusslEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
