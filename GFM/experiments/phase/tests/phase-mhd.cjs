'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../backend/phase-mhd.js');
const V = require('../validation/phase-verification.cjs');

test('periodic CT conserves independently reconstructed mass, energy, tracer and momentum with positive finite states', () => {
  for (const result of V.conservationCases()) {
    assert.ok(result.relativeMassResidual < 2e-13, result.name);
    assert.ok(result.relativeEnergyResidual < 2e-13, result.name);
    assert.ok(result.momentumResidual < 2e-12, result.name);
    assert.ok(result.concentrationMassResidual < 2e-12, result.name);
    assert.ok(result.maxStaggeredDivergence < 2e-12, result.name);
    assert.ok(result.maxEOSReconstructionError < 2e-13, result.name);
    assert.ok(result.minDensity > 0 && result.minPressure > 0 && result.minMaterialK > 1, result.name);
    assert.ok(result.maxConcentrationViolation === 0 && result.maxMaterialPartitionError < 2e-15, result.name);
    assert.equal(result.allFinite, true, result.name);
  }
});

test('passive scalar advection and diffusion approach their continuum Fourier solutions by spatial refinement', () => {
  for (const kind of ['advection', 'diffusion']) {
    const result = V.scalarRefinement(kind);
    for (let i = 1; i < result.cases.length; i++) {
      assert.ok(result.cases[i].rmsError < result.cases[i - 1].rmsError, kind);
      assert.ok(result.cases[i].observedOrder > .75, `${kind}: ${result.cases[i].observedOrder}`);
    }
    assert.ok(result.cases.at(-1).rmsError < .012, kind);
  }
});

test('small-amplitude resistive magnetic decay has the damping sign and converges toward exp(-eta t)', () => {
  const result = V.resistiveRefinement();
  for (const row of result.cases) {
    assert.ok(row.measuredDecayRatio > 0 && row.measuredDecayRatio < 1);
    assert.ok(row.magneticEnergyChange < 0);
    assert.ok(row.maxStaggeredDivergence < 1e-14);
    assert.ok(row.energyResidual < 2e-13);
    assert.ok(row.maxFlowGenerated < 1e-6);
  }
  for (const row of result.cases.slice(1)) assert.ok(row.observedOrder > .75, String(row.observedOrder));
  assert.ok(result.cases.at(-1).ratioError < .015);
});

test('uniform neutral complex reaction matches exact amplitude and clockwise nonlinear rotation at RK2 temporal order', () => {
  const result = V.complexTemporalRefinement();
  for (const row of result.cases.slice(1)) assert.ok(row.observedOrder > 1.9, String(row.observedOrder));
  assert.ok(result.cases.at(-1).error < 1e-7);
  assert.ok(result.cases.at(-1).im < Math.hypot(result.exactRe, result.exactIm) * Math.sin(Math.atan2(.1, .4)));
});

test('iron enthalpy preserves latent-heat plateaus, phase fractions and independent heating/conduction balances', () => {
  const result = V.ironLaboratory();
  for (const sample of result.transitionChecks) {
    assert.ok(Math.abs(sample.actual.temperatureK - sample.expectedTemperature) < 1e-10);
    assert.ok(Math.abs(sample.actual.solidFraction - sample.expectedSolid) < 1e-13);
    assert.ok(Math.abs(sample.actual.liquidFraction - sample.expectedLiquid) < 1e-13);
    assert.ok(Math.abs(sample.actual.vaporFraction + sample.actual.plasmaFraction - sample.expectedTotalVapor) < 1e-13);
  }
  assert.ok(result.maxHeatingBalanceErrorJkg < 1e-6, String(result.maxHeatingBalanceErrorJkg));
  assert.ok(Math.abs(result.conductionMeanEnthalpyResidualJkg) < 1e-7);
  assert.ok(result.conductionMinimumTemperatureK > 1);
  assert.ok(result.snapshots.some(s => s.temperatureK === 1811 && s.solid > 0 && s.liquid > 0));
  assert.ok(result.snapshots.some(s => s.temperatureK === 3134 && s.liquid > 0 && s.totalVapor > 0));
  assert.ok(result.snapshots.at(-1).temperatureK > 3134);
  for (const temperature of [100, 500, 1700, 2000, 3000, 4000, 12000]) {
    assert.ok(Math.abs(P.ironFromEnthalpy(P.ironEnthalpy(temperature)).temperatureK - temperature) < 1e-10);
  }
});

test('complex plaquette winding reproduces four analytic zeros, signs, net charge and unresolved pi edges', () => {
  const result = V.windingCase();
  assert.equal(result.actual.length, 4);
  assert.equal(result.actual.filter(x => x.charge === 1).length, 2);
  assert.equal(result.actual.filter(x => x.charge === -1).length, 2);
  assert.equal(result.netCharge, 0);
  assert.equal(result.actual.every(x => x.resolved), true);
  assert.ok(result.maximumZeroLocationError <= result.gridSpacing / Math.SQRT2 + 1e-14);
  assert.ok(result.deliberatelyAmbiguousPiEdges > 0);
});

