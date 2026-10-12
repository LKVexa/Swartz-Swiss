/* Stationary horizon reference formulas. GPL-3.0-only. */
(function (root, factory) {
  'use strict';
  const api = factory();
  root.RusslHorizonGR = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis, function () {
  'use strict';
  const tolerance = 1e-10;
  const limits = Object.freeze({ minMass: 1e-12, maxMass: 1e6, maxCoordinateRadius: 1e9, maxDifferential: 1e6, minMassKg: 1e-12, maxMassKg: 1e50 });
  const constants = Object.freeze({ G: 6.67430e-11, GStandardUncertainty: 1.5e-15,
    c: 299792458, h: 6.62607015e-34, hbar: 6.62607015e-34 / (2 * Math.PI), kB: 1.380649e-23,
    source: '2022 CODATA; G is measured, c/h/kB are exact SI definitions, hbar=h/(2*pi).',
    url: 'https://physics.nist.gov/cuu/pdf/all.pdf' });
  const references = Object.freeze([
    Object.freeze({ title: 'Adamo and Newman, The Kerr-Newman metric: A Review', url: 'https://arxiv.org/abs/1410.6626', scope: 'Boyer-Lindquist metric, horizon roots, area and first law; convert the source +--- signature to -+++.' }),
    Object.freeze({ title: 'Hawking, Particle creation by black holes (1975)', url: 'https://doi.org/10.1007/BF02345020', scope: 'Semiclassical horizon temperature.' }),
    Object.freeze({ title: 'NIST 2022 CODATA constants', url: constants.url, scope: 'SI constants and the Stefan-Boltzmann constant definition.' })
  ]);
  const units = Object.freeze({ convention: 'Geometrized natural units G=c=hbar=kB=1',
    M: 'geometrized mass length', a: 'J/M, a signed geometrized length', Q: 'geometrized charge length, not SI coulombs',
    radius: 'length', area: 'length squared', omegaH: 'inverse length', kappa: 'inverse length',
    temperature: 'natural temperature', entropy: 'dimensionless', phiH: 'geometrized electric potential' });

  function finite(value, name, minimum, maximum) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
      throw new RangeError(name + ' must be a finite number within ' + minimum + '..' + maximum + '.');
    }
    return value;
  }
  function checkedValues(values) {
    for (const [name, value] of Object.entries(values)) if (!Number.isFinite(value)) throw new RangeError(name + ' exceeds the finite numerical domain.');
  }
  function relation(lhs, rhs, scale) {
    const residual = lhs - rhs;
    const relativeResidual = Math.abs(residual) / (scale === undefined ? Math.max(Math.abs(lhs), Math.abs(rhs), Number.MIN_VALUE) : Math.max(scale, Number.MIN_VALUE));
    return { lhs, rhs, residual, relativeResidual, passed: relativeResidual <= tolerance, tolerance };
  }
  function horizon(M, a, Q) {
    finite(M, 'M', limits.minMass, limits.maxMass);
    finite(a, 'a', -limits.maxMass, limits.maxMass);
    finite(Q, 'Q', -limits.maxMass, limits.maxMass);
    // Factoring the M^2-a^2 difference retains near-extremal precision. No
    // tolerance or zero clamp converts a negative discriminant into a horizon.
    const directDiscriminant = M * M - a * a - Q * Q;
    const discriminant = (M - Math.abs(a)) * (M + Math.abs(a)) - Q * Q;
    if (directDiscriminant < 0 || discriminant < 0 || (Math.abs(a) === M && Q !== 0) || (Math.abs(Q) === M && a !== 0)) {
      throw new RangeError('Naked parameter set: M^2-a^2-Q^2 must be nonnegative; no horizon is admitted.');
    }
    const root = Math.sqrt(discriminant), rPlus = M + root;
    // The equivalent product formula avoids cancellation for a tiny inner root.
    const rMinus = (a * a + Q * Q) / rPlus;
    const denominator = rPlus * rPlus + a * a;
    return { M, a, Q, discriminant, root, rPlus, rMinus, denominator, extremal: discriminant === 0 };
  }

  function kerrNewman(M, a, Q) {
    const h = horizon(M, a, Q);
    const area = 4 * Math.PI * h.denominator;
    const omegaH = a / h.denominator, kappa = h.root / h.denominator, phiH = Q * h.rPlus / h.denominator;
    const J = a * M, temperature = kappa / (2 * Math.PI), entropy = area / 4;
    // The review's solved Mirr expression contains a factor-two typo; its own
    // mass formula and entropy-area relation agree with Mirr^2=A/(16*pi).
    const irreducibleMass = Math.sqrt(area / (16 * Math.PI));
    const smarr = relation(M, kappa * area / (4 * Math.PI) + 2 * omegaH * J + phiH * Q);
    const massRelation = relation(M * M, (irreducibleMass + Q * Q / (4 * irreducibleMass)) ** 2 + J * J / (4 * irreducibleMass ** 2));
    checkedValues({ area, omegaH, kappa, phiH, J, temperature, entropy, irreducibleMass });
    const checks = { smarr: { residual: smarr.relativeResidual, passed: smarr.passed },
      chargedMassRelation: { residual: massRelation.relativeResidual, passed: massRelation.passed } };
    return { M, a, Q, J, rPlus: h.rPlus, rMinus: h.rMinus, discriminant: h.discriminant,
      extremal: h.extremal, regime: h.extremal ? 'extremal algebraic limit' : 'nonextremal outer horizon',
      area, omegaH, kappa, phiH, temperature, entropy, irreducibleMass, smarr, massRelation,
      checks, passed: Object.values(checks).every(check => check.passed), tolerance, units,
      firstLawAvailable: !h.extremal,
      limitScope: h.extremal ? 'rPlus=rMinus and kappa=T=0. Generic M,a,Q area derivatives are singular here; no extremal first-law direction is inferred.' : 'The differential first law applies to variations within the nonextremal stationary family.',
      domain: 'Asymptotically flat stationary Einstein-Maxwell Kerr-Newman black hole',
      scope: 'Algebraic horizon data and semiclassical temperature/entropy in declared units. No trajectory, collapse, radiation spectrum, or Teukolsky perturbation PDE is solved.', references };
  }

  function metric(M, a, Q, r, theta) {
    const h = horizon(M, a, Q);
    finite(r, 'Boyer-Lindquist radius r', 0, limits.maxCoordinateRadius);
    finite(theta, 'polar angle theta in radians', 0, Math.PI);
    if (theta === 0 || theta === Math.PI) throw new RangeError('Polar-axis Boyer-Lindquist coordinates are singular: require 0<theta<pi.');
    if (r <= h.rPlus) throw new RangeError('Executable metric profile requires exterior r>rPlus; the horizon and interior coordinates are excluded.');
    const sineSquared = Math.sin(theta) ** 2;
    const sigma = r * r + a * a * Math.cos(theta) ** 2;
    const delta = (r - h.rPlus) * (r - h.rMinus);
    if (sigma === 0 || delta === 0 || sineSquared === 0) throw new RangeError('Metric coordinate singularity: Sigma, Delta, and sin(theta)^2 must be nonzero.');
    const numerator = 2 * M * r - Q * Q, ratio = numerator / sigma;
    const gtt = -(1 - ratio), gtphi = -a * ratio * sineSquared;
    const grr = sigma / delta, gthetatheta = sigma;
    const gphiphi = (r * r + a * a + a * a * ratio * sineSquared) * sineSquared;
    const matrix = [[gtt, 0, 0, gtphi], [0, grr, 0, 0], [0, 0, gthetatheta, 0], [gtphi, 0, 0, gphiphi]];
    const determinant = -sigma * sigma * sineSquared;
    const componentDeterminant = (gtt * gphiphi - gtphi * gtphi) * grr * gthetatheta;
    const frameOmega = -gtphi / gphiphi;
    checkedValues({ sigma, delta, gtt, gtphi, grr, gthetatheta, gphiphi, determinant, componentDeterminant, frameOmega });
    const determinantRelation = relation(determinant, componentDeterminant);
    const lorentzian = grr > 0 && gthetatheta > 0 && gphiphi > 0 && gtt * gphiphi - gtphi * gtphi < 0;
    const checks = { symmetry: { residual: 0, passed: true }, determinant: { residual: determinantRelation.relativeResidual, passed: determinantRelation.passed },
      lorentzianSignature: { residual: lorentzian ? 0 : 1, passed: lorentzian } };
    return { parameters: { M, a, Q, r, theta }, matrix, coordinates: ['t', 'r', 'theta', 'phi'], signature: '-+++',
      sigma, delta, determinant, componentDeterminant, determinantRelation, frameOmega,
      lineElementCrossCoefficient: 2 * gtphi, ergoregion: gtt > 0, rPlus: h.rPlus, rMinus: h.rMinus,
      checks, passed: Object.values(checks).every(check => check.passed), tolerance, units,
      domain: 'Real Kerr-Newman Boyer-Lindquist covariant metric tensor, exterior r>rPlus and 0<theta<pi',
      scope: 'Coordinate metric components; the dt*dphi line-element coefficient is 2*g[t,phi]. This tensor is not an amplitude-space operator. Near coordinate boundaries, a component determinant may be numerically ill-conditioned.', references };
  }

  function firstLaw(M, a, Q, dM, da, dQ) {
    const h = horizon(M, a, Q);
    if (h.extremal) throw new RangeError('Generic first-law directional derivatives require a nonextremal horizon.');
    for (const [name, value] of Object.entries({ dM, da, dQ })) finite(value, name, -limits.maxDifferential, limits.maxDifferential);
    const horizonData = kerrNewman(M, a, Q);
    const dRoot = (M * dM - a * da - Q * dQ) / h.root;
    const drPlus = dM + dRoot;
    const dA = 8 * Math.PI * (h.rPlus * drPlus + a * da);
    const dJ = a * dM + M * da, dS = dA / 4;
    const areaTerm = horizonData.kappa * dA / (8 * Math.PI);
    const angularTerm = horizonData.omegaH * dJ, chargeTerm = horizonData.phiH * dQ;
    const rhs = areaTerm + angularTerm + chargeTerm;
    const check = relation(dM, rhs, Math.max(Math.abs(dM), Math.abs(areaTerm) + Math.abs(angularTerm) + Math.abs(chargeTerm)));
    checkedValues({ dRoot, drPlus, dA, dJ, dS, areaTerm, angularTerm, chargeTerm, rhs });
    return { parameters: { M, a, Q }, direction: { dM, da, dQ }, dM, da, dQ, drPlus, dA, dJ, dS,
      terms: { area: areaTerm, angularMomentum: angularTerm, charge: chargeTerm }, rhs,
      residual: check.residual, relativeResidual: check.relativeResidual, checks: { differentialFirstLaw: { residual: check.relativeResidual, passed: check.passed } },
      passed: check.passed, tolerance, units, domain: 'Directional differential of a nonextremal stationary Kerr-Newman family',
      method: 'Analytic directional derivatives evaluated in binary64',
      scope: 'Checks dM=kappa*dA/(8*pi)+OmegaH*dJ+PhiH*dQ, with dJ=a*dM+M*da. A tangent is not a finite transition or physical trajectory.', references };
  }

  function schwarzschildSI(Mkg) {
    finite(Mkg, 'Schwarzschild mass in kilograms', limits.minMassKg, limits.maxMassKg);
    const { G, c, hbar, kB } = constants;
    const radius = 2 * G * Mkg / (c * c), area = 4 * Math.PI * radius * radius;
    const surfaceGravity = c ** 4 / (4 * G * Mkg);
    const temperature = hbar * c ** 3 / (8 * Math.PI * G * Mkg * kB);
    const entropy = kB * c ** 3 * area / (4 * G * hbar), entropyOverKB = entropy / kB;
    const radiationPower = hbar * c ** 6 / (15360 * Math.PI * G * G * Mkg * Mkg);
    const evaporationTime = 5120 * Math.PI * G * G * Mkg ** 3 / (hbar * c ** 4);
    checkedValues({ radius, area, surfaceGravity, temperature, entropy, entropyOverKB, radiationPower, evaporationTime });
    return { Mkg, radius, area, surfaceGravity, temperature, entropy, entropyOverKB, radiationPower, evaporationTime,
      constants, units: { Mkg: 'kg', radius: 'm', area: 'm^2', surfaceGravity: 'm/s^2', temperature: 'K', entropy: 'J/K', entropyOverKB: 'dimensionless', radiationPower: 'W', evaporationTime: 's' },
      approximation: { model: 'Ideal blackbody Schwarzschild emission from the horizon area',
        radiationPowerFormula: 'hbar*c^6/(15360*pi*G^2*Mkg^2)', evaporationTimeFormula: '5120*pi*G^2*Mkg^3/(hbar*c^4)',
        scope: 'Blackbody approximation; excludes greybody transmission, particle-species thresholds, accretion, and quantum-gravity endpoint effects. It is not a verified full astrophysical lifetime.' },
      domain: 'SI Schwarzschild reference formulas and a declared ideal radiation approximation',
      scope: 'Algebraic conversions using the stated constants. No mass-loss trajectory, perturbation PDE, or radiation-spectrum solver is supplied.', references };
  }

  return Object.freeze({ version: '0.4.0', tolerance, limits, constants, references, units, kerrNewman, metric, firstLaw, schwarzschildSI });
});
