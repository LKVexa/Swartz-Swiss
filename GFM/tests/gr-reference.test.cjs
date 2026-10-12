'use strict';

// Analytic and independent numerical checks of the audited GR references.
// These checks do not validate a spacetime solver or a physical wormhole.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const gr = require('../backend/gr-reference.cjs');
const { G, c } = gr.CONSTANTS;
const C2 = c * c, C4 = C2 * C2;
const F = C4 / (8 * Math.PI * G);
function close(actual, expected, relative = 1e-12, absolute = 0) {
  assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.max(Math.abs(actual), Math.abs(expected)), `${actual} != ${expected}`);
}

test('Ellis throat has the independently known negative radial NEC and real flare-out', () => {
  const a = 0.04;
  const result = gr.morrisThorne({ radiusM: a, shapeM: a, shapeDerivative: -1, regularRedshiftAtThroat: true });
  close(result.energyDensityJPerM3, -F / a ** 2);
  close(result.radialPressurePa, -F / a ** 2);
  close(result.radialNecJPerM3, -2 * F / a ** 2);
  close(result.throat.radialNecLimitJPerM3, -2 * F / a ** 2);
  close(result.embedding.secondDerivativePerM, 1 / a);
  assert.equal(result.throat.strictRegularThroatConditionsMet, true);
  assert.equal(result.throat.coordinateChartDegenerates, true);
  assert.equal(result.throat.globalConnectionAndTraversalChecked, false);
});

test('general redshift NEC equals independently calculated rho plus pressure and rejects the source sign/factors', () => {
  const r = 2, b = 0.5, bp = 0.2, phip = 0.3;
  const result = gr.morrisThorne({ radiusM: r, shapeM: b, shapeDerivative: bp, redshiftDerivativePerM: phip });
  close(result.radialNecJPerM3 / F, 0.2125);
  close(result.radialNecJPerM3, result.energyDensityJPerM3 + result.radialPressurePa);
  const printedWrong = F / r * ((1 - b / r) * phip + (b - r * bp) / (2 * r ** 2));
  assert.ok(Math.abs(result.radialNecJPerM3 - printedWrong) > 0.3 * Math.abs(result.radialNecJPerM3));
});

test('strict flare-out excludes b_prime=1 and regular throat limiting assumptions are explicit', () => {
  const input = { radiusM: 2, shapeM: 2, shapeDerivative: 1, regularRedshiftAtThroat: true };
  const degenerate = gr.morrisThorne(input);
  assert.equal(degenerate.throat.strictShapeFlareOut, false);
  assert.equal(degenerate.throat.strictRegularThroatConditionsMet, false);
  assert.equal(degenerate.throat.radialNecLimitJPerM3, 0);
  const notDeclared = gr.morrisThorne({ ...input, shapeDerivative: -1, regularRedshiftAtThroat: false });
  assert.equal(notDeclared.throat.radialNecLimitJPerM3, null);
  assert.equal(notDeclared.throat.strictRegularThroatConditionsMet, false);
});

test('Morris-Thorne energy densities scale as inverse length squared with dimensionally scaled Phi_prime', () => {
  const first = gr.morrisThorne({ radiusM: 2, shapeM: 0.5, shapeDerivative: 0.2, redshiftDerivativePerM: 0.3 });
  const second = gr.morrisThorne({ radiusM: 20, shapeM: 5, shapeDerivative: 0.2, redshiftDerivativePerM: 0.03 });
  close(second.energyDensityJPerM3, first.energyDensityJPerM3 / 100);
  close(second.radialPressurePa, first.radialPressurePa / 100);
  close(second.radialNecJPerM3, first.radialNecJPerM3 / 100);
});

test('flat double-null metric gives zero Misner-Sharp mass and normalized expansion product', () => {
  // u=ct-r, v=(ct+r)/2 gives ds^2=-2 du dv and R=v-u/2.
  const r = 3;
  const result = gr.misnerSharpDoubleNull({ radiusM: r, radiusDerivativeU: -0.5, radiusDerivativeV: 1 });
  assert.equal(result.gradientNormSquared, 1);
  assert.equal(result.massKg, 0);
  assert.equal(result.marginalWithinTolerance, false);
  close(result.expansionsProductPerM2, -2 / r ** 2);
  close(result.expansionsProductPerM2, -2 * result.gradientNormSquared / r ** 2);
});

