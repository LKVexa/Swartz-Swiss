'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const view=require('../public/app.js');
const frame=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/phase-reference.json')));
const close=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<tol,`${a} does not match ${b}`);

test('phase cylinder preserves complex samples and derives radius and hue from the same value',()=>{
 const n=frame.grid.nx,dx=frame.grid.length/n;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const p=view.phaseVertex(frame,(i+.5)*dx,(j+.5)*dx,.2),k=j*n+i;
  close(p.re,frame.fields.psiRe[k]);close(p.im,frame.fields.psiIm[k]);
  close(Math.hypot(p.position[0],p.position[2]),1+.2*Math.hypot(p.re,p.im));
  close(p.amplitude,Math.hypot(p.re,p.im));close(p.phase,Math.atan2(p.im,p.re));
 }
});
test('phase cylinder has a continuous periodic seam and coherent between-cell amplitudes',()=>{
 const L=frame.grid.length;
 for(const y of [.1,1.37,3.2,L-.1]){
  const a=view.phaseVertex(frame,0,y),b=view.phaseVertex(frame,L,y);
  for(let k=0;k<3;k++){close(a.position[k],b.position[k]);close(a.color[k],b.color[k]);}
 }
 const x=1.1780972450961724,y=.9817477042468103;
 const p=view.phaseVertex(frame,x,y),sample=view.phaseSample(frame,x,y);
 close(p.amplitude,Math.hypot(sample.re,sample.im));
 close(Math.hypot(p.position[0],p.position[2]),1+.2*sample.amplitude);
});
test('pulse profile samples actual fields and computes physical signed axial power',()=>{
 const f={grid:{nr:2,nz:2,rM:[.25,.75],zM:[.5,1.5],drM:.5},fields:{EphiVPerM:[2,2,-3,-3],HrAPerM:[-1,-1,-2,-2]}};
 const p=view.axisProfile(f);
 close(p[0].rmsVPerM,2);close(p[1].rmsVPerM,3);
 close(p[0].axialPowerW,2*Math.PI);close(p[1].axialPowerW,-6*Math.PI);
});

function physicalFixture(){return {parameters:{lengthM:.32,plasmaElectronDensityPerM3:1e17},grid:{nr:2,nz:2},constants:{mu0HPerM:1.25663706212e-6},fields:{EphiVPerM:[20,-20,40,-40],HrAPerM:[-1,-1,2,2],HzAPerM:[0,0,0,0],materialMask:[0,1,0,1],temperatureK:[293,500,293,600],plasmaFillFraction:[1,.5,1,0],plasmaHeatCapacityJPerM3K:[1,0,1,0],plasmaTemperatureK:[8000,8000,9000,8000],envelopeAmplitudeVPerM:[20,20,40,0],relativeCarrierPhaseRad:[0,null,Math.PI/2,null],carrierPhaseValidMask:[1,0,1,0],coverLiquidFraction:[0,.25,0,.5]}};}

test('physical envelope hue and brightness use history fields on a fixed V/m scale and preserve masks',()=>{
 const f=physicalFixture(),a=view.physicalLayer(f,'envelope',{electricVPerM:100});
 assert.deepEqual(a.valid,[true,false,true,false]);assert.equal(a.validCount,2);
 assert.deepEqual(a.colors[0],view.hsv(.5,.76,.2));assert.deepEqual(a.colors[2],view.hsv(.75,.76,.4));
 const color=a.colors[0];f.fields.envelopeAmplitudeVPerM[2]=10000;
 const b=view.physicalLayer(f,'envelope',{electricVPerM:100});
 assert.deepEqual(b.colors[0],color);assert.equal(b.clipped,1);
});

test('physical geometry is independent of electric amplitude and liquid fraction',()=>{
 const f=physicalFixture(),position=view.physicalPoint(f,.039,.1,.75);
 f.fields.EphiVPerM.fill(1e6);f.fields.envelopeAmplitudeVPerM.fill(1e6);f.fields.coverLiquidFraction.fill(1);
 assert.deepEqual(view.physicalPoint(f,.039,.1,.75),position);
 close(Math.hypot(position[0],position[2]),3.6/.32*.039);
});

