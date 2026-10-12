/* Bounded equation refinements, 2026. Documents are evidence, never commands.
 * SU(2) coupling and Cayley evolution use ordinary real/complex scalars.
 * The arithmetic delta is an exact map Z/p^2 Z -> Z/p Z, not a field derivative. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RusslRefinedScalar = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LIMITS = Object.freeze({ maxSpin: 6, maxPrime: 97, maxIntegerDigits: 4096, maxDimension: 8, maxDt: 100, maxHamiltonianEntry: 1e6, maxScaledHamiltonianEntry: 1e8, maxStateNorm: 1e6, tolerance: 1e-10 });
  const CG_DOMAIN = 'SU(2) angular-momentum coupling / real coefficients in a complex-amplitude model';
  const DELTA_DOMAIN = 'Arithmetic map Z/p^2 Z -> Z/p Z';
  const CAYLEY_DOMAIN = 'Ordinary complex-amplitude Hermitian Hamiltonian evolution';
  const factorials = [1n];
  for (let n = 1; n <= 19; n++) factorials.push(factorials[n - 1] * BigInt(n));

  function halfInteger(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isSafeInteger(2 * value)) throw new TypeError(name + ' must be an exact integer or half-integer number.');
    return value;
  }
  function spin(value, name) {
    halfInteger(value, name);
    if (value < 0 || value > LIMITS.maxSpin) throw new RangeError(name + ' must be between 0 and 6.');
    return value;
  }
  function factorial(n) {
    if (!Number.isInteger(n) || n < 0 || n >= factorials.length) throw new RangeError('Factorial argument is outside the bounded coupling domain.');
    return factorials[n];
  }
  function gcd(a, b) {
    if (a < 0n) a = -a;
    if (b < 0n) b = -b;
    while (b) { const r = a % b; a = b; b = r; }
    return a;
  }
  function fraction(numerator, denominator) {
    const divisor = gcd(numerator, denominator);
    return { numerator: numerator / divisor, denominator: denominator / divisor };
  }
  function squareRecord(value) { return { numerator: String(value.numerator), denominator: String(value.denominator) }; }

  function clebschGordan(j1, m1, j2, m2, J, M) {
    spin(j1, 'j1'); spin(j2, 'j2'); spin(J, 'J');
    halfInteger(m1, 'm1'); halfInteger(m2, 'm2'); halfInteger(M, 'M');
    const base = { domain: CG_DOMAIN, phaseConvention: 'Condon-Shortley', j1, m1, j2, m2, J, M };
    function forbidden(reason) { return { ...base, coefficient: 0, sign: 0, squared: { numerator: '0', denominator: '1' }, allowed: false, reason, kMin: null, kMax: null, terms: 0 }; }
    if (Math.abs(m1) > j1 || Math.abs(m2) > j2 || Math.abs(M) > J) return forbidden('A magnetic quantum number lies outside its spin multiplet.');
    if (![j1 - m1, j2 - m2, J - M].every(Number.isInteger)) return forbidden('Magnetic quantum numbers must step by integers within each multiplet.');
    if (M !== m1 + m2) return forbidden('The coupling requires M = m1 + m2.');
    if (J < Math.abs(j1 - j2) || J > j1 + j2 || !Number.isInteger(j1 + j2 + J)) return forbidden('The angular momenta do not satisfy the triangle and integer-sum rules.');
    const kMin = Math.max(0, j2 - J - m1, j1 - J + m2);
    const kMax = Math.min(j1 + j2 - J, j1 - m1, j2 + m2);
    if (kMin > kMax) return forbidden('No nonnegative factorial summation terms exist.');
    // Keep the alternating Racah sum rational and exact before the final sqrt.
    let sum = { numerator: 0n, denominator: 1n };
    for (let k = kMin; k <= kMax; k++) {
      const denominator = factorial(k) * factorial(j1 + j2 - J - k) * factorial(j1 - m1 - k) * factorial(j2 + m2 - k) * factorial(J - j2 + m1 + k) * factorial(J - j1 - m2 + k);
      const termSign = k % 2 ? -1n : 1n;
      sum = fraction(sum.numerator * denominator + termSign * sum.denominator, sum.denominator * denominator);
    }
    const prefactorNumerator = BigInt(2 * J + 1) * factorial(J + j1 - j2) * factorial(J - j1 + j2) * factorial(j1 + j2 - J) * factorial(J + M) * factorial(J - M) * factorial(j1 - m1) * factorial(j1 + m1) * factorial(j2 - m2) * factorial(j2 + m2);
    const prefactorDenominator = factorial(j1 + j2 + J + 1);
    const squared = fraction(prefactorNumerator * sum.numerator * sum.numerator, prefactorDenominator * sum.denominator * sum.denominator);
    const sign = sum.numerator < 0n ? -1 : sum.numerator > 0n ? 1 : 0;
    const coefficient = sign * Math.sqrt(Number(squared.numerator) / Number(squared.denominator));
    return { ...base, coefficient: coefficient === 0 ? 0 : coefficient, sign, squared: squareRecord(squared), allowed: true, reason: null, kMin, kMax, terms: kMax - kMin + 1 };
  }

  function prime(value) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 2 || value > LIMITS.maxPrime) throw new RangeError('p must be a prime integer from 2 through 97.');
    for (let divisor = 2; divisor * divisor <= value; divisor++) if (value % divisor === 0) throw new RangeError('p must be prime.');
    return value;
  }
  function exactInteger(value) {
    if (typeof value === 'number') {
      if (!Number.isSafeInteger(value)) throw new TypeError('x must be an exact safe integer number or a decimal integer string.');
      return BigInt(value);
    }
    if (typeof value === 'bigint') {
      if (String(value).replace('-', '').length > LIMITS.maxIntegerDigits) throw new RangeError('x exceeds the bounded 4096-digit integer input.');
      return value;
    }
    if (typeof value !== 'string' || !/^[+-]?\d+$/.test(value) || value.replace(/^[+-]/, '').length > LIMITS.maxIntegerDigits) throw new TypeError('x must be a bounded decimal integer string (at most 4096 digits).');
    return BigInt(value);
  }
  function mod(value, modulus) { const remainder = value % modulus; return remainder < 0n ? remainder + modulus : remainder; }
  function powerMod(value, exponent, modulus) {
    let result = 1n;
    value = mod(value, modulus);
    while (exponent > 0n) {
      if (exponent & 1n) result = result * value % modulus;
      value = value * value % modulus;
      exponent >>= 1n;
    }
    return result;
  }
  function arithmeticDelta(p, x) {
    prime(p);
    const input = exactInteger(x), characteristic = BigInt(p), modulus = characteristic * characteristic;
    const residue = mod(input, modulus), powered = powerMod(residue, characteristic, modulus);
    if ((residue - powered) % characteristic !== 0n) throw new Error('The arithmetic numerator failed exact divisibility by p.');
    const delta = mod((residue - powered) / characteristic, characteristic);
    const unit = residue % characteristic !== 0n;
    let fermatQuotient = null;
    if (unit) fermatQuotient = Number(mod((powerMod(residue, characteristic - 1n, modulus) - 1n) / characteristic, characteristic));
    return { domain: DELTA_DOMAIN, p, input: String(input), residueModP2: Number(residue), residueModP: Number(residue % characteristic), delta: Number(delta), unit, fermatQuotient, exact: true };
  }

  function finite(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(name + ' must be a finite number.');
    return value;
  }
  function plainArray(value, name) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(name + ' must be a plain array.');
    const descriptors = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(descriptors);
    if (keys.length !== value.length + 1) throw new TypeError(name + ' must be a dense array without extra properties.');
    for (let i = 0; i < value.length; i++) {
      const descriptor = descriptors[String(i)];
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) throw new TypeError(name + ' must contain data entries only.');
    }
    return value;
  }
  function complex(value, name) {
    let re, im;
    if (typeof value === 'number') { re = value; im = 0; }
    else if (Array.isArray(value) && value.length === 2) { plainArray(value, name); re = value[0]; im = value[1]; }
    else if (value && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
      const descriptors = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(descriptors);
      if (keys.length !== 2 || !keys.includes('re') || !keys.includes('im') || !('value' in descriptors.re) || !('value' in descriptors.im)) throw new TypeError(name + ' must be a number, [re, im], or a plain {re, im} value.');
      re = descriptors.re.value; im = descriptors.im.value;
    } else throw new TypeError(name + ' must be a number, [re, im], or a plain {re, im} value.');
    finite(re, name + ' real component'); finite(im, name + ' imaginary component');
    return { re, im };
  }
  function add(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function subtract(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
  function multiply(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function magnitude(value) { return Math.hypot(value.re, value.im); }
  function divide(a, b) {
    // Scaled division avoids an unnecessary square of a large pivot.
    if (Math.abs(b.re) >= Math.abs(b.im)) {
      const ratio = b.im / b.re, denominator = b.re + b.im * ratio;
      return { re: (a.re + a.im * ratio) / denominator, im: (a.im - a.re * ratio) / denominator };
    }
    const ratio = b.re / b.im, denominator = b.im + b.re * ratio;
    return { re: (a.re * ratio + a.im) / denominator, im: (a.im * ratio - a.re) / denominator };
  }
  function vectorNorm(vector) { return Math.hypot(...vector.flatMap(value => [value.re, value.im])); }
  function matrixVector(matrix, vector) { return matrix.map(row => row.reduce((sum, value, i) => add(sum, multiply(value, vector[i])), { re: 0, im: 0 })); }
  function solve(matrix, right) {
    const a = matrix.map(row => row.map(value => ({ ...value }))), b = right.map(value => ({ ...value })), dimension = b.length;
    for (let column = 0; column < dimension; column++) {
      let pivot = column;
      for (let row = column + 1; row < dimension; row++) if (magnitude(a[row][column]) > magnitude(a[pivot][column])) pivot = row;
      if (magnitude(a[pivot][column]) < 1e-14) throw new Error('The Cayley solve encountered a numerically singular pivot.');
      [a[pivot], a[column]] = [a[column], a[pivot]];
      [b[pivot], b[column]] = [b[column], b[pivot]];
      for (let row = column + 1; row < dimension; row++) {
        const factor = divide(a[row][column], a[column][column]);
        for (let entry = column + 1; entry < dimension; entry++) a[row][entry] = subtract(a[row][entry], multiply(factor, a[column][entry]));
        b[row] = subtract(b[row], multiply(factor, b[column]));
        a[row][column] = { re: 0, im: 0 };
      }
    }
    const result = Array(dimension);
    for (let row = dimension - 1; row >= 0; row--) {
      let residual = b[row];
      for (let column = row + 1; column < dimension; column++) residual = subtract(residual, multiply(a[row][column], result[column]));
      result[row] = divide(residual, a[row][row]);
      finite(result[row].re, 'Solved state'); finite(result[row].im, 'Solved state');
    }
    return result;
  }

  function cayleyStep(H, state, dt, hbar = 1) {
    finite(dt, 'dt'); finite(hbar, 'hbar');
    if (Math.abs(dt) > LIMITS.maxDt) throw new RangeError('|dt| must not exceed 100.');
    if (hbar <= 0) throw new RangeError('hbar must be positive.');
    if (!Array.isArray(H) || H.length < 1 || H.length > LIMITS.maxDimension) throw new RangeError('H must be a square Hermitian matrix of dimension 1 through 8.');
    plainArray(H, 'H');
    if (H.some(row => !Array.isArray(row) || row.length !== H.length)) throw new RangeError('H must be a square Hermitian matrix of dimension 1 through 8.');
    H.forEach((row, i) => plainArray(row, 'H row ' + i));
    if (!Array.isArray(state) || state.length !== H.length) throw new RangeError('The state dimension must equal the Hamiltonian dimension.');
    plainArray(state, 'state');
    const matrix = H.map((row, i) => row.map((value, j) => complex(value, 'H[' + i + '][' + j + ']')));
    const initial = state.map((value, i) => complex(value, 'state[' + i + ']'));
    const maxEntry = Math.max(...matrix.flat().map(magnitude));
    if (maxEntry > LIMITS.maxHamiltonianEntry) throw new RangeError('Hamiltonian entry magnitude must not exceed 1e6.');
    for (let i = 0; i < matrix.length; i++) for (let j = 0; j < matrix.length; j++) {
      if (matrix[i][j].re !== matrix[j][i].re || matrix[i][j].im !== -matrix[j][i].im) throw new TypeError('Hamiltonian must be Hermitian: H[i][j] = conjugate(H[j][i]), with real diagonal entries.');
    }
    const normBefore = vectorNorm(initial);
    if (!Number.isFinite(normBefore) || normBefore > LIMITS.maxStateNorm) throw new RangeError('The state Euclidean norm must not exceed 1e6.');
    // Scale each entry directly so a zero or tiny H remains well-defined even
    // when the standalone factor dt/(2 hbar) would overflow.
    const scaled = matrix.map(row => row.map(value => ({ re: ((dt / 2) * value.re) / hbar, im: ((dt / 2) * value.im) / hbar })));
    if (scaled.flat().some(value => !Number.isFinite(value.re) || !Number.isFinite(value.im) || magnitude(value) > LIMITS.maxScaledHamiltonianEntry)) throw new RangeError('The scaled Hamiltonian entry |dt H/(2 hbar)| must not exceed 1e8.');
    // Conventional i hbar dpsi/dt = H psi has a negative first-order phase.
    const left = scaled.map((row, i) => row.map((value, j) => ({ re: (i === j ? 1 : 0) - value.im, im: value.re })));
    const rightMatrix = scaled.map((row, i) => row.map((value, j) => ({ re: (i === j ? 1 : 0) + value.im, im: -value.re })));
    const right = matrixVector(rightMatrix, initial), evolved = solve(left, right), normAfter = vectorNorm(evolved);
    const errors = matrixVector(left, evolved).map((value, i) => subtract(value, right[i]));
    const residual = vectorNorm(errors), matrixNorm = Math.hypot(...left.flat().flatMap(value => [value.re, value.im]));
    const residualScale = matrixNorm * normAfter + vectorNorm(right);
    const relativeResidual = residualScale === 0 ? 0 : residual / residualScale;
    const normError = Math.abs(normAfter - normBefore), relativeNormError = normBefore === 0 ? normError : normError / normBefore;
    return { domain: CAYLEY_DOMAIN, convention: 'i hbar dpsi/dt = H psi; U = (I + i dt H/(2 hbar))^-1 (I - i dt H/(2 hbar))', dimension: H.length, dt, hbar, state: evolved, normBefore, normAfter, normError, relativeNormError, residual, relativeResidual, tolerance: LIMITS.tolerance, toleranceMet: relativeResidual <= LIMITS.tolerance && relativeNormError <= LIMITS.tolerance, renormalized: false };
  }

  return Object.freeze({ version: '0.2.0', limits: LIMITS, clebschGordan, arithmeticDelta, cayleyStep });
});
