'use strict';
// Independent observables and analytic references. No engine RHS or diagnostics
// are reused to derive conservation residuals, Fourier errors or convergence.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const P = require('../backend/phase-mhd.js');
const GAMMA = 5 / 3;
const sum = values => values.reduce((a, b) => a + b, 0);
const rms = values => Math.sqrt(sum(values.map(x => x * x)) / values.length);
const uniform = {
  densityContrast: 0, temperatureContrast: 0, flowSpeed: 0,
  magneticStrength: 0, guideFieldX: 0, guideFieldY: 0,
  resistivity: 0, viscosity: 0, thermalConductivity: 0,
  concentrationDiffusivity: 0, phaseDiffusivity: 0,
  phaseGrowth: 0, phaseNonlinearity: .1, phaseFrequency: 0,
  phaseThermalCoupling: 0, phaseDensityCoupling: 0,
  phaseMagneticCoupling: 0, phaseDispersion: 0,
  phaseSeedAmplitude: .1, ironTemperatureK: 1000, ironContrast: 0,
  ironHeatingWkg: 0, ironBathCouplingWkgK: 0, ironConductivityWMK: 0
};

function independentlyMeasure(frame) {
  const n = frame.grid.nx, dx = frame.grid.dx, area = dx * dx;
  const at = (i, j) => ((j + n) % n) * n + ((i + n) % n);
  const bx = frame.staggeredMagneticField.bxFaces;
  const by = frame.staggeredMagneticField.byFaces;
  const f = frame.fields, u = frame.conserved;
  let divergenceMax = 0, eosEnergyMaxError = 0, magneticEnergy = 0;
  let kineticEnergy = 0, thermalEnergy = 0, materialPartitionMaxError = 0;
  let minDensity = Infinity, minPressure = Infinity, minMaterialK = Infinity;
  let maxConcentrationViolation = 0, allFinite = true;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = at(i, j), bxc = (bx[k] + bx[at(i + 1, j)]) / 2;
    const byc = (by[k] + by[at(i, j + 1)]) / 2;
    divergenceMax = Math.max(divergenceMax,
      Math.abs((bx[at(i + 1, j)] - bx[k] + by[at(i, j + 1)] - by[k]) / dx));
    const rho = u.density[k], kinetic = (u.momentumX[k] ** 2 + u.momentumY[k] ** 2) / (2 * rho);
    const magnetic = (bxc ** 2 + byc ** 2) / 2;
    const thermal = rho * f.temperature[k] / (GAMMA - 1);
    eosEnergyMaxError = Math.max(eosEnergyMaxError, Math.abs(thermal + kinetic + magnetic - u.totalEnergy[k]));
    magneticEnergy += magnetic * area; kineticEnergy += kinetic * area; thermalEnergy += thermal * area;
    minDensity = Math.min(minDensity, rho); minPressure = Math.min(minPressure, rho * f.temperature[k]);
    minMaterialK = Math.min(minMaterialK, frame.materials.iron.temperatureK[k]);
    maxConcentrationViolation = Math.max(maxConcentrationViolation, -f.concentration[k], f.concentration[k] - 1);
    const material = frame.materials.iron;
    materialPartitionMaxError = Math.max(materialPartitionMaxError, Math.abs(
      material.solidFraction[k] + material.liquidFraction[k] + material.vaporFraction[k] + material.plasmaFraction[k] - 1));
  }
  for (const values of [...Object.values(f), ...Object.values(u), bx, by,
    ...Object.values(frame.materials.iron).filter(Array.isArray)]) {
    for (const value of values) allFinite = allFinite && Number.isFinite(value);
  }
  return { mass: sum(u.density) * area, energy: sum(u.totalEnergy) * area,
    momentumX: sum(u.momentumX) * area, momentumY: sum(u.momentumY) * area,
    concentrationMass: sum(u.concentrationMass) * area, divergenceMax,
    eosEnergyMaxError, magneticEnergy, kineticEnergy, thermalEnergy,
    ironMeanEnthalpy: sum(frame.materials.iron.enthalpyJkg) / (n * n),
    minDensity, minPressure, minMaterialK, maxConcentrationViolation,
    materialPartitionMaxError, allFinite };
}