test('invalid plain-data parameter patches and invalid time intervals preserve the previous frame without invoking getters', () => {
  const model = P.createModel({ resolution: 16 });
  model.step(.01);
  const before = JSON.stringify(model.snapshot());
  let getterCalls = 0;
  const getter = Object.defineProperty({}, 'density', { enumerable: true, get() { getterCalls++; return 1; } });
  const invalid = [null, [], new Date(), { resolution: 24 }, { density: NaN }, { density: Infinity },
    { resistivity: -.1 }, { mystery: 1 }, { density: '1' }, getter, { [Symbol('density')]: 1 }];
  for (const patch of invalid) {
    assert.throws(() => model.setParameters(patch));
    assert.equal(JSON.stringify(model.snapshot()), before);
  }
  assert.equal(getterCalls, 0);
  for (const dt of [-1, 1.01, NaN, Infinity, '0.1', null]) {
    assert.throws(() => model.step(dt));
    assert.equal(JSON.stringify(model.snapshot()), before);
  }
  assert.equal(JSON.stringify(model.step(0)), before);
});

test('trusted callback failure in reset or setParameters restores the complete previous initialized experiment', () => {
  let invalid = false, throwSample = false;
  const model = P.createModel({ ...V.uniform, resolution: 16 }, () => {
    if (throwSample) throw new Error('test callback refused sample');
    return { density: invalid ? -1 : 1, vx: 0, vy: 0, concentration: .5, psiRe: .1, psiIm: 0 };
  });
  model.step(.05);
  const before = JSON.stringify(model.snapshot());
  invalid = true;
  assert.throws(() => model.setParameters({ resolution: 32 }), /positivity/);
  assert.equal(JSON.stringify(model.snapshot()), before);
  assert.throws(() => model.reset(), /positivity/);
  assert.equal(JSON.stringify(model.snapshot()), before);
  invalid = false; throwSample = true;
  assert.throws(() => model.setParameters({ density: 2 }), /refused sample/);
  assert.equal(JSON.stringify(model.snapshot()), before);
  throwSample = false;
  assert.equal(model.reset().time, 0);
});

test('numerical positivity failure rolls back all physical fields and elapsed/accepted-step ledger, while exposing error diagnostics', () => {
  const model = P.createModel({ ...V.uniform, resolution: 16, ironTemperatureK: 100,
    ironHeatingWkg: -10000, timeScaleSeconds: 100 });
  const before = model.snapshot();
  assert.throws(() => model.step(.1));
  const after = model.snapshot();
  for (const key of ['time', 'sequence', 'physicalSeconds', 'fields', 'conserved', 'staggeredMagneticField', 'materials']) {
    assert.deepEqual(after[key], before[key], key);
  }
  assert.equal(after.diagnostics.acceptedSteps, before.diagnostics.acceptedSteps);
  assert.equal(after.diagnostics.ironExternalHeatJkg, before.diagnostics.ironExternalHeatJkg);
  assert.equal(after.diagnostics.status, 'error');
  assert.ok(after.diagnostics.rejectedSteps > 0);
  assert.equal(after.diagnostics.passed, false);
});

test('deterministic replay/reset and parameter reset reproduce identical frames; returned frames cannot mutate the model', () => {
  const parameters = { resolution: 16, resistivity: .01, ironHeatingWkg: 5000 };
  const first = P.createModel(parameters), second = P.createModel(parameters);
  const initial = first.snapshot();
  for (const dt of [.02, .03, .01]) assert.deepEqual(first.step(dt), second.step(dt));
  const final = first.snapshot();
  const returned = first.snapshot();
  returned.fields.density[0] = -999;
  returned.staggeredMagneticField.bxFaces[0] = 1000;
  returned.parameters.density = 10;
  assert.deepEqual(first.snapshot(), final);
  assert.deepEqual(first.reset(), initial);
  assert.deepEqual(first.setParameters({ density: 2 }), P.createModel({ ...parameters, density: 2 }).snapshot());
});

test('hydrogen/iron Saha diagnostics are finite, bounded and temperature-monotone at fixed reference density', () => {
  let previous = -1;
  for (const temperature of [100, 1000, 3000, 6000, 10000, 20000, 100000, 1e6]) {
    const fraction = P.sahaFraction(temperature, 1e15);
    assert.ok(Number.isFinite(fraction) && fraction >= 0 && fraction <= 1);
    assert.ok(fraction >= previous); previous = fraction;
  }
  assert.ok(P.sahaFraction(10000, 1e15) > P.sahaFraction(10000, 1e20));
  for (const args of [[0, 1], [1, 0], [Infinity, 1], [1, NaN]]) assert.throws(() => P.sahaFraction(...args));
});

test('browser and backend phase engines are byte-identical', () => {
  assert.deepEqual(fs.readFileSync(path.join(__dirname, '../public/phase-mhd.js')),
    fs.readFileSync(path.join(__dirname, '../backend/phase-mhd.js')));
});
