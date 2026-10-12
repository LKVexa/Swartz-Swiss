'use strict';

// Independent physical checks. Analytic fields, dual-cell volumes and the
// divergence stencil below do not import the engine's analytic helpers.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createModel, EPS0, MU0, C0 } = require('../backend/cylinder-em.cjs');

const ROOT_J1 = 3.8317059702075125;
function bessel(order, x) {
  let term = order ? x / 2 : 1;
  let result = term;
  for (let m = 1; m < 100; m++) {
    term *= -x * x / (4 * m * (m + order));
    result += term;
    if (Math.abs(term) < 1e-17) break;
  }
  return result;
}
function geometry(frame) {
  const { nr, nz, drM: dr, dzM: dz } = frame.grid;
  const R = frame.parameters.radiusM;
  const E = [], Hr = [], Hz = [];
  for (let k = 0; k < nz; k++) for (let i = 0; i < nr; i++) {
    E.push(Math.PI * (((i + 1) * dr) ** 2 - (i * dr) ** 2) * dz);
  }
  for (let k = 0; k <= nz; k++) for (let i = 0; i < nr; i++) {
    Hr.push(Math.PI * (((i + 1) * dr) ** 2 - (i * dr) ** 2) * dz * (k === 0 || k === nz ? 0.5 : 1));
  }
  for (let k = 0; k < nz; k++) for (let j = 0; j <= nr; j++) {
    const lower = Math.max(0, (j - 0.5) * dr), upper = Math.min(R, (j + 0.5) * dr);
    Hz.push(Math.PI * (upper ** 2 - lower ** 2) * dz);
  }
  return { E, Hr, Hz };
}
function independentlyIntegratedEnergy(frame) {
  const w = geometry(frame), f = frame.staggered;
  let U = 0;
  for (let j = 0; j < w.E.length; j++) U += EPS0 * f.EphiVPerM[j] ** 2 * w.E[j] / 2;
  for (let j = 0; j < w.Hr.length; j++) U += MU0 * f.HrAPerM[j] ** 2 * w.Hr[j] / 2;
  for (let j = 0; j < w.Hz.length; j++) U += MU0 * f.HzAPerM[j] ** 2 * w.Hz[j] / 2;
  return U;
}
function close(actual, expected, relative = 1e-11, absolute = 1e-30) {
  assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.max(Math.abs(actual), Math.abs(expected)), `${actual} differs from ${expected}`);
}
function configuration(nr = 16) {
  return { resolutionR: nr, resolutionZ: 2 * nr, pulseFrequencyHz: 1e9, sigmaSPerM: 0, sourceEnabled: false, spongeRatePerSecond: 0 };
}
function mode(frame, time, amplitude = 1, conductivity = 0) {
  const { nr, nz, drM: dr, dzM: dz } = frame.grid;
  const alpha = ROOT_J1 / frame.parameters.radiusM, beta = Math.PI / frame.parameters.lengthM;
  const omega = C0 * Math.hypot(alpha, beta);
  const gamma = conductivity / EPS0;
  const dampedOmega = Math.sqrt(omega ** 2 - gamma ** 2 / 4);
  const damping = Math.exp(-gamma * time / 2);
  const electricFactor = damping * (Math.cos(dampedOmega * time) - gamma / (2 * dampedOmega) * Math.sin(dampedOmega * time));
  const integralFactor = damping * Math.sin(dampedOmega * time) / dampedOmega;
  const EphiVPerM = [], HrAPerM = [], HzAPerM = [];
  for (let k = 0; k < nz; k++) for (let i = 0; i < nr; i++) {
    EphiVPerM.push(amplitude * bessel(1, alpha * (i + 0.5) * dr) * Math.sin(beta * (k + 0.5) * dz) * electricFactor);
  }
  for (let k = 0; k <= nz; k++) for (let i = 0; i < nr; i++) {
    HrAPerM.push(amplitude * beta / MU0 * bessel(1, alpha * (i + 0.5) * dr) * Math.cos(beta * k * dz) * integralFactor);
  }
  for (let k = 0; k < nz; k++) for (let j = 0; j <= nr; j++) {
    HzAPerM.push(-amplitude * alpha / MU0 * bessel(0, alpha * j * dr) * Math.sin(beta * (k + 0.5) * dz) * integralFactor);
  }
  return { EphiVPerM, HrAPerM, HzAPerM, omega };
}
function modalError(nr, conductivity = 0) {
  const overrides = conductivity ? { sigmaSPerM: conductivity, cylinderStartM: 0, cylinderLengthM: 0.32, cylinderRadiusM: 0.06, wallThicknessM: 0.06 } : {};
  const model = createModel({ ...configuration(nr), ...overrides });
  const before = model.snapshot({ includeStaggered: true });
  const initial = mode(before, 0);
  model.setFields({ EphiVPerM: initial.EphiVPerM, HrAPerM: initial.HrAPerM, HzAPerM: initial.HzAPerM });
  const t = 0.9 / initial.omega;
  model.step(t);
  const after = model.snapshot({ includeStaggered: true });
  const exact = mode(after, t, 1, conductivity), weights = geometry(after);
  let squaredError = 0, squaredExact = 0;
  for (const [key, factor, volumeKey] of [['EphiVPerM', EPS0, 'E'], ['HrAPerM', MU0, 'Hr'], ['HzAPerM', MU0, 'Hz']]) {
    for (let j = 0; j < exact[key].length; j++) {
      squaredError += factor * (after.staggered[key][j] - exact[key][j]) ** 2 * weights[volumeKey][j];
      squaredExact += factor * exact[key][j] ** 2 * weights[volumeKey][j];
    }
  }
  return { nr, nz: 2 * nr, relativeL2: Math.sqrt(squaredError / squaredExact), timeSeconds: t, dtMaxSeconds: model.dtMaxSeconds };
}