function conservationCases() {
  const cases = [
    { name: 'default_32', parameters: { resolution: 32 }, intervals: [.1, .1, .1] },
    { name: 'ideal_16', parameters: { resolution: 16, resistivity: 0, viscosity: 0, thermalConductivity: 0,
      concentrationDiffusivity: 0, ironHeatingWkg: 0, ironBathCouplingWkgK: 0 }, intervals: [.1, .1] },
    { name: 'strong_fields_and_diffusion_16', parameters: { resolution: 16, densityContrast: .5,
      temperatureContrast: .5, flowSpeed: 1, magneticStrength: 2, guideFieldX: -2, guideFieldY: 2,
      resistivity: .1, viscosity: .1, thermalConductivity: .1, concentrationDiffusivity: .1, cfl: .35 }, intervals: [.02, .02] }
  ];
  return cases.map(spec => {
    const model = P.createModel(spec.parameters), initial = independentlyMeasure(model.snapshot());
    const samples = [initial];
    for (const dt of spec.intervals) samples.push(independentlyMeasure(model.step(dt)));
    const last = model.snapshot();
    return { name: spec.name, time: last.time, parameters: spec.parameters,
      relativeMassResidual: Math.max(...samples.map(s => Math.abs(s.mass / initial.mass - 1))),
      relativeEnergyResidual: Math.max(...samples.map(s => Math.abs(s.energy / initial.energy - 1))),
      momentumResidual: Math.max(...samples.map(s => Math.hypot(s.momentumX - initial.momentumX, s.momentumY - initial.momentumY))),
      concentrationMassResidual: Math.max(...samples.map(s => Math.abs(s.concentrationMass - initial.concentrationMass))),
      maxStaggeredDivergence: Math.max(...samples.map(s => s.divergenceMax)),
      maxEOSReconstructionError: Math.max(...samples.map(s => s.eosEnergyMaxError)),
      minDensity: Math.min(...samples.map(s => s.minDensity)), minPressure: Math.min(...samples.map(s => s.minPressure)),
      minMaterialK: Math.min(...samples.map(s => s.minMaterialK)),
      maxConcentrationViolation: Math.max(...samples.map(s => s.maxConcentrationViolation)),
      maxMaterialPartitionError: Math.max(...samples.map(s => s.materialPartitionMaxError)),
      allFinite: samples.every(s => s.allFinite), samples,
      reportedAcceptedSteps: last.diagnostics.acceptedSteps, reportedRejectedSteps: last.diagnostics.rejectedSteps };
  });
}

function scalarRefinement(kind) {
  const velocity = kind === 'advection' ? .3 : 0;
  const diffusion = kind === 'diffusion' ? .05 : 0;
  const targetTime = .4;
  const cases = [16, 32, 64].map(n => {
    const model = P.createModel({ ...uniform, resolution: n, concentrationDiffusivity: diffusion },
      (x, y) => ({ vx: velocity, vy: 0, concentration: .5 + .2 * Math.sin(x), psiRe: .1, psiIm: 0 }));
    const frame = model.step(targetTime), errors = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = (i + .5) * 2 * Math.PI / n;
      const exact = .5 + .2 * Math.exp(-diffusion * targetTime) * Math.sin(x - velocity * targetTime);
      errors.push(frame.fields.concentration[j * n + i] - exact);
    }
    return { resolution: n, rmsError: rms(errors), time: frame.time,
      massResidual: frame.diagnostics.relativeMassError, energyResidual: frame.diagnostics.relativeEnergyError };
  });
  for (let i = 1; i < cases.length; i++) cases[i].observedOrder = Math.log2(cases[i - 1].rmsError / cases[i].rmsError);
  return { equation: 'c_t + v c_x = D c_xx', exact: '0.5 + 0.2 exp(-D t) sin(x-v t)',
    velocity, diffusivity: diffusion, time: targetTime, cases,
    qualification: 'The Rusanov scalar flux adds numerical diffusion from the MHD signal speed. Convergence is to the continuum solution; finite-grid diffusivity is not the input diffusivity alone.' };
}