test('null-coordinate rescaling preserves the spherical invariant mass', () => {
  const first = gr.misnerSharpDoubleNull({ radiusM: 4, metricExponent: 0.7, radiusDerivativeU: -0.3, radiusDerivativeV: 0.6 });
  // u_new=2 u, v_new=3 v; e^(2f_new)=e^(2f)/6.
  const second = gr.misnerSharpDoubleNull({ radiusM: 4, metricExponent: 0.7 - Math.log(6) / 2, radiusDerivativeU: -0.3 / 2, radiusDerivativeV: 0.6 / 3 });
  close(first.gradientNormSquared, second.gradientNormSquared);
  close(first.massKg, second.massKg);
  close(first.expansionsProductPerM2, second.expansionsProductPerM2);
});

test('a doubly marginal static throat satisfies R=2GM/c^2 without establishing an event horizon', () => {
  const r = 0.04;
  const result = gr.misnerSharpDoubleNull({ radiusM: r, radiusDerivativeU: 0, radiusDerivativeV: 0 });
  close(result.massKg, C2 * r / (2 * G));
  assert.equal(result.thetaUPerM, 0);
  assert.equal(result.thetaVPerM, 0);
  assert.equal(result.marginalWithinTolerance, true);
  assert.equal(result.eventHorizonEstablished, false);
  assert.equal(result.provesSpacetimePassage, false);
});

test('future outer uses the negative cross derivative; the source positive sign is inner', () => {
  const input = { thetaPlusPerM: 0, thetaMinusPerM: -2, crossDerivativePerM2: -3, futureNullNormals: true };
  const outer = gr.classifyFutureOuter(input);
  const inner = gr.classifyFutureOuter({ ...input, crossDerivativePerM2: 3 });
  assert.equal(outer.futureOuterConditionsMet, true);
  assert.equal(outer.classification, 'future-outer-local-surface');
  assert.equal(inner.futureOuterConditionsMet, false);
  assert.equal(inner.classification, 'future-inner-local-surface');
  assert.equal(gr.classifyFutureOuter({ ...input, thetaPlusPerM: 1 }).futureOuterConditionsMet, false);
  assert.equal(gr.classifyFutureOuter({ ...input, thetaMinusPerM: 2 }).futureOuterConditionsMet, false);
  const timelike = gr.classifyFutureOuter({ ...input, causalCharacter: 'timelike' });
  assert.equal(timelike.timelikeOuterCandidate, true);
  assert.equal(timelike.provesSpacetimePassage, false);
  assert.equal(timelike.eventHorizonEstablished, false);
});

test('two flat exterior shell charts have opposite curvature signs, negative density and positive pressure', () => {
  const a = 0.04;
  const result = gr.thinShell({ radiusM: a, fPlus: 1, fMinus: 1 });
  close(result.extrinsicCurvaturePerM.plus.thetaTheta, 1 / a);
  close(result.extrinsicCurvaturePerM.minus.thetaTheta, -1 / a);
  close(result.surfaceEnergyDensityJPerM2, -C4 / (2 * Math.PI * G * a));
  close(result.surfacePressureNPerM, C4 / (4 * Math.PI * G * a));
  close(result.surfacePressureNPerM, -result.surfaceEnergyDensityJPerM2 / 2);
  close(result.constraintResidualDimensionless, 0, 0, 1e-14);
});

test('static Schwarzschild shell pressure matches its analytic limit and radial conservation', () => {
  const a = 8, rg = 1;
  const calc = radius => gr.thinShell({ radiusM: radius, fPlus: 1 - 2 * rg / radius, fMinus: 1 - 2 * rg / radius, fPrimePlusPerM: 2 * rg / radius ** 2, fPrimeMinusPerM: 2 * rg / radius ** 2 });
  const result = calc(a);
  const expected = C4 * (1 - rg / a) / (4 * Math.PI * G * a * Math.sqrt(1 - 2 * rg / a));
  close(result.surfacePressureNPerM, expected);
  const h = a * 1e-5;
  const numericalDerivative = (calc(a + h).surfaceEnergyDensityJPerM2 - calc(a - h).surfaceEnergyDensityJPerM2) / (2 * h);
  close(numericalDerivative, -2 * (result.surfaceEnergyDensityJPerM2 + result.surfacePressureNPerM) / a, 2e-9);
});

test('shell acceleration uses proper seconds and c^2; pressure source error cannot pass', () => {
  const a = 2, acceleration = C2 * 0.25;
  const result = gr.thinShell({ radiusM: a, fPlus: 1, fMinus: 1, radialAccelerationMPerS2: acceleration });
  close(result.extrinsicCurvaturePerM.plus.tauTau, 0.25);
  close(result.extrinsicCurvaturePerM.minus.tauTau, -0.25);
  close(result.surfacePressureNPerM, C4 * 0.5 / (8 * Math.PI * G) - result.surfaceEnergyDensityJPerM2 / 2);
  const wrongPressure = C4 * 0.5 / (8 * Math.PI * G * a) + result.surfaceEnergyDensityJPerM2 / 2;
  assert.ok(Math.abs(wrongPressure - result.surfacePressureNPerM) > Math.abs(result.surfacePressureNPerM));
});

