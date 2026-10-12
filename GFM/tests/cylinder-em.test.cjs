'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createModel, EPS0, MU0, C0, besselJ } = require('../backend/cylinder-em.cjs');

const vacuum = { sourceEnabled: false, sigmaSPerM: 0, spongeRatePerSecond: 0, pulseFrequencyHz: 1e9, initialCondition: { type: 'pec-eigenmode', amplitudeVPerM: 1000 } };
const sum = a => a.reduce((x, y) => x + y, 0);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

test('default SI snapshot is finite, initially empty and explicitly axisymmetric', () => {
  const m = createModel(), s = m.snapshot({ includeStaggered: true });
  assert.equal(s.grid.nr, 32); assert.equal(s.grid.nz, 64);
  assert.equal(s.fields.EphiVPerM.length, 2048);
  assert.equal(s.staggered.HrAPerM.length, 2080);
  assert.equal(s.staggered.HzAPerM.length, 2112);
  assert.equal(s.diagnostics.fieldEnergyJ, 0);
  assert.ok(s.assumptions.join(' ').includes('not a general volumetric 3D solver'));
  assert.ok(s.diagnostics.maxDampingStepRatio <= 0.2 + 1e-15);
  assert.ok(Math.abs(sum(s.grid.cellVolumesM3) - Math.PI * .06 ** 2 * .32) < 1e-15);
});

test('invalid physics and unresolved carrier parameters are rejected', () => {
  for (const p of [{ sigmaSPerM: -1 }, { resolutionR: 3 }, { resolutionZ: NaN }, { coverFraction: 2 }, { pulseFrequencyHz: 1e14 }, { pulsePeriodSeconds: 1e-12 }, { cylinderLengthM: 1 }, { badParameter: 5 }]) assert.throws(() => createModel(p));
  const m = createModel(); assert.throws(() => m.step(-1)); assert.throws(() => m.step(NaN));
  assert.throws(() => m.step(1e-6), /substeps/);
});

test('geometric fill has an open axial cavity, shell and bottom; full cover seals the mouth', () => {
  const m = createModel(), s = m.snapshot();
  const at = (r, z) => Math.min(s.grid.nz - 1, Math.floor(z / s.grid.dzM)) * s.grid.nr + Math.min(s.grid.nr - 1, Math.floor(r / s.grid.drM));
  assert.equal(s.fields.materialFillFraction[at(.01, .12)], 0);
  assert.ok(s.fields.materialFillFraction[at(.043, .15)] > .99);
  assert.ok(s.fields.materialFillFraction[at(.01, .256)] > .5);
  const closed = m.reset({ coverFraction: 1 });
  assert.ok(closed.fields.materialFillFraction[at(.01, .102)] > .5);
  const shellVolume = s.fields.materialFillFraction.reduce((v, f, i) => v + f * s.grid.cellVolumesM3[i], 0);
  const p = s.parameters, expected = Math.PI * (p.cylinderRadiusM ** 2 - (p.cylinderRadiusM - p.wallThicknessM) ** 2) * p.cylinderLengthM + Math.PI * (p.cylinderRadiusM - p.wallThicknessM) ** 2 * p.bottomThicknessM;
  assert.ok(Math.abs(shellVolume - expected) / expected < 1e-13);
  const partlyClosed = m.reset({ coverFraction: .4 });
  const addedVolume = partlyClosed.fields.materialFillFraction.reduce((v, f, i) => v + (f - s.fields.materialFillFraction[i]) * s.grid.cellVolumesM3[i], 0);
  const addedExpected = .4 * Math.PI * (p.cylinderRadiusM - p.wallThicknessM) ** 2 * p.bottomThicknessM;
  assert.ok(Math.abs(addedVolume - addedExpected) / addedExpected < 1e-13);
});

test('physical Faraday curl has the correct cylindrical axis limit and signs', () => {
  const m = createModel(vacuum), s = m.snapshot();
  const e = s.grid.zM.flatMap(z => s.grid.rM.map(r => r * (1 + z)));
  const c = m.physicalCurl(e), nr = s.grid.nr;
  for (let k = 1; k < s.grid.nz; k++) for (let i = 0; i < nr; i++) assert.ok(Math.abs(c.dHrDt[k * nr + i] * MU0 - s.grid.rM[i]) < 1e-12);
  for (let k = 0; k < s.grid.nz; k++) for (let i = 0; i < nr; i++) assert.ok(Math.abs(c.dHzDt[k * (nr + 1) + i] * MU0 + 2 * (1 + s.grid.zM[k])) < 1e-12);
});

test('vacuum midpoint preserves independently reconstructed SI energy over many steps', () => {
  const m = createModel(vacuum), s0 = m.snapshot(); m.step(4e-10);
  const s = m.snapshot({ includeStaggered: true }), f = s.staggered;
  const energy = .5 * EPS0 * dot(f.EphiVPerM.map(x => x * x), f.volumesE) + .5 * MU0 * (dot(f.HrAPerM.map(x => x * x), f.volumesHr) + dot(f.HzAPerM.map(x => x * x), f.volumesHz));
  assert.ok(Math.abs(energy - s.diagnostics.fieldEnergyJ) < energy * 2e-14);
  assert.ok(Math.abs(energy - s0.diagnostics.fieldEnergyJ) / energy < 2e-10);
  assert.ok(s.diagnostics.relativeEnergyBalanceResidual < 2e-10);
});

