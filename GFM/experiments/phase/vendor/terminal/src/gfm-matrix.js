/* Complex matrices in a trace-character Fourier basis. Finite-field labels
 * index the basis; real rotations are evaluated over ordinary real numbers. */
(function (root, factory) {
  'use strict';
  const E = typeof module === 'object' && module.exports ? require('./engine.js') : root.RusslEngine;
  const api = factory(E);
  root.RusslGFMMatrix = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
  'use strict';
  if (!E || typeof E.field !== 'function') throw new Error('RusslEngine must be loaded first.');
  const limits = Object.freeze({ maxDimension: 16, maxMatrixNorm: 1e6, maxStateNorm: 1e6, maxAngleDegrees: 1e6, tolerance: 1e-10 });
  const tolerance = limits.tolerance;

  function field(value) {
    if (typeof value === 'string') return E.field(value);
    if (value && typeof value === 'object') {
      for (const id of Object.keys(E.fields)) {
        const f = E.field(id);
        if (value === f || value === E.fields[id]) return f;
      }
    }
    throw new TypeError('Expected a registered field object or field id.');
  }
  function dense(value, name) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(name + ' must be a plain dense array.');
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Reflect.ownKeys(descriptors).length !== value.length + 1) throw new TypeError(name + ' cannot have holes or extra properties.');
    for (let i = 0; i < value.length; i += 1) {
      const descriptor = descriptors[String(i)];
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) throw new TypeError(name + ' must contain only data entries.');
    }
    return value;
  }
  function complex(value, name) {
    let re, im;
    if (typeof value === 'number') { re = value; im = 0; }
    else if (Array.isArray(value)) {
      dense(value, name);
      if (value.length !== 2) throw new TypeError(name + ' complex pair must have two components.');
      [re, im] = value;
    } else if (value && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
      const descriptors = Object.getOwnPropertyDescriptors(value);
      const keys = Reflect.ownKeys(descriptors);
      if (keys.length !== 2 || !keys.includes('re') || !keys.includes('im') || !('value' in descriptors.re) || !('value' in descriptors.im)) throw new TypeError(name + ' must contain only numeric re and im data properties.');
      re = descriptors.re.value; im = descriptors.im.value;
    } else throw new TypeError(name + ' must be a finite number, [re, im], or {re, im}.');
    if (!Number.isFinite(re) || !Number.isFinite(im)) throw new TypeError(name + ' components must be finite numbers.');
    return { re, im };
  }
  function vectorNorm(vector) {
    let result = 0;
    for (const value of vector) result = Math.hypot(result, value.re, value.im);
    return result;
  }
  function matrixNorm(matrix) { return vectorNorm(matrix.flat()); }
  function vector(value, dimension, name = 'State') {
    dense(value, name);
    if (value.length !== dimension) throw new RangeError(name + ' dimension must equal ' + dimension + '.');
    const parsed = value.map((item, index) => complex(item, name + '[' + index + ']'));
    if (vectorNorm(parsed) > limits.maxStateNorm * (1 + 1e-12)) throw new RangeError(name + ' norm must not exceed 1e6.');
    return parsed;
  }
  function matrix(value, dimension) {
    dense(value, 'Matrix');
    if (value.length < 1 || value.length > limits.maxDimension || dimension !== undefined && value.length !== dimension) throw new RangeError('Matrix must be square with the required dimension, from 1 through 16.');
    const q = value.length;
    const parsed = value.map((row, i) => {
      dense(row, 'Matrix row ' + i);
      if (row.length !== q) throw new RangeError('Matrix must be square.');
      return row.map((value, j) => complex(value, 'Matrix[' + i + '][' + j + ']'));
    });
    if (matrixNorm(parsed) > limits.maxMatrixNorm * (1 + 1e-12)) throw new RangeError('Matrix Frobenius norm must not exceed 1e6.');
    return parsed;
  }
  function zero() { return { re: 0, im: 0 }; }
  function multiply(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function scale(value, factor) { return { re: value.re * factor, im: value.im * factor }; }
  function adjoint(A) { return A[0].map((_, j) => A.map(row => ({ re: row[j].re, im: -row[j].im }))); }
  function matmul(A, B) {
    return A.map(row => B[0].map((_, j) => row.reduce((sum, value, k) => {
      const term = multiply(value, B[k][j]);
      sum.re += term.re; sum.im += term.im; return sum;
    }, zero())));
  }
  function matvec(A, state) {
    return A.map(row => row.reduce((sum, value, j) => {
      const term = multiply(value, state[j]);
      sum.re += term.re; sum.im += term.im; return sum;
    }, zero()));
  }
  function vectorDifference(a, b) {
    let result = 0;
    for (let i = 0; i < a.length; i += 1) result = Math.max(result, Math.hypot(a[i].re - b[i].re, a[i].im - b[i].im));
    return result;
  }
  function matrixDifference(a, b) {
    let result = 0;
    for (let i = 0; i < a.length; i += 1) result = Math.max(result, vectorDifference(a[i], b[i]));
    return result;
  }
  function unitaryResidual(A) {
    const product = matmul(adjoint(A), A);
    return matrixNorm(product.map((row, i) => row.map((value, j) => ({ re: value.re - (i === j ? 1 : 0), im: value.im }))));
  }
  function checksFrom(residuals) {
    const checks = {};
    for (const [name, residual] of Object.entries(residuals)) checks[name] = { residual, passed: residual <= tolerance };
    return checks;
  }

  function fourierMatrix(fieldValue) {
    const f = field(fieldValue);
    if (f.q > limits.maxDimension) throw new RangeError('Fourier matrix dimension must not exceed 16.');
    return Array.from({ length: f.q }, (_, k) => Array.from({ length: f.q }, (_, x) => scale(f.character(f.mul(k, x)), 1 / Math.sqrt(f.q))));
  }
  function changeBasis(fieldValue, input, inverse = false) {
    const f = field(fieldValue);
    if (typeof inverse !== 'boolean') throw new TypeError('Inverse must be a boolean.');
    const A = matrix(input, f.q);
    const F = fourierMatrix(f);
    return inverse ? matmul(matmul(adjoint(F), A), F) : matmul(matmul(F, A), adjoint(F));
  }
  function operatorFrom(fieldValue, applyFn) {
    const f = field(fieldValue);
    if (typeof applyFn !== 'function') throw new TypeError('Operator application must be a function.');
    const columns = Array.from({ length: f.q }, (_, x) => vector(applyFn(E.basisState(f.q, x)), f.q, 'Operator column'));
    return matrix(Array.from({ length: f.q }, (_, y) => columns.map(column => ({ ...column[y] }))), f.q);
  }
  function apply(input, state) {
    const A = matrix(input);
    return matvec(A, vector(state, A.length));
  }

  function rotation(axis, angleDegrees) {
    if (typeof axis !== 'string' || !['x', 'y', 'z'].includes(axis.toLowerCase())) throw new RangeError('Rotation axis must be x, y, or z.');
    if (!Number.isFinite(angleDegrees) || Math.abs(angleDegrees) > limits.maxAngleDegrees) throw new RangeError('Rotation angle must be a finite number between -1e6 and 1e6 degrees.');
    axis = axis.toLowerCase();
    const angleRadians = angleDegrees * Math.PI / 180;
    const c = Math.cos(angleRadians), s = Math.sin(angleRadians);
    const values = axis === 'x' ? [[1, 0, 0], [0, c, -s], [0, s, c]]
      : axis === 'y' ? [[c, 0, s], [0, 1, 0], [-s, 0, c]]
        : [[c, -s, 0], [s, c, 0], [0, 0, 1]];
    const A = matrix(values, 3);
    const determinant = values[0][0] * (values[1][1] * values[2][2] - values[1][2] * values[2][1])
      - values[0][1] * (values[1][0] * values[2][2] - values[1][2] * values[2][0])
      + values[0][2] * (values[1][0] * values[2][1] - values[1][1] * values[2][0]);
    const checks = checksFrom({ orthogonality: unitaryResidual(A), determinantOne: Math.abs(determinant - 1) });
    return { axis, matrix: A, angleDegrees, angleRadians, determinant, checks,
      passed: Object.values(checks).every(check => check.passed), tolerance,
      domain: 'Real active column-vector SO(3) rotation in a complex three-dimensional representation; trigonometry over real numbers.' };
  }

  function reapply(fieldValue, inputOperator, state) {
    const f = field(fieldValue);
    const A = matrix(inputOperator, f.q);
    const input = vector(state, f.q);
    const inputNorm = vectorNorm(input);
    if (Math.abs(inputNorm * inputNorm - 1) > tolerance) throw new RangeError('Reapplication requires a normalized input state.');
    const F = fourierMatrix(f);
    const transformedInput = matvec(F, input);
    const transformedOperator = matmul(matmul(F, A), adjoint(F));
    const transformedOutput = matvec(transformedOperator, transformedInput);
    const output = matvec(adjoint(F), transformedOutput);
    const directOutput = matvec(A, input);
    const directNorm = vectorNorm(directOutput);
    const comparisonScale = Math.max(1, directNorm);
    const operatorResidual = unitaryResidual(A);
    const unitarity = { isUnitary: operatorResidual <= tolerance, residual: operatorResidual, tolerance };
    const norms = { input: inputNorm, transformedInput: vectorNorm(transformedInput), transformedOutput: vectorNorm(transformedOutput), output: vectorNorm(output), directOutput: directNorm };
    const residuals = {
      inputNormalization: Math.abs(inputNorm * inputNorm - 1),
      fourierUnitarity: unitaryResidual(F),
      operatorRoundTrip: matrixDifference(matmul(matmul(adjoint(F), transformedOperator), F), A) / Math.max(1, matrixNorm(A)),
      outputCovariance: vectorDifference(output, directOutput) / comparisonScale,
      normCovariance: Math.abs(norms.transformedOutput - directNorm) / comparisonScale,
      restoredNormCovariance: Math.abs(norms.output - directNorm) / comparisonScale
    };
    if (unitarity.isUnitary) residuals.unitaryNormPreservation = Math.abs(norms.output - inputNorm);
    const checks = checksFrom(residuals);
    return { field: f.id, dimension: f.q, input, transformedInput, transformedOperator,
      transformedOutput, output, directOutput, norms, unitarity,
      outputNormalized: Math.abs(norms.output * norms.output - 1) <= tolerance,
      checks, passed: Object.values(checks).every(check => check.passed), tolerance,
      convention: 'F A F† and F psi; recover physical-coordinate output with F†.',
      scope: 'Complex matrix representation change and reapplication; finite-field labels index the basis. Nonunitary outputs retain their calculated norm.' };
  }

  function sampleTransform(fieldValue, values) {
    const f = field(fieldValue);
    const originalValues = vector(values, f.q, 'Samples');
    const sampleScale = vectorNorm(originalValues);
    if (sampleScale === 0) throw new RangeError('Zero samples cannot prepare a normalized state.');
    const normalizedSamples = E.normalize(originalValues);
    const transformedState = E.fourier(f, normalizedSamples);
    const restoredState = E.fourier(f, transformedState, true);
    const unscaledCoefficients = transformedState.map(value => scale(value, sampleScale));
    const restoredValues = restoredState.map(value => scale(value, sampleScale));
    const checks = checksFrom({
      normalization: Math.abs(vectorNorm(normalizedSamples) ** 2 - 1),
      fourierNorm: Math.abs(vectorNorm(transformedState) - 1),
      stateRoundTrip: vectorDifference(restoredState, normalizedSamples),
      sampleRoundTrip: vectorDifference(restoredValues, originalValues) / Math.max(1, sampleScale),
      unscaledNormCovariance: Math.abs(vectorNorm(unscaledCoefficients) - sampleScale) / Math.max(1, sampleScale)
    });
    return { field: f.id, dimension: f.q, originalValues, normalizedSamples, transformedState,
      scale: sampleScale, unscaledCoefficients, restoredValues, checks,
      passed: Object.values(checks).every(check => check.passed), tolerance,
      normalizationConvention: 'Prepare psi=samples/||samples||2; retain scale for inverse restoration.',
      scope: 'Finite trace-character Fourier transform of declared sample values; labels index samples.' };
  }

  return Object.freeze({ fourierMatrix, changeBasis, operatorFrom, apply, rotation, reapply, sampleTransform, limits, tolerance });
});