function resistiveRefinement() {
  const amplitude = .001, resistivity = .05, targetTime = .4;
  const project = frame => {
    const n = frame.grid.nx;
    return 2 * sum(frame.fields.by.map((b, k) => b * Math.sin((k % n + .5) * 2 * Math.PI / n))) / (n * n);
  };
  const cases = [16, 32, 64].map(n => {
    const model = P.createModel({ ...uniform, resolution: n, resistivity }, (x, y) => ({
      magneticPotential: -amplitude * Math.cos(x), density: 1, pressure: 1,
      vx: 0, vy: 0, concentration: .5, psiRe: .1, psiIm: 0 }));
    const initial = model.snapshot(), frame = model.step(targetTime);
    const initialAmplitude = project(initial), ratio = project(frame) / initialAmplitude;
    const expectedRatio = Math.exp(-resistivity * targetTime);
    const measurement = independentlyMeasure(frame);
    return { resolution: n, measuredDecayRatio: ratio, expectedDecayRatio: expectedRatio,
      ratioError: Math.abs(ratio - expectedRatio), maxStaggeredDivergence: measurement.divergenceMax,
      magneticEnergyChange: measurement.magneticEnergy - independentlyMeasure(initial).magneticEnergy,
      energyResidual: frame.diagnostics.relativeEnergyError,
      maxFlowGenerated: Math.max(...frame.fields.vx.map(Math.abs), ...frame.fields.vy.map(Math.abs)) };
  });
  for (let i = 1; i < cases.length; i++) cases[i].observedOrder = Math.log2(cases[i - 1].ratioError / cases[i].ratioError);
  return { equation: 'B_y,t = eta B_y,xx in the small-amplitude, zero-flow limit',
    amplitude, resistivity, time: targetTime, cases,
    qualification: 'Magnetic force and pressure response are O(amplitude^2); they are measured below. Rusanov/CT magnetic diffusion also vanishes only by grid refinement.' };
}

function complexTemporalRefinement() {
  const growth = .7, nonlinearity = .8, frequency = .5, re0 = .4, im0 = .1, time = .1;
  const q0 = re0 * re0 + im0 * im0;
  const denominator = 1 + nonlinearity * q0 / growth * Math.expm1(2 * growth * time);
  const q = q0 * Math.exp(2 * growth * time) / denominator;
  const theta = Math.atan2(im0, re0) - frequency / (2 * nonlinearity) * Math.log(denominator);
  const exactRe = Math.sqrt(q) * Math.cos(theta), exactIm = Math.sqrt(q) * Math.sin(theta);
  const cases = [.01, .005, .0025].map(dt => {
    const model = P.createModel({ ...uniform, resolution: 16, phaseGrowth: growth,
      phaseNonlinearity: nonlinearity, phaseFrequency: frequency }, () => ({
      vx: 0, vy: 0, concentration: .5, psiRe: re0, psiIm: im0 }));
    for (let i = 0; i < Math.round(time / dt); i++) model.step(dt);
    const frame = model.snapshot();
    const error = Math.hypot(frame.fields.psiRe[0] - exactRe, frame.fields.psiIm[0] - exactIm);
    return { requestedDt: dt, acceptedSteps: frame.diagnostics.acceptedSteps, error,
      re: frame.fields.psiRe[0], im: frame.fields.psiIm[0] };
  });
  for (let i = 1; i < cases.length; i++) cases[i].observedOrder = Math.log2(cases[i - 1].error / cases[i].error);
  return { equation: 'psi_t = (g-b|psi|^2)psi - i omega |psi|^2 psi',
    reference: 'Exact logistic amplitude and integrated phase for uniform psi',
    time, growth, nonlinearity, frequency, exactRe, exactIm, cases };
}