test('independent continuum Bessel mode converges under space/time refinement', () => {
  const errors = [16, 32, 64].map(n => modalError(n));
  assert.ok(errors[0].relativeL2 < 0.02, JSON.stringify(errors));
  assert.ok(errors[1].relativeL2 < errors[0].relativeL2 / 3, JSON.stringify(errors));
  assert.ok(errors[2].relativeL2 < errors[1].relativeL2 / 3, JSON.stringify(errors));
  process.stdout.write(`BESSEL_REFINEMENT ${JSON.stringify(errors)}\n`);
});

test('uniform Ohmic matter matches the independently derived damped continuum mode', () => {
  const errors = [16, 32, 64].map(n => modalError(n, 0.01));
  assert.ok(errors[0].relativeL2 < 0.02, JSON.stringify(errors));
  assert.ok(errors[1].relativeL2 < errors[0].relativeL2 / 3, JSON.stringify(errors));
  assert.ok(errors[2].relativeL2 < errors[1].relativeL2 / 3, JSON.stringify(errors));
  process.stdout.write(`OHMIC_REFINEMENT ${JSON.stringify(errors)}\n`);
});

test('independently derived electric and magnetic dual volumes each integrate the cylinder', () => {
  const model = createModel(configuration());
  const frame = model.snapshot({ includeStaggered: true }), w = geometry(frame);
  const exactV = Math.PI * frame.parameters.radiusM ** 2 * frame.parameters.lengthM;
  for (const key of ['E', 'Hr', 'Hz']) close(w[key].reduce((s, v) => s + v, 0), exactV, 3e-14);
  for (const [actual, expected] of [[frame.staggered.volumesE, w.E], [frame.staggered.volumesHr, w.Hr], [frame.staggered.volumesHz, w.Hz]]) {
    actual.forEach((v, j) => close(v, expected[j], 4e-14));
  }
});

