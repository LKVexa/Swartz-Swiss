'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { computePulseDiagnostics, vacuumCharacteristics } = require('../backend/pulse-diagnostics.cjs');
const { createModel, EPS0, MU0 } = require('../backend/cylinder-em.cjs');
const auditedFrame = require('../examples/audited-covered-frame.json');

const integrate = (values, volumes) => values.reduce((total, value, index) => total + value * volumes[index], 0);
function close(actual, expected, relative = 2e-13, absolute = 1e-28) {
  assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.max(Math.abs(actual), Math.abs(expected)), `${actual} != ${expected}`);
}
function freezeTree(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeTree(child);
    Object.freeze(value);
  }
  return value;
}

// Small independent snapshot in SI units. Z=4 ohms keeps characteristic
// sign and channel identities exact; the live solver tests use EPS0/MU0.
function fixture(nr = 7, nz = 12) {
  const count = nr * nz, zeros = () => new Array(count).fill(0);
  return {
    timeSeconds: .5, stepCount: 2,
    constants: { epsilon0FPerM: 1, mu0HPerM: 16 },
    parameters: {
      radiusM: nr, lengthM: nz, cylinderStartM: nz - 2,
      sourceCenterZM: .5, sourceWidthZM: .25,
      spongeRatePerSecond: 0, spongeFraction: .1,
      plasmaCollisionFrequencyPerSecond: 3,
    },
    grid: {
      nr, nz, drM: 1, dzM: 1,
      rM: Array.from({ length: nr }, (_, i) => i + .5),
      zM: Array.from({ length: nz }, (_, k) => k + .5),
      cellVolumesM3: Array.from({ length: count }, (_, index) => Math.PI * (2 * (index % nr) + 1)),
    },
    fields: {
      EphiVPerM: zeros(), HrAPerM: zeros(), HzAPerM: zeros(),
      plasmaJphiAPerM2: zeros(), plasmaAlphaSI: zeros(), conductivitySPerM: zeros(),
      materialFillFraction: zeros(), plasmaFillFraction: zeros(),
      plasmaCollisionDepositedEnergyDensityJPerM3: zeros(), depositedEnergyDensityJPerM3: zeros(),
      plasmaDriftEnergyDensityJPerM3: zeros(), plasmaThermalEnergyDensityJPerM3: zeros(), coverThermalEnergyDensityJPerM3: zeros(),
    },
    diagnostics: {
      sourceWorkJ: 0, initialEnergyJ: 0, fieldEnergyJ: 0, plasmaDriftEnergyJ: 0,
      plasmaThermalEnergyJ: 0, coverThermalEnergyJ: 0, contactTransferToCoverJ: 0,
      spongeLossJ: 0, boundaryEnergyFluxJ: 0, thermalBoundaryEnergyFluxJ: 0,
      mouthNetPowerW: 0, mouthNetIntakeJ: 0,
    },
  };
}

const quiet = {
  resolutionR: 16, resolutionZ: 32, pulseFrequencyHz: 1e9,
  sourceEnabled: false, spongeRatePerSecond: 0,
  sigmaSPerM: 0, sigmaLiquidSPerM: 0,
};

test('cylindrical E cross H has the radial and axial signs for positive and negative fields', () => {
  const s = fixture(), f = s.fields;
  f.EphiVPerM.splice(0, 4, 2, -2, 2, 0);
  f.HrAPerM.splice(0, 4, 3, 3, -3, -3);
  f.HzAPerM.splice(0, 4, 4, -4, -4, 4);
  const out = computePulseDiagnostics(s).fields;
  assert.deepEqual(out.radialFluxWPerM2.slice(0, 4), [8, 8, -8, 0]);
  assert.deepEqual(out.axialFluxWPerM2.slice(0, 4), [-6, 6, 6, 0]);
  assert.deepEqual(out.fluxMagnitudeWPerM2.slice(0, 4), [10, 10, 10, 0]);
});

