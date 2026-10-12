'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const view=require('../public/app.js');
const {createModel}=require('../backend/cylinder-em.cjs');
const {presetParameters}=require('../backend/research-presets.cjs');
let calculated;
function actualFrame(){if(!calculated){const model=createModel(presetParameters('covered-plasma'));for(let k=0;k<50;k++)model.step(4e-11);calculated=model.snapshot();}return calculated;}
const copy=f=>JSON.parse(JSON.stringify(f));
const hash=f=>crypto.createHash('sha256').update(JSON.stringify(f)).digest('hex');
const close=(a,b,tolerance=1e-12)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);

test('combined layers preserve raw backend fields and disclose delayed phase analysis time',()=>{
 const f=actualFrame(),layers=view.combinedPhysicalLayers(f);
 assert.equal(layers.timeSeconds,f.timeSeconds);assert.equal(layers.stepCount,f.stepCount);
 assert.equal(layers.layers.phase.values,f.fields.envelopeAmplitudeVPerM);
 assert.equal(layers.layers.plasma.values,f.fields.plasmaTemperatureRiseK);
 assert.equal(layers.layers.cover.values,f.fields.joulePowerDensityWPerM3);
 assert.equal(layers.phaseAnalysisTimeSeconds,f.phaseAnalysis.analysisTimeSeconds);
 assert.equal(layers.phaseGroupDelaySeconds,f.phaseAnalysis.groupDelaySeconds);
 assert.ok(layers.phaseAnalysisTimeSeconds<layers.timeSeconds);
 close(layers.timeSeconds-layers.phaseAnalysisTimeSeconds,layers.phaseGroupDelaySeconds,1e-20);
 assert.ok(Math.max(...layers.layers.plasma.values)>.001);
 assert.ok(Math.max(...layers.layers.cover.values)>10);
 assert.ok(Math.max(...f.fields.temperatureRiseK)<1e-10);
 assert.equal(Math.max(...f.fields.coverLiquidFraction),0);
});

test('both diagnostic planes sample exact physical cells without translations or invented angular modes',()=>{
 const f=actualFrame(),result=view.combinedLayerGeometry(f);
 for(const name of ['phase','plasma']){const data=result.layer.layers[name];assert.equal(result.samples[name].length,2*data.validCount);
  for(const s of result.samples[name]){const i=s.index%f.grid.nr,k=Math.floor(s.index/f.grid.nr);
   assert.equal(s.value,data.values[s.index]);assert.deepEqual(s.color,data.colors[s.index]);assert.equal(s.timeSeconds,f.timeSeconds);
   assert.equal(s.r0M,i*f.grid.drM);assert.equal(s.z0M,k*f.grid.dzM);
   const expected=[[s.r0M,s.z0M],[s.r1M,s.z0M],[s.r0M,s.z1M],[s.r1M,s.z1M]].map(([r,z])=>view.physicalPoint(f,r,z,s.phiRad));
   assert.deepEqual(s.positions,expected);assert.ok(data.valid[s.index]);
   assert.equal(s.phaseAnalysisTimeSeconds,name==='phase'?f.phaseAnalysis.analysisTimeSeconds:null);
  }
 }
 assert.deepEqual([...new Set(result.samples.phase.map(s=>s.phiRad))],[0,Math.PI]);
 assert.deepEqual([...new Set(result.samples.plasma.map(s=>s.phiRad))],[Math.PI/2,3*Math.PI/2]);
 const byIndex=new Map();for(const s of result.samples.phase){if(byIndex.has(s.index))assert.deepEqual(s.color,byIndex.get(s.index));else byIndex.set(s.index,s.color);}
});

test('mixed material cells preserve plasma and cover masks; zero capacity and missing phase remain masked',()=>{
 const f=copy(actualFrame()),layers=view.combinedPhysicalLayers(f),mixed=f.fields.plasmaFillFraction.map((fp,i)=>fp>0&&f.fields.materialFillFraction[i]>0?i:-1).filter(i=>i>=0);
 assert.ok(mixed.length>0);for(const i of mixed){assert.equal(layers.layers.plasma.valid[i],true);assert.equal(layers.layers.cover.valid[i],true);}
 f.fields.plasmaHeatCapacityJPerM3K.fill(0);f.fields.carrierPhaseValidMask.fill(0);
 const masked=view.combinedLayerGeometry(f);assert.equal(masked.samples.plasma.length,0);assert.equal(masked.samples.phase.length,0);assert.ok(masked.samples.cover.length>0);
 assert.equal(masked.objects.some(q=>q.layer==='phase-plasma'),false);
});

