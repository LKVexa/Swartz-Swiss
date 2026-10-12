'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createPhysicsService,validateConfig}=require('../backend/physics-service.cjs');
const {createServer}=require('../server.cjs');
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const sourceHash=file=>createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',file))).digest('hex');
async function wait(check,label){const until=Date.now()+8000;while(Date.now()<until){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('Timed out: '+label);}
test('worker computes deterministic Kerr paths without altering the aperture hypothesis or exposing stale spin',async()=>{
  const events=[],service=createPhysicsService({debounceMs:0,onUpdate:s=>events.push(s)});
  try{
    await wait(()=>service.snapshot().status==='ready','default worker result');
    const before=service.exportData();assert.equal(before.rays.trajectories.length,16);assert.equal(before.fullSolverResult.diagnostics.passed,true);
    assert.ok(before.diagnostics.maxNormalizedNullResidual<1e-6);assert.equal(before.reproducibility.sameInputsBothBranches,true);
    assert.equal(before.solverSourceSha256,sourceHash('backend/relativity.cjs'));assert.equal(before.workerSourceSha256,sourceHash('backend/physics-worker.cjs'));assert.equal(before.reproducibility.sourceSha256,before.solverSourceSha256);
    service.request(.5);assert.equal(service.snapshot().status,'calculating');assert.equal(service.snapshot().rays,undefined);
    service.request(.7);await wait(()=>service.snapshot().status==='ready','latest spin');
    assert.equal(service.exportData().fullSolverResult.parameters.spin,.7);assert.equal(service.snapshot().a,.7);
    const state=service.snapshot();assert.throws(()=>service.configure({inclinationDeg:0}));assert.deepEqual(service.snapshot(),state);
    service.configure({inclinationDeg:45,rayCount:32,tolerance:1e-9});await wait(()=>service.snapshot().status==='ready','refined settings');assert.equal(service.snapshot().rays.trajectories.length,32);
    assert.equal(service.snapshot().settings.inclinationDeg,45);assert.equal(service.snapshot().settings.tolerance,1e-9);
    assert.ok(events.some(s=>s.status==='calculating'));assert.ok(events.some(s=>s.status==='ready'));
  }finally{await service.close();}
});
test('physics settings reject nonfinite, unknown and unbounded workloads',()=>{
  for(const value of [{tolerance:NaN},{rayCount:1e6},{inclinationDeg:180},{observerRadius:0},{other:1},[]])assert.throws(()=>validateConfig(value));
  assert.equal(validateConfig({rayCount:32}).rayCount,32);
});
test('actual HTTP worker settings, physics export and source hashes reflect the current computed run',async()=>{
  const server=createServer({autoTick:false,physicsEnabled:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  try{
    await wait(()=>server.physics.snapshot().status==='ready','HTTP physics ready');
    const get=async path=>(await fetch(origin+path)).json();
    const before=await get('/api/state');assert.equal(before.physics.status,'ready');assert.equal(before.branches.aggie.passage,0);
    const post=async(path,body)=>fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json','Origin':origin},body:JSON.stringify(body)});
    const changed=await post('/api/parameters',{coverLoad:0});assert.equal(changed.status,200);const open=await changed.json();assert.equal(open.branches.aggie.passage,1);assert.deepEqual(open.physics.rays,before.physics.rays);
    const settings=await post('/api/physics',{inclinationDeg:75,tolerance:1e-9});assert.equal(settings.status,200);await wait(()=>server.physics.snapshot().status==='ready','HTTP settings solved');
    const exportData=await get('/api/physics-export.json');assert.equal(exportData.schema,'GFM-Kerr-physics-recording/1');assert.equal(exportData.fullSolverResult.parameters.tolerance,1e-9);assert.ok(exportData.fullSolverResult.trajectories[0].points[0].affine===0);assert.match(exportData.software['backend/relativity.cjs'],/^[0-9a-f]{64}$/);
    assert.equal(exportData.software['backend/relativity.cjs'],exportData.solverSourceSha256);assert.equal(exportData.reproducibility.sourceSha256,exportData.solverSourceSha256);assert.equal(exportData.software['backend/physics-worker.cjs'],exportData.workerSourceSha256);
    const provenance=await get('/api/provenance');assert.equal(provenance.runningMatchesDisk,true);assert.deepEqual(provenance.sha256,exportData.software);assert.deepEqual(provenance.onDiskSha256,exportData.software);
    const invalid=await post('/api/physics',{rayCount:10000});assert.equal(invalid.status,400);assert.equal((await get('/api/physics')).settings.rayCount,16);
    const record=await get('/api/export.json');assert.equal(record.physics.fullSolverResult.schema,'GFM-Kerr-null-bundle/1');assert.equal(record.state.branches.aggie.passage,1);
  }finally{await server.closeSimulation();}
});