test('partial plasma and cover heating use full-cell alpha and conductivity exactly once', () => {
  const s = fixture(), f = s.fields, V = s.grid.cellVolumesM3;
  f.EphiVPerM[0] = 2; f.plasmaJphiAPerM2[0] = -4; f.plasmaAlphaSI[0] = 2;
  f.plasmaFillFraction[0] = .25;
  f.EphiVPerM[1] = -3; f.conductivitySPerM[1] = 5; f.materialFillFraction[1] = .4;
  const out = computePulseDiagnostics(s);
  assert.equal(out.fields.plasmaCollisionPowerDensityWPerM3[0], 24);
  assert.equal(out.fields.coverOhmicPowerDensityWPerM3[1], 45);
  assert.equal(out.fields.plasmaCurrentWorkDensityWPerM3[0], -8);
  close(out.energy.plasmaCollisionPowerW, 24 * V[0]);
  close(out.energy.coverOhmicPowerW, 45 * V[1]);
  close(out.energy.plasmaCurrentWorkW, -8 * V[0]);
  close(out.energy.instantaneousPhysicalAbsorptionPowerW, 24 * V[0] + 45 * V[1]);
  assert.equal(out.fields.plasmaCollisionPowerDensityWPerM3[2], 0);
  assert.match(out.definitions.densityBasis, /Do not apply fp or fc again/);
});

test('collisionless plasma current work can be negative while physical heating stays zero', () => {
  const s = fixture();
  s.parameters.plasmaCollisionFrequencyPerSecond = 0;
  s.fields.EphiVPerM[0] = 2; s.fields.plasmaJphiAPerM2[0] = -7;
  s.fields.plasmaAlphaSI[0] = 3; s.fields.plasmaFillFraction[0] = .5;
  const out = computePulseDiagnostics(s);
  assert.equal(out.fields.plasmaCurrentWorkDensityWPerM3[0], -14);
  assert.equal(out.energy.plasmaCollisionPowerW, 0);
  assert.equal(out.energy.instantaneousPhysicalAbsorptionPowerW, 0);
  assert.ok(out.energy.plasmaCurrentWorkW < 0);
});

test('audited frame reproduces existing transport, heating, deposits and authoritative solver ledger', () => {
  const out = computePulseDiagnostics(auditedFrame), { fields: f, diagnostics: d, grid: g } = auditedFrame;
  for (let i = 0; i < g.nr * g.nz; i++) {
    close(out.fields.radialFluxWPerM2[i], f.poyntingRadialWPerM2[i]);
    close(out.fields.axialFluxWPerM2[i], f.poyntingAxialWPerM2[i]);
    close(out.fields.plasmaCollisionPowerDensityWPerM3[i], f.plasmaCollisionPowerDensityWPerM3[i]);
    close(out.fields.coverOhmicPowerDensityWPerM3[i], f.joulePowerDensityWPerM3[i]);
    close(out.fields.plasmaCurrentWorkDensityWPerM3[i], f.plasmaCurrentWorkDensityWPerM3[i]);
  }
  close(out.energy.plasmaCollisionDepositedJ, d.plasmaCollisionHeatJ);
  close(out.energy.coverOhmicDepositedJ, d.coverOhmicHeatJ);
  assert.equal(out.energy.balanceResidualJ, d.energyBalanceResidualJ);
  close(out.energy.accountedEnergyJ, d.totalStoredEnergyJ + d.spongeLossJ);
  assert.equal(out.energy.fieldEnergyJ, d.fieldEnergyJ);
  assert.equal(out.energy.boundaryEnergyFluxJ, 0);
  assert.ok(Math.abs(out.energy.balanceResidualJ) / Math.abs(d.sourceWorkJ) < 1e-10);
  assert.ok(out.vacuumPort.cellIndices.length > 0);
  const Z0 = Math.sqrt(MU0 / EPS0);
  assert.equal(out.vacuumPort.impedanceOhm, Z0);
});