test('asymmetric potential recovers independent moving-shell density with one radius in its denominator', () => {
  const a = 2, fp = 0.8, fm = 0.6, v = 0.3;
  const sigma = -C4 * (Math.sqrt(v * v + fp) + Math.sqrt(v * v + fm)) / (4 * Math.PI * G * a);
  const result = gr.thinShellPotential({ radiusM: a, fPlus: fp, fMinus: fm, surfaceEnergyDensityJPerM2: sigma });
  close(result.potentialDimensionless, -v * v);
  close(result.candidatePositiveRoots.plus, Math.sqrt(v * v + fp));
  close(result.candidatePositiveRoots.minus, Math.sqrt(v * v + fm));
  assert.equal(result.originalPositiveRootBranchAdmissible, true);
  const printedExtraRadius = (fp + fm) / 2 - (C4 * (fp - fm) / (8 * Math.PI * G * sigma * a * a)) ** 2 - 4 * Math.PI ** 2 * G ** 2 * sigma ** 2 * a ** 2 / C4 ** 2;
  assert.ok(Math.abs(printedExtraRadius + v * v) > 1e-3);
});

test('squared potential can admit a spurious branch that the unsquared junction excludes', () => {
  const a = 2, S = 0.1;
  const sigma = -C4 * S / (4 * Math.PI * G * a);
  const result = gr.thinShellPotential({ radiusM: a, fPlus: 1, fMinus: 0.1, surfaceEnergyDensityJPerM2: sigma });
  assert.equal(result.squaredEquationMotionAllowed, true);
  assert.ok(result.candidatePositiveRoots.minus < 0);
  assert.equal(result.originalPositiveRootBranchAdmissible, false);
});

test('SI shell surface stresses scale as inverse radius with correspondingly scaled derivatives', () => {
  const first = gr.thinShell({ radiusM: 2, fPlus: 0.8, fMinus: 0.6, fPrimePlusPerM: 0.1, fPrimeMinusPerM: 0.2 });
  const second = gr.thinShell({ radiusM: 20, fPlus: 0.8, fMinus: 0.6, fPrimePlusPerM: 0.01, fPrimeMinusPerM: 0.02 });
  close(second.surfaceEnergyDensityJPerM2, first.surfaceEnergyDensityJPerM2 / 10);
  close(second.surfacePressureNPerM, first.surfacePressureNPerM / 10);
  close(second.potentialDimensionless, first.potentialDimensionless, 1e-12, 1e-14);
});

test('Kerr spin is dimensionless and distinct from gravitational and horizon radii', () => {
  const mass = C2 / G; // rg exactly one meter to floating precision.
  const nonrotating = gr.kerrReference({ massKg: mass, dimensionlessSpin: 0 });
  close(nonrotating.gravitationalRadiusM, 1);
  close(nonrotating.kerrOuterHorizonRadiusM, 2);
  const rotating = gr.kerrReference({ massKg: mass, dimensionlessSpin: 0.8 });
  close(rotating.kerrSpinLengthM, 0.8);
  close(rotating.kerrOuterHorizonRadiusM, 1.6);
  close(rotating.kerrInnerHorizonRadiusM, 0.4);
  close(rotating.horizonAngularVelocityRadPerS, c / 4);
  const retrograde = gr.kerrReference({ massKg: mass, dimensionlessSpin: -0.8 });
  close(retrograde.kerrOuterHorizonRadiusM, rotating.kerrOuterHorizonRadiusM);
  close(retrograde.horizonAngularVelocityRadPerS, -rotating.horizonAngularVelocityRadPerS);
  const fromJ = gr.kerrReference({ massKg: mass, angularMomentumKgM2PerS: rotating.angularMomentumKgM2PerS });
  close(fromJ.parameters.dimensionlessSpin, 0.8);
});

