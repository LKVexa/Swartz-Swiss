'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),{createSession}=require('../backend/phase-session.js'),{buildReport}=require('../backend/observations.cjs'),{create}=require('../public/adaptive-scheduler.js');
const {createPhaseService}=require('../backend/phase-service.cjs');
function harness(){
 const workers=[];
 class LocalWorker{
  constructor(url){this.file=new URL(url).pathname.split('/').at(-1);this.listeners={};this.closed=false;this.timers=new Set();workers.push(this);const scope=this;
   this.context=vm.createContext({structuredClone,crypto:webcrypto,performance,TextEncoder,console,setTimeout(callback,delay){const timer=setTimeout(()=>{scope.timers.delete(timer);if(!scope.closed)callback();},delay);scope.timers.add(timer);return timer;},clearTimeout(timer){scope.timers.delete(timer);clearTimeout(timer);}});
   this.context.postMessage=message=>setImmediate(()=>{if(!scope.closed)for(const handler of scope.listeners.message||[])handler({data:structuredClone(message)});});
   this.context.addEventListener=(name,callback)=>{if(name==='message')scope.handler=callback;};
   this.context.importScripts=(...files)=>{for(const file of files)vm.runInContext(fs.readFileSync(path.join(ROOT,'public',file),'utf8'),scope.context,{filename:file});};
   vm.runInContext(fs.readFileSync(path.join(ROOT,'public',this.file),'utf8'),this.context,{filename:this.file});
  }
  addEventListener(name,handler){(this.listeners[name]??=[]).push(handler);}
  postMessage(message){setImmediate(()=>{if(this.closed)return;try{this.context.__input=JSON.stringify(message);vm.runInContext('globalThis.__delivered=JSON.parse(__input);',this.context);(this.handler||this.context.onmessage)({data:this.context.__delivered});}catch(error){for(const listener of this.listeners.error||[])listener({message:error.message});}});}
  terminate(){this.closed=true;for(const timer of this.timers)clearTimeout(timer);this.timers.clear();}
 }
 const context=vm.createContext({Worker:LocalWorker,URL,structuredClone,performance,setTimeout,clearTimeout,document:{currentScript:{src:'https://gfm.ja21.invalid/experiments/phase/public/local-backend.js'}},location:{href:'https://gfm.ja21.invalid/experiments/phase/public/index.html'},addEventListener(){}});
 vm.runInContext(fs.readFileSync(path.join(ROOT,'public/local-backend.js'),'utf8'),context);
 return {api:context.GFM_PHASE_LOCAL,workers,context};
}
function scientific(frame){const result=structuredClone(frame);for(const name of ['runId','software','engine','scheduler'])delete result[name];return result;}
test('offline three-worker console computes phase, branch, Kerr and observation data without fetch or server',async()=>{
 const {api,workers}=harness();try{
  await api.ready;assert.equal(workers.length,3);assert.equal((await api.request('/api/phase')).running,false);
  const node=createSession(),step=await api.request('/api/phase/control',{method:'POST',body:{action:'step'}});assert.deepEqual(scientific(step),scientific(node.control('step')));assert.equal(step.time,.05);
  const state=await api.request('/api/parameters',{method:'POST',body:{spin:.7,coverLoad:0}});assert.equal(state.branches.gaseous.passage,0);assert.equal(state.parameters.spin,.7);
  const deadline=Date.now()+5000;while((await api.request('/api/physics')).status!=='ready'){if(Date.now()>deadline)throw new Error('Actual Kerr calculation did not finish');await new Promise(resolve=>setTimeout(resolve,10));}
  const rays=await api.request('/api/physics-export.json');assert.equal(rays.inputs.spin,.7);assert.equal(rays.fullSolverResult.parameters.spin,.7);assert.equal(rays.fullSolverResult.trajectories.length,16);assert.ok(rays.fullSolverResult.diagnostics.acceptedSteps>0);assert.equal(rays.reproducibility.sameInputsBothBranches,true);
  const report=await api.request('/api/observations'),oracle=buildReport();assert.deepEqual(report,oracle);assert.equal(report.data.trainingRows,173);assert.equal(report.data.holdoutRows,146);assert.equal(report.comparisonPassed,false);
  const before=await api.request('/api/phase');await assert.rejects(api.request('/api/phase/parameters',{method:'POST',body:{resolution:17}}));assert.deepEqual(scientific(await api.request('/api/phase')),scientific(before));
 }finally{api.close();assert.ok(workers.every(worker=>worker.closed));}
});
test('maximum serial scheduler adds no artificial delay, retains .05 numerics and cancels on pause',()=>{
 let now=0,running=true,calls=0,cost=2,nextId=0;const timers=new Map(),steps=[];
 const scheduler=create({active:()=>running,work:dt=>{steps.push(dt);calls++;now+=cost;return calls;},clock:()=>now,setTimer:(callback,delay)=>{const id=++nextId;timers.set(id,{callback,delay});return id;},clearTimer:id=>timers.delete(id)});
 scheduler.sync();scheduler.sync();assert.equal(timers.size,1);
 function tick(){const [id,job]=timers.entries().next().value;timers.delete(id);now+=job.delay;job.callback();assert.ok(timers.size<=1);}
 tick();const fast=scheduler.metrics();assert.equal(fast.targetHz,0);assert.equal(fast.nextDelayMilliseconds,0);cost=120;for(let i=0;i<10;i++)tick();assert.equal(scheduler.metrics().nextDelayMilliseconds,0);assert.ok(scheduler.metrics().meanWorkMilliseconds>fast.meanWorkMilliseconds);assert.ok(steps.every(dt=>dt===.05));
 running=false;scheduler.sync();assert.equal(timers.size,0);const frozen=calls;now+=1000;assert.equal(calls,frozen);running=true;scheduler.sync();assert.equal(timers.size,1);scheduler.close();assert.equal(timers.size,0);
});
test('explicit illustration clock retains ten .1-second advances per wall second',()=>{
 let now=0,elapsed=0,nextId=0;const timers=new Map();const scheduler=create({targetHz:10,active:()=>elapsed<12,work:()=>{elapsed=Number((elapsed+.1).toFixed(9));now+=2;return elapsed;},clock:()=>now,setTimer:(callback,delay)=>{const id=++nextId;timers.set(id,{callback,delay});return id;},clearTimer:id=>timers.delete(id)});
 scheduler.sync();while(timers.size){const [id,job]=timers.entries().next().value;timers.delete(id);now+=job.delay;job.callback();}
 assert.equal(elapsed,12);assert.equal(scheduler.metrics().targetHz,10);assert.ok(now>=12000&&now<=12005);assert.equal(scheduler.metrics().pendingTimers,0);scheduler.close();
});
test('preserved Node phase transport ACKs fresh stream frames and freezes on pause without HTTP',async()=>{
 const sequences=[],service=createPhaseService({onUpdate:frame=>{if(Number.isInteger(frame.sequence))sequences.push(frame.sequence);}});
 try{
  await service.command('parameters',{parameters:{resolution:16}});await service.command('control',{action:'play'});
  await new Promise(resolve=>setTimeout(resolve,200));const paused=await service.command('control',{action:'pause'});
  assert.ok(paused.sequence>=3,'service receives multiple real evolved frames');assert.ok(new Set(sequences).size>=3);assert.equal(paused.running,false);
  await new Promise(resolve=>setTimeout(resolve,100));const frozen=service.snapshot();assert.equal(frozen.sequence,paused.sequence);assert.equal(frozen.time,paused.time);assert.deepEqual(frozen.fields,paused.fields);assert.equal(frozen.scheduler.pendingTimers,0);assert.equal(frozen.scheduler.pendingLatestFrames,0);
 }finally{await service.close();}
});