test('cumulative deposits preserve original midpoint integration rather than integrating snapshot power', () => {
  const m = createModel({
    ...quiet, sigmaSPerM: .02, sigmaLiquidSPerM: .02, coverFraction: .4,
    plasmaElectronDensityPerM3: 1e17, plasmaFillFraction: .35,
    plasmaCollisionFrequencyPerSecond: 2e9,
    initialCondition: { type: 'pec-eigenmode', amplitudeVPerM: 1000 },
  });
  const initial = m.snapshot();
  m.setFields({ JpPhiAPerM2: initial.fields.EphiVPerM.map((E, i) => initial.fields.plasmaAlphaSI[i] * E / 2e10) });
  const before = m.snapshot(), dt = m.dtMaxSeconds / 2;
  m.step(dt);
  const after = m.snapshot(), out = computePulseDiagnostics(after), V = after.grid.cellVolumesM3;
  const expectedPlasma = [], expectedCover = [];
  for (let i = 0; i < V.length; i++) {
    const E = (before.fields.EphiVPerM[i] + after.fields.EphiVPerM[i]) / 2;
    const J = (before.fields.plasmaJphiAPerM2[i] + after.fields.plasmaJphiAPerM2[i]) / 2;
    const alpha = before.fields.plasmaAlphaSI[i];
    expectedPlasma.push(alpha > 0 ? dt * before.parameters.plasmaCollisionFrequencyPerSecond * J ** 2 / alpha : 0);
    expectedCover.push(dt * before.fields.conductivitySPerM[i] * E ** 2);
    close(out.fields.plasmaCollisionDepositedEnergyDensityJPerM3[i], expectedPlasma[i]);
    close(out.fields.coverOhmicDepositedEnergyDensityJPerM3[i], expectedCover[i]);
  }
  close(out.energy.plasmaCollisionDepositedJ, integrate(expectedPlasma, V));
  close(out.energy.coverOhmicDepositedJ, integrate(expectedCover, V));
  close(out.energy.plasmaCollisionDepositedJ, after.diagnostics.plasmaCollisionHeatJ);
  close(out.energy.coverOhmicDepositedJ, after.diagnostics.coverOhmicHeatJ);
  assert.ok(out.energy.plasmaCollisionDepositedJ > 0 && out.energy.coverOhmicDepositedJ > 0);
  assert.ok(Math.abs(out.energy.coverOhmicDepositedJ - dt * out.energy.coverOhmicPowerW) > 1e-8 * out.energy.coverOhmicDepositedJ);
});

test('signed live thermal contact remains a transfer between destinations, not an extra absorption', () => {
  for (const plasmaInitialTemperatureK of [450, 250]) {
    const m = createModel({ ...quiet, plasmaElectronDensityPerM3: 1e17, plasmaInitialTemperatureK, thermalContactConductanceWPerM3K: 1e8, coverFraction: .4 });
    m.step(1e-11);
    const s = m.snapshot(), out = computePulseDiagnostics(s), e = out.energy;
    assert.equal(e.fieldEnergyJ, 0);
    assert.equal(e.plasmaCollisionDepositedJ, 0);
    assert.equal(e.coverOhmicDepositedJ, 0);
    assert.equal(e.instantaneousPhysicalAbsorptionPowerW, 0);
    assert.ok(plasmaInitialTemperatureK > s.parameters.initialTemperatureK ? e.contactTransferToCoverJ > 0 : e.contactTransferToCoverJ < 0);
    close(e.plasmaThermalEnergyJ, -e.contactTransferToCoverJ);
    close(e.coverThermalEnergyJ, e.contactTransferToCoverJ);
    close(e.plasmaThermalEnergyJ, integrate(out.fields.plasmaThermalEnergyDensityJPerM3, s.grid.cellVolumesM3));
    close(e.coverThermalEnergyJ, integrate(out.fields.coverThermalEnergyDensityJPerM3, s.grid.cellVolumesM3));
    const cancellationTolerance = 2e-13 * Math.abs(e.contactTransferToCoverJ);
    close(e.accountedEnergyJ, 0, 0, cancellationTolerance);
    close(e.balanceResidualJ, 0, 0, cancellationTolerance);
    close(e.plasmaContactConsistencyResidualJ, 0, 0, cancellationTolerance);
    close(e.coverContactConsistencyResidualJ, 0, 0, cancellationTolerance);
    close(e.thermalDepositionConsistencyResidualJ, 0, 0, cancellationTolerance);
  }
});

