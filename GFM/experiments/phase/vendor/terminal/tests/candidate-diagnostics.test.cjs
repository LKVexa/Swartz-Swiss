'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

/*
 * Independent diagnostics for the user-supplied report:
 * C:\Users\russe\Downloads\Please audit, parse, and refine these equations.txt
 * SHA-256: 068f68965b6157c88e9e881a48a6bfacfc040455cb957af17f613785ad0237f8
 * See docs/relativity-audit.txt for definitions, derivations and primary sources.
 *
 * These are counterexamples and domain checks, not implementations of a Klein
 * solver, modular partial-wave theory, or the unavailable 500-equation suite.
 * No application code is imported: all computations below use independent,
 * small arithmetic and matrix routines. Eq. 370 uses a declared conditional
 * oscillator convention, because its underlying X, P and H definitions are
 * absent from the supplied report.
 */

function close(actual, expected, tolerance = 1e-12) {
  assert.ok(Number.isFinite(actual), 'diagnostic must produce a finite number');
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `expected ${expected}, received ${actual}`);
}

// The report's principal-arccos dispersion, expressed without app helpers.
function latticeArgument(epsilon, restEnergy, a, hbar, c) {
  return 1 - (a * a / (2 * hbar * hbar * c * c)) *
    (epsilon * epsilon - restEnergy * restEnergy);
}

function multiplyRealMatrices(left, right) {
  return left.map(row => right[0].map((_, column) =>
    row.reduce((sum, value, inner) => sum + value * right[inner][column], 0)));
}

function subtractRealMatrices(left, right) {
  return left.map((row, r) => row.map((value, c) => value - right[r][c]));
}

function traceRealMatrix(matrix) {
  return matrix.reduce((sum, row, index) => sum + row[index], 0);
}

// GF(9) = GF(3)[i]/(i^2 + 1). Store a+b*i as the pair [a,b].
const mod3 = value => ((value % 3) + 3) % 3;
const gf = (a, b = 0) => [mod3(a), mod3(b)];
const gfAdd = (x, y) => gf(x[0] + y[0], x[1] + y[1]);
const gfNegate = x => gf(-x[0], -x[1]);
const gfSubtract = (x, y) => gfAdd(x, gfNegate(y));
const gfMultiply = (x, y) => gf(
  x[0] * y[0] - x[1] * y[1],
  x[0] * y[1] + x[1] * y[0],
);
// Frobenius conjugation: i^3=-i, so overline(a+b*i)=a-b*i.
const gfConjugate = x => gf(x[0], -x[1]);

function multiplyFieldMatrices(left, right) {
  return left.map(row => right[0].map((_, column) =>
    row.reduce((sum, value, inner) =>
      gfAdd(sum, gfMultiply(value, right[inner][column])), gf(0))));
}

function fieldAdjoint(matrix) {
  return matrix[0].map((_, column) =>
    matrix.map(row => gfConjugate(row[column])));
}

function fieldDeterminant2(matrix) {
  return gfSubtract(
    gfMultiply(matrix[0][0], matrix[1][1]),
    gfMultiply(matrix[0][1], matrix[1][0]),
  );
}

test('Eq. 437 principal branches produce T=-3 inside the real lattice band', () => {
  // hbar=c=m=a=1; E=2 and V0=4 satisfy the report's claimed Klein regime.
  const E = 2, V0 = 4, m = 1, c = 1, a = 1, hbar = 1;
  const restEnergy = m * c * c;
  assert.ok(V0 > E + restEnergy);
  const incidentArgument = latticeArgument(E, restEnergy, a, hbar, c);
  const transmittedArgument = latticeArgument(E - V0, restEnergy, a, hbar, c);
  assert.equal(incidentArgument, -0.5);
  assert.equal(transmittedArgument, -0.5);
  const k1 = Math.acos(incidentArgument) / a;
  const k2 = Math.acos(transmittedArgument) / a;
  close(k1, 2 * Math.PI / 3);
  close(k2, k1);
  const r1 = k1 / (E + restEnergy);
  const r2 = k2 / (E - V0 + restEnergy);
  assert.ok(r1 > 0 && r2 < 0);
  const sourceTransmission = 4 * r1 * r2 / ((r1 + r2) ** 2);
  close(sourceTransmission, -3);
  assert.ok(sourceTransmission < 0, 'the source value cannot be a probability');
});

