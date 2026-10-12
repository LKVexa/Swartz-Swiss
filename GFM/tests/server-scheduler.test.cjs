'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const {Readable}=require('node:stream');

// Exercise the real HTTP handler and scheduler with a deterministic expensive
// solver. Its elapsed wall time does not change the requested physics interval.
function fixture({running=true,workMillis=125}={}) {
 const file=path.resolve(__dirname,'../server.cjs'),localRequire=createRequire(file);
 let now=0,nextId=0,timeSeconds=0,fail=false;
 const pending=new Map(),steps=[];
 const model={
   step(dt){steps.push(dt);now+=workMillis;if(fail)throw Error('Synthetic solver failure');timeSeconds+=dt;},
   snapshot(){return {timeSeconds,diagnostics:{},parameters:{}};}
 };
 const clock={
   setTimeout(callback,delay){const handle={id:++nextId,unref(){return this;}};pending.set(handle,{callback,due:now+delay});return handle;},
   clearTimeout(handle){pending.delete(handle);},
   advance(millis){
     const target=now+millis;
     while(true){
       const ready=[...pending].filter(([,item])=>item.due<=target).sort((a,b)=>a[1].due-b[1].due)[0];
       if(!ready)break;
       const [handle,item]=ready;pending.delete(handle);now=Math.max(now,item.due);item.callback();
     }
     now=Math.max(now,target);
   }
 };
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),{
   module,exports:module.exports,__dirname:path.dirname(file),Buffer,URL,console,
   require(name){return name==='./backend/cylinder-em.cjs'?{createModel:()=>model}:localRequire(name);},
   setTimeout:clock.setTimeout,clearTimeout:clock.clearTimeout
 },{filename:file});
 const server=module.exports.createServer({running});
 return {server,steps,clock,pending,get now(){return now;},fail(){fail=true;}};
}

function request(server,data) {
 return new Promise((resolve,reject)=>{
   const req=Readable.from([Buffer.from(JSON.stringify(data))]);
   req.method='POST';req.url='/api/control';req.headers={host:'127.0.0.1:8794'};
   const res={status:0,writeHead(status){this.status=status;},setHeader(){},end(bytes){
     try{resolve({status:this.status,body:JSON.parse(bytes)});}catch(error){reject(error);}
   }};
   server.emit('request',req,res);
 });
}
const close=server=>new Promise(resolve=>server.close(()=>resolve()));

test('slow calculations leave a full HTTP-control gap and preserve the physics interval',async()=>{
 const f=fixture();
 try{
   f.clock.advance(59);assert.equal(f.steps.length,0);
   f.clock.advance(1);assert.deepEqual(f.steps,[4e-11]);
   assert.equal(f.now,185,'60 ms wait plus 125 ms solver work');
   assert.equal(f.pending.size,1);
   assert.equal([...f.pending.values()][0].due-f.now,60,'next work starts after the completed calculation');
   const paused=await request(f.server,{action:'pause'});
   assert.equal(paused.status,200);assert.equal(paused.body.running,false);
   assert.equal(f.pending.size,0,'HTTP pause cancels pending background work');
   f.clock.advance(1000);assert.equal(f.steps.length,1);
   const stepped=await request(f.server,{stepSeconds:2e-11});
   assert.equal(stepped.status,200);assert.deepEqual(f.steps,[4e-11,2e-11]);
   assert.equal(stepped.body.running,false);assert.equal(f.pending.size,0);
 }finally{await close(f.server);}
});

test('repeated play creates one timer and closing never resurrects background work',async()=>{
 const f=fixture({running:false});
 assert.equal(f.pending.size,0);
 await request(f.server,{action:'play'});
 await request(f.server,{running:true});
 f.server.simulation.play();
 assert.equal(f.pending.size,1,'repeated play cannot queue duplicate calculations');
 await close(f.server);
 assert.equal(f.pending.size,0);assert.equal(f.server.simulation.envelope().running,false);
 f.server.simulation.play();f.clock.advance(1000);
 assert.equal(f.pending.size,0);assert.equal(f.steps.length,0);
 assert.equal(f.server.simulation.envelope().running,false);
});

test('solver failure pauses automatically and removes pending scheduled work',async()=>{
 const f=fixture();
 try{
   f.fail();f.clock.advance(60);
   assert.equal(f.steps.length,1);assert.equal(f.pending.size,0);
   const state=f.server.simulation.envelope();
   assert.equal(state.running,false);assert.equal(state.server.failure,'Synthetic solver failure');
   f.clock.advance(1000);assert.equal(f.steps.length,1);
 }finally{await close(f.server);}
});