test('regular Ephi=a*r has the cylindrical factor-two axial magnetic curl', () => {
  const model = createModel(configuration()), frame = model.snapshot();
  const a = 2.3, E = [];
  for (let k = 0; k < frame.grid.nz; k++) for (const r of frame.grid.rM) E.push(a * r);
  const curl = model.physicalCurl(E);
  for (let k = 0; k < frame.grid.nz; k++) for (let i = 0; i < frame.grid.nr; i++) {
    close(curl.dHzDt[k * (frame.grid.nr + 1) + i], -2 * a / MU0, 2e-14);
  }
  for (let k = 1; k < frame.grid.nz; k++) for (let i = 0; i < frame.grid.nr; i++) {
    close(curl.dHrDt[k * frame.grid.nr + i], 0, 0, 2e-9);
  }
});

test('independent dual-annulus divergence of the discrete magnetic curl is zero', () => {
  const model = createModel(configuration()), frame = model.snapshot();
  const { nr, nz, drM: dr, dzM: dz } = frame.grid;
  const E = Array.from({ length: nr * nz }, (_, j) => Math.sin(0.73 * j) + Math.cos(0.31 * j));
  const c = model.physicalCurl(E);
  let maximum = 0, maximumTerm = 0;
  for (let k = 0; k <= nz; k++) for (let i = 0; i <= nr; i++) {
    const lower = Math.max(0, (i - 0.5) * dr), upper = Math.min(frame.parameters.radiusM, (i + 0.5) * dr);
    const A = Math.PI * (upper ** 2 - lower ** 2);
    let radial = 0, axial = 0;
    if (i < nr) radial += 2 * Math.PI * (i + 0.5) * dr * c.dHrDt[k * nr + i] / A;
    if (i > 0) radial -= 2 * Math.PI * (i - 0.5) * dr * c.dHrDt[k * nr + i - 1] / A;
    if (k < nz) axial += (k === 0 ? 2 : 1) * c.dHzDt[k * (nr + 1) + i] / dz;
    if (k > 0) axial -= (k === nz ? 2 : 1) * c.dHzDt[(k - 1) * (nr + 1) + i] / dz;
    maximum = Math.max(maximum, Math.abs(radial + axial));
    maximumTerm = Math.max(maximumTerm, Math.abs(radial), Math.abs(axial));
  }
  assert.ok(maximum / maximumTerm < 3e-14, `relative divergence=${maximum / maximumTerm}`);
});

test('Joule heat and diagnostic temperature use local SI heat density and midpoint E', () => {
  const model = createModel({ ...configuration(), sigmaSPerM: 0.03 });
  const raw = model.snapshot({ includeStaggered: true }), initial = mode(raw, 0, 1000);
  model.setFields({ EphiVPerM: initial.EphiVPerM });
  const before = model.snapshot({ includeStaggered: true });
  const dt = model.dtMaxSeconds / 2;
  const step = model.step(dt);
  assert.equal(step.substeps, 1);
  const after = model.snapshot({ includeStaggered: true }), w = geometry(after);
  let heat = 0, totalHeatDensityIntegral = 0;
  for (let j = 0; j < after.fields.EphiVPerM.length; j++) {
    const midpoint = (before.fields.EphiVPerM[j] + after.fields.EphiVPerM[j]) / 2;
    const density = dt * after.fields.conductivitySPerM[j] * midpoint ** 2;
    close(after.fields.depositedEnergyDensityJPerM3[j], density, 1e-12);
    assert.ok(density >= 0);
    heat += density * w.E[j];
    totalHeatDensityIntegral += after.fields.depositedEnergyDensityJPerM3[j] * w.E[j];
    const fill = after.fields.materialFillFraction[j];
    const predictedT = after.parameters.initialTemperatureK + (fill > 0 ? density / (fill * after.parameters.materialDensityKgPerM3 * after.parameters.materialHeatCapacityJPerKgK) : 0);
    close(after.fields.temperatureK[j], predictedT, 4e-15);
  }
  close(after.diagnostics.materialHeatJ, heat, 5e-14);
  close(totalHeatDensityIntegral, heat, 5e-14);
  close(independentlyIntegratedEnergy(after) + heat, independentlyIntegratedEnergy(before), 2e-11);
});