function ironLaboratory() {
  const constants = { referenceK: 298.15, meltingK: 1811, boilingK: 3134,
    solidCp: 450, liquidCp: 820, vaporCp: 372.2, fusion: 13810 / .055845, vaporization: 340000 / .055845 };
  const hm = constants.solidCp * (constants.meltingK - constants.referenceK);
  const hl = hm + constants.fusion;
  const hb = hl + constants.liquidCp * (constants.boilingK - constants.meltingK);
  const hg = hb + constants.vaporization;
  const transitionChecks = [
    { enthalpy: hm, expectedTemperature: 1811, expectedSolid: 1, expectedLiquid: 0, expectedTotalVapor: 0 },
    { enthalpy: hm + .25 * constants.fusion, expectedTemperature: 1811, expectedSolid: .75, expectedLiquid: .25, expectedTotalVapor: 0 },
    { enthalpy: hl, expectedTemperature: 1811, expectedSolid: 0, expectedLiquid: 1, expectedTotalVapor: 0 },
    { enthalpy: hb, expectedTemperature: 3134, expectedSolid: 0, expectedLiquid: 1, expectedTotalVapor: 0 },
    { enthalpy: hb + .4 * constants.vaporization, expectedTemperature: 3134, expectedSolid: 0, expectedLiquid: .6, expectedTotalVapor: .4 },
    { enthalpy: hg, expectedTemperature: 3134, expectedSolid: 0, expectedLiquid: 0, expectedTotalVapor: 1 }
  ].map(reference => ({ ...reference, actual: P.ironFromEnthalpy(reference.enthalpy) }));
  const heating = 100000, secondsPerUnit = 100, totalTime = .8;
  const model = P.createModel({ ...uniform, resolution: 16, ironTemperatureK: 1700,
    ironHeatingWkg: heating, timeScaleSeconds: secondsPerUnit });
  const initial = independentlyMeasure(model.snapshot());
  const snapshots = [], dt = .01;
  for (let i = 0; i < Math.round(totalTime / dt); i++) {
    const frame = model.step(dt), m = independentlyMeasure(frame);
    snapshots.push({ time: frame.time, meanEnthalpy: m.ironMeanEnthalpy,
      expectedMeanEnthalpy: initial.ironMeanEnthalpy + heating * secondsPerUnit * frame.time,
      temperatureK: frame.materials.iron.temperatureK[0], solid: frame.materials.iron.solidFraction[0],
      liquid: frame.materials.iron.liquidFraction[0], totalVapor: frame.materials.iron.vaporFraction[0] + frame.materials.iron.plasmaFraction[0] });
  }
  const conduction = P.createModel({ ...uniform, resolution: 16, ironTemperatureK: 1000,
    ironContrast: .1, ironConductivityWMK: 80 });
  const initialConduction = independentlyMeasure(conduction.snapshot());
  const finalConduction = independentlyMeasure(conduction.step(.2));
  return { constants, thresholdsJkg: { solidToMelt: hm, fullLiquid: hl, liquidToBoil: hb, fullVapor: hg },
    transitionChecks, heatingWkg: heating, secondsPerUnit, snapshots,
    maxHeatingBalanceErrorJkg: Math.max(...snapshots.map(x => Math.abs(x.meanEnthalpy - x.expectedMeanEnthalpy))),
    conductionMeanEnthalpyResidualJkg: finalConduction.ironMeanEnthalpy - initialConduction.ironMeanEnthalpy,
    conductionMinimumTemperatureK: finalConduction.minMaterialK,
    qualification: 'This verifies the declared constant-Cp piecewise enthalpy model; it does not establish agreement with a pressure-dependent iron EOS or temperature-dependent experimental heat capacities.' };
}

function windingCase() {
  const model = P.createModel({ ...uniform, resolution: 32 }, (x, y) => ({ psiRe: Math.cos(x + .37), psiIm: Math.cos(y + .53) }));
  const frame = model.snapshot(), expected = [];
  for (const [a, x] of [Math.PI / 2, 3 * Math.PI / 2].map((v, k) => [k, v - .37])) {
    for (const [b, y] of [Math.PI / 2, 3 * Math.PI / 2].map((v, k) => [k, v - .53])) expected.push({ x, y, charge: a === b ? 1 : -1 });
  }
  const distances = expected.map(point => {
    const candidates = frame.defects.filter(d => d.charge === point.charge);
    return Math.min(...candidates.map(d => Math.hypot(d.x - point.x, d.y - point.y)));
  });
  const n = 16, re = Float64Array.from({ length: n * n }, (_, k) => k % 2 ? -1 : 1), im = new Float64Array(n * n);
  const ambiguous = P.winding(re, im, n, 2 * Math.PI);
  return { reference: 'psi=cos(x+0.37)+i cos(y+0.53); four simple zeros with Jacobian-sign charges',
    expected, actual: frame.defects, netCharge: sum(frame.defects.map(d => d.charge)),
    maximumZeroLocationError: Math.max(...distances), gridSpacing: frame.grid.dx,
    deliberatelyAmbiguousPiEdges: ambiguous.ambiguousEdges };
}

