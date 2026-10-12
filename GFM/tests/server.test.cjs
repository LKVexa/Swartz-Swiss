'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createServer}=require('../server.cjs');

test('local API produces computed fields, controls state, and retains valid state after rejected input',async()=>{
 const server=createServer({running:false});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port;
 try{
  const initial=await(await fetch(url+'/api/state')).json();
  assert.equal(initial.running,false);assert.ok(initial.schema);assert.ok(initial.grid);
  const next=await(await fetch(url+'/api/control',{method:'POST',body:JSON.stringify({action:'step'})})).json();
  assert.ok((next.timeSeconds??next.time)>(initial.timeSeconds??initial.time));
  assert.ok(next.fields);assert.ok(next.diagnostics);
  const health=await(await fetch(url+'/api/health')).json();assert.equal(health.product,'GFM Cylindrical Pulse Laboratory');assert.equal(health.engineSHA256.length,64);
  const bad=await fetch(url+'/api/control',{method:'POST',body:JSON.stringify({parameters:{sigmaSPerM:-1}})});
  assert.equal(bad.status,400);
  const intact=await(await fetch(url+'/api/state')).json();assert.equal(intact.runId,next.runId);
  const malformed=await fetch(url+'/api/control',{method:'POST',body:JSON.stringify({parameters:{coverFraction:1},running:'yes'})});
  assert.equal(malformed.status,400);
  const unchanged=await(await fetch(url+'/api/state')).json();assert.equal(unchanged.runId,next.runId);assert.equal(unchanged.parameters.coverFraction,next.parameters.coverFraction);
  const cross=await fetch(url+'/api/control',{method:'POST',headers:{Origin:'https://example.org'},body:JSON.stringify({action:'play'})});assert.equal(cross.status,403);
  const reset=await(await fetch(url+'/api/reset',{method:'POST',body:'{}'})).json();
  assert.notEqual(reset.runId,next.runId);assert.equal(reset.timeSeconds??reset.time,0);
  const reference=await(await fetch(url+'/api/phase-reference')).json();assert.equal(reference.grid.dimension,2);assert.equal(reference.grid.nx,32);
  const exportFrame=await(await fetch(url+'/api/export')).json();assert.equal(exportFrame.frame.runId,reset.runId);
  const html=await(await fetch(url+'/')).text();assert.match(html,/<html/);
  const escapes=await fetch(url+'/assets/%2e%2e%5cserver.cjs');assert.ok([403,404].includes(escapes.status));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
