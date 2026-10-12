'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../backend/relativity.cjs');
test('analytic Kerr limits reproduce Schwarzschild horizon, photon sphere and critical impact',()=>{
  const x=R.analyticKerr(0);assert.equal(x.rPlus,2);assert.equal(x.schwarzschild.photonSphere,3);assert.equal(x.schwarzschild.criticalImpact,3*Math.sqrt(3));assert.equal(x.equatorialPhotonRadii.prograde,3);assert.equal(x.equatorialPhotonRadii.retrograde,3);
  const e=R.analyticKerr(1);assert.equal(e.rPlus,1);assert.ok(Math.abs(e.equatorialPhotonRadii.prograde-1)<1e-14);assert.equal(e.equatorialPhotonRadii.retrograde,4);
});
test('Schwarzschild rays on opposite sides of critical impact capture or escape and stay planar',()=>{
  const critical=3*Math.sqrt(3), captured=R.integrateRay({Lz:critical-.01,tolerance:1e-9}),escaped=R.integrateRay({Lz:critical+.01,tolerance:1e-9});
  assert.equal(captured.outcome,'captured');assert.equal(escaped.outcome,'escaped');
  for(const ray of[captured,escaped]){assert.equal(ray.diagnostics.passed,true);assert.ok(ray.diagnostics.maxNormalizedNullResidual<1e-7);for(const p of ray.points){assert.ok(Math.abs(p.y)<1e-13);assert.ok(p.r>2);assert.ok(Math.abs(p.reconstruction.E-1)<1e-10);assert.ok(Math.abs(p.reconstruction.Lz-ray.constants.Lz)<1e-10);}}
  assert.ok(escaped.diagnostics.minimumRadius>3);
});
test('tail-corrected weak Schwarzschild bending approaches 4M/b and refines with tighter tolerances',()=>{
  const weak=R.integrateRay({Lz:100,observerRadius:1000,tolerance:1e-10});assert.equal(weak.outcome,'escaped');assert.ok(Math.abs(weak.deflectionRadians/.04-1)<.032);
  const loose=R.integrateRay({Lz:6,tolerance:1e-5}),medium=R.integrateRay({Lz:6,tolerance:1e-8}),fine=R.integrateRay({Lz:6,tolerance:1e-11});
  assert.ok(Math.abs(medium.deflectionRadians-fine.deflectionRadians)<Math.abs(loose.deflectionRadians-fine.deflectionRadians));assert.ok(Math.abs(medium.deflectionRadians-fine.deflectionRadians)<1e-7);
});
test('non-equatorial Kerr trajectories satisfy Carter and metric null constraints with finite output',()=>{
  const ray=R.integrateRay({spin:.9,Lz:4,carterQ:8,inclination:Math.PI/3,tolerance:1e-9});
  assert.ok(['captured','escaped'].includes(ray.outcome));assert.equal(ray.diagnostics.passed,true);assert.ok(ray.diagnostics.maxPolarResidual<1e-7);assert.ok(ray.diagnostics.maxCarterReconstructionError<1e-7);assert.ok(ray.points.some(p=>Math.abs(p.mu-ray.points[0].mu)>.1));
  assert.ok(JSON.stringify(ray).length>1000);assert.equal(ray.points.every(p=>Object.values(p).filter(v=>typeof v==='number').every(Number.isFinite)),true);
});
test('equatorial Kerr photon-orbit benchmarks separate prograde and retrograde capture thresholds',()=>{
  const a=R.analyticKerr(.9),pro=a.equatorialCriticalImpact.prograde,retro=a.equatorialCriticalImpact.retrograde;
  assert.equal(R.integrateRay({spin:.9,Lz:pro-.01,tolerance:1e-9}).outcome,'captured');
  assert.equal(R.integrateRay({spin:.9,Lz:pro+.01,tolerance:1e-9}).outcome,'escaped');
  assert.equal(R.integrateRay({spin:.9,Lz:retro+.01,tolerance:1e-9}).outcome,'captured');
  assert.equal(R.integrateRay({spin:.9,Lz:retro-.01,tolerance:1e-9}).outcome,'escaped');
  const circular=R.integrateRay({spin:.9,Lz:pro,observerRadius:a.equatorialPhotonRadii.prograde,maxMino:.2,tolerance:1e-10});
  assert.equal(circular.outcome,'critical-limit');assert.equal(circular.diagnostics.criticality.isNearCritical,true);assert.ok(circular.points.every(p=>Math.abs(p.r-a.equatorialPhotonRadii.prograde)<1e-7));
});
test('exact and numerically near-critical radial separatrices stay unresolved while off-band rays retain capture/escape',()=>{
  const critical=3*Math.sqrt(3);
  for(const tolerance of[1e-7,1e-9,1e-11]) for(const sign of[-1,1]) {
    const ray=R.integrateRay({Lz:sign*critical,tolerance});assert.equal(ray.outcome,'critical-limit');assert.equal(ray.diagnostics.criticality.isNearCritical,true);assert.equal(ray.deflectionRadians,null);
    assert.ok(ray.diagnostics.minimumRadius>3);assert.equal(ray.diagnostics.passed,true);
    const captured=R.integrateRay({Lz:sign*(critical-.001),tolerance}),escaped=R.integrateRay({Lz:sign*(critical+.001),tolerance});
    assert.equal(captured.outcome,'captured');assert.equal(escaped.outcome,'escaped');assert.equal(captured.diagnostics.criticality.isNearCritical,false);assert.equal(escaped.diagnostics.criticality.isNearCritical,false);
  }
  for(const offset of[-1e-7,1e-7]) assert.equal(R.integrateRay({Lz:critical+offset,tolerance:1e-7}).outcome,'critical-limit');
  const outward=R.integrateRay({Lz:critical,observerRadius:2.5,escapeRadius:20,radialDirection:'outward',tolerance:1e-9});
  assert.equal(outward.outcome,'critical-limit');assert.ok(outward.points.at(-1).r<3);assert.equal(outward.deflectionRadians,null);
});
test('mass scaling preserves dimensionless bending and the extremal exterior remains guarded',()=>{
  const one=R.integrateRay({Lz:6,tolerance:1e-9}),two=R.integrateRay({M:2,Lz:12,observerRadius:40,tolerance:1e-9});
  assert.ok(Math.abs(one.deflectionRadians-two.deflectionRadians)<1e-12);assert.ok(Math.abs(two.diagnostics.minimumRadius/2-one.diagnostics.minimumRadius)<1e-12);
  const extremal=R.computeBundle({spin:1,rayCount:8,tolerance:1e-8});assert.equal(extremal.diagnostics.passed,true);assert.ok(extremal.trajectories.every(ray=>ray.points.every(p=>p.r>=1.02-1e-12)));
});
test('an outward-only segment does not report a fictitious complete scattering deflection',()=>{
  const ray=R.integrateRay({Lz:6,radialDirection:'outward',escapeRadius:30});
  assert.equal(ray.outcome,'escaped');assert.equal(ray.diagnostics.radialTurns,0);assert.equal(ray.deflectionRadians,null);assert.ok(Math.abs(ray.points.at(-1).r-30)<1e-10);
});
test('bounded bundle reports resolved and unresolved outcomes and guards unsupported initial data',()=>{
  const bundle=R.computeBundle({spin:.99,rayCount:8,tolerance:1e-8});assert.equal(bundle.trajectories.length,8);assert.equal(bundle.diagnostics.captured+bundle.diagnostics.escaped+bundle.diagnostics.unresolved,8);assert.equal(bundle.diagnostics.passed,true);assert.ok(bundle.diagnostics.totalSteps<50000);
  assert.throws(()=>R.integrateRay({spin:1.01}));assert.throws(()=>R.integrateRay({observerRadius:2}));assert.throws(()=>R.integrateRay({Lz:30,observerRadius:20}));assert.throws(()=>R.integrateRay({inclination:0}));assert.throws(()=>R.integrateRay({carterQ:-1}));assert.throws(()=>R.computeBundle({rayCount:10000}));
  assert.throws(()=>R.integrateRay({spin:.9,Lz:100,observerRadius:1.5}),/future-directed/);
  const incomplete=R.integrateRay({Lz:6,maxMino:.001});assert.equal(incomplete.outcome,'integration-limit');assert.equal(incomplete.deflectionRadians,null);
  assert.equal(incomplete.parameters.maxMino,.001);assert.equal(incomplete.parameters.maxStep,.025);assert.equal(incomplete.parameters.maxSteps,12000);assert.equal(incomplete.parameters.maxPoints,600);
});
