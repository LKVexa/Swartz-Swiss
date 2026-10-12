'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{once}=require('node:events');
const {createSession}=require('../backend/phase-session.js');
const {createServer}=require('../server.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('raw spatial GFM amplitudes and energy survive the transform; reset changes run identity',()=>{
  const s=createSession(),a=s.snapshot();
  assert.ok(a.gfm.inputSampleEnergy>0);assert.equal(a.gfm.normalization,'none; raw complex sample amplitudes retained');
  assert.ok(a.gfm.inverseResidual<1e-12);assert.ok(Math.abs(a.gfm.inputSampleEnergy-a.gfm.transformSampleEnergy)<1e-12);
  const b=s.control('step');assert.ok(b.time>a.time);assert.ok(b.sequence>a.sequence);assert.equal(a.runId,b.runId);
  const c=s.control('reset');assert.equal(c.time,0);assert.notEqual(c.runId,b.runId);assert.deepEqual(c.fields,a.fields);
});
test('real phase worker HTTP controls evolve fields, reject bad input atomically, and export a valid frame',{timeout:12000},async t=>{
  const server=createServer({autoTick:false,phaseEnabled:true});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.closeSimulation());
  const url='http://127.0.0.1:'+server.address().port;
  const post=async(route,body)=>{const r=await fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
  const health=await(await fetch(url+'/api/health')).json();assert.equal(health.version,'3.0.0');
  const initial=(await post('/api/phase/control',{action:'pause'})).body;assert.equal(initial.schema,'GFM-Phase-MHD-frame/1');assert.equal(initial.time,0);
  const step=await post('/api/phase/control',{action:'step'});assert.equal(step.status,200);assert.ok(step.body.time>0);assert.notDeepEqual(step.body.fields.density,initial.fields.density);
  const invalid=await post('/api/phase/parameters',{density:-1});assert.equal(invalid.status,400);assert.deepEqual(await(await fetch(url+'/api/phase')).json(),step.body);
  const changed=(await post('/api/phase/parameters',{magneticStrength:.7})).body;assert.equal(changed.time,0);assert.notEqual(changed.runId,step.body.runId);assert.equal(changed.parameters.magneticStrength,.7);assert.notDeepEqual(changed.fields.bx,initial.fields.bx);
  await post('/api/phase/control',{action:'play'});await wait(450);const paused=(await post('/api/phase/control',{action:'pause'})).body;assert.ok(paused.time>=.05);assert.equal(paused.running,false);
  await wait(250);assert.equal((await(await fetch(url+'/api/phase')).json()).time,paused.time);
  const exp=await(await fetch(url+'/api/phase/export.json')).json();assert.equal(exp.schema,'GFM-phase-export/1');assert.deepEqual(exp.frame.fields,paused.fields);assert.ok(exp.frame.software['backend/phase-mhd.js']);
  const report=await(await fetch(url+'/api/observations')).json();assert.equal(report.verificationPassed,true);assert.equal(report.comparisonPassed,false);
  assert.equal((await post('/api/phase/control',{action:'pause',extra:1})).status,400);
  const origin=await fetch(url+'/api/phase/control',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.example'},body:'{"action":"play"}'});assert.equal(origin.status,403);
});
