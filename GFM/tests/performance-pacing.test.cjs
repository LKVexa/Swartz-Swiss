'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {build}=require('../build-browser-backend.cjs');
const {createModel}=require('../backend/cylinder-em.cjs');
const {presetParameters}=require('../backend/research-presets.cjs');
const view=require('../public/app.js');
const bundle=build(),plain=x=>JSON.parse(JSON.stringify(x));

function workerHarness({costMs=1,fallback=false}={}){
 let id=0,key=0,clock=0;const timers=new Map(),messages=[];
 const context=vm.createContext({URL,TextEncoder,crypto:crypto.webcrypto,GFM_TRANSPORT:fallback?'browser-main-thread':'browser-worker',performance:{now(){const value=clock;clock+=costMs;return value;}},postMessage:m=>messages.push(plain(m)),setTimeout(fn,delay){const k=++key;timers.set(k,{fn,delay});return k;},clearTimeout:k=>timers.delete(k)});
 vm.runInContext(bundle.workerSource,context);
 function send(kind,data={}){const n=++id;context.onmessage({data:{id:n,kind,...data}});const i=messages.findIndex(x=>x.id===n);if(i<0)return null;const reply=messages.splice(i,1)[0];assert.equal(reply.ok,true,reply.error);return reply.data;}
 return {context,timers,messages,initialize:options=>send('initialize',{options}),request:(body)=>send('request',{path:'/api/control',method:'POST',body}),state:()=>send('request',{path:'/api/state'}),ack:sequence=>send('frame-ack',{sequence}),close:()=>send('close'),tick(){const [k,t]=timers.entries().next().value;timers.delete(k);t.fn();return t.delay;},events(){const events=messages.filter(x=>x.event==='frame');messages.splice(0,messages.length);return events;}};
}

test('adaptive pacing preserves exact physical-time and audited fields over twenty advances',()=>{
 const worker=workerHarness();worker.initialize({running:true,initialPreset:'covered-plasma'});
 const model=createModel(presetParameters('covered-plasma'));
 for(let i=0;i<20;i++){worker.tick();model.step(4e-11);assert.equal(worker.timers.size,1);}
 const frame=worker.state(),expected=model.snapshot();
 for(const key of Object.keys(expected))assert.deepEqual(plain(frame[key]),plain(expected[key]),key);
 assert.equal(frame.server.performance.advances,20);
 assert.equal(frame.server.performance.physicsIntervalSeconds,4e-11);
 assert.ok(frame.server.performance.physicsNanosecondsPerWallSecond>0);
 assert.ok(frame.diagnostics.relativeEnergyBalanceResidual<1e-8);worker.close();assert.equal(worker.timers.size,0);
});

test('slow solves have no timer backlog and portable execution yields for controls',()=>{
 for(const fallback of [false,true]){
  const worker=workerHarness({costMs:30,fallback});worker.initialize({running:true});worker.tick();
  assert.equal(worker.timers.size,1);assert.equal(worker.state().server.performance.schedulerDelayMs,fallback?4:0);
  worker.request({action:'pause'});const step=worker.state().stepCount;worker.tick();assert.equal(worker.state().stepCount,step);worker.close();
 }
});

test('streaming retains at most one outstanding frame while physics continues and acknowledges exact sequence',()=>{
 const worker=workerHarness();worker.initialize({running:true,stream:true});worker.tick();
 const first=worker.events();assert.equal(first.length,1);const firstTime=first[0].data.timeSeconds;
 worker.tick();worker.tick();assert.equal(worker.events().length,0);
 assert.ok(worker.state().timeSeconds>firstTime);assert.equal(worker.state().server.performance.outstandingStreamFrames,1);
 worker.ack(first[0].sequence+99);worker.tick();assert.equal(worker.events().length,0);
 worker.ack(first[0].sequence);worker.tick();const latest=worker.events();assert.equal(latest.length,1);assert.ok(latest[0].data.timeSeconds>firstTime);
 assert.equal(worker.state().server.performance.suppressedStreamFrames,3);worker.close();
});

test('render scheduling coalesces fifty changes into one latest paint and cancels safely',()=>{
 let next=0;const callbacks=new Map(),seen=[];
 const scheduler=view.createLatestFrameScheduler(fn=>{callbacks.set(++next,fn);return next;},id=>callbacks.delete(id));
 for(let i=0;i<50;i++)scheduler.schedule(()=>seen.push(i));
 assert.equal(callbacks.size,1);callbacks.values().next().value();assert.deepEqual(seen,[49]);assert.equal(scheduler.stats.coalesced,49);
 scheduler.schedule(()=>seen.push(50));scheduler.cancel();assert.equal(callbacks.size,1,'Only the already-executed test callback remains');assert.deepEqual(seen,[49]);
});