function run() {
  const source = fs.readFileSync(path.join(__dirname, '../backend/phase-mhd.js'));
  const report = { schema: 'phase-numerical-verification/1', generatedAt: new Date().toISOString(),
    sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
    nature: 'Independent numerical verification from exported conserved/staggered states and analytic test problems. No empirical validation is claimed.',
    conservation: conservationCases(), scalarAdvection: scalarRefinement('advection'),
    scalarDiffusion: scalarRefinement('diffusion'), resistiveDecay: resistiveRefinement(),
    complexReaction: complexTemporalRefinement(), iron: ironLaboratory(), winding: windingCase(),
    audit: {
      induction: 'E_z=v_y B_x-v_x B_y+eta J_z; B_x,t=-d_y E_z and B_y,t=d_x E_z. The discrete divergence of a shared-corner curl cancels.',
      energy: 'Conservative ideal flux (E+p+B^2/2)v-(v dot B)B; resistive Poynting flux eta J cross B has x=-eta J_z B_y and y=eta J_z B_x. Viscous flux is -tau dot v; conductive flux is -k grad(p/rho). Periodic sums telescope.',
      phase: 'The implemented rotation is negative nonlinear frequency: -i omega |psi|^2 psi. Diffusion has coefficient D(1+i beta). Coupling is one-way from the MHD state.',
      iron: 'Iron conduction is k/rho_Fe times the temperature Laplacian in an enthalpy equation. Its periodic mean vanishes; external heating/bath exchange is a separate energy ledger and is not removed from MHD.'
    },
    limits: [
      'First-order spatial Rusanov fluxes and arithmetic corner EMF introduce substantial numerical diffusion at 16-64 cells. SSP RK2 temporal order does not imply second-order space accuracy.',
      'Global total-energy conservation and divergence preservation do not guarantee accurate local shock structure or physical dissipative heating. The resolved Ohmic/viscous integrals are estimates, not an exact entropy/thermal-energy balance.',
      'Only two in-plane magnetic/velocity components are evolved. This is a local, Cartesian, periodic nonrelativistic model; no Kerr gravity, curvature, horizon, accretion, ray transfer, cover mechanics or radiation are solved.',
      'Fixed gamma=5/3 and mean molecular weight=0.5 define the MHD EOS. Saha fractions are diagnostic LTE references; ionization energy and particle-number changes do not feed back into the gas energy.',
      'Complex phase is a declared neutral phenomenological field. Magnetic angle is a direction diagnostic; field zeros/windings do not establish superconductivity, a quantum condensate or flux quantization.',
      'Iron has approximate constant heat capacities, fixed transition temperatures and fixed latent heats; no pressure-dependent phase diagram, expansion, mechanics or coupled material-plasma energy exchange is represented.',
      'Tests cover smooth Fourier modes, representative parameter states, enthalpy thresholds and replay. They are not a calibrated turbulent-plasma benchmark, high-Mach shock suite, kinetic model or observational validation.'
    ],
    references: [
      { title: 'Stone et al. (2008), Athena: A New Code for Astrophysical MHD', url: 'https://arxiv.org/abs/0804.0402', use: 'Reference for finite-volume MHD and constrained-transport verification; this engine is not Athena.' },
      { title: 'Gardiner and Stone (2005), An Unsplit Godunov Method for Ideal MHD via Constrained Transport', url: 'https://arxiv.org/abs/astro-ph/0501557', use: 'Reference for the divergence-preserving CT requirement; this engine does not implement their high-order method.' },
      { title: 'NIST-JANAF Iron reference table', url: 'https://janaf.nist.gov/tables/Fe-003.html', use: 'External thermochemical context. The declared constant-Cp laboratory is approximate and is not fitted to this table.' }
    ] };
  report.criteria = {
    conservation: 'Relative global mass/energy residual <2e-13; momentum/tracer residual <2e-12; staggered divergence <2e-12; positive finite physical states; material fractions sum to one within 2e-15.',
    spatialRefinement: 'Each 16->32->64 refinement reduces analytic error; observed order >0.75. Fine-grid scalar RMS <0.012; resistive decay-ratio error <0.015.',
    complexTemporalRefinement: 'Both timestep halvings give observed order >1.9; final complex absolute error <1e-7.',
    iron: 'Heating-ledger error <1e-6 J/kg; periodic-conduction mean residual <1e-7 J/kg; independently declared transition temperatures and mixture fractions agree within 1e-10 K/1e-13 fraction.',
    winding: 'Exactly four resolved simple zeros with two positive/two negative charges, net zero, and plaquette-location error <=dx/sqrt(2). Deliberately pi-edge samples are flagged ambiguous.',
    API: 'The separate node:test suite checks invalid patches/time inputs, trusted-callback transactional rollback, failed-step physical-state rollback, deterministic replay/reset and browser/backend byte identity.'
  };
  report.numericChecks = {
    conservation: report.conservation.every(x => x.relativeMassResidual < 2e-13 && x.relativeEnergyResidual < 2e-13 &&
      x.momentumResidual < 2e-12 && x.concentrationMassResidual < 2e-12 && x.maxStaggeredDivergence < 2e-12 &&
      x.minDensity > 0 && x.minPressure > 0 && x.minMaterialK > 1 && x.allFinite &&
      x.maxConcentrationViolation === 0 && x.maxMaterialPartitionError < 2e-15),
    scalarAdvection: report.scalarAdvection.cases.slice(1).every(x => x.observedOrder > .75) && report.scalarAdvection.cases.at(-1).rmsError < .012,
    scalarDiffusion: report.scalarDiffusion.cases.slice(1).every(x => x.observedOrder > .75) && report.scalarDiffusion.cases.at(-1).rmsError < .012,
    resistiveDecay: report.resistiveDecay.cases.every(x => x.measuredDecayRatio > 0 && x.measuredDecayRatio < 1 && x.magneticEnergyChange < 0 && x.maxFlowGenerated < 1e-6) &&
      report.resistiveDecay.cases.slice(1).every(x => x.observedOrder > .75) && report.resistiveDecay.cases.at(-1).ratioError < .015,
    complexReaction: report.complexReaction.cases.slice(1).every(x => x.observedOrder > 1.9) && report.complexReaction.cases.at(-1).error < 1e-7,
    ironBalance: report.iron.maxHeatingBalanceErrorJkg < 1e-6 && Math.abs(report.iron.conductionMeanEnthalpyResidualJkg) < 1e-7,
    ironTransitions: report.iron.transitionChecks.every(x => Math.abs(x.actual.temperatureK - x.expectedTemperature) < 1e-10 &&
      Math.abs(x.actual.solidFraction - x.expectedSolid) < 1e-13 && Math.abs(x.actual.liquidFraction - x.expectedLiquid) < 1e-13 &&
      Math.abs(x.actual.vaporFraction + x.actual.plasmaFraction - x.expectedTotalVapor) < 1e-13),
    winding: report.winding.actual.length === 4 && report.winding.actual.filter(x => x.charge === 1).length === 2 &&
      report.winding.actual.filter(x => x.charge === -1).length === 2 && report.winding.actual.every(x => x.resolved) &&
      report.winding.netCharge === 0 && report.winding.maximumZeroLocationError <= report.winding.gridSpacing / Math.SQRT2 + 1e-14 &&
      report.winding.deliberatelyAmbiguousPiEdges > 0
  };
  report.numericalVerificationPassed = Object.values(report.numericChecks).every(Boolean);
  return report;
}

module.exports = { independentlyMeasure, uniform, conservationCases, scalarRefinement,
  resistiveRefinement, complexTemporalRefinement, ironLaboratory, windingCase, run };
if (require.main === module) {
  const report = run();
  fs.writeFileSync(path.join(__dirname, 'phase-numerical-results.json'), JSON.stringify(report, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ sourceSha256: report.sourceSha256, passed: report.numericalVerificationPassed,
    conservation: report.conservation.map(x => ({ name: x.name, mass: x.relativeMassResidual, energy: x.relativeEnergyResidual, divB: x.maxStaggeredDivergence })),
    advection: report.scalarAdvection.cases, diffusion: report.scalarDiffusion.cases,
    resistiveDecay: report.resistiveDecay.cases, complexReaction: report.complexReaction.cases,
    ironHeatingBalanceErrorJkg: report.iron.maxHeatingBalanceErrorJkg,
    ironConductionBalanceErrorJkg: report.iron.conductionMeanEnthalpyResidualJkg,
    winding: { count: report.winding.actual.length, net: report.winding.netCharge } }, null, 2) + '\n');
}
