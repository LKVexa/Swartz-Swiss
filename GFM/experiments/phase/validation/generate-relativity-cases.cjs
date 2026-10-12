'use strict';
// Generates actual production outputs; the separate Python checker imports no
// production implementation and reconstructs the reference metric/quadrature.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const R = require(path.join(root, 'backend/relativity.cjs'));
const cases = [];
function ray(name, input, expectedOutcome) {
  const item = {name, input, output: R.integrateRay(input)};
  if (expectedOutcome) item.expectedOutcome = expectedOutcome;
  cases.push(item);
}
for (const M of [.1, 1, 10]) for (const spin of [0, .5, .9, .99, 1]) {
  cases.push({name: `analytic-M${M}-spin${spin}`, input: {M, spin}, output: R.analyticKerr(spin, M)});
}
for (const spin of [0, .5, .9, .99, 1]) for (const observerRadius of [12, 20, 100]) {
  const input = {spin, observerRadius, rayCount: 8, tolerance: 1e-7};
  cases.push({name: `bundle-spin${spin}-R${observerRadius}`, input, output: R.computeBundle(input)});
}
const critical = 3 * Math.sqrt(3);
for (const sign of [-1, 1]) for (const tolerance of [1e-7, 1e-9, 1e-11]) {
  ray(`exact-separatrix-${sign}-tol${tolerance}`, {Lz: sign * critical, tolerance}, 'critical-limit');
  for (const offset of [-1e-10, 1e-10]) {
    ray(`near-separatrix-${sign}-offset${offset}-tol${tolerance}`,
      {Lz: sign * (critical + offset), tolerance}, 'critical-limit');
  }
  for (const offset of [-1e-8, 1e-8]) {
    ray(`moving-band-${sign}-offset${offset}-tol${tolerance}`,
      {Lz: sign * (critical + offset), tolerance},
      tolerance > 1e-11 ? 'critical-limit' : offset < 0 ? 'captured' : 'escaped');
  }
  for (const factor of [.99, 1.01]) {
    ray(`schwarzschild-${sign}-factor${factor}-tol${tolerance}`,
      {Lz: sign * critical * factor, tolerance}, factor < 1 ? 'captured' : 'escaped');
  }
  for (const offset of [-.001, .001]) {
    ray(`offband-${sign}-offset${offset}-tol${tolerance}`,
      {Lz: sign * (critical + offset), tolerance}, offset < 0 ? 'captured' : 'escaped');
  }
}
for (const spin of [.5, .9, .99]) {
  const metric = R.analyticKerr(spin);
  for (const sense of ['prograde', 'retrograde']) {
    ray(`kerr-separatrix-spin${spin}-${sense}`,
      {spin, Lz: metric.equatorialCriticalImpact[sense], tolerance: 1e-9}, 'critical-limit');
  }
  ray(`initial-circular-spin${spin}`, {spin, Lz: metric.equatorialCriticalImpact.prograde,
    observerRadius: metric.equatorialPhotonRadii.prograde, horizonGuard: .001, tolerance: 1e-9}, 'critical-limit');
}
for (const sign of [-1, 1]) {
  ray(`outward-separatrix-${sign}`, {Lz: sign * critical, observerRadius: 2.5,
    escapeRadius: 20, radialDirection: 'outward', tolerance: 1e-9}, 'critical-limit');
}
for (const M of [.1, 1, 10]) for (const spin of [0, .9, .99, 1]) {
  ray(`inclined-M${M}-spin${spin}`, {M, spin, Lz: 4 * M, carterQ: 8 * M * M,
    observerRadius: 20 * M, inclination: Math.PI / 3, tolerance: 1e-9});
}
ray('weak-bending-b100', {Lz: 100, observerRadius: 1000, tolerance: 1e-10}, 'escaped');
for (const tolerance of [1e-5, 1e-7, 1e-9, 1e-11]) {
  ray(`refine-b6-tol${tolerance}`, {Lz: 6, tolerance}, 'escaped');
}
ray('outward-segment', {Lz: 6, radialDirection: 'outward', escapeRadius: 30}, 'escaped');
ray('incomplete-segment', {Lz: 6, maxMino: .001}, 'integration-limit');
ray('principal-congruence', {spin: .9, Lz: .9 * .75, carterQ: -.9 * .9 / 16,
  inclination: Math.PI / 3, tolerance: 1e-9}, 'captured');
const sourceBytes = fs.readFileSync(path.join(root, 'backend/relativity.cjs'));
const generatorBytes = fs.readFileSync(__filename);
const document = {schema: 'GFM-Kerr-independent-cases/1',
  source: {path: 'backend/relativity.cjs', sha256: crypto.createHash('sha256').update(sourceBytes).digest('hex')},
  generator: {path: 'validation/generate-relativity-cases.cjs', sha256: crypto.createHash('sha256').update(generatorBytes).digest('hex')},
  scope: 'Actual production outputs and exact inputs; independent checking is performed separately.', cases};
const target = path.join(__dirname, 'independent-relativity-cases.json');
fs.writeFileSync(target, JSON.stringify(document));
process.stdout.write(JSON.stringify({cases: cases.length, bytes: fs.statSync(target).size, sourceSha256: document.source.sha256}) + '\n');