test('signed destination ledger counts stored heat once and does not add contact, deposition or mouth flow', () => {
  const s = fixture(), d = s.diagnostics;
  s.fields.plasmaCollisionDepositedEnergyDensityJPerM3[0] = 3 / s.grid.cellVolumesM3[0];
  s.fields.depositedEnergyDensityJPerM3[0] = 5 / s.grid.cellVolumesM3[0];
  Object.assign(d, { initialEnergyJ: 10, sourceWorkJ: 4, fieldEnergyJ: 4, plasmaDriftEnergyJ: 1, plasmaThermalEnergyJ: -4, coverThermalEnergyJ: 12, spongeLossJ: 1, contactTransferToCoverJ: 7, mouthNetPowerW: -123, mouthNetIntakeJ: -456 });
  const e = computePulseDiagnostics(s).energy;
  assert.equal(e.accountedEnergyJ, 14);
  assert.equal(e.availableEnergyJ, 14);
  assert.equal(e.balanceResidualJ, 0);
  close(e.plasmaCollisionDepositedJ, 3); close(e.coverOhmicDepositedJ, 5);
  close(e.plasmaContactConsistencyResidualJ, 0);
  close(e.coverContactConsistencyResidualJ, 0);
  close(e.thermalDepositionConsistencyResidualJ, 0);
  assert.equal(e.mouthNetPowerW, -123);
  assert.equal(e.mouthNetIntakeJ, -456);
});

test('zero and negative source work remain signed finite joules without invented percentages', () => {
  for (const sourceWorkJ of [0, -4]) {
    const s = fixture();
    Object.assign(s.diagnostics, { initialEnergyJ: 10, sourceWorkJ, fieldEnergyJ: 10 + sourceWorkJ });
    const e = computePulseDiagnostics(s).energy;
    assert.equal(e.sourceWorkJ, sourceWorkJ);
    assert.equal(e.availableEnergyJ, 10 + sourceWorkJ);
    assert.equal(e.accountedEnergyJ, 10 + sourceWorkJ);
    assert.equal(e.balanceResidualJ, 0);
    assert.equal(e.sourceWorkCanBeNegative, true);
    for (const [key, value] of Object.entries(e)) {
      assert.doesNotMatch(key, /percent|ratio|efficiency|fraction/i);
      if (typeof value === 'number') assert.ok(Number.isFinite(value), key);
    }
  }
});

test('live impressed current can extract energy and diagnostics preserve the solver source sign', () => {
  const m = createModel({ ...quiet, initialCondition: null, sourceEnabled: true, sourceStartSeconds: 0 });
  const initial = m.snapshot();
  m.setFields({ EphiVPerM: initial.grid.zM.flatMap(z => initial.grid.rM.map(r => -1000 * r / initial.parameters.radiusM * Math.sin(Math.PI * z / initial.parameters.lengthM))) });
  m.step(1e-12);
  const s = m.snapshot(), out = computePulseDiagnostics(s);
  assert.ok(out.energy.sourceWorkJ < 0);
  assert.equal(out.energy.sourceWorkJ, s.diagnostics.sourceWorkJ);
  assert.equal(out.energy.balanceResidualJ, s.diagnostics.energyBalanceResidualJ);
  assert.ok(Math.abs(out.energy.balanceResidualJ) < out.energy.initialEnergyJ * 1e-9);
});

test('vacuum characteristics give exact pure forward, pure backward, and zero channels', () => {
  for (const amplitude of [8, -8]) {
    const forward = vacuumCharacteristics(amplitude, -amplitude / 4, 4);
    assert.equal(forward.plusElectricVPerM, amplitude);
    assert.equal(forward.minusElectricVPerM, 0);
    assert.equal(forward.forwardCharacteristicFluxWPerM2, 16);
    assert.equal(forward.backwardCharacteristicFluxWPerM2, 0);
    assert.equal(forward.netAxialFluxWPerM2, 16);
    assert.equal(forward.identityResidualWPerM2, 0);
    const backward = vacuumCharacteristics(amplitude, amplitude / 4, 4);
    assert.equal(backward.plusElectricVPerM, 0);
    assert.equal(backward.minusElectricVPerM, amplitude);
    assert.equal(backward.forwardCharacteristicFluxWPerM2, 0);
    assert.equal(backward.backwardCharacteristicFluxWPerM2, 16);
    assert.equal(backward.netAxialFluxWPerM2, -16);
    assert.equal(backward.identityResidualWPerM2, 0);
  }
  const zero = vacuumCharacteristics(0, 0, 4);
  for (const value of Object.values(zero)) assert.equal(Math.abs(value), 0);
});