test('cover color maps full computational-cell Ohmic power without applying the material fraction twice',()=>{
 const f=actualFrame(),result=view.combinedLayerGeometry(f,{scales:{coverHeatingWPerM3:20}}),data=result.layer.layers.cover;
 assert.equal(data.hi,20);assert.equal(data.unit,'W/m³');assert.equal(data.style,'cover-heating');
 for(const s of result.samples.cover){const i=s.index;assert.ok(f.fields.materialFillFraction[i]>0);
  close(s.value,f.fields.conductivitySPerM[i]*f.fields.EphiVPerM[i]**2,1e-13);
  assert.equal(s.value,f.fields.joulePowerDensityWPerM3[i]);
  assert.equal(s.temperatureK,f.fields.temperatureK[i]);assert.equal(s.temperatureRiseK,f.fields.temperatureRiseK[i]);assert.equal(s.liquidFraction,f.fields.coverLiquidFraction[i]);
 }
 const index=f.fields.joulePowerDensityWPerM3.indexOf(Math.max(...f.fields.joulePowerDensityWPerM3));
 assert.deepEqual(data.colors[index],view.sequentialColor(data.values[index],0,20,'cover-heating'));
 const changed=view.combinedPhysicalLayers(f,{coverHeatingWPerM3:10});assert.equal(changed.layers.cover.values,data.values);assert.ok(changed.layers.cover.clipped>0);
});

test('material faces sample adjacent intersected cells, including distinct inner/outer and receiving/rear surfaces',()=>{
 const frames=[actualFrame(),createModel({...presetParameters('covered-plasma'),coverFraction:.5}).snapshot()];
 for(const f of frames){const result=view.combinedLayerGeometry(f,{cutaway:false}),scale=3.6/f.parameters.lengthM;
  for(const s of result.samples.cover){const i=s.index%f.grid.nr,k=Math.floor(s.index/f.grid.nr);for(const v of s.positions){const r=Math.hypot(v[0],v[2])/scale,z=f.parameters.lengthM/2-v[1]/scale;
   assert.ok(r>=i*f.grid.drM-1e-12&&r<=(i+1)*f.grid.drM+1e-12,'cover vertex must intersect its sampled radial cell');
   assert.ok(z>=k*f.grid.dzM-1e-12&&z<=(k+1)*f.grid.dzM+1e-12,'cover vertex must intersect its sampled axial cell');
  }const inner=f.parameters.cylinderRadiusM-f.parameters.wallThicknessM;if(s.positions.every(v=>Math.abs(Math.hypot(v[0],v[2])/scale-inner)<1e-12))for(const v of s.positions){const z=f.parameters.lengthM/2-v[1]/scale;assert.ok(z>=f.parameters.cylinderStartM+f.parameters.bottomThicknessM-1e-12);assert.ok(z<=f.parameters.cylinderStartM+f.parameters.cylinderLengthM-f.parameters.bottomThicknessM+1e-12);}}
 }
 const f=frames[0],g=f.grid,p=f.parameters,all=view.combinedLayerGeometry(f,{cutaway:false}).samples.cover,scale=3.6/p.lengthM,atZ=(s,z)=>s.positions.every(v=>Math.abs(v[1]-scale*(p.lengthM/2-z))<1e-12);
 const front=all.find(s=>atZ(s,p.cylinderStartM)&&s.rM<p.cylinderRadiusM/4),back=all.find(s=>atZ(s,p.cylinderStartM+p.bottomThicknessM)&&s.rM===front.rM);
 assert.ok(front&&back);assert.notEqual(Math.floor(front.index/g.nr),Math.floor(back.index/g.nr));assert.notEqual(front.value,back.value);
 const inner=p.cylinderRadiusM-p.wallThicknessM,nearMid=s=>Math.abs(s.zM-.15)<g.dzM/2;
 const innerWall=all.find(s=>nearMid(s)&&s.positions.every(v=>Math.abs(Math.hypot(v[0],v[2])/scale-inner)<1e-12));
 const outerWall=all.find(s=>nearMid(s)&&s.positions.every(v=>Math.abs(Math.hypot(v[0],v[2])/scale-p.cylinderRadiusM)<1e-12));
 assert.ok(innerWall&&outerWall);assert.notEqual(innerWall.index%g.nr,outerWall.index%g.nr);assert.notEqual(innerWall.value,outerWall.value);
});

test('signed thermal cooling is preserved in maxima and reported below the declared heating scale',()=>{
 const f=copy(actualFrame());f.fields.plasmaTemperatureRiseK.fill(-.001);f.fields.temperatureRiseK.fill(-1e-6);
 const combined=view.combinedPhysicalLayers(f),plasma=combined.layers.plasma;
 assert.equal(view.validMaximum(plasma.values,plasma.valid),-.001);assert.equal(plasma.below,plasma.validCount);assert.equal(plasma.above,0);
 assert.equal(view.validMaximum(f.fields.temperatureRiseK,combined.layers.cover.valid),-1e-6);
 assert.ok(Number.isNaN(view.validMaximum([3,4],[false,false])));
 assert.equal(view.validMaximum([NaN,-2,-1],[true,true,true]),-1);
});