test('Eq. 437 lattice arccos enforces a finite real-energy band', () => {
  // |1-a^2*(epsilon^2-M^2)/(2*hbar^2*c^2)|<=1 is equivalent to
  // 0<=epsilon^2-M^2<=4*hbar^2*c^2/a^2. Both band edges are included.
  const M = 1, a = 1, hbar = 1, c = 1;
  const upperKineticBound = 4 * hbar * hbar * c * c / (a * a);
  assert.equal(upperKineticBound, 4);
  for (const epsilon of [-3, -2, -1, 0, 1, 2, 3]) {
    const kinetic = epsilon * epsilon - M * M;
    const argument = latticeArgument(epsilon, M, a, hbar, c);
    const energyInBand = kinetic >= 0 && kinetic <= upperKineticBound;
    const arccosIsReal = argument >= -1 && argument <= 1;
    assert.equal(arccosIsReal, energyInBand, `epsilon=${epsilon}`);
  }
  close(latticeArgument(M, M, a, hbar, c), 1);
  close(latticeArgument(Math.sqrt(5), M, a, hbar, c), -1);
  // Keeping E=2 fixed, V0=5 is already outside the real band, so no
  // fixed-lattice-spacing V0->infinity propagating limit follows.
  assert.equal(latticeArgument(2 - 5, M, a, hbar, c), -3);
  assert.ok(Number.isNaN(Math.acos(-3)));
});

test('Eq. 370 j versus j+1/2 mismatch under a declared oscillator offset', () => {
  // Conditional model only: dimensionless Jz, j=1, hbar=omega=1,
  // Hosc=(j+1/2)*I-Jz. This does not invent the missing suite definitions.
  const j = 1, hbar = 1, omega = 1;
  const Jz = [1, 0, -1];
  const energies = Jz.map(value => hbar * omega * (j + 0.5 - value));
  const leftCoefficients = Jz.map(value => hbar * value / j);
  const sourceRightCoefficients = energies.map(energy =>
    hbar * (1 - energy / ((j + 0.5) * hbar * omega)));
  assert.deepEqual(leftCoefficients, [1, 0, -1]);
  close(sourceRightCoefficients[0], 2 / 3);
  close(sourceRightCoefficients[1], 0);
  close(sourceRightCoefficients[2], -2 / 3);
  assert.notDeepEqual(leftCoefficients, sourceRightCoefficients);
  // Conditional algebraic repair retaining the original /j normalization.
  const repaired = energies.map(energy => hbar *
    (1 + 1 / (2 * j) - energy / (j * hbar * omega)));
  repaired.forEach((value, index) => close(value, leftCoefficients[index]));
});

test('finite complex matrices cannot obey the global canonical CCR', () => {
  // Exact integer matrix products exhibit cyclic trace. A complex CCR target
  // i*hbar*I has imaginary trace hbar*d; trace of a commutator is zero.
  // The general obstruction follows from Tr(XP)=Tr(PX), not from a claim that
  // these example matrices implement a physical oscillator.
  const X = [[2, 1, 0], [3, -1, 2], [4, 0, 5]];
  const P = [[0, 4, 1], [1, 2, 3], [2, -1, 0]];
  const XP = multiplyRealMatrices(X, P);
  const PX = multiplyRealMatrices(P, X);
  assert.equal(traceRealMatrix(XP), traceRealMatrix(PX));
  const commutator = subtractRealMatrices(XP, PX);
  assert.equal(traceRealMatrix(commutator), 0);
  assert.ok(commutator.some(row => row.some(value => value !== 0)));
  const hbar = 2;
  const actualComplexTrace = [traceRealMatrix(commutator), 0];
  const claimedCCRTrace = [0, hbar * X.length];
  assert.notDeepEqual(actualComplexTrace, claimedCCRTrace);
  assert.deepEqual(claimedCCRTrace, [0, 6]);
});

test('a Hermitian GF(9) Hamiltonian can have a singular Cayley denominator', () => {
  const zero = gf(0), one = gf(1), i = gf(0, 1);
  const H = [[zero, gf(1, 1)], [gf(1, -1), zero]];
  assert.deepEqual(gfMultiply(i, i), gf(-1));
  assert.deepEqual(fieldAdjoint(H), H, 'H is Hermitian for Frobenius conjugation');
  assert.deepEqual(multiplyFieldMatrices(H, H),
    [[gf(-1), gf(0)], [gf(0), gf(-1)]]);
  const denominator = H.map((row, r) => row.map((value, c) =>
    gfAdd(gfMultiply(i, value), r === c ? one : zero)));
  assert.deepEqual(fieldDeterminant2(denominator), gf(0));
  // Exhibit a nonzero kernel vector, so singularity is constructive.
  const kernelVector = [[gf(1, -1)], [one]];
  assert.deepEqual(multiplyFieldMatrices(denominator, kernelVector),
    [[gf(0)], [gf(0)]]);
  assert.notDeepEqual(kernelVector, [[gf(0)], [gf(0)]]);
  const oppositeSign = H.map((row, r) => row.map((value, c) =>
    gfSubtract(r === c ? one : zero, gfMultiply(i, value))));
  assert.deepEqual(fieldDeterminant2(oppositeSign), gf(0));
  // Hermitian form need not be positive: this nonzero vector has zero form.
  const v = [[one], [gf(1, 1)]];
  assert.deepEqual(multiplyFieldMatrices(fieldAdjoint(v), v), [[gf(0)]]);
});