test('mixed vacuum channels obey forward minus backward equals signed axial Poynting flux', () => {
  for (const E of [-8, -2, 0, 2, 8]) for (const H of [-3, -.5, 0, .5, 3]) {
    const channels = vacuumCharacteristics(E, H, 4);
    // Numeric equality intentionally treats +0 and -0 as the same flux.
    assert.ok(channels.forwardCharacteristicFluxWPerM2 - channels.backwardCharacteristicFluxWPerM2 === -E * H);
    assert.equal(channels.identityResidualWPerM2, 0);
  }
  const Z0 = Math.sqrt(MU0 / EPS0), physical = vacuumCharacteristics(12, -.08);
  close(physical.forwardCharacteristicFluxWPerM2, ((12 + Z0 * .08) / 2) ** 2 / Z0);
  close(physical.forwardCharacteristicFluxWPerM2 - physical.backwardCharacteristicFluxWPerM2, .96);
});

test('vacuum port excludes every material/plasma property and radial sponge annulus then integrates areas', () => {
  const s = fixture(); s.parameters.spongeRatePerSecond = 1;
  const first = 6 * s.grid.nr;
  s.fields.materialFillFraction[first] = .25;
  s.fields.plasmaFillFraction[first + 1] = .1;
  s.fields.plasmaAlphaSI[first + 2] = 2;
  s.fields.conductivitySPerM[first + 3] = .5;
  s.fields.EphiVPerM[first + 4] = 8; s.fields.HrAPerM[first + 4] = -2;
  s.fields.EphiVPerM[first + 5] = -4; s.fields.HrAPerM[first + 5] = -1;
  const port = computePulseDiagnostics(s, { vacuumPlaneZM: 6.5 }).vacuumPort;
  assert.equal(port.status, 'ready'); assert.equal(port.planeZM, 6.5); assert.equal(port.axialIndex, 6);
  assert.deepEqual(port.cellIndices, [first + 4, first + 5]);
  assert.deepEqual(port.cells.map(cell => cell.index), port.cellIndices);
  close(port.cells[0].areaM2, 9 * Math.PI); close(port.cells[1].areaM2, 11 * Math.PI);
  close(port.sampledAreaM2, 20 * Math.PI);
  close(port.forwardCharacteristicPowerW, 144 * Math.PI);
  close(port.backwardCharacteristicPowerW, 44 * Math.PI);
  close(port.netAxialPowerW, 100 * Math.PI);
  close(port.characteristicIdentityResidualW, 0, 2e-13, 1e-12);
  assert.match(port.caveat, /not separated incident\/scattered waves/);
});

test('source Gaussian port mask suppresses at eight axial widths and rejects the boundary row', () => {
  const s = fixture(), port = computePulseDiagnostics(s, { vacuumPlaneZM: 2.5 }).vacuumPort;
  assert.equal(port.sourceTailLimitZM, s.parameters.sourceCenterZM + 8 * s.parameters.sourceWidthZM);
  assert.equal(port.planeZM, 3.5);
  assert.ok(port.planeZM > port.sourceTailLimitZM);
  assert.ok(port.axialGaussianTailFactorUpperBound <= Math.exp(-32));
  assert.equal(port.axialGaussianTailFactorUpperBound, Math.exp(-.5 * ((3.5 - .5) / .25) ** 2));
});

test('axial and radial sponge masks require the whole sampled annulus to be undamped', () => {
  const s = fixture();
  Object.assign(s.parameters, { spongeRatePerSecond: 1, spongeFraction: .2, sourceWidthZM: .05 });
  const lower = computePulseDiagnostics(s, { vacuumPlaneZM: 2.5 }).vacuumPort;
  assert.equal(lower.planeZM, 3.5);
  const upper = computePulseDiagnostics(s, { vacuumPlaneZM: 9.5 }).vacuumPort;
  assert.equal(upper.planeZM, 8.5);
  for (const port of [lower, upper]) {
    assert.ok(port.planeZM - s.grid.dzM / 2 >= s.parameters.lengthM * .2);
    assert.ok(port.planeZM + s.grid.dzM / 2 <= s.parameters.lengthM * .8);
    for (const cell of port.cells) assert.ok(cell.rM + s.grid.drM / 2 <= s.parameters.radiusM * .8);
  }
});