test('camera redraw reuses GPU uploads and geometry update reuses arrays and storage',()=>{
 let id=0,bound;const buffers=new Map(),attributes=new Map(),calls={data:0,sub:0,deleted:0};
 const gl={ARRAY_BUFFER:1,DYNAMIC_DRAW:2,FLOAT:3,createBuffer:()=>++id,bindBuffer:(_t,b)=>bound=b,bufferData:(_t,a)=>{calls.data++;buffers.set(bound,Array.from(a));},bufferSubData:(_t,o,a)=>{assert.equal(o,0);calls.sub++;buffers.set(bound,Array.from(a));},vertexAttribPointer:a=>attributes.set(a,bound),enableVertexAttribArray(){},deleteBuffer:b=>{calls.deleted++;buffers.delete(b);}};
 const stats={},cache=view.createGpuMeshCache(gl,stats),mesh={p:[0,1,2,3,4,5],c:[1,0,0,0,1,0],n:[0,1,0,0,1,0]};
 cache.bind(mesh,0,[0,1,2]);assert.equal(calls.data,3);assert.equal(stats.typedArrayAllocations,3);
 for(let i=0;i<60;i++)cache.bind(mesh,0,[0,1,2]);assert.equal(stats.gpuUploads,3);assert.equal(stats.typedArrayAllocations,3);
 const next={...mesh,p:mesh.p.map(x=>x+.25)};cache.bind(next,0,[0,1,2]);assert.equal(calls.sub,3);assert.equal(calls.data,3);assert.equal(stats.typedArrayAllocations,3);
 assert.deepEqual(buffers.get(attributes.get(0)),next.p);cache.clear();assert.equal(calls.deleted,3);assert.equal(buffers.size,0);
});

test('transport delivers only the latest streamed frame at paint and releases worker acknowledgement',async()=>{
 let key=0;const callbacks=new Map(),sent=[];let backend;
 const worker={postMessage(message){sent.push(message);if(message.kind==='initialize')queueMicrotask(()=>worker.onmessage({data:{id:message.id,ok:true,data:{schema:'GFM-cylindrical-frame/2',runId:'run',timeSeconds:0}}}));},terminate(){}};
 const context=vm.createContext({URL,TextEncoder,crypto:crypto.webcrypto,setTimeout,clearTimeout,requestAnimationFrame(fn){callbacks.set(++key,fn);return key;},cancelAnimationFrame:id=>callbacks.delete(id)});
 vm.runInContext(bundle.browserSource,context);backend=new context.GFMPreviewBackend({worker});await backend.ready;
 const received=[];backend.subscribe(message=>received.push(message));
 for(let i=1;i<=30;i++)worker.onmessage({data:{event:'frame',sequence:i,data:{runId:'run',timeSeconds:i*4e-11}}});
 assert.equal(callbacks.size,1);assert.equal(backend.performance.maximumQueuedFrames,1);assert.equal(backend.performance.coalescedFrames,29);
 const [id,callback]=callbacks.entries().next().value;callbacks.delete(id);callback();assert.equal(received.length,1);assert.equal(received[0].sequence,30);
 assert.equal(sent.filter(x=>x.kind==='frame-ack').length,30);assert.equal(backend.performance.streamFramesDelivered,1);backend.close();assert.equal(backend.pending.size,0);
});

test('authoritative reset reply discards a delayed old-run frame without restoring stale fields',async()=>{
 let paint;const worker={postMessage(message){if(message.kind==='initialize')queueMicrotask(()=>worker.onmessage({data:{id:message.id,ok:true,data:{schema:'GFM-cylindrical-frame/2',runId:'old',timeSeconds:0}}}));else if(message.kind==='request')queueMicrotask(()=>worker.onmessage({data:{id:message.id,ok:true,data:{schema:'GFM-cylindrical-frame/2',runId:'new',timeSeconds:0}}}));},terminate(){}};
 const context=vm.createContext({URL,TextEncoder,setTimeout,clearTimeout,requestAnimationFrame:fn=>{paint=fn;return 1;},cancelAnimationFrame(){}});vm.runInContext(bundle.browserSource,context);
 const backend=new context.GFMPreviewBackend({worker});await backend.ready;const frames=[];backend.subscribe(m=>frames.push(m));worker.onmessage({data:{event:'frame',sequence:1,data:{runId:'old',timeSeconds:1e-9}}});
 await backend.request('/api/reset',{method:'POST',body:'{}'});paint();assert.equal(frames.length,0);assert.equal(backend.lastFrame.runId,'new');backend.close();
});