test('plasma temperature requires positive particle heat capacity; cover fractions use the material mask',()=>{
 const f=physicalFixture(),plasma=view.physicalLayer(f,'plasma-temperature'),liquid=view.physicalLayer(f,'cover-liquid');
 assert.deepEqual(plasma.valid,[true,false,true,false]);assert.deepEqual(liquid.valid,[false,true,false,true]);
 assert.deepEqual(liquid.values,[0,.25,0,.5]);
 f.fields.plasmaHeatCapacityJPerM3K.fill(0);assert.equal(view.physicalLayer(f,'plasma-temperature').validCount,0);
});

test('physical transport layer preserves reflected-flux signs and SI values',()=>{
 const f=physicalFixture(),layer=view.physicalLayer(f,'poynting',{fluxWPerM2:100});
 assert.deepEqual(layer.values,[20,-20,-80,80]);assert.equal(layer.lo,-100);assert.equal(layer.hi,100);assert.equal(layer.unit,'W/m²');
});

test('plasma heating preserves calculated kelvin rise and the declared fixed scale',()=>{
 const f=physicalFixture();f.fields.plasmaTemperatureRiseK=[.0015,.002,.001,.005];
 const a=view.physicalLayer(f,'plasma-temperature-rise');
 assert.deepEqual(a.values,[.0015,.002,.001,.005]);assert.deepEqual(a.valid,[true,false,true,false]);
 assert.equal(a.lo,0);assert.equal(a.hi,.002);assert.equal(a.unit,'K');assert.equal(a.clipped,0);
 assert.deepEqual(a.colors[0],view.sequentialColor(.0015,0,.002));
 const color=a.colors[2];f.fields.plasmaTemperatureRiseK[0]=.1;
 const b=view.physicalLayer(f,'plasma-temperature-rise');assert.deepEqual(b.colors[2],color);assert.equal(b.clipped,1);
 const c=view.physicalLayer(f,'plasma-temperature-rise',{plasmaTemperatureRiseK:.004});assert.equal(c.hi,.004);
 f.fields.plasmaHeatCapacityJPerM3K.fill(0);assert.equal(view.physicalLayer(f,'plasma-temperature-rise').validCount,0);
});

test('preview requests await local readiness and use worker JSON without fetching',async()=>{
 let initialized=false,seen=null,fetchCalls=0;
 const local={ready:Promise.resolve().then(()=>{initialized=true;}),request:async(url,options)=>{assert.equal(initialized,true);seen={url,options};return {running:false,server:{transport:'browser-worker'},snapshot:{stepCount:17}};}};
 const options={method:'POST',body:'{"action":"pause"}'},result=await view.requestJSON('/api/control',options,local,()=>{fetchCalls++;},true);
 assert.deepEqual(seen,{url:'/api/control',options});assert.equal(result.snapshot.stepCount,17);assert.equal(fetchCalls,0);
});

test('embedded preview cannot silently fall back to loopback or current-origin requests',async()=>{
 let fetchCalls=0;await assert.rejects(view.requestJSON('/api/state',undefined,null,()=>{fetchCalls++;},true),/has not initialized/);
 assert.equal(fetchCalls,0);
 const local={ready:Promise.resolve(),request:async()=>{throw Error('worker failed');}};
 await assert.rejects(view.requestJSON('/api/state',undefined,local,()=>{fetchCalls++;},true),/worker failed/);assert.equal(fetchCalls,0);
});

test('normal HTTP mode preserves requests, server errors, and parsed JSON',async()=>{
 let seen;const options={method:'POST',headers:{'Content-Type':'application/json'},body:'{}'};
 const result=await view.requestJSON('/api/control',options,null,async(url,request)=>{seen={url,request};return {ok:true,json:async()=>({snapshot:{timeSeconds:1e-9}})};});
 assert.equal(result.snapshot.timeSeconds,1e-9);assert.equal(seen.url,'/api/control');assert.equal(seen.request.body,'{}');assert.equal(seen.request.cache,'no-store');assert.ok(seen.request.signal instanceof AbortSignal);
 await assert.rejects(view.requestJSON('/api/control',options,null,async()=>({ok:false,status:400,json:async()=>({error:'Invalid physical parameter'})})),/Invalid physical parameter/);
});