test('reference calculators reject wrong types, singular charts, illegal branches and overflow', () => {
  assert.throws(() => gr.morrisThorne({ radiusM: '2', shapeM: 1, shapeDerivative: 0 }), /finite number/);
  assert.throws(() => gr.morrisThorne({ radiusM: 0, shapeM: 0, shapeDerivative: 0 }), /positive/);
  assert.throws(() => gr.morrisThorne({ radiusM: 1, shapeM: 2, shapeDerivative: 0 }), /exterior/);
  for (const redshift of [-1000, 1000]) assert.throws(() => gr.morrisThorne({ radiusM: 2, shapeM: 1, shapeDerivative: 0, redshift }), /lapse/);
  assert.throws(() => gr.misnerSharpDoubleNull({ radiusM: 2, radiusDerivativeU: 1, radiusDerivativeV: 1, metricExponent: 1000 }), /metric/);
  assert.throws(() => gr.classifyFutureOuter({ thetaPlusPerM: 0, thetaMinusPerM: -1, crossDerivativePerM2: -1 }), /futureNullNormals/);
  assert.throws(() => gr.classifyFutureOuter({ thetaPlusPerM: 0, thetaMinusPerM: -1, crossDerivativePerM2: -1, futureNullNormals: true, causalCharacter: 'spinning' }), /causalCharacter/);
  assert.throws(() => gr.thinShell({ radiusM: 1, fPlus: 0, fMinus: 1 }), /positive/);
  assert.throws(() => gr.thinShell({ radiusM: 1, fPlus: 1, fMinus: -1 }), /positive/);
  assert.throws(() => gr.thinShellPotential({ radiusM: 1, fPlus: 1, fMinus: 1, surfaceEnergyDensityJPerM2: 1 }), /negative/);
  assert.throws(() => gr.kerrReference({ massKg: 1, dimensionlessSpin: 1.1 }), /Kerr/);
  assert.throws(() => gr.kerrReference({ massKg: 1, dimensionlessSpin: 0.5, angularMomentumKgM2PerS: 0 }), /disagree/);
  assert.throws(() => gr.kerrReference({ massKg: Infinity }), /finite number/);
  assert.throws(() => gr.kerrReference({ massKg: 1, spin: 0.5 }), /unknown parameter spin/);
  assert.throws(() => gr.thinShell({ radiusM: 1, fPlus: 1, fMinus: 1, radialVelocity: 5 }), /unknown parameter/);
  assert.throws(() => gr.thinShell({ radiusM: 1e-320, fPlus: 1, fMinus: 1 }), /range|finite/);
});

test('all A01-A38 findings are preserved with complete source provenance and safe copying', () => {
  const registry = gr.getAuditFindings();
  assert.equal(registry.items.length, 38);
  assert.deepEqual(registry.items.map(item => item.id), Array.from({ length: 38 }, (_, i) => `A${String(i + 1).padStart(2, '0')}`));
  assert.equal(registry.source.originalPdf.sha256, '564bbb26531acb9ee26dd51247c70531d4b53c69069630a0b94e2f6c756b9848');
  assert.equal(registry.source.editableReview.sha256, '20caf09a0158c75508df92a65c469423e4c0e76838e8eb999b94d30c260bf455');
  for (const source of [registry.source.originalPdf, registry.source.reviewJson, registry.source.editableReview]) {
    if (fs.existsSync(source.path)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(source.path)).digest('hex'), source.sha256);
  }
  for (const item of registry.items) {
    assert.ok(item.title && item.explanation && item.equation && item.scope);
    assert.ok(item.pages.every(page => Number.isInteger(page) && page >= 1 && page <= 9));
    if (item.disposition === 'unestablished') assert.equal(item.application, 'reference-only');
  }
  assert.equal(registry.items.find(item => item.id === 'A03').correctedEquationUnits, 'SI');
  assert.equal(registry.items.find(item => item.id === 'A13').correctedEquationUnits, 'SI');
  registry.items[0].title = 'mutated';
  assert.notEqual(gr.getAuditFindings().items[0].title, 'mutated');
  assert.equal(registry.summary.physicalEvolutionCoupling, false);
  assert.equal(registry.summary.observationalValidation, false);
});

test('GET reference example is finite JSON, separates independent geometries and contains no physical evolution coupling', () => {
  const example = gr.referenceExample();
  assert.equal(example.schema, 'gfm.gr-reference.v1');
  assert.equal(example.examples.length, 5);
  assert.equal(example.metadata.physicalEvolutionCoupling, false);
  assert.equal(example.metadata.provesSpacetimePassage, false);
  for (const item of example.examples) {
    assert.equal(item.result.referenceOnly, true);
    assert.equal(item.result.provesSpacetimePassage, false);
    assert.equal(item.result.provesMetricTensorIdentity, false);
  }
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(example)));
  const engine = fs.readFileSync(path.join(__dirname, '../backend/cylinder-em.cjs'), 'utf8');
  assert.ok(!engine.includes("require('./gr-reference") && !engine.includes("require('../data/audit-findings"));
});