test('phase amplitude, heating and molten state change colors without moving physical geometry',()=>{
 const f=copy(actualFrame()),before=view.combinedLayerGeometry(f);
 f.fields.envelopeAmplitudeVPerM=f.fields.envelopeAmplitudeVPerM.map(v=>2*v);f.fields.plasmaTemperatureRiseK.fill(.0019);f.fields.joulePowerDensityWPerM3.fill(19);f.fields.coverLiquidFraction.fill(1);f.fields.temperatureK.fill(1800);
 const after=view.combinedLayerGeometry(f);
 for(const name of ['phase','plasma','cover'])assert.deepEqual(after.samples[name].map(s=>s.positions),before.samples[name].map(s=>s.positions));
 assert.notDeepEqual(after.layer.layers.cover.colors,before.layer.layers.cover.colors);
 assert.notDeepEqual(after.layer.layers.plasma.colors,before.layer.layers.plasma.colors);
 assert.equal(after.objects.find(q=>q.layer==='cover').alpha,1);
});

test('layer visibility removes its data geometry and opaque cover while retaining only contextual wire guides',()=>{
 const f=actualFrame();
 const onlyPlasma=view.combinedLayerGeometry(f,{showPhase:false,showCover:false});
 assert.equal(onlyPlasma.samples.phase.length,0);assert.equal(onlyPlasma.samples.cover.length,0);assert.ok(onlyPlasma.samples.plasma.length>0);
 assert.equal(onlyPlasma.objects.some(q=>q.layer==='cover'),false);assert.deepEqual(onlyPlasma.objects.find(q=>q.layer==='phase-plasma').layers,['plasma']);
 const onlyCover=view.combinedLayerGeometry(f,{showPhase:false,showPlasma:false});assert.equal(onlyCover.objects.some(q=>q.layer==='phase-plasma'),false);assert.ok(onlyCover.samples.cover.length>0);
 const hidden=view.combinedLayerGeometry(f,{showPhase:false,showPlasma:false,showCover:false});assert.ok(hidden.objects.every(q=>q.lines));assert.equal(hidden.samples.cover.length,0);
});

test('cutaway opens roof, base and shell in the display and never changes backend material or fields',()=>{
 const f=actualFrame(),before=hash(f),full=view.combinedLayerGeometry(f,{cutaway:false}),cut=view.combinedLayerGeometry(f,{cutaway:true});
 assert.ok(cut.samples.cover.length<full.samples.cover.length);
 for(const z of [f.parameters.cylinderStartM,f.parameters.cylinderStartM+f.parameters.cylinderLengthM]){
  assert.ok(cut.samples.cover.filter(s=>s.positions.every(v=>Math.abs(v[1]-view.physicalPoint(f,0,z,0)[1])<1e-12)).length<full.samples.cover.filter(s=>s.positions.every(v=>Math.abs(v[1]-view.physicalPoint(f,0,z,0)[1])<1e-12)).length);
 }
 assert.equal(hash(f),before);assert.equal(cut.objects[0].layer,'cover');assert.equal(cut.objects[0].alpha,1);
});

test('transparent phase and plasma cells share a depth-sorted mesh with a fixed opacity',()=>{
 const f=actualFrame(),yaw=.65,pitch=.31,result=view.combinedLayerGeometry(f,{yaw,pitch}),overlay=result.objects.find(q=>q.layer==='phase-plasma');
 assert.equal(overlay.alpha,.86);assert.equal(overlay.p.length/18,overlay.sourceCells.length);assert.deepEqual(overlay.layers,['phase','plasma']);
 const eye=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];let previous=-Infinity;
 for(let n=0;n<overlay.p.length;n+=18){let depth=0;for(let j=0;j<6;j++)for(let c=0;c<3;c++)depth+=overlay.p[n+j*3+c]*eye[c]/6;assert.ok(depth>=previous-1e-12);previous=depth;}
});

test('empty wave history and zero deposited heat produce no invented phase or heating response',()=>{
 const f=createModel(presetParameters('covered-plasma')).snapshot(),result=view.combinedLayerGeometry(f);
 assert.equal(result.samples.phase.length,0);assert.equal(Math.max(...result.layer.layers.plasma.values),0);assert.equal(Math.max(...result.layer.layers.cover.values),0);
 assert.ok(result.samples.cover.length>0);assert.ok(result.samples.plasma.length>0);
 for(const s of result.samples.cover)assert.equal(s.temperatureK,f.parameters.initialTemperatureK);
});