test('continuum PEC Bessel mode is approached under r-z grid refinement', () => {
  const elapsed = 6e-11;
  const errors = [16, 32, 64].map(nr => {
    const m = createModel({ ...vacuum, resolutionR: nr, resolutionZ: nr * 2 });
    m.step(elapsed); const s = m.snapshot();
    const kr = 3.8317059702075125 / s.parameters.radiusM, kz = Math.PI / s.parameters.lengthM, omega = C0 * Math.hypot(kr, kz);
    let error = 0, norm = 0;
    for (let k = 0; k < s.grid.nz; k++) for (let i = 0; i < s.grid.nr; i++) {
      const j = k * s.grid.nr + i;
      const initial = 1000 * besselJ(1, kr * s.grid.rM[i]) * Math.sin(kz * s.grid.zM[k]);
      error += (s.fields.EphiVPerM[j] - initial * Math.cos(omega * elapsed)) ** 2 * s.grid.cellVolumesM3[j];
      norm += initial ** 2 * s.grid.cellVolumesM3[j];
    }
    return Math.sqrt(error / norm);
  });
  assert.ok(errors[1] < errors[0] / 2.5, `errors=${errors}`);
  assert.ok(errors[2] < errors[1] / 2.5, `errors=${errors}`);
  assert.ok(errors[2] < .001, `errors=${errors}`);
});

test('source-free Ohmic target deposits positive heat and closes its field-plus-heat ledger', () => {
  const m = createModel({ ...vacuum, sigmaSPerM: .02 });
  const energy0 = m.snapshot().diagnostics.fieldEnergyJ; m.step(2e-10); const s = m.snapshot();
  assert.ok(s.diagnostics.materialHeatJ > 0);
  assert.equal(s.diagnostics.spongeLossJ, 0); assert.equal(s.diagnostics.sourceWorkJ, 0);
  assert.ok(Math.abs(s.diagnostics.fieldEnergyJ + s.diagnostics.materialHeatJ - energy0) / energy0 < 2e-10);
  const independentHeat = dot(s.fields.depositedEnergyDensityJPerM3, s.grid.cellVolumesM3);
  assert.ok(Math.abs(independentHeat - s.diagnostics.materialHeatJ) / independentHeat < 1e-13);
  assert.ok(s.diagnostics.maxTemperatureRiseK > 0);
  for (let i = 0; i < s.fields.materialFillFraction.length; i++) {
    const f = s.fields.materialFillFraction[i];
    if (f > 0) {
      const expectedTemperature = s.parameters.initialTemperatureK + s.fields.depositedEnergyDensityJPerM3[i] / (f * s.parameters.materialDensityKgPerM3 * s.parameters.materialHeatCapacityJPerKgK);
      assert.equal(s.fields.temperatureK[i], expectedTemperature);
    }
  }
});

test('artificial sponge loss remains distinct from physical Joule deposition', () => {
  const m = createModel({ ...vacuum, spongeRatePerSecond: 8e9 }); m.step(1e-10); const s = m.snapshot();
  assert.ok(s.diagnostics.spongeLossJ > 0); assert.equal(s.diagnostics.materialHeatJ, 0);
  assert.equal(s.diagnostics.boundaryEnergyFluxJ, 0);
  assert.ok(s.diagnostics.relativeEnergyBalanceResidual < 2e-10);
});

test('impressed pulse produces computed E and B, target heating and an accountable ledger', () => {
  const m = createModel(); m.step(8e-10); const s = m.snapshot();
  assert.ok(s.diagnostics.maxEphiVPerM > 1); assert.ok(s.diagnostics.maxBTesla > 1e-9);
  assert.ok(s.diagnostics.sourceWorkJ > 0); assert.ok(s.diagnostics.materialHeatJ > 0);
  assert.ok(s.diagnostics.relativeEnergyBalanceResidual < 1e-9, JSON.stringify(s.diagnostics));
  assert.ok(s.diagnostics.relativeDiscreteDivB < 1e-10);
  for (let i = 0; i < s.fields.EphiVPerM.length; i++) assert.equal(s.fields.JphiAPerM2[i], s.fields.conductivitySPerM[i] * s.fields.EphiVPerM[i]);
});

test('prescribed impressed current is allowed to extract energy; work is signed', () => {
  const m = createModel({ ...vacuum, initialCondition: null, sourceEnabled: true, sourceStartSeconds: 0 });
  const s = m.snapshot(); m.setFields({ EphiVPerM: s.grid.zM.flatMap(z => s.grid.rM.map(r => -1000 * r / s.parameters.radiusM * Math.sin(Math.PI * z / s.parameters.lengthM))) });
  m.step(1e-12); const result = m.snapshot();
  assert.ok(result.diagnostics.sourceWorkJ < 0);
  assert.ok(result.diagnostics.relativeEnergyBalanceResidual < 1e-9);
});

test('reset reproduces fields and ledger byte for byte', () => {
  const m = createModel(); m.step(8e-11); const a = JSON.stringify(m.snapshot({ includeStaggered: true }));
  m.reset(); m.step(8e-11); assert.equal(JSON.stringify(m.snapshot({ includeStaggered: true })), a);
});

test('invalid staggered initialization leaves all fields unchanged', () => {
  const m = createModel(vacuum), before = JSON.stringify(m.snapshot({ includeStaggered: true }));
  assert.throws(() => m.setFields({ EphiVPerM: new Array(2048).fill(0), HrAPerM: [NaN] }));
  assert.equal(JSON.stringify(m.snapshot({ includeStaggered: true })), before);
});

test('strong conductivity resolves relaxation rather than only claiming A-stability', () => {
  const m = createModel({ ...vacuum, sigmaSPerM: 1 });
  assert.ok(m.dtMaxSeconds <= .2 * EPS0);
  m.step(2e-12); const s = m.snapshot();
  assert.ok(s.diagnostics.maxDampingStepRatio <= .2 + 1e-15);
  assert.ok(s.diagnostics.relativeEnergyBalanceResidual < 2e-10);
});
