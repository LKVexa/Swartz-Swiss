'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { createServer } = require('../server.cjs');
const { createSimulation } = require('../backend/simulation.cjs');
async function start(t) { const server=createServer({autoTick:false}); server.listen(0,'127.0.0.1'); await once(server,'listening'); t.after(()=>server.closeSimulation()); return {server,url:'http://127.0.0.1:'+server.address().port}; }
async function post(url,pathname,body,headers={}) { return fetch(url+pathname,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}); }
function request(url,options) {return new Promise((resolve,reject)=>{const req=http.get(url,options,res=>{let body='';res.setEncoding('utf8');res.on('data',d=>body+=d);res.on('end',()=>resolve({status:res.statusCode,body}));});req.on('error',reject);});}
test('real HTTP parameter/control/export endpoints use the GFM backend and preserve invalid state',async t=>{
  const {url}=await start(t);
  assert.equal((await (await fetch(url+'/api/health')).json()).ok,true);
  const before=await (await fetch(url+'/api/state')).json();
  let res=await post(url,'/api/parameters',{coverLoad:0}); assert.equal(res.status,200); const changed=await res.json(); assert.equal(changed.branches.aggie.passage,1);
  res=await post(url,'/api/parameters',{spin:2}); assert.equal(res.status,400); assert.deepEqual(await (await fetch(url+'/api/state')).json(),changed);
  res=await post(url,'/api/control',{action:'step'}); assert.equal((await res.json()).elapsed,.1);
  res=await post(url,'/api/control',{action:'play',extra:true}); assert.equal(res.status,400);
  const exported=await (await fetch(url+'/api/export.json')).json(); assert.equal(exported.schema,'GFM-Aperture-Aggie-recording/1'); assert.equal(exported.frames.at(-1).elapsed,.1); assert.equal(exported.frames[0].parameters.coverLoad,2);
  const csv=await (await fetch(url+'/api/export.csv')).text(); assert.ok(csv.includes('gfm_max_recovery_error')); assert.equal(csv.trim().split(/\r?\n/).length,exported.frames.length+1);
  assert.equal(before.gfm.passed,true);
});
test('SSE publishes initial and changed frames through a real local connection',async t=>{
  const {server,url}=await start(t);
  const events=[];
  const closed = new Promise((resolve,reject)=>{
    const req=http.get(url+'/api/events',res=>{
      assert.equal(res.headers['content-type'],'text/event-stream; charset=utf-8');
      let buffer='';res.setEncoding('utf8');res.on('data',chunk=>{
        buffer+=chunk;
        while(buffer.includes('\n\n')){const offset=buffer.indexOf('\n\n'), block=buffer.slice(0,offset);buffer=buffer.slice(offset+2);const data=block.split('\n').find(x=>x.startsWith('data: '));if(data)events.push(JSON.parse(data.slice(6)));}
        if(events.length===1)server.simulation.setParameters({coverLoad:0});
        if(events.length>=2){req.destroy();resolve();}
      });
    }); req.on('error',reject);
  });
  await closed; assert.equal(events[0].branches.aggie.passage,0); assert.equal(events[1].branches.aggie.passage,1); assert.ok(events[1].sequence>events[0].sequence);
});
test('SSE continues across repeated frames larger than the HTTP write buffer', {timeout:10000}, async t => {
  const simulation = createSimulation({maxFrames:1000}); simulation.control('play');
  for(let i=0;i<700;i++) simulation.tick(.1);
  const server = createServer({simulation,autoTick:false}); server.listen(0,'127.0.0.1'); await once(server,'listening'); t.after(()=>server.closeSimulation());
  const received = [];
  await new Promise((resolve,reject) => {
    const req = http.get('http://127.0.0.1:'+server.address().port+'/api/events',res => {
      let buffer = ''; res.setEncoding('utf8');
      res.on('end', () => { if(received.length<3) reject(new Error('Event stream disconnected during ordinary backpressure.')); });
      res.on('data',chunk => {
        buffer += chunk;
        while(buffer.includes('\n\n')) {
          const offset=buffer.indexOf('\n\n'), block=buffer.slice(0,offset); buffer=buffer.slice(offset+2);
          const line=block.split('\n').find(x=>x.startsWith('data: ')); if(!line)continue;
          assert.ok(Buffer.byteLength(block)>64*1024); received.push(JSON.parse(line.slice(6)));
          if(received.length===1) simulation.setParameters({coverLoad:0});
          if(received.length===2) simulation.control('step');
          if(received.length===3) { req.destroy(); resolve(); }
        }
      });
    }); req.on('error',reject);
  });
  assert.equal(received[1].branches.aggie.passage,1); assert.equal(received[2].elapsed,70.1);
  assert.ok(received[2].sequence>received[1].sequence);
});
test('host, origin, request-size, path and method restrictions are enforced',async t=>{
  const {url}=await start(t);
  assert.equal((await request(url+'/api/state',{headers:{Host:'hostile.example'}})).status,403);
  assert.equal((await post(url,'/api/parameters',{spin:.9},{Origin:'https://hostile.example'})).status,403);
  assert.equal((await post(url,'/api/parameters',{spin:.9},{'Sec-Fetch-Site':'cross-site'})).status,403);
  assert.equal((await fetch(url+'/api/parameters',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'})).status,415);
  assert.equal((await post(url,'/api/parameters',{padding:'x'.repeat(5000)})).status,413);
  assert.equal((await fetch(url+'/api/parameters',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
  assert.equal((await fetch(url+'/api/state',{method:'DELETE'})).status,405);
  assert.equal((await fetch(url+'/%2ehidden')).status,403);
  assert.equal((await fetch(url+'/%5c..%5cserver.cjs')).status,403);
  assert.equal((await fetch(url+'/server.cjs')).status,404);
  const terminal=await fetch(url+'/terminal/'); assert.equal(terminal.status,200); assert.ok((await terminal.text()).includes('GFM'));
});
