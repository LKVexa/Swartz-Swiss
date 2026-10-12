'use strict';

// Audited reference calculations only. This module never evolves the EM model,
// changes its geometry, or infers global passage from a local algebraic test.
const registry = require('../data/audit-findings.json');

const CONSTANTS = Object.freeze({ G: 6.67430e-11, c: 299792458, epsilon0: 8.8541878188e-12 });
const { G, c, epsilon0 } = CONSTANTS;
const C2 = c * c, C4 = C2 * C2;
const METADATA = Object.freeze({
  schema: 'gfm.gr-reference.v1',
  role: 'audited-reference-calculators',
  signature: '-+++',
  units: 'SI; length coordinates in double-null calculations; shell proper time in seconds',
  physicalEvolutionCoupling: false,
  provesSpacetimePassage: false,
  provesMetricTensorIdentity: false,
  constants: CONSTANTS,
  constantSources: [
    'https://physics.nist.gov/cuu/pdf/wall_2022.pdf',
  ],
  constantsConvention: 'CODATA 2022 central values; c exact. Numerical references do not propagate the measured uncertainty of G.',
  definitions: {
    blackHole: 'Relative to the chosen asymptotically flat exterior, B=M\\J^-(I+); its boundary is a global event horizon. A local marginal sphere is insufficient.',
    traversableWormhole: 'A specified bridge geometry with future causal paths through its throat reaching the intended exterior(s). Connected regions, directions and traveler conditions must be supplied.',
    localAperture: 'A geometric material opening in the local EM study volume; this is not a spacetime traversal result.',
  },
});

