'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {createServer}=require('../server.cjs');
const RELEASE=require('../release-info.json');

test('audit provenance, all findings and corrected GR references reach the live API without changing physical state',async()=>{
  const server=createServer({running:false});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port;
  const get=async route=>{const response=await fetch(url+route);assert.equal(response.status,200);return response.json();};
  const post=async(route,data)=>fetch(url+route,{method:'POST',body:JSON.stringify(data)});
  try {
    const state=await get('/api/state');
    assert.equal(state.server.version,RELEASE.version);
    assert.equal(state.parameters.plasmaElectronDensityPerM3,1e17);
    assert.equal(state.parameters.plasmaCollisionFrequencyPerSecond,2e9);
    const audit=await get('/api/audit');
    assert.equal(audit.items.length,38);
    assert.deepEqual(audit.items.map(item=>item.id).sort(),Array.from({length:38},(_,k)=>'A'+String(k+1).padStart(2,'0')));
    const source=await fetch(url+'/docs/GFM-Review-Editable.txt');
    assert.equal(crypto.createHash('sha256').update(Buffer.from(await source.arrayBuffer())).digest('hex'),RELEASE.auditSHA256);
    const references=await get('/api/gr-reference');
    assert.equal(references.metadata.physicalEvolutionCoupling,false);
    assert.ok(references.examples.length>=5);
    const referenceReply=await post('/api/gr-reference',{calculator:'morrisThorne',parameters:{radiusM:.04,shapeM:.04,shapeDerivative:-1,regularRedshiftAtThroat:true}});
    assert.equal(referenceReply.status,200);
    const result=(await referenceReply.json()).result;
    assert.ok(result.radialNecJPerM3<0);assert.equal(result.provesSpacetimePassage,false);
    const after=await get('/api/state');
    assert.equal(JSON.stringify(after),JSON.stringify(state));
    const bad=await post('/api/gr-reference',{calculator:'eval',parameters:{}});assert.equal(bad.status,400);
    const invalid=await post('/api/gr-reference',{calculator:'kerrReference',parameters:{massKg:1e30,dimensionlessSpin:1.1}});assert.equal(invalid.status,400);
  }finally {await new Promise(resolve=>server.close(resolve));}
});

test('research presets reset history and export causal plasma/material fields through the same backend',async()=>{
  const server=createServer({running:false});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port;
  const get=async route=>(await fetch(url+route)).json();
  const change=async data=>{const res=await fetch(url+'/api/control',{method:'POST',body:JSON.stringify(data)});assert.equal(res.status,200,await res.clone().text());return res.json();};
  try {
    const presets=await get('/api/presets');assert.equal(presets.items.length,4);
    const initial=await get('/api/state');
    let evolved;
    for(let k=0;k<5;k++)evolved=await change({stepSeconds:2e-10});
    assert.ok(evolved.fields.plasmaJphiAPerM2.some(v=>v!==0));
    assert.ok(evolved.diagnostics.plasmaDriftEnergyJ>0);
    assert.ok(evolved.diagnostics.plasmaCollisionHeatJ>0);
    assert.ok(evolved.diagnostics.relativeEnergyBalanceResidual<1e-8);
    const bad=await fetch(url+'/api/control',{method:'POST',body:JSON.stringify({preset:'hot-cover',running:'yes'})});assert.equal(bad.status,400);
    const unchanged=await get('/api/state');assert.equal(unchanged.runId,evolved.runId);
    assert.equal(unchanged.parameters.coverFraction,0);
    const hot=await change({preset:'hot-cover'});
    assert.notEqual(hot.runId,initial.runId);assert.notEqual(hot.runId,evolved.runId);
    assert.equal(hot.timeSeconds,0);assert.equal(hot.history.length,1);
    assert.equal(hot.parameters.coverFraction,1);
    assert.ok(hot.fields.coverLiquidFraction.some(v=>Math.abs(v-.5)<1e-12));
    const exported=await get('/api/export');
    assert.equal(exported.release.auditSHA256,RELEASE.auditSHA256);
    assert.equal(exported.frame.runId,hot.runId);
    assert.ok(exported.frame.staggered);
    const vacuum=await change({preset:'vacuum'});
    assert.equal(vacuum.parameters.plasmaElectronDensityPerM3,0);
    assert.ok(vacuum.fields.plasmaJphiAPerM2.every(v=>v===0));
  }finally {await new Promise(resolve=>server.close(resolve));}
});

test('preserved audit source is exactly the reviewed attachment',()=>{
  const bytes=fs.readFileSync(path.join(__dirname,'../docs/GFM-Review-Editable.txt'));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),RELEASE.auditSHA256);
});