test('zero-rate or zero-width sponge does not mask undamped cells and port stays before the cover', () => {
  for (const [spongeRatePerSecond, spongeFraction] of [[0, .2], [1, 0]]) {
    const s = fixture(); Object.assign(s.parameters, { spongeRatePerSecond, spongeFraction });
    const port = computePulseDiagnostics(s, { vacuumPlaneZM: 99 }).vacuumPort;
    assert.equal(port.planeZM, 9.5);
    assert.equal(port.cellIndices.length, s.grid.nr);
    assert.ok(port.planeZM < s.parameters.cylinderStartM);
  }
});

test('unavailable port reports null powers when there is no suppressed vacuum row or eligible annulus', () => {
  const cases = [fixture(), fixture(), fixture()];
  cases[0].parameters.sourceWidthZM = 2;
  cases[1].fields.materialFillFraction.fill(.25);
  cases[2].grid.zM.fill(.5);
  for (const s of cases) {
    const port = computePulseDiagnostics(s).vacuumPort;
    assert.equal(port.status, 'unavailable');
    for (const key of ['planeZM', 'axialIndex', 'forwardCharacteristicPowerW', 'backwardCharacteristicPowerW', 'netAxialPowerW', 'characteristicIdentityResidualW']) assert.equal(port[key], null, key);
    assert.equal(port.sampledAreaM2, 0);
    assert.deepEqual(port.cellIndices, []); assert.deepEqual(port.cells, []);
    assert.match(port.unavailableReason, /No characteristic power is invented/);
  }
});

test('diagnostics are pure for frozen snapshots and returned fields never alias the input', () => {
  const s = fixture();
  s.fields.plasmaCollisionDepositedEnergyDensityJPerM3[0] = 2;
  s.fields.plasmaThermalEnergyDensityJPerM3[0] = -3;
  const before = JSON.stringify(s), out = computePulseDiagnostics(freezeTree(s));
  assert.equal(JSON.stringify(s), before);
  for (const [key, values] of Object.entries(out.fields)) {
    assert.notEqual(values, s.fields[key], key);
    values.fill(123);
  }
  out.vacuumPort.cellIndices.fill(-1); out.energy.sourceWorkJ = 456;
  assert.equal(JSON.stringify(s), before);
});

test('typed snapshot arrays produce independent ordinary output arrays without mutation', () => {
  const s = fixture();
  for (const key of Object.keys(s.fields)) s.fields[key] = Float64Array.from(s.fields[key]);
  for (const key of ['rM', 'zM', 'cellVolumesM3']) s.grid[key] = Float64Array.from(s.grid[key]);
  s.fields.EphiVPerM[0] = -2; s.fields.HzAPerM[0] = 3;
  const before = structuredClone(s), out = computePulseDiagnostics(s);
  assert.equal(out.fields.radialFluxWPerM2[0], -6);
  assert.ok(Object.values(out.fields).every(Array.isArray));
  out.fields.plasmaThermalEnergyDensityJPerM3[0] = 999;
  assert.deepEqual(s, before);
});

test('diagnostics do not advance or alter a live Maxwell/Drude model', () => {
  const m = createModel({ ...quiet, plasmaElectronDensityPerM3: 1e17, initialCondition: { type: 'pec-eigenmode', amplitudeVPerM: 1000 } });
  m.step(1e-11);
  const s = m.snapshot({ includeStaggered: true }), before = JSON.stringify(s);
  computePulseDiagnostics(s);
  assert.equal(JSON.stringify(s), before);
  assert.equal(JSON.stringify(m.snapshot({ includeStaggered: true })), before);
});

