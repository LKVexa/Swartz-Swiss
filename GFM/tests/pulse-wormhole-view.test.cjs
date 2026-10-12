'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const view=require('../public/app.js');
const fixture=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../examples/audited-covered-frame.json'),'utf8'));
const close=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
test('cylindrical display remains the identity and wormhole mapping creates positive flared mouths',()=>{
 const p=fixture.parameters,center=p.cylinderStartM+p.cylinderLengthM/2;
 for(const z of [0,p.cylinderStartM,center,p.cylinderStartM+p.cylinderLengthM,p.lengthM])for(const r of [0,.02,p.radiusM])for(const phi of [0,.3,Math.PI])assert.deepEqual(view.presentationMap(fixture,r,z,phi,'cylinder'),view.physicalPoint(fixture,r,z,phi));
 close(view.presentationScale(fixture,center,'wormhole').radial,.72);
 close(view.presentationScale(fixture,p.cylinderStartM,'wormhole').radial,2.4);
 for(let k=0;k<100;k++)assert.ok(view.presentationScale(fixture,p.lengthM*k/99,'wormhole').radial>0);
});
test('mapped vector tangents agree with independent finite differences and preserve axis regularity',()=>{
 const p=fixture.parameters,center=p.cylinderStartM+p.cylinderLengthM/2,r=.02,z=center+.025,phi=.73,sr=.8,sz=-1.2,dt=1e-8;
 const a=view.presentationMap(fixture,r-dt*sr,z-dt*sz,phi,'wormhole'),b=view.presentationMap(fixture,r+dt*sr,z+dt*sz,phi,'wormhole'),analytic=view.presentationVector(fixture,r,z,phi,sr,sz,'wormhole');
 for(let j=0;j<3;j++)close((b[j]-a[j])/(2*dt),analytic[j],1e-7);
 assert.deepEqual(view.presentationMap(fixture,0,z,phi,'wormhole'),view.presentationMap(fixture,0,z,0,'wormhole'));
});
test('solver-valid zero-length material geometry uses a finite cylindrical fallback',()=>{
 const f=require('../backend/cylinder-em.cjs').createModel({resolutionR:16,resolutionZ:32,pulseFrequencyHz:1e9,sourceEnabled:false,spongeRatePerSecond:0,sigmaSPerM:0,cylinderLengthM:0,cylinderRadiusM:0,wallThicknessM:0,bottomThicknessM:0,plasmaRegion:'outside-cover',plasmaElectronDensityPerM3:0}).snapshot();
 assert.deepEqual(view.presentationScale(f,f.parameters.cylinderStartM,'wormhole'),{radial:1,derivativePerM:0});
 const result=view.combinedLayerGeometry(f,{presentationShape:'wormhole',showEnergyFlow:true});
 for(const object of result.objects)for(const values of [object.p,object.c,object.n])assert.ok(values.every(Number.isFinite));
});
test('camera fit contains the full mapped domain on narrow and wide canvases',()=>{
 for(const aspect of [.6,.8,1,1.5,2])for(const shape of ['cylinder','wormhole']){
  const distance=view.cameraFitDistance(fixture,shape,aspect),radial=fixture.parameters.radiusM*3.6/fixture.parameters.lengthM*(shape==='wormhole'?2.4:1),radius=Math.hypot(radial,1.8),halfAngle=Math.min(.35,Math.atan(Math.tan(.35)*aspect));
  assert.ok(Math.asin(radius/distance)<halfAngle);assert.ok(Number.isFinite(distance));
 }
});
test('wormhole mapping changes positions but preserves all raw phase/plasma/cover values and ledger',()=>{
 const before=hash(fixture),options={absorptionLayer:'plasma-power',coverResponseLayer:'cover-heating'},a=view.combinedLayerGeometry(fixture,{...options,presentationShape:'cylinder'}),b=view.combinedLayerGeometry(fixture,{...options,presentationShape:'wormhole'});
 for(const name of ['phase','plasma','cover']){assert.equal(a.samples[name].length,b.samples[name].length);for(let j=0;j<a.samples[name].length;j++){assert.equal(a.samples[name][j].index,b.samples[name][j].index);assert.equal(a.samples[name][j].value,b.samples[name][j].value);}}
 assert.notDeepEqual(a.samples.phase[0].positions,b.samples.phase[0].positions);assert.equal(hash(fixture),before);
});
test('energy arrows have correct signed physical flux, mapped tangent, time and fixed magnitude scale',()=>{
 const flow=view.pulseEnergyFlowGeometry(fixture,{presentationShape:'wormhole',scales:{fluxWPerM2:20}});
 assert.ok(flow.samples.length>0);assert.equal(flow.referenceWPerM2,20);let forward=0,returning=0;
 for(const s of flow.samples){const i=s.index,sr=fixture.fields.EphiVPerM[i]*fixture.fields.HzAPerM[i],sz=-fixture.fields.EphiVPerM[i]*fixture.fields.HrAPerM[i];close(s.radialFluxWPerM2,sr);close(s.axialFluxWPerM2,sz);assert.equal(s.timeSeconds,fixture.timeSeconds);assert.deepEqual(s.position,view.presentationMap(fixture,s.rM,s.zM,s.phiRad,'wormhole'));assert.deepEqual(s.mappedTangent,view.presentationVector(fixture,s.rM,s.zM,s.phiRad,sr,sz,'wormhole'));assert.ok(s.lengthDisplayUnits<=.22);if(sz>0){assert.equal(s.direction,'+z');forward++;}if(sz<0){assert.equal(s.direction,'−z');returning++;}}
 assert.ok(forward>0);assert.ok(returning>0);
});
test('zero fields create no energy-flow arrows and display opacity is not absorption',()=>{
 const f=structuredClone(fixture);for(const name of ['EphiVPerM','HrAPerM','HzAPerM','plasmaJphiAPerM2'])f.fields[name].fill(0);
 const flow=view.pulseEnergyFlowGeometry(f,{scales:{fluxWPerM2:20}});assert.equal(flow.samples.length,0);assert.equal(flow.objects.length,0);
});
test('plasma and cover choices distinguish instantaneous power from cumulative deposited energy',()=>{
 const power=view.combinedPhysicalLayers(fixture,{plasmaPowerWPerM3:20,coverHeatingWPerM3:100},{absorptionLayer:'plasma-power'});
 const accumulated=view.combinedPhysicalLayers(fixture,{plasmaDepositedJPerM3:1e-8,coverDepositedJPerM3:5e-8},{absorptionLayer:'plasma-deposited',coverResponseLayer:'cover-deposited'});
 assert.equal(power.layers.plasma.unit,'W/m³');assert.equal(accumulated.layers.plasma.unit,'J/m³');assert.equal(accumulated.layers.cover.unit,'J/m³');
 for(let i=0;i<fixture.grid.nr*fixture.grid.nz;i++){close(power.layers.plasma.values[i],fixture.fields.plasmaCollisionPowerDensityWPerM3[i]);assert.equal(accumulated.layers.plasma.values[i],fixture.fields.plasmaCollisionDepositedEnergyDensityJPerM3[i]);assert.equal(accumulated.layers.cover.values[i],fixture.fields.depositedEnergyDensityJPerM3[i]);}
 assert.equal(accumulated.layers.cover.hi,5e-8);
});
test('flow visibility affects rendering alone and arrow threshold is declared on the fixed scale',()=>{
 const before=hash(fixture),hidden=view.combinedLayerGeometry(fixture,{showEnergyFlow:false,presentationShape:'wormhole'}),shown=view.combinedLayerGeometry(fixture,{showEnergyFlow:true,presentationShape:'wormhole',scales:{fluxWPerM2:20}});
 assert.equal(hidden.energyFlow,null);assert.ok(shown.objects.some(object=>object.layer==='energy-flow'));assert.equal(shown.energyFlow.thresholdWPerM2,.01);assert.equal(hash(fixture),before);
});