function object(input, allowedKeys) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('parameters must be an object');
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(input)) if (!allowed.has(key)) throw new RangeError(`unknown parameter ${key}`);
  return input;
}
function number(input, key, fallback) {
  const value = input[key] === undefined ? fallback : input[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${key} must be a finite number`);
  return value;
}
function positive(input, key) {
  const value = number(input, key);
  if (!(value > 0)) throw new RangeError(`${key} must be positive`);
  return value;
}
function nonnegative(input, key, fallback) {
  const value = number(input, key, fallback);
  if (value < 0) throw new RangeError(`${key} must be nonnegative`);
  return value;
}
function requireBoolean(input, key, fallback = false) {
  const value = input[key] === undefined ? fallback : input[key];
  if (typeof value !== 'boolean') throw new TypeError(`${key} must be boolean`);
  return value;
}
function finish(result) {
  // Avoid JSON's silent conversion of overflow/NaN into null values.
  const check = value => {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError('parameters exceed the numerical range of this reference calculator');
    if (value && typeof value === 'object') for (const item of Object.values(value)) check(item);
  };
  check(result);
  return { ...result, referenceOnly: true, provesSpacetimePassage: false, provesMetricTensorIdentity: false };
}

function morrisThorne(parameters) {
  const p = object(parameters, ['radiusM', 'shapeM', 'shapeDerivative', 'redshiftDerivativePerM', 'redshift', 'regularRedshiftAtThroat', 'throatRelativeTolerance']);
  const r = positive(p, 'radiusM'), b = number(p, 'shapeM');
  const bp = number(p, 'shapeDerivative'), phip = number(p, 'redshiftDerivativePerM', 0);
  const phi = number(p, 'redshift', 0);
  const tolerance = nonnegative(p, 'throatRelativeTolerance', 1e-12);
  if (tolerance > 1e-3) throw new RangeError('throatRelativeTolerance must not exceed 0.001');
  const regular = requireBoolean(p, 'regularRedshiftAtThroat');
  const lapseSquared = Math.exp(2 * phi);
  if (!(lapseSquared > 0) || !Number.isFinite(lapseSquared)) throw new RangeError('redshift exceeds the finite nonzero lapse range');
  const metricFactor = 1 - b / r;
  if (metricFactor < 0) throw new RangeError('the static exterior reference requires 1-shapeM/radiusM >= 0');
  const matched = Math.abs(b - r) <= tolerance * r;
  const factor = C4 / (8 * Math.PI * G);
  const energyDensityJPerM3 = factor * bp / r ** 2;
  const radialPressurePa = factor * (-b / r ** 3 + 2 * metricFactor * phip / r);
  const radialNecJPerM3 = factor * ((bp - b / r) / r ** 2 + 2 * metricFactor * phip / r);
  return finish({
    calculator: 'morrisThorne', auditIds: ['A01', 'A02', 'A03', 'A04'],
    parameters: { radiusM: r, shapeM: b, shapeDerivative: bp, redshiftDerivativePerM: phip, redshift: phi, regularRedshiftAtThroat: regular, throatRelativeTolerance: tolerance },
    energyDensityJPerM3, radialPressurePa, radialNecJPerM3,
    violatesRadialNec: radialNecJPerM3 < 0,
    metricFactor, lapseSquared,
    throat: {
      shapeMatchWithinTolerance: matched,
      shapeResidualM: b - r,
      strictShapeFlareOut: matched && bp < 1,
      regularRedshiftForLimitDeclared: regular,
      strictRegularThroatConditionsMet: matched && bp < 1 && regular,
      radialNecLimitJPerM3: matched && regular ? factor * (bp - 1) / r ** 2 : null,
      coordinateChartDegenerates: metricFactor === 0,
      globalConnectionAndTraversalChecked: false,
    },
    embedding: {
      realLocalEmbedding: b > 0 && metricFactor >= 0,
      secondDerivativePerM: b > 0 && metricFactor >= 0 ? (b - r * bp) / (2 * b ** 2) : null,
    },
    assumptions: ['Static spherical Morris-Thorne ansatz.', 'rho is energy density; p_r is pressure.', 'A throat limit requires a regular redshift in proper distance.', 'Finite lapse and local flare-out do not prove global connectivity, stability or traveler suitability.'],
    references: ['https://doi.org/10.1119/1.15620'],
  });
}

function misnerSharpDoubleNull(parameters) {
  const p = object(parameters, ['radiusM', 'metricExponent', 'radiusDerivativeU', 'radiusDerivativeV', 'marginalTolerance']);
  const R = positive(p, 'radiusM'), f = number(p, 'metricExponent', 0);
  const Ru = number(p, 'radiusDerivativeU'), Rv = number(p, 'radiusDerivativeV');
  const tolerance = nonnegative(p, 'marginalTolerance', 1e-12);
  if (tolerance > 1e-3) throw new RangeError('marginalTolerance must not exceed 0.001');
  const inverseScale = Math.exp(-2 * f), normalScale = Math.exp(-f);
  if (!(inverseScale > 0) || !Number.isFinite(inverseScale)) throw new RangeError('metricExponent exceeds the nonsingular representable metric range');
  const gradientNormSquared = -2 * inverseScale * Ru * Rv;
  const massKg = C2 * R * (1 - gradientNormSquared) / (2 * G);
  const thetaUPerM = 2 * normalScale * Ru / R, thetaVPerM = 2 * normalScale * Rv / R;
  return finish({
    calculator: 'misnerSharpDoubleNull', auditIds: ['A05', 'A06', 'A09'],
    parameters: { radiusM: R, metricExponent: f, radiusDerivativeU: Ru, radiusDerivativeV: Rv, marginalTolerance: tolerance },
    metric: 'ds^2=-2 exp(2f) du dv + R^2 dOmega^2; u,v measured in meters',
    nullNormalization: 'l_u=exp(-f) partial_u, l_v=exp(-f) partial_v; l_u dot l_v=-1',
    gradientNormSquared, massKg, geometricMassLengthM: G * massKg / C2,
    compactness: 1 - gradientNormSquared,
    thetaUPerM, thetaVPerM,
    marginalWithinTolerance: Math.abs(gradientNormSquared) <= tolerance,
    expansionsProductPerM2: thetaUPerM * thetaVPerM,
    eventHorizonEstablished: false,
    interpretation: 'A marginal sphere may be a static wormhole throat or a trapping surface; outgoing/future directions, outer sign, causal character and global geometry require separate data.',
    references: ['https://arxiv.org/abs/gr-qc/9408002'],
  });
}

function classifyFutureOuter(parameters) {
  const p = object(parameters, ['thetaPlusPerM', 'thetaMinusPerM', 'crossDerivativePerM2', 'futureNullNormals', 'expansionTolerancePerM', 'causalCharacter']);
  const tp = number(p, 'thetaPlusPerM'), tm = number(p, 'thetaMinusPerM');
  const cross = number(p, 'crossDerivativePerM2');
  const futureNormals = requireBoolean(p, 'futureNullNormals');
  if (!futureNormals) throw new RangeError('futureNullNormals must be true; declare future-oriented null normals before classification');
  const tolerance = nonnegative(p, 'expansionTolerancePerM', 0);
  const causal = p.causalCharacter === undefined ? 'unknown' : p.causalCharacter;
  if (!['unknown', 'timelike', 'null', 'spacelike'].includes(causal)) throw new RangeError('causalCharacter must be unknown, timelike, null or spacelike');
  const marginal = Math.abs(tp) <= tolerance, future = tm < 0, outer = cross < 0;
  const isFutureOuter = marginal && future && outer;
  let classification = 'non-marginal';
  if (marginal) classification = `${tm < 0 ? 'future' : tm > 0 ? 'past' : 'doubly-marginal'}-${cross < 0 ? 'outer' : cross > 0 ? 'inner' : 'degenerate'}-local-surface`;
  return finish({
    calculator: 'classifyFutureOuter', auditIds: ['A07', 'A09'],
    parameters: { thetaPlusPerM: tp, thetaMinusPerM: tm, crossDerivativePerM2: cross, futureNullNormals: futureNormals, expansionTolerancePerM: tolerance, causalCharacter: causal },
    marginalWithinTolerance: marginal, futureSign: future, outerSign: outer,
    futureOuterConditionsMet: isFutureOuter, classification, causalCharacter: causal,
    timelikeOuterCandidate: marginal && outer && causal === 'timelike',
    eventHorizonEstablished: false,
    interpretation: 'Outer means L_minus(theta_plus)<0. Timelike outer horizons can occur with NEC violation; local signs do not prove a globally traversable bridge or global black hole.',
    references: ['https://arxiv.org/abs/gr-qc/9303006', 'https://arxiv.org/abs/gr-qc/9805019'],
  });
}

function potential(radiusM, fPlus, fMinus, sigma) {
  const s = -4 * Math.PI * G * sigma * radiusM / C4;
  if (!(s > 0) || !Number.isFinite(s)) throw new RangeError('the two-exterior wormhole branch requires finite negative surface energy density');
  const difference = fPlus - fMinus;
  const V = (fPlus + fMinus) / 2 - (difference / (2 * s)) ** 2 - (s / 2) ** 2;
  return { V, sumOfRoots: s, candidateRootPlus: (s + difference / s) / 2, candidateRootMinus: (s - difference / s) / 2 };
}

function thinShell(parameters) {
  const p = object(parameters, ['radiusM', 'radialVelocityMPerS', 'radialAccelerationMPerS2', 'fPlus', 'fMinus', 'fPrimePlusPerM', 'fPrimeMinusPerM']);
  const a = positive(p, 'radiusM'), v = number(p, 'radialVelocityMPerS', 0), acceleration = number(p, 'radialAccelerationMPerS2', 0);
  const fp = positive(p, 'fPlus'), fm = positive(p, 'fMinus');
  const fpp = number(p, 'fPrimePlusPerM', 0), fmp = number(p, 'fPrimeMinusPerM', 0);
  const v2 = (v / c) ** 2, ag = acceleration / C2;
  const bp = Math.sqrt(v2 + fp), bm = Math.sqrt(v2 + fm);
  const kttP = (ag + fpp / 2) / bp, kttM = -(ag + fmp / 2) / bm;
  const kthP = bp / a, kthM = -bm / a;
  const sigma = -C4 * (bp + bm) / (4 * Math.PI * G * a);
  const pressure = C4 * (kttP - kttM) / (8 * Math.PI * G) - sigma / 2;
  const pot = potential(a, fp, fm, sigma);
  const densityFromJump = -C4 * (kthP - kthM) / (4 * Math.PI * G);
  return finish({
    calculator: 'thinShell', auditIds: ['A10', 'A11', 'A12', 'A13', 'A14'],
    parameters: { radiusM: a, radialVelocityMPerS: v, radialAccelerationMPerS2: acceleration, fPlus: fp, fMinus: fm, fPrimePlusPerM: fpp, fPrimeMinusPerM: fmp },
    betaPlus: bp, betaMinus: bm,
    extrinsicCurvaturePerM: { plus: { tauTau: kttP, thetaTheta: kthP }, minus: { tauTau: kttM, thetaTheta: kthM } },
    surfaceEnergyDensityJPerM2: sigma, surfacePressureNPerM: pressure,
    potentialDimensionless: pot.V,
    constraintResidualDimensionless: v2 + pot.V,
    densityJumpResidualJPerM2: sigma - densityFromJump,
    noFluxSurfaceEnergyRateJPerM2PerS: -2 * v * (sigma + pressure) / a,
    assumptions: ['Two static spherical exterior metrics with g_tt=-f and g_rr=1/f.', 'fPlus and fMinus strictly positive: this calculator does not continue the static charts across a horizon.', 'Common normal points from minus to plus; radial signs are opposite across the throat.', 'Shell radius, Kerr spin length, conductivity and surface energy density are distinct quantities.', 'Potential is algebraic at a point; stability requires an EOS, conservation/flux closure, V=V_prime=0 and V_second>0.'],
    references: ['https://arxiv.org/abs/gr-qc/9506083', 'https://arxiv.org/abs/1801.05516'],
  });
}

function thinShellPotential(parameters) {
  const p = object(parameters, ['radiusM', 'fPlus', 'fMinus', 'surfaceEnergyDensityJPerM2']);
  const a = positive(p, 'radiusM'), fp = positive(p, 'fPlus'), fm = positive(p, 'fMinus');
  const sigma = number(p, 'surfaceEnergyDensityJPerM2');
  const result = potential(a, fp, fm, sigma);
  const rootSigns = result.candidateRootPlus > 0 && result.candidateRootMinus > 0;
  const allowedMotion = -result.V >= 0;
  return finish({
    calculator: 'thinShellPotential', auditIds: ['A13', 'A14'],
    parameters: { radiusM: a, fPlus: fp, fMinus: fm, surfaceEnergyDensityJPerM2: sigma },
    potentialDimensionless: result.V,
    squaredEquationMotionAllowed: allowedMotion,
    originalPositiveRootBranchAdmissible: rootSigns && allowedMotion,
    formalVelocitySquaredOverC2: -result.V,
    candidatePositiveRoots: { plus: result.candidateRootPlus, minus: result.candidateRootMinus },
    interpretation: 'Use only the original negative-density, positive-root junction branch. A squared potential alone can admit spurious branches and does not establish shell stability or passage.',
    references: ['https://arxiv.org/abs/1801.05516'],
  });
}

function kerrReference(parameters) {
  const p = object(parameters, ['massKg', 'dimensionlessSpin', 'angularMomentumKgM2PerS']), mass = positive(p, 'massKg');
  const fromJ = p.angularMomentumKgM2PerS === undefined ? null : c * number(p, 'angularMomentumKgM2PerS') / (G * mass * mass);
  const chi = number(p, 'dimensionlessSpin', fromJ === null ? 0 : fromJ);
  if (fromJ !== null && Math.abs(chi - fromJ) > 1e-12 * Math.max(1, Math.abs(chi), Math.abs(fromJ))) throw new RangeError('dimensionlessSpin and angularMomentumKgM2PerS disagree');
  if (Math.abs(chi) > 1) throw new RangeError('uncharged Kerr black-hole reference requires |dimensionlessSpin| <= 1');
  const rg = G * mass / C2, spinLength = chi * rg;
  const factor = Math.sqrt(Math.max(0, (1 - chi) * (1 + chi)));
  const outer = rg * (1 + factor), inner = rg * (1 - factor);
  return finish({
    calculator: 'kerrReference', auditIds: ['A09', 'A11', 'A20', 'A33'],
    parameters: { massKg: mass, dimensionlessSpin: chi },
    gravitationalRadiusM: rg, kerrSpinLengthM: spinLength,
    angularMomentumKgM2PerS: chi * G * mass * mass / c,
    kerrOuterHorizonRadiusM: outer, kerrInnerHorizonRadiusM: inner,
    horizonAngularVelocityRadPerS: c * spinLength / (outer * outer + spinLength * spinLength),
    assumptions: ['Specified stationary, uncharged Kerr solution.', 'Its horizon radius is a reference property of that specified solution, not a classification of the local EM cylinder.', 'Kerr chi, shell a(tau), material angular velocity and magnetic winding are different variables.', 'No aperture-radius law, solid/gas classification, timelessness or passage is inferred.'],
    references: ['https://www.damtp.cam.ac.uk/user/tong/gr/grhtml/S6.html'],
  });
}

function getAuditFindings() { return JSON.parse(JSON.stringify(registry)); }

function referenceExample() {
  const exampleInputs = {
    morrisThorne: { radiusM: 0.04, shapeM: 0.04, shapeDerivative: -1, redshiftDerivativePerM: 0, regularRedshiftAtThroat: true },
    misnerSharpDoubleNull: { radiusM: 0.04, metricExponent: 0, radiusDerivativeU: 0, radiusDerivativeV: 0 },
    classifyFutureOuter: { thetaPlusPerM: 0, thetaMinusPerM: -50, crossDerivativePerM2: -1250, futureNullNormals: true, causalCharacter: 'unknown' },
    thinShell: { radiusM: 0.04, radialVelocityMPerS: 0, radialAccelerationMPerS2: 0, fPlus: 0.8, fMinus: 0.6, fPrimePlusPerM: 5, fPrimeMinusPerM: 10 },
    kerrReference: { massKg: 1e30, dimensionlessSpin: 0.8 },
  };
  const calculators = { morrisThorne, misnerSharpDoubleNull, classifyFutureOuter, thinShell, kerrReference };
  const examples = Object.entries(exampleInputs).map(([calculator, parameters]) => ({ calculator, parameters, result: calculators[calculator](parameters) }));
  return {
    schema: METADATA.schema, metadata: METADATA, provenance: registry.source,
    examples, findingsSummary: registry.summary,
    interpretation: 'Examples are independent algebraic references, not mutually matched solutions or equations driving the EM/plasma simulation.',
  };
}

module.exports = { CONSTANTS, METADATA, morrisThorne, misnerSharpDoubleNull, classifyFutureOuter, thinShell, thinShellPotential, kerrReference, referenceExample, getAuditFindings };