test('invalid snapshots, grid sizes, options and scalar inputs fail with explicit errors', () => {
  for (const bad of [undefined, null, 1, {}, { grid: {} }]) assert.throws(() => computePulseDiagnostics(bad), /complete .* snapshot/);
  for (const options of [null, [], 3]) assert.throws(() => computePulseDiagnostics(fixture(), options), /options must be an object/);
  assert.throws(() => computePulseDiagnostics(fixture(), { reflectionPercent: true }), /Unknown diagnostic option/);
  assert.throws(() => computePulseDiagnostics(fixture(), { vacuumPlaneZM: NaN }), /vacuumPlaneZM must be finite/);
  const mutations = [
    [s => { s.grid.nr = 0; }, /positive r-z grid/],
    [s => { s.grid.nz = 1.5; }, /positive r-z grid/],
    [s => { s.grid.drM = 0; }, /drM must be finite/],
    [s => { s.grid.dzM = Infinity; }, /dzM must be finite/],
    [s => { s.timeSeconds = -1; }, /timeSeconds must be finite/],
    [s => { s.parameters.sourceWidthZM = 0; }, /sourceWidthZM must be finite/],
    [s => { s.parameters.plasmaCollisionFrequencyPerSecond = -1; }, /plasmaCollisionFrequencyPerSecond must be finite/],
    [s => { s.constants.epsilon0FPerM = 0; }, /epsilon0FPerM must be finite/],
    [s => { s.constants.mu0HPerM = NaN; }, /mu0HPerM must be finite/],
    [s => { s.diagnostics.sourceWorkJ = Infinity; }, /sourceWorkJ must be finite/],
    [s => { delete s.diagnostics.contactTransferToCoverJ; }, /contactTransferToCoverJ must be finite/],
  ];
  for (const [mutate, message] of mutations) {
    const s = fixture(); mutate(s);
    assert.throws(() => computePulseDiagnostics(s), message);
  }
});

test('bad arrays, nonfinite values, negative deposits, invalid fractions and unsupported plasma current are rejected', () => {
  const mutations = [
    [s => { s.fields.EphiVPerM.pop(); }, /EphiVPerM requires/],
    [s => { s.fields.HrAPerM = 'zero'; }, /HrAPerM requires/],
    [s => { s.fields.HzAPerM[2] = NaN; }, /HzAPerM must be finite/],
    [s => { s.fields.plasmaJphiAPerM2[2] = Infinity; }, /plasmaJphiAPerM2 must be finite/],
    [s => { s.fields.plasmaAlphaSI[2] = -1; }, /plasmaAlphaSI must be finite/],
    [s => { s.fields.conductivitySPerM[2] = -1; }, /conductivitySPerM must be finite/],
    [s => { s.grid.cellVolumesM3[2] = 0; }, /cellVolumesM3 must be finite/],
    [s => { s.grid.rM.pop(); }, /rM requires/],
    [s => { s.grid.zM[2] = -1; }, /zM must be finite/],
    [s => { s.fields.materialFillFraction[2] = 1.01; }, /materialFillFraction must not exceed 1/],
    [s => { s.fields.plasmaFillFraction[2] = -.01; }, /plasmaFillFraction must be finite/],
    [s => { s.fields.plasmaFillFraction[2] = 1.01; }, /plasmaFillFraction must not exceed 1/],
    [s => { s.fields.plasmaJphiAPerM2[2] = 1; }, /current cannot be nonzero where alpha is zero/],
    [s => { s.fields.plasmaCollisionDepositedEnergyDensityJPerM3[2] = -1; }, /plasmaCollisionDepositedEnergyDensityJPerM3 must be finite/],
    [s => { s.fields.depositedEnergyDensityJPerM3[2] = -1; }, /depositedEnergyDensityJPerM3 must be finite/],
    [s => { s.fields.plasmaDriftEnergyDensityJPerM3[2] = -1; }, /plasmaDriftEnergyDensityJPerM3 must be finite/],
    [s => { s.fields.plasmaThermalEnergyDensityJPerM3[2] = NaN; }, /plasmaThermalEnergyDensityJPerM3 must be finite/],
    [s => { s.fields.coverThermalEnergyDensityJPerM3.pop(); }, /coverThermalEnergyDensityJPerM3 requires/],
  ];
  for (const [mutate, message] of mutations) {
    const s = fixture(); mutate(s);
    assert.throws(() => computePulseDiagnostics(s), message);
  }
});

test('vacuum characteristics reject invalid scalars and nonpositive impedance', () => {
  for (const [E, H, Z] of [[NaN, 0, 4], [0, Infinity, 4], [0, 0, 0], [0, 0, -4], ['2', 0, 4]]) {
    assert.throws(() => vacuumCharacteristics(E, H, Z), /must be finite/);
  }
});