test('hollow shell, bottom, and partial cover have the independently calculated material volume', () => {
  for (const coverFraction of [0, 0.35, 1]) {
    const model = createModel({ ...configuration(), sigmaSPerM: 0.03, coverFraction });
    const frame = model.snapshot(), p = frame.parameters, w = geometry(frame);
    const ri = p.cylinderRadiusM - p.wallThicknessM;
    const expectedVolume = Math.PI * (p.cylinderRadiusM ** 2 - ri ** 2) * p.cylinderLengthM + Math.PI * ri ** 2 * p.bottomThicknessM * (1 + coverFraction);
    let actualVolume = 0;
    frame.fields.materialFillFraction.forEach((fill, j) => {
      assert.ok(fill >= 0 && fill <= 1);
      actualVolume += fill * w.E[j];
      close(frame.fields.conductivitySPerM[j], p.sigmaSPerM * fill);
    });
    close(actualVolume, expectedVolume, 8e-14);
    // The body of the cavity remains empty even when its receiving end is covered.
    for (let k = 0; k < frame.grid.nz; k++) for (let i = 0; i < frame.grid.nr; i++) {
      const innerCell = (i + 1) * frame.grid.drM <= ri;
      const middleAxialCell = k * frame.grid.dzM >= p.cylinderStartM + p.bottomThicknessM && (k + 1) * frame.grid.dzM <= p.cylinderStartM + p.cylinderLengthM - p.bottomThicknessM;
      if (innerCell && middleAxialCell) assert.equal(frame.fields.materialFillFraction[k * frame.grid.nr + i], 0);
    }
  }
});

test('conductive relaxation is resolved rather than merely numerically stable', () => {
  for (const sigmaSPerM of [0.03, 1, 100]) {
    const model = createModel({ ...configuration(), sigmaSPerM });
    const frame = model.snapshot();
    const maxSigma = Math.max(...frame.fields.conductivitySPerM);
    assert.ok(maxSigma * model.dtMaxSeconds / EPS0 <= 0.2 * (1 + 2e-14));
  }
});

test('exported Poynting and current vectors have the right SI signs and constitutive factors', () => {
  const model = createModel({ ...configuration(), sigmaSPerM: 0.03 });
  const frame = model.snapshot({ includeStaggered: true });
  model.setFields({ EphiVPerM: Array(frame.staggered.EphiVPerM.length).fill(3), HrAPerM: Array(frame.staggered.HrAPerM.length).fill(2), HzAPerM: Array(frame.staggered.HzAPerM.length).fill(-5) });
  const f = model.snapshot();
  f.fields.EphiVPerM.forEach((E, j) => {
    close(f.fields.poyntingAxialWPerM2[j], -6);
    close(f.fields.poyntingRadialWPerM2[j], -15);
    close(f.fields.BrTesla[j], 2 * MU0);
    close(f.fields.BzTesla[j], -5 * MU0);
    close(f.fields.JphiAPerM2[j], f.fields.conductivitySPerM[j] * E);
  });
});

test('zero source and zero initial fields remain exactly zero, with no invented energy', () => {
  const model = createModel(configuration());
  model.step(2e-10);
  const f = model.snapshot({ includeStaggered: true });
  assert.ok(f.staggered.EphiVPerM.every(v => v === 0));
  assert.ok(f.staggered.HrAPerM.every(v => v === 0));
  assert.ok(f.staggered.HzAPerM.every(v => v === 0));
  assert.equal(independentlyIntegratedEnergy(f), 0);
  assert.equal(f.diagnostics.materialHeatJ, 0);
  assert.equal(f.diagnostics.sourceWorkJ, 0);
});
